const config = require('../../config/config.js')({ port: 11306 });
const seneca = require('seneca')(config);

const service = 'cp-events-test';
const dgram = require('dgram');
seneca.use(require('./insert-test-events'));
seneca.use(require('seneca-entity'));

seneca.ready(() => {
  const message = new Buffer(service);
  const client = dgram.createSocket('udp4');
  client.send(message, 0, message.length, 11404, 'localhost', () => client.close());
  seneca.add({ role: service, cmd: 'suicide' }, (err, cb) => {
    seneca.close(err => process.exit(err ? 1 : 0));
    cb();
  });
});

require('../../network.js')(seneca);
// Add "its" µs as a dependency
seneca.client({
  type: 'web',
  host: process.env.CD_EVENTS || 'localhost',
  port: 10306,
  pin : { role: 'cd-events', cmd: '*' },
});
