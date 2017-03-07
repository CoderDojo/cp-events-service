'use strict';

var _ = require('lodash');
var moment = require('moment');

function updateApplicationAttendance (args, callback) {
  var seneca = this;
  var data = args.data;
  var plugin = args.role;

  if (_.isEmpty(data)) return callback(null, {error: 'args.data is empty'});
  if (!data.date || !moment(data.date).isValid()) return callback(null, {error: 'date is empty or not valid'});
  seneca.act({role: plugin, cmd: 'loadApplication', id: data.applicationId}, function (err, application) {
    if (err) return done(err);
    if (data.attended) {
      if (!application.attendance) application.attendance = [];
      application.attendance.push(data.date);
    } else {
      application.attendance = _.without(application.attendance, _.find(application.attendance, function (attendance) {
        var attendanceDate = moment(attendance);
        return attendanceDate.diff(moment(data.date)) === 0;
      }));
    }
    seneca.act({role: plugin, cmd: 'saveApplication', application: application}, function (err) {
      if (err) return callback(null, {ok: false, why: err.message});
      return callback(null, {ok: true});
    });
  });
}
module.exports = updateApplicationAttendance;
