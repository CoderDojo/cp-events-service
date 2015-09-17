'use strict';

var _ = require('lodash');

function saveApplication(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applicationsEntity = seneca.make$(ENTITY_NS);

  async.waterfall([
    saveApplication,
    sendEmail
  ], function (err, res) {
    if(err) return callback(null, {ok: false, why: err.message});
    return callback(null, res);
  });

  function saveApplication(done) {
    var application = args.application;
  if(_.isEmpty(application)) return done(new Error('args.application is empty'));
  if(!application.id) application.created = new Date();
  applicationsEntity.save$(application, done);
  }
  
  function sendEmail(application, done) {
    if(application.status === 'approved') {

    }
  }
}

module.exports = saveApplication;
