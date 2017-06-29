'use strict';

const postgrator = require('postgrator');
const config = require('./config/config.js')();

module.exports = function migrate(cb) {
  postgrator.setConfig({
    migrationDirectory: './scripts/database/pg/migrations',
    driver            : 'pg',
    host              : config.postgresql.host,
    database          : config.postgresql.name,
    username          : config.postgresql.username,
    password          : config.postgresql.password,
    newline           : 'LF',
  });

  postgrator.migrate('max', (err, migrations) => {
    postgrator.endConnection(() => {
      return cb(err, migrations);
    });
  });
};
