'use strict';

module.exports = function () {
  return {
    'saveEvent': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'getEvent': [{
      role: 'basic-user'
    }],
    'listEvents': [{
      role: 'basic-user'
    }],
    'deleteEvents': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'loadEventApplications': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'searchApplications': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'deleteApplication': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'saveApplication': [{
      role: 'basic-user'
    }],
    'userDojosEvents': [{
      role: 'basic-user'
    }],
    'ticketTypes': [{
      role: 'basic-user'
    }],
    'exportGuestList': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'searchSessions': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'saveSession': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'bulkApplyApplications': [{
      role: 'basic-user'
    }],
    'updateApplicationAttendance': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'loadApplication': [{
      role: 'basic-user'
    }],
    'cancelSession': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'loadSession': [{
      role: 'basic-user'
    }],
    'saveTicket': [{
      role: 'basic-user',
      customValidator: [{
      	role: 'cd-events',
      	cmd: 'is_ticketing_admin'
      }]
    }],
    'searchTickets': [{
      role: 'basic-user'
    }],
    'validateSessionInvitation': [{
      role: 'basic-user'
    }],
    'loadTicket': [{
      role: 'basic-user'
    }]
  };
};