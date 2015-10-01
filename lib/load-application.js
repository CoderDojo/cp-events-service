'use strict';

function loadApplication (args, callback) {
  var seneca = this;
  var APPLICATION_ENTITY_NS = 'cd/applications';

  var applicationsEntity = seneca.make$(APPLICATION_ENTITY_NS);
  var id = args.id;
  if (!id) return callback(null, {error: 'args.id is empty'});
  applicationsEntity.load$(id, callback);
}

module.exports = loadApplication;
