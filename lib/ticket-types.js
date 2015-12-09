'use strict';

function ticketTypes (args, callback) {
  /* ninja is defined as a key in many areas, keep it for backward compatibility */
  var ticketTypes = [
    {name: 'ninja', title: 'Youth', tooltip: 'Select Youth to create tickets for attendees under 18.'},
    {name: 'parent-guardian', title: 'Parent/Guardian', tooltip: 'Select Parent/Guardian to create tickets for parents/guardians of the attendees.'},
    {name: 'mentor', title: 'Mentor', tooltip: 'Select Mentor to create tickets for Mentors.'},
    {name: 'other', title: 'Other', tooltip: 'Select Other to create tickets for unlisted types e.g. laptops.'}
  ];
  setImmediate(function () {
    return callback(null, ticketTypes);
  });
}

module.exports = ticketTypes;
