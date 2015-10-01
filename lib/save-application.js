'use strict';

var _ = require('lodash');
var async = require('async');

function saveApplication (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applicationsEntity = seneca.make$(ENTITY_NS);

  var application = args.application;
  var emailSubject = application.emailSubject;
  delete application.emailSubject;
  if(_.isEmpty(application)) return callback(null, {error: 'args.application is empty'});
  if(!application.id) application.created = new Date();
  applicationsEntity.save$(application, callback);

}

module.exports = saveApplication;
