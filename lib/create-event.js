'use strict';


function createEvent(args, callback) {
    var seneca = this;

    var eventInfo = args.eventInfo;
    var event = seneca.make('cd_events');

    for (var i in eventInfo) {
        event[i] = eventInfo[i];
    }

    event.save$(function(err, event) {
        if (err) {
            return callback(err);
        }

        callback(null, event);
    });
}

module.exports = createEvent;
