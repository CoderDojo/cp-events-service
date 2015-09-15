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

seneca.ready(function () {

  function addEventsEndTime(cb) {
    var applicationsEntity = seneca.make$('cd/applications');
    var attendanceEntity = seneca.make$('cd/attendance');
    async.waterfall([
      function (done) {
        var eventsEntity = seneca.make$('cd/events');

        eventsEntity.list$({limit$: 'NULL'}, done);
      },
      function (events, done) {
        //remove all events from DB
        var ids = _.pluck(events, 'id');
        var eventsEntity = seneca.make$('cd/events');
        async.each(ids, function (id, done) {
          eventsEntity.remove$({id: id}, done);
        }, done(null, events));
      },
      function (events, done) {
        //use native PG to alter table data type from timestamp with time zone[] to json[]
        var localPgOptions = _.defaults({}, config["postgresql-store"]);
        localPgOptions.database = _.get(config, 'postgresql-store.name');
        localPgOptions.user = _.get(config, 'postgresql-store.username');

        pg.connect(localPgOptions, function (err, client) {
          if (err) return done(err);
          client.query("ALTER TABLE cd_events DROP COLUMN IF EXISTS dates;" +
            "ALTER TABLE cd_events ADD COLUMN dates json[];", function (err, results) {
            if (err) return done(err);
            client.end();
            return done(null, events);
          });
        });
      },
      function (events, done) {
        //update events "dates" field and re save them to altered DB
        console.log('processing', events.length, 'events');

        async.eachSeries(events, function (event, callback) {
          var eventDates = [];

          var oldEventId = event.id;
          delete event.id; // if id is not deleted entity.save$ doesn't work

          async.eachSeries(event.dates, function (date, done) {
            console.log('date: ' + date.toISOString());
            if (_.has(date, 'startTime') && _.has(date, 'endTime')) {
              eventDates.push(eventDate);
            } else {
              var amendedEventDate = {
                startTime: moment.utc(date).toDate(),
                endTime: moment.utc(date).add(2, 'hours').toDate()
              };

              eventDates.push(amendedEventDate);
              console.log('amended event date: ' + JSON.stringify(amendedEventDate));
            }
            done();
          }, function (err) {
            if (err) return callback(err);

            event.dates = eventDates;

            var eventsEntity = seneca.make$('cd/events');

            eventsEntity.save$(event, function (err, response) {
              if (err) return callback(err);
              // amend existing applications records event_id values to have the new id;
              applicationsEntity.list$({eventId: oldEventId}, function (err, list) {
                if (err) return callback(err);
                async.eachSeries(list, function (application, callback) {
                  application.eventId = response.id;
                  applicationsEntity.save$(application, callback);
                }, function (err) {
                  // amend existing attendance records
                  if (err) return callback(err);
                  attendanceEntity.list$({eventId: oldEventId}, function (err, list) {
                    if (err) return callback(err);
                    async.eachSeries(list, function (attendance, callback) {
                      var utcOffset = moment().utcOffset();
                      attendance.eventId = response.id;
                      attendance.eventDate = moment.utc(attendance.eventDate).subtract(utcOffset, 'minutes').toDate();
                      attendanceEntity.save$(attendance, callback);
                    }, callback)
                  })
                })
              })
            });
          })
        }, done);
      }
    ], cb);
  }

  addEventsEndTime(function (err) {
    if (err) {
      console.error('error:', err);
    }
    console.log("Done");
    seneca.close(function () {
      process.exit();
    });
  });
});