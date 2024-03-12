// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for using the Image component during end-to-end
 * testing with Webdriverio.js
 */

var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);
var request = require('request');
var path = require('path');

const FABRIC_VERSION = '4.6.0';
const SVGTAGS = {
  rectangle:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js ' +
    FABRIC_VERSION +
    '</desc><defs></def' +
    's><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g' +
    ' transform="matrix(1 0 0 1 50 50)"><rect style="stroke: rgb(0,0,0); str' +
    'oke-width: 3; stroke-dasharray: none; stroke-linecap: butt; stroke-dash' +
    'offset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,' +
    '0); fill-opacity: 0; fill-rule: nonzero; opacity: 1; vector-effect: non' +
    '-scaling-stroke" x="-30" y="-35" rx="0" ry="0" width="60" height="70"/>' +
    '</g></svg>',
  circle:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js ' +
    FABRIC_VERSION +
    '</desc><defs></def' +
    's><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g' +
    ' transform="matrix(1 0 0 1 50 50)"><circle style="stroke: rgb(0,0,0); s' +
    'troke-width: 3; stroke-dasharray: none; stroke-linecap: butt; stroke-da' +
    'shoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,' +
    '0,0); fill-opacity: 0; fill-rule: nonzero; opacity: 1; vector-effect: n' +
    'on-scaling-stroke" cx="0" cy="0" r="30"/></g></svg>',
  line:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js ' +
    FABRIC_VERSION +
    '</desc><defs></def' +
    's><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g' +
    ' transform="matrix(1 0 0 1 75 75)"><line style="stroke: rgb(0,0,0); str' +
    'oke-width: 3; stroke-dasharray: none; stroke-linecap: butt; stroke-dash' +
    'offset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,' +
    '0); fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stroke" ' +
    'x1="-25" y1="-25" x2="25" y2="25"/></g></svg>',
  text:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="338" viewBox="0 0 494 338' +
    '"><desc>Created with Fabric.js ' +
    FABRIC_VERSION +
    '</desc><defs></def' +
    's><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g' +
    ' transform="matrix(1 0 0 1 50 50)" style=""><text font-family="Helvetic' +
    'a" font-size="18" font-style="normal" font-weight="normal" style="strok' +
    'e: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt;' +
    ' stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fi' +
    'll: rgb(0,0,0); fill-rule: nonzero; opacity: 1; white-space: pre;"><tsp' +
    'an x="-21.51" y="-6.14">Enter</tspan><tspan x="-21.51" y="17.45">Text</' +
    'tspan></text></g></svg>',
  rectangle_bezier_piechart_svgupload:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/' +
    '1999/xlink" version="1.1" width="494" height="368" viewBox="0 0 494 368' +
    '"><desc>Created with Fabric.js ' +
    FABRIC_VERSION +
    '</desc><defs></def' +
    's><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g' +
    ' transform="matrix(1 0 0 1 50 50)"><rect style="stroke: rgb(0,0,0); str' +
    'oke-width: 3; stroke-dasharray: none; stroke-linecap: butt; stroke-dash' +
    'offset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,' +
    '0); fill-opacity: 0; fill-rule: nonzero; opacity: 1; vector-effect: non' +
    '-scaling-stroke" x="-30" y="-35" rx="0" ry="0" width="60" height="70"/>' +
    '</g><g transform="matrix(1 0 0 1 95 62.5)"><path style="stroke: rgb(0,0' +
    ',0); stroke-width: 3; stroke-dasharray: none; stroke-linecap: butt; str' +
    'oke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: ' +
    'rgb(0,0,0); fill-opacity: 0; fill-rule: nonzero; opacity: 1;" transform' +
    '=" translate(-95, -62.5)" d="M 40 40 Q 95 100 150 40" stroke-linecap="r' +
    'ound"/></g><g transform="matrix(1 0 0 1 120 100)" style=""><text font-f' +
    'amily="Helvetica" font-size="18" font-style="normal" font-weight="norma' +
    'l" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke' +
    '-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-mi' +
    'terlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1; white-sp' +
    'ace: pre;"><tspan x="-100" y="-6.14" style="stroke: rgb(0,0,0); stroke-' +
    'width: 2; fill: rgb(255,0,0); ">▇</tspan><tspan x="-86.16" y="-6.14" st' +
    'yle="white-space: pre; "> - Data name 1 - 10</tspan><tspan x="-100" y="' +
    '17.45" style="stroke: rgb(0,0,0); stroke-width: 2; fill: rgb(0,255,0); ' +
    '">▇</tspan><tspan x="-86.16" y="17.45" style="white-space: pre; "> - Da' +
    'ta name 2 - 10</tspan></text></g><g transform="matrix(1 0 0 1 50 50)"><' +
    'g style=""><g transform="matrix(0 1 -1 0 0 0)"><g style=""><g transform' +
    '="matrix(1 0 0 1 0 0)" id="group0"><path d="M 0 -30 A 30 30 0 0 1 0 30"' +
    ' style="stroke: rgb(255,0,0); stroke-width: 1; stroke-dasharray: none; ' +
    'stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; str' +
    'oke-miterlimit: 4; fill: rgb(255,0,0); fill-rule: nonzero; opacity: 1; ' +
    'vector-effect: non-scaling-stroke" id="group0"/></g><g transform="matri' +
    'x(1 0 0 1 0 0)" id="group0"><polygon style="stroke: rgb(255,0,0); strok' +
    'e-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashof' +
    'fset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,' +
    '0); fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stroke" ' +
    'points="0,0 0,30 0,-30 0,0 " id="group0"/></g></g></g><g transform="mat' +
    'rix(0 -1 1 0 0 0)"><g style=""><g transform="matrix(1 0 0 1 0 0)" id="g' +
    'roup0"><path d="M 0 -30 A 30 30 0 0 1 0 30" style="stroke: rgb(0,255,0)' +
    '; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke' +
    '-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb' +
    '(0,255,0); fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-s' +
    'troke" id="group0"/></g><g transform="matrix(1 0 0 1 0 0)" id="group0">' +
    '<polygon style="stroke: rgb(0,255,0); stroke-width: 1; stroke-dasharray' +
    ': none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: mi' +
    'ter; stroke-miterlimit: 4; fill: rgb(0,255,0); fill-rule: nonzero; opac' +
    'ity: 1; vector-effect: non-scaling-stroke" points="0,0 0,30 0,-30 0,0 "' +
    ' id="group0"/></g></g></g></g></g><g transform="matrix(1 0 0 1 50 50)">' +
    '<g style=""><g transform="matrix(1 0 0 1 0 0)" id="group1"><circle styl' +
    'e="stroke: rgb(0,128,0); stroke-width: 4; stroke-dasharray: none; strok' +
    'e-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-m' +
    'iterlimit: 4; fill: rgb(255,255,0); fill-rule: nonzero; opacity: 1;" cx' +
    '="0" cy="0" r="40" id="group1"/></g></g></g></svg>',
};

var customizeComponent = async function (modal, selectedAction, args, altText) {
  // The arguments for this function are as follows:
  //   - modal: The selector for the customisation arguments modal.
  //   - selectedAction: Represents the user action. Image RTE component
  //       allows uploading an image from the system or creation of an
  //       image from scratch using the diagram editor. This argument
  //       takes the value 'create' or 'upload'.
  //   - args: The input to the editor. If the selected action is 'create',
  //       args would be a list of shapes and for 'upload' action, it
  //       would represent a filepath.
  //   - altText: The alt text for the image.
  if (selectedAction === 'create') {
    await action.click('Create button', modal.$('.e2e-test-create-image'));
    for (var i = 0; i < args.length; i++) {
      var shapeClass = '.e2e-test-create-' + args[i];
      var shapeTool = modal.$(shapeClass);
      var customTools = ['bezier', 'piechart', 'svgupload'];
      if (customTools.includes(args[i])) {
        await action.click('Shape tool', shapeTool);
        if (args[i] === 'svgupload') {
          var imageUploadInput = $('.e2e-test-photo-upload-input');
          absPath = path.resolve(__dirname, './circle.svg');
          await waitFor.presenceOf(
            imageUploadInput,
            'Image upload input element took too long to load'
          );
          await imageUploadInput.addValue(absPath);
        }
      }
      await action.click('Shape tool', shapeTool);
    }
    var altTextInputElement = $(
      '[placeholder = "Description of Image (Example : George Handel, ' +
        '18th century baroque composer)"]'
    );
    var saveDiagram = modal.$('.e2e-test-save-diagram');
    await action.click('Save diagram button', saveDiagram);
    await waitFor.visibilityOf(
      modal.$('.e2e-test-saved-diagram-container'),
      'Diagram container not visible'
    );
    await action.addValue('Alt text input', altTextInputElement, altText);
  }
};

var expectComponentDetailsToMatch = async function (
  elem,
  selectedAction,
  args,
  altText
) {
  if (selectedAction === 'create') {
    var svgName = args.join('_');
    var svgDiagramInputElement = elem.$('.e2e-test-image');
    await waitFor.visibilityOf(
      svgDiagramInputElement,
      'SVG Diagram input element takes too long to load.'
    );
    var src = await svgDiagramInputElement.getAttribute('src');
    var alt = await svgDiagramInputElement.getAttribute('alt');
    var pre = 'http://localhost:8181';
    var link = pre + src;
    expect(alt).toEqual(altText);
    await request(link, function (error, response, body) {
      expect(body.replace(/(\r\n|\n|\r|\t)/gm, '')).toBe(SVGTAGS[svgName]);
    });
  }
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
