'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function bulkApplyApplications (args, callback) {
  var seneca = this;
  var plugin = args.role;
  var requestingUser = args.user;
  var applications = args.applications;
  var applicationUserIds = _.map(applications, function (application) {
    return application.userId;
  });
  var available = false;
  var updateAction = applications[0].updateAction || '';
  var ticketsAvailable = false;
  delete applications[0].updateAction;
  var locality = args.locality || 'en_US';
  var eventDateFormat = 'Do MMMM YY';
  var emailSubjectData = applications[0].emailSubject || {};
  delete applications[0].emailSubject;
  var dojoEmailSubjectData = applications[0].dojoEmailSubject || {};
  delete applications[0].dojoEmailSubject;
  var eventData;
  var protocol = process.env.PROTOCOL || 'http';
  var zenHostname = process.env.HOSTNAME || '127.0.0.1:8000';
  if (_.isEmpty(applications)) return callback(null, {error: 'args.applications is empty'});

  async.waterfall([
    loadValidationData,
    validateIsSelf,
    validateIsParentOf,
    validateIsTicketingAdmin,
    validateTicketsAvailable,
    loadEvent,
    saveApplications,
    generateEmailContent
  ], function (err, applications) {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, applications);
  });

  function loadValidationData (done) {
    seneca.act({role: plugin, cmd: 'getEvent', id: applications[0].eventId}, function (err, event) {
      if (err) return done(err);
      eventData = event;
      return done();
    });
  }

  function validateIsSelf (done) {
    if (applicationUserIds.length === 1 && applicationUserIds[0] === requestingUser.id) {
      return done(null, true);
    } else {
      return done(null, false);
    }
  }

  function validateIsParentOf(isSelf, done) {
    if (isSelf === true) {
      return done(null, true);
    }
    //  Could also check the opposite way, from child to Parent
    seneca.act({role: 'cd-profiles', cmd: 'load_user_profile', userId: requestingUser.id},
      function(err, user){
        if(err) return done(null, false);
        var childIds = _.filter(applicationUserIds, function (applicationUserId) {
          return applicationUserId !== requestingUser.id;
        });
        async.every(childIds, function (applicationUserId, everyCb) {
          seneca.act({role: 'cd-users', cmd: 'is_parent_of', user: requestingUser,
            params: {userId: applicationUserId}}, function (err, allowed) {
              if (err) return everyCb(false);
              everyCb(allowed.allowed);
            });
        }, function (allowed) {
          done(null, allowed);
        });
      }
    );
  }

  function validateIsTicketingAdmin (isSelfOrParent, done) {
    if (isSelfOrParent === true) {
      return done();
    } else {
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
  }

  function validateTicketsAvailable (done) {
    seneca.act({role: plugin, cmd: 'searchTickets', query: {sessionId: applications[0].sessionId, deleted: 0}}, function (err, tickets) {
      if (err) return done(err);

      _.each(applications, function (application, cb) {
        available = _.find(tickets, function (ticket) {
          if(application.ticketId === ticket.id) {
            var ticketsAvailable = (ticket.quantity - applications.length) > 0;
          }

          return ticketsAvailable;
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
    if(!available) {
      return done(null, applications);
    }

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
          if (application.deleted) {
            application.status = 'cancelled';
          }
          seneca.act({role: plugin, cmd: 'saveApplication', application: application}, cb);
        });
      }
    }, done);
  }

  function generateEmailContent (applications, done) {
    applications = _.compact(applications);
    if (_.isEmpty(applications)) return done(null, applications);
    if (updateAction === 'disapprove' || updateAction === 'checkin' || !available) return done(null, applications);
    async.waterfall([
      retrieveProfiles,
      retrieveParentsForUsers,
      retrieveEventAndSessionData,
      retrieveDojoData,
      retrieveTicketsData,
      sendEmails
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

    function retrieveParentsForUsers (profiles, done) {
      if (applications[0].status !== 'approved') return done(null, profiles);
      seneca.act({role: 'cd-profiles', cmd: 'load_parents_for_user', userId: profiles[0].userId, user: args.user}, function (err, parents) {
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
        var emailCode, dojoEmailCode;
        //load code for emails based on application status
        switch (applications[0].status) {
          case 'pending':
            emailCode = 'ticket-application-received-';
            dojoEmailCode = 'ticket-application-received-to-dojo-';
            break;
          case 'approved':
            emailCode = 'ticket-application-approved-';
            dojoEmailCode = 'ticket-application-approved-to-dojo-';
            break;
          case 'cancelled':
            emailCode = 'ticket-application-cancelled-';
            break;

          default:
            done(new Error('Email type not handled for update of applications'));

        }
        return done(null, profiles, event, session, dojo, tickets, emailCode, dojoEmailCode);
      });
    }

    //handles creation of payloads and passes them on for sending
    function sendEmails(profiles, event, session, dojo, tickets, emailCode, dojoEmailCode, done) {
      var emailSubject, eventDate;
      var iterator = 0;
      //set event date information
      var firstDate = _.first(event.dates);
      var lastDate = _.last(event.dates);
      var startTime = moment.utc(firstDate.startTime).format('HH:mm');
      var endTime = moment.utc(firstDate.endTime).format('HH:mm');
      if (event.type === 'recurring') {
        eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' - ' + moment.utc(lastDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
      } else {
        eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
      }
      //common payload
      var commonPayload = {
        subjectVariables: [event.name],
        locality: locality,
        replyTo: dojo.email,
        content: {
          event: event,
          dojo: dojo,
          applicationDate: moment.utc(applications[0].created).format(eventDateFormat),
          sessionName: session.name,
          tickets: tickets,
          status: applications[0].status,
          applicationId: applications[iterator] ? applications[iterator].id : null,
          eventDate: eventDate,
          cancelLinkBase: protocol + '://' + zenHostname + '/dashboard/cancel_session_invitation'
        }
      };
      async.parallel([
        //Send parent and child emails
        function sendApplicantsEmail () {
          process.nextTick(function () {
            emailSubject = emailSubjectData[applications[0].status];
            async.eachSeries(profiles, function (profile, cb) {
              //email payload changes for applicants
              var payloadChanges = {
                to : profile.email || null,
                code : emailCode,
                subject : emailSubject,
                from : dojo.name+' <'+dojo.email+'>',
                content : {
                  applicantName : profile.name
                }
              };
              var payload = _.merge(payloadChanges, commonPayload);
              iterator++;
              if (!profile.email) return emailParents(cb);
              seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, function (err, res) {
                if (err) return cb(err);
                if (applications[0].status === 'approved' || applications[0].status === 'pending' || applications[0].status === 'cancelled' ) {
                  emailParents(cb);
                } else {
                  return cb();
                }
              });
              //email the parent email address
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
                        //send the email
                        seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
                      } else {
                        return cb();
                      }
                    });
                  } else {
                    payload.to = parent.email;
                    if (!_.contains(parentsEmailed, payload.to) && payload.to !== profile.email) {
                      parentsEmailed.push(payload.to);
                      //send the email
                      seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
                    } else {
                      return cb();
                    }
                  }
                }, cb);
              }
            });
          });
        },
        //Send notification email to the dojo
        function sendDojoEmail () {
          process.nextTick(function () {
            //if email notifications are enabled for the event, send an email to the dojo
            if (eventData.emailNotifications) {
              //subject for email to send to the dojo
              emailSubject = dojoEmailSubjectData[applications[0].status];
              //email payload changes for dojo
              var payloadChanges = {
                to : dojo.email || null,
                code : dojoEmailCode,
                subject : emailSubject,
                from : 'The CoderDojo Team <info@coderdojo.org>',
                content : {
                  dojoName: dojo.name
                }
              };
              var dojoPayload = _.merge(payloadChanges, commonPayload);
              //send the dojo email
              seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: dojoPayload}, function (err, res) {
                if (err) {
                  return err;
                } else {
                  return res;
                }
              });
            }
          });
        }],
      done(null, applications));
    }
  }
}

module.exports = bulkApplyApplications;
