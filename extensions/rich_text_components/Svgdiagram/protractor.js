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
    'x(1 0 0 1 41.5 46.5)"><rect style="stroke: rgb(0,0,0); stroke-width: 3;' +
    ' stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; st' +
    'roke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-opac' +
    'ity: 0; fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stro' +
    'ke" x="-30" y="-35" rx="0" ry="0" width="60" height="70"/></g></svg>'),
  circle: ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.' +
  'w3.org/1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 49' +
  '4 338"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" ' +
  'y="0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matr' +
  'ix(1 0 0 1 41.5 41.5)"><circle style="stroke: rgb(0,0,0); stroke-width: 3' +
  '; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; str' +
  'oke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-opacity' +
  ': 0; fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stroke" c' +
  'x="0" cy="0" r="30"/></g></svg>'),
  line: ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3' +
  '.org/1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 ' +
  '338"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y=' +
  '"0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matrix' +
  '(1 0 0 1 31.5 31.5)"><line style="stroke: rgb(0,0,0); stroke-width: 3; st' +
  'roke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-' +
  'linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonze' +
  'ro; opacity: 1; vector-effect: non-scaling-stroke" x1="-20" y1="-20" x2="' +
  '20" y2="20"/></g></svg>'),
  text: ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3' +
  '.org/1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 ' +
  '338"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y=' +
  '"0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matrix' +
  '(1 0 0 1 32.01 32.47)" style=""><text font-family="helvetica" font-size="' +
  '18" font-style="normal" font-weight="normal" style="stroke: none; stroke-' +
  'width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset' +
  ': 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill' +
  '-rule: nonzero; opacity: 1; white-space: pre;"><tspan x="-21.51" y="-6.14' +
  '">Enter</tspan><tspan x="-21.51" y="17.45">Text</tspan></text></g></svg>')
};

var customizeComponent = async function(modal, shape) {
  var shapeClass = '.protractor-test-create-' + shape;
  var shapeTool = modal.element(by.css(shapeClass));
  await waitFor.elementToBeClickable(
    shapeTool,
    'Could not click on the required tool');
  await shapeTool.click();
  var saveDiagram = modal.element(by.css('.protractor-test-save-diagram'));
  await waitFor.elementToBeClickable(
    saveDiagram,
    'Could not save the diagram');
  await saveDiagram.click();
  await waitFor.visibilityOf(
    modal.element(by.css('.protractor-test-saved-diagram-container')),
    'Diagram container not visible');
};

var expectComponentDetailsToMatch = async function(elem, shapeName) {
  var src = await elem.element(by.css(
    '.protractor-test-svg-diagram')).getAttribute('src');
  await request(src, function(error, response, body) {
    expect(body.replace(/(\r\n|\n|\r)/gm, '')).toBe(SVGTAGS[shapeName]);
  });
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
