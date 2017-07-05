'use strict';
var _ = require('lodash');

function isParentOfInvited (args, cb) {
  var seneca = this;
  var userId, invitation;
  if (args.params.invitation) invitation = args.params.invitation;
  userId = args.user.id;
  var isParentOfInvited = false;
  // load the ticket with this applicationId
  seneca.act({role: 'cd-events', entity: 'invite', cmd: 'list', query: {ticketId: invitation.ticketId, userId: invitation.userId}},
    function (err, invites) {
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, {userId: userId, invite: invite}));
        return cb(null, {'allowed': false});
      // if some data is found for this application
      } else if (invites && invites.length === 1) {
        var invite = invites[0];
        // load the children for this profile
        seneca.act({role: 'cd-profiles', cmd: 'load_children_for_user', userId: userId, user: args.user},
          function (err, children) {
            console.log('loadForUser', userId, invite.userId, children);
            console.log('loadForUser2', invite, _.keys(invite));
            if (err) {
              seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, {userId: userId, invite: invite}));
              return cb(null, {'allowed': false});
            // if some data is found for children
            } else if (children) {
              // if the userId of the application matches the userId of any of the children that were found, store that child
              var childApplicant = _.find(children, function (child) {
                return child.userId === invite.userId;
              });
              // if a result has been found, the current profile must be a parent of the applicant
              if (childApplicant) {
                isParentOfInvited = true;
              }
            }
            return cb(null, {'allowed': isParentOfInvited});
          });
      } else {
        return cb(null, {'allowed': false});
      }
    });
}

module.exports = isParentOfInvited;
