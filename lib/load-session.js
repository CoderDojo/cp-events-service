'use strict';

function loadSession (args, callback) {
  var seneca = this;
  var sessionEntity = seneca.make$('cd/sessions');
  var id = args.id;
  sessionEntity.load$(id, callback);
}

module.exports = loadSession;
