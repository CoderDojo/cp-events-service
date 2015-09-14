'use strict'

var async = require('async');

function saveAttendance(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/attendance';
  var attendance = args.attendance;
  var attendanceEntity = seneca.make$(ENTITY_NS);

  async.waterfall([
    checkForExistingAttendanceRecord,
    saveAttendanceRecord
  ], function (err, res) {
    if(err) return callback(null, {error: err});
    return callback(null, res);
  });

  function checkForExistingAttendanceRecord(done) {
    if(attendance.id) return done();
    attendanceEntity.list$({userId: attendance.userId, eventId: attendance.eventId, eventDate: attendance.eventDate}, function (err, response) {
      if(err) return done(err);
      if(response.length > 0) return done(new Error('Attendance record already exists'));
      return done();
    });
  }

  function saveAttendanceRecord(done) {
    attendanceEntity.save$(attendance, function (err, response) {
      if(err) return done(err);
      return done(null, response);
    }); 
  }
  
}

module.exports = saveAttendance;