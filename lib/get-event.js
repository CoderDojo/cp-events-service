'use strict';

function getEvent(args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/events';
  const events = seneca.make(ENTITY_NS);
  const id = args.id;
  events.load$(id, callback);
}

module.exports = getEvent;
