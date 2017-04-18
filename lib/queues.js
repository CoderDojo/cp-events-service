var async = require('async');
module.exports = function (options) {
  var seneca = this;
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
  }
  return {
    name: 'queues'
  }
}
