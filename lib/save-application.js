'use strict';
var async = require('async');

function saveApplication(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make(ENTITY_NS);

  var application = args.application;
  //TODO: Send email to user.

  applications.list$({userId: application.user_id, eventId: application.event_id}, function (err, response) {
    if (err) return callback(err);
    if (response.length > 0) {
      return callback(new Error('User has already applied for this event.'));
    } else {
      if (application.parent_id) delete application.parent_id;
      applications.save$(application, callback);
    }
  });
}

module.exports = saveApplication;
