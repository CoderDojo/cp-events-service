'use strict';

var _ = require('lodash');
var moment = require('moment');

function searchEvents(args, callback) {
  var seneca = this;
  var eventsEntity = seneca.make$('cd/events');
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
    return callback(null, events);
  });
}

module.exports = searchEvents;