var plugin = 'cd-es-events';

function Elasticsearch() {
  var seneca = this;
  var plugin = 'cd-events-elasticsearch';

  seneca.add({role: plugin, cmd: 'search'}, cmd_search);
}

function cmd_search(args, done) {
  var seneca = this;
  if(!args.type){
    args.type = 'cd_events';
  }
  seneca.act('role:search,cmd:search', args, function(err, result) {  
    if(err) return done(err);
    return done(null, result.hits);
  });
}

module.exports = Elasticsearch;