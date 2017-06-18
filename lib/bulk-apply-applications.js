'use strict';

const async = require('async');
const _ = require('lodash');
const moment = require('moment');
const CpTranslations = require('cp-translations');
const I18NHelper = require('cp-i18n-lib');
const i18nHelper = new I18NHelper({
  poFilePath: CpTranslations.getPoFilePath(),
  poFileName: 'messages.po',
  domain    : 'coder-dojo-platform',
});

function bulkApplyApplications (args, callback) {
  const seneca = this;
  const sendQueue = seneca.export('queues/queue')['sendQueue'];
  const plugin = args.role;
  const requestingUser = args.user;
  const applications = args.applications;
  const applicationUserIds = _.map(applications, (application) => {
    return application.userId;
  });
  const available = false;
  const updateAction = applications[0].updateAction || '';
  delete applications[0].updateAction;
  const locality = args.locality || 'en_US';
  const eventDateFormat = 'Do MMMM YY';
  const emailSubjectData = applications[0].emailSubject || {};
  delete applications[0].emailSubject;
  const dojoEmailSubjectData = applications[0].dojoEmailSubject || {};
  delete applications[0].dojoEmailSubject;
  const parentEmailSubjectData = applications[0].parentEmailSubject || {};
  delete applications[0].parentEmailSubject;
  let eventData;
  const protocol = process.env.PROTOCOL || 'http';
  const zenHostname = process.env.HOSTNAME || '127.0.0.1:8000';
  if (_.isEmpty(applications)) return callback(null, {error: 'args.applications is empty'});

  async.waterfall([
    loadValidationData,
    validateIsSelf,
    validateIsParentOf,
    validateIsTicketingAdmin,
    saveApplications,
    generateEmailContent,
  ], (err, applications) => {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, applications);
  });

  function loadValidationData (done) {
    seneca.act({role: plugin, cmd: 'getEvent', id: applications[0].eventId}, (err, event) => {
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
    seneca.act({role: 'cd-profiles', cmd: 'load_user_profile', userId: requestingUser.id}, (err) => {
      if(err) return done(null, false);
      const childIds = _.filter(applicationUserIds, (applicationUserId) => {
        return applicationUserId !== requestingUser.id;
      });
      async.every(childIds, (applicationUserId, everyCb) => {
        seneca.act({role  : 'cd-users', cmd   : 'is_parent_of', user  : requestingUser,
          params: {userId: applicationUserId}}, (err, allowed) => {
          if (err) return everyCb(false);
          everyCb(allowed.allowed);
        });
      }, (allowed) => {
        done(null, allowed);
      });
    });
  }

  function validateIsTicketingAdmin (isSelfOrParent, done) {
    if (isSelfOrParent === true) {
      return done();
    } else {
      seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query: {userId: requestingUser.id, dojoId: eventData.dojoId}}, (err, usersDojos) => {
        if (err) return done(err);
        const userDojo = usersDojos[0];
        const isTicketingAdmin = _.find(userDojo.userPermissions, (userPermission) => {
          return userPermission.name === 'ticketing-admin';
        });
        if (!isTicketingAdmin) return done(new Error('You must be a ticketing admin of this Dojo to update applications.'));
        return done();
      });
    }
  }

  function saveApplications (done) {
    async.map(applications, (application, cb) => {
      if (!updateAction) {
        ensureApplicationIsUnique(cb);
      } else {
        saveApplication(cb);
      }

      function ensureApplicationIsUnique (cb) {
        seneca.act({role: plugin, cmd: 'searchApplications', query: {sessionId: application.sessionId, userId: application.userId}}, (err, applications) => {
          if (err) return cb(err);
          if (applications.length > 0) {
            const ticketFound = _.find(applications, (applicationFound) => {
              return applicationFound.ticketId === application.ticketId && !applicationFound.deleted;
            });
            if (ticketFound) return cb();
          }
          return saveApplication(cb);
        });
      }

      function saveApplication (cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, (err, profiles) => {
          if (err) return cb(err);
          if (_.isEmpty(profiles)) return cb();
          const userProfile = profiles[0];
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
      sendEmail,
    ], (err) => {
      if (err) return done(err);
      return done(null, applications);
    });

    function retrieveProfiles (done) {
      async.map(applications, (application, cb) => {
        seneca.act({role: 'cd-profiles', cmd: 'load_user_profile', userId: application.userId}, (err, profile) => {
          if (err) return cb(err);
          return cb(null, profile);
        });
      }, done);
    }

    function retrieveParentsForUsers (profiles, done) {
      //for each profile, carry out this function
      async.map(profiles, (profile, cb) => {
        //if this profile has parents to load
        if (profile.parents) {
          //load the parents of this profile and assign them to the profile
          seneca.act({role: 'cd-profiles', cmd: 'load_parents_for_user', userId: profile.userId, user: args.user}, (err, parents) => {
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
      profiles = _.uniq(profiles, (profile) => { return profile.id; });
      seneca.act({role: plugin, cmd: 'searchSessions', query: {id: applications[0].sessionId}}, (err, sessions) => {
        if (err) return done(err);
        return done(null, profiles, eventData, sessions[0]);
      });
    }

    function retrieveDojoData (profiles, event, session, done) {
      seneca.act({role: 'cd-dojos', cmd: 'load', id: event.dojoId}, (err, dojo) => {
        if (err) return done(err);
        return done(null, profiles, event, session, dojo);
      });
    }

    function retrieveTicketsData (profiles, event, session, dojo, done) {
      async.map(applications, (application, cb) => {
        return cb(null, {ticketId: application.ticketId, ticketName: application.ticketName, ticketType: application.ticketType});
      }, (err, tickets) => {
        if (err) return done(err);
        const ticketQuantities = _.countBy(tickets, (ticket) => { return ticket.ticketId; });
        _.each(tickets, (ticket) => {
          ticket.quantity = ticketQuantities[ticket.ticketId];
        });
        tickets = _.uniq(tickets, (ticket) => { return ticket.ticketId; });
        let emailCode, dojoEmailCode;
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

    // Handles creation of payloads and passes them on for sending
    function sendEmails(profiles, event, session, dojo, tickets, emailCode, dojoEmailCode, done) {
      let emailSubject, emailIntro, eventDate;
      //set event date information
      const firstDate = _.first(event.dates);
      const lastDate = _.last(event.dates);
      const startTime = moment.utc(firstDate.startTime).format('HH:mm');
      const endTime = moment.utc(firstDate.endTime).format('HH:mm');
      if (event.type === 'recurring') {
        eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' - ' + moment.utc(lastDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
      } else {
        eventDate = moment.utc(firstDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
      }
      //common payload
      const commonPayload = {
        subjectVariables: [event.name],
        locality        : locality,
        replyTo         : dojo.email,
        content         : {
          event          : event,
          dojo           : dojo,
          applicationDate: moment.utc(applications[0].created).format(eventDateFormat),
          sessionName    : session.name,
          status         : applications[0].status,
          eventDate      : eventDate,
          cancelLinkBase : protocol + '://' + zenHostname + '/dashboard/cancel_session_invitation',
        },
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
          async.each(profiles, (profile, profileCb) => {
            //get the application related to the current profile
            const currentApplication = _.find(applications, (application) => {
              return application.userId === profile.userId;
            });
            //email payload changes for applicants
            const payloadChanges = {
              to     : profile.email || null,
              code   : emailCode,
              subject: emailSubject,
              from   : dojo.name+' <'+dojo.email+'>',
              content: {
                tickets      : tickets,
                applicantName: profile.name,
                applicationId: currentApplication.id ? currentApplication.id : null,
                intro        : emailIntro,
              },
            };
            //create the payload for the applicant
            const payload = _.merge(payloadChanges, commonPayload);
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
            seneca.act({role: 'cd-events', cmd: 'is_ticketing_admin', user: requestingUser, eventInfo: {dojoId: event.dojoId}}, (err, res) => {
              if (res.allowed) {
                return sendDojoCallback();
              }
              //subject for email to send to the dojo
              emailSubject = dojoEmailSubjectData[applications[0].status];
              //email payload changes for dojo
              const payloadChanges = {
                to     : dojo.email || null,
                code   : dojoEmailCode,
                subject: emailSubject,
                from   : 'The CoderDojo Team <info@coderdojo.org>',
                content: {
                  tickets             : tickets,
                  dojoName            : dojo.name,
                  dojoId              : event.dojoId,
                  eventId             : applications[0].eventId,
                  applicationsLinkBase: protocol + '://' + zenHostname + '/dashboard/my-dojos',
                },
              };
              //create the payload for the dojo
              const dojoPayload = _.merge(payloadChanges, commonPayload);
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
          let parent, parentName, parentEmail;
          //store all profiles which have parents (child profiles)
          const profilesWithParents = _.filter(profiles, (profile) => {return !_.isEmpty(profile.parents);});
          //store their names
          const childrensNames = _.map(profilesWithParents, 'name');
          //store all parent profiles of these children
          const parentProfiles = _.find(_.map(profilesWithParents, 'parents'));
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
          const payloadChanges = {
            to     : parentEmail || null,
            code   : emailCode,
            subject: emailSubject,
            from   : dojo.name+' <'+dojo.email+'>',
            tickets: tickets,
            content: {
              tickets      : tickets,
              applicantName: parentName || null,
              intro        : emailIntro,
              applicationId: null,
            },
          };
          //create the payload for the parent email
          const parentPayload = _.merge(payloadChanges, commonPayload);
          //queue email for sending
          sendQueue({cmd: 'enqueue', name: 'bulk-apply-applications-kue', msg: _.clone({role: 'cd-dojos', cmd: 'send_email', payload: parentPayload})}, sendParentsCallback);
        }],
        //final callback
        () => {
          done(null, applications);
        });
    }
  }
}

module.exports = bulkApplyApplications;
