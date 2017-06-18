'use strict';

const saveEvent = require('./save-event');
const getEvent = require('./get-event');
const listEvents = require('./list-events');
const deleteEvent = require('./delete-event');
const searchEvents = require('./search-events');
const loadEventApplications = require('./load-event-applications');
const searchApplications = require('./search-applications');
const deleteApplication = require('./delete-application');
const saveApplication = require('./save-application');
const userDojosEvents = require('./user-dojos-events');
const ticketTypes = require('./ticket-types');
const exportGuestList = require('./export-guest-list');
const searchSessions = require('./search-sessions');
const saveSession = require('./save-session');
const bulkApplyApplications = require('./bulk-apply-applications');
const updateApplicationAttendance = require('./update-application-attendance');
const loadApplication = require('./load-application');
const cancelSession = require('./cancel-session');
const loadSession = require('./load-session');
const saveTicket = require('./save-ticket');
const searchTickets = require('./search-tickets');
const validateSessionInvitation = require('./validate-session-invitation');
const loadTicket = require('./load-ticket');
const getSessionsFromEventId = require('./get-sessions-from-event-id');
const isTicketingAdmin = require('./perm/is-ticketing-admin');

module.exports = function () {
  const seneca = this;
  const plugin = 'cd-events';

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
  seneca.add({role: plugin, cmd: 'validateSessionInvitation'}, validateSessionInvitation.bind(seneca));
  seneca.add({role: plugin, cmd: 'loadTicket'}, loadTicket.bind(seneca));
  seneca.add({role: plugin, cmd: 'getSessionsFromEventId'}, getSessionsFromEventId.bind(seneca));
  
  // PERMS
  seneca.add({role: plugin, cmd: 'is_ticketing_admin'}, isTicketingAdmin.bind(seneca));
  seneca.add({role: plugin, cmd: 'is_own_application'}, require('./perm/is-own-application'));
  seneca.add({role: plugin, cmd: 'is_parent_of_applicant'}, require('./perm/is-parent-of-applicant'));

  return {
    name: plugin,
  };
};
