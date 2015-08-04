'use strict';

function searchApplications(args, callback) {
  var seneca = this;
  var applicationsEntity = seneca.make$('cd/applications');
  var query = args.query;

  applicationsEntity.list$(query, callback);
}

module.exports = searchApplications;
