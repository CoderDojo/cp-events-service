'use strict';

if (process.env.NEW_RELIC_ENABLED === 'true') require('newrelic');

var config = require('./config/config.js')();
var seneca = require('seneca')(config);
var util = require('util');
var store = require('seneca-postgresql-store');
var log = require('cp-logs-lib')({name: 'cp-events-service', level: 'warn'});
config.log = log.log;

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);

seneca.use(store, config['postgresql-store']);
seneca.use(require('./lib/cd-events'), {logger: log.logger});
seneca.use(require('cp-permissions-plugin'), {
  config: __dirname + '/config/permissions'
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', shutdown);

function shutdown (err) {
  if (err !== void 0 && err.stack !== void 0) {
    console.error(new Date().toString() + ' FATAL: UncaughtException, please report: ' + util.inspect(err));
    console.error(util.inspect(err.stack));
    console.trace();
  }
  process.exit(0);
}

require('./migrate-psql-db.js')(function (err) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
  console.log('Migrations ok');

  seneca.listen()
    .client({type: 'web', port: 10305, pin: {role: 'cd-badges', cmd: '*'}})
    .client({type: 'web', port: 10301, pin: 'role:cd-dojos,cmd:*'})
    .client({type: 'web', port: 10303, pin: 'role:cd-users,cmd:*'})
    .client({type: 'web', port: 10303, pin: 'role:cd-profiles,cmd:*'});
});
