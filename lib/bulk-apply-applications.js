'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');
var CpTranslations = require('cp-translations');
var I18NHelper = require('cp-i18n-lib');
var i18nHelper = new I18NHelper({
  poFilePath: CpTranslations.getPoFilePath(),
  poFileName: 'messages.po',
  domain: 'coder-dojo-platform'
});

function bulkApplyApplications (args, callback) {
  var seneca = this;
  var sendQueue = seneca.export('queues/queue')['sendQueue'];
  var plugin = args.role;
  var requestingUser = args.user;
  var applications = args.applications;
  var applicationUserIds = _.map(applications, function (application) {
    return application.userId;
  });
  var updateAction = applications[0].updateAction || '';
  delete applications[0].updateAction;
  var locality = args.locality || 'en_US';
  var eventDateFormat = 'Do MMMM YY';
  var emailSubjectData = applications[0].emailSubject || {};
  delete applications[0].emailSubject;
  var dojoEmailSubjectData = applications[0].dojoEmailSubject || {};
  delete applications[0].dojoEmailSubject;
  var parentEmailSubjectData = applications[0].parentEmailSubject || {};
  delete applications[0].parentEmailSubject;
  var eventData;
  var protocol = process.env.PROTOCOL || 'http';
  var zenHostname = process.env.HOSTNAME || '127.0.0.1:8000';
  if (_.isEmpty(applications)) return callback(null, {error: 'args.applications is empty'});

  async.waterfall([
    loadValidationData,
    validateIsSelf,
    validateIsParentOf,
    validateIsTicketingAdmin,
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
    if (updateAction === 'checkin') return done(null, applications);
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
      //for each application, carry out this function
      async.map(applications, function (application, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'load_user_profile', userId: application.userId}, function (err, profile) {
          if (err) return cb(err);
          return cb(null, profile);
        });
      }, done);
    }

    function retrieveParentsForUsers (profiles, done) {
      //for each profile, carry out this function
      async.map(profiles, function(profile, cb) {
        //if this profile has parents to load
        if (profile.parents) {
          //load the parents of this profile and assign them to the profile
          seneca.act({role: 'cd-profiles', cmd: 'load_parents_for_user', userId: profile.userId, user: args.user}, function(err, parents) {
            if (err) return done(err);
            profile.parents = parents;
            return cb(null, profile);
          });
        } else {
          return cb(null, profile);
        }
      }, done);
    }

    function retrieveEventAndSessionData (profiles, done) {
      profiles = _.uniq(profiles, function (profile) { return profile.id; });
      seneca.act({role: plugin, cmd: 'searchSessions', query: {id: applications[0].sessionId}}, function (err, sessions) {
        if (err) return done(err);
        return done(null, profiles, eventData, sessions[0]);
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
            return done(new Error('Email type not handled for update of applications'));

        }
        return done(null, profiles, event, session, dojo, tickets, emailCode, dojoEmailCode);
      });
    }

    //handles creation of payloads and passes them on for sending
    function sendEmails(profiles, event, session, dojo, tickets, emailCode, dojoEmailCode, done) {
      var emailSubject, emailIntro, eventDate;
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
          status: applications[0].status,
          eventDate: eventDate,
          cancelLinkBase: protocol + '://' + zenHostname + '/dashboard/cancel_session_invitation'
        }
      };
      async.parallel([
        //Send applicant emails
        function sendApplicantsEmail (sendApplicantsCallback) {
          emailSubject = emailSubjectData[applications[0].status];
          //set email intro based on application status
          if (applications[0].status === 'pending') {
            emailIntro = 'This is a notification to let you know that your request for a ticket for the below event has been received. Once your request has been approved you will receive your ticket confirmation by email.';
          } else if (applications[0].status === 'approved') {
            emailIntro = 'This is your order confirmation for the below event.';
          } else if (applications[0].status === 'cancelled') {
            emailIntro = 'Your ticket has been cancelled for the below event.';
          }
          async.each(profiles, function (profile, profileCb) {
            //get the application related to the current profile
            var currentApplication = _.find(applications, function(application) {
              return application.userId === profile.userId;
            })
            //email payload changes for applicants
            var payloadChanges = {
              to: profile.email || null,
              code: emailCode,
              subject: emailSubject,
              from: dojo.name+' <'+dojo.email+'>',
              content: {
                tickets: tickets,
                applicantName: profile.name,
                applicationId: currentApplication.id ? currentApplication.id : null,
                intro: emailIntro
              }
            };
            //create the payload for the applicant
            var payload = _.merge(payloadChanges, commonPayload);
            //If this applicant has no email of their own
            if (!profile.email) {
              //move to next applicant
              return profileCb();
            }
            //queue email for sending
            sendQueue({cmd: 'enqueue', name: 'bulk-apply-applications-kue', msg: _.clone({role: 'cd-dojos', cmd: 'send_email', payload: payload})}, profileCb);
          }, sendApplicantsCallback);
        },
        //Send notification email to the dojo
        function sendDojoEmail (sendDojoCallback) {
          //if email notifications are enabled for the event, send an email to the dojo
          if (eventData.notifyOnApplicant) {
            //if the requesting user is a ticketing admin, we don't send the email
            seneca.act({role: 'cd-events', cmd: 'is_ticketing_admin', user: requestingUser, eventInfo: {dojoId: event.dojoId}}, function (err, res) {
              if (res.allowed) {
                return sendDojoCallback();
              }
              //subject for email to send to the dojo
              emailSubject = dojoEmailSubjectData[applications[0].status];
              //email payload changes for dojo
              var payloadChanges = {
                to: dojo.email || null,
                code: dojoEmailCode,
                subject: emailSubject,
                from: 'The CoderDojo Team <info@coderdojo.org>',
                content: {
                  tickets: tickets,
                  dojoName: dojo.name,
                  dojoId: event.dojoId,
                  eventId: applications[0].eventId,
                  applicationsLinkBase: protocol + '://' + zenHostname + '/dashboard/my-dojos'
                }
              };
              //create the payload for the dojo
              var dojoPayload = _.merge(payloadChanges, commonPayload);
              //queue email for sending
              sendQueue({cmd: 'enqueue', name: 'bulk-apply-applications-kue', msg: _.clone({role: 'cd-dojos', cmd: 'send_email', payload: dojoPayload})}, sendDojoCallback);
            });
          } else {
            return sendDojoCallback();
          }
        },
        //send email to parents about all applied children
        function sendParentsEmail (sendParentsCallback) {
          emailSubject = parentEmailSubjectData[applications[0].status];
          var parent, parentName, parentEmail;
          //store all profiles which have parents (child profiles)
          var profilesWithParents = _.filter(profiles, function(profile) {return !_.isEmpty(profile.parents)});
          //store their names
          var childrensNames = _.map(profilesWithParents, 'name');
          //store all parent profiles of these children
          var parentProfiles = _.find(_.map(profilesWithParents, 'parents'));
          //take the name and email of the first parent
          if (parentProfiles) {
            parentName = parentProfiles[0].name;
            parentEmail = parentProfiles[0].email;
          }
          //set email intro based on application status
          if (applications[0].status === 'pending') {
            emailIntro = i18nHelper.getClosestTranslation(locality, 'This is a notification to let you know that a request for a ticket for the below event has been received for your child %1s. Once the request has been approved they will receive their ticket confirmation by email.');
            emailIntro = emailIntro.ifPlural(childrensNames.length, 'This is a notification to let you know that requests for tickets for the below event have been received for your children %1s. Once the requests has been approved they will receive their ticket confirmations by email.').fetch([childrensNames.join(', ')]);
          } else if (applications[0].status === 'approved') {
            emailIntro = i18nHelper.getClosestTranslation(locality, 'This is an order confirmation for your child %1s for the below event.');
            emailIntro = emailIntro.ifPlural(childrensNames.length, 'This is an order confirmation for your children %1s for the below event.').fetch([childrensNames.join(', ')]);
          } else if (applications[0].status === 'cancelled') {
            emailIntro = i18nHelper.getClosestTranslation(locality, 'A ticket for your child %1s for the below event has been cancelled.');
            emailIntro = emailIntro.ifPlural(childrensNames.length, 'Tickets for your children %1s for the below event have been cancelled.').fetch([childrensNames.join(', ')]);
          }
          //email payload changes for parents
          var payloadChanges = {
            to: parentEmail || null,
            code: emailCode,
            subject: emailSubject,
            from: dojo.name+' <'+dojo.email+'>',
            tickets: tickets,
            content: {
              tickets: tickets,
              applicantName: parentName || null,
              intro: emailIntro,
              applicationId: null
            }
          };
          //create the payload for the parent email
          var parentPayload = _.merge(payloadChanges, commonPayload);
          //queue email for sending
          sendQueue({cmd: 'enqueue', name: 'bulk-apply-applications-kue', msg: _.clone({role: 'cd-dojos', cmd: 'send_email', payload: parentPayload})}, sendParentsCallback);
        }],
        //final callback
        function() {
          done(null, applications);
      });
    }
  }
}

module.exports = bulkApplyApplications;
