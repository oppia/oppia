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
 * L0.15. Submit anonymous feedback or a report a lesson issue
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants, {FILEPATHS} from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {showMessage} from '../../utilities/common/show-message';

const ROLES = testConstants.Roles;
const formErrorSelector = '.e2e-test-form-error';
const activeModalBackdropSelector = '.modal-backdrop, ngb-modal-window, .modal';

describe('Logged-Out User', function () {
  let loggedOutLearner: LoggedOutUser;
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
    await releaseCoordinator.enableFeatureFlag('web_feedback_modal_enabled');
    await releaseCoordinator.enableFeatureFlag('new_lesson_player');
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    expId = await curriculumAdmin.createAndPublishExplorationWithCards(
      'What are the Place Values',
      'Algebra',
      2
    );
    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedOutLearner = await UserFactory.createLoggedOutUser();
  }, 350000);

  it('should submit anonymous feedback or report a lesson issue.', async () => {
    // Navigating to a lesson page and clicking on the "Report an Issue" flag icon in the options sidebar.
    await loggedOutLearner.playLesson(expId);
    await loggedOutLearner.toggleOptionsSidebar();
    await loggedOutLearner.clickReportLessonButton(false);
    showMessage('Clicked on "Report an Issue" button.');

    await loggedOutLearner.expectFeedbackModalSubHeaderToBe(
      'Your feedback goes directly to our lesson creators to help improve this card.'
    );
    await loggedOutLearner.expectFeedbackTextareaPlaceholderToBe(
      "What's broken? Let us know if an image is missing, a button isn't working, or the lesson has an error."
    );
    await loggedOutLearner.expectLessonSpecificCategoryChipsToBePresent(true);
    await loggedOutLearner.expectScreenshotDropZoneTextToBe(
      'Drag an image into this area'
    );
    await loggedOutLearner.expectIncludeTechnicalLogToBePresent(true);

    await loggedOutLearner.selectReportIssueChip('broken layout');
    await loggedOutLearner.expectIncludeTechnicalLogToBePresent(true);
    await loggedOutLearner.selectReportIssueChip('typo');
    await loggedOutLearner.expectIncludeTechnicalLogToBePresent(false);

    await loggedOutLearner.selectReportIssueChip(
      'confusing or incorrect answer'
    );
    await loggedOutLearner.expectReportIssueChipToBeSelected(
      'confusing or incorrect answer',
      true
    );
    await loggedOutLearner.selectReportIssueChip('other');
    await loggedOutLearner.expectReportIssueChipToBeSelected(
      'confusing or incorrect answer',
      false
    );
    // In the screenshot, only one chip is selected.
    await loggedOutLearner.expectScreenshotToMatch(
      'reportALessonModal',
      __dirname
    );

    // Should not be able to submit "Report an Issue" feedback while the text area description is completely blank.
    await loggedOutLearner.scrollToCaptchaContainer();
    await loggedOutLearner.clickButtonInModal(
      'Report an Issue',
      'confirm',
      false
    );
    await loggedOutLearner.expectTextContentInElementWithSelectorToBe(
      formErrorSelector,
      'Please add a description before submitting.'
    );

    // Should not be able to submit "Report an Issue" feedback while the text area description is longer than 2500 characters.
    const longDescription = 'a'.repeat(2650);
    await loggedOutLearner.submitFeedbackInTextArea(longDescription);
    await loggedOutLearner.scrollToCaptchaContainer();
    await loggedOutLearner.clickButtonInModal(
      'Report an Issue',
      'confirm',
      false
    );
    await loggedOutLearner.expectTextContentInElementWithSelectorToBe(
      formErrorSelector,
      'Your description is a bit too long (2650/2500 characters). Please shorten it slightly so our team can review it quickly!'
    );
    await loggedOutLearner.clearFeedbackTextArea();

    await loggedOutLearner.submitFeedbackInTextArea(
      'The fraction circle on this card clips out of the layout on my device.'
    );

    // Should not be able to add a screenshot of size greater than 1MB and invalid file types.
    await loggedOutLearner.addFeedbackScreenshot(FILEPATHS.BANNER_HIGH_RES);
    await loggedOutLearner.expectPhotoUploadErrorMessageToBe(
      'The maximum allowed file size is 1024 KB (2.1 MB given)'
    );

    // Add an invalid file type.
    await loggedOutLearner.addFeedbackScreenshot(FILEPATHS.SAMPLE_TEST_PDF);
    await loggedOutLearner.expectPhotoUploadErrorMessageToBe(
      'This file is not recognized as an image'
    );

    // Should clear the screenshoterror by dropping a valid screenshot image into the box.
    await loggedOutLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedOutLearner.expectFeedbackScreenshotPreviewToBePresent(true);

    await loggedOutLearner.scrollToCaptchaContainer();
    await loggedOutLearner.waitForTurnstileTokenIfPresent();
    // In the screenshot, it is seen that all error messages are cleared.
    await loggedOutLearner.expectScreenshotToMatch(
      'reportAnIssueModalAfterDroppingValidScreenshot',
      __dirname
    );
    await loggedOutLearner.clickButtonInModal(
      'Report an Issue',
      'cancel',
      true
    );
    await loggedOutLearner.expectScreenshotToMatch(
      'reportAnIssueModalAfterClickingCancelButton',
      __dirname
    );

    await loggedOutLearner.clickReportLessonButton(false);
    await loggedOutLearner.submitFeedbackInTextArea(
      'This fraction explanation makes so much sense, thank you!'
    );
    await loggedOutLearner.waitForTurnstileTokenIfPresent();

    await loggedOutLearner.expectScreenshotToMatch(
      'reportALessonModalAfterEnteringFeedback',
      __dirname
    );
    await loggedOutLearner.clickButtonInModal('Report an Issue', 'confirm');
    // The underlying lesson player returns to full opacity immediately,
    // bringing the student back to where they left off.
    await loggedOutLearner.expectElementToBeVisible(
      activeModalBackdropSelector,
      false
    );
    // The toast notification has a small, manual "X" dismiss button, and
    // auto-fades after 7 seconds if left untouched.
    await loggedOutLearner.expectToastMessageWithDismissButtonToAutoDismiss(
      'Thank you! Your report has been sent to the technical team.',
      7000
    );

    // Lesson Feedback journey.
    await loggedOutLearner.clickLessonFeedbackButton(false);
    showMessage('Clicked on "Send Lesson Feedback" button.');
    await loggedOutLearner.expectFeedbackModalSubHeaderToBe(
      'Create a free profile to send direct recommendations, track creator responses and save your checkpoint milestones permanently!'
    );
    await loggedOutLearner.expectScreenshotToMatch(
      'sendALessonFeedbackModal',
      __dirname
    );

    await loggedOutLearner.clickButtonInModal(
      'Want to chat with our Lessons Team?',
      'cancel'
    );
    showMessage('Clicked on "Continue as Guest" button.');

    await loggedOutLearner.expectScreenshotToMatch(
      'sendALessonFeedbackModalAfterClickingContinueAsGuest',
      __dirname
    );

    await loggedOutLearner.clickLessonFeedbackButton(false);
    showMessage('Clicked on "Send Lesson Feedback" button.');
    await loggedOutLearner.clickButtonInModal(
      'Want to chat with our Lessons Team?',
      'confirm'
    );
    showMessage('Clicked on "Sign Up or Login" button.');

    await loggedOutLearner.expectToBeOnLoginPage();
    showMessage('On login page.');
    await loggedOutLearner.expectScreenshotToMatch(
      'sendALessonFeedbackModalAfterClickingSignUpOrLogin',
      __dirname
    );

    await loggedOutLearner.goThoroughSignUpProcess(
      'learner@example.com',
      'learner'
    );
    await loggedOutLearner.playLesson(expId);
    await loggedOutLearner.toggleOptionsSidebar();
    await loggedOutLearner.clickLessonFeedbackButton(true);
    await loggedOutLearner.submitFeedbackInTextArea(
      'This fraction model is awesome, but can we get more marble examples?'
    );
    await loggedOutLearner.clickButtonInModal(
      'Send Feedback to the Lessons Team',
      'confirm'
    );
    showMessage('Clicked on "Submit" button.');
    await loggedOutLearner.expectToastMessage(
      'Thank you! Your feedback has been sent to the lesson team.'
    );
    await loggedOutLearner.expectScreenshotToMatch(
      'sendALessonFeedbackModalAfterSubmittingFeedback',
      __dirname
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
