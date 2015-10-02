'use strict';

var saveEvent = require('./save-event');
var getEvent = require('./get-event');
var listEvents = require('./list-events');
var deleteEvent = require('./delete-event');
var searchEvents = require('./search-events');
var loadEventApplications = require('./load-event-applications');
var searchApplications = require('./search-applications');
var deleteApplication = require('./delete-application');
var saveApplication = require('./save-application');
var userDojosEvents = require('./user-dojos-events');
var ticketTypes = require('./ticket-types');
var exportGuestList = require('./export-guest-list');
var searchSessions = require('./search-sessions');
var saveSession = require('./save-session');
var bulkApplyApplications = require('./bulk-apply-applications');
var updateApplicationAttendance = require('./update-application-attendance');
var loadApplication = require('./load-application');
var cancelSession = require('./cancel-session');
var loadSession = require('./load-session');
var saveTicket = require('./save-ticket');
var searchTickets = require('./search-tickets');

module.exports = function () {
  var seneca = this;
  var plugin = 'cd-events';

  seneca.add({role: plugin, cmd: 'saveEvent'}, saveEvent.bind(seneca));
  seneca.add({role: plugin, cmd: 'getEvent'}, getEvent.bind(seneca));
  seneca.add({role: plugin, cmd: 'listEvents'}, listEvents.bind(seneca));
  seneca.add({role: plugin, cmd: 'deleteEvent'}, deleteEvent.bind(seneca));
  seneca.add({role: plugin, cmd: 'searchEvents'}, searchEvents.bind(seneca));
  seneca.add({role: plugin, cmd: 'loadEventApplications'}, loadEventApplications.bind(seneca));
  seneca.add({role: plugin, cmd: 'searchApplications'}, searchApplications.bind(seneca));
  seneca.add({role: plugin, cmd: 'deleteApplication'}, deleteApplication.bind(seneca));
  seneca.add({role: plugin, cmd: 'saveApplication'}, saveApplication.bind(seneca));
  seneca.add({role: plugin, cmd: 'userDojosEvents'}, userDojosEvents.bind(seneca));
  seneca.add({role: plugin, cmd: 'ticketTypes'}, ticketTypes.bind(seneca));
  seneca.add({role: plugin, cmd: 'exportGuestList'}, exportGuestList.bind(seneca));
  seneca.add({role: plugin, cmd: 'searchSessions'}, searchSessions.bind(seneca));
  seneca.add({role: plugin, cmd: 'saveSession'}, saveSession.bind(seneca));
  seneca.add({role: plugin, cmd: 'bulkApplyApplications'}, bulkApplyApplications.bind(seneca));
  seneca.add({role: plugin, cmd: 'updateApplicationAttendance'}, updateApplicationAttendance.bind(seneca));
  seneca.add({role: plugin, cmd: 'loadApplication'}, loadApplication.bind(seneca));
  seneca.add({role: plugin, cmd: 'cancelSession'}, cancelSession.bind(seneca));
  seneca.add({role: plugin, cmd: 'loadSession'}, loadSession.bind(seneca));
  seneca.add({role: plugin, cmd: 'saveTicket'}, saveTicket.bind(seneca));
  seneca.add({role: plugin, cmd: 'searchTickets'}, searchTickets.bind(seneca));

  return {
    name: plugin
  };
};
