'use strict';
var async = require('async');
var _     = require('lodash');

function loadEventApplications(args, callback) {
  var seneca = this;
  var plugin = args.role;
  var ENTITY_NS = 'cd/applications';
  var applications = seneca.make$(ENTITY_NS);

  var eventId = args.eventId;
  var user = args.user;

  async.waterfall([
    checkUserPermissions,
    listApplications
  ], callback)

  function checkUserPermissions(done) {
    //Current user must be champion and ticketing admin of this event's Dojo.
    var isChampion = false;

    //Check if this user is a member of this event's Dojo.
    seneca.act({role:plugin, cmd:'getEvent', id:eventId}, function(err, event) {
      if(err) return done(err);
      var dojoId = event.dojoId;
      seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query:{userId:user.id, dojoId: dojoId}}, function (err, response) {
        if(err) return done(err);
        if(_.isEmpty(response)) return done(null, false);//Not a member of this Dojo, no permission.
        var userDojoEntity = response[0];
        var userTypes = userDojoEntity.userTypes;
        var userPermissions = userDojoEntity.userPermissions;
        if(_.contains(userTypes, 'champion')) isChampion = true;
        var isTicketingAdmin = _.find(userPermissions, function(userPermission) {
          return userPermission.name === 'ticketing-admin';
        });
        if(isChampion && isTicketingAdmin) return done(null, true);
        return done(null, false);
      });
    });
  }

  function listApplications(hasPermission, done) {
    if(!hasPermission) {
      var err = new Error('loadEventApplications-permission-error');
      err.critical = false;
      err.httpstatus = 403;
      done(err);
    }
    applications.list$({eventId: eventId}, function(err, applications) {
      if (err) return done(err);
      done(null, applications);
    });
  }

}

module.exports = loadEventApplications;
