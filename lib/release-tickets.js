'use strict';

function releaseTickets (args, callback) {
  console.log("gelo");
  var seneca = this;
  var eventId = args.eventId;
  var ENTITY_NS = 'cd/events';
  seneca.act({role: 'cd-events', cmd: 'getEvent', id: eventId}, function (err, eventInfo) {
    if (err) {
      return callback(err, null);
    } else {
      eventInfo.ticketsReleased = true;
      console.log("released");
      var eventEntity = seneca.make$(ENTITY_NS);
      eventEntity.save$(eventInfo, callback);
    }
  });
}

module.exports = releaseTickets;
