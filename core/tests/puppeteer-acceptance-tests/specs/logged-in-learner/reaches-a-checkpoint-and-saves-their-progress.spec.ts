// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * LI.7. Save progress at checkpoints
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-in Learner', function () {
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let explorationEditor: ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId: string;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create Math classroom.
    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    // Create Place Values topic.
    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values',
      'Place Values'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.publishClassroom('Math');

    // Create exploration editor to create the "What are the Place Values?" exploration.
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();

    // First card - Introduction with continue button.
    await explorationEditor.updateCardContent(
      "Welcome to Place Values. Let's learn about place values."
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Fraction Question');
    await explorationEditor.saveExplorationDraft();

    // Second card - Fraction interaction (first checkpoint will be set here).
    await explorationEditor.navigateToCard('Fraction Question');
    await explorationEditor.updateCardContent(
      'Enter a fraction to represent the place value.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '1/2',
      'Correct!',
      'Second Question',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try again!'
    );
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Third card - Second question (second checkpoint will be set here).
    await explorationEditor.navigateToCard('Second Question');
    await explorationEditor.updateCardContent(
      'Enter another fraction to continue learning.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '3/4',
      'Excellent!',
      'Final Card',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try again!'
    );
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Fourth card - Final card.
    await explorationEditor.navigateToCard('Final Card');
    await explorationEditor.updateCardContent(
      'Great job! You have completed the lesson on place values.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to introduction and save.
    await explorationEditor.navigateToCard('Introduction');
    await explorationEditor.saveExplorationDraft();

    // Publish the exploration.
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'What are the Place Values?',
      'Learn about place values.',
      'Algebra',
      'growth'
    );

    await UserFactory.closeBrowserForUser(explorationEditor);

    // Add story and chapter to topic.
    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );
    await curriculumAdmin.addChapter(
      'What are the Place Values',
      explorationId
    );
    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
    await UserFactory.closeSuperAdminBrowser();
  }, 900000);

  it('should be able to track the checkpoint progress', async function () {
    // Visit the Math classroom page.
    await loggedInUser.navigateToClassroomFromLearnerDashboard('math');
    await loggedInUser.expectToBeOnPage('learn/math');

    // Select the "Place Values" topic.
    await loggedInUser.selectAndOpenTopic('Place Values');

    // Select the "What are the Place Values?" lesson from the list.
    await loggedInUser.selectChapterWithinStoryToLearn(
      "Jamie's Adventures in the Arcade",
      'What are the Place Values'
    );

    // Verify the first card of the exploration is displayed.
    // Verify the continue button is displayed.
    await loggedInUser.expectCardContentToMatch(
      "Welcome to Place Values. Let's learn about place values."
    );
    await loggedInUser.expectContinueToNextCardButtonToBePresent();

    // Click on the continue button in the footer.
    await loggedInUser.continueToNextCardInLessonPlayer();

    // Verify Fraction interaction is displayed.
    // Verify a back button that is enabled and a continue button that is disabled are displayed.
    // Verify an input box and a submit button are also displayed.
    await loggedInUser.expectCardContentToMatch(
      'Enter a fraction to represent the place value.'
    );
    // Verify back button is visible (enabled).
    await loggedInUser.expectElementToBeVisible('.e2e-test-back-button');
    // Verify continue button is not visible (disabled until answer is submitted).
    await loggedInUser.expectContinueToNextCardButtonToBePresent(false);
    // Verify submit button is visible.
    await loggedInUser.expectSubmitButtonToBe('Visible');
    await loggedInUser.verifyCheckpointModalAppears();

    // Enter the correct answer in the input box.
    // Click on the Submit button.
    await loggedInUser.submitAnswerInLessonPlayer('1/2');

    // Verify the submit button vanishes, and the Continue button shows up.
    await loggedInUser.expectSubmitButtonToBe('Hidden');
    await loggedInUser.expectContinueToNextCardButtonToBePresent();

    // Click on the continue button in the footer.
    await loggedInUser.continueToNextCardInLessonPlayer();

    // Verify second question card appears.
    await loggedInUser.expectCardContentToMatch(
      'Enter another fraction to continue learning.'
    );
    await loggedInUser.verifyCheckpointModalAppears();
    await loggedInUser.submitAnswerInLessonPlayer('3/4');
    await loggedInUser.continueToNextCardInLessonPlayer();

    // Verify final card appears.
    await loggedInUser.expectCardContentToMatch(
      'Great job! You have completed the lesson on place values.'
    );
  });

  it('should be able to resume the lesson from the last progress saved', async function () {
    // Click on the profile menu in the navbar.
    // Click on the learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();

    // Use the navbar to visit the math classroom.
    // Visit the Math classroom page.
    await loggedInUser.navigateToClassroomFromLearnerDashboard('math');
    await loggedInUser.expectToBeOnPage('learn/math');

    // Select the "Place Values" topic.
    await loggedInUser.selectAndOpenTopic('Place Values');

    // Select the "What are the Place Values?" lesson from the list.
    await loggedInUser.selectChapterWithinStoryToLearn(
      "Jamie's Adventures in the Arcade",
      'What are the Place Values'
    );

    // Verify the progress reminder modal is displayed, and
    // the "Do you want to continue" text is displayed in the modal body.
    // Verify the checkpoint bar shown in the modal body has 2 nodes with color-filled.
    await loggedInUser.expectProgressReminder(true);
    await loggedInUser.expectProgressReminderModalTextToBe(
      'Do you want to continue?'
    );
    await loggedInUser.expectCheckpointBarToHaveCompletedNodes(2);

    // Click on the "Yes, resume the lesson" button.
    await loggedInUser.chooseActionInProgressRemainder('Resume');

    // Verify 3rd card is displayed.
    await loggedInUser.expectCardContentToMatch(
      'Enter another fraction to continue learning.'
    );
  });

  it('should be able to restart the lesson from the beginning', async function () {
    // Click on the profile menu in the navbar.
    // Click on the learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();

    // Use the navbar to visit the math classroom.
    // Visit the Math classroom page.
    await loggedInUser.navigateToClassroomFromLearnerDashboard('math');
    await loggedInUser.expectToBeOnPage('learn/math');

    // Select the "Place Values" topic.
    await loggedInUser.selectAndOpenTopic('Place Values');

    // Select the "What are the Place Values?" lesson from the list.
    await loggedInUser.selectChapterWithinStoryToLearn(
      "Jamie's Adventures in the Arcade",
      'What are the Place Values'
    );

    // Click on the "No, restart from the beginning" button.
    await loggedInUser.expectProgressReminder(true);
    await loggedInUser.chooseActionInProgressRemainder('Restart');

    // Verify the first card of exploration is displayed.
    // Verify the continue button is displayed.
    await loggedInUser.expectCardContentToMatch(
      "Welcome to Place Values. Let's learn about place values."
    );
    await loggedInUser.expectContinueToNextCardButtonToBePresent();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);
});
