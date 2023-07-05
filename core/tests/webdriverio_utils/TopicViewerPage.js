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
 * @fileoverview Page object for the topic and story viewer page, for use
 * in WebdriverIO tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var TopicViewerPage = function() {
  var messageOnCompletion = $('.e2e-test-practice-complete-message');
  var practiceTabLink = $('.e2e-test-practice-tab-link');
  var revisionTabLink = $('.e2e-test-revision-tab-link');
  var startPracticeButton = $('.e2e-test-practice-start-button');
  var storySummaryTitleListElement = $('.e2e-test-story-summary-title');
  var storySummaryTitleListSelector = function() {
    return $$('.e2e-test-story-summary-title');
  };
  var topicDescription = $('.e2e-test-topic-description');

  this.get = async function(classroomUrlFragment, topicName) {
    await browser.url(`/learn/${classroomUrlFragment}`);
    await waitFor.pageToFullyLoad();
    var topicLink = $(`.e2e-test-topic-name=${topicName}`);
    await waitFor.presenceOf(
      topicLink, 'Topic ' +
      topicName + ' card is not present on /' + classroomUrlFragment);
    await action.click(topicName, topicLink);
    await waitFor.pageToFullyLoad();
  };

  this.expectTopicInformationToBe = async function(description) {
    await waitFor.visibilityOf(
      topicDescription, 'Topic description takes too long to be visible.');
    var text = await topicDescription.getText();
    expect(text).toEqual(description);
  };

  this.expectStoryCountToBe = async function(count) {
    var storySummaryTitleList = await storySummaryTitleListSelector();
    if (count === 0) {
      expect(storySummaryTitleList.length).toEqual(0);
    } else {
      await waitFor.visibilityOf(
        storySummaryTitleListElement,
        'Story summary tiles take too long to be visible.');
      var storySummaryTitleList = await storySummaryTitleListSelector();
      expect(storySummaryTitleList.length).toEqual(count);
    }
  };

  this.moveToRevisionTab = async function() {
    await action.click('Revision Tab', revisionTabLink);
  };

  this.moveToPracticeTab = async function() {
    await action.click('Practice Tab', practiceTabLink);
  };

  this.selectSkillForPractice = async function(subtopicTitle) {
    var skillCheckbox = $(`.e2e-test-skill-checkbox-title=${subtopicTitle}`);
    await action.click('Select skill to practice', skillCheckbox);
  };

  this.startPractice = async function() {
    await action.click('Start practice', startPracticeButton);
    await waitFor.pageToFullyLoad();
  };

  this.expectMessageAfterCompletion = async function(message) {
    await waitFor.visibilityOf(
      messageOnCompletion, 'Completion message takes too long to be visible.');
    var text = await messageOnCompletion.getText();
    expect(text).toEqual(message);
  };
};

exports.TopicViewerPage = TopicViewerPage;
