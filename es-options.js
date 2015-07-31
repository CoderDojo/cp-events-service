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
      'userTypes': true,
      'dojoId': true,
      'status':true,
      'createdAt': true,
      'createdBy': true
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
      'eventId': true,
      'userId': true,
      'name': true,
      'dateOfBirth': true,
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
      'userId': true,
      'eventId': true,
      'eventDate': true,
      'attended': true
    }
  }]
};