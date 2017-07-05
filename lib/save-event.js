const async = require('async');
const _ = require('lodash');
const moment = require('moment');
const sanitizeHtml = require('sanitize-html');

function saveEvent(args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/events';
  const so = seneca.options;

  const eventInfo = args.eventInfo;
  const plugin = args.role;
  const locality = args.locality || 'en_US';
  const protocol = process.env.PROTOCOL || 'http';
  const zenHostname = process.env.HOSTNAME || '127.0.0.1:8000';
  const user = args.user;
  const eventDateFormat = 'Do MMMM YY';
  let emailSubject;
  let eventSaved;

  async.waterfall([saveTheEvent, saveSessions, removeDeletedTickets, emailInvitedMembers], err => {
    if (err) return callback(null, { ok: false, why: err.message });
    return callback(null, eventSaved);
  });

  function saveTheEvent(done) {
    if (eventInfo.sessions && eventInfo.sessions.length > 20) {
      return callback(new Error('You can only create a max of 20 sessions/rooms'));
    }
    const maxTicketTypesExceeded = _.find(eventInfo.sessions, ({ tickets }) => tickets.length > 20);
    if (maxTicketTypesExceeded) {
      return callback(new Error('You can only create a max of 20 ticket types'));
    }

    const newEvent = {
      address          : eventInfo.address,
      city             : eventInfo.city,
      country          : eventInfo.country,
      createdAt        : new Date(),
      createdBy        : eventInfo.userId,
      description      : sanitizeHtml(eventInfo.description, so.sanitizeTextArea),
      dojoId           : eventInfo.dojoId,
      name             : sanitizeHtml(eventInfo.name),
      position         : eventInfo.position,
      public           : eventInfo.public,
      status           : eventInfo.status,
      type             : eventInfo.type,
      recurringType    : eventInfo.recurringType,
      ticketApproval   : eventInfo.ticketApproval,
      notifyOnApplicant: eventInfo.notifyOnApplicant,
    };

    if (eventInfo.id) {
      // Check if this is an update.
      newEvent.id = eventInfo.id;
    }

    if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
      const err = new Error('Dates must be specified');
      return done(err);
    }

    const pastDateFound = _.find(eventInfo.dates, ({ startTime }) => {
      const utcOffset = moment().utcOffset();
      return moment.utc(startTime).subtract(utcOffset, 'minutes').diff(moment.utc(), 'minutes') < 0;
    });

    if (pastDateFound && !eventInfo.id) return done(new Error('Past events cannot be created'));

    newEvent.dates = eventInfo.dates;

    if (eventInfo.emailSubject) {
      emailSubject = eventInfo.emailSubject;
      delete eventInfo.emailSubject;
    }

    const eventEntity = seneca.make(ENTITY_NS);
    eventEntity.save$(newEvent, done);
  }

  function saveSessions(event, done) {
    eventSaved = event;
    if (_.isEmpty(eventInfo.sessions)) {
      return setImmediate(() => done(null, event));
    }

    function removeDeletedSessions(cb) {
      seneca.act({
        role : plugin,
        cmd  : 'searchSessions',
        query: { eventId: event.id },
      }, (err, existingSessions) => {
        if (err) return cb(err);
        async.each(existingSessions, (existingSession, eCb) => {
          const sessionFound = _.find(
            eventInfo.sessions,
            ({ id }) => existingSession.id === id,
          );
          // The whole section has been deleted but the event is still up
          if (!sessionFound) {
            return seneca.act({
              role   : plugin,
              cmd    : 'cancelSession',
              session: existingSession,
              locality,
              user,
            }, eCb);
          }
          return eCb();
        }, cb);
      });
    }

    function saveNewSessions(cb) {
      async.map(eventInfo.sessions, (session, mCb) => {
        session.eventId = event.id;
        if (event.status === 'cancelled') {
          session.emailSubject = emailSubject;
          seneca.act({ role: plugin, cmd: 'cancelSession', session, locality, user }, mCb);
        } else {
          session.eventId = event.id;
          session.status = 'active';
          const sessionToSave = _.clone(session);
          delete sessionToSave.tickets;
          seneca.act({
            role   : plugin,
            cmd    : 'saveSession',
            session: sessionToSave,
          }, (err, savedSession) => {
            if (err) return cb(err);
            async.each(session.tickets, (ticket, eCb) => {
              ticket.sessionId = savedSession.id;
              seneca.act({ role: plugin, cmd: 'saveTicket', ticket }, eCb);
            }, err => {
              if (err) return mCb(err);
              return mCb(null, savedSession);
            });
          });
        }
      }, cb);
    }
    async.series([
      removeDeletedSessions,
      saveNewSessions,
    ], done);
  }

  function removeDeletedTickets(sessions, done) {
    const flatSessions = _.chain(sessions).compact().flatten().value();
    async.each(flatSessions, (savedSession, cb) => {
      if (!savedSession) return setImmediate(cb);
      seneca.act({
        role : plugin,
        cmd  : 'searchSessions',
        query: { id: savedSession.id },
      }, (err, foundSessions) => {
        if (err) return cb(err);
        const session = foundSessions[0];
        async.each(session.tickets, (existingTicket, eCb) => {
          const ticketFound = _.find(eventInfo.sessions, ({ tickets }) =>
            _.find(tickets, ({ id }) => {
              if (id) return existingTicket.id === id;
              return true;
            }),
          );
          if (!ticketFound) {
            existingTicket.deleted = 1;
            return seneca.act({
              role  : plugin,
              cmd   : 'saveTicket',
              ticket: existingTicket,
            }, eCb);
          }
          return eCb();
        }, cb);
      });
    }, err => {
      if (err) return done(err);
      return done(null, sessions);
    });
  }

  function emailInvitedMembers(sessions, done) {
    if (eventInfo.status !== 'published') {
      return setImmediate(() => done(null, eventSaved));
    }
    if (_.isEmpty(sessions)) {
      return setImmediate(() => done(null, eventSaved));
    }
    process.nextTick(() => {
      async.each(sessions, ({ id }, cb) => {
        seneca.act({
          role : plugin,
          cmd  : 'searchSessions',
          query: { id },
        }, (err, foundSessions) => {
          if (err) return cb(err);
          const session = foundSessions[0];
          async.each(session.tickets, (ticket, eCb) => {
            if (ticket.deleted === 1) return eCb();
            if (_.isEmpty(ticket.invites)) return eCb();
            async.eachSeries(ticket.invites, (invite, sCb) => {
              if (invite.userNotified) return sCb();
              return emailInvitedUser(session, ticket, invite, sCb);
            }, eCb);
          }, cb);
        });
      });

      function emailInvitedUser({ name }, ticket, { userId }, cb) {
        function sendEmail(nestedCb) {
          seneca.act({
            role : 'cd-profiles',
            cmd  : 'list',
            query: { userId },
          }, (err, userProfiles) => {
            if (err) return nestedCb(err);
            const profile = userProfiles[0];
            seneca.act({ role: 'cd-dojos', cmd: 'load', id: eventSaved.dojoId }, (err, dojo) => {
              if (err) return nestedCb(err);
              let eventDate;
              const firstDate = _.first(eventSaved.dates);
              const lastDate = _.last(eventSaved.dates);
              const startTime = moment.utc(firstDate.startTime).format('HH:mm');
              const endTime = moment.utc(firstDate.endTime).format('HH:mm');
              if (eventSaved.type === 'recurring') {
                eventDate = `${moment
                  .utc(firstDate.startTime)
                  .format(eventDateFormat)} - ${moment
                  .utc(lastDate.startTime)
                  .format(eventDateFormat)} ${startTime} - ${endTime}`;
              } else {
                eventDate = `${moment
                  .utc(firstDate.startTime)
                  .format(eventDateFormat)} ${startTime} - ${endTime}`;
              }

              const payload = {
                to     : profile.email || null,
                replyTo: dojo.email || null,
                code   : 'invited-to-session-',
                subject: 'You have been invited to a Dojo session',
                locality,
                content: {
                  applicantName: profile.name,
                  event        : eventSaved,
                  dojo,
                  sessionName  : name,
                  ticket,
                  eventDate,
                  inviteLink   : `${protocol}://${zenHostname}/dashboard/accept_session_invitation/${ticket.id}/${userId}`,
                },
              };

              if (!profile.email) return emailParents(profile, payload, nestedCb);
              seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, err => {
                if (err) return nestedCb(err);
                return emailParents(profile, payload, nestedCb);
              });
            });
          });
        }

        function updateInvite(nestedCb) {
          let invites = ticket.invites;
          const updatedInvite = {
            userId,
            userNotified: true,
          };
          invites = _.without(invites, _.findWhere(invites, { userId }));
          invites.push(updatedInvite);
          ticket.invites = invites;
          seneca.act({ role: plugin, cmd: 'saveTicket', ticket }, nestedCb);
        }
        async.series([
          sendEmail,
          updateInvite,
        ], cb);
      }
    });
    return done(null, eventSaved);
  }

  function emailParents({ parents, email }, payload, cb) {
    if (_.isEmpty(parents)) return cb();
    const parentsEmailed = [];
    async.eachSeries(parents, (parent, sCb) => {
      if (!_.isObject(parent)) {
        seneca.act({
          role: 'cd-users',
          cmd : 'load',
          id  : parent,
          user,
        }, (err, { toEmail }) => {
          if (err) return sCb(err);
          payload.to = toEmail;
          if (!_.contains(parentsEmailed, payload.to) && payload.to !== email) {
            parentsEmailed.push(payload.to);
            seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, sCb);
          } else {
            return sCb();
          }
        });
      } else {
        payload.to = parent.email;
        if (!_.contains(parentsEmailed, payload.to) && payload.to !== email) {
          parentsEmailed.push(payload.to);
          seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, cb);
        } else {
          return cb();
        }
      }
    }, cb);
  }
}
module.exports = saveEvent;
