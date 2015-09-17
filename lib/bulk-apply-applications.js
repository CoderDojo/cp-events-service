'use strict'

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function bulkApplyApplications(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var requestingUser = args.user;
  var applications = args.applications;
  var locality = args.locality || 'en_US';
  var eventDateFormat = 'Do MMMM YY';
  if(_.isEmpty(applications)) return callback(null, {error: 'args.applications is empty'});

  async.waterfall([
    saveApplications,
    sendEmail
  ], callback);

  function saveApplications(done) {
    async.map(applications, function (application, cb) {
      seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
        if(err) return cb(err);
        if(_.isEmpty(profiles)) return cb();
        var userProfile = profiles[0];
        application.name = userProfile.name;
        application.dateOfBirth = userProfile.dob;
        application.status = 'pending';
        seneca.act({role: plugin, cmd: 'saveApplication', application: application}, cb);
      });
    }, done);
  }

  function sendEmail(applications, done) {
    async.waterfall([
      retrieveProfiles,
      retrieveEventAndSessionData,
      retrieveTicketsData,
      sendEmail
    ], done);

    function retrieveProfiles(done) {
      async.map(applications, function (application, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
          if(err) return cb(err);
          var profile = profiles[0];
          return cb(null, profile);
        });
      }, done); 
    }

    function retrieveEventAndSessionData(profiles, done) {
      profiles = _.uniq(profiles, function (profile) { return profile.id });
      seneca.act({role: plugin, cmd: 'getEvent', id: applications[0].eventId}, function (err, event) {
        if(err) return done(err);
        seneca.act({role: plugin, cmd: 'searchSessions', query: {id: applications[0].sessionId}}, function(err, sessions) {
          if(err) return done(err);
          return done(null, profiles, event, sessions[0]);
        });
      });
    }

    function retrieveTicketsData(profiles, event, session, done) {
      async.map(applications, function (application, cb) {
        return cb(null, {ticketName: application.ticketName, ticketType: application.ticketType});
      }, function (err, tickets) {
        if(err) return done(err);
        var ticketQuantities = _.countBy(tickets, function (ticket){ return ticket.ticketName });
        _.each(tickets, function (ticket) {
          ticket.quantity = ticketQuantities[ticket.ticketName];
        });
        tickets = _.uniq(tickets, function (ticket) { return ticket.ticketName});
        return done(null, profiles, event, session, tickets);
      });
    }

    function sendEmail(profiles, event, session, tickets, done) {
      async.eachSeries(profiles, function (profile, cb) {
        if(!profile.email) return cb();
        var eventDate;
        var firstDate = _.first(event.dates);
        var lastDate = _.last(event.dates);
        var startTime = moment(firstDate.startTime).format('HH:mm');
        var endTime = moment(firstDate.endTime).format('HH:mm');
        if(event.type === 'recurring') {  
          eventDate = moment(firstDate.startTime).format(eventDateFormat) + ' - ' + moment(lastDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
        } else {
          eventDate = moment(firstDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
        }
        var payload = {
          to: profile.email,
          code: 'ticket-application-received-',
          subject: 'Your ticket request for ' + event.name + ' has been received',
          locality: locality,
          content: {
            applicantName: profile.name,
            event: event,
            applicationDate: moment(applications[0].created).format(eventDateFormat),
            sessionName: session.name,
            tickets: tickets,
            status: applications[0].status,
            eventDate: eventDate
          }
        };
        seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
      }, done);
    }
  }
}

module.exports = bulkApplyApplications;