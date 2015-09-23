'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');
var shortid = require('shortid');

function saveEvent (args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';

  var eventInfo = args.eventInfo;
  var plugin = args.role;

  async.waterfall([
    saveEvent,
    saveSessions
  ], function (err, res) {
    if(err) return callback(null, {ok: false, why: err.message});
    return callback(null, res);
  });

  function saveEvent(done) {
    if(eventInfo.sessions && eventInfo.sessions.length > 20) return callback(new Error('You can only create a max of 20 sessions/rooms'));
    var maxTicketTypesExceeded = _.find(eventInfo.sessions, function (session) {
      return session.tickets.length > 20;
    });
    if(maxTicketTypesExceeded) return callback(new Error('You can only create a max of 20 ticket types'));

    var newEvent = {
      address: eventInfo.address,
      city: eventInfo.city,
      country: eventInfo.country,
      createdAt: new Date(),
      createdBy: eventInfo.userId,
      description: eventInfo.description,
      dojoId: eventInfo.dojoId,
      invites: eventInfo.invites,
      name: eventInfo.name,
      position: eventInfo.position,
      public: eventInfo.public,
      status: eventInfo.status,
      type: eventInfo.type,
      recurringType: eventInfo.recurringType
    };

    if (eventInfo.id) { // Check if this is an update.
      newEvent.id = eventInfo.id;
    }

    if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
      var err = new Error('Dates must be specified');
      return done(err);
    }

    var pastDateFound = _.find(eventInfo.dates, function (date) {
      var utcOffset = moment().utcOffset();
      return moment.utc(date.startTime).subtract(utcOffset, 'minutes').diff(moment.utc(), 'minutes') < 0;
    });

    if(pastDateFound && !eventInfo.id) return done(new Error('Past events cannot be created'));

    newEvent.dates = eventInfo.dates;

    var eventEntity = seneca.make$(ENTITY_NS);
    eventEntity.save$(newEvent, done);
  }


  function saveSessions(event, done) {
    if(!_.isEmpty(eventInfo.sessions)) {
      async.each(eventInfo.sessions, function (session, cb) {
        session.eventId = event.id;
        session.status = 'active';
        seneca.act({role: plugin, cmd: 'saveSession', session: session}, cb);
      }, function (err) {
        if(err) return done(err);
        return done(null, event);
      });
    } else {
      setImmediate(function () {
        return done(null, event);
      });
    }
  }

}

module.exports = saveEvent;
