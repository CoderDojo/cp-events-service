const async = require('async');

function queues({ config }) {
  const seneca = this;
  const queue = {};
  // export function to queue sending of email based on whether seneca-kue is being used or not
  queue.sendQueue = ({ cmd, name, msg }, cb) => {
    // if kue is being used
    if (config && config.start) {
      seneca.act({ role: 'kue-queue', cmd, name, msg }, cb);
    } else {
      seneca.act({ role: 'queue', cmd, msg }, cb);
    }
  };
  // export function to stop seneca-queue based on whether seneca-kue is being used or not
  queue.stopQueue = () => {
    // if kue is not being used
    if (!(config && config.start)) {
      seneca.act({ role: 'queue', cmd: 'stop' });
    }
  };
  if (config && config.start) {
    const kues = ['bulk-apply-applications-kue'];
    seneca.act({ role: 'kue-queue', cmd: 'start', config }, err => {
      if (!err) {
        async.eachSeries(kues, (kue, cb) => {
          seneca.act({ role: 'kue-queue', cmd: 'work', name: kue }, err => {
            if (err) return new Error(err);
            cb();
          });
        });
      } else {
        return new Error("Redis queue couldn't be started");
      }
    });
  } else {
    // seneca-queue implementation
    seneca.act({ role: 'queue', cmd: 'start' });
  }
  return {
    name     : 'queues',
    exportmap: {
      queue,
    },
  };
}
module.exports = queues;
