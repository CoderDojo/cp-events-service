'use strict';

var util = require('util');
var seneca = require('seneca')();
var options = require('../config/config');


seneca.options(options);
seneca.client();


function callback(err, result) {
    if (err) {
        return console.error(err);
    }

    var msg = util.inspect(result, true, null, true);
    console.log(msg);
}


var event = {
    name: 'Event name',
    date: new Date(2015, 9, 3, 17, 30),
    location: 'Event location',
    description: 'Event description',
    capacity: 40,
    public: true,
    user_types: ['<13'],
    category: 'JavaScript',
    status: 'active',
    created_at: new Date(),
    created_by: 'user id'
};


seneca.act({
        role: 'cd-events',
        cmd: 'createEvent',
        eventInfo: event
    },
    callback
);
