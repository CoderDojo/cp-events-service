'use strict';

var async = require('async');

function bulkUpdateApplications (args, callback) {
  var seneca = this;
  var plugin = args.role;

  async.each(args.applications, function (application, cb) {
    seneca.act({role: plugin, cmd: 'updateApplication', application: application, user: args.user}, cb);
  }, callback);
}

module.exports = bulkUpdateApplications;

