'use strict';

var _ = require('lodash');
var config = require('./config/config.js')();
var ESOptions = require('./es-options.js');

var seneca = require('seneca')();


seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);


seneca.use('postgresql-store', config["postgresql-store"]);
seneca.use('elasticsearch', _.defaults(config["elasticsearch"], ESOptions));
seneca.use(require('./es.js'));
seneca.use(require('./lib/cd-events'), { limits: config.limits});

seneca.listen();