'use strict';

if (process.env.NEW_RELIC_ENABLED === 'true') require('newrelic');

var config = require('./config/config.js')();
var seneca = require('seneca')(config);
var store = require('seneca-postgresql-store');

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);

seneca.use(store, config['postgresql-store']);
seneca.use(require('./lib/cd-events'));

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
