'use strict';

function searchApplications (args, callback) {
  var seneca = this;
  var applicationsEntity = seneca.make$('cd/applications');
  var query = args.query;
  if (!query.limit$) query.limit$ = 'NULL';
  applicationsEntity.list$(query, callback);
}

module.exports = searchApplications;
