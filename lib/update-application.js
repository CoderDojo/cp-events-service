'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function updateApplication (args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make$(ENTITY_NS);
  var application = args.application;
  var emailSubject = application.emailSubject;
  delete application.emailSubject;
  var saveFromForm = application.saveFromForm;
  delete application.saveFromForm;
  if (saveFromForm) var updateEventsDate = args.dates;

  async.waterfall([
    updateApplication,
    sendEmail
  ], callback);

  function updateApplication (done) {
    applications.list$({eventId: application.eventId, userId: application.userId}, function (err, list) {
      if (err) return done(err);

      async.series([ function (cb) {
        if (!saveFromForm || (saveFromForm && list.length === 0)) {
          applications.save$(application, done);
        } else {
          return cb(null, {error: 'user application already exists'});
        }
      }, function (cb) {
        if (saveFromForm && updateEventsDate.prevDateStamp !== updateEventsDate.newDateStamp) {
          seneca.make$('cd/attendance').list$({
            eventId: application.eventId,
            userId: application.userId,
            eventDate: updateEventsDate.prevDateStamp
          }, function (err, list) {
            if (err) return cb(err);

            if (list.length > 0) {
              var attendance = {
                id: list[0].id,
                eventDate: updateEventsDate.newDateStamp
              };
              seneca.act({role: plugin, cmd: 'saveAttendance', attendance: attendance}, done);
            } else {
              return cb(null, {});
            }
          });
        } else {
          return cb(null, {});
        }
      }], done);
    });
  }

  function sendEmail (application, done) {
    if (application.error) return done(null, application);
    if (application.status !== 'approved') return done(null, application);
    // Only send an email if the application is approved.
    async.waterfall([
      loadUser,
      loadEvent,
      saveAttendanceRecord,
      sendEmail
    ], function (err, res) {
      if (err) return done(null, {error: err});
      return done(null, application);
    });

    function loadUser (cb) {
      seneca.act({role: 'cd-users', cmd: 'load', id: application.userId}, function (err, response) {
        if (err) return cb(err);
        return cb(null, response);
      });
    }

    function loadEvent (user, cb) {
      seneca.act({role: plugin, cmd: 'getEvent', id: application.eventId}, function (err, response) {
        if (err) return cb(err);
        return cb(null, user, response);
      });
    }

    function saveAttendanceRecord (user, event, cb) {
      if (event.type === 'recurring') {
        // Save attendance record for each event date
        async.each(event.dates, function (eventDate, cb) {
          var attendance = {
            userId: user.id,
            eventId: event.id,
            eventDate: eventDate.startTime,
            attended: false
          };
          seneca.act({role: plugin, cmd: 'saveAttendance', attendance: attendance}, cb);
        }, function (err) {
          if (err) return cb(err);
          return cb(null, user, event);
        });
      } else {
        // One-off event
        var attendance = {
          userId: user.id,
          eventId: event.id,
          eventDate: _.first(event.dates).startTime,
          attended: false
        };
        seneca.act({role: plugin, cmd: 'saveAttendance', attendance: attendance}, function (err, response) {
          if (err) return cb(err);
          return cb(null, user, event);
        });
      }
    }

    function sendEmail (user, event, sendEmailCb) {
      var recipients = [];
      if (!user.email) { // Approving attendee-u13, retrieve parent email addresses.
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: user.id}}, function (err, userProfiles) {
          if (err) return sendEmailCb(err);
          var youth = userProfiles[0];
          async.each(youth.parents, function (parentUserId, cb) {
            seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: parentUserId}}, function (err, response) {
              if (err) return cb(err);
              var parentEmail = youth.email;
              recipients.push(parentEmail);
              cb();
            });
          }, prepareEmails);
        });
      } else {
        recipients.push(user.email);
        prepareEmails();
      }

      function prepareEmails () {
        // Send approval email to all recipients

        var locality = args.locality || 'en_US';
        var eventTime = '';
        var content = {};

        if (event.type === 'recurring') {
          // Recurring event

          var eventStartDate = moment.utc(_.first(event.dates).startTime).format('MMMM Do YYYY');
          var eventEndDate = moment.utc(_.last(event.dates).startTime).format('MMMM Do YYYY');

          eventTime = moment.utc(_.first(event.dates).startTime).format('HH:mm') + ' - ' + moment.utc(_.first(event.dates).endTime).format('HH:mm');

          // TODO: Translate weekdays.
          var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          var eventDay = weekdays[moment.utc(_.first(event.dates).startTime).weekday()];

          content.userName = user.name;
          content.eventName = event.name;
          content.eventStartDate = eventStartDate;
          content.eventEndDate = eventEndDate;
          content.eventDay = eventDay;
          content.eventTime = eventTime;
          content.year = moment.utc(new Date()).format('YYYY');

          send('recurring-event-application-approved-', locality, content);
        } else {
          // One-off event

          var eventDate = moment.utc(_.first(event.dates).startTime).format('MMMM Do YYYY');
          eventTime = moment.utc(_.first(event.dates).startTime).format('HH:mm') + ' - ' + moment.utc(_.first(event.dates).endTime).format('HH:mm');

          content.userName = user.name;
          content.eventName = event.name;
          content.eventDate = eventDate;
          content.eventTime = eventTime;
          content.year = moment.utc(new Date()).format('YYYY');

          send('one-off-event-application-approved-', locality, content);
        }

        function send (code, locality, content) {
          async.each(recipients, function (recipient, cb) {
            var payload = {
              to: recipient,
              code: code,
              locality: locality,
              content: content,
              subject: emailSubject
            };
            seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
          }, sendEmailCb);
        }
      }
    }
  }
}

module.exports = updateApplication;
