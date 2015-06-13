'use strict';

var _ = require('lodash');
var config = require('./config/config.js')();
var ESOptions = require('./es-options.js');

var seneca = require('seneca')();

var cdEvents = require('./lib/cd-events');
var es = require('./es.js');

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);


seneca.use('postgresql-store', config["postgresql-store"]);
seneca.use('elasticsearch', _.defaults(config["elasticsearch"], ESOptions));
seneca.use(es);

seneca.use(cdEvents, {
    limits: config.limits
});


seneca.listen();