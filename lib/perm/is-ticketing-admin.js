'use strict';
var _ = require('lodash');


function isTicketingAdmin (args, cb) {
  var seneca = this;
  var plugin = args.role;
  var userId, dojoId;
  if(args.user && _.isUndefined(userId)) userId = args.user.id;
  if(args.query && _.isUndefined(dojoId)) dojoId = args.query.dojoId;
  if(args.eventInfo && _.isUndefined(dojoId)) dojoId = args.eventInfo.dojoId;
  if(args.query && _.isUndefined(dojoId)) dojoId = args.query.id;
  var isTicketingAdmin = false;
  //  Could also check the opposite way, from child to Parent
  seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query: { userId: userId, dojoId: dojoId }},
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

module.exports = isTicketingAdmin;
