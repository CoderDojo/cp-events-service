'use strict';

const _ = require('lodash');
const moment = require('moment');

function updateApplicationAttendance (args, callback) {
  const seneca = this;
  const data = args.data;
  const plugin = args.role;

  if (_.isEmpty(data)) return callback(null, {error: 'args.data is empty'});
  if (!data.date || !moment(data.date).isValid()) return callback(null, {error: 'date is empty or not valid'});
  seneca.act({role: plugin, cmd: 'loadApplication', id: data.applicationId}, (err, application) => {
    if (err) return callback(err);
    if (data.attended) {
      if (!application.attendance) application.attendance = [];
      application.attendance.push(data.date);
    } else {
      application.attendance = _.without(application.attendance, _.find(application.attendance, (attendance) => {
        const attendanceDate = moment(attendance);
        return attendanceDate.diff(moment(data.date)) === 0;
      }));
    }
    seneca.act({role: plugin, cmd: 'saveApplication', application: application}, (err) => {
      if (err) return callback(null, {ok: false, why: err.message});
      return callback(null, {ok: true});
    });
  });
}
module.exports = updateApplicationAttendance;
