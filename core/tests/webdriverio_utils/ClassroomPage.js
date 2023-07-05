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
 * @fileoverview Page object for the classroom page, for use
 * in Webdriverio tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var ClassroomPage = function() {
  var topicSummaryTile = $('.e2e-test-topic-summary-tile');
  var launchDiagnosticTestPageButton = $('.e2e-test-take-diagnostic-test');

  this.get = async function(classroomName) {
    await browser.url('/learn/' + classroomName);
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfTopicsToBe = async function(expectedCount) {
    if (expectedCount > 0) {
      await waitFor.visibilityOf(
        topicSummaryTile, 'Topic summary tile is not visible');
      let actualCount = await $$('.e2e-test-topic-summary-tile').length;
      expect(actualCount).toEqual(expectedCount);
    } else {
      let actualCount = await $$('.e2e-test-topic-summary-tile').length;
      expect(actualCount).toEqual(0);
    }
  };

  this.launchDiagnosticTestPage = async function() {
    await action.click(
      'Launch diagnostic test page button', launchDiagnosticTestPageButton);
  };
};

exports.ClassroomPage = ClassroomPage;
