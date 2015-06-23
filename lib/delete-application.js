'use strict';

function deleteApplication(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make$(ENTITY_NS);

  var id = args.applicationId;

  applications.remove$(id, function(err, application) {
    if (err) return callback(err);
    callback(null, application);
  });
}

module.exports = deleteApplication;
