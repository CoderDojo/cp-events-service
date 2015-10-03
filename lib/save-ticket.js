'use strict';

function saveTicket (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/tickets';
  var ticketEntity = seneca.make$(ENTITY_NS);

  var ticket = args.ticket;
  if (!ticket) return callback(null, {error: 'args.ticket is empty'});
  ticketEntity.save$(ticket, callback);
}

module.exports = saveTicket;
