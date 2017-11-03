var async = require('async');
/**
 * updateAddress function - Called to update all upcoming event address upon dojo address change
 * By default asynchronous
 * @param  {String} dojoId Identifier of the parent entity
 * @param  {Object} location Object containing the information of the address
 * @return {Void}
 */
module.exports = function (args, done) {
  var seneca = this;
  var plugin = args.role;
  var dojoId = args.dojoId;
  var location = args.location;
  // Retrieve all events in the future
  function getUpcomingEvents (wfCb) {
    seneca.act({role: plugin, entity: 'next-events', cmd: 'list', query: {dojoId: dojoId, useDojoAddress: true}},
    function (err, events) {
      if (events && events.length > 0) {
        wfCb(null, events);
      } else {
        done();
      }
    });
  }
  function updateEvents (events, wfCb) {
    async.eachSeries(events, updateAddress, wfCb);
  }
  // Save the new address
  function updateAddress (event, sCb) {
    var payload = {
      id: event.id,
      country: location.country,
      city: location.city,
      address: location.address,
      position: location.position
    };
    seneca.act({role: plugin, entity: 'event', cmd: 'save', event: payload}, sCb);
  }
  async.waterfall([
    getUpcomingEvents,
    updateEvents
  ], done);
}
