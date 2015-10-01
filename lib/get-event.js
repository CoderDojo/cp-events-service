'use strict';

function getEvent (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';
  var events = seneca.make$(ENTITY_NS);
  var id = args.id;
  events.load$(id, callback);
}

module.exports = getEvent;
