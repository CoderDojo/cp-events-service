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
seneca.use(require('./lib/cd-events'));

seneca.listen()
	.client({type: 'web', host: process.env.DOCKER_HOST_IP || process.env.TARGETIP || '127.0.0.1', port: 10301, pin: 'role:cd-dojos,cmd:*'})
	.client({type: 'web', host: process.env.DOCKER_HOST_IP || process.env.TARGETIP || '127.0.0.1', port: 10303, pin: 'role:cd-users,cmd:*'})
	.client({type: 'web', host: process.env.DOCKER_HOST_IP || process.env.TARGETIP || '127.0.0.1', port: 10303, pin: 'role:cd-profiles,cmd:*'});