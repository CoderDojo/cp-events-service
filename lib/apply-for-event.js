'use strict';
var async = require('async');
var _     = require('lodash');
var moment = require('moment');

function applyForEvent(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var eventId = args.applyData.eventId;
  var user = args.applyData.user;
  var children = args.applyData.children;
  var applications = [];

  async.waterfall([
    buildApplications,
    sendApplications
  ], function (err, res) {
    if(err) return callback(null, {error: err});
    return callback(null, res);
  });

  function buildApplications(done) {
    if(children) {
      async.each(children, function (child, cb) {
        seneca.act({role: 'cd-users', cmd: 'load'}, {id: child}, function (err, response) {
          if(err) return cb(err);
          var childUser = response;
          //Query cd-profiles with user.id to apply permissions.
          seneca.act({role: 'cd-profiles', cmd: 'list', user:user.id, query:{userId:childUser.id}}, function (err, response) {
            if(err) return cb(err);
            var childProfile = response;
            var application = {
              event_id: eventId,
              parent_id: user.id,
              user_id: childUser.id,
              name: childUser.name,
              date_of_birth: childProfile.dob,
              status: 'pending'
            };
            applications.push(application);
            cb();
          });
        });
      }, done);
    } else {
      seneca.act({role: 'cd-profiles', cmd: 'list', user: user.id, query:{userId:user.id}}, function (err, response) {
        if(err) return cb(err);
        var userProfile = response;
        var application = {
          event_id: eventId,
          user_id: user.id,
          name: user.name,
          date_of_birth: userProfile.dob,
          status: 'pending'
        };
        applications.push(application);
        done();
      });
    }
  }


  function sendApplications(done) {
    async.eachSeries(applications, function (application, cb) {

      async.waterfall([
        isMemberOfDojo,
        checkForApplication,
        applyForEvent,
        sendConfirmationEmail
      ], function (err, res) {
        if(err) return cb(err);
        return cb(null, res);
      });

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
        var applicationsEntities = seneca.make$(ENTITY_NS);
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
        var applicationsEntities = seneca.make$(ENTITY_NS);
        applicationsEntities.save$(application, function (err, response) {
          if(err) return done(err);
          return done(null, null, response);
        });
      }

      function sendConfirmationEmail(status, application, done) {
        if(!_.isEmpty(status)) return done(null, status);
        seneca.act({role: plugin, cmd: 'getEvent', id:application.event_id}, function (err, response) {
          if(err) return done(err);
          var event = response;
          var payload;
          if(event.dates.length > 1) {
            //Send email for recurring event
            var firstDate = _.first(event.dates);
            var eventStartDate = moment(firstDate).format('MMMM Do YYYY, HH:mm');
            var eventEndDate = moment(_.last(event.dates)).format('MMMM Do YYYY, HH:mm');
            //TODO: Translate weekdays.
            var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var eventDay = weekdays[moment(firstDate).weekday()];
            payload = {
              to:user.email,
              code:'recurring-event-application-received',
              content:{
                userName: application.name, 
                eventName: event.name,
                eventStartDate: eventStartDate,
                eventEndDate: eventEndDate,
                eventDay: eventDay,
                year: moment(new Date()).format('YYYY')
              }
            };
          } else {
            //Send email for one-off event
            var eventDate = moment(_.first(event.dates)).format('MMMM Do YYYY, HH:mm');
            payload = {
              to:user.email,
              code:'one-off-event-application-received',
              content:{
                userName: application.name,
                eventName: event.name,
                eventDate: eventDate,
                year: moment(new Date()).format('YYYY')
              }
            };
          }
         
          seneca.act({role:'cd-dojos', cmd:'send_email', payload:payload}, done);
        });
      }
    }, done);
  
  }
  
}

module.exports = applyForEvent;
