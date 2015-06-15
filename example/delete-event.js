'use strict';

var util = require('util');
var seneca = require('seneca')();
var options = require('../config/config')();
var args = process.argv.slice(2);


seneca.options(options);
seneca.client();


function callback(err, result) {
  if (err) {
    return console.error(err);
  }

  var msg = util.inspect(result, true, null, true);
  console.log('Get event:', msg);
}


var eventId = args[0];

if (!eventId) {
  throw 'Event Id must be specified';
}

seneca.act({
    role: 'cd-events',
    cmd: 'deleteEvent',
    id: eventId
  },
  callback
);

