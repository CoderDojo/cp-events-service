'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function cancelSession (args, callback) {
  var seneca = this;
  var plugin = args.role;
  var user = args.user;
  var session = args.session;
  var sessionId = session.id;
  var locality = args.locality || 'en_US';
  var eventDateFormat = 'Do MMMM YY';
  var emailSubject = session.emailSubject || '%1$s has been cancelled';
  delete session.emailSubject;
  var sessionData;
  var eventData;
  var applicationsData;
  var dojoData;

  async.waterfall([
    loadSessionData,
    updateSessionStatus,
    updateApplicationsStatus,
    loadDojoData,
    updateEventStatus,
    emailSessionAttendees
  ], function (err, res) {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, res);
  });

  function loadSessionData (done) {
    seneca.act({role: plugin, cmd: 'loadSession', id: sessionId}, function (err, session) {
      if (err) return done(err);
      sessionData = session;
      seneca.act({role: plugin, cmd: 'getEvent', id: sessionData.eventId}, function (err, event) {
        if (err) return done(err);
        eventData = event;
        return done(null);
      });
    });
  }

  function updateSessionStatus (done) {
    sessionData.status = 'cancelled';
    seneca.act({role: plugin, cmd: 'saveSession', session: sessionData}, done);
  }

  function updateApplicationsStatus (cancelledSession, done) {
    seneca.act({role: plugin, cmd: 'searchApplications', query: {sessionId: cancelledSession.id}}, function (err, applications) {
      if (err) return done(err);
      applicationsData = applications;
      async.each(applications, function (application, cb) {
        application.status = 'cancelled';
        seneca.act({role: plugin, cmd: 'saveApplication', application: application}, cb);
      }, done);
    });
  }

  function loadDojoData (done) {
    seneca.act({role: 'cd-dojos', cmd: 'load', id: eventData.dojoId}, function (err, dojo) {
      if (err) return done(err);
      dojoData = dojo;
      return done();
    });
  }

  function updateEventStatus (done) {
    seneca.act({role: plugin, cmd: 'searchSessions', query: {eventId: eventData.id}}, function (err, sessions) {
      if (err) return done(err);
      var allSessionsCancelled = true;
      _.each(sessions, function (session) {
        if (session.status !== 'cancelled') {
          allSessionsCancelled = false;
        }
      });
      if (allSessionsCancelled && eventData.status !== 'cancelled') {
        eventData.status = 'cancelled';
        seneca.act({role: plugin, cmd: 'saveEvent', eventInfo: eventData}, function (err, event) {
          if (err) return done(err);
          return done();
        });
      } else {
        return done();
      }
    });
  }

  function emailSessionAttendees (done) {
    var eventDate;
    var firstDate = _.first(eventData.dates);
    var lastDate = _.last(eventData.dates);
    var startTime = moment(firstDate.startTime).format('HH:mm');
    var endTime = moment(firstDate.endTime).format('HH:mm');
    if (eventData.type === 'recurring') {
      eventDate = moment(firstDate.startTime).format(eventDateFormat) + ' - ' + moment(lastDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
    } else {
      eventDate = moment(firstDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
    }
    process.nextTick(function () {
      applicationsData = _.uniq(applicationsData, function (application) { return application.userId; });
      async.eachSeries(applicationsData, function (application, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
          if (err) return cb(err);
          var profile = profiles[0];
          var payload = {
            to: profile.email || null,
            code: 'session-cancelled-',
            subject: emailSubject,
            subjectVariables: sessionData.name,
            locality: locality,
            content: {
              applicantName: profile.name,
              event: eventData,
              dojo: dojoData,
              applicationDate: moment(application.created).format(eventDateFormat),
              sessionName: sessionData.name,
              eventDate: eventDate
            }
          };

          if (!profile.email) return emailParents(cb);

          seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, function (err, res) {
            if (err) return cb(err);
            if (!_.isEmpty(profile.parents)) {
              emailParents(cb);
            } else {
              return cb();
            }
          });

          function emailParents (cb) {
            if (!_.isEmpty(profile.parents)) {
              async.eachSeries(profile.parents, function (parent, sCb) {
                seneca.act({role: 'cd-users', cmd: 'load', id: parent, user: user}, function (err, parentUser) {
                  if (err) return sCb(err);
                  payload.to = parentUser.email;
                  seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, sCb);
                });
              }, cb);
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
