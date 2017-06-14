var async = require('async');
module.exports = function (options) {
  var seneca = this;
  var queue = {};
  var kue = seneca.export('kue-queue/kue');
  //export function to queue sending of email based on whether seneca-kue is being used or not
  queue['sendQueue'] = function (payload, cb) {
    //if kue is being used
    if (options.config && options.config.start) {
      seneca.act({role: 'kue-queue', cmd: payload.cmd, name: payload.name, msg: payload.msg, params: payload.params}, cb);
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
<<<<<<< 8d01e45e55079d41f1176cc457525352adc2ab94
    var kues = ['bulk-apply-applications-kue'];
    var kues = ['ticket-release-queue'];
=======
    var kues = ['ticket-release-kue'];
<<<<<<< f27c60c18453fefcf2c0c3c7554250f62e841983
>>>>>>> WIP
    seneca.act({role: 'kue-queue', cmd: 'start', config: options.config}, function (err, queue) {
=======
    seneca.act({role: 'kue-queue', cmd: 'start', config: options.config}, function (err, lqueue) {
>>>>>>> Checking if release time is before event time without directive
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
      queue: queue,
      kue: kue
    }
  };
};
