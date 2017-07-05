function isOwnApplication({ params, user }, cb) {
  const seneca = this;
  let applicationId;
  if (params.applicationId) applicationId = params.applicationId;
  const userId = user.id;
  let allowed = false;

  // load the application with this applicationId
  seneca.act({ role: 'cd-events', cmd: 'loadApplication', id: applicationId }, (err, application) => {
    // error handling
    if (err) {
      seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isOwnApplication', err, { userId, applicationId }));
      return cb(null, { allowed });
      // if some data is found for this application
    } else if (application) {
      // if the userId of the application that was found matches that of our user...
      if (application.userId === userId) {
        // ...then it's their application
        allowed = true;
      }
    }
    return cb(null, { allowed });
  });
}

module.exports = isOwnApplication;
