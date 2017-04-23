textAngular v1.4.0
===========

[![Build Status](https://travis-ci.org/fraywing/textAngular.png?branch=master)](https://travis-ci.org/fraywing/textAngular) [![Coverage Status](https://coveralls.io/repos/fraywing/textAngular/badge.png)](https://coveralls.io/r/fraywing/textAngular)


Demo is available at: http://www.textangular.com (Or editable [Plunkr Demo](http://plnkr.co/edit/kKPfk0LCXWrMpZ1gkblb?p=preview))

#### Upgrading From 1.2.2 or earlier

To upgrade from version 1.2.2 or earlier you need to follow these steps:

1. The styling for textAngular is now in the `dist/textAngular.css` file, you will need to include this or a copy of it with your own modifications.
2. The rangy library is now required, you will need both the `rangy-core` and `rangy-saveselection` modules, alternatively you can include the compressed version (`textAngular-rangy.min.js`) in the dist folder

## Requirements

1. `AngularJS` ≥ `1.3.x`
2. `Rangy` ≥ `1.3.x`, Both rangy-core and rangy-saveselection are required. (There is a minified combination of these two included in the dist folder)
3. `Font-Awesome` ≥ `4.x` for the default icons on the toolbar
1. `Bootstrap` ≥ `3.x` for the default styles (Can use `bootstrap-css-only`, you must add this to your bower or include this manually)
5. NOTE: please check the requirements for earlier releases, if these are an issue.

### Where to get it

**NOTE:** Our `textAngular-sanitize.js` and angular.js's `angular-sanitize.js` are the SAME file, you must include one or the other but not both. We highly recommend using `textAngular-sanitize.js` as it loosens some parts of the sanitizer that are far too strict for our uses and adds some more features we need.

**Via Bower:**

Run `bower install textAngular` from the command line.
Include script tags similar to the following:
```html
<link rel='stylesheet' href='/bower_components/textAngular/dist/textAngular.css'>
<script src='/bower_components/textAngular/dist/textAngular-rangy.min.js'></script>
<script src='/bower_components/textAngular/dist/textAngular-sanitize.min.js'></script>
<script src='/bower_components/textAngular/dist/textAngular.min.js'></script>
```

**Via NPM:**

Run `npm install textangular` from the command line.
Include script tags similar to the following:
```html
<link rel='stylesheet' href='/node_modules/textangular/dist/textAngular.css'>
<script src='/node_modules/textangular/dist/textAngular-rangy.min.js'></script>
<script src='/node_modules/textangular/dist/textAngular-sanitize.min.js'></script>
<script src='/node_modules/textangular/dist/textAngular.min.js'></script>
```
Install using commonjs (eg componentjs, Webpack, Browserify):
```
angular.module('myModule', [require('angular-sanitize'), require('textAngular')]);
```
Optionally, install textAngular-santize.min.js by requiring it BEFORE requring textAngular:
```
require('textangular/dist/textAngular-sanitize.min');
angular.module('myModule', [require('textAngular')]);
```
For CSS support with Webpack, install the style-loader, css-loader (and postcss-loader) and configure the loader in your webpack.config.js similar to the following:
```
loaders: [
  {test: /\.css$/, loader: 'style!css!postcss'}
]
```

**Via CDNJS:**

Include script tags similar to the following:
```html
<script src='http://cdnjs.cloudflare.com/ajax/libs/textAngular/1.3.0/textAngular-sanitize.min.js'></script>
<script src='http://cdnjs.cloudflare.com/ajax/libs/textAngular/1.3.0/textAngular.min.js'></script>
```

**Via jsDelivr:**

Include script tag similar to the following: (For details on how this works see: [https://github.com/jsdelivr/jsdelivr#load-multiple-files-with-single-http-request](https://github.com/jsdelivr/jsdelivr#load-multiple-files-with-single-http-request))
```html
<script src='http://cdn.jsdelivr.net/g/angular.textangular@1.3.0(textAngular-sanitize.min.js+textAngular.min.js)'></script>
```

**Via Github**

Download the code from [https://github.com/fraywing/textAngular/releases/latest](https://github.com/fraywing/textAngular/releases/latest), unzip the files then add script tags similar to the following:
```html
<link rel='stylesheet' href='/path/to/unzipped/files/dist/textAngular.min.css'>
<script src='/path/to/unzipped/files/dist/textAngular-rangy.min.js'></script>
<script src='/path/to/unzipped/files/dist/textAngular-sanitize.min.js'></script>
<script src='/path/to/unzipped/files/dist/textAngular.min.js'></script>
```

### Usage

1. Include (`rangy-core.js` and `rangy-saveselection.js`) or `textAngular-rangy.min.js` in your project using script tags
2. Include `textAngular-sanitize.js` or `textAngular-sanitize.min.js` in your project using script tags
3. Include (`textAngularSetup.js` and `textAngular.js`) or `textAngular.min.js` (textAngularSetup.js is included inside textAngular.min.js)
4. Add a dependency to `textAngular` in your app module, for example: ```angular.module('myModule', ['textAngular'])```.
5. Create an element to hold the editor and add an `ng-model="htmlVariable"` attribute where `htmlVariable` is the scope variable that will hold the HTML entered into the editor:
```html
<div text-angular ng-model="htmlVariable"></div>
```
OR
```html
<text-angular ng-model="htmlVariable"></text-angular>
```
This acts similar to a regular AngularJS / form input if you give it a name attribute, allowing for form submission and AngularJS form validation.

Have fun!

**Important Note:** Though textAngular supports the use of all attributes in it's input, please note that angulars ng-bind-html **WILL** strip out all of your style attributes if you are using `angular-sanitize.js`.

For Additional options see the [github Wiki](https://github.com/fraywing/textAngular/wiki).

### Issues?

textAngular uses ```execCommand``` for the rich-text functionality.
That being said, its still a fairly experimental browser feature-set, and may not behave the same in all browsers - see http://tifftiff.de/contenteditable/compliance_test.html for a full compliance list.
It has been tested to work on Chrome, Safari, Opera, Firefox and Internet Explorer 8+.
If you find something, please let me know - throw me a message, or submit a issue request!

### FAQ

1. **Toolbar shows up with some being blank instead of icons**<br/>
You need to include font-awesome on your page or nothing will show up.
1. **Youtube Insert embeds a ```<img>``` tag and aren't showing the video.**<br/>
The problems with iFrames are that they are a security risk so the sanitizer by default strips them out. Instead of changing the sanitizer to allow iFrames we use a placeholder for youtube videos which has the added advantage of allowing you to edit their size and placement in the editor. To display the youtube videos when you aren't in the editor use the following html: ```<div ta-bind ng-model="data.htmlcontent"></div>```. This invokes our custom renderers to convert the ```<img>``` tags back into the youtube video you expect.
2. **But I want to use Youtube outside of angular**<br/>
You'll have to apply the renderers manually, see comment in issue [#469](https://github.com/fraywing/textAngular/issues/469#issuecomment-68650506) for details.
3. **IE Is automatically converting typed links to `<a href...>` tags**<br/>
This is a known issue with IE, to prevent this run the following javascript after page load: `document.execCommand("AutoUrlDetect", false, false)`. See [#475](https://github.com/fraywing/textAngular/issues/475) for details.
4. **Error `"textAngular Error: An editor with the name already exists"` occurs**<br/>
See Issue [#240](https://github.com/fraywing/textAngular/issues/240) for specific details on why this occurs and how to resolve it.

## Developer Notes

When checking out, you need a node.js installation, running `npm install` and then `bower install` will get you setup with everything to run the unit tests and minification.
All changes should be done in the src folder, running `grunt compile` to compile the app or use `grunt watch` to compile the files as you save them.
When you are ready to create A PR check that `grunt` passes without errors and you have created tests for your feature if necessary.

## Customization

It is possible to override the toolbar by using a decorator in the module's .config block. Simply set the taOptions.toolbar to an array of arrays comprised of button names. Each array of button names represents a button group. The default toolbar can be represented like so:
```html
  taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
  ];
```
New buttons can be created using taRegisterTool. Examples can be found inside demo/static-demo.html

## License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).


## Contributers

Special thanks to all the contributions thus far!

For a full list see: https://github.com/fraywing/textAngular/graphs/contributors
