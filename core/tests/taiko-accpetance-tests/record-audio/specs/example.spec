# Getting Started with Gauge

This is an example markdown specification file.
Every heading in this file is a scenario.
Every bulleted point is a step.

To execute this specification, use
	npm test

This is a context step that runs before every scenario
* Open todo application

## Display number of items
* Add task "first task"
* Must display "1 item left"
* Add task "second task"
* Must display "2 items left"

## Must list only active tasks
* Add tasks 

   |description|
   |-----------|
   |first task |
   |second task|
   |third task |
   |fourth task|
   |fifth task |

* Complete tasks 

   |description|
   |-----------|
   |second task|
   |fifth task |
* View "Active" tasks
* Must have 

   |description|
   |-----------|
   |first task |
   |third task |
   |fourth task|
* Must not have 

   |description|
   |-----------|
   |second task|
   |fifth task |

A tear down step for every scenario
___
* Clear all tasks
