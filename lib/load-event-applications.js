'use strict';

function loadEventApplications (args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make$(ENTITY_NS);

  var eventId = args.eventId;

  applications.list$({eventId: eventId}, function (err, applications) {
    if (err) return done(err);
    callback(null, applications);
  });
}

module.exports = loadEventApplications;
