module.exports = function (args, done) {
  var seneca = this;
  var query = args.query;
  if (query) {
    seneca.make$('v/next_events').list$(query, done);
  } else {
    done(null, []);
  }
}
