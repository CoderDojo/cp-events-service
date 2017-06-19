'use strict';

function loadTicket (args, callback) {
  const seneca = this;
  const ticketEntity = seneca.make('cd/tickets');
  const id = args.id;
  ticketEntity.load$(id, callback);
}

module.exports = loadTicket;
