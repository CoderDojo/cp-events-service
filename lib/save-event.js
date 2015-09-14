'use strict'

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function saveEvent(args, callback) {
  var seneca = this;
  var ENTITY_NS = 'cd/events';

  var eventInfo = args.eventInfo;
  var plugin = args.role;

  async.waterfall([
    saveEvent,
    saveInvites
  ], function (err, res) {
    if(err) return callback(err);
    return callback(null, res);
  });

  function saveEvent(done) {
    var newEvent = {
      address: eventInfo.address,
      capacity: eventInfo.capacity,
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
      userType: eventInfo.userType,
      type: eventInfo.type,
      recurringType: eventInfo.recurringType
    };

    if (eventInfo.id) { //Check if this is an update.
      newEvent.id = eventInfo.id;
    }

    if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
      var err = new Error('Dates must be specified');
      return done(err);
    }

    var pastDateFound = _.find(eventInfo.dates, function (date) {
      return moment().diff(date, 'minutes') > 0;
    });

    if(pastDateFound) return done(null, {ok:false, why:'Past events cannot be created'});

    newEvent.dates = eventInfo.dates;

    var eventEntity = seneca.make$(ENTITY_NS);
    eventEntity.save$(newEvent, done);
  }

  function saveInvites(event, done) {
    if(!_.isEmpty(eventInfo.invites && event.id)) {
      //Send invite email
      //TODO: use async.each as soon as SMTP server is in place.
      async.eachSeries(eventInfo.invites, function (user, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: user.id}}, function (err, response) {
          if(err) return cb(err);
          var profile = response;
          var application = {
            eventId: event.id,
            userId: user.id,
            name: user.name,
            dateOfBirth: profile.dob,
            status: 'approved',
            emailSubject: eventInfo.emailSubject
          };
          seneca.act({role: plugin, cmd: 'updateApplication', application: application}, cb);
        });
      }, done);  
    } else {
      setImmediate(function(){
        return done(null, event);  
      });
    }
    
  }

}

module.exports = saveEvent;