module.exports = function (args, done) {
  var seneca = this;
  var event = args.event;
  seneca.make$('cd/events').save$(event, done);
};
