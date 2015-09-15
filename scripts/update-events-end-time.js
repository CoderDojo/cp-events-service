'use strict';
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var pg = require('pg');

var config = require('../config/config.js')();

var seneca = require('seneca')();

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);

seneca.use('postgresql-store', config["postgresql-store"]);
seneca.use(require('../lib/cd-events'));

seneca.ready(function() {

  function addEventsEndTime(cb) {
    var eventsEntity = seneca.make$('cd/events');
    var applicationsEntity = seneca.make$('cd/events');
    var attendanceEntity = seneca.make$('cd/events');
    async.waterfall([
      function(done) {
        eventsEntity.list$({limit$:'NULL'}, done);
      },
      function(events, done) {
        //remove all events from DB
        var ids = _.pluck(events, 'id');
        async.each(ids, function(id, done){
          eventsEntity.remove$({id: id}, done);
        }, done(null, events));
      },
      function(events, done){
        //use native PG to alter table data type from timestamp with time zone[] to json[]
        var localPgOptions = _.defaults({}, config["postgresql-store"]);
        localPgOptions.database = _.get(config, 'postgresql-store.name');
        localPgOptions.user = _.get(config, 'postgresql-store.username');

        pg.connect(localPgOptions, function (err, client) {
          if(err) return done(err);
          client.query("ALTER TABLE cd_events DROP COLUMN IF EXISTS dates;" +
                       "ALTER TABLE cd_events ADD COLUMN dates json[];", function (err, results) {
            if(err) return done(err);
            client.end();
            return done(null, events);
          });
        });
      },
      function(events, done) {
        //update events "dates" field and re save them to altered DB
        console.log('processing', events.length, 'events');

        if(events.length > 0){
          async.eachSeries(events, function(event, callback){
            if(_.isArray(event.dates)){
              var eventDates = [];
              async.each(event.dates, function(date, done){
                console.log('date: ' + date.toISOString());
                if(_.has(date, 'startTime') && _.has(date, 'endTime')){
                  eventDates.push(eventDate);
                } else {
                  var amendedEventDate = {
                    startTime: moment.utc(date).toDate(),
                    endTime: moment.utc(date).add(2, 'hours').toDate()
                  };

                  eventDates.push(amendedEventDate);
                  console.log('amended event date: ' + JSON.stringify(amendedEventDate));
                }
                
                event.dates = eventDates;
                var oldEventId = _.clone(event.id);
                delete event.id; // if id is not deleted entity.save$ doesn't work
                eventsEntity.save$(event, function (err, response) {
                  if (err) return done(err);
                  // amend existing applications records event_id values to have the new id;
                  applicationsEntity.list$({eventId: oldEventId}, function (err, list) {
                    if (err) return done(err);
                    async.eachSeries(list, function (application, callback) {
                      application.eventId = response.id;
                      applicationsEntity.save$(application, callback);
                    }, function (err) {
                      // amend existing attendance records
                      if (err) return done(err);
                      attendanceEntity.list$({eventId: oldEventId}, function (err, list) {
                        if (err) return done(err);
                        async.eachSeries(list, function (attendance, callback) {
                          attendance.eventId = response.id;
                          attendance.eventDate = moment.utc(attendance.eventDate).toDate();
                          attendanceEntity.save$(attendance, callback);
                        }, done)
                      })
                    })
                  })
                });
              }, callback);
            } else {
              console.log('is not array');
              return callback;
            }
          }, done)
        } else {
          return done();
        }
      }
    ], cb);
  }

  addEventsEndTime(function(err) {
    if (err) {
      console.error('error:', err);
    }
    console.log("Done");
    seneca.close(function(){
      process.exit();
    });
  });
});
