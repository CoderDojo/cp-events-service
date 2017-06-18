'use strict';
const postgrator = require('postgrator');
const config = require('./config/config.js')();

module.exports = function migrate (cb) {
  postgrator.setConfig({
    migrationDirectory: './scripts/database/pg/migrations',
    driver            : 'pg',
    host              : config['postgresql-store'].host,
    database          : config['postgresql-store'].name,
    username          : config['postgresql-store'].username,
    password          : config['postgresql-store'].password,
    newline           : 'LF',
  });

  postgrator.migrate('max', (err, migrations) => {
    postgrator.endConnection(() => {
      return cb(err, migrations);
    });
  });
};
