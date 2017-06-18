'use strict';

function listEvents (args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd_events';
  const query = args.query || {};
  const events = seneca.make(ENTITY_NS);

  events.list$(query, (err, events) => {
    if (err) {
      return callback(err);
    }

    callback(null, events);
  });
}

module.exports = listEvents;
