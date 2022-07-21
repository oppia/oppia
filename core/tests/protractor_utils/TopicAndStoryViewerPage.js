// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

var action = require('../protractor_utils/action.js');
var waitFor = require('./waitFor.js');

var TopicAndStoryViewerPage = function() {
  var chapterTitleList = element.all(by.css('.e2e-test-chapter-title'));
  var lessonCompletedIcons = element.all(
    by.css('.e2e-test-lesson-icon-completed'));
  var lessonUncompletedIcons = element.all(
    by.css('.e2e-test-lesson-icon-uncompleted'));
  var lessonTrack = element(by.css('.e2e-test-lesson-track'));
  var nextChapterButton = element(
    by.css('.e2e-test-recommended-next-chapter-button'));
  var startPracticeButton = element(
    by.css('.e2e-test-start-practice-from-recommendations-button'));
  var endChapterSignUpSection = element(
    by.css('.e2e-test-end-chapter-sign-up-section'));
  var conversationSkinCardsContainer = element(
    by.css('.e2e-test-conversation-skin-cards-container'));
  var dismissSignUpSectionButton = element(
    by.css('.e2e-test-dismiss-sign-up-section-button'));
  var practicetabContainer = element(
    by.css('.e2e-test-practice-tab-container'));
  var practiceSessionContainer = element(
    by.css('.e2e-test-practice-session-container'));

  this.get = async function(
      classroomUrlFragment, topicUrlFragment, storyUrlFragment) {
    await browser.get(
      `/learn/${classroomUrlFragment}/${topicUrlFragment}` +
      `/story/${storyUrlFragment}`);
    await waitFor.pageToFullyLoad();
  };

  this.goToChapterIndex = async function(index) {
    var chapter = chapterTitleList.get(index);
    await action.click('Chapter title', chapter);
    await waitFor.pageToFullyLoad();
  };

  this.goToNextChapterFromRecommendations = async function() {
    await action.click('Next chapter button', nextChapterButton);
    await waitFor.pageToFullyLoad();
  };

  this.goToPracticeSessionFromRecommendations = async function() {
    await action.click('Start practice button', startPracticeButton);
    await waitFor.pageToFullyLoad();
  };

  this.dismissSignUpSection = async function() {
    await action.click(
      'Don\'t show me again button', dismissSignUpSectionButton);
  };

  this.expectCompletedLessonCountToBe = async function(count) {
    await waitFor.visibilityOf(
      lessonTrack, 'Lesson track takes too long to be visible.');
    expect(await lessonCompletedIcons.count()).toEqual(count);
  };

  this.expectUncompletedLessonCountToBe = async function(count) {
    await waitFor.visibilityOf(
      lessonTrack, 'Lesson track takes too long to be visible.');
    expect(await lessonUncompletedIcons.count()).toEqual(count);
  };

  this.waitForConversationSkinCardsContainer = async function() {
    await waitFor.visibilityOf(
      conversationSkinCardsContainer,
      'Conversation skin cards container takes too long to be visible.');
  };

  this.waitForSignUpSection = async function() {
    await waitFor.visibilityOf(
      endChapterSignUpSection, 'Sign up section takes too long to be visible.');
  };

  this.waitForSignUpSectionToDisappear = async function() {
    await waitFor.invisibilityOf(
      endChapterSignUpSection,
      'Sign up section takes too long to disappear.');
  };

  this.waitForPracticeTabContainer = async function() {
    await waitFor.visibilityOf(
      practicetabContainer,
      'Practice tab container takes too long to be visible.');
  };

  this.waitForPracticeSessionContainer = async function() {
    await waitFor.presenceOf(practiceSessionContainer);
  };
};

exports.TopicAndStoryViewerPage = TopicAndStoryViewerPage;
