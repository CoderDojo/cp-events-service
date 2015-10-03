'use strict';

function loadTicket (args, callback) {
  var seneca = this;
  var ticketEntity = seneca.make$('cd/tickets');
  var id = args.id;
  ticketEntity.load$(id, callback);
}

module.exports = loadTicket;
