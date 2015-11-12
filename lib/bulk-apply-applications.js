'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function bulkApplyApplications (args, callback) {
  var seneca = this;
  var plugin = args.role;
  var requestingUser = args.user;
  var applications = args.applications;
  var updateAction = applications[0].updateAction || '';
  delete applications[0].updateAction;
  var locality = args.locality || 'en_US';
  var eventDateFormat = 'Do MMMM YY';
  var emailSubjectData = applications[0].emailSubject || {};
  delete applications[0].emailSubject;
  var eventData;
  if (_.isEmpty(applications)) return callback(null, {error: 'args.applications is empty'});

  async.waterfall([
    loadValidationData,
    validateRequest,
    validateTicketsAvailable,
    loadEvent,
    saveApplications,
    generateEmailContent
  ], function (err, applications) {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, applications);
  });

  function loadValidationData (done) {
    if (!updateAction) return done();
    seneca.act({role: plugin, cmd: 'loadApplication', id: applications[0].id}, function (err, application) {
      if (err) return done(err);
      seneca.act({role: plugin, cmd: 'getEvent', id: application.eventId}, function (err, event) {
        if (err) return done(err);
        eventData = event;
        return done();
      });
    });
  }

  function validateRequest (done) {
    if (!updateAction) return done();
    seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query: {userId: requestingUser.id, dojoId: eventData.dojoId}}, function (err, usersDojos) {
      if (err) return done(err);
      var userDojo = usersDojos[0];
      var isTicketingAdmin = _.find(userDojo.userPermissions, function (userPermission) {
        return userPermission.name === 'ticketing-admin';
      });
      if (!isTicketingAdmin) return done(new Error('You must be a ticketing admin of this Dojo to update applications.'));
      return done();
    });
  }

  function validateTicketsAvailable (done) {
    seneca.act({role: plugin, cmd: 'searchTickets', query: {sessionId: applications[0].sessionId, deleted: 0}}, function (err, tickets) {
      if (err) return done(err);
      _.each(applications, function(application, cb) {
        var available = _.find(tickets, function(ticket) {
          var ticketAvailable = (ticket.quantity - ticket.totalApplications) > 0;
          return (ticket.id == application.ticketId) && ticketAvailable;
        });
        if(!available) return done(new Error('There are no tickets of that type available at this time.'));
      });
      return done();
    });
  }

  function loadEvent (done) {
    if (!_.isEmpty(eventData)) return done();
    seneca.act({role: plugin, cmd: 'getEvent', id: applications[0].eventId}, function (err, event) {
      if (err) return done(err);
      eventData = event;
      return done();
    });
  }

  function saveApplications (done) {
    async.map(applications, function (application, cb) {
      if (!updateAction) {
        ensureApplicationIsUnique(cb);
      } else {
        saveApplication(cb);
      }

      function ensureApplicationIsUnique (cb) {
        seneca.act({role: plugin, cmd: 'searchApplications', query: {sessionId: application.sessionId, userId: application.userId}}, function (err, applications) {
          if (err) return cb(err);
          if (applications.length > 0) {
            var ticketFound = _.find(applications, function (applicationFound) {
              return applicationFound.ticketId === application.ticketId && !applicationFound.deleted;
            });
            if (ticketFound) return cb();
          }
          return saveApplication(cb);
        });
      }

      function saveApplication (cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
          if (err) return cb(err);
          if (_.isEmpty(profiles)) return cb();
          var userProfile = profiles[0];
          application.name = userProfile.name;
          application.dateOfBirth = userProfile.dob;
          if (!application.status) (eventData.ticketApproval) ? application.status = 'pending' : application.status = 'approved';
          seneca.act({role: plugin, cmd: 'saveApplication', application: application}, cb);
        });
      }
    }, done);
  }

  function generateEmailContent (applications, done) {
    applications = _.compact(applications);
    if (_.isEmpty(applications)) return done(null, applications);
    if (updateAction === 'disapprove' || updateAction === 'checkin' || updateAction === 'delete') return done(null, applications);
    async.waterfall([
      retrieveProfiles,
      retrieveParentsForUser,
      retrieveEventAndSessionData,
      retrieveDojoData,
      retrieveTicketsData,
      sendEmail
    ], function (err, res) {
      if (err) return done(err);
      return done(null, applications);
    });

    function retrieveProfiles (done) {
      async.map(applications, function (application, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
          if (err) return cb(err);
          var profile = profiles[0];
          return cb(null, profile);
        });
      }, done);
    }

    function retrieveParentsForUser (profiles, done) {
      if (applications[0].status !== 'approved') return done(null, profiles);
      seneca.act({role: 'cd-profiles', cmd: 'load_parents_for_user', userId: profiles[0].userId}, function (err, parents) {
        if (err) return done(err);
        profiles[0].parents = parents;
        return done(null, profiles);
      });
    }

    function retrieveEventAndSessionData (profiles, done) {
      profiles = _.uniq(profiles, function (profile) { return profile.id; });
      seneca.act({role: plugin, cmd: 'getEvent', id: applications[0].eventId}, function (err, event) {
        if (err) return done(err);
        seneca.act({role: plugin, cmd: 'searchSessions', query: {id: applications[0].sessionId}}, function (err, sessions) {
          if (err) return done(err);
          return done(null, profiles, event, sessions[0]);
        });
      });
    }

    function retrieveDojoData (profiles, event, session, done) {
      seneca.act({role: 'cd-dojos', cmd: 'load', id: event.dojoId}, function (err, dojo) {
        if (err) return done(err);
        return done(null, profiles, event, session, dojo);
      });
    }

    function retrieveTicketsData (profiles, event, session, dojo, done) {
      async.map(applications, function (application, cb) {
        return cb(null, {ticketId: application.ticketId, ticketName: application.ticketName, ticketType: application.ticketType});
      }, function (err, tickets) {
        if (err) return done(err);
        var ticketQuantities = _.countBy(tickets, function (ticket) { return ticket.ticketId; });
        _.each(tickets, function (ticket) {
          ticket.quantity = ticketQuantities[ticket.ticketId];
        });
        tickets = _.uniq(tickets, function (ticket) { return ticket.ticketId; });
        var emailCode;
        (applications[0].status === 'pending') ? emailCode = 'ticket-application-received-' : emailCode = 'ticket-application-approved-';
        return done(null, profiles, event, session, dojo, tickets, emailCode);
      });
    }

    function sendEmail (profiles, event, session, dojo, tickets, emailCode, done) {
      process.nextTick(function () {
        var emailSubject;
        (emailCode === 'ticket-application-received-') ? emailSubject = emailSubjectData.request + ' ' + event.name + ' ' + emailSubjectData.received : emailSubject = emailSubjectData.request + ' ' + event.name + ' ' + emailSubjectData.approved;
        async.eachSeries(profiles, function (profile, cb) {
          var eventDate;
          var firstDate = _.first(event.dates);
          var lastDate = _.last(event.dates);
          var startTime = moment.utc(firstDate.startTime).format('HH:mm');
          var endTime = moment.utc(firstDate.endTime).format('HH:mm');
          if (event.type === 'recurring') {
            eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' - ' + moment.utc(lastDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
          } else {
            eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
          }

          var payload = {
            to: profile.email || null,
            code: emailCode,
            subject: emailSubject,
            locality: locality,
            content: {
              applicantName: profile.name,
              event: event,
              dojo: dojo,
              applicationDate: moment.utc(applications[0].created).format(eventDateFormat),
              sessionName: session.name,
              tickets: tickets,
              status: applications[0].status,
              eventDate: eventDate
            }
          };

          if (!profile.email) return emailParents(cb);
          seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, function (err, res) {
            if (err) return cb(err);
            if (applications[0].status === 'approved' || applications[0].status === 'pending') {
              emailParents(cb);
            } else {
              return cb();
            }
          });

          function emailParents (cb) {
            if (_.isEmpty(profile.parents)) return cb();
            var parentsEmailed = [];
            async.eachSeries(profile.parents, function (parent, cb) {
              if (!_.isObject(parent)) {
                seneca.act({role: 'cd-users', cmd: 'load', id: parent, user: requestingUser}, function (err, parentUser) {
                  if (err) return cb(err);
                  payload.to = parentUser.email;
                  if (!_.contains(parentsEmailed, payload.to) && payload.to !== profile.email) {
                    parentsEmailed.push(payload.to);
                    seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
                  } else {
                    return cb();
                  }
                });
              } else {
                payload.to = parent.email;
                if (!_.contains(parentsEmailed, payload.to) && payload.to !== profile.email) {
                  parentsEmailed.push(payload.to);
                  seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
                } else {
                  return cb();
                }
              }
            }, cb);
          }
        });
      });
      return done(null, applications);
    }
  }
}

module.exports = bulkApplyApplications;
