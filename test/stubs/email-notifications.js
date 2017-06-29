'use strict';

module.exports = function() {
  const seneca = this;
  const plugin = 'email-notifications';

  seneca.add({ role: plugin, cmd: 'send' }, cmd_send);

  function cmd_send(args, done) {
    done();
  }

  return {
    name: plugin,
  };
};
