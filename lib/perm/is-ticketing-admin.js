'use strict';
var _ = require('lodash');
var async = require('async');

function isTicketingAdmin (args, cb) {
  var seneca = this;
  var plugin = args.role;
  var userId, dojoId, eventId, sessionId;
  if(args.user) userId = args.user.id;
  if (args.params) {
    if(args.params.query) dojoId = args.params.query.dojoId;
    if(args.params.eventInfo && _.isUndefined(dojoId)) dojoId = args.params.eventInfo.dojoId;
    if(args.params.query && _.isUndefined(dojoId)) dojoId = args.params.query.id;
    // Used in updateApplication
    if(args.params.data && _.isUndefined(dojoId)) dojoId = args.params.data.dojoId;
    // Used in export csv
    if(args.params.dojoId && _.isUndefined(dojoId)) dojoId = args.params.dojoId;
    // Used by Manage-events-users
    if(args.params.query && _.isUndefined(dojoId)) eventId = args.params.query.eventId;
    if(args.params.query && _.isUndefined(dojoId) && _.isUndefined(eventId)) sessionId = args.params.query.sessionId;
  } else {
    if(args.query) dojoId = args.query.dojoId;
    if(args.eventInfo && _.isUndefined(dojoId)) dojoId = args.eventInfo.dojoId;
    if(args.query && _.isUndefined(dojoId)) dojoId = args.query.id;
  }

  var isTicketingAdmin = false;
  //  Could also check the opposite way, from child to Parent
  function checkPrerequisites (wfCb) {
    function getEventFromSession (_wCb) {
      if (sessionId) { // We need to get the dojoId associated
        seneca.act({role: 'cd-events', cmd: 'loadSession', id: sessionId}, function (err, session) {
          if (err) return cb(err);
          if (session.eventId) {
            eventId = session.eventId;
            return _wCb();
          } else {
            return cb(null, {'allowed': false});
          }
        });
      } else {
        return _wCb();
      }
    }
    function getDojoFromEvent (_wCb) {
      if (eventId) { // We need to get the dojoId associated
        seneca.act({role: 'cd-events', cmd: 'getEvent', id: eventId}, function (err, event) {
          if (err) return cb(err);
          if (event.dojoId) {
            dojoId = event.dojoId;
            return _wCb();
          } else {
            return cb(null, {'allowed': false});
          }
        });
      } else {
        return _wCb();
      }
    }
    if (_.isUndefined(dojoId) && (eventId || sessionId)) {
      async.waterfall([
        getEventFromSession,
        getDojoFromEvent
      ], wfCb);
    } else {
      return wfCb();
    }
  }
  function verifyPermissions(wfCb) {
    if (_.isUndefined(dojoId)) return cb(null, {'allowed': false});
    seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query: { userId: userId, dojoId: dojoId, deleted: 0 }},
    function (err, response) {
      var userDojoEntity = response[0];
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isTicketingAdmin', err, {userId: userId, dojoId: dojoId}));
        return cb(null, {'allowed': false});
      }
      isTicketingAdmin = _.find(userDojoEntity.userPermissions, function (userPermission) {
        return userPermission.name === 'ticketing-admin';
      });
      return cb(null, {'allowed': !!isTicketingAdmin});
    });
  }
  async.waterfall([
    checkPrerequisites,
    verifyPermissions
  ]);
}

module.exports = isTicketingAdmin;
