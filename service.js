process.setMaxListeners(0);
const events = require('events');

events.EventEmitter.prototype._maxListeners = 100; // eslint-disable-line no-underscore-dangle
if (process.env.NEW_RELIC_ENABLED === 'true') require('newrelic'); // eslint-disable-line global-require

const config = require('./config/config.js')();
const seneca = require('seneca')(config);
const util = require('util');
const _ = require('lodash');
const dgram = require('dgram');
const store = require('seneca-postgresql-store');
const network = require('./network');
const sanitizeHtml = require('sanitize-html');

const service = 'cp-events-service';
const log = require('cp-logs-lib')({ name: service, level: 'warn' });

config.log = log.log;

console.log('using config', JSON.stringify(config, null, 2));
seneca.options(config);
/**
 * TextArea fields contains user generated html.
 * We'd like to sanitize it to strip out script tags and other bad things.
 * See https://github.com/punkave/sanitize-html#what-are-the-default-options for a list
 * sanitizeHtml's default settings.
 */
seneca.options.sanitizeTextArea = {
  allowedTags      : sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: _.assign({}, sanitizeHtml.defaults.allowedAttributes, {
    /**
     * Allowing everything here since within ckeditor you have the option of setting the following:
     *
     *   * styles such as border, width, and height.
     *   * alt text
     *
     * However ng-bind-html strips the style tag, so you won't actually see custom styling.
     */
    img: ['*'],
  }),
};
seneca.decorate('customValidatorLogFormatter', require('./lib/custom-validator-log-formatter'));

seneca.use(store, config.postgresql);
seneca.use(require('seneca-entity'));
seneca.use(require('./lib/cd-events'), { logger: log.logger });
seneca.use(require('cp-permissions-plugin'), {
  config: `${__dirname}/config/permissions`,
});

seneca.use(require('seneca-queue'));
seneca.use(require('seneca-kue'));
seneca.use(require('./lib/queues'), { config: config.kue });

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', shutdown);

function shutdown(err) {
  const stopQueue = seneca.export('queues/queue').stopQueue;
  stopQueue();
  if (!_.isUndefined(err) && !_.isUndefined(err.stack)) {
    console.error(`${new Date().toString()} FATAL: UncaughtException, please report: ${util.inspect(err)}`);
    console.error(util.inspect(err.stack));
    console.trace();
  }
  process.exit(0);
}

require('./migrate-psql-db.js')(err => {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
  console.log('Migrations ok');

  network(seneca);

  seneca.ready(err => {
    if (err) return shutdown(err);
    const message = new Buffer(service);
    const client = dgram.createSocket('udp4');
    client.send(message, 0, message.length, 11404, 'localhost', err => {
      if (err) return shutdown(err);
      client.close();
    });

    ['load', 'list'].forEach(cmd => {
      seneca.wrap(`role: entity, cmd: ${cmd}`, function filterFields(args, cb) {
        try {
          ['limit$', 'skip$'].forEach(field => {
            if (args.q[field] && args.q[field] !== 'NULL' && !/^[0-9]+$/g.test(`${args.q[field]}`)) {
              throw new Error('Expect limit$, skip$ to be a number');
            }
          });
          if (args.q.sort$) {
            if (args.q.sort$ && typeof args.q.sort$ === 'object') {
              const order = args.q.sort$;
              _.each(order, (ascdesc, column) => {
                if (!/^[a-zA-Z0-9_]+$/g.test(column)) {
                  throw new Error('Unexpect characters in sort$');
                }
              });
            } else {
              throw new Error('Expect sort$ to be an object');
            }
          } this.prior(args, cb);
        } catch (err) {
          // cb to avoid seneca-transport to hang while waiting for timeout error
          return cb(err);
        }
      });
    });
  });
});
