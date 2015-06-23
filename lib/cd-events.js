'use strict';

var saveEvent = require('./save-event');
var getEvent = require('./get-event');
var listEvents = require('./list-events');
var deleteEvent = require('./delete-event');
var searchEvents = require('./search-events');
var applyForEvent = require('./apply-for-event');
var loadEventApplications = require('./load-event-applications');
var updateApplication = require('./update-application');

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

  return {
    name: plugin
  };
};
