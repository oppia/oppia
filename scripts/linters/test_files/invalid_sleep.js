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
 * @fileoverview Invalid syntax .ts file, used by scripts/linters/
 * js_ts_linter_test.py. This file using browser.sleep() which is not allowed.
 */

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var ClassroomPage = function() {
  var PAGE_URL_PREFIX = '/classroom/';
  var topicSummaryTiles = element.all(
    by.css('.protractor-test-topic-summary-tile'));

  this.get = function(classroomName) {
    browser.get(PAGE_URL_PREFIX + classroomName);
    browser.sleep(100); // Sleep is not allowed to use.
    waitFor.pageToFullyLoad();
  };

  this.expectNumberOfTopicsToBe = function(count) {
    topicSummaryTiles.then(function(topics) {
      expect(topics.length).toEqual(count);
    });
  };
};
