// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for using the Svgdiagram component during end-to-end
 * testing with Protractor.js
 */

var waitFor = require(
  process.cwd() + '/core/tests/protractor_utils/waitFor.js');
var request = require('request');

const SVGTAGS = {
  rectangle: (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y="' +
    '0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matri' +
    'x(1 0 0 1 50 50)"><rect style="stroke: rgb(0,0,0); stroke-width: 3; str' +
    'oke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke' +
    '-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-opacity:' +
    ' 0; fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stroke" ' +
    'x="-30" y="-35" rx="0" ry="0" width="60" height="70"/></g></svg>'),
  circle: (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y="' +
    '0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matri' +
    'x(1 0 0 1 50 50)"><circle style="stroke: rgb(0,0,0); stroke-width: 3; s' +
    'troke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stro' +
    'ke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-opacit' +
    'y: 0; fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stroke' +
    '" cx="0" cy="0" r="30"/></g></svg>'),
  line: (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y="' +
    '0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matri' +
    'x(1 0 0 1 75 75)"><line style="stroke: rgb(0,0,0); stroke-width: 3; str' +
    'oke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke' +
    '-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: no' +
    'nzero; opacity: 1; vector-effect: non-scaling-stroke" x1="-25" y1="-25"' +
    ' x2="25" y2="25"/></g></svg>'),
  text: (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y="' +
    '0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matri' +
    'x(1 0 0 1 50 50)" style=""><text font-family="helvetica" font-size="18"' +
    ' font-style="normal" font-weight="normal" style="stroke: none; stroke-w' +
    'idth: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffse' +
    't: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); f' +
    'ill-rule: nonzero; opacity: 1; white-space: pre;"><tspan x="-21.51" y="' +
    '-6.14">Enter</tspan><tspan x="-21.51" y="17.45">Text</tspan></text></g>' +
    '</svg>'),
  rectangle_bezier: (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y="' +
    '0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matri' +
    'x(1 0 0 1 50 50)"><rect style="stroke: rgb(0,0,0); stroke-width: 3; str' +
    'oke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke' +
    '-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-opacity:' +
    ' 0; fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stroke" ' +
    'x="-30" y="-35" rx="0" ry="0" width="60" height="70"/></g><g transform=' +
    '"matrix(1 0 0 1 95 62.5)"><path style="stroke: rgb(0,0,0); stroke-width' +
    ': 3; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0' +
    '; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-' +
    'opacity: 0; fill-rule: nonzero; opacity: 1;" transform=" translate(-95,' +
    ' -62.5)" d="M 40 40 Q 95 100 150 40" stroke-linecap="round"/></g></svg>')
};

var customizeComponent = async function(modal, shapes) {
  await shapes.forEach(async function(shape) {
    var shapeClass = '.protractor-test-create-' + shape;
    var shapeTool = modal.element(by.css(shapeClass));
    await waitFor.elementToBeClickable(
      shapeTool,
      'Could not click on the required tool');
    if(shape === 'bezier') {
      await shapeTool.click();
    }
    await shapeTool.click();
  });
  var saveDiagram = modal.element(by.css('.protractor-test-save-diagram'));
  await waitFor.elementToBeClickable(
    saveDiagram,
    'Could not save the diagram');
  await saveDiagram.click();
  await waitFor.visibilityOf(
    modal.element(by.css('.protractor-test-saved-diagram-container')),
    'Diagram container not visible');
};

var expectComponentDetailsToMatch = async function(elem, shapesName) {
  var svgName = shapesName.join('_');
  var src = await elem.element(by.css(
    '.protractor-test-svg-diagram')).getAttribute('src');
  await request(src, function(error, response, body) {
    expect(body.replace(/(\r\n|\n|\r)/gm, '')).toBe(SVGTAGS[svgName]);
  });
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
