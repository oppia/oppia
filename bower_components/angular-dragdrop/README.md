#Drag and Drop for AngularJS (with Animation)
[![Build Status](https://api.travis-ci.org/codef0rmer/angular-dragdrop.svg?branch=master)](https://travis-ci.org/codef0rmer/angular-dragdrop)
[![npm](https://img.shields.io/npm/dt/angular-dragdrop.svg)](https://www.npmjs.com/package/angular-dragdrop)
[![npm version](https://img.shields.io/npm/v/angular-dragdrop.svg)](https://www.npmjs.com/package/angular-dragdrop)
[![Bower version](https://img.shields.io/bower/v/angular-dragdrop.svg)](https://github.com/codef0rmer/angular-dragdrop)
 
---

Implementing jQueryUI Drag and Drop functionality in AngularJS is easier than ever which is a wrapper for jQueryUI draggable/droppable components.

###v1.0.13
  1. Allow to animate back on beforeDrop-cancel event if jqyouioptions.revertDuration is set
  2. Pass right context in case of CtrlAs syntax
  3. Add vertical sortable example in demo/dnd-insertInline.html


##How to Use

 * `bower install angular-dragdrop` (or `sudo bower install angular-dragdrop --allow-root`)
 * Reference `angular-dragdrop.min.js` in your application as:

   ```
<script src="components/angular-dragdrop/src/angular-dragdrop.min.js"></script>
```
 * Resolve the dependency in the main module of your application as:

 ```
 angular.module('myApp', ['ngDragDrop'])
 ```

 * Drag anything as:

 ```
 <span data-drag="true" jqyoui-draggable>So you think you can drag</span>
 ```
 * Finally, check out [the cool demos](http://codef0rmer.github.io/angular-dragdrop/#/)
 * Note, use [touchpunch.js](http://touchpunch.furf.com/) to enable drag/drop on touch devices.

##Angular Draggable options
* **jqyoui-draggable** – A custom angular attribute to make any element draggable. It holds more settings such as:
    * **index** – number – $index of an item of a model (if it is an array) associated with it
    * **placeholder** – boolean/string – If true, the place will be occupied even though a dragggable is moved/dropped somewhere else. If 'keep' is supplied, the original item won't be removed from the draggable.
    * **animate** – boolean – If true, draggable will be animated towards droppable when dropped. If multiple is not set to true on droppable then its draggable will swap its position.
    * **onStart** – string – callback method to be invoked (has to be defined in a controller) when dragging starts
    * **onStop** – string – callback method to be invoked when dragging stops
    * **onDrag** – string – callback method to be invoked while the mouse is moved during the dragging
    * **applyFilter** - string - applies AngularJS $filter on the list before swapping items. Only applicable, if ngRepeat has any filter (such as orderBy, limitTo) associated with it.
    * **containment** – string - position/offset. Offset by default. This forces to use jQuery.position() or jQuery.offset() to calculate proper position with respect to parent element or document respectively. 
    * **deepCopy** - boolean (optional) – If true, makes a deep copy of draggable that looses prototypical inheritance.
    * **beforeDrop** – promise (optional) – Ask for confirmation before swapping. Works with both window.confirm and custom popup. 
    * **insertInline** – boolean(optional) – Make a list sortable. Same model is mandatory for draggable and droppable.
    * **direction** – string(optional) – Property name that will be created on each scope to manage animation direction. 
* **data-drag** – boolean – If true, element can be draggable. Disabled otherwise.
* **data-jqyoui-options** – object – should hold all the valid options supported by [jQueryUI Draggable](http://api.jqueryui.com/draggable)
* **ng-model** – string – An angular model defined in a controller. Should be a JS array or object

##Angular Droppable options
* **jqyoui-droppable** – A custom angular attribute to make any element droppable. It holds more settings such as:
    * **index** – number – $index of an item of a model (if it is an array) associated with it
    * **multiple** – boolean – Requires to be true only if animate is set to true for draggable and to avoid swapping.
    * **stack** – boolean – Requires if animate is set to true on draggable and if multiple draggables positioned one below the other
    * **onDrop** – string – callback method to be invoked a draggable is dropped into the droppable
    * **onOver** – string – callback method to be invoked when an accepted draggable is dragged over the droppable
    * **onOut** – string – callback method to be invoked when an accepted draggable is dragged out of the droppable
    * **applyFilter** - string - requires if both droppable as well as draggable share the same ngModel.
    * **containment** – string - position/offset. Offset by default. This forces to use jQuery.position() or jQuery.offset() to calculate proper position with respect to parent element or document respectively. 
    * **deepCopy** – boolean (optional) – If true, makes a deep copy of droppable that looses prototypical inheritance.
    * **beforeDrop** – promise (optional) – Ask for confirmation before dropping. Works with both window.confirm and custom popup. 
* **data-drop** – boolean – If true, element can be droppable. Disabled otherwise.
* **data-jqyoui-options** – object – should hold all the valid options supported by [jQueryUI Droppable](http://api.jqueryui.com/droppable)
* **ng-model** – string – An angular model defined in a controller. Should be a JS array or object.

##How to Contribute
* $ git clone https://github.com/codef0rmer/angular-dragdrop.git
* $ cd angular-dragdrop
* $ npm install --quiet -g karma-cli bower
* $ sudo npm install
* $ sudo bower install --force-latest
* $ npm test

##Demo
Demo is [here](http://codef0rmer.github.io/angular-dragdrop/#/)

###v1.0.12
  1. Supports insertInline option to simulate sortable functionality.
  2. Relies on ngAnimate for sortable animation from left/right.
  3. Checkout the demo in demo/dnd-insertInline.html

###v1.0.9 - breaking change
  1. Draggable and Droppable will not be [deep copied](https://egghead.io/lessons/angularjs-angular-copy-for-deep-copy) by default unlike previous versions. Use `deepCopy` option if prototypical inheritance is not required.
  2. Callbacks will not be executed forcefully within the context of scope which requires an extra digest loop for each event (start, stop, over, out, etc), especially drag that fires many times and running a digest loop is performance intensive in such scenario. Call `scope.$apply()` within callback, if needed.


###v1.0.5 - breaking change
Do not pass evaluated expressions in callbacks. For example, 
####Before:
```
<div jqyoui-draggable="{onStart:'startCallback({{item}})'}">{{item.title}}</div>
```
####After:
```
<div jqyoui-draggable="{onStart:'startCallback(item)'}">{{item.title}}</div>
```

## Support
If you're having problems with using the project, use the support forum at CodersClan.

<a href="http://codersclan.net/forum/index.php?repo_id=17"><img src="http://www.codersclan.net/graphics/getSupport_blue_big.png" width="160"></a>
