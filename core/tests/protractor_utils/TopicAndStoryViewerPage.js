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
  var chapterTitleList = element.all(by.css('.protractor-chapter-title'));
  var lessonCompletedIcons = element.all(
    by.css('.protractor-test-lesson-icon-completed'));
  var lessonUncompletedIcons = element.all(
    by.css('.protractor-test-lesson-icon-uncompleted'));
  var lessonTrack = element(by.css('.protractor-test-lesson-track'));

  this.get = async function(
      classroomUrlFragment, topicUrlFragment, storyUrlFragment) {
    await browser.get(
      `/learn/${classroomUrlFragment}/${topicUrlFragment}` +
      `/story/${storyUrlFragment}`);
    await waitFor.pageToFullyLoad();
  };

  this.goToChapterIndex = async function(index) {
    var chapter = await chapterTitleList.get(index);
    await action.click('Chapter title', chapter);
    await waitFor.pageToFullyLoad();
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
};

exports.TopicAndStoryViewerPage = TopicAndStoryViewerPage;
