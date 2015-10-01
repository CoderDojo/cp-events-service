'use strict';

function ticketTypes (args, callback) {
  var ticketTypes = [
    {name: 'ninja', title: 'Ninja', tooltip: 'Select Ninja to create tickets for attendees under 13 or over 13.'},
    {name: 'parent-guardian', title: 'Parent/Guardian', tooltip: 'Select Parent/Guardian to create tickets for parents/guardians of the attendees.'},
    {name: 'mentor', title: 'Mentor', tooltip: 'Select Mentor to create tickets for Mentors.'},
    {name: 'other', title: 'Other', tooltip: 'Select Other to create tickets for unlisted types e.g. laptops.'}
  ];
  setImmediate(function () {
    return callback(null, ticketTypes);
  });
}

module.exports = ticketTypes;
