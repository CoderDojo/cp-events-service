'use strict'

var async = require('async');
var _ = require('lodash');

function bulkApplyApplications(args, callback) {
  var seneca = this;
  var plugin = args.role;

  var applications = args.applications;
  if(!applications) return callback(null, {error: 'args.applications is empty'});

  async.each(applications, function (application, cb) {
    seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
      if(err) return cb(err);
      if(_.isEmpty(profiles)) return cb();
      var userProfile = profiles[0];
      application.name = userProfile.name;
      application.dateOfBirth = userProfile.dob;
      application.status = 'pending';
      seneca.act({role: plugin, cmd: 'saveApplication', application: application}, cb);
    });
  }, callback);
}

module.exports = bulkApplyApplications;