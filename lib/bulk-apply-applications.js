'use strict'

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function bulkApplyApplications(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var requestingUser = args.user;
  var applications = args.applications;
  var updateAction = applications[0].updateAction || '';
  delete applications[0].updateAction;
  var locality = args.locality || 'en_US';
  var eventDateFormat = 'Do MMMM YY';
  if(_.isEmpty(applications)) return callback(null, {error: 'args.applications is empty'});

  //TODO validate request
  async.waterfall([
    saveApplications,
    generateEmailContent
  ], function (err, applications) {
    if(err) return callback(null, {ok: false, why: err.message});
    return callback(null, applications);
  });

  function saveApplications(done) {
    async.map(applications, function (application, cb) {
      seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
        if(err) return cb(err);
        if(_.isEmpty(profiles)) return cb();
        var userProfile = profiles[0];
        application.name = userProfile.name;
        application.dateOfBirth = userProfile.dob;
        if(!application.status) application.status = 'pending';
        seneca.act({role: plugin, cmd: 'saveApplication', application: application}, cb);
      });
    }, done);
  }

  function generateEmailContent(applications, done) {
    if(updateAction === 'disapprove' || updateAction === 'checkin') return done();
    async.waterfall([
      retrieveProfiles,
      retrieveParentsForUser,
      retrieveEventAndSessionData,
      retrieveDojoData,
      retrieveTicketsData,
      sendEmail
    ], function (err, res) {
      if(err) return done(err);
      return done(null, applications);
    });

    function retrieveProfiles(done) {
      async.map(applications, function (application, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
          if(err) return cb(err);
          var profile = profiles[0];
          return cb(null, profile);
        });
      }, done); 
    }

    function retrieveParentsForUser(profiles, done) {
      if(applications[0].status !== 'approved') return done(null, profiles);
      seneca.act({role: 'cd-profiles', cmd: 'load_parents_for_user', userId: profiles[0].userId}, function (err, parents) {
        if(err) return done(err);
        profiles[0].parents = parents;
        return done(null, profiles);
      });
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

    function retrieveDojoData(profiles, event, session, done) {
      seneca.act({role: 'cd-dojos', cmd: 'load', id: event.dojoId}, function (err, dojo) {
        if(err) return done(err);
        return done(null, profiles, event, session, dojo);
      });
    }

    function retrieveTicketsData(profiles, event, session, dojo, done) {
      async.map(applications, function (application, cb) {
        return cb(null, {ticketName: application.ticketName, ticketType: application.ticketType});
      }, function (err, tickets) {
        if(err) return done(err);
        var ticketQuantities = _.countBy(tickets, function (ticket){ return ticket.ticketName });
        _.each(tickets, function (ticket) {
          ticket.quantity = ticketQuantities[ticket.ticketName];
        });
        tickets = _.uniq(tickets, function (ticket) { return ticket.ticketName});
        var emailCode;
        (applications[0].status === 'pending') ? emailCode = 'ticket-application-received-' : emailCode = 'ticket-application-approved-';
        return done(null, profiles, event, session, dojo, tickets, emailCode);
      });
    }

    function sendEmail(profiles, event, session, dojo, tickets, emailCode, done) {
      var emailSubject;
      //TODO translate email subject
      (emailCode === 'ticket-application-received-') ? emailSubject = 'Your ticket request for ' + event.name + ' has been received' :
      emailSubject = 'Your ticket request for ' + event.name + ' has been approved';

      async.each(profiles, function (profile, cb) {
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
          code: emailCode,
          subject: emailSubject,
          locality: locality,
          content: {
            applicantName: profile.name,
            event: event,
            dojo: dojo,
            applicationDate: moment(applications[0].created).format(eventDateFormat),
            sessionName: session.name,
            tickets: tickets,
            status: applications[0].status,
            eventDate: eventDate
          }
        };

        seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, function (err, res) {
          if(err) return cb(err);
          if(applications[0].status === 'approved' && !_.isEmpty(profile.parents)) {
            async.each(profile.parents, function (parent, cb) {
              payload.to = parent.email;
              seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
            }, cb);
          } else {
            return cb();
          }
        });
      }, function (err) {
        if(err) return done(err);
        return done(null, applications);
      });
    }
  }
}

module.exports = bulkApplyApplications;