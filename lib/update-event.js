'use strict';


function updateEvent(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';
  var eventInfo = args.eventInfo || {};

  seneca.make$(ENTITY_NS).save$(eventInfo, function(err, event) {
    if (err) {
      return callback(err);
    }

    callback(null, event);
  });
}

module.exports = updateEvent;

