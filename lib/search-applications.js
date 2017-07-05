function searchApplications(args, callback) {
  const seneca = this;
  const applicationsEntity = seneca.make('cd/applications');
  const query = args.query;
  if (!query.limit$) query.limit$ = 'NULL';
  if (query.name) query.name = new RegExp(query.name, 'i');
  applicationsEntity.list$(query, callback);
}

module.exports = searchApplications;
