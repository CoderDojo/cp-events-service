'use strict';

const async = require('async');
const _ = require('lodash');

function validateSessionInvitation (args, callback) {
  const seneca = this;
  const user = args.user;
  const locality = args.locality || 'en_US';
  const plugin = args.role;
  const invitation = args.invitation;
  if (!invitation) return callback(null, {ok: false, why: 'args.invitation is empty'});
  const ticketId = invitation.ticketId;
  const invitedUserId = invitation.invitedUserId;
  const validParentUserIds = [];

  async.waterfall([
    loadParents,
    validateRequest,
    createApplication,
  ], (err) => {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, {ok: true});
  });

  function loadParents (done) {
    seneca.act({role: 'cd-profiles', cmd: 'load_parents_for_user', userId: invitedUserId, user: args.user}, (err, parents) => {
      if (err) return done(err);
      if (_.isEmpty(parents)) return done();
      _.each(parents, (parent) => {
        validParentUserIds.push(parent.id);
      });
      return done();
    });
  }

  function validateRequest (done) {
    if (user.id !== invitedUserId && !_.contains(validParentUserIds, user.id)) return done(new Error('Only the invited user can accept this invitation.'));
    seneca.act({role: plugin, cmd: 'loadTicket', id: ticketId}, (err, ticket) => {
      if (err) return done(err);
      if (!ticket.invites || _.isEmpty(ticket.invites)) return done(new Error('No invites found'));
      const invitedUserFound = _.find(ticket.invites, (invite) => {
        return invite.userId === invitedUserId;
      });
      if (!invitedUserFound) return done(new Error('Invalid session invitation.'));
      return done(null, ticket);
    });
  }

  function createApplication (ticket, done) {
    const application = {
      sessionId   : ticket.sessionId,
      ticketName  : ticket.name,
      ticketType  : ticket.type,
      ticketId    : ticket.id,
      userId      : invitedUserId,
      status      : 'approved',
      emailSubject: invitation.emailSubject,
    };

    async.waterfall([
      loadSession,
      loadEvent,
      saveApplication,
    ], done);

    function loadSession (done) {
      seneca.act({role: plugin, cmd: 'loadSession', id: ticket.sessionId}, done);
    }

    function loadEvent (session, done) {
      seneca.act({role: plugin, cmd: 'getEvent', id: session.eventId}, (err, event) => {
        if (err) return done(err);
        application.eventId = event.id;
        application.dojoId = event.dojoId;
        return done(null, event);
      });
    }

    function saveApplication (event, done) {
      const applications = [application];
      seneca.act({role: plugin, cmd: 'bulkApplyApplications', applications: applications, user: user, locality: locality}, done);
    }
  }
}

module.exports = validateSessionInvitation;
