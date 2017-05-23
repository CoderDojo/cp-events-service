'use strict';
var _ = require('lodash');


function isOwnApplication (args, cb) {
  var seneca = this;
  var plugin = args.role;
  var userId, applicationId;
  if(args.params.applicationId) applicationId = args.params.applicationId;
  userId = args.user.id;
  var isOwnApplication = false;

  //load the application with this applicationId
  seneca.act({role: 'cd-events', cmd: 'loadApplication', id: applicationId },
    function(err, application) {
      //error handling
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isOwnApplication', err, {userId: userId, applicationId: applicationId}));
        return cb(null, {'allowed': false});
      //if some data is found for this application
      } else if (application) {
        //if the userId of the application that was found matches that of our user...
        if (application.userId === userId) {
          //...then it's their application
          isOwnApplication = true;
        }
      }
      return cb(null, {'allowed': isOwnApplication});
  });
}

module.exports = isOwnApplication;
