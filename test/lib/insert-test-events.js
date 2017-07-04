

const _ = require('lodash');
const async = require('async');

module.exports = function () {
  const seneca = this;
  const plugin = 'test-event-data';

  seneca.add({ role: plugin, cmd: 'insert', entity: 'event' }, (args, done) => {
    const events = require('../fixtures/e2e/events');
    let dojo = {};
    async.eachSeries(events, (event, sCb) => {
      seneca.act({ role: 'cd-dojos', cmd: 'list', query: { email: event.dojo } }, (err, dojos) => {
        // Even if we run out of dojos, we can reuse the previous one
        if (!_.isEmpty(dojos)) dojo = dojos[0];
        const now = new Date();
        event.dojoId = dojo.id;
        now.setDate(now.getDate() + 5);
        event.dates[0].startTime = now.toISOString();
        now.setTime(now.getTime() + (3 * 60 * 60 * 1000));
        event.dates[0].endTime = now.toISOString();
        delete event.dojo;
        seneca.act({ role: 'cd-events', cmd: 'saveEvent', eventInfo: event }, sCb);
      });
    }, () => done());
  });

  seneca.add({ role: plugin, cmd: 'insert', entity: 'application' }, (args, done) => {
    const applications = require('../fixtures/e2e/applications');

    async.eachSeries(applications, ({ eventName, ticketName, userEmail, userName }, cb) => {
      async.waterfall([
        getEvent,
        getTicket,
        getUser,
        saveApplication,
      ], () => cb(null));

      function getEvent(wfCb) {
        seneca.act({
          role : 'cd-events',
          cmd  : 'listEvents',
          query: { name: eventName },
        }, (err, events) => wfCb(null, events[0]));
      }

      function getTicket(event, wfCb) {
        seneca.act({
          role : 'cd-events',
          cmd  : 'searchTickets',
          query: { name: ticketName },
        }, (err, tickets) => wfCb(null, event, tickets[0]));
      }

      function getUser(event, ticket, wfCb) {
        const query = {};
        if (userEmail) {
          query.email = userEmail;
        } else {
          query.name = userName;
        }
        seneca.act({
          role: 'cd-users',
          cmd : 'list',
          query,
        }, (err, users) => wfCb(null, event, ticket, users[0]));
      }

      function saveApplication(event, ticket, user, wfCb) {
        const payload = {
          ticketId   : ticket.id,
          eventId    : event.id,
          sessionId  : ticket.sessionId,
          dojoId     : event.dojoId,
          name       : user.name,
          dateOfBirth: user.dob,
          userId     : user.id,
          ticketName : ticket.name,
          ticketType : ticket.type,
          created    : new Date(),
          deleted    : false,
          attendance : [],
          notes      : 'No Notes',
        };
        seneca.act({ role: 'cd-events', cmd: 'saveApplication', application: payload }, wfCb);
      }
    }, () => done());
  });

  return {
    name: plugin,
  };
};
