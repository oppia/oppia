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
import {
  FEEDBACK_STATUS_LABELS,
  FeedbackStatus,
} from '../../../../../core/templates/domain/feedback/feedback.model';

const ROLES = testConstants.Roles;
const statusLabels = FEEDBACK_STATUS_LABELS;
const activeModalBackdropSelector = '.modal-backdrop, ngb-modal-window, .modal';

describe('Logged-in User', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationEditor: ExplorationEditor & LoggedInUser;
  let expId: string;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'curriculumAdm',
      'explorationEditor@example.com',
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

    expId = await explorationEditor.createAndPublishExplorationWithCards(
      'What are the Place Values',
      'Algebra',
      2
    );

    loggedInLearner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com'
    );
  }, 350000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
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
    showMessage('Submitted Lesson feedback.');

    // Navigate to My Suggestions Tab.
    await loggedInLearner.navigateToMySuggestionsTab();
    await loggedInLearner.verifyMySuggestionsFeedbackFilterRowContents();
    await loggedInLearner.verifyDefaultMySuggestionsTabFilter();
    await loggedInLearner.verifyMySuggestionsFeedbackList();

    await loggedInLearner.expectMySuggestionsFeedbackEntry({
      description:
        'This fraction model is awesome, but can we get more marble examples?',
      status: FEEDBACK_STATUS_LABELS[FeedbackStatus.SUBMITTED],
      lessonTitle: 'What are the Place Values',
    });

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterSubmittingFeedback',
      __dirname
    );

    await loggedInLearner.clickOnFeedbackListEntryWithDescription(
      'This fraction model is awesome, but can we get more marble examples?'
    );

    // Hide dynamic date/time values before taking the screenshot to
    // prevent them from causing snapshot differences between test runs.
    await loggedInLearner.removeMySuggestionsDynamicElements();

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterClickingFeedbackListEntry',
      __dirname
    );

    await loggedInLearner.verifyMySuggestionsFeedbackDetailView(false);
    await loggedInLearner.expectMySuggestionsFeedbackDetail(
      statusLabels[FeedbackStatus.SUBMITTED],
      'This fraction model is awesome, but can we get more marble examples?',
      'You sent this while going through  this lesson , around the "Introduction" part of the lesson.'
    );

    // Click on the highlighted "this lesson" part of the text.
    await loggedInLearner.clickOnMySuggestionsFeedbackLessonContextLink(expId);

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterClickingFeedbackLessonContextLink',
      __dirname
    );

    await loggedInLearner.navigateToMySuggestionsTab();
    await loggedInLearner.clickOnFeedbackListEntryWithDescription(
      'This fraction model is awesome, but can we get more marble examples?'
    );
    await loggedInLearner.verifyMySuggestionsFeedbackDetailView(false);

    await loggedInLearner.goBackToMySuggestionsTabList();

    // The Lessons Team views their submission panel, reads the feedback, and marks it as Not Actionable.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.openExplorationInExplorationEditor(
      'What are the Place Values'
    );
    await explorationEditor.navigateToFeedbackTab();

    await explorationEditor.expectScreenshotToMatch(
      'explorationEditorFeedbackTab',
      __dirname
    );

    await explorationEditor.clickOnFeedbackListEntryWithDescription(
      'This fraction model is awesome, but can we get more marble examples?'
    );

    await explorationEditor.expectScreenshotToMatch(
      'explorationEditorFeedbackTabAfterClickingFeedbackListEntry',
      __dirname
    );

    await explorationEditor.selectStatusOnFeedbackTab(
      statusLabels[FeedbackStatus.NOT_ACTIONABLE]
    );
    await explorationEditor.expectScreenshotToMatch(
      'explorationEditorFeedbackTabAfterSelectingNotActionable',
      __dirname
    );

    // Log back as Learner and navigate back to My Suggestions Tab.
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectMySuggestionsTabTotalNotification(false);
    await loggedInLearner.navigateToMySuggestionsTab();
    await loggedInLearner.verifyMySuggestionsFeedbackFilterRowContents();
    await loggedInLearner.verifyDefaultMySuggestionsTabFilter();
    await loggedInLearner.verifyMySuggestionsFeedbackList();

    await loggedInLearner.expectMySuggestionsFeedbackEntry({
      description:
        'This fraction model is awesome, but can we get more marble examples?',
      status: statusLabels[FeedbackStatus.REVIEWED_BY_TEAM],
      lessonTitle: 'What are the Place Values',
    });

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterExplorationEditorNotActionable',
      __dirname
    );

    // Submit another Lesson feedback and lesson creators reads it and marks it as Fixed.
    await loggedInLearner.playLesson(expId);
    await loggedInLearner.toggleOptionsSidebar();
    await loggedInLearner.clickLessonFeedbackButton(true);
    await loggedInLearner.submitFeedbackInTextArea(
      'This Lesson seems too short, can we make it longer?'
    );
    await loggedInLearner.clickButtonInModal(
      'Send Feedback to the Lessons Team',
      'confirm'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.openExplorationInExplorationEditor(
      'What are the Place Values'
    );
    await explorationEditor.navigateToFeedbackTab();
    await explorationEditor.clickOnFeedbackListEntryWithDescription(
      'This Lesson seems too short, can we make it longer?'
    );
    await explorationEditor.selectStatusOnFeedbackTab(
      statusLabels[FeedbackStatus.FIXED]
    );

    // As Learner navigate back to My Suggestions Tab.
    await loggedInLearner.navigateToLearnerDashboard();
    await loggedInLearner.expectMySuggestionsTabTotalNotification(true, '1');
    await loggedInLearner.navigateToMySuggestionsTab();
    await loggedInLearner.verifyMySuggestionsFeedbackFilterRowContents();
    await loggedInLearner.verifyDefaultMySuggestionsTabFilter();
    await loggedInLearner.verifyMySuggestionsFeedbackList();

    await loggedInLearner.expectMySuggestionsFeedbackEntry({
      description: 'This Lesson seems too short, can we make it longer?',
      status: statusLabels[FeedbackStatus.LESSON_UPDATED],
      lessonTitle: 'What are the Place Values',
      notificationNo: '1',
      notificationText:
        'A creator fixed an error you reported. Thank you for helping make Oppia better for everyone!',
    });

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterExplorationEditorFixed',
      __dirname
    );

    await loggedInLearner.clickOnFeedbackListEntryWithDescription(
      'This Lesson seems too short, can we make it longer?'
    );
    await loggedInLearner.expectMySuggestionsTabTotalNotification(false);
    await loggedInLearner.verifyMySuggestionsFeedbackDetailView(true);
    await loggedInLearner.expectMySuggestionsFeedbackDetail(
      'Lesson Updated!',
      'This Lesson seems too short, can we make it longer?',
      'You sent this while going through  this lesson , around the "Introduction" part of the lesson.'
    );

    await loggedInLearner.expectToolTipTextToBe(
      '.e2e-test-my-suggestions-details-status-value',
      'A creator fixed this error! Thank you for helping make Oppia better for everyone.'
    );

    // Add a follow up note.
    await loggedInLearner.clickOnAddAFollowUpNote();

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterClickingAddAFollowUpNoteModal',
      __dirname
    );

    await loggedInLearner.expectFeedbackModalSubHeaderToBe(
      "A creator marked this as fixed. Let them know if it's resolved, or add anything else you'd like them to know."
    );
    await loggedInLearner.expectFeedbackTextareaPlaceholderToBe(
      "E.g. Thanks, that fixed it! or it's still happening on question 3."
    );

    await loggedInLearner.submitFeedbackInTextArea(
      'This Question answer is still wrong, please recheck, Thanks.'
    );
    await loggedInLearner.clickButtonInModal('Add a follow-up note', 'confirm');
    // The underlying my suggestions page returns to full opacity immediately,
    // bringing the student back to where they left off.
    await loggedInLearner.expectElementToBeVisible(
      activeModalBackdropSelector,
      false
    );
    await loggedInLearner.expectToastMessage(
      'Your follow up note has been sent successfully'
    );

    await loggedInLearner.goBackToMySuggestionsTabList();
    await loggedInLearner.expectMySuggestionsFeedbackEntry({
      description:
        'This Question answer is still wrong, please recheck, Thanks.',
      status: statusLabels[FeedbackStatus.SUBMITTED],
      lessonTitle: 'What are the Place Values',
    });

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterAddingFollowUpNoteEntry',
      __dirname
    );

    await loggedInLearner.clickOnFeedbackListEntryWithDescription(
      'This Question answer is still wrong, please recheck, Thanks.'
    );

    await loggedInLearner.verifyMySuggestionsFeedbackDetailView(false);
    await loggedInLearner.expectMySuggestionsFeedbackDetail(
      statusLabels[FeedbackStatus.SUBMITTED],
      'This Question answer is still wrong, please recheck, Thanks.',
      'You sent this while going through  this lesson , around the "Introduction" part of the lesson.'
    );

    await loggedInLearner.expectScreenshotToMatch(
      'mySuggestionsTabAfterClickingFollowUpNoteEntryDetailView',
      __dirname
    );
    await explorationEditor.closeBrowser();
  });

  it('should report a bug in a lesson.', async function () {
    await loggedInLearner.playLesson(expId);
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
