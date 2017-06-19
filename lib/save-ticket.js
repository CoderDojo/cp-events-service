'use strict';

const _ = require('lodash');

function saveTicket (args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/tickets';
  const ticketEntity = seneca.make(ENTITY_NS);
  const ticket = _.pick(args.ticket, 'id', 'sessionId', 'name', 'type', 'quantity', 'deleted', 'invites');
  if (!ticket) return callback(null, {error: 'args.ticket is empty'});
  ticketEntity.save$(ticket, callback);
}

module.exports = saveTicket;
