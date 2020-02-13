'use strict';

var json2csv = require('json2csv');
var async = require('async');

function exportGuestList (args, callback) {
  var seneca = this;
  var eventId = args.eventId;
  var status = args.status;
  var csvFields = ['Session', 'Name', 'Phone', 'Email', 'Ticket Name', 'Ticket Type', 'Status'];
  var plugin = args.role;

  async.waterfall([
    retrieveUserData,
    convertToCSV
  ], function (err, csv) {
    if (err) return callback(null, {error: err});
    return callback(null, {
      data: csv
    });
  });

  function retrieveUserData (done) {
    // Default is to return all (guests and those waiting)
    var searchQuery = {eventId: eventId, deleted: false};
    if(status === 'waiting') {
        searchQuery.status = 'pending';
    }
    else if(status === 'guests'){
        searchQuery.status = 'approved';
    }
    seneca.act({role: plugin, cmd: 'searchApplications', query: searchQuery}, function (err, applications) {
      if (err) return callback(err);
      async.mapSeries(applications, function (application, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
          if (err) return cb(err);
          var userProfile = profiles[0];
          seneca.act({role: plugin, cmd: 'loadSession', id: application.sessionId}, function (err, session) {
            if (err) return cb(err);
            var user = {};
            user['Session'] = session.name;
            user['Name'] = userProfile.name;
            user['Phone'] = userProfile.phone || '';
            user['Email'] = userProfile.email || '';
            user['Ticket Name'] = application.ticketName;
            user['Ticket Type'] = application.ticketType;

            user['Status'] = application.status;
            if(application.status === 'pending') {
                user['Status'] = 'waiting';
            }
            return cb(null, user);
          });
        });
      }, function (err, csvData) {
        if (err) return callback(null, {error: err});
        return done(null, csvData);
      });
    });
  }

  function convertToCSV (csvData, done) {
    json2csv({data: csvData, fields: csvFields}, done);
  }
}

module.exports = exportGuestList;
