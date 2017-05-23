var async = require('async');
module.exports = function (options) {
  var seneca = this;
  var queue = {};
  //export function to queue sending of email based on whether seneca-kue is being used or not
  queue['sendQueue'] = function (payload, cb) {
    //if kue is being used
    if (options.config && options.config.start) {
      seneca.act({role: 'kue-queue', cmd: payload.cmd, name: payload.name, msg: payload.msg}, cb);
    } else {
      seneca.act({role: 'queue', cmd: payload.cmd, msg: payload.msg}, cb);
    }
  };
  //export function to stop seneca-queue based on whether seneca-kue is being used or not
  queue['stopQueue'] = function () {
    //if kue is not being used
    if (!(options.config && options.config.start)) {
      seneca.act({role: 'queue', cmd: 'stop'});
    }
  };
  if (options.config && options.config.start) {
    var kues = ['bulk-apply-applications-kue'];
    seneca.act({role: 'kue-queue', cmd: 'start', config: options.config}, function (err, queue) {
      if (!err) {
        async.eachSeries(kues, function (kue, cb) {
          seneca.act({role: 'kue-queue', cmd: 'work', name: kue}, function (err, worker) {
            if (err) return new Error(err);
            cb();
          });
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
