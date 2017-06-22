'use strict';
var _ = require('lodash');


function isParentOfApplicant (args, cb) {
  var seneca = this;
  var plugin = args.role;
  var userId, applicationId;
  if(args.params.applicationId) applicationId = args.params.applicationId;
  userId = args.user.id;
  var isParentOfApplicant = false;

  //load the application with this applicationId
  seneca.act({role: 'cd-events', cmd: 'loadApplication', id: applicationId },
    function(err, application) {
      //error handling
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, {userId: userId, applicationId: applicationId}));
        return cb(null, {'allowed': false});
      //if some data is found for this application
      } else if (application) {
        //load the children for this profile
        seneca.act({role: 'cd-profiles', cmd: 'load_children_for_user', userId: userId, user: args.user },
          function(err, children) {
            //error handling
            if (err) {
              seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, {userId: userId, applicationId: applicationId}));
              return cb(null, {'allowed': false});
            //if some data is found for children
            } else if (children) {
              //if the userId of the application matches the userId of any of the children that were found, store that child
              var childApplicant = _.find(children, function(child) {
                return child.userId === application.userId;
              });
              //if a result has been found, the current profile must be a parent of the applicant
              if (childApplicant) {
                isParentOfApplicant = true;
              }
            }
            return cb(null, {'allowed': isParentOfApplicant});
        });
      }
  });
}

module.exports = isParentOfApplicant;
