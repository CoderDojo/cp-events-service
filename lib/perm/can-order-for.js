'use strict';

function canOrderFor (args, cb) {
  const seneca = this;
  const plugin = args.role;
  const userId = args.user.id;
  const applications = args.params.applications;

  seneca.act({role: 'cd-profiles', cmd: 'load_children_for_user', userId: userId, user: args.user },
    function(err, children) {

      children = children || [];

      if(err || children.error){
        return cb(null, {allowed: false});
      }

      const childIds = children.map(child => child.userId);

      const validApplications = applications.filter(application => (userId === application.userId || childIds.indexOf(application.userId) > -1));

      const canOrderFor = validApplications.length === applications.length;

      return cb(null, {'allowed': canOrderFor});
  });
}

module.exports = canOrderFor;
