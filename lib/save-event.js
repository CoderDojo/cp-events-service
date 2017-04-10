'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function saveEvent (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';

  var eventInfo = args.eventInfo;
  var plugin = args.role;
  var locality = args.locality || 'en_US';
  var protocol = process.env.PROTOCOL || 'http';
  var zenHostname = process.env.HOSTNAME || '127.0.0.1:8000';
  var user = args.user;
  var eventDateFormat = 'Do MMMM YY';
  var emailSubject;
  var eventSaved;

  async.waterfall([
    saveEvent,
    saveSessions,
    removeDeletedTickets,
    emailInvitedMembers
  ], function (err, res) {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, eventSaved);
  });

  function saveEvent (done) {
    if (eventInfo.sessions && eventInfo.sessions.length > 20) return callback(new Error('You can only create a max of 20 sessions/rooms'));
    var maxTicketTypesExceeded = _.find(eventInfo.sessions, function (session) {
      return session.tickets.length > 20;
    });
    if (maxTicketTypesExceeded) return callback(new Error('You can only create a max of 20 ticket types'));

    var newEvent = {
      address: eventInfo.address,
      city: eventInfo.city,
      country: eventInfo.country,
      createdAt: new Date(),
      createdBy: eventInfo.userId,
      description: eventInfo.description,
      dojoId: eventInfo.dojoId,
      name: eventInfo.name,
      position: eventInfo.position,
      public: eventInfo.public,
      status: eventInfo.status,
      type: eventInfo.type,
      recurringType: eventInfo.recurringType,
      ticketApproval: eventInfo.ticketApproval,
      emailNotifications: eventInfo.emailNotifications
    };

    if (eventInfo.id) { // Check if this is an update.
      newEvent.id = eventInfo.id;
    }

    if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
      var err = new Error('Dates must be specified');
      return done(err);
    }

    var pastDateFound = _.find(eventInfo.dates, function (date) {
      var utcOffset = moment().utcOffset();
      return moment.utc(date.startTime).subtract(utcOffset, 'minutes').diff(moment.utc(), 'minutes') < 0;
    });

    if (pastDateFound && !eventInfo.id) return done(new Error('Past events cannot be created'));

    newEvent.dates = eventInfo.dates;

    if (eventInfo.emailSubject) {
      emailSubject = eventInfo.emailSubject;
      delete eventInfo.emailSubject;
    }

    var eventEntity = seneca.make$(ENTITY_NS);
    eventEntity.save$(newEvent, done);
  }

  function saveSessions (event, done) {
    eventSaved = event;
    if (_.isEmpty(eventInfo.sessions)) return setImmediate(function () { return done(null, event); });
    function removeDeletedSessions (done) {
      seneca.act({role: plugin, cmd: 'searchSessions', query: {eventId: event.id}}, function (err, existingSessions) {
        if (err) return done(err);
        async.each(existingSessions, function (existingSession, cb) {
          var sessionFound = _.find(eventInfo.sessions, function (session) {
            return existingSession.id === session.id;
          });
          if (!sessionFound) {
            return seneca.act({role: plugin, cmd: 'cancelSession', session: existingSession, locality: locality, user: user}, cb);
          } else {
            return cb();
          }
        }, done);
      });
    }

    function saveNewSessions (done) {
      async.map(eventInfo.sessions, function (session, cb) {
        session.eventId = event.id;
        if (event.status === 'cancelled') {
          session.emailSubject = emailSubject;
          seneca.act({role: plugin, cmd: 'cancelSession', session: session, locality: locality, user: user}, cb);
        } else {
          session.eventId = event.id;
          session.status = 'active';
          var sessionToSave = _.clone(session);
          delete sessionToSave.tickets;
          seneca.act({role: plugin, cmd: 'saveSession', session: sessionToSave}, function (err, savedSession) {
            if (err) return cb(err);
            async.each(session.tickets, function (ticket, cb) {
              ticket.sessionId = savedSession.id;
              seneca.act({role: plugin, cmd: 'saveTicket', ticket: ticket}, cb);
            }, function (err) {
              if (err) return cb(err);
              return cb(null, savedSession);
            });
          });
        }
      }, done);
    }

    async.series([
      removeDeletedSessions,
      saveNewSessions
    ], done);
  }

  function removeDeletedTickets (sessions, done) {
    sessions = _.chain(sessions).compact().flatten().value();
    async.each(sessions, function (savedSession, cb) {
      if (!savedSession) return setImmediate(cb);
      seneca.act({role: plugin, cmd: 'searchSessions', query: {id: savedSession.id}}, function (err, sessions) {
        if (err) return cb(err);
        var session = sessions[0];
        async.each(session.tickets, function (existingTicket, cb) {
          var ticketFound = _.find(eventInfo.sessions, function (session) {
            return _.find(session.tickets, function (ticket) {
              if (ticket.id) return existingTicket.id === ticket.id;
              return true;
            });
          });
          if (!ticketFound) {
            existingTicket.deleted = 1;
            return seneca.act({role: plugin, cmd: 'saveTicket', ticket: existingTicket}, cb);
          } else {
            return cb();
          }
        }, cb);
      });
    }, function (err) {
      if (err) return done(err);
      return done(null, sessions);
    });
  }

  function emailInvitedMembers (sessions, done) {
    if (eventInfo.status !== 'published') return setImmediate(function () { return done(null, eventSaved); });
    if (_.isEmpty(sessions)) return setImmediate(function () { return done(null, eventSaved); });
    process.nextTick(function () {
      async.each(sessions, function (session, cb) {
        seneca.act({role: plugin, cmd: 'searchSessions', query: {id: session.id}}, function (err, sessions) {
          if (err) return cb(err);
          var session = sessions[0];
          async.each(session.tickets, function (ticket, cb) {
            if (ticket.deleted === 1) return cb();
            if (_.isEmpty(ticket.invites)) return cb();
            async.eachSeries(ticket.invites, function (invite, cb) {
              if (invite.userNotified) return cb();
              return emailInvitedUser(session, ticket, invite, cb);
            }, cb);
          }, cb);
        });
      });

      function emailInvitedUser (session, ticket, invite, cb) {
        function sendEmail (cb) {
          seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: invite.userId}}, function (err, userProfiles) {
            if (err) return cb(err);
            var profile = userProfiles[0];
            seneca.act({role: 'cd-dojos', cmd: 'load', id: eventSaved.dojoId}, function (err, dojo) {
              if (err) return cb(err);
              var eventDate;
              var firstDate = _.first(eventSaved.dates);
              var lastDate = _.last(eventSaved.dates);
              var startTime = moment.utc(firstDate.startTime).format('HH:mm');
              var endTime = moment.utc(firstDate.endTime).format('HH:mm');
              if (eventSaved.type === 'recurring') {
                eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' - ' + moment.utc(lastDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
              } else {
                eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
              }

              var payload = {
                to: profile.email || null,
                replyTo: dojo.email || null,
                code: 'invited-to-session-',
                subject: 'You have been invited to a Dojo session',
                locality: locality,
                content: {
                  applicantName: profile.name,
                  event: eventSaved,
                  dojo: dojo,
                  sessionName: session.name,
                  ticket: ticket,
                  eventDate: eventDate,
                  inviteLink: protocol + '://' + zenHostname + '/dashboard/accept_session_invitation/' + ticket.id + '/' + invite.userId
                }
              };

              if (!profile.email) return emailParents(cb);
              seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, function (err, res) {
                if (err) return cb(err);
                return emailParents(cb);
              });

              function emailParents (cb) {
                if (_.isEmpty(profile.parents)) return cb();
                var parentsEmailed = [];
                async.eachSeries(profile.parents, function (parent, cb) {
                  if (!_.isObject(parent)) {
                    seneca.act({role: 'cd-users', cmd: 'load', id: parent, user: user}, function (err, parentUser) {
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
        }

        function updateInvite (cb) {
          var invites = ticket.invites;
          var updatedInvite = {
            userId: invite.userId,
            userNotified: true
          };
          invites = _.without(invites, _.findWhere(invites, {userId: invite.userId}));
          invites.push(updatedInvite);
          ticket.invites = invites;
          seneca.act({role: plugin, cmd: 'saveTicket', ticket: ticket}, cb);
        }

        async.series([
          sendEmail,
          updateInvite
        ], cb);
      }
    });
    return done(null, eventSaved);
  }
}
module.exports = saveEvent;
