'use strict';

var _ = require('lodash');
var moment = require('moment');
var json2csv = require('json2csv');
var async = require('async');

function exportGuestList(args, callback) {
  var seneca = this;
  var eventId = args.eventId;
  var csvFields = ['name', 'phone', 'email'];
  var plugin = args.role;

  async.waterfall([
    retrieveUserData,
    convertToCSV
  ], function(err, csv) {
    if(err) return callback(null, {error: err});
    return callback(null, {
      data: csv
    });
  });

  function retrieveUserData(done) {
    var csvData = [];
    seneca.act({role: plugin, cmd: 'searchAttendance', query:{eventId: eventId}}, function (err, attendanceRecords) {
      if(err) return callback(err);
      var user = {};
      async.each(attendanceRecords, function (attendance, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: attendance.userId}}, function (err, profiles) {
          if(err) return cb(err);
          var userProfile = profiles[0];
          user.name = userProfile.name;
          user.phone = userProfile.phone;
          user.email = userProfile.email;
          csvData.push(user);
          return cb();
        });
      }, function (err) {
        if(err) return callback(null, {error: err});
        return done(null, csvData);
      }); 
    });
  }

  function convertToCSV(csvData, done) {
    json2csv({ data: csvData, fields: csvFields }, done);
  }
}

module.exports = exportGuestList;