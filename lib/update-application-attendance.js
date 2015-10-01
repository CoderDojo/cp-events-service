'use strict';

var _ = require('lodash');
var async = require('async');
var moment = require('moment');

function updateApplicationAttendance (args, callback) {
  var seneca = this;
  var data = args.data;
  var user = args.user;
  var plugin = args.role;

  if (_.isEmpty(data)) return callback(null, {error: 'args.data is empty'});
  async.series([
    validateRequest,
    updateAttendance
  ], function (err) {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, {ok: true});
  });

  function validateRequest (done) {
    seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query: {userId: user.id, dojoId: data.dojoId}}, function (err, usersDojos) {
      if (err) return done(err);
      var userDojo = usersDojos[0];
      var isTicketingAdmin = _.find(userDojo.userPermissions, function (userPermission) {
        return userPermission.name === 'ticketing-admin';
      });
      if (!isTicketingAdmin) return done(new Error('You must be a ticketing admin of this Dojo to update attendance records.'));
      return done();
    });
  }

  function updateAttendance (done) {
    var date = moment.utc(data.date, 'Do MMMM YY').toISOString();
    seneca.act({role: plugin, cmd: 'loadApplication', id: data.applicationId}, function (err, application) {
      if (err) return done(err);
      if (data.attended) {
        if (!application.attendance) application.attendance = [];
        application.attendance.push(date);
      } else {
        application.attendance = _.without(application.attendance, _.find(application.attendance, function (attendance) {
          var attendanceDate = moment(attendance);
          return attendanceDate.diff(moment(date)) === 0;
        }));
      }
      seneca.act({role: plugin, cmd: 'saveApplication', application: application}, done);
    });
  }
}
module.exports = updateApplicationAttendance;
