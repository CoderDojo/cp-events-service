'use strict';

const json2csv = require('json2csv');
const async = require('async');

function exportGuestList(args, callback) {
  const seneca = this;
  const eventId = args.eventId;
  const status = args.status;
  const csvFields = ['Session', 'Name', 'Phone', 'Email', 'Ticket Name', 'Ticket Type', 'Status'];
  const plugin = args.role;

  async.waterfall([retrieveUserData, convertToCSV], (err, csv) => {
    if (err) return callback(null, { error: err });
    return callback(null, {
      data: csv,
    });
  });

  function retrieveUserData(done) {
    // Default is to return all (guests and those waiting)
    const searchQuery = { eventId, deleted: false };
    if (status === 'waiting') {
      searchQuery.status = 'pending';
    } else if (status === 'guests') {
      searchQuery.status = 'approved';
    }
    seneca.act({ role: plugin, cmd: 'searchApplications', query: searchQuery }, (err, applications) => {
      if (err) return callback(err);
      async.mapSeries(
        applications,
        (application, cb) => {
          seneca.act(
            {
              role : 'cd-profiles',
              cmd  : 'list',
              query: { userId: application.userId },
            },
            (err, profiles) => {
              if (err) return cb(err);
              const userProfile = profiles[0];
              seneca.act(
                {
                  role: plugin,
                  cmd : 'loadSession',
                  id  : application.sessionId,
                },
                (err, { name }) => {
                  if (err) return cb(err);
                  const user = {};
                  user['Session'] = name;
                  user['Name'] = userProfile.name;
                  user['Phone'] = userProfile.phone || '';
                  user['Email'] = userProfile.email || '';
                  user['Ticket Name'] = application.ticketName;
                  user['Ticket Type'] = application.ticketType;
                  user['Status'] = application.status;
                  if (application.status === 'pending') {
                    user['Status'] = 'waiting';
                  }
                  return cb(null, user);
                }
              );
            }
          );
        },
        (err, csvData) => {
          if (err) return callback(null, { error: err });
          return done(null, csvData);
        }
      );
    });
  }

  function convertToCSV(csvData, done) {
    json2csv({ data: csvData, fields: csvFields }, done);
  }
}

module.exports = exportGuestList;
