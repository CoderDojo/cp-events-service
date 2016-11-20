## Description of test-data
Files not described here are used for unit testing of the µs
### Events
Events are created based on a loop of dojos (from 1 to x) and named based on the index as of
"test event {n}". If there is no dojo, we use the previous.
Applications are created based upon applications relationship, retrieving the dojo by name, the event by name ("test event {n}", where the event is name is specified in the applications.json) and a user email.
* "test event 1":
  * belongs to dojo1
  * is not full
  * is not past
  * has 1 ticket
  * has 1 session
  * contains a parent with 2 kids (one u13 and one o13)
* "test event 2":
  * belongs to dojo2
  * is full
  * is not past
  * has ticket approval
  * has 1 session
  * has 3 tickets
  * contains a parent with 2 kids (one u13 and one o13)
  * contains a mentor
* "test event 3"
  * belongs to dojo3
  * does not have tickets
  * is a draft

### Applications
* "test event 1":
  * parent1
  * childo13
  * childu13
* "test event 2"
  * parent1
    * childo13
    * childu13
  * mentor1
