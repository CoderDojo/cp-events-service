'use strict';

function deleteEvent (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';
  var events = seneca.make$(ENTITY_NS);
  var id = args.id;

  events.remove$(id, function (err, event) {
    if (err) {
      return callback(err);
    }
    callback(null, event);
  });
}

module.exports = deleteEvent;

