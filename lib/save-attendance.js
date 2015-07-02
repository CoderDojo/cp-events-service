'use strict'

function saveAttendance(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/attendance';

  var attendance = args.attendance;
  var attendanceEntity = seneca.make$(ENTITY_NS);

  attendanceEntity.save$(attendance, function (err, response) {
    if(err) return callback(null, {error: err});
    return callback(null, response);
  });
}

module.exports = saveAttendance;