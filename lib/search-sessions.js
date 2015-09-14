'use strict';

function searchSessions(args, callback) {
  var seneca = this;
  var sessionsEntity = seneca.make$('cd/sessions');
  var query = args.query || {};
  if(!query.limit$) query.limit$ = 'NULL';

  sessionsEntity.list$(query, callback);
}

module.exports = searchSessions;