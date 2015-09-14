'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var DEFAULT_LANG = 'en_US';


function updateApplication(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var ATTENDANCE_ENTITY_NS = 'cd/attendance';
  var applications = seneca.make$(ENTITY_NS);
  var so = seneca.options();
  var application = args.application;
  var emailSubject = application.emailSubject;
  delete application.emailSubject;

  async.waterfall([
    updateApplication,
    sendEmail
  ], callback);

  function updateApplication(done) {
    applications.list$({eventId: application.eventId, userId: application.userId}, function(err, list){
      if(err) return done(err);

      if(list.length > 0) return done(null, {error: "username already exists"});

      applications.save$(application, function(err, application) {
        if (err) return done(err);
        return done(null, application);
      });
    })
  }
  
  function sendEmail(application, done) {
    if(application.error) return done(null, application);
    if(application.status !== 'approved') return done(null, application);
    //Only send an email if the application is approved.
    async.waterfall([
      loadUser,
      loadEvent,
      saveAttendanceRecord,
      sendEmail
    ], function (err, res) {
      if(err) return done(null, {error: err});
      return done(null, application);
    });

    function loadUser(cb) {
      seneca.act({role:'cd-users', cmd:'load', id:application.userId }, function (err, response) {
        if(err) return cb(err);
        return cb(null, response);
      });
    }

    function loadEvent(user, cb) {
      seneca.act({role:plugin, cmd:'getEvent', id:application.eventId }, function (err, response) {
        if(err) return cb(err);
        return cb(null, user, response);
      });
    }

    function saveAttendanceRecord(user, event, cb) {
      if(event.type === 'recurring') {
        //Save attendance record for each event date
        var eventDates = event.dates;
        async.each(eventDates, function (eventDate, cb) {
          var attendance = {
            userId: user.id,
            eventId: event.id,
            eventDate: eventDate,
            attended: false
          };
          seneca.act({role: plugin, cmd:'saveAttendance', attendance: attendance}, cb);
        }, function (err) {
          if(err) return cb(err);
          return cb(null, user, event);
        });
      } else {
        //One-off event
        var eventDate = _.first(event.dates);
        var attendance = {
          userId: user.id,
          eventId: event.id,
          eventDate: eventDate,
          attended: false
        };
        seneca.act({role: plugin, cmd: 'saveAttendance', attendance: attendance}, function (err, response) {
          if(err) return cb(err);
          return cb(null, user, event);
        });
      }
    }

    function sendEmail(user, event, sendEmailCb) {
      var recipients = [];
      if(!user.email) { //Approving attendee-u13, retrieve parent email addresses.
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId:user.id}}, function (err, userProfiles) {
          if(err) return cb(err);
          var youth = userProfiles[0];
          async.each(youth.parents, function (parentUserId, cb) {
            seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: parentUserId}}, function (err, response) {
              if(err) return cb(err);
              var parentEmail = youth.email;
              recipients.push(parentEmail);
              cb();
            });
          }, prepareEmails)
        });
      } else {
        recipients.push(user.email);
        prepareEmails();
      }

      function prepareEmails() {
        //Send approval email to all recipients
        if(event.type === 'recurring') {
          //Recurring event
          var locality = args.locality || 'en_US';
          var code = 'recurring-event-application-approved-';

          var eventStartDate = moment.utc(_.first(event.dates)).format('MMMM Do YYYY, HH:mm');
          var eventEndDate = moment.utc(_.last(event.dates)).format('MMMM Do YYYY, HH:mm');

          //TODO: Translate weekdays.
          var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          var eventDay = weekdays[moment.utc(_.first(event.dates)).weekday()];
          var content = { 
            userName: user.name, 
            eventName: event.name, 
            eventStartDate: eventStartDate,
            eventEndDate: eventEndDate,
            eventDay: eventDay,
            year: moment(new Date()).format('YYYY')
          };
          send(code, locality, content);
        } else {
          //One-off event
          var locality = args.locality || 'en_US';
          var code = 'one-off-event-application-approved-';

          var eventDate = moment.utc(_.first(event.dates)).format('MMMM Do YYYY, HH:mm');
          var content = {
            userName: user.name, 
            eventName: event.name,
            eventDate: eventDate,
            year: moment(new Date()).format('YYYY')
          };
          send(code, locality, content);
        }

        function send(code, locality, content) {
          async.each(recipients, function (recipient, cb) {
            var payload = {
              to: recipient,
              code: code,
              locality: locality,
              content: content,
              subject: emailSubject
            };
            seneca.act({role:'cd-dojos', cmd:'send_email', payload:payload}, cb);
          }, sendEmailCb);
        }
      }
    }

  }
}

module.exports = updateApplication;
