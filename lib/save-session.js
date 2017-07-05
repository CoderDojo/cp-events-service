function saveSession(args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/sessions';
  const sessionEntity = seneca.make(ENTITY_NS);

  const session = args.session;
  if (!session) return callback(null, { error: 'args.session is empty' });
  sessionEntity.save$(session, callback);
}

module.exports = saveSession;
