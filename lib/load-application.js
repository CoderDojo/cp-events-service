'use strict';

function loadApplication(args, callback) {
  const seneca = this;
  const APPLICATION_ENTITY_NS = 'cd/applications';

  const applicationsEntity = seneca.make(APPLICATION_ENTITY_NS);
  const id = args.id;
  if (!id) return callback(null, { error: 'args.id is empty' });
  applicationsEntity.load$(id, callback);
}

module.exports = loadApplication;
