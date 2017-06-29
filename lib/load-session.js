'use strict';

function loadSession(args, callback) {
  const seneca = this;
  const sessionEntity = seneca.make('cd/sessions');
  const id = args.id;
  sessionEntity.load$(id, callback);
}

module.exports = loadSession;
