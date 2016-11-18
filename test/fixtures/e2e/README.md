## Description of test-data
Files not described here are used for unit testing of the µs
### Events
Events are created based on a loop of dojos (from 1 to x) and named based on the index as of
"test event {n}"
Applications are created based upon applications relationship, retrieving the dojo by name, the event by name ("test event {n}", where the event is name is specified in the applications.json) and a user email.
 * "test event 1":
  * is not full
  * is not past
  * has 1 ticket
  * has 1 session
  * contains a parent with 2 kids (one u13 and one o13)
* "test event 2":
  * is not full
  * is past
* "test event 3":
  * is full
  * is not past
  * has 1 session
  * has 3 tickets
  * contains a parent with 2 kids (one u13 and one o13)
  * contains a mentor

* does not have tickets
* is a draft
* has invited users :
  * parent1
  * mentor1

### Applications
* contains deleted Applications
* has attendances
