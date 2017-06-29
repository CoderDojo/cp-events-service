'use strict';

const async = require('async');
const _ = require('lodash');
const moment = require('moment');

function cancelSession(args, callback) {
  const seneca = this;
  const plugin = args.role;
  const user = args.user;
  const session = args.session;
  const sessionId = session.id;
  const locality = args.locality || 'en_US';
  const eventDateFormat = 'Do MMMM YY';
  const emailSubject = session.emailSubject || '%1$s has been cancelled';
  delete session.emailSubject;
  let sessionData;
  let eventData;
  let applicationsData;
  let dojoData;

  async.waterfall([
    loadSessionData,
    updateSessionStatus,
    updateApplicationsStatus,
    loadDojoData,
    updateEventStatus,
    emailSessionAttendees,
  ], (err, res) => {
    if (err) return callback(null, { ok: false, why: err.message });
    return callback(null, res);
  });

  function loadSessionData(done) {
    seneca.act({ role: plugin, cmd: 'loadSession', id: sessionId }, (err, session) => {
      if (err) return done(err);
      sessionData = session;
      seneca.act({ role: plugin, cmd: 'getEvent', id: sessionData.eventId }, (err, event) => {
        if (err) return done(err);
        eventData = event;
        return done(null);
      });
    });
  }

  function updateSessionStatus(done) {
    sessionData.status = 'cancelled';
    seneca.act({ role: plugin, cmd: 'saveSession', session: sessionData }, done);
  }

  function updateApplicationsStatus({ id }, done) {
    seneca.act({ role: plugin, cmd: 'searchApplications', query: { sessionId: id } }, (err, applications) => {
      if (err) return done(err);
      applicationsData = applications;
      async.each(
        applications,
        (application, cb) => {
          application.status = 'cancelled';
          seneca.act({ role: plugin, cmd: 'saveApplication', application }, cb);
        }, done
      );
    });
  }

  function loadDojoData(done) {
    seneca.act({ role: 'cd-dojos', cmd: 'load', id: eventData.dojoId }, (err, dojo) => {
      if (err) return done(err);
      dojoData = dojo;
      return done();
    });
  }

  function updateEventStatus(done) {
    seneca.act({ role: plugin, cmd: 'searchSessions', query: { eventId: eventData.id } }, (err, sessions) => {
      if (err) return done(err);
      let allSessionsCancelled = true;
      _.each(sessions, ({ status }) => {
        if (status !== 'cancelled') {
          allSessionsCancelled = false;
        }
      });
      if (allSessionsCancelled && eventData.status !== 'cancelled') {
        eventData.status = 'cancelled';
        seneca.act({ role: plugin, cmd: 'saveEvent', eventInfo: eventData }, err => {
          if (err) return done(err);
          return done();
        });
      } else {
        return done();
      }
    });
  }

  function emailSessionAttendees(done) {
    let eventDate;
    const firstDate = _.first(eventData.dates);
    const lastDate = _.last(eventData.dates);
    const startTime = moment(firstDate.startTime).format('HH:mm');
    const endTime = moment(firstDate.endTime).format('HH:mm');
    if (eventData.type === 'recurring') {
      eventDate = `${moment(firstDate.startTime).format(eventDateFormat)} - ${moment(lastDate.startTime).format(eventDateFormat)} ${startTime} - ${endTime}`;
    } else {
      eventDate = `${moment(firstDate.startTime).format(eventDateFormat)} ${startTime} - ${endTime}`;
    }
    process.nextTick(() => {
      applicationsData = _.uniq(applicationsData, ({ userId }) => {
        return userId;
      });
      async.eachSeries(applicationsData, ({ userId, created }, cb) => {
        seneca.act({ role: 'cd-profiles', cmd: 'list', query: { userId: userId } }, (err, profiles) => {
          if (err) return cb(err);
          const profile = profiles[0];
          const payload = {
            to              : profile.email || null,
            code            : 'session-cancelled-',
            subject         : emailSubject,
            subjectVariables: sessionData.name,
            locality,
            content         : {
              applicantName  : profile.name,
              event          : eventData,
              dojo           : dojoData,
              applicationDate: moment(created).format(eventDateFormat),
              sessionName    : sessionData.name,
              eventDate,
            },
          };

          if (!profile.email) return emailParents(cb);

          seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, err => {
            if (err) return cb(err);
            if (!_.isEmpty(profile.parents)) {
              emailParents(cb);
            } else {
              return cb();
            }
          });

          function emailParents(cb) {
            if (!_.isEmpty(profile.parents)) {
              async.eachSeries(
                profile.parents,
                (parent, sCb) => {
                  seneca.act({ role: 'cd-users', cmd: 'load', id: parent, user }, (err, { email }) => {
                    if (err) return sCb(err);
                    payload.to = email;
                    seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, sCb);
                  });
                }, cb
              );
            } else {
              return cb();
            }
          }
        });
      });
    });
    return done();
  }
}

module.exports = cancelSession;
