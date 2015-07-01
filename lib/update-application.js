'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

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
    ], function (err, res) {
      if(err) return done(null, {error: err});
      return done(null, res);
    });

    function loadUser(cb) {
      seneca.act({role:'cd-users', cmd:'load', id:application.userId || application.user_id}, cb);
    }

    function loadEvent(user, cb) {
      seneca.act({role:plugin, cmd:'getEvent', id:application.eventId || application.event_id}, cb);
    }

    function sendEmail(user, event, cb) {
      var recipients = [];
      if(!user.email) { //Approving attendee-u13, retrieve parent email addresses.
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId:user.id}}, function (err, response) {
          if(err) return cb(err);
          async.each(response.parents, function (parentUserId, cb) {
            seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: parentUserId}}, function (err, response) {
              if(err) return cb(err);
              var parentEmail = response.email;
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
        if(event.dates.length > 1) {
          //Recurring event
          var code = 'recurring-event-application-approved';
          var firstDate = _.first(event.dates);
          var eventStartDate = moment(firstDate).format('MMMM Do YYYY, h:mm');
          var eventEndDate = moment(_.last(event.dates)).format('MMMM Do YYYY, h:mm');
          //TODO: Translate weekdays.
          var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          var eventDay = weekdays[moment(firstDate).weekday()];
          var content = {userName:user.name, eventName:event.name, eventStartDate:eventStartDate, eventEndDate: eventEndDate, eventDay: eventDay};
          send(code, content);
        } else {
          //One-off event
          var code = 'one-off-event-application-approved';
          var eventDate = moment(event.date).format('MMMM Do YYYY, h:mm');
          var content = {userName: user.name, eventName: event.name, eventDate: eventDate};
          send(code, content);
        }

        function send(code, content) {
          async.each(recipients, function (recipient, cb) {
            var payload = {
              to: recipient,
              code: code,
              content: content
            };
            seneca.act({role:'cd-dojos', cmd:'send_email', payload:payload}, cb);
          }, cb);
        }
      }
    }

  }
}

module.exports = updateApplication;
