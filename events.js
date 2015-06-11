'use strict';

var _ = require('lodash');
var async = require('async');

module.exports = function(options){
  var seneca = this;
  var plugin = 'cd-events';
  var ENTITY_NS = 'cd/events';

  return {
    name: plugin
  };
};