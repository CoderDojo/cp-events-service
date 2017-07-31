'use strict';

function updateReleaseTickets (args, callback) {
  var seneca = this;
  var _ = require('lodash');
  var moment = require('moment');
  var async = require('async');
  var queuesExport = seneca.export('queues/queue');
  var sendQueue = queuesExport['sendQueue'];
  var removeQueue = queuesExport['remove'];
  var client = queuesExport['client'];
  var event = args.event;
  var jobIdKey = 'release-ticket-job-'+event.id;
  var dateFromUser = moment(new Date(event.releaseDate)).utc();
  var time = dateFromUser.valueOf();
  var currentDate = moment().utc();
  var currentTime = currentDate.valueOf();
  var millisecondsUntilRelease = time - currentTime;

  function setJobId(job){
    client.set('release-ticket-job-' + event.id, job.job.id);
  }

  function loadJobId (wfCb) {
    client.get(jobIdKey, function (err, jobId) {
      if(err) wfCb(err, jobId);
      wfCb(null, jobId);
    });
  }

  function flagAsCompleted (jobId, wfCb) {
    if (jobId === null) {
      wfCb(null, jobId);
    }else{
      client.set('release-ticket-changed-' + event.id, new Date(), function(err){
        if(err) wfCb(err,jobId);
      });
      wfCb(null, jobId);
    }
  }

  function removeFromQueue(jobId, wfCb){
    if (jobId !== null) {
      removeQueue({id: jobId});
      if(event.status === "cancelled")
      {
        client.set('release-ticket-cancelled-' + event.id, new Date(), function(err){
          if(err) wfCb(err);
        });
        client.del('release-ticket-job-' + event.id, function(err){
          if(err) wfCb(err);
        });
      }
    }
    wfCb(null);
  }

  function releaseTickets(wfCb){
    if(event.chooseReleaseTime){
      sendQueue({cmd: 'enqueue', name: 'cp-events-queue', msg: _.clone({role: 'cd-events', cmd: 'releaseTickets', eventId:  event.id}), params: {
        delay: millisecondsUntilRelease
      }}, function (err,job){
          if(err) wfCb(err);
          setJobId(job);
        }
      );
    }else{
      sendQueue({cmd: 'enqueue', name: 'cp-events-queue', msg: _.clone({role: 'cd-events', cmd: 'releaseTickets', eventId:  event.id})}, function (err,job){
        if(err) wfCb(err);
        setJobId(job);
      });
    }
    wfCb(null);
  }

  if(event.status === "cancelled"){
    async.waterfall([
      loadJobId,
      removeFromQueue
    ])
  } else {
    async.waterfall([
      loadJobId,
      flagAsCompleted,
      removeFromQueue,
      releaseTickets
    ])
  }
  callback(null);
}

module.exports = updateReleaseTickets;
