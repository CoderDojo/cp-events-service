'use strict';

function saveApplication (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make(ENTITY_NS);

  var application = args.application;
  // TODO: Send email to user.

  applications.list$({userId: application.userId, eventId: application.eventId}, function (err, response) {
    if (err) return callback(err);
    if (response.length > 0) {
      return callback(new Error('User has already applied for this event.'));
    } else {
      if (application.parentId) delete application.parentId;
      applications.save$(application, callback);
    }
  });
}

module.exports = saveApplication;
