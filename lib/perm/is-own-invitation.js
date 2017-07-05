'use strict';

function isOwnInvitation (args, cb) {
  var seneca = this;
  var userId, invitation;
  if (args.params.invitation) invitation = args.params.invitation;
  userId = args.user.id;
  var isOwnApplication = false;
  // load the application with this inviteId
  seneca.act({role: 'cd-events', entity: 'invite', cmd: 'list', query: {ticketId: invitation.ticketId, userId: invitation.userId}},
    function (err, invites) {
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isOwnApplication', err, {userId: userId, invitation: invitation}));
        return cb(null, {'allowed': false});
        // if some data is found for this invite
      } else if (invites && invites.length === 1) {
        var invite = invites[0];
        // if the userId of the invite that was found matches that of our user...
        if (invite.userId === userId) {
          // ...then it's their invite
          isOwnApplication = true;
        }
      }
      return cb(null, {'allowed': isOwnApplication});
  });
}

module.exports = isOwnInvitation;
