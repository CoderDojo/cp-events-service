'use strict';
var async = require('async');
var _ = require('lodash');

function searchAttendance(args, callback) {
  var seneca = this;

  async.waterfall([

    function(done) {
      seneca.act('role:cd-events-elasticsearch,cmd:search', {
        search: args.search,
        type: 'cd_attendance'
      }, done);
    },
    function(searchResult, done) {
      return done(null, {
        total: searchResult.total,
        records: _.pluck(searchResult.hits, '_source')
      });
    }
  ], function(err, res) {
    if (err) return callback(err);
    return callback(null, res);
  });
}

module.exports = searchAttendance;