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
 * @fileoverview Utilities for using the Skillreview component during
 * end-to-end testing with Protractor.js
 */

var objects = require('../../objects/protractor.js');

var customizeComponent = function(modal, index) {
  objects.SkillSelector(
    modal.element(by.tagName('skill-selector-editor'))
  ).setValue(index);
};

var expectComponentDetailsToMatch = function(elem, description) {
  expect(elem.element(by.tagName('a'))).toBe('description');
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
