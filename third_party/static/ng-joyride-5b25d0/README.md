ng-joyride
=========

An angular directive that provides the "joyride" functionality for introducing your websites.Similar to [Jquery Joyride](http://zurb.com/playground/jquery-joyride-feature-tour-plugin) but a lot better.

![ng-joyride](http://oi59.tinypic.com/2u7omdd.jpg)    

###Demo   

See [the demo page](http://abhikmitra.github.io/ng-joyride-demo/#/) for a demo and the overview of the features.


Installation
--------------
###Bower
You can install this package through `Bower` by using the following command :

```sh
bower install ng-joyride --save
```

Add dependencies to your project.

```sh
<link href="/bower_components/bootstrap/dist/css/bootstrap.css" rel="stylesheet">
<link href="/bower_components/ng-joyride/ng-joyride.css" rel="stylesheet">


<script src="/bower_components/jquery/jquery.js"></script>
<script src="/bower_components/angular/angular.js"></script>
<script src="/bower_components/bootstrap/dist/js/bootstrap.js"></script>
<script src="/bower_components/ng-joyride/ng-joyride.js"></script>
```


Add it to your module.

```sh
angular.module('myModule', [
    'ngJoyRide'
])
```
There is one directive called `ng-joy-ride` which can be used as an attribute.

```sh
<div ng-joy-ride="startJoyRide" config="config" on-finish="onFinish()"  on-skip="onFinish()"></div>
```  
-----    
       

### Starting the Joyride   


####ng-joy-ride   
You can invoke the joyride from anywhere by setting (in this case) `startJoyRide` to true.The scope variable that you bind to `ng-joy-ride` is the one that will control the start of the joyride. Once the joyride is complete , the scope variable gets set to false.So on completeion of the joyride `startJoyRide` will be set to false     


### Stopping the Joyride

The joyride stops when, the user presses "skip", "finish" or when  you programamtically set `startJoyRide` to false.Setting `startJoyRide` to false when the joyride is on , will have the same effect as skip.

--------

### Joyride Events
You can bind to certain events in order to control the behaviour of the tour,
this can be useful when you want a more specific level of interaction, where
the tour continues by a user action instead of hitting Next.  The following
events are currently available:

- `joyride:prev`: Go to the previous tour step
- `joyride:next`: Go to the next tour step
- `joyride:exit`: Skip & exit the tour

#### Example
You'll have to use something like jQuery to trigger the events on the element,
for example, if you've defined the following tour:

```html
<div id="serverTour" ng-joy-ride="startServerTour" config="serverTourConfig"></div>
```

You can call the events on it with the following way:

```javascript
$("#serverTour").trigger("joyride:next")
```

--------

### Configuring the joyride
####config
This is the attribute for setting the required steps.In the above example `scope.config` will have the list of `joyride-element` that you can pass through the `config`.    
Example

```sh
$scope.config = [
        {
                type: "title",
                heading: "Welcome to the NG-Joyride demo",
                text: '<div class="row"><div id="title-text" class="col-md-12"><span class="main-text">Welcome to <strong>Ng Joyride Demo</strong></span><br><span>( This demo will walk you through the features of Ng-Joyride. )</span><br/><br/><span class="small"><em>This can have custom html too !!!</em></span></div></div>'

            },{
                type: "element",
                selector: "#finish",
                heading: "Custom Title",
                text: "The demo finishes.Head over to github to learn more",
                placement: "top",
                scroll: true
            }

        ];
``` 

Each element of the array should be a proper joyride element.There are 4 types of `joyride-element`.

* **title** - The `title joyride-element' opens a generic styled box shows showing information.You can have custom HTML passed to it as you see above
* **element** - Boostrap popvers over `elements` that you pass through the selector.Any jqyery selector will work.
* **function** - A function call . The function call will be done.Through this you can render more DOM or open a modal etc
* **location_change** - This will change the location using `$location.path` incase the joyride needs to be across different pages of your website.    
                      

####Elaborate details of each of the Joyride Elements are at the end   

--------

### Hooks in the joyride


#### on-finish,on-skip


You can pass functions using the `on-finish` and `on-skip` attributes.The function passed to `on-finish` will be called on finish of the joyride and the `on-skip` function will be called if the user skips from the joyride.


------

### Demo and example usage.

You see this repo [sample repo](https://github.com/abhikmitra/ng-joyride-demo) for the usage. You can download it and run it through a web browser.You can check [main.js](https://github.com/abhikmitra/ng-joyride-demo/blob/gh-pages/main.js) to see how I have passed the `config` using `$scope.config`


----------

## Joyride-Element Descriptions    


###&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Type : Title


```sh
$scope.config = [
        {
                type: "title",
                heading: "Welcome to the NG-Joyride demo",
                text: '<div class="row"><div id="title-text" class="col-md-12"><span class="main-text">Welcome to <strong>Ng Joyride Demo</strong></span><br><span>( This demo will walk you through the features of Ng-Joyride. )</span><br/><br/><span class="small"><em>This can have custom html too !!!</em></span></div></div>'
                 curtainClass : 'myCustomClass' //this is optional.
            }
        ];
```

The `title` element generates a box that looks like below.

![ng-joyride](http://oi62.tinypic.com/2d9zs0k.jpg)   
####Properties

* `heading` : Custom heading that you want the title box to have.
* `text` : Text or HTML can be passed
* `titleTemplate` ( Optional ) : You can pass a templateURL that can be used in case you don't want the default template.This will be a url that can be loaded either from the $templateCache or through AJAX if its not present in the cache.
* `curtainClass` ( Optional ) : You can use this to pass your custom class to the joyride background.This is useful where you want the background to change in each step.
   
#####&nbsp;&nbsp; Custom `titleTemplate`. The custom title template should have the following placeholder.    


* *Heading Placeholder* : `{{heading}}` will be replaced by the heading you pass.
* *Content Placeholder* : `<div ng-bind-html="content"></div>` should be present in your template so that it can be populated by the template.
* *Skip Joyride Placeholder* : `<a class="skipBtn"></a>` should be present as the class selector `skipBtn` is ysed to detect whether the user skipped the joyride.
* *Previous Button Placeholder* : `<a class="prevBtn"></a>` should be present as the class selector `prevBtn` is used to detect whether the user pressed on previous step. 
* *Next Button Placeholder* : `<a class="nextBtn"></a>` should be present as the class selector `nextBtn` is used to detect whether the user pressed on next step.  

The default template for 'title' is .


```sh
"<div id=\"ng-joyride-title-tplv1\"><div class=\"ng-joyride sharp-borders intro-banner\" style=\"\"><div class=\"popover-inner\"><h3 class=\"popover-title sharp-borders\">{{heading}}</h3><div class=\"popover-content container-fluid\"><div ng-bind-html=\"content\"></div><hr><div class=\"row\"><div class=\"col-md-4 skip-class\"><a class=\"skipBtn pull-left\" type=\"button\"><i class=\"glyphicon glyphicon-ban-circle\"></i>&nbsp; Skip</a></div><div class=\"col-md-8\"><div class=\"pull-right\"><button disabled=\"disabled\" class=\"prevBtn btn\" type=\"button\"><i class=\"glyphicon glyphicon-chevron-left\"></i>&nbsp;Previous</button> <button id=\"nextTitleBtn\" class=\"nextBtn btn btn-primary\" type=\"button\">Next&nbsp;<i class=\"glyphicon glyphicon-chevron-right\"></i></button></div></div></div></div></div></div></div>"
```
---------

###&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Type : Element  

```sh
$scope.config = [
        {
                type: "element",
                selector: "#home",
                heading: "Title can have <em>HTML</em>",
                text: "You are in the <em>home page.</em>",
                placement: "bottom",
                scroll: true,
                curtainClass : 'myCustomClass' //this is optional.
            }
        ];
```

The `element` joyride-element generates a box that looks like below.

![ng-joyride](http://oi58.tinypic.com/vxyk1w.jpg)   
####Properties

* `type` : Should be a string `element`
* `selector` : Any jquery selector can be passed here.
* `heading` : This is the heading.Can have html also.
* `text` : Text or HTML can be passed
* `placement` ( Optional ) : Where the popover will be placed.Similar to bootstrap popover placements. The possible values are "top|bottom|right|left".
* `scroll` : Whether you want, the page to be scrolled to the particular element.
* `advanceOn` (Optional): An action on the page which will move the Joyride to the next step.  It must consist of `element` and `event`.  Example: `{element: '#foo', event: 'click'}`
* `curtainClass` ( Optional ) : You can use this to pass your custom class to the joyride background.This is useful where you want the background to change in each step.
* `attachToBody` ( Optional ) : You can use this to attach the popover to the body instead of the element.In some cases you might run into problems with css stacking context.Normally you wouldn't need to use this
* `shouldNotStopEvent` ( Optional ) : This should be set to true if you want event generated on the selected element to propagate. This should be rarely needed as you normally would not want user to click on a button and trigger actions out of joyride.If you are looking to move the joyride forward when user does an action other than click 'next', use advanceOn.
* `elementTemplate` ( Optional ) : This is a function which receives two arguments (content,isEnd) . content -> The content to display, isEnd -> Is true if its the last step. Return value of the function is used a template.This function controls the look and feel of the popover, that part which is inside the popover-content.

Can also be used as a delegate which accepts content to be displayed and if it is
reached the end of the tour. This will enable you to customize the look and feel of element type just as you can with title type. An example of this is shown below:

```sh
function _generateTextForNext(isEnd){
      if (isEnd) {
        return 'Finish';
      } else {
        return 'Next';
      }
    }

    function elementTourTemplate(content, isEnd){
      return '<div class=\"row\"><div id=\"pop-over-text\" class=\"col-md-12\">' + content + '</div></div><hr><div class=\"row\"><div class=\"col-md-4 center\"><a class=\"skipBtn pull-left\" type=\"button\">Skip</a></div><div class=\"col-md-8\"><div class=\"pull-right\"><button id=\"prevBtn\" class=\"prevBtn btn btn-xs\" type=\"button\">Previous</button> <button id=\"nextBtn\" class=\"nextBtn btn btn-xs btn-primary\" type=\"button\">' + _generateTextForNext(isEnd) + '</button></div></div></div>';
    }
    
$scope.config = [
        {
                type: "element",
                selector: "#home",
                heading: "Title can have <em>HTML</em>",
                text: "You are in the <em>home page.</em>",
                placement: "bottom",
                scroll: true,
                elementTemplate: elementTourTemplate
            }
        ];
```
The string returned by "elementTemplate" should have the following placeholders.

* *Previous Button* : a button of id "prevBtn" should be present for previous the user to go back.
* *Next Button* : a button of id "nextBtn" should be present for previous the user to go back.
* *Skip Button* : a button of id "skipBtn" should be present for previous the user to go back.

#####&nbsp;&nbsp;  Each `joyride-element` can have its own `elementTemplate` function .The below parameter controls
the look and feel of the popover as a whole while the above part controls the look and feel of the "popover-content" section

```sh
<div ng-joy-ride="startJoyRide" config="config" template-uri="template.html"></div>
``` 

The custom template-uri (This is different from the elementTemplate config )can be passed as an attribute value to template-uri as shown above.template.html will be loaded asynchronously in the above case.


The custom element template (supplied through template-uri) should have the following placeholders.

* *Heading Placeholder* : `{{heading}}` will be replaced by the heading you pass.
* *popover-title* : `<h3 class="popover-title"></h3>`.An element with class popover-title should be present for bootstrap to identify the popover template.
* *popover-content* : `<div class="popover-content"></div>`.An element with class popover-content should be present for bootstrap to identify the popover content template.
  

The default template for 'element' is .


```sh
"<div class=\"popover ng-joyride sharp-borders\"> <div class=\"arrow\"></div>   <h3 class=\"popover-title sharp-borders\"></h3> <div class=\"popover-content container-fluid\"></div></div>"
```


The template supplied by template-uri will be same for all the popovers which will be structurally similar.Fine grained control and distinction can be achieved by the "elementTemplate" which can be different for each step


---------

###&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Type : location_change

This is required where your intro content spans over multiple pages and you want joyride to be across multiple pages.

```sh
$scope.config = [
        {
                type: "location_change",
                path: "/demo"
            }
        ];
```

Immediately after changing the location, the next `joyride-element` is called. 
####Properties

* `type` : Should be a string `location_change`
* `path` : The path to navigate to should be passed here.The path needs to be a part of the same app.

  

---------

###&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Type : function

This is required where your need to run some function for your dom element to get generated.

```sh
$scope.config = [
        {
                type: "function",
                fn: openModalForDemo //(can also be a string, which will be evaluated on the scope)
            }
        ];
```

Immediately after calling the function, the next `joyride-element` is called.

The function that you will be passing should expect a boolean argument.

For eg :
`true` being passed to the function, will signify creation of dom nodes.Like opening of modal.
`false` being passed the function, will signify removal of these nodes, like closing the modal.

This is important, for the 'previous' button to work .

####Properties

* `type` : Should be a string `function`
* `fn` : pass the actual function reference.Or you can pass a function name as string. If you pass a string then it will be resolved on the scope .




License
----

MIT


**Free Software, Hell Yeah!**

