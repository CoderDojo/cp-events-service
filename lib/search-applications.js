'use strict';

function searchApplications (args, callback) {
  var seneca = this;
  var applicationsEntity = seneca.make$('cd/applications');
  var query = args.query;
  if (!query.limit$) query.limit$ = 'NULL';
  if (query.name) query.name = new RegExp( query.name , 'i');
  applicationsEntity.list$(query, callback);
}

module.exports = searchApplications;
