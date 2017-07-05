function sendTest() {
  const seneca = this;
  const plugin = 'email-notifications';

  seneca.add({ role: plugin, cmd: 'send' }, cmdSend);

  function cmdSend(args, done) {
    done();
  }

  return {
    name: plugin,
  };
}

module.exports = sendTest;
