'use strict';

module.exports = function (options) {
  var seneca = this;
  var plugin = 'cd-countries';

  seneca.add({role: plugin, cmd: 'search'}, cmd_search);
  seneca.add({role: plugin, cmd: 'list'}, cmd_list);
  seneca.add({role: plugin, cmd: 'load'}, cmd_load);
  seneca.add({role: plugin, cmd: 'find'}, cmd_find);
  seneca.add({role: plugin, cmd: 'create'}, wrapCheckRateLimitCreateDojo(cmd_create));
  seneca.add({role: plugin, cmd: 'update'}, wrapDojoExists(wrapDojoPermissions(cmd_update)));
  seneca.add({role: plugin, cmd: 'delete'}, wrapDojoExists(wrapDojoPermissions(cmd_delete)));
  seneca.add({role: plugin, cmd: 'my_dojos'}, cmd_my_dojos);
  seneca.add({role: plugin, cmd: 'dojos_count'}, cmd_dojos_count);
  seneca.add({role: plugin, cmd: 'dojos_by_country'}, cmd_dojos_by_country);
  seneca.add({role: plugin, cmd: 'dojos_state_count'}, cmd_dojos_state_count);
  seneca.add({role: plugin, cmd: 'bulk_update'}, cmd_bulk_update);
  seneca.add({role: plugin, cmd: 'bulk_delete'}, cmd_bulk_delete);
  seneca.add({role: plugin, cmd: 'get_stats'}, wrapCheckCDFAdmin(cmd_get_stats));
  seneca.add({role: plugin, cmd: 'save_dojo_lead'}, cmd_save_dojo_lead);
  seneca.add({role: plugin, cmd: 'update_dojo_lead'}, cmd_save_dojo_lead);
  seneca.add({role: plugin, cmd: 'load_user_dojo_lead'}, cmd_load_user_dojo_lead);
  seneca.add({role: plugin, cmd: 'load_dojo_lead'}, cmd_load_dojo_lead);
  seneca.add({role: plugin, cmd: 'load_setup_dojo_steps'}, cmd_load_setup_dojo_steps);
  seneca.add({role: plugin, cmd: 'load_usersdojos'}, cmd_load_users_dojos);
  seneca.add({role: plugin, cmd: 'load_dojo_users'}, cmd_load_dojo_users);
  seneca.add({role: plugin, cmd: 'send_email'}, cmd_send_email);
  seneca.add({role: plugin, cmd: 'generate_user_invite_token'}, cmd_generate_user_invite_token);
  seneca.add({role: plugin, cmd: 'accept_user_invite'}, cmd_accept_user_invite);
  seneca.add({role: plugin, cmd: 'request_user_invite'}, cmd_request_user_invite);
  seneca.add({role: plugin, cmd: 'load_dojo_champion'}, cmd_load_dojo_champion);
  seneca.add({role: plugin, cmd: 'accept_user_request'}, cmd_accept_user_request);
  seneca.add({role: plugin, cmd: 'dojos_for_user'}, cmd_dojos_for_user);
  seneca.add({role: plugin, cmd: 'save_usersdojos'}, cmd_save_usersdojos);
  seneca.add({role: plugin, cmd: 'remove_usersdojos'}, cmd_remove_usersdojos);
  seneca.add({role: plugin, cmd: 'get_user_types'}, cmd_get_user_types);
  seneca.add({role: plugin, cmd: 'get_user_permissions'}, cmd_get_user_permissions);
  seneca.add({role: plugin, cmd: 'create_dojo_email'}, cmd_create_dojo_email);
  seneca.add({role: plugin, cmd: 'search_dojo_leads'}, cmd_search_dojo_leads);
  seneca.add({role: plugin, cmd: 'uncompleted_dojos'}, cmd_uncompleted_dojos);
  seneca.add({role: plugin, cmd: 'get_dojo_config'}, cmd_get_dojo_config);
  seneca.add({role: plugin, cmd: 'load_dojo_admins'}, cmd_load_dojo_admins);
  seneca.add({role: plugin, cmd: 'update_founder'}, cmd_update_dojo_founder);
  seneca.add({role: plugin, cmd: 'search_nearest_dojos'}, cmd_search_nearest_dojos);
  seneca.add({role: plugin, cmd: 'search_bounding_box'}, cmd_search_bounding_box);
  seneca.add({role: plugin, cmd: 'list_query'}, cmd_list_query);
  seneca.add({role: plugin, cmd: 'find_dojolead'}, cmd_find_dojolead);
  seneca.add({role: plugin, cmd: 'load_dojo_email'}, cmd_load_dojo_email);
  // from countries service
  seneca.add({role: plugin, cmd: 'countries_continents'}, cmd_countries_continents);
  seneca.add({role: plugin, cmd: 'list_countries'}, cmd_list_countries);
  seneca.add({role: plugin, cmd: 'list_places'}, cmd_list_places);
  seneca.add({role: plugin, cmd: 'countries_lat_long'}, cmd_countries_lat_long);
  seneca.add({role: plugin, cmd: 'continents_lat_long'}, cmd_continents_lat_long);
  seneca.add({role: plugin, cmd: 'continent_codes'}, cmd_get_continent_codes);
  seneca.add({role: plugin, cmd: 'reverse_geocode'}, cmd_reverse_geocode);

  function wrapCheckRateLimitCreateDojo (cb) {
    return function (args, done) {
      return cb(args, done);
    };
  }

  function wrapDojoExists (cb){
    return function (args, done) {
      return cb(args, done);
    };
  }

  function wrapDojoPermissions (cb){
    return function (args, done) {
      return cb(args, done);
    };
  }

  function wrapCheckCDFAdmin(cb){
    return function (args, done) {
      return cb(args, done);
    };
  }

  function cmd_search (args, done) {
    done(new Error('action not stubbed!'), null)
  }

  function cmd_list (args, done) {
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load (args, done) {
    done(new Error('action not stubbed!'), null)
  }

  function cmd_find (args, done) {
    done(new Error('action not stubbed!'), null)
  }

  function cmd_create (args, done) {
    done(new Error('action not stubbed!'), null)
  }

  function cmd_update (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_delete (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_my_dojos (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_dojos_count (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_dojos_by_country (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_dojos_state_count (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_bulk_update (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_bulk_delete (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_get_stats (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_save_dojo_lead (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_user_dojo_lead (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_dojo_lead (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_setup_dojo_steps (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_users_dojos (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_dojo_users (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_send_email (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_generate_user_invite_token (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_accept_user_invite (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_request_user_invite (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_dojo_champion (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_accept_user_request (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_dojos_for_user (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_save_usersdojos (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_remove_usersdojos (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_get_user_types (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_get_user_permissions (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_create_dojo_email (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_search_dojo_leads (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_uncompleted_dojos (args, done){
    done(new Error('action not stubbed!'), null)
  }
  function cmd_get_dojo_config (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_dojo_admins (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_update_dojo_founder (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_search_nearest_dojos (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_search_bounding_box (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_list_query (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_find_dojolead (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_load_dojo_email (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_countries_continents (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_list_countries (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_list_places (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_countries_lat_long (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_continents_lat_long (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_get_continent_codes (args, done){
    done(new Error('action not stubbed!'), null)
  }

  function cmd_reverse_geocode (args, done){
    done(new Error('action not stubbed!'), null)
  }

  return {
    name: plugin
  };

};