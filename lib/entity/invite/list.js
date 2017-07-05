'use strict';

function listInvite (args, cb) {
  var seneca = this;
  var query = args.query;
  var ent = seneca.make('v/ticket_invitations');
  ent.list$(query, cb);
}

module.exports = listInvite;
