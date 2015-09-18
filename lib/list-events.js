'use strict';

function listEvents (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd_events';
  var query = args.query || {};
  var events = seneca.make(ENTITY_NS);

  events.list$(query, function (err, events) {
    if (err) {
      return callback(err);
    }

    callback(null, events);
  });
}

module.exports = listEvents;
