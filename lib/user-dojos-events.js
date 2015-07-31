'use strict'

var async = require('async');
var _ = require('lodash');
var moment = require('moment');

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
        var query = buildEventsQuery(dojo);
        seneca.act({role: plugin, cmd: 'searchEvents', search: query}, function (err, response) {
          if(err) return cb(err);
          var dojoEvents = {
            dojo: dojo,
            events: response.records
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

  function buildEventsQuery(dojo) {
    //Only list published events for this Dojo
    var todaysDate = moment().toDate();
    todaysDate = moment(todaysDate).format('YYYY-MM-DD');
    return {
      query: {
        bool: {
          must:[
            { match: { dojoId: dojo.id }},
            { match: { status: 'published' }},
            { match: { public: true}},
            { 
              range: {
                dates: {
                  gte: todaysDate
                }
              }
            }
          ]   
        }
      }
    };
  }

}

module.exports = userDojosEvents;
