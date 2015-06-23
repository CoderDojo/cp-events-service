'use strict';

var async = require('async');


function saveEvent(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';
  var eventEntity = seneca.make$(ENTITY_NS);

  var eventInfo = args.eventInfo;

  var data = {
    address: eventInfo.address,
    capacity: eventInfo.capacity,
    city: eventInfo.city,
    country: eventInfo.country,
    created_at: new Date(),
    created_by: eventInfo.userId,
    date: eventInfo.date,
    description: eventInfo.description,
    dojo_id: eventInfo.dojoId,
    invites: eventInfo.invites,
    name: eventInfo.name,
    position: eventInfo.position,
    public: eventInfo.public,
    status: eventInfo.status,
    user_types: eventInfo.userTypes
  };


  if (eventInfo.id) {
    data.id = eventInfo.id;
  }


  if (eventInfo.type === 'recurring') {
    if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
      var err = new Error('Dates must be specified for recurring events');
      return callback(err);
    }

    async.each(eventInfo.dates, function(date, cb) {
      // Override date
      data.date = date;

      eventEntity.save$(data, function(err, eventData) {
        if (err) {
          return cb(err);
        }

        cb(null, eventData);
      });
    }, function(err, results) {
      if (err) {
        return callback(err);
      }

      callback(results);
    });
  }


  eventEntity.save$(data, function(err, eventData) {
    if (err) {
      return callback(err);
    }

    callback(null, eventData);
  });
}

module.exports = saveEvent;

