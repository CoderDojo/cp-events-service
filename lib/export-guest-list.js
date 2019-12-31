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
    format,
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
          if (err) return callback(err);
          var userProfile = profiles[0];
          if (!userProfile.email || userProfile.email.trim().length === 0) {
            application.userProfile = userProfile;
            seneca.act({ role: 'cd-profiles', cmd: 'load_parents_for_user', userId: userProfile.userId, user: args.user }, function (err, parentProfile) {
              if (err) callback(err);
              const firstParent = parentProfile[0];
              application.userProfile.email = firstParent.email;
              application.userProfile.phone = application.userProfile.phone || firstParent.phone;
              cb(null, application);
            });
          } else {
            cb(null, application);
          }
        });
      }, function (err, rows) {
        if (err) return callback(null, {error: err});
        return done(null, rows);
      });
    });
  }

  function format(applications, done) {
    async.mapSeries(applications, function (application, cb) {
      seneca.act({role: plugin, cmd: 'loadSession', id: application.sessionId}, function (err, session) {
        if (err) return callback(err);
        var user = {};
        user['Session'] = session.name;
        user['Name'] = application.userProfile.name;
        user['Phone'] = application.userProfile.phone || '';
        user['Email'] = application.userProfile.email || '';
        user['Ticket Name'] = application.ticketName;
        user['Ticket Type'] = application.ticketType;

        user['Status'] = application.status;
        if(application.status === 'pending') {
            user['Status'] = 'waiting';
        }
        cb(null, user);
     })
    }, function (err, rows) {
      json2csv({data: rows, fields: csvFields}, done);
    });
  }
}

module.exports = exportGuestList;
