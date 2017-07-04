

module.exports = function () {
  const seneca = this;
  const plugin = 'cd-users';

  seneca.add({ role: plugin, cmd: 'list' }, cmd_list);
  seneca.add({ role: plugin, cmd: 'load' }, cmd_load);
  seneca.add({ role: plugin, cmd: 'update' }, cmd_update);
  seneca.add({ role: plugin, cmd: 'get_init_user_types' }, cmd_get_init_user_types);

  function cmd_list(args, done) {
    done(null, []);
  }

  function cmd_load(args, done) {
    done(null, { joinRequests: [] });
  }

  function cmd_update({ user }, done) {
    done(null, user);
  }

  function cmd_get_init_user_types(args, done) {
    done(null, []);
  }

  return {
    name: plugin,
  };
};
