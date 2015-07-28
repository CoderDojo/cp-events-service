'use strict'

var async = require('async');
var _ = require('lodash');

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
      created_at: new Date(),
      created_by: eventInfo.userId,
      description: eventInfo.description,
      dojo_id: eventInfo.dojoId,
      invites: eventInfo.invites,
      name: eventInfo.name,
      position: eventInfo.position,
      public: eventInfo.public,
      status: eventInfo.status,
      user_type: eventInfo.userType,
      type: eventInfo.type,
      recurring_type: eventInfo.recurringType
    };

    if (eventInfo.id) { //Check if this is an update.
      newEvent.id = eventInfo.id;
    }

    if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
      var err = new Error('Dates must be specified');
      return done(err);
    }

    newEvent.dates = eventInfo.dates;

    var eventEntity = seneca.make$(ENTITY_NS);

    eventEntity.save$(newEvent, done);
  }

  function saveInvites(event, done) {
    if(!_.isEmpty(eventInfo.invites)) {
      //Send invite email
      //TODO: use async.each as soon as SMTP server is in place.
      async.eachSeries(eventInfo.invites, function (user, cb) {
        seneca.act({role: 'cd-profiles', cmd: 'list', query: {userId: user.id}}, function (err, response) {
          if(err) return cb(err);
          var profile = response;
          var application = {
            event_id: event.id,
            user_id: user.id,
            name: user.name,
            date_of_birth: profile.dob,
            status: 'approved'
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