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
 * https://docs.google.com/spreadsheets/d/17Y5yOGuy0y5YFPPCUF5fZAZjEyY60bq6J0lik6yH3KE
 *
.* LC.6. view-and-answer-feedback-and-reports-of-the-lesson.
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
} from '../../../../templates/domain/feedback/feedback.model';

const ROLES = testConstants.Roles;
const statusLabels = FEEDBACK_STATUS_LABELS;

describe('Logged-in User', function () {
  let loggedInLearner: LoggedInUser & LoggedOutUser;
  let releaseCoordinator: ReleaseCoordinator;
  let lessonCreator: ExplorationEditor & LoggedInUser;
  let expId: string;

  beforeAll(async function () {
    lessonCreator = await UserFactory.createNewUser(
      'LessonCreator',
      'lessoncreator@example.com'
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

    await lessonCreator.navigateToCreatorDashboardPage();
    await lessonCreator.navigateToExplorationEditorFromCreatorDashboard();
    await lessonCreator.dismissWelcomeModal();
    await lessonCreator.updateCardContent('Introduction to Fractions');
    await lessonCreator.addInteraction('Number Input');
    await lessonCreator.addResponsesToTheInteraction(
      'Number Input',
      '-1',
      'Perfect!',
      'Last Card',
      true
    );
    await lessonCreator.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );
    await lessonCreator.addHintToState(
      'Remember that negative numbers are less than 0.'
    );
    await lessonCreator.addSolutionToState(
      '-99',
      'The number -99 is a negative number.',
      true
    );
    await lessonCreator.saveExplorationDraft();

    // Navigate to the new card and add Study Guide content.
    await lessonCreator.navigateToCard('Last Card');
    await lessonCreator.updateCardContent(
      'Congratulations! You have completed the exploration.'
    );
    await lessonCreator.addInteraction('End Exploration');

    // Save the draft.
    await lessonCreator.saveExplorationDraft();

    expId = await lessonCreator.publishExplorationWithMetadata(
      'What are the Place Values',
      'Learn the basics of place values',
      'Algebra'
    );

    loggedInLearner = await UserFactory.createNewUser(
      'learner',
      'learner@example.com'
    );

    await loggedInLearner.playLesson(expId);
    await loggedInLearner.submitAnswer('1');
    await loggedInLearner.toggleOptionsSidebar();

    await loggedInLearner.clickLessonFeedbackButton(true);
    await loggedInLearner.submitFeedbackInTextArea('Question 2 is confusing.');
    await loggedInLearner.clickButtonInModal(
      'Send Feedback to the Lessons Team',
      'confirm'
    );

    await loggedInLearner.clickLessonFeedbackButton(true);
    await loggedInLearner.submitFeedbackInTextArea(
      'This card does not accept my answer.'
    );
    await loggedInLearner.clickButtonInModal(
      'Send Feedback to the Lessons Team',
      'confirm'
    );

    await loggedInLearner.clickReportLessonButton(true);
    await loggedInLearner.selectReportIssueChip('typo');
    await loggedInLearner.submitFeedbackInTextArea(
      'There is a typo in the question text.'
    );
    await loggedInLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    await loggedInLearner.expectIncludeTechnicalLogToBePresent(false);
    await loggedInLearner.clickButtonInModal('Report an Issue', 'confirm');
    showMessage(
      'Learner has submitted  2 feedback and  1 report for the lesson.'
    );
  }, 350000);

  it('should see the new Exploration Feedback tab and its default list', async function () {
    await lessonCreator.navigateToCreatorDashboardPage();
    await lessonCreator.openExplorationInExplorationEditor(
      'What are the Place Values'
    );
    await lessonCreator.navigateToFeedbackTab();
    await lessonCreator.expectNewExplorationFeedbackTab();
    await lessonCreator.verifyNewExplorationEditorFeedbacktabFilterRowContents();
    await lessonCreator.verifyDefaultNewExplorationFeedbackTabFilter();
    await lessonCreator.verifyNewExplorationEditorFeedbackList('feedback');

    await lessonCreator.expectFeedbackTableEntry({
      description: 'This card does not accept my answer.',
      status: statusLabels[FeedbackStatus.OPEN],
      lessonTitle: 'What are the Place Values',
    });
    await lessonCreator.expectFeedbackTableEntry({
      description: 'Question 2 is confusing.',
      status: statusLabels[FeedbackStatus.OPEN],
      lessonTitle: 'What are the Place Values',
    });

    await lessonCreator.expectScreenshotToMatch(
      'newExplorationEditorFeedbackTab',
      __dirname
    );
  });

  it('should view content of feedback and report entries', async function () {
    await lessonCreator.clickOnFeedbackListEntryWithDescription(
      'Question 2 is confusing.'
    );
    await lessonCreator.expectScreenshotToMatch(
      'explorationFeedbackDetailView',
      __dirname
    );

    await lessonCreator.verifyExplorationFeedbackDetailView('feedback', 'Open');
    await lessonCreator.verifyFeedbackDetailPageDetailsSection(
      statusLabels[FeedbackStatus.OPEN],
      'Lesson',
      'Web'
    );
    await lessonCreator.verifyFeedbackDetailPageLessonContextSection(
      expId,
      '4',
      'Introduction',
      '0',
      '1'
    );
    await lessonCreator.clickReportedLessonVersionLink(expId, '4');
    await lessonCreator.clickReportedLessonStateEditorLink(
      expId,
      'Introduction'
    );

    await lessonCreator.verifyFeedbackDetailPageUserFeedbackSection(
      'Question 2 is confusing.'
    );
    await lessonCreator.verifyFeedbackDetailPageRepliesSection(false);
    await lessonCreator.verifyFeedbackDetailPageActionsSection();

    await lessonCreator.clickFeedbackDetailBackButton();
    await lessonCreator.expectScreenshotToMatch(
      'backToExplorationFeedbackList',
      __dirname
    );

    await lessonCreator.selectCreatorFeedbackType('Report');
    await lessonCreator.clickOnFeedbackListEntryWithDescription(
      'There is a typo in the question text.'
    );
  });

  // afterAll(async function () {
  //   await UserFactory.closeAllBrowsers();
  // });
});
