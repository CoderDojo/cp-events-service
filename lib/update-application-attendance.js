'use strict';

var _ = require('lodash');
var moment = require('moment');

function updateApplicationAttendance (args, callback) {
  var seneca = this;
  var data = args.data;
  var plugin = args.role;

  if (_.isEmpty(data)) return callback(null, {error: 'args.data is empty'});
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
    seneca.act({role: plugin, cmd: 'saveApplication', application: application}, function (err) {
      if (err) return callback(null, {ok: false, why: err.message});
      return callback(null, {ok: true});
    });
  });
}
module.exports = updateApplicationAttendance;
