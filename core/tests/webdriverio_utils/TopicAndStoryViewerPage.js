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

var action = require('../webdriverio_utils/action.js');
var waitFor = require('./waitFor.js');

var TopicAndStoryViewerPage = function () {
  var lessonTrack = $('.e2e-test-lesson-track');
  var dismissSignUpSectionButton = $(
    '.e2e-test-dismiss-sign-up-section-button'
  );
  var chapterTitleItem = $('.e2e-test-chapter-title');
  var chapterTitleListSelector = function () {
    return $$('.e2e-test-chapter-title');
  };
  var lessonCompletedIconsSelector = function () {
    return $$('.e2e-test-lesson-icon-completed');
  };
  var lessonUncompletedIconsSelector = function () {
    return $$('.e2e-test-lesson-icon-uncompleted');
  };

  this.get = async function (
    classroomUrlFragment,
    topicUrlFragment,
    storyUrlFragment
  ) {
    await browser.url(
      `/learn/${classroomUrlFragment}/${topicUrlFragment}` +
        `/story/${storyUrlFragment}`
    );
    await waitFor.pageToFullyLoad();
  };

  this.goToChapterIndex = async function (index) {
    await waitFor.visibilityOf(
      chapterTitleItem,
      'Chapters take too long to be visible.'
    );
    var chapterTitleList = await chapterTitleListSelector();
    var chapter = chapterTitleList[index];
    await action.click('Chapter title', chapter);
    await waitFor.pageToFullyLoad();
  };

  this.dismissSignUpSection = async function () {
    await action.click(
      "Don't show me again button",
      dismissSignUpSectionButton
    );
  };

  this.expectCompletedLessonCountToBe = async function (count) {
    await waitFor.visibilityOf(
      lessonTrack,
      'Lesson track takes too long to be visible.'
    );
    var lessonCompletedIcons = await lessonCompletedIconsSelector();
    expect(lessonCompletedIcons.length).toEqual(count);
  };

  this.expectUncompletedLessonCountToBe = async function (count) {
    await waitFor.visibilityOf(
      lessonTrack,
      'Lesson track takes too long to be visible.'
    );
    var lessonUncompletedIcons = await lessonUncompletedIconsSelector();
    expect(lessonUncompletedIcons.length).toEqual(count);
  };
};

exports.TopicAndStoryViewerPage = TopicAndStoryViewerPage;
