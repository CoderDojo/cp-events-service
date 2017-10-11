/**
 * Load user's (and its children) applications for an event
 * @param  {Object}   args    {user, eventId}
 * @return {[Applications]}    List of applications
 */
module.exports = function (args, done) {
  var seneca = this;
  var role = args.role;
  var eventId = args.eventId;
  var user = args.user;
  // TODO : extend to allow selection of profile
  // TODO : extend to allow selection of status/deletion ?
  seneca.act({role: 'cd-profiles', cmd: 'load_user_profile', userId: user.id},
  function (err, profile) {
    if (err) return done(err);
    var children = profile.children;
    var userIds = children.concat(user.id);
    seneca.act({role: role, cmd: 'searchApplications', query: {userId: { in$: userIds }, eventId: eventId, deleted: 0, status: {ne$: 'cancelled'}}},
    function (err, applications) {
      if (err) return done(err);
      done(null, applications);
    });
  });
};
