'use strict';

var _ = require('lodash');

function saveApplication(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applicationsEntity = seneca.make$(ENTITY_NS);

  var application = args.application;

  applicationsEntity.list$({userId: application.userId, eventId: application.eventId}, function (err, applications) {
    if(err) return callback(err);
    if(!_.isEmpty(applications)) {
      var existingApplication = applications[0];
      if(!existingApplication.sessions) existingApplication.sessions = [];
      var sessionExists = _.find(existingApplication.sessions, function (session) {
        return session.id === application.session.id;
      });
      if(!sessionExists) { 
        existingApplication.sessions.push(application.session); 
      } else {
        return callback(null, {ok: false, why: 'You have already applied for this session'});
      }
      application = existingApplication; //update existing application.
    } else {
      application.sessions = [application.session];
    }
    delete application.session;
    applicationsEntity.save$(application, callback);
  });
}

module.exports = saveApplication;
