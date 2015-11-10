'use strict';

function saveTicket (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/tickets';
  var ticketEntity = seneca.make$(ENTITY_NS);

  var ticket = args.ticket;
  delete ticket['totalApplications'];
  delete ticket['approvedApplications'];
  if (!ticket) return callback(null, {error: 'args.ticket is empty'});
  ticketEntity.save$(ticket, callback);
}

module.exports = saveTicket;
