// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the feedback updates , for use in WebdriverIO
 * tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var FeedbackUpdatesPage = function() {
  var FEEDBACK_UPDATES_URL = '/feedback-updates';
  var communityLessonsSection = $('.e2e-test-community-lessons-section');
  var feedbackMessage = $('.e2e-test-feedback-message');
  var feedbackSection = $('.e2e-test-feedback-section');
  var feedbackThread = $('.e2e-test-feedback-thread');

  var feedbackExplorationTitleElement = $('.e2e-test-feedback-exploration');
  var feedbackExplorationTitleSelector = function() {
    return $$('.e2e-test-feedback-exploration');
  };

  this.get = async function() {
    await browser.url(FEEDBACK_UPDATES_URL);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToCommunityLessonsSection = async function() {
    await waitFor.visibilityOf(
      communityLessonsSection,
      'Commmunity lesson section takes too long to appear'
    );
    await action.click('Community Lessons Section', communityLessonsSection);
  };

  this.navigateToFeedbackSection = async function() {
    await action.click('Feedback Section', feedbackSection);
  };

  this.navigateToFeedbackThread = async function() {
    await action.click('Feedback Thread', feedbackThread);
  };

  this.expectFeedbackExplorationTitleToMatch = async function(title) {
    await waitFor.visibilityOf(
      feedbackExplorationTitleElement,
      'Feedback Exploration Title takes too long to appear');
    var feedbackExplorationTitle = await feedbackExplorationTitleSelector();
    expect(await feedbackExplorationTitle[0].getText()).toMatch(title);
  };

  this.expectFeedbackMessageToMatch = async function(message) {
    await waitFor.visibilityOf(
      feedbackMessage, 'Feedback Message takes too long to appear');
    expect(await feedbackMessage.getText()).toMatch(message);
  };
};

exports.FeedbackUpdatesPage = FeedbackUpdatesPage;
