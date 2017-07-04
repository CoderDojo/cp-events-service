const _ = require('lodash');
const eachSeries = require('async/eachSeries');
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

  loadSessionData()
    .then(updateSessionStatus)
    .then(updateApplicationsStatus)
    .then(loadDojoData)
    .then(updateEventStatus)
    .then(emailSessionAttendees)
    .then(res => callback(null, res))
    .catch(err => callback(null, { ok: false, why: err.message }));

  function loadSessionData() {
    return new Promise((resolve, reject) => {
      seneca.act({ role: plugin, cmd: 'loadSession', id: sessionId }, (err, loadedSession) => {
        if (err) reject(err);
        sessionData = loadedSession;
        seneca.act({ role: plugin, cmd: 'getEvent', id: sessionData.eventId }, (err, event) => {
          if (err) reject(err);
          eventData = event;
          resolve();
        });
      });
    });
  }

  function updateSessionStatus() {
    return new Promise((resolve, reject) => {
      sessionData.status = 'cancelled';
      seneca.act(
        { role: plugin, cmd: 'saveSession', session: sessionData },
        (err, updatedSession) => {
          if (err) reject(err);
          resolve(updatedSession);
        },
      );
    });
  }

  function updateApplicationsStatus({ id }) {
    return new Promise((resolve, reject) => {
      seneca.act({
        role : plugin,
        cmd  : 'searchApplications',
        query: { sessionId: id },
      }, (err, applications) => {
        if (err) reject(err);
        applicationsData = applications;
        Promise.all(applications.map(application => (
          new Promise((resolve, reject) => {
            application.status = 'cancelled';
            seneca.act({ role: plugin, cmd: 'saveApplication', application }, err => {
              if (err) reject(err);
              resolve();
            });
          })
        )))
          .then(resolve)
          .catch(reject);
      });
    });
  }

  function loadDojoData() {
    return new Promise((resolve, reject) => {
      seneca.act({ role: 'cd-dojos', cmd: 'load', id: eventData.dojoId }, (err, dojo) => {
        if (err) reject(err);
        dojoData = dojo;
        resolve();
      });
    });
  }

  function updateEventStatus() {
    return new Promise((resolve, reject) => {
      seneca.act({
        role : plugin,
        cmd  : 'searchSessions',
        query: {
          eventId: eventData.id,
        },
      }, (err, sessions) => {
        if (err) reject(err);
        let allSessionsCancelled = true;
        _.each(sessions, ({ status }) => {
          if (status !== 'cancelled') {
            allSessionsCancelled = false;
          }
        });
        if (allSessionsCancelled && eventData.status !== 'cancelled') {
          eventData.status = 'cancelled';
          seneca.act({ role: plugin, cmd: 'saveEvent', eventInfo: eventData }, err => {
            if (err) reject(err);
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  function emailSessionAttendees() {
    return new Promise(resolve => {
      let eventDate;
      const firstDate = _.first(eventData.dates);
      const lastDate = _.last(eventData.dates);
      const startTime = moment(firstDate.startTime).format('HH:mm');
      const endTime = moment(firstDate.endTime).format('HH:mm');
      if (eventData.type === 'recurring') {
        eventDate = `${moment(firstDate.startTime).format(eventDateFormat)} - ${moment(
          lastDate.startTime,
        ).format(eventDateFormat)} ${startTime} - ${endTime}`;
      } else {
        eventDate = `${moment(firstDate.startTime).format(
          eventDateFormat,
        )} ${startTime} - ${endTime}`;
      }
      process.nextTick(() => {
        applicationsData = _.uniq(applicationsData, ({ userId }) => userId);
        eachSeries(applicationsData, ({ userId, created }, done) => {
          seneca.act({ role: 'cd-profiles', cmd: 'list', query: { userId } }, (err, profiles) => {
            if (err) return done(err);
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

            if (!profile.email) return emailParents(done);

            seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, err => {
              if (err) return done(err);
              if (!_.isEmpty(profile.parents)) {
                emailParents(done);
              } else {
                return done();
              }
            });

            function emailParents(cb) {
              if (!_.isEmpty(profile.parents)) {
                eachSeries(profile.parents, (parent, sCb) => {
                  seneca.act({
                    role: 'cd-users',
                    cmd : 'load',
                    id  : parent,
                    user,
                  }, (err, { email }) => {
                    if (err) return sCb(err);
                    payload.to = email;
                    seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, sCb);
                  });
                }, cb);
              } else {
                return cb();
              }
            }
          });
        });
      });
      resolve();
    });
  }
}

module.exports = cancelSession;
