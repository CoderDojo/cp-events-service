'use strict';

module.exports = function (seneca) {
  seneca.listen()
    .client({type: 'web', port: 10305, pin: {role: 'cd-badges', cmd: '*'}})
    .client({type: 'web', port: 10301, pin: 'role:cd-dojos,cmd:*'})
    .client({type: 'web', port: 10303, pin: 'role:cd-users,cmd:*'})
    .client({type: 'web', port: 10303, pin: 'role:cd-profiles,cmd:*'});
};
