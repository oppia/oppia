/* jshint node:true */

'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function() {

  var js_dependencies =[
    'bower_components/codemirror/lib/codemirror.js',
    'bower_components/codemirror/mode/scheme/scheme.js',
    'bower_components/codemirror/mode/javascript/javascript.js',
    'bower_components/codemirror/mode/xml/xml.js',
  ];

  var css_dependencies = [
    'bower_components/codemirror/lib/codemirror.css',
    'bower_components/codemirror/theme/twilight.css'
  ];

  function putThemInVendorDir (filepath) {
    return 'vendor/' + path.basename(filepath);
  }

  return {
    humaName : 'UI.CodeMirror',
    repoName : 'ui-codemirror',
    inlineHTML : fs.readFileSync(__dirname + '/demo/demo.html'),
    inlineJS : fs.readFileSync(__dirname + '/demo/demo.js'),
    css: css_dependencies.map(putThemInVendorDir),
    js : js_dependencies.map(putThemInVendorDir).concat(['dist/ui-codemirror.js']),
    tocopy : css_dependencies.concat(js_dependencies)
  };
};
