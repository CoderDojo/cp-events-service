'use strict';

var _ = require('lodash');

function saveTicket (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/tickets';
  var ticketEntity = seneca.make$(ENTITY_NS);
  var ticket = _.pick(args.ticket, 'id', 'sessionId', 'name', 'type', 'quantity', 'deleted', 'invites');
  if (!ticket) return callback(null, {error: 'args.ticket is empty'});
  ticketEntity.save$(ticket, callback);
}

module.exports = saveTicket;
