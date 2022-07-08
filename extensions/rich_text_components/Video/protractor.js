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
 * @fileoverview Utilities for using the Video component during
 * end-to-end testing with Protractor.js
 */

var objects = require(process.cwd() + '/extensions/objects/protractor.js');

var customizeComponent = async function(
    modal, youtubeId, startTime, endTime, ifAutoplay) {
  await objects.UnicodeStringEditor(
    modal.element(by.tagName('schema-based-unicode-editor'))
  ).setValue(youtubeId);
  await objects.IntEditor(
    modal.all(by.tagName('schema-based-int-editor')).first()
  ).setValue(startTime);
  await objects.IntEditor(
    modal.all(by.tagName('schema-based-int-editor')).last()
  ).setValue(endTime);
  await objects.BooleanEditor(
    modal.element(by.tagName('schema-based-bool-editor'))
  ).setValue(ifAutoplay);
};

var expectComponentDetailsToMatch = async function(
    elem, youtubeId, startTime, endTime, ifAutoplay) {
  var youtubePlayer = await elem.element(
    by.css('.e2e-test-youtube-player'));
  var videoInfo = await elem.element(by.tagName('iframe')).getAttribute('src');
  expect(videoInfo).toMatch(youtubeId);
  const startSeconds = await youtubePlayer.getAttribute(
    'ng-reflect-start-seconds');
  const endSeconds = await youtubePlayer.getAttribute('ng-reflect-end-seconds');
  expect(startTime).toBe(+startSeconds);
  expect(endTime).toBe(+endSeconds);
  expect(videoInfo).toMatch('autoplay=' + (ifAutoplay ? 1 : 0));
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
