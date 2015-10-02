'use strict';

function searchTickets (args, callback) {
  var seneca = this;
  var ticketsEntity = seneca.make$('cd/tickets');
  var query = args.query || {};
  if (!query.limit$) query.limit$ = 'NULL';
  ticketsEntity.list$(query, callback);
}

module.exports = searchTickets;
