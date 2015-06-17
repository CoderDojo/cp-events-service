'use strict';
var async = require('async');

function applyForEvent(args, callback) {
  var seneca = this;
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
    applyForEvent
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
        return done(null, {status:'success'});
      });
    } else {
      return done(null, {status:'application-exists'});
    }
  }

  

}

module.exports = applyForEvent;
