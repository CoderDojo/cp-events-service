'use strict';

function searchAttendance (args, callback) {
  var seneca = this;
  var attendanceEntity = seneca.make$('cd/attendance');
  var query = args.query;

  attendanceEntity.list$(query, callback);
}

module.exports = searchAttendance;
