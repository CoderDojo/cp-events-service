'use strict';

var saveEvent = require('./save-event');
var getEvent = require('./get-event');
var listEvents = require('./list-events');
var deleteEvent = require('./delete-event');
var searchEvents = require('./search-events');
var applyForEvent = require('./apply-for-event');
var loadEventApplications = require('./load-event-applications');
var updateApplication = require('./update-application');
var searchApplications = require('./search-applications');
var bulkUpdateApplications = require('./bulk-update-applications');
var deleteApplication = require('./delete-application');
var saveApplication = require('./save-application');
var searchAttendance = require('./search-attendance');
var saveAttendance = require('./save-attendance');

module.exports = function() {
  var seneca = this;
  var plugin = 'cd-events';

  seneca.add({ role: plugin, cmd: 'saveEvent'}, saveEvent.bind(seneca));
  seneca.add({ role: plugin, cmd: 'getEvent'}, getEvent.bind(seneca));
  seneca.add({ role: plugin, cmd: 'listEvents'}, listEvents.bind(seneca));
  seneca.add({ role: plugin, cmd: 'deleteEvent'}, deleteEvent.bind(seneca));
  seneca.add({ role: plugin, cmd: 'searchEvents'}, searchEvents.bind(seneca));
  seneca.add({ role: plugin, cmd: 'applyForEvent'}, applyForEvent.bind(seneca));
  seneca.add({ role: plugin, cmd: 'loadEventApplications'}, loadEventApplications.bind(seneca));
  seneca.add({ role: plugin, cmd: 'updateApplication'}, updateApplication.bind(seneca));
  seneca.add({ role: plugin, cmd: 'searchApplications'}, searchApplications.bind(seneca));
  seneca.add({ role: plugin, cmd: 'bulkUpdateApplications'}, bulkUpdateApplications.bind(seneca));
  seneca.add({ role: plugin, cmd: 'deleteApplication'}, deleteApplication.bind(seneca));
  seneca.add({ role: plugin, cmd: 'saveApplication'}, saveApplication.bind(seneca));
  seneca.add({ role: plugin, cmd: 'searchAttendance'}, searchAttendance.bind(seneca));
  seneca.add({ role: plugin, cmd: 'saveAttendance'}, saveAttendance.bind(seneca));

  return {
    name: plugin
  };
};
