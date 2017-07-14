var async = require('async');
var redis = require('redis');
module.exports = function (options) {
  var seneca = this;
  var queue = {};
  var client = redis.createClient();
  queue['client'] = client;

  //export function to queue sending of email based on whether seneca-kue is being used or not
  queue['sendQueue'] = function (payload, cb) {
    if (options.config && options.config.start) {
      seneca.act({role: 'kue-queue', cmd: payload.cmd, name: payload.name, msg: payload.msg, params: payload.params}, cb);
    } else {
      seneca.act({role: 'queue', cmd: payload.cmd, msg: payload.msg}, cb);
    }
  };
  queue['remove'] = function (args, cb) {
    if (options.config && options.config.start) {
      seneca.act({role: 'kue-queue', cmd: 'remove', id: args.id}, cb);
    } else {
      // TODO GFE PR seneca queue in memory remove, expose Queue + remove fn
      console.warn('Not implemented');
    }
  }
  //export function to stop seneca-queue based on whether seneca-kue is being used or not
  queue['stopQueue'] = function () {
    //if kue is not being used
    if (!(options.config && options.config.start)) {
      seneca.act({role: 'queue', cmd: 'stop'});
    }
  };
  if (options.config && options.config.start) {
    var kueName = 'cp-events-queue';
    seneca.act({role: 'kue-queue', cmd: 'start', config: options.config}, function (err, lqueue) {
      if (!err) {
        seneca.act({role: 'kue-queue', cmd: 'work', name: kueName}, function (err, worker) {
          if (err) return new Error(err);
        });
      } else {
        return new Error('Redis queue couldn\'t be started');
      }
    });
  } else {
    //seneca-queue implementation
    seneca.act({role: 'queue', cmd: 'start'});
  }

  return {
    name: 'queues',
    exportmap: {
      queue: queue
    }
  };
};
