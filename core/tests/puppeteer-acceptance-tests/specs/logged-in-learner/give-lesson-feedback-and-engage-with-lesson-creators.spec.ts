// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/spreadsheets/d/17Y5yOGuy0y5YFPPCUF5fZAZjEyY60bq6J0lik6yH3KE/
 *
.* LI.7. Give lesson feedback and engage with lesson creators
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {showMessage} from '../../utilities/common/show-message';

const ROLES = testConstants.Roles;

describe('Logged-in User', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let releaseCoordinator: ReleaseCoordinator;
  let curriculumAdmin: ExplorationEditor;
  let expId: string;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );
    await releaseCoordinator.enableFeatureFlag(
      'exploration_editor_new_creator_feedback_tab'
    );
    await releaseCoordinator.enableFeatureFlag('web_feedback_modal_enabled');
    await releaseCoordinator.enableFeatureFlag('new_lesson_player');
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    expId = await curriculumAdmin.createAndPublishExplorationWithCards(
      'What are the Place Values',
      'Algebra',
      2
    );
    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedInLearner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com'
    );
  }, 350000);

  afterAll(async function () {
    await UserFactory.closeBrowserForUser(loggedInLearner);
    await UserFactory.closeSuperAdminBrowser();
  });

  it('should submit open-ended feedback on a lesson and track creator responses on my dashboard.', async function () {
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.playLesson(expId);

    await loggedInLearner.toggleOptionsSidebar();
    await loggedInLearner.clickLessonFeedbackButton(true);
    showMessage('Clicked on "Send Lesson Feedback" button.');
    await loggedInLearner.expectScreenshotToMatch(
      'sendALessonFeedbackModal',
      __dirname
    );
    await loggedInLearner.expectFeedbackModalSubHeaderToBe(
      'Your message and recent lesson path will be shared with the Lessons Team to help improve this lesson.'
    );
    await loggedInLearner.expectLessonFeedbackModalmicrocopyToBe(
      'To protect your safety, do not type names, phone numbers, ' +
        'or email addresses in your note. Responses or updates from ' +
        'authors will appear directly in your Learner Dashboard.'
    );
    await loggedInLearner.expectFeedbackTextareaPlaceholderToBe(
      'Write a note here! What did you like? Do you have an idea to make this lesson better?'
    );

    await loggedInLearner.submitFeedbackInTextArea(
      'This fraction model is awesome, but can we get more marble examples?'
    );
    await loggedInLearner.expectScreenshotToMatch(
      'sendALessonFeedbackModalAfterEnteringFeedback',
      __dirname
    );
    await loggedInLearner.clickButtonInModal(
      'Send Feedback to the Lessons Team',
      'confirm'
    );
    await loggedInLearner.expectScreenshotToMatch(
      'sendALessonFeedbackModalAfterSubmittingFeedback',
      __dirname
    );
    await loggedInLearner.expectToastMessage(
      'Thank you! Your feedback has been sent to the lesson team.'
    );
    await loggedInLearner.toggleOptionsSidebar();
    showMessage('Submitted Lesson feedback.');

    // Navigate to My Suggestions Tab
    await loggedInLearner.navigateToMySuggestionsTab();
  });

  it('should report a bug in a lesson.', async function () {
    await loggedInLearner.toggleOptionsSidebar();
    await loggedInLearner.clickReportLessonButton(true);
    showMessage('Clicked on "Report an Issue" button.');
    await loggedInLearner.expectFeedbackModalSubHeaderToBe(
      'Your feedback goes directly to our lesson creators to help improve this card.'
    );
    await loggedInLearner.expectFeedbackTextareaPlaceholderToBe(
      "What's broken? Let us know if an image is missing, a button isn't working, or the lesson has an error."
    );
    await loggedInLearner.expectLessonSpecificCategoryChipsToBePresent(true);
    await loggedInLearner.expectScreenshotDropZoneTextToBe(
      'Drag an image into this area'
    );
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(true);
    await loggedInLearner.expectScreenshotToMatch(
      'reportALessonModal',
      __dirname
    );

    // Should be able to choose a "typo" or "confusing or incorrect answer" chip, enter feedback, and click the main "Submit" button.
    await loggedInLearner.selectReportIssueChip('typo');
    showMessage('Typo chip selected in report an issue modal.');
    await loggedInLearner.submitFeedbackInTextArea(
      'There is a typo in this question.'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(false);

    await loggedInLearner.expectScreenshotToMatch(
      'reportALessonModalAfterEnteringFeedbackWithTypoChip',
      __dirname
    );
    await loggedInLearner.clickButtonInModal('Report an Issue', 'confirm');
    await loggedInLearner.expectToastMessage(
      'Thank you for your feedback! The team has received your report.'
    );

    await loggedInLearner.clickReportLessonButton(true);
    await loggedInLearner.selectReportIssueChip(
      'confusing or incorrect answer'
    );
    showMessage(
      'Confusing or incorrect answer chip selected in report an issue modal.'
    );
    await loggedInLearner.submitFeedbackInTextArea(
      'There is a confusing or incorrect answer in this question.'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(false);

    await loggedInLearner.expectScreenshotToMatch(
      'reportALessonModalAfterEnteringFeedbackWithConfusingChip',
      __dirname
    );
    await loggedInLearner.clickButtonInModal('Report an Issue', 'confirm');
    await loggedInLearner.expectToastMessage(
      'Thank you for your feedback! The team has received your report.'
    );

    // Should be able to choose a "broken layout / image" or "other" chip, enter feedback, and click the main "Submit" button.
    await loggedInLearner.clickReportLessonButton(true);

    await loggedInLearner.selectReportIssueChip('broken layout');
    await loggedInLearner.submitFeedbackInTextArea(
      'There is a broken layout / image in this question.'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(true);

    await loggedInLearner.expectScreenshotToMatch(
      'reportALessonModalAfterEnteringFeedbackWithBrokenLayoutChip',
      __dirname
    );
    await loggedInLearner.clickButtonInModal('Report an Issue', 'confirm');
    await loggedInLearner.expectToastMessage(
      'Thank you! Your report has been sent to the technical team.'
    );

    await loggedInLearner.clickReportLessonButton(true);

    await loggedInLearner.selectReportIssueChip('other');
    await loggedInLearner.submitFeedbackInTextArea(
      'There is an other issue in this question.'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(true);

    await loggedInLearner.expectScreenshotToMatch(
      'reportALessonModalAfterEnteringFeedbackWithOtherChip',
      __dirname
    );
    await loggedInLearner.clickButtonInModal('Report an Issue', 'confirm');
    await loggedInLearner.expectToastMessage(
      'Thank you! Your report has been sent to the technical team.'
    );
    await loggedInLearner.toggleOptionsSidebar();
  });

  it('should submit feedback on the platform.', async () => {
    await loggedInLearner.navigateToContributorDashboardUsingProfileDropdown();
    await loggedInLearner.clickOnProfileDropdown();
    await loggedInLearner.expectProfileDropdownToContainElementWithContent(
      'Report a Website Issue'
    );
    await loggedInLearner.openReportASiteIssueModal();
    showMessage('Clicked on "Report a Website Issue" button.');
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(true);
    await loggedInLearner.expectScreenshotToMatch(
      'reportASiteIssueModal',
      __dirname
    );
  });
});
