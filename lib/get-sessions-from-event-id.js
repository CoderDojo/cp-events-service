function getSessionsFromEventId(args, callback) {
  var seneca = this;
  seneca.act({role: 'cd-events', cmd: 'searchSessions', query: {eventId: args.id}}, callback);
}

module.exports = getSessionsFromEventId;
