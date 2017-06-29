'use strict';

const async = require('async');

function searchSessions(args, callback) {
  const seneca = this;
  const sessionsEntity = seneca.make('cd/sessions');
  const plugin = args.role;

  async.waterfall([
    loadSessions,
    loadTickets,
  ], callback);

  function loadSessions(done) {
    const query = args.query || {};
    if (!query.limit$) query.limit$ = 'NULL';
    sessionsEntity.list$(query, done);
  }

  function loadTickets(sessions, done) {
    async.map(
      sessions,
      (session, cb) => {
        seneca.act({ role: plugin, cmd: 'searchTickets', query: { sessionId: session.id, deleted: 0 } }, (err, tickets) => {
          if (err) return cb(err);
          session.tickets = tickets;
          return cb(null, session);
        });
      }, done
    );
  }
}

module.exports = searchSessions;
