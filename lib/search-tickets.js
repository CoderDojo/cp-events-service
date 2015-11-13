'use strict';

var async = require('async');

function searchTickets (args, callback) {
  var seneca = this;
  var ticketsEntity = seneca.make$('cd/tickets');
  var plugin = args.role;

  async.waterfall([
    loadTickets,
    getNumberOfApplications,
    getNumberOfApprovedApplications
  ], callback);

  function loadTickets (done) {
    var query = args.query || {};
    if (!query.limit$) query.limit$ = 'NULL';
    ticketsEntity.list$(query, done);
  }

  function getNumberOfApplications (tickets, done) {
    async.map(tickets, function (ticket, cb) {
      seneca.act({role: plugin, cmd: 'searchApplications', query: {ticketId: ticket.id, deleted: 0}}, function (err, applications) {
        if (err) return cb(err);
        ticket.totalApplications = applications.length;
        cb(null, ticket);
      });
    }, done);
  }

  function getNumberOfApprovedApplications (tickets, done) {
    async.map(tickets, function (ticket, cb) {
      seneca.act({role: plugin, cmd: 'searchApplications', query: {ticketId: ticket.id, deleted: 0, status: 'approved'}}, function (err, applications) {
        if (err) return cb(err);
        ticket.approvedApplications = applications.length;
        cb(null, ticket);
      });
    }, done);
  }
}

module.exports = searchTickets;
