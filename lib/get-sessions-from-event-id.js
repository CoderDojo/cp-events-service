'use strict';

function getSessionsFromEventId(args, callback) {
  const seneca = this;
  seneca.act({role: 'cd-events', cmd: 'searchSessions', query: {eventId: args.id}}, callback);
}

module.exports = getSessionsFromEventId;
