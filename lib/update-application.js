'use strict';

var async = require('async');

function updateApplication(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make$(ENTITY_NS);

  var application = args.application;

  async.waterfall([
    updateApplication,
    sendEmail
  ], callback);

  function updateApplication(done) {
    applications.save$(application, function(err, application) {
      if (err) return done(err);
      done(null, application);
    });  
  }
  
  function sendEmail(application, done) {
    if(application.status !== 'approved') return done(null, application);
    //Only send an email if the application is approved.
    async.waterfall([
      loadUser,
      loadEvent,
      sendEmail
    ], done);

    function loadUser(cb) {
      seneca.act({role:'cd-users', cmd:'load', id:application.userId || application.user_id}, function (err, response) {
        if(err) return cb(err);
        cb(null, response);
      });
    }

    function loadEvent(user, cb) {
      seneca.act({role:plugin, cmd:'getEvent', id:application.eventId || application.event_id}, function (err, response) {
        if(err) return cb(err);
        cb(null, user, response);
      });
    }

    function sendEmail(user, event, cb) {
      var payload = {
        to:user.email,
        code:'event-application-approved',
        content:{userName:user.name, eventName:event.name}
      };
      seneca.act({role:'cd-dojos', cmd:'send_email', payload:payload}, cb);
    }

  }
}

module.exports = updateApplication;
