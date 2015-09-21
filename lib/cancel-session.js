'use strict'

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function cancelSession(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var user = args.user;
  var sessionId = args.sessionId;
  var locality = args.locality || 'en_US';
  var eventDateFormat = 'Do MMMM YY';
  var sessionData;
  var eventData;
  var applicationsData;
  var dojoData;

  async.waterfall([
    loadSessionData,
    validateRequest,
    updateSessionStatus,
    updateApplicationsStatus,
    loadDojoData,
    updateEventStatus,
    emailSessionAttendees
  ], function (err, res) {
    if(err) return callback(null, {ok: false, why: err.message});
    return callback(null, res);
  });

  function loadSessionData(done) {
    seneca.act({role: plugin, cmd: 'loadSession', id: sessionId}, function (err, session) {
      if(err) return done(err);
      sessionData = session;
      seneca.act({role: plugin, cmd: 'getEvent', id: sessionData.eventId}, function (err, event) {
        if(err) return done(err);
        eventData = event;
        return done(null, eventData);
      });
    });
  }

  function validateRequest(eventData, done) {
    seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query:{userId: user.id, dojoId: eventData.dojoId}}, function (err, usersDojos) {
      if(err) return done(err);
      var userDojo = usersDojos[0];
      var isTicketingAdmin = _.find(userDojo.userPermissions, function (userPermission) {
        return userPermission.name === 'ticketing-admin';
      });
      if(!isTicketingAdmin) return done(new Error('You must be a ticketing admin of this Dojo to update attendance records.'));
      return done();
    });
  }

  function updateSessionStatus(done) {
    sessionData.status = 'cancelled';
    seneca.act({role: plugin, cmd: 'saveSession', session: sessionData}, done);
  }

  function updateApplicationsStatus(cancelledSession, done) {
    seneca.act({role: plugin, cmd: 'searchApplications', query: {sessionId: cancelledSession.id}}, function (err, applications) {
      if(err) return done(err);
      applicationsData = applications;
      async.each(applications, function (application, cb) {
        application.status = 'cancelled';
        seneca.act({role: plugin, cmd: 'saveApplication', application: application}, cb);
      }, done);
    });
  }

  function loadDojoData(done) {
    seneca.act({role: 'cd-dojos', cmd: 'load', id: eventData.dojoId}, function (err, dojo) {
      if(err) return done(err);
      dojoData = dojo;
      return done();
    });
  }

  function updateEventStatus(done) {
    seneca.act({role: plugin, cmd: 'searchSessions', query: {eventId: eventData.id}}, function (err, sessions) {
      if(err) return done(err);
      var allSessionsCancelled = true;
      _.each(sessions, function (session) {
        if(session.status !== 'cancelled') {
          allSessionsCancelled = false;
        }
      });
      if(allSessionsCancelled) {
        eventData.status = 'cancelled';
        seneca.act({role: plugin, cmd: 'saveEvent', eventInfo: eventData}, function (err, event) {
          if(err) return done(err);
          return done();
        });
      } else {
        return done();
      }
    });
  }

  function emailSessionAttendees(done) {
    var emailSubject = sessionData.name + ' has been cancelled';
    var eventDate;
    var firstDate = _.first(eventData.dates);
    var lastDate = _.last(eventData.dates);
    var startTime = moment(firstDate.startTime).format('HH:mm');
    var endTime = moment(firstDate.endTime).format('HH:mm');
    if(eventData.type === 'recurring') {  
      eventDate = moment(firstDate.startTime).format(eventDateFormat) + ' - ' + moment(lastDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
    } else {
      eventDate = moment(firstDate.startTime).format(eventDateFormat) + ' ' + startTime + ' - ' + endTime;
    }
    process.nextTick(function () {
      async.eachSeries(applicationsData, function (application, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: application.userId}}, function (err, profiles) {
          if(err) return cb(err);
          var profile = profiles[0];
          if(!profile.email) return cb();
          var payload = {
            to: profile.email,
            code: 'session-cancelled-',
            subject: emailSubject,
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
          seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, function (err, res) {
            if(err) return cb(err);
            if(!_.isEmpty(profile.parents)) {
              async.eachSeries(profile.parents, function (parent, cb) {
                payload.to = parent.email;
                seneca.act({role: 'cd-dojos', cmd: 'send_email', payload: payload}, cb);
              }, cb);
            } else {
              return cb();
            }
          });
        });
      });
    });
    return done();
  }


}

module.exports = cancelSession;