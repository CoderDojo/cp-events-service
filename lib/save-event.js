'use strict'

function saveEvent(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';

  var eventInfo = args.eventInfo;

  var newEvent = {
    address: eventInfo.address,
    capacity: eventInfo.capacity,
    city: eventInfo.city,
    country: eventInfo.country,
    created_at: new Date(),
    created_by: eventInfo.userId,
    description: eventInfo.description,
    dojo_id: eventInfo.dojoId,
    invites: eventInfo.invites,
    name: eventInfo.name,
    position: eventInfo.position,
    public: eventInfo.public,
    status: eventInfo.status,
    user_type: eventInfo.userType,
    type: eventInfo.type
  };

  if (eventInfo.id) { //Check if this is an update.
    newEvent.id = eventInfo.id;
  }

  if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
    var err = new Error('Dates must be specified');
    return callback(err);
  }

  newEvent.dates = eventInfo.dates;

  var eventEntity = seneca.make$(ENTITY_NS);

  eventEntity.save$(newEvent, function (err, response) {
    if(err) return callback(err);
    return callback(null, response);
  });
}

module.exports = saveEvent;