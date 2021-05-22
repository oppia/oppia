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

var TopicViewerPage = function() {
  var topicDescription = element(by.css('.protractor-test-topic-description'));
  var storySummaryTitleList =
    element.all(by.css('.protractor-test-story-summary-title'));
  var startPracticeButton =
    element(by.css('.protractor-test-practice-start-button'));

  this.get = async function(classroomUrlFragment, topicName) {
    await browser.get(`/learn/${classroomUrlFragment}`);
    await waitFor.pageToFullyLoad();
    var topicLink = element(by.cssContainingText(
      '.protractor-test-topic-link', topicName));
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
    if (count === 0) {
      expect(await storySummaryTitleList.count()).toEqual(0);
    } else {
      await waitFor.visibilityOf(
        storySummaryTitleList.first(),
        'Story summary tiles take too long to be visible.');
      expect(await storySummaryTitleList.count()).toEqual(count);
    }
  };

  this.moveToRevisionTab = async function() {
    var revisionTabLink = element(by.css('.protractor-test-revision-tab-link'));
    await action.click('Revision Tab', revisionTabLink);
  };

  this.moveToPracticeTab = async function() {
    var practiceTabLink = element(by.css('.protractor-test-practice-tab-link'));
    await action.click('Practice Tab', practiceTabLink);
  };

  this.selectSkillForPractice = async function(subtopicTitle) {
    var skillCheckbox = element(by.cssContainingText(
      '.protractor-test-skill-checkbox', subtopicTitle));
    await action.click('Select skill to practice', skillCheckbox);
  };

  this.startPractice = async function() {
    await action.click('Start practice', startPracticeButton);
    await waitFor.pageToFullyLoad();
  };

  this.expectMessageAfterCompletion = async function(message) {
    var messageOnCompletion = element(
      by.css('.protractor-test-practice-complete-message'));
    await waitFor.visibilityOf(
      messageOnCompletion, 'Completion message takes too long to be visible.');
    var text = await messageOnCompletion.getText();
    expect(text).toEqual(message);
  };
};

exports.TopicViewerPage = TopicViewerPage;
