var path = require('path');

module.exports = function (options) {
  function pgConfig () {
    return {
      name: process.env.POSTGRES_NAME,
      host: process.env.POSTGRES_HOST || '127.0.0.1',
      port: process.env.POSTGRES_PORT || 5432,
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD
    };
  }
  function kueConfig () {
    return {
      start: process.env.KUE_REQUIRED,
      redis: {
        host: process.env.KUE_HOST || 'localhost',
        port: process.env.KUE_PORT || '6379'
      }
    };
  }

  return {
    'postgresql-store': pgConfig(),
    'kue': kueConfig(),
    'email-notifications': {
      sendemail: true,
      email: {
        'invite-user-en_US': {
          subject: 'New Dojo Invitation'
        },
        'user-request-to-join-en_US': {
          subject: 'New Request to join your Dojo'
        },
        'user-left-dojo-en_US': {
          subject: 'A user has left your Dojo'
        }
      }
    },
    mail: {
      folder: path.resolve(__dirname + '/../email-templates'),
      mail: {
        from: 'no-reply@coderdojo.com'
      },
      config: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      }
    },
    transport: {
      type: 'web',
      web: {
        timeout: 120000,
        port: options && options.port ? options.port : 10306
      }
    },
    timeout: 120000,
    strict: {add: false, result: false},
    actcache: {active: false}
  };
};
