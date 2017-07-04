function listEvents(args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd_events';
  const query = args.query || {};
  const events = seneca.make(ENTITY_NS);

  events.list$(query, (err, eventsList) => {
    if (err) return callback(err);
    callback(null, eventsList);
  });
}

module.exports = listEvents;
