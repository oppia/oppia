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
 * @fileoverview Page object for the classroom page, for use
 * in Protractor tests.
 */

var waitFor = require('./waitFor.js');

var ClassroomPage = function() {
  var topicSummaryTiles = element.all(
    by.css('.e2e-test-topic-summary-tile'));

  this.get = async function(classroomName) {
    await browser.get('/learn/' + classroomName);
    await waitFor.pageToFullyLoad();
  };

  this.expectNumberOfTopicsToBe = async function(count) {
    if (count > 0) {
      await waitFor.visibilityOf(
        topicSummaryTiles.first(), 'Topic summary tile is not visible');
      expect(await topicSummaryTiles.count()).toEqual(count);
    } else {
      expect(await topicSummaryTiles.count()).toEqual(0);
    }
  };
};

exports.ClassroomPage = ClassroomPage;
