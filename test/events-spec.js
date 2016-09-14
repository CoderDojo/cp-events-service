'use strict';

process.env.SALESFORCE_ENABLED = 'true';

var seneca = require('seneca')(),
  config = require(__dirname + '/../config/config.js')(),
  fs = require('fs'),
  pg = require('pg'),
  expect = require('chai').expect,
  util = require('util'),
  _ = require('lodash'),
  async = require('async'),
  sinon = require('sinon'),
  logger = require('cp-logs-lib')({name:'cp-events-service'}).logger,
  lab = exports.lab = require('lab').script();

var role = "cd-events";

var users = require('./fixtures/users.json');
var profiles = require('./fixtures/profiles.json');
var events = require('./fixtures/events.json');
var dojos = require('./fixtures/dojos.json');
var usersDojos = require('./fixtures/usersdojos.json');


seneca.options(config);

seneca
/*.use(require(__dirname + '/stubs/cd-users.js'))
 .use(require(__dirname + '/stubs/cd-profiles.js'))
 .use(require(__dirname + '/stubs/cd-dojos.js'))
 .use(require(__dirname + '/stubs/email-notifications.js'))*/
  .use(require(__dirname + '/../lib/cd-events', {logger: logger}));

var eventsEntity = seneca.make$('cd/events');
var usersEntity = seneca.make$('sys/user');
var profilesEntity = seneca.make$('cd/profiles');
var dojosEntity = seneca.make$('cd/dojos');
var usersDojosEntity = seneca.make$('cd/usersdojos');


// this is unusually necessary
// when interrupted, node doesn't stop without this
process.on('SIGINT', function () {
  process.exit(0);
});

(function mockPg () {
  var client = {query: _.noop, end: _.noop};
  sinon.mock(client).expects('query').atLeast(1).callsArgWith(2, null, {rows: []});
  sinon.mock(pg).expects('connect').atLeast(1).callsArgWith(1, null, client);
})();

// NOTE: all tests are basic
// they just follow the happy scenario for each exposed action

function saveDojo (obj, done) {
  dojosEntity.save$(obj, done);
}

function saveUsersDojo (obj, done) {
  usersDojosEntity.save$(obj, done);
}

function saveUser (user, cb) {
  usersEntity.save$(user, cb);
}

function saveProfile (profile, cb) {
  profilesEntity.save$(profile, cb);
}

lab.experiment('Events Microservice test', function () {

  // Empty Tables
  lab.before(function (done) {
    dojosEntity.remove$({all$: true}, done);
  });

  lab.before(function (done) {
    usersEntity.remove$({all$: true}, done);
  });

  lab.before(function (done) {
    usersDojosEntity.remove$({all$: true}, done);
  });

  lab.before(function (done) {
    eventsEntity.remove$({all$: true}, done);
  });

  lab.before(function (done) {
    profilesEntity.remove$({all$: true}, done);
  });

  lab.before(function (done) {
    async.eachSeries(users, saveUser, done);
  });

  lab.before(function (done) {
    async.eachSeries(profiles, saveProfile, done);
  });

  lab.before(function (done) {
    seneca.util.recurse(1, function (index, next) {
      dojos[index].userId = users[index].id;
      saveDojo(dojos[index], next);
    }, done);
  });

  lab.before(function (done) {
    async.eachSeries(usersDojos, function (item, callback) {
      dojosEntity.list$(function (err, dojos) {
        if (err) return done(err);
        item.dojoId = dojos[0].id;
        saveUsersDojo(item, callback);
      });
    }, function (err) {
      if (err) return done(err);
      done();
    });
  });

  lab.experiment('Create', function () {
    lab.test('event for dojo', function (done) {
      var now = new Date();

      events[0].dates[0].startTime = now.setDate(now.getDate() + 5);
      events[0].dates[0].endTime = now.setTime(now.getTime() + (3 * 60 * 60 * 1000));

      seneca.act({
        role: role,
        cmd: 'saveEvent',
        eventInfo: events[0],
        zenHostname: 'localhost:8000',
        user: {id: users[0].id, roles: ['cdf-admin']}
      }, function (err, savedEvent) {
        if (err) return done(err);

        expect(savedEvent.id).to.be.ok;

        eventsEntity.load$({id: savedEvent.id}, function (err, event) {
          if (err) return done(err);
          expect(event).not.to.be.empty;

          expect(event).to.exist;
          expect(event).to.be.ok;

          var expectedFields = ['id', 'country', 'name', 'city',
            'address', 'type', 'description', 'dojoId', 'position',
            'public', 'status', 'recurringType', 'dates','ticketApproval'];
          var actualFields = Object.keys(event);
          _.each(expectedFields, function (field) {
            expect(actualFields).to.include(field);
          })

          done(null, event);
        });
      });
    });
  });

});
