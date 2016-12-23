'use strict';

module.exports = function (seneca) {
  seneca.listen()
    .client({type: 'web', host: process.env.CD_BADGES || 'localhost', port: 10305, pin: {role: 'cd-badges', cmd: '*'}})
    .client({type: 'web', host: process.env.CD_DOJOS || 'localhost', port: 10301, pin: {role: 'cd-dojos', cmd: '*'}})
    .client({type: 'web', host: process.env.CD_USERS || 'localhost', port: 10303, pin: {role: 'cd-users', cmd: '*'}})
    .client({type: 'web', host: process.env.CD_USERS || 'localhost', port: 10303, pin: {role: 'cd-profiles', cmd: '*'}});
};
