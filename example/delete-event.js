'use strict';

const util = require('util');
const seneca = require('seneca')();
const options = require('../config/config')();
const args = process.argv.slice(2);

seneca.options(options);
seneca.client();

function callback(err, result) {
  if (err) {
    return console.error(err);
  }

  const msg = util.inspect(result, true, null, true);
  console.log('Get event:', msg);
}

const eventId = args[0];

if (!eventId) {
  throw 'Event Id must be specified';
}

seneca.act({
  role: 'cd-events',
  cmd : 'deleteEvent',
  id  : eventId,
},
  callback
);
