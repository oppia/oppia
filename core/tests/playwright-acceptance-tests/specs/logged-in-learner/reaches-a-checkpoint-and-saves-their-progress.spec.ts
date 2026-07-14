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
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * LI. Learner reaches a checkpoint and saves their progress
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

test.describe.configure({mode: 'serial'});

const ROLES = testConstants.Roles;
const CLASSROOM_NAME = 'Math';
const CLASSROOM_URL_FRAGMENT = 'math';
const TOPIC_NAME = 'Positive Numbers';
const STORY_TITLE = 'Number Adventures';
const CHAPTER_NAME = 'Positive Numbers';

test.describe('Logged-in User', function () {
  let explorationEditor: ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin;
  let loggedInUser: LoggedInUser & LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(900000); // Setup taking longer than default timeout.
    const releaseCoordinator: ReleaseCoordinator =
      await UserFactory.createNewUser(
        'releaseCoord',
        'release_coordinator@example.com',
        browser,
        [ROLES.RELEASE_COORDINATOR]
      );
    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
    );
    await UserFactory.closeBrowserForUser(releaseCoordinator);

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );
    await curriculumAdmin.createNewClassroom(
      CLASSROOM_NAME,
      CLASSROOM_URL_FRAGMENT
    );
    await curriculumAdmin.updateClassroom(
      CLASSROOM_NAME,
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Positive Numbers.'
    );
    await curriculumAdmin.createAndPublishTopic(
      TOPIC_NAME,
      'Positive Numbers Subtopics',
      'Positive Numbers Skills'
    );
    await curriculumAdmin.addTopicToClassroom(CLASSROOM_NAME, TOPIC_NAME);
    await curriculumAdmin.publishClassroom(CLASSROOM_NAME);

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning positive numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Test Question');
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard('Test Question');
    await explorationEditor.updateCardContent('Enter a negative number.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-1',
      'Prefect!',
      'Study Guide',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and Study Guide content.
    await explorationEditor.navigateToCard('Study Guide');
    await explorationEditor.updateCardContent(
      'Positive numbers are greater than zero.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Final Card');
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard('Final Card');
    await explorationEditor.updateCardContent(
      'Lesson completed successfully. We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard('Introduction');
    await explorationEditor.saveExplorationDraft();

    const explorationId =
      await explorationEditor.publishExplorationWithMetadata(
        'Positive Numbers',
        'Learn positive numbers.',
        'Algebra',
        'growth'
      );
    await UserFactory.closeBrowserForUser(explorationEditor);

    await curriculumAdmin.addStoryToTopic(
      STORY_TITLE,
      'number-adventures',
      TOPIC_NAME
    );
    await curriculumAdmin.addChapter(CHAPTER_NAME, explorationId);
    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();
    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com',
      browser
    );
  });

  test('should be able to track the checkpoint progress', async function () {
    // A freshly signed-up user lands on the splash page, not the learner
    // dashboard, so it must be navigated to directly first.
    await loggedInUser.navigateToLearnerDashboard();

    // Visit the Math classroom page.
    await loggedInUser.navigateToClassroomFromLearnerDashboard(
      CLASSROOM_URL_FRAGMENT
    );
    await loggedInUser.expectToBeOnPage('learn/math');

    // Select the "Positive Numbers" topic.
    await loggedInUser.selectAndOpenTopic(TOPIC_NAME);

    // Select the "Positive Numbers" lesson from the list.
    await loggedInUser.selectChapterWithinStoryToLearn(
      STORY_TITLE,
      CHAPTER_NAME
    );

    // Continue to the next card (Test Question, the first checkpoint). The
    // checkpoint modal appears immediately on arrival and overlaps the
    // input field, so it must be verified (and dismissed) before the answer
    // can be submitted.
    await loggedInUser.continueToNextCard();
    await loggedInUser.verifyCheckpointModalAppears();

    // Submit the correct answer and continue to the next card (Study
    // Guide, the second checkpoint).
    await loggedInUser.submitAnswer('-25');
    await loggedInUser.continueToNextCard();
  });

  test('should be able to resume the lesson from the last progress saved', async function () {
    // Click on the profile menu in the navbar, then the learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();

    // Use the navbar to visit the math classroom. The learner already has
    // progress in this topic at this point, so it no longer appears as an
    // "untracked" topic on the dashboard's classroom button — the navbar's
    // Learn menu is used instead, since it's available regardless of
    // progress state.
    await loggedInUser.navigateToClassroomFromNavbar(CLASSROOM_NAME);
    await loggedInUser.expectToBeOnPage('learn/math');
    await loggedInUser.selectAndOpenTopic(TOPIC_NAME);
    await loggedInUser.selectChapterWithinStoryToLearn(
      STORY_TITLE,
      CHAPTER_NAME
    );

    await loggedInUser.expectProgressReminder(true);
    // Verify the checkpoint bar shows 2 completed nodes: the Introduction
    // and the Test Question checkpoints, with the Study Guide checkpoint
    // reached but not yet passed.
    await loggedInUser.expectCheckpointBarToHaveCompletedNodes(2);
    await loggedInUser.chooseActionInProgressRemainder('Resume');

    await loggedInUser.continueToNextCard();
    await loggedInUser.expectCardContentToMatch(
      'Lesson completed successfully. We have practiced negative numbers.'
    );
  });

  test('should be able to restart the lesson from the beginning', async function () {
    // Click on the profile menu in the navbar, then the learner dashboard.
    await loggedInUser.navigateToLearnerDashboardUsingProfileDropdown();

    // Use the navbar to visit the math classroom. The learner already has
    // progress in this topic at this point, so it no longer appears as an
    // "untracked" topic on the dashboard's classroom button — the navbar's
    // Learn menu is used instead, since it's available regardless of
    // progress state.
    await loggedInUser.navigateToClassroomFromNavbar(CLASSROOM_NAME);
    await loggedInUser.expectToBeOnPage('learn/math');
    await loggedInUser.selectAndOpenTopic(TOPIC_NAME);
    await loggedInUser.selectChapterWithinStoryToLearn(
      STORY_TITLE,
      CHAPTER_NAME
    );

    await loggedInUser.expectProgressReminder(true);
    await loggedInUser.chooseActionInProgressRemainder('Restart');

    // Verify the lesson actually restarted from the Introduction card,
    // rather than resuming from the last saved checkpoint.
    await loggedInUser.expectCardContentToMatch(
      'We will be learning positive numbers.'
    );

    await loggedInUser.continueToNextCard();
    await loggedInUser.submitAnswer('-99');
    await loggedInUser.continueToNextCard();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
