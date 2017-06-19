'use strict';

function deleteEvent (args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/events';
  const events = seneca.make(ENTITY_NS);
  const id = args.id;

  events.remove$(id, (err, event) => {
    if (err) {
      return callback(err);
    }
    callback(null, event);
  });
}

module.exports = deleteEvent;

