module.exports = {
  refreshOnSave : true,
  fetchEntitesFromDB : true,
  entities: [{
    base: 'cd',
    name: 'events',
    indexedAttributes: {
      'id': {
        type: 'string',
        index: 'not_analyzed'
      },
      'name': true,
      'dates': true,
      'location': true,
      'description': true,
      'capacity': true,
      'public': true,
      'category': true,
      'user_types': true,
      'dojo_id': true,
      'status':true,
      'created_at': true,
      'created_by': true
    }
  },
  {
    base: 'cd',
    name: 'applications',
    indexedAttributes: {
      'id': {
        type: 'string',
        index: 'not_analyzed'
      },
      'event_id': true,
      'user_id': true,
      'name': true,
      'date_of_birth': true,
      'attended': true,
      'status': true
    }
  },
  {
    base: 'cd',
    name: 'attendance',
    indexedAttributes: {
      'id': {
        type: 'string',
        index: 'not_analyzed'
      },
      'user_id': true,
      'event_id': true,
      'event_date': true,
      'attended': true
    }
  }]
};