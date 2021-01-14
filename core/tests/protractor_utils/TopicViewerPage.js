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

const { by } = require('protractor');
var waitFor = require('./waitFor.js');

var TopicViewerPage = function() {
  var topicDescription = element(by.css('.protractor-topic-description'));
  var storySummaryTitleList = element.all(by.css('.protractor-story-summary-title'));
  
  this.get = async function(classroomUrlFragment, topicUrlFragment) {
    await browser.get(`/learn/${classroomUrlFragment}/${topicUrlFragment}`);
    await waitFor.pageToFullyLoad();
  }

  this.expectedTopicInformationToBe = async function(description){
    var text = await topicDescription.getText();
    expect(text).toEqual(description);
  };

  this.expectedStoryCountToBe = async function(count){
    await expect(await storySummaryTitleList.count()).toEqual(count);
  }
};

exports.TopicViewerPage = TopicViewerPage;
