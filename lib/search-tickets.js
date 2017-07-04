'use strict';

const async = require('async');

function searchTickets(args, callback) {
  const seneca = this;
  const ticketsEntity = seneca.make('cd/tickets');
  const plugin = args.role;

  async.waterfall([loadTickets, getNumberOfApplications, getNumberOfApprovedApplications], callback);

  function loadTickets(done) {
    const query = args.query || {};
    if (!query.limit$) query.limit$ = 'NULL';
    ticketsEntity.list$(query, done);
  }

  function getNumberOfApplications(tickets, done) {
    async.map(
      tickets,
      (ticket, cb) => {
        seneca.act(
          {
            role : plugin,
            cmd  : 'searchApplications',
            query: { ticketId: ticket.id, deleted: 0 },
          },
          (err, { length }) => {
            if (err) return cb(err);
            ticket.totalApplications = length;
            cb(null, ticket);
          }
        );
      },
      done
    );
  }

  function getNumberOfApprovedApplications(tickets, done) {
    async.map(
      tickets,
      (ticket, cb) => {
        seneca.act(
          {
            role : plugin,
            cmd  : 'searchApplications',
            query: { ticketId: ticket.id, deleted: 0, status: 'approved' },
          },
          (err, { length }) => {
            if (err) return cb(err);
            ticket.approvedApplications = length;
            cb(null, ticket);
          }
        );
      },
      done
    );
  }
}

module.exports = searchTickets;
