'use strict';


function listEvents(args, callback) {
    var seneca = this;
    var ENTITY_NS = 'cd/events';
    var query = args.query || {};
    var events = seneca.make$(ENTITY_NS);

    events.list$(query, function(err, event) {
        if (err) {
            return callback(err);
        }

        callback(null, event);
    });
}

module.exports = listEvents;
