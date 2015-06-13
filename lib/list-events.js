'use strict';


function listEvents(args, callback) {
    var seneca = this;

    var query = args.query || {};
    var events = seneca.make('cd_events');

    events.list$(query, function(err, event) {
        if (err) {
            return callback(err);
        }

        callback(null, event);
    });
}

module.exports = listEvents;
