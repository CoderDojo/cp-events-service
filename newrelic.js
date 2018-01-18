/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 *
 * Also see: https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration
 * and: https://github.com/newrelic/node-newrelic/blob/master/lib/config.default.js
 */
exports.config = {
  app_name: ['cp-events-service'],
  agent_enabled: false, // set via NEW_RELIC_ENABLED for production
  license_key: '', // set via NEW_RELIC_LICENSE_KEY
  filepath: '/tmp/newrelic_agent_events.log',
  transaction_tracer: {
    record_sql: 'obfuscated'
  },
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'info'
  }
};
