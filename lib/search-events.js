'use strict';


function searchEvents(args, callback) {
  var seneca = this;

  seneca.act('role:cd-events-elasticsearch,cmd:search', {search:args.search}, function (err, response) {
    callback(null, response);
  });
}

module.exports = searchEvents;