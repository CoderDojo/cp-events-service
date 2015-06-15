'use strict';

function createEvent(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';
  var eventInfo = args.eventInfo;
  var eventEntity = seneca.make$(ENTITY_NS);

  eventEntity.save$(eventInfo, function(err, eventData) {
      if (err) return callback(err);
      callback(null, eventData);
  });
}

module.exports = createEvent;
