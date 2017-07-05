const _ = require('lodash');

function saveApplication(args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/applications';
  const applicationsEntity = seneca.make(ENTITY_NS);

  const application = args.application;
  delete application.emailSubject;
  if (_.isEmpty(application)) return callback(null, { error: 'args.application is empty' });
  if (!application.id) application.created = new Date();
  //  TODO: separate with seneca-mesh to avoid coupling of services
  applicationsEntity.save$(application, (err, result) => {
    if (err) return callback(err);
    if (application.attendance && !_.isEmpty(application.attendance)) {
      seneca.act({
        role: 'cd-badges',
        cmd : 'assignRecurrentBadges',
        application,
      }, err => {
        if (err) return callback(err);
        return callback(null, result);
      });
    } else {
      return callback(null, result);
    }
  });
}
module.exports = saveApplication;
