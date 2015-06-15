'use strict';

var _ = require('lodash');
var async = require('async');

module.exports = function(options){
  var seneca = this;
  var plugin = 'cd-events';
  var ENTITY_NS = 'cd/events';

  seneca.add({role:plugin, cmd: 'list'}, cmd_list);
  seneca.add({role:plugin, cmd: 'search'}, cmd_search);

  function cmd_list(args, done) {
    var query = args.query || {};
    var eventsEntity = seneca.make$(ENTITY_NS);

    eventsEntity.list$(query, function (err, response) {
      if(err) return done(err);   
      done(null, response);
    }); 
  }

  function cmd_search(args, done) {
    seneca.act('role:cd-events-elasticsearch,cmd:search', {search:args.search}, function (err, response) {
      done(null, response);
    });
  }

  return {
    name: plugin
  };
};