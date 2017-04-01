'use strict';

var _ = require('lodash');
var moment = require('moment');
var async = require('async');

function searchEvents (args, callback) {
  var seneca = this;
  var eventsEntity = seneca.make$('cd/events');
  var plugin = args.role;
  var query = args.query || {};
  var filterPastEvents = query.filterPastEvents || false;
  delete query.filterPastEvents;
  var events = [];
  var utcOffset = moment().utcOffset();

  eventsEntity.list$(query, function (err, response) {
    if (err) return callback(err);
    if (filterPastEvents) {
      _.each(response, function (event) {
        if (event && event.dates) {
          if (event.type === 'recurring') {
            var dateOfLastEventRecurrence = _.last(event.dates).startTime;
            // 2016-01-25 UCE: Nasty temp hack until we sort out timezones
            if (moment.utc(dateOfLastEventRecurrence).subtract(utcOffset, 'minutes').diff(moment.utc(), 'minutes') > -480) {
              events.push(event);
            }
          } else {
            var oneOffEventDate = _.first(event.dates).startTime;
            // 2016-01-25 UCE: Nasty temp hack until we sort out timezones
            if (moment.utc(oneOffEventDate).subtract(utcOffset, 'minutes').diff(moment.utc(), 'minutes') > -480) {
              events.push(event);
            }
          }
        }
      });
    } else {
      events = response;
    }
    async.each(events, function (event, cb) {
      seneca.act({role: plugin, cmd: 'searchSessions', query: {eventId: event.id, status: 'active'}}, function (err, sessions) {
        if (err) return cb(err);
        event.sessions = sessions;
        return cb();
      });
    }, function (err) {
      if (err) return callback(err);
      return callback(null, events);
    });
  });
}

module.exports = searchEvents;
