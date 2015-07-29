'use strict';
var async = require('async');

function saveApplication(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make(ENTITY_NS);

  var application = args.application;
  //TODO: Send email to user.

  async.waterfall([
    checkForApplication,
    saveEntity
  ], callback);

  //Make sure this user has not already applied for this event
  function checkForApplication(done) {
    applications.list$({userId:application.user_id, eventId: application.event_id}, function (err, response) {
      if(err) return done(err);
      if(response.length > 0) {
        return done(new Error('User has already applied for this event.'));
      }
      return done();
    });
  }

  function saveEntity(done) {
    if(application.parent_id) delete application.parent_id;
    applications.save$(application, done);
  }
}

module.exports = saveApplication;
