'use strict';
const _ = require('lodash');

function isTicketingAdmin (args, cb) {
  const seneca = this;
  let userId, dojoId;
  if(args.user && _.isUndefined(userId)) userId = args.user.id;
  if(args.query && _.isUndefined(dojoId)) dojoId = args.query.dojoId;
  if(args.eventInfo && _.isUndefined(dojoId)) dojoId = args.eventInfo.dojoId;
  if(args.query && _.isUndefined(dojoId)) dojoId = args.query.id;
  let isTicketingAdmin = false;
  //  Could also check the opposite way, from child to Parent
  seneca.act({role: 'cd-dojos', cmd: 'load_usersdojos', query: { userId: userId, dojoId: dojoId }},
    (err, response) => {
      const userDojoEntity = response[0];
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isTicketingAdmin', err, {userId: userId, dojoId: dojoId}));
        return cb(null, {'allowed': false});
      }
      isTicketingAdmin = _.find(userDojoEntity.userPermissions, (userPermission) => {
        return userPermission.name === 'ticketing-admin';
      });
      return cb(null, {'allowed': !!isTicketingAdmin});
    });
}

module.exports = isTicketingAdmin;
