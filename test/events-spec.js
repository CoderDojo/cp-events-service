process.env.SALESFORCE_ENABLED = 'true';

const seneca = require('seneca')();

const config = require('../config/config.js')();
const pg = require('pg');
const expect = require('chai').expect;
const _ = require('lodash');
const async = require('async');
const sinon = require('sinon');
const logger = require('cp-logs-lib')({ name: 'cp-events-service' }).logger;
const lab = require('lab').script();
exports.lab = require('lab').script();

const role = 'cd-events';

const users = require('./fixtures/users.json');
const profiles = require('./fixtures/profiles.json');
const events = require('./fixtures/events.json');
const dojos = require('./fixtures/dojos.json');
const usersDojos = require('./fixtures/usersdojos.json');

seneca.options(config);

seneca
  /* .use(require(__dirname + '/stubs/cd-users.js'))
 .use(require(__dirname + '/stubs/cd-profiles.js'))
 .use(require(__dirname + '/stubs/cd-dojos.js'))
 .use(require(__dirname + '/stubs/email-notifications.js'))*/
  .use(require('../lib/cd-events', { logger }))
  .use(require('seneca-entity'));

const eventsEntity = seneca.make('cd/events');
const usersEntity = seneca.make('sys/user');
const profilesEntity = seneca.make('cd/profiles');
const dojosEntity = seneca.make('cd/dojos');
const usersDojosEntity = seneca.make('cd/usersdojos');

// this is unusually necessary
// when interrupted, node doesn't stop without this
process.on('SIGINT', () => {
  process.exit(0);
});
(function mockPg() {
  const client = { query: _.noop, end: _.noop };
  sinon.mock(client).expects('query').atLeast(1).callsArgWith(2, null, { rows: [] });
  sinon.mock(pg).expects('connect').atLeast(1).callsArgWith(1, null, client);
}());

// NOTE: all tests are basic
// they just follow the happy scenario for each exposed action

function saveDojo(obj, done) {
  dojosEntity.save$(obj, done);
}

function saveUsersDojo(obj, done) {
  usersDojosEntity.save$(obj, done);
}

function saveUser(user, cb) {
  usersEntity.save$(user, cb);
}

function saveProfile(profile, cb) {
  profilesEntity.save$(profile, cb);
}

lab.experiment('Events Microservice test', () => {
  // Empty Tables
  lab.before(done => {
    dojosEntity.remove$({ all$: true }, done);
  });

  lab.before(done => {
    usersEntity.remove$({ all$: true }, done);
  });

  lab.before(done => {
    usersDojosEntity.remove$({ all$: true }, done);
  });

  lab.before(done => {
    eventsEntity.remove$({ all$: true }, done);
  });

  lab.before(done => {
    profilesEntity.remove$({ all$: true }, done);
  });

  lab.before(done => {
    async.eachSeries(users, saveUser, done);
  });

  lab.before(done => {
    async.eachSeries(profiles, saveProfile, done);
  });

  lab.before(done => {
    seneca.util.recurse(1, (index, next) => {
      dojos[index].userId = users[index].id;
      saveDojo(dojos[index], next);
    }, done);
  });

  lab.before(done => {
    async.eachSeries(usersDojos, (item, callback) => {
      dojosEntity.list$((err, dojoList) => {
        if (err) return done(err);
        item.dojoId = dojoList[0].id;
        saveUsersDojo(item, callback);
      });
    }, err => {
      if (err) return done(err);
      done();
    });
  });

  lab.experiment('Create', () => {
    lab.test('event for dojo', done => {
      const now = new Date();

      events[0].dates[0].startTime = now.setDate(now.getDate() + 5);
      events[0].dates[0].endTime = now.setTime(now.getTime() + (3 * 60 * 60 * 1000));

      seneca.act({
        role,
        cmd        : 'saveEvent',
        eventInfo  : events[0],
        zenHostname: 'localhost:8000',
        user       : { id: users[0].id, roles: ['cdf-admin'] },
      }, (err, { id }) => {
        if (err) return done(err);
        expect(id).to.be.ok;
        eventsEntity.load$({ id }, (err, event) => {
          if (err) return done(err);
          expect(event).not.to.be.empty;
          expect(event).to.exist;
          expect(event).to.be.ok;
          const expectedFields = [
            'id',
            'country',
            'name',
            'city',
            'address',
            'type',
            'description',
            'dojoId',
            'position',
            'public',
            'status',
            'recurringType',
            'dates',
            'ticketApproval',
          ];
          const actualFields = Object.keys(event);
          _.each(expectedFields, field => {
            expect(actualFields).to.include(field);
          });

          done(null, event);
        });
      });
    });
  });
});
