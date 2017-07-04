const _ = require('lodash');

function validateSessionInvitation(args, callback) {
  const seneca = this;
  const user = args.user;
  const locality = args.locality || 'en_US';
  const plugin = args.role;
  const invitation = args.invitation;
  if (!invitation) return callback(null, { ok: false, why: 'args.invitation is empty' });
  const ticketId = invitation.ticketId;
  const invitedUserId = invitation.invitedUserId;
  const validParentUserIds = [];

  function loadParents() {
    return new Promise((resolve, reject) => {
      seneca.act({
        role  : 'cd-profiles',
        cmd   : 'load_parents_for_user',
        userId: invitedUserId,
        user  : args.user,
      }, (err, parents) => {
        if (err) reject(err);
        if (_.isEmpty(parents)) resolve();
        _.each(parents, ({ id }) => {
          validParentUserIds.push(id);
        });
        resolve();
      });
    });
  }

  function validateRequest() {
    return new Promise((resolve, reject) => {
      if (user.id !== invitedUserId && !_.contains(validParentUserIds, user.id)) {
        reject(new Error('Only the invited user can accept this invitation.'));
      }
      seneca.act({ role: plugin, cmd: 'loadTicket', id: ticketId }, (err, ticket) => {
        if (err) reject(err);
        if (!ticket.invites || _.isEmpty(ticket.invites)) reject(new Error('No invites found'));
        const invitedUserFound = _.find(ticket.invites, ({ userId }) => userId === invitedUserId);
        if (!invitedUserFound) reject(new Error('Invalid session invitation.'));
        resolve(ticket);
      });
    });
  }

  function createApplication({ sessionId, name, type, id }) {
    return new Promise((resolve, reject) => {
      const application = {
        sessionId,
        ticketName  : name,
        ticketType  : type,
        ticketId    : id,
        userId      : invitedUserId,
        status      : 'approved',
        emailSubject: invitation.emailSubject,
      };

      function loadSession() {
        return new Promise((resolve, reject) => {
          seneca.act({
            role: plugin,
            cmd : 'loadSession',
            id  : sessionId,
          }, (err, session) => {
            if (err) reject(err);
            resolve(session);
          });
        });
      }

      function loadEvent({ eventId }) {
        return new Promise((resolve, reject) => {
          seneca.act({
            role: plugin,
            cmd : 'getEvent',
            id  : eventId,
          }, (err, event) => {
            if (err) reject(err);
            application.eventId = event.id;
            application.dojoId = event.dojoId;
            resolve(event);
          });
        });
      }

      function saveApplication() {
        return new Promise((resolve, reject) => {
          const applications = [application];
          seneca.act({
            role: plugin,
            cmd : 'bulkApplyApplications',
            applications,
            user,
            locality,
          }, err => {
            if (err) reject(err);
            resolve();
          });
        });
      }

      loadSession()
        .then(loadEvent)
        .then(saveApplication)
        .then(resolve)
        .catch(reject);
    });
  }

  loadParents()
    .then(validateRequest)
    .then(createApplication)
    .then(() => callback(null, { ok: true }))
    .catch(err => callback(null, { ok: false, why: err.message }));
}

module.exports = validateSessionInvitation;
