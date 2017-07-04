function cdProfiles() {
  const seneca = this;
  const plugin = 'cd-profiles';

  seneca.add({ role: plugin, cmd: 'list' }, cmd_list);
  seneca.add({ role: plugin, cmd: 'search' }, cmd_search);
  seneca.add({ role: plugin, cmd: 'save' }, cmd_save);

  function cmd_list(args, done) {
    done(null, [{ userType: 'parent-guardian' }]);
  }

  function cmd_search(args, done) {
    done(null, [{}]);
  }

  function cmd_save({ profile }, done) {
    done(null, profile);
  }

  return {
    name: plugin,
  };
}

module.exports = cdProfiles;
