'use strict';

var lab = exports.lab = require('lab').script();
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var _ = require('lodash');
var fn = require(__dirname + '/update-address.js');

lab.experiment('Event - Update address', { timeout: 5000 }, function () {
    var sandbox;
    var senecaStub;
    var updateAddress;

    lab.beforeEach(function (done) {
        sandbox = sinon.sandbox.create();
        senecaStub = {
            act: sandbox.stub(),
            make: sandbox.stub()
        };
        updateAddress = fn.bind(senecaStub);
        done();
    });

    lab.afterEach(function (done) {
        sandbox.restore();
        done();
    });

    lab.test('should get next events and update addresses of those events', function (done) {
        // ARRANGE
        var dojoId = 1;
        var mockLocation = { address: 'aha',
          city: {placeName: 'place'},
          country: {alpha2: 'FR',
          countryName: 'France'},
          position: {lat: 1, lng:1} };
        var mockEvents = [{id: 1, name: 'event1'}];
        var eventMock = _.assign({},
          mockLocation,
          {id: mockEvents[0].id});
        // PREPARE
        senecaStub.act
        .withArgs(sinon.match({ role: 'cd-events', entity: 'next-events', cmd: 'list'}))
        .callsFake(function (args, cb) {
            expect(args.query).to.be.eql({
                dojoId: dojoId,
                useDojoAddress: true
              });
            cb(null, mockEvents);
        });
        senecaStub.act
        .withArgs(sinon.match({ role: 'cd-events', entity: 'event', cmd: 'save'}))
        .callsFake(function (args, cb) {
          expect(args.event).to.be.eql(eventMock);
          cb(null, eventMock);
        });
        // ACT
        updateAddress({role: 'cd-events', dojoId: 1, location: mockLocation}, function (err, ret) {
          expect(err).to.be.eql(undefined);
          expect(ret).to.be.eql(undefined);
          done();
        });
    });

    lab.test('should not save if there is no events', function (done) {
      // ARRANGE
      var dojoId = 1;
      var mockLocation = { address: 'aha',
        city: {placeName: 'place'},
        country: {alpha2: 'FR',
        countryName: 'France'},
        position: {lat: 1, lng:1} };
      var mockEvents = [];
      // PREPARE
      senecaStub.act
      .withArgs(sinon.match({ role: 'cd-events', entity: 'next-events', cmd: 'list'}))
      .callsFake(function (args, cb) {
          expect(args.query).to.be.eql({
              dojoId: dojoId,
              useDojoAddress: true
            });
          cb(null, mockEvents);
      });
      // ACT
      updateAddress({role: 'cd-events', dojoId: 1, location: mockLocation}, function (err, ret) {
        expect(err).to.be.eql(undefined);
        expect(ret).to.be.eql(undefined);
        expect(senecaStub.act
          .withArgs(sinon.match({ role: 'cd-events', entity: 'event', cmd: 'save'}))
        ).to.not.have.been.called;
        done();
      });
    });
});
