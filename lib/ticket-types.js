'use strict'

function ticketTypes(args, callback) {
  var ticketTypes = [
    {name: 'ninja', title: 'Ninja'},
    {name: 'parent-guardian', title: 'Parent/Guardian'},
    {name: 'mentor', title: 'Mentor'},
    {name: 'other', title: 'Other'}
  ];
  return callback(null, ticketTypes);
}

module.exports = ticketTypes;