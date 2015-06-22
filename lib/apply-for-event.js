'use strict';
var async = require('async');
var _     = require('lodash');

function applyForEvent(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make$(ENTITY_NS);
  var eventId = args.id;
  var user = args.user;

  var application = {
    event_id:eventId,
    user_id:user.id,
    name:user.name,
    attended:false,
    status:'pending'
  };

  async.waterfall([
    checkForApplication,
    applyForEvent,
    sendConfirmationEmail
  ], callback);

  //Make sure this user has not already applied for this event
  function checkForApplication(done) {
    applications.list$({userId:user.id, eventId:eventId}, function (err, response) {
      if(err) return done(err);
      if(response.length > 0) {
        return done(null, true);
      }
      return done(null, false);
    });
  }

  function applyForEvent(applicationFound, done) {
    if(!applicationFound) {
      applications.save$(application, function (err, response) {
        if(err) return done(err);
        return done(null, response);
      });
    } else {
      return done(null, {});
    }
  }

  function sendConfirmationEmail(application, done) {
    if(_.isEmpty(application)) return done(null, {status:'application-exists'});
    //Load event
    seneca.act({role: plugin, cmd: 'getEvent', id:application.event_id}, function (err, response) {
      if(err) return done(err);
      var event = response;
      //Send email
      var payload = {
        to:user.email,
        code:'event-application-received',
        content:{userName:user.name, eventName:event.name}
      };
      seneca.act({role:'cd-dojos', cmd:'send_email', payload:payload}, function (err, response) {
        if(err) return done(err);
        done(null, {status:'success'});
      });
    });
  }
}

module.exports = applyForEvent;
