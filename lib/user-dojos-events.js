'use strict';

var async = require('async');

function userDojosEvents (args, callback) {
  var seneca = this;
  var plugin = args.role;

  var query = args.query || {};
  if (!query.limit$) query.limit$ = 'NULL';

  var filterPastEvents = query.filterPastEvents || false;

  async.waterfall([
    loadUserDojos,
    loadDojosEvents
  ], callback);

  function loadUserDojos (done) {
    seneca.act({role: 'cd-dojos', cmd: 'dojos_for_user', id: args.user.id},
    function (err, dojos) {
      if (err) return callback(err);
      return done(null, dojos);
    });
  }

  function loadDojosEvents (dojos, done) {
    var events = [];
    if (dojos && dojos.length > 0) {
      // load Events for each dojo
      async.eachSeries(dojos, function (dojo, cb) {
        query.dojoId = dojo.id;
        query.filterPastEvents = filterPastEvents;
        seneca.act({role: plugin, cmd: 'searchEvents', query: query}, function (err, response) {
          if (err) return cb(err);
          var dojoEvents = {
            dojo: dojo,
            events: response
          };
          events.push(dojoEvents);
          return cb(null, response);
        });
      }, function (err, res) {
        if (err) return done(null, {error: err.message});
        return done(null, events);
      });
    } else {
      return done(null, events);
    }
  }
}

module.exports = userDojosEvents;
