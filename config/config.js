var assert = require('assert');
var LogEntries = require('le_node');
var path = require('path');

module.exports = function() {
  function log () {
    // seneca custom log handlers
  
    if (process.env.LOGENTRIES_ENABLED === 'true') {
      assert.ok(process.env.LOGENTRIES_DEBUG_TOKEN, 'No LOGENTRIES_DEBUG_TOKEN set');
      var led = new LogEntries({
        token: process.env.LOGENTRIES_DEBUG_TOKEN,
        flatten: true,
        flattenArrays: true
      });
      
      assert.ok(process.env.LOGENTRIES_ERRORS_TOKEN, 'No LOGENTRIES_ERROR_TOKEN set');
      var lee = new LogEntries({
        token: process.env.LOGENTRIES_ERRORS_TOKEN,
        flatten: true,
        flattenArrays: true
      });
    }
  
    function debugHandler() {
      if (process.env.LOGENTRIES_ENABLED === 'true') {
        assert.ok(process.env.LOGENTRIES_DEBUG_TOKEN, 'No LOGENTRIES_DEBUG_TOKEN set');
        led.log('debug', arguments);
      }
    }
  
    function errorHandler() {
      console.error(JSON.stringify(arguments));
  
      if (process.env.LOGENTRIES_ENABLED === 'true') {
        assert.ok(process.env.LOGENTRIES_ERRORS_TOKEN, 'No LOGENTRIES_ERROR_TOKEN set');
        lee.log('err', arguments);
      }
    }
  
    return {
      map:[{
        level:'debug', handler: debugHandler
      }, {
        level:'error', handler: errorHandler
      }]
    };
  };

  function pgConfig() {
    return {
      name: process.env.POSTGRES_NAME,
      host: process.env.POSTGRES_HOST || '127.0.0.1',
      port: process.env.POSTGRES_PORT || 5432,
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD
    }
  };

  return {
    'postgresql-store': pgConfig(),
    'email-notifications': {
      sendemail:true,
      email: {
        'invite-user-en_US':{
          subject:'New Dojo Invitation'
        },
        'user-request-to-join-en_US':{
          subject:'New Request to join your Dojo'
        },
        'user-left-dojo-en_US': {
          subject:'A user has left your Dojo'
        }
      }
    },
    mail: {
      folder: path.resolve(__dirname + '/../email-templates'),
      mail: {
        from:'no-reply@coderdojo.com'
      },
      config: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
        // service: 'Gmail',
        // auth: {
        //   user: 'youremail@example.com',
        //   pass: 'yourpass'
        // }
      }
    },
    transport: {
      type: 'web',
      web: {
        timeout: 120000,
        port: 10306
      }
    },
    timeout: 120000,
    strict: {add:false,  result:false},
    log: log()
  };
}