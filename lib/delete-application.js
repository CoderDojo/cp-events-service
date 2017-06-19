'use strict';

function deleteApplication (args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/applications';
  const applications = seneca.make(ENTITY_NS);
  const id = args.applicationId;
  // TODO: Delete all cd_attendance records associated with this userId and eventId.
  applications.remove$(id, (err) => {
    if (err) return callback(err);
    callback(null, {ok: true});
  });
}

module.exports = deleteApplication;
