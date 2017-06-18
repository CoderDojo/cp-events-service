'use strict';

function loadEventApplications (args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/applications';
  const applications = seneca.make$(ENTITY_NS);

  const eventId = args.eventId;

  applications.list$({eventId: eventId}, (err, applications) => {
    if (err) return callback(err);
    callback(null, applications);
  });
}

module.exports = loadEventApplications;
