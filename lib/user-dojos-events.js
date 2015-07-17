'use strict'

var async = require('async');
var _ = require('lodash');

function userDojosEvents(args, callback) {
  var seneca = this;

  var plugin = args.role;

  async.waterfall([
    loadUserDojos,
    loadDojosEvents
  ], callback);

  function loadUserDojos(done){
    seneca.act({role: 'cd-dojos', cmd: 'dojos_for_user', id: args.id}, done);
  }

  function loadDojosEvents(dojos, done){
    var events = [];
    if(dojos && dojos.length > 0){

      //load Events for each dojo
      async.eachSeries(dojos, function(dojo, cb){
        seneca.act({role: plugin, cmd: 'listEvents', query:{dojoId: dojo.id}}, function (err, response) {
          if(err) return cb(err);
          var dojoEvents = {
            dojo: dojo,
            events: response
          }

          events.push(dojoEvents);
          return cb(null, response);
        });
      }, function (err, res) {
        if(err) return done(null, {error: err.message});
        return done(null, events);
      });
    } else {
      return done(null, events);
    }
  }
}

module.exports = userDojosEvents;
