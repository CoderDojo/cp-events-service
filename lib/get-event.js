'use strict';


function getEvent(args, callback) {
    var seneca = this;

    var events = seneca.make('cd_events');

    var id = args.id;

    events.load$(id, function(err, event) {
        if (err) {
            return callback(err);
        }

        callback(null, event);
    });
}

module.exports = getEvent;
