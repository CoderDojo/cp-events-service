'use strict';

function saveApplication(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make(ENTITY_NS);

  var application = args.application;

  applications.save$(application, function(err, application) {
    if (err) return callback(err);
    callback(null, application);
  });
}

module.exports = saveApplication;
