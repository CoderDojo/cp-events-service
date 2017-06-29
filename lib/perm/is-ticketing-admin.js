'use strict';

const _ = require('lodash');

function isTicketingAdmin({ user, query, eventInfo }, cb) {
  const seneca = this;
  let userId;
  let dojoId;
  if (user && _.isUndefined(userId)) userId = user.id;
  if (query && _.isUndefined(dojoId)) dojoId = query.dojoId;
  if (eventInfo && _.isUndefined(dojoId)) dojoId = eventInfo.dojoId;
  if (query && _.isUndefined(dojoId)) dojoId = query.id;
  let isTicketingAdmin = false;
  //  Could also check the opposite way, from child to Parent
  seneca.act({ role: 'cd-dojos', cmd: 'load_usersdojos', query: { userId, dojoId } }, (err, response) => {
    const userDojoEntity = response[0];
    if (err) {
      seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isTicketingAdmin', err, { userId, dojoId }));
      return cb(null, { allowed: false });
    }
    isTicketingAdmin = _.find(userDojoEntity.userPermissions, ({ name }) => {
      return name === 'ticketing-admin';
    });
    return cb(null, { allowed: !!isTicketingAdmin });
  });
}

module.exports = isTicketingAdmin;
