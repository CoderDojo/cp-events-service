'use strict';

var _ = require('lodash');
var moment = require('moment');
var async = require('async');

function searchEvents(args, callback) {
  var seneca = this;
  var eventsEntity = seneca.make$('cd/events');
  var plugin = args.role;
  var query = args.query || {};
  var filterPastEvents = query.filterPastEvents || false;
  delete query.filterPastEvents;
  var events = [];
  
  eventsEntity.list$(query, function (err, response) {
    if(err) return callback(err);
    if(filterPastEvents) {
      _.each(response, function (event) {
        if(_.last(event.dates) >= new Date()) {
          events.push(event);
        }
      });
    } else {
      events = response;
    }

    //Load event sessions/rooms.
    async.each(events, function (event, cb) {
      seneca.act({role: plugin, cmd: 'searchSessions', query: {eventId: event.id}}, function (err, sessions) {
        if(err) return cb(err);
        event.sessions = sessions;
        return cb();
      });
    }, function (err) {
      if(err) return callback(err);
      return callback(null, events); 
    });
  });
}

module.exports = searchEvents;