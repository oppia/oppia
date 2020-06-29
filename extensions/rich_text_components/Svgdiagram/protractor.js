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

var customizeComponent = async function(modal, filepath, name) {
  await modal.element(by.css('.protractor-test-create-rectangle')).click();
  await modal.element(by.css('.protractor-test-save-diagram')).click();
  await waitFor.visibilityOf(
    modal.element(by.css('.protractor-test-saved-diagram-container')),
    'Diagram container not visible');
};

var expectComponentDetailsToMatch = async function(elem) {
  var svgTag = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="494" height="367" viewBox="0 0 494 367"><desc>Created with Fabric.js 3.6.3</desc><defs></defs><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0)"/><g transform="matrix(1 0 0 1 44.5 49.5)"><rect style="stroke: rgb(0,0,0); stroke-width: 9; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-opacity: 0; fill-rule: nonzero; opacity: 1; vector-effect: non-scaling-stroke" x="-30" y="-35" rx="0" ry="0" width="60" height="70"/></g></svg>';
  await elem.element(by.css('.protractor-test-svg-diagram')).getAttribute('src').then(function(src) {
    request(src, function(error, response, body) {
      expect(body.replace(/(\r\n|\n|\r)/gm, '')).toBe(svgTag);
    })
  })
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
