'use strict';

var async = require('async');
var _ = require('lodash');

function validateSessionInvitation (args, callback) {
  var seneca = this;
  var user = args.user;
  var locality = args.locality || 'en_US';
  var plugin = args.role;
  var invitation = args.invitation;
  if (!invitation) return callback(null, {ok: false, why: 'args.invitation is empty'});
  var ticketId = invitation.ticketId;
  var invitedUserId = invitation.userId;
  async.waterfall([
    validateRequest,
    createApplication
  ], function (err, res) {
    if (err) return callback(null, {ok: false, why: err.message});
    return callback(null, {ok: true});
  });

  function validateRequest (done) {
    seneca.act({role: plugin, cmd: 'loadTicket', id: ticketId}, function (err, ticket) {
      if (err) return done(err);
      if (!ticket.invites || _.isEmpty(ticket.invites)) return done(new Error('No invites found'));
      var invitedUserFound = _.find(ticket.invites, function (invite) {
        return invite.userId === invitedUserId;
      });
      if (!invitedUserFound) return done(new Error('Invalid session invitation.'));
      return done(null, ticket);
    });
  }

  function createApplication (ticket, done) {
    var application = {
      sessionId: ticket.sessionId,
      ticketName: ticket.name,
      ticketType: ticket.type,
      ticketId: ticket.id,
      userId: invitedUserId,
      status: 'approved',
      emailSubject: invitation.emailSubject
    };

    async.waterfall([
      loadSession,
      loadEvent,
      saveApplication
    ], done);

    function loadSession (done) {
      seneca.act({role: plugin, cmd: 'loadSession', id: ticket.sessionId}, done);
    }

    function loadEvent (session, done) {
      seneca.act({role: plugin, cmd: 'getEvent', id: session.eventId}, function (err, event) {
        if (err) return done(err);
        application.eventId = event.id;
        application.dojoId = event.dojoId;
        return done(null, event);
      });
    }

    function saveApplication (event, done) {
      var applications = [application];
      seneca.act({role: plugin, cmd: 'bulkApplyApplications', applications: applications, user: user, locality: locality}, done);
    }
  }
}

module.exports = validateSessionInvitation;
