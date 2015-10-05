'use strict';

var async = require('async');

function searchSessions (args, callback) {
  var seneca = this;
  var sessionsEntity = seneca.make$('cd/sessions');
  var plugin = args.role;

  async.waterfall([
    loadSessions,
    loadTickets
  ], callback);

  function loadSessions (done) {
    var query = args.query || {};
    if (!query.limit$) query.limit$ = 'NULL';
    sessionsEntity.list$(query, done);
  }

  function loadTickets (sessions, done) {
    async.map(sessions, function (session, cb) {
      seneca.act({role: plugin, cmd: 'searchTickets', query: {sessionId: session.id, deleted: 0}}, function (err, tickets) {
        if (err) return cb(err);
        session.tickets = tickets;
        return cb(null, session);
      });
    }, done);
  }
}

module.exports = searchSessions;
