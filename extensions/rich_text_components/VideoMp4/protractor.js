// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for using the HTML5 Video component during
 * end-to-end testing with Protractor.js
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var objects = require('../../objects/protractor.js');

var customizeComponent = function(modal, videoUrl) {
  objects.UnicodeStringEditor(
    modal.element(by.tagName('schema-based-unicode-editor'))
  ).setValue(videoUrl);
};

var expectComponentDetailsToMatch = function(elem, expectedVideoUrl) {
  var videoUrl = elem.element(by.tagName('video')).element(
    by.tagName('source')).getAttribute('src');
  expect(videoUrl).toMatch(expectedVideoUrl);
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
