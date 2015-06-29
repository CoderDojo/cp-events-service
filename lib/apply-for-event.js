'use strict';
var async = require('async');
var _     = require('lodash');
var moment = require('moment');

function applyForEvent(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var applicationsEntities = seneca.make$(ENTITY_NS);
  var eventId = args.applyData.eventId;
  var user = args.applyData.user;
  var children = args.applyData.children;
  var applications = [];

  async.waterfall([
    buildApplications,
    sendApplications
  ], function (err, res) {
    if(err) return callback(err);
    return callback(null, res);
  });

  function buildApplications(done) {
    if(children) {
      async.each(children, function (child, cb) {
        seneca.act({role: 'cd-users', cmd: 'load'}, {id: child}, function (err, response) {
          if(err) return cb(err);
          var childUser = response;
          var application = {
            event_id:eventId,
            parent_id: user.id,
            user_id:childUser.id,
            name:childUser.name,
            attended:false,
            status:'pending'
          };
          applications.push(application);
          cb();
        });
      }, done);
      
    } else {
      var application = {
        event_id:eventId,
        user_id:user.id,
        name:user.name,
        attended:false,
        status:'pending'
      };
      applications.push(application);
      done();
    }
  }


  function sendApplications(done) {
    async.each(applications, function (application, cb) {

      async.waterfall([
        isMemberOfDojo,
        checkForApplication,
        applyForEvent,
        sendConfirmationEmail
      ], done);

      function isMemberOfDojo(done) {
        var userId = application.parent_id || application.user_id; //Make sure that the parent is a member.

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
        applicationsEntities.list$({userId:application.user_id, eventId:eventId}, function (err, response) {
          if(err) return done(err);
          if(response.length > 0) {
            return done(null, {error:'User has already applied for this event.'});
          }
          return done(null, {});
        });
      }

      function applyForEvent(status, done) {
        if(!_.isEmpty(status)) return done(null, status, {});
        if(application.parent_id) delete application.parent_id;

        applicationsEntities.save$(application, function (err, response) {
          if(err) return done(err);
          done(null, null, response);
        });
      }

      function sendConfirmationEmail(status, application, done) {
        if(!_.isEmpty(status)) return done(null, status);
        seneca.act({role: plugin, cmd: 'getEvent', id:application.event_id}, function (err, response) {
          if(err) return done(err);
          var event = response;
          var eventDate = moment(event.date).format('MMMM Do YYYY, h:mm');
          //Send email
          var payload = {
            to:user.email,
            code:'event-application-received',
            content:{userName:application.name, eventName:event.name, eventDate:eventDate}
          };
          seneca.act({role:'cd-dojos', cmd:'send_email', payload:payload}, done);
        });
      }
    }, done);
  
  }
  
}

module.exports = applyForEvent;
