'use strict';

function saveSession (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/sessions';
  var sessionEntity = seneca.make$(ENTITY_NS);

  var session = args.session;
  if (!session) return callback(null, {error: 'args.session is empty'});
  sessionEntity.save$(session, callback);
}

module.exports = saveSession;
