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
 * @fileoverview Utilities for using the Link component during
 * end-to-end testing with Webdriverio.js
 */

var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');

var customizeComponent = async function (modal, url) {
  await objects
    .SanitizedUrlEditor(modal.$('<sanitized-url-editor>'))
    .setValue(url);
};

var expectComponentDetailsToMatch = async function (elem, url) {
  expect(await elem.$('<a>').getAttribute('href')).toBe(url);
  expect(await elem.$('<a>').getAttribute('target')).toBe('_blank');
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
