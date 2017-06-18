'use strict';

const _ = require('lodash');
const moment = require('moment');
const async = require('async');

function searchEvents (args, callback) {
  const seneca = this;
  const eventsEntity = seneca.make$('cd/events');
  const plugin = args.role;
  const query = args.query || {};
  const filterPastEvents = query.filterPastEvents || false;
  delete query.filterPastEvents;
  let events = [];
  const utcOffset = moment().utcOffset();

  eventsEntity.list$(query, (err, response) => {
    if (err) return callback(err);
    if (filterPastEvents) {
      _.each(response, (event) => {
        if (event && event.dates) {
          if (event.type === 'recurring') {
            const dateOfLastEventRecurrence = _.last(event.dates).startTime;
            // 2016-01-25 UCE: Nasty temp hack until we sort out timezones
            if (moment.utc(dateOfLastEventRecurrence).subtract(utcOffset, 'minutes').diff(moment.utc(), 'minutes') > -480) {
              events.push(event);
            }
          } else {
            const oneOffEventDate = _.first(event.dates).startTime;
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

    async.each(events, (event, cb) => {
      seneca.act({role: plugin, cmd: 'searchSessions', query: {eventId: event.id, status: 'active'}}, (err, sessions) => {
        if (err) return cb(err);
        event.sessions = sessions;
        return cb();
      });
    }, (err) => {
      if (err) return callback(err);
      return callback(null, events);
    });
  });
}

module.exports = searchEvents;
