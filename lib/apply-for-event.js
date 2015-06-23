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
    isMemberOfDojo,
    checkForApplication,
    applyForEvent,
    sendConfirmationEmail
  ], function (err, res) {
    if(err) return callback(err);
    return callback(null, res);
  });

  //TODO: update done callbacks to return an error object when validation fails.
  function isMemberOfDojo(done) {
    var userId = user.id;

    seneca.act({role:plugin, cmd:'getEvent', id:eventId}, function (err, response) {
      if(err) return done(err);
      var dojoId = response.dojoId;
      seneca.act({role:'cd-dojos', cmd:'dojos_for_user', id:userId}, function (err, response) {
        if(err) return done(err);
        var dojos = response;
        var isMember = _.find(dojos, function (dojo) {
          return dojo.id === dojoId;
        });
        if(isMember) return done(null, {});
        return done(null, {error:'User is not member of Dojo.'});
      });
    });

  }

  //Make sure this user has not already applied for this event
  function checkForApplication(status, done) {
    if(!_.isEmpty(status)) return done(null, status);
    applications.list$({userId:user.id, eventId:eventId}, function (err, response) {
      if(err) return done(err);
      if(response.length > 0) {
        return done(null, {error:'User has already applied for this event.'});
      }
      return done(null, {});
    });
  }

  function applyForEvent(status, done) {
    if(!_.isEmpty(status)) return done(null, status, {});
    applications.save$(application, function (err, response) {
      if(err) return done(err);
      done(null, null, response);
    });
  }

  function sendConfirmationEmail(status, application, done) {
    if(!_.isEmpty(status)) return done(null, status);
    seneca.act({role: plugin, cmd: 'getEvent', id:application.event_id}, function (err, response) {
      if(err) return done(err);
      var event = response;
      //Send email
      var payload = {
        to:user.email,
        code:'event-application-received',
        content:{userName:user.name, eventName:event.name}
      };
      seneca.act({role:'cd-dojos', cmd:'send_email', payload:payload}, done);
    });
  }
}

module.exports = applyForEvent;
