'use strict';

var fs = require('fs');
var async = require('async');

function exportGuestListExcel (args, callback) {
  var seneca = this;
  var eventId = args.eventId; 
  var plugin = args.role;

  async.waterfall([
    retrieveUserData,
    convertToExcel
  ], function (err, csv) {
    if (err) return callback(null, {error: err});
    return callback(null, {
      data: csv
    });
  });

  function retrieveUserData (done) {
    seneca.act({role: plugin, cmd: 'searchApplications', query: {eventId: eventId, status: 'approved', deleted: false}}, function (err, applications) {
      if (err) return callback(err);
      async.map(applications, function (application, cb) {
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
            return cb(null, user);
          });
        });
      }, function (err, data) {
        if (err) return callback(null, {error: err});
        return done(null, data);
      });
    });
  }

  function convertToExcel (data, done) {
    var writeStream = fs.createWriteStream("guestlist.xls");
    
    var header = ['Session', 'Name', 'Phone', 'Email', 'Ticket Name', 'Ticket Type'].join('\t')  +"\n";
    writeStream.write(header);
    
    // todo convert given data to rows
    // var row1 = "0"+"\t"+" 21"+"\t"+"Rob"+"\n";
    // writeStream.write(row1);
    
    writeStream.close();
  }
}

module.exports = exportGuestListExcel;
