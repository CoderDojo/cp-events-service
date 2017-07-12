'use strict';

var _ = require('lodash');
var async = require('async');

module.exports = function (options) {
  var seneca = this;
  var plugin = 'test-event-data';

  seneca.add({ role: plugin, cmd: 'insert', entity: 'event'}, function (args, done) {
    var events = require('../fixtures/e2e/events');
    var dojo = {};
    async.eachSeries(events, function (event, sCb) {
      seneca.act({role: 'cd-dojos', cmd: 'list', query: {email: event.dojo}}, function (err, dojos) {
        // Even if we run out of dojos, we can reuse the previous one
        if(!_.isEmpty(dojos)) dojo = dojos[0];
        var now = new Date();
        event.dojoId = dojo.id;
        now.setDate(now.getDate() + 5);
        event.dates[0].startTime = now.toISOString();
        now.setTime(now.getTime() + (3 * 60 * 60 * 1000));
        event.dates[0].endTime = now.toISOString();
        delete event.dojo;
        seneca.act({role: 'cd-events', cmd: 'saveEvent', eventInfo: event}, sCb);
      });
    }, function (err, events) {
      done();
    });
  });

  seneca.add({ role: plugin, cmd: 'insert', entity: 'application'}, function (args, done) {
    var applications = require('../fixtures/e2e/applications');

    async.eachSeries(applications, function (application, sCb) {
      async.waterfall([
        getEvent,
        getTicket,
        getUser,
        saveApplication
      ], function (err, applications){
        sCb(null);
      });

      function getEvent (wfCb) {
        seneca.act({role: 'cd-events', cmd: 'listEvents', query: {name: application.eventName}}, function (err, events) {
          return wfCb(null, events[0]);
        });
      }
      function getTicket (event, wfCb) {
        seneca.act({role: 'cd-events', cmd: 'searchTickets', query: {name: application.ticketName}}, function (err, tickets) {
          return wfCb(null, event, tickets[0]);
        });
      }
      function getUser (event, ticket, wfCb) {
        var query = {};
        if (application.userEmail) {
          query.email = application.userEmail;
        } else {
          query.name = application.userName;
        }
        seneca.act({role: 'cd-users', cmd: 'list', query: query}, function (err, users) {
          return wfCb(null, event, ticket, users[0]);
        });
      }

      function saveApplication (event, ticket, user, wfCb) {
        var payload = {
          ticketId: ticket.id, eventId: event.id, sessionId: ticket.sessionId, dojoId: event.dojoId,
          name: user.name, dateOfBirth: user.dob, userId: user.id,
          ticketName: ticket.name, ticketType: ticket.type,
          created: new Date(),
          deleted: false,
          attendance : [],
          notes: "No Notes"
        };
        seneca.act({role: 'cd-events', cmd: 'saveApplication', application: payload}, wfCb);
      }


    }, function (err, events){
      done();
    });


  });

  return {
    name: plugin
  };
};
