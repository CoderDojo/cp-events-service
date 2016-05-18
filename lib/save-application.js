'use strict';

var _ = require('lodash');

function saveApplication (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applicationsEntity = seneca.make$(ENTITY_NS);

  var application = args.application;
  delete application.emailSubject;
  if (_.isEmpty(application)) return callback(null, {error: 'args.application is empty'});
  if (!application.id) application.created = new Date();
  //  TODO: separate with seneca-mesh to avoid coupling of services
  applicationsEntity.save$(application, function(err, result){
    if (err) return callback(err);
    if(application.attendance && !_.isEmpty(application.attendance)){
      seneca.act({role: 'cd-badges', cmd: 'assignRecurrentBadges', application : application}, function (err, approval) {
        if (err) return callback(err);
        return callback(null, result);
      });
    }else {
      return callback(null, result);
    }
  });
}
module.exports = saveApplication;
