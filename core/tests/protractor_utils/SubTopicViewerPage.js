// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the topic and story viewer page, for use
 * in Protractor tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var SubTopicViewerPage = function() {
  var subTopicTileList = element.all(by.css('.protractor-test-subtopic-tile'));

  this.get = async function() {
    var revisionTabLink = element(by.css('.protractor-test-revision-tab-link'));
    await action.click('Revision Tab', revisionTabLink);
    await waitFor.pageToFullyLoad();
  };

  this.expectedRevisionCardCountToBe = async function(count) {
    if (count === 0) {
      expect(await subTopicTileList.count()).toEqual(0);
    } else {
      await waitFor.visibilityOf(
        subTopicTileList.first(),
        'Revisions cards take too long to be visible.');
      expect(await subTopicTileList.count()).toEqual(count);
    }
  };
};

exports.SubTopicViewerPage = SubTopicViewerPage;
