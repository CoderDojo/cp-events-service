function getSessionsFromEventId({ id }, callback) {
  const seneca = this;
  seneca.act({
    role : 'cd-events',
    cmd  : 'searchSessions',
    query: {
      eventId: id,
    },
  }, callback);
}

module.exports = getSessionsFromEventId;
