'use strict';

function isOwnInvitation (args, cb) {
  var seneca = this;
  var userId = args.user.id;
  var invitation = args.params.invitation;
  var isOwnApplication = false;
  if (invitation && invitation.ticketId && invitation.userId && userId) {
    // load the application with this inviteId
    seneca.act({role: 'cd-events', entity: 'invite', cmd: 'list', query: {ticketId: invitation.ticketId, userId: invitation.userId}},
      function (err, invites) {
        if (err) {
          seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isOwnApplication', err, {userId: userId, invitation: invitation}));
          return cb(null, {'allowed': false});
          // if some data is found for this invite
        }
        if (invites && invites.length === 1) {
          // if the userId of the invite that was found matches that of our user...
          if (invites[0].userId === userId) {
            // ...then it's their invite
            isOwnApplication = true;
          }
        }
        return cb(null, {'allowed': isOwnApplication});
      });
  } else {
    return cb(null, {'allowed': false});
  }
}

module.exports = isOwnInvitation;
