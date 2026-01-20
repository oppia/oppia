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
 * LI.3. Track progress and get recommendations for next steps on the Learner Dashboard
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Logged-In Learner', function () {
  let loggedInLearner: LoggedOutUser & LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId1: string;
  let explorationId2: string;

  beforeAll(
    async function () {
      // Create users.
      loggedInLearner = await UserFactory.createNewUser(
        'learner',
        'learner@example.com'
      );
      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculumAdmin@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );
      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordinator',
        'release_coordinator@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      // Enable redesigned learner dashboard.
      await releaseCoordinator.enableFeatureFlag(
        'show_redesigned_learner_dashboard'
      );

      // Reload the page to ensure redesigned learner dashboard is shown.
      await loggedInLearner.reloadPage();

      // Create explorations with continue button and end exploration interactions.
      // Each exploration will have 3 cards: 2 with Continue button, 1 with End Exploration.
      explorationId1 =
        await curriculumAdmin.createAndPublishExplorationWithCards(
          'Positive Numbers',
          'Algebra',
          3
        );

      explorationId2 =
        await curriculumAdmin.createAndPublishExplorationWithCards(
          'Negative Numbers',
          'Algebra',
          3
        );

      // Create topic, subtopic, and skill.
      await curriculumAdmin.createTopic('Algebra I', 'algebra-i');
      await curriculumAdmin.createSubtopicForTopic(
        'Negative Numbers',
        'negative-numbers',
        'Algebra I'
      );
      await curriculumAdmin.createSkillForTopic(
        'Negative Numbers',
        'Algebra I',
        false
      );

      // Add 3 questions to the skill.
      await curriculumAdmin.createQuestionsForSkill('Negative Numbers', 3);

      // Assign skill to subtopic.
      await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
        'Negative Numbers',
        'Negative Numbers',
        'Algebra I'
      );

      // Add skill to diagnostic test.
      // Navigate to topic editor first before adding skill to diagnostic test.
      await curriculumAdmin.addSkillToDiagnosticTest(
        'Negative Numbers',
        'Algebra I'
      );

      // Publish topic.
      await curriculumAdmin.publishDraftTopic('Algebra I');

      // Create classroom and add topic to it.
      await curriculumAdmin.createAndPublishClassroom(
        'Maths',
        'math',
        'Algebra I'
      );

      // Add story and chapters.
      await curriculumAdmin.addStoryToTopic(
        'The Broken Calculator',
        'the-broken-calculator',
        'Algebra I'
      );
      await curriculumAdmin.addChapter(
        'Test Chapter 1',
        explorationId1 as string
      );
      await curriculumAdmin.addChapter(
        'Test Chapter 2',
        explorationId2 as string
      );
      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.publishStoryDraft();
    },
    // Test takes longer than default timeout.
    600000
  );

  it('should be able to add a goal and see it in Current Goals with Learn Something New section', async function () {
    // Navigate to learner dashboard and go to Goals section.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInLearner.navigateToGoalsSection();

    // Add "Algebra I" topic as a goal.
    await loggedInLearner.addGoalInRedesignedLearnerDashboard('Algebra I');

    // Verify "Algebra I" topic is visible in "Current Goals" section.
    await loggedInLearner.expectCurrentGoalsInRedesignedDashboardToContain(
      'Algebra I: The Broken Calculator'
    );

    // Navigate to Home section.
    await loggedInLearner.navigateToHomeSectionInRedesignedDashboard();

    // Verify "Learn Something New" section is visible and contains "Test Chapter 1" lesson.
    await loggedInLearner.expectLearnSomethingNewSectionInRedesignedDashboardToBePresent();
    await loggedInLearner.expectLessonToBePresentInLearnSomethingNewSection(
      'Test Chapter 1'
    );
  }, 600000);

  it('should be able to see Continue where you left off section after playing lesson halfway', async function () {
    // Navigate to learner dashboard and go to Goals section.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInLearner.navigateToGoalsSection();

    // Add "Algebra I" topic as a goal.
    await loggedInLearner.addGoalInRedesignedLearnerDashboard('Algebra I');

    // Navigate to Home section.
    await loggedInLearner.navigateToHomeSectionInRedesignedDashboard();

    // Select "Test Chapter 1" lesson from learner dashboard.
    await loggedInLearner.playLessonFromDashboardInRedesignedDashboard(
      'Test Chapter 1'
    );

    // Play lesson halfway (continue to next card to make progress).
    await loggedInLearner.continueToNextCard();

    // Navigate back to Learner Dashboard via profile menu.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();

    // Verify "Continue where you left off" section is visible and contains "Test Chapter 1" lesson.
    await loggedInLearner.expectContinueFromWhereYouLeftSectionInRedesignedDashboardToBePresent(
      true
    );
    await loggedInLearner.expectLessonToBePresentInContinueWhereLeftOffSection(
      'Test Chapter 1'
    );

    // Verify lesson progress is visible (between 0% and 100%).
    // The exact percentage may vary, so we just verify the lesson card shows progress.
    await loggedInLearner.expectLessonProgressToBeVisible('Test Chapter 1');

    // Verify "Learn Something New" section is not visible.
    await loggedInLearner.expectLearnSomethingNewSectionInRedesignedDashboardToBePresent(
      false
    );
  }, 600000);

  it('should be able to see progress after completing first chapter', async function () {
    // Navigate to learner dashboard and go to Goals section.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInLearner.navigateToGoalsSection();

    // Add "Algebra I" topic as a goal.
    await loggedInLearner.addGoalInRedesignedLearnerDashboard('Algebra I');

    // Navigate to Home section.
    await loggedInLearner.navigateToHomeSectionInRedesignedDashboard();

    // Select "Test Chapter 1" lesson from learner dashboard.
    await loggedInLearner.playLessonFromDashboardInRedesignedDashboard(
      'Test Chapter 1'
    );

    // Play lesson halfway (continue to next card to make progress).
    await loggedInLearner.continueToNextCard();

    // Navigate back to Learner Dashboard.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();

    // Resume "Test Chapter 1" lesson from Continue where you left off section.
    await loggedInLearner.resumeLessonFromLearnerDashboardInRedesignedDashboard(
      'Test Chapter 1'
    );

    // Complete the lesson by continuing to the end.
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();

    // Navigate back to Learner Dashboard via profile menu.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();

    // Verify "Continue where you left off" section is not visible.
    await loggedInLearner.expectContinueFromWhereYouLeftSectionInRedesignedDashboardToBePresent(
      false
    );

    // Verify "Learn Something New" section is visible and contains "Test Chapter 2".
    await loggedInLearner.expectLearnSomethingNewSectionInRedesignedDashboardToBePresent();
    await loggedInLearner.expectLessonToBePresentInLearnSomethingNewSection(
      'Test Chapter 2'
    );

    // Navigate to Progress tab.
    await loggedInLearner.navigateToProgressSection();

    // Verify "Algebra I" has a progress of 50%.
    await loggedInLearner.expectTopicProgressInProgressTabToBe(
      'Algebra I',
      '50%'
    );

    // Verify "The Broken Calculator" story has a progress of 50%.
    await loggedInLearner.expectStoryProgressInProgressTabToBe(
      'The Broken Calculator',
      '50%'
    );
  }, 600000);

  it('should be able to see 100% progress after completing all chapters', async function () {
    // Navigate to learner dashboard and go to Goals section.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();
    await loggedInLearner.navigateToGoalsSection();

    // Add "Algebra I" topic as a goal.
    await loggedInLearner.addGoalInRedesignedLearnerDashboard('Algebra I');

    // Navigate to Home section.
    await loggedInLearner.navigateToHomeSectionInRedesignedDashboard();

    // Select "Test Chapter 1" lesson and complete it.
    await loggedInLearner.playLessonFromDashboardInRedesignedDashboard(
      'Test Chapter 1'
    );
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();

    // Navigate back to Learner Dashboard.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();

    // Select "Test Chapter 2" lesson from Learn Something New section.
    await loggedInLearner.playLessonFromDashboardInRedesignedDashboard(
      'Test Chapter 2'
    );

    // Complete the lesson by continuing to the end.
    await loggedInLearner.continueToNextCard();
    await loggedInLearner.continueToNextCard();

    // Navigate back to Learner Dashboard via profile menu.
    await loggedInLearner.navigateToLearnerDashboardUsingProfileDropdown();

    // Verify "Continue where you left off" section is not visible.
    await loggedInLearner.expectContinueFromWhereYouLeftSectionInRedesignedDashboardToBePresent(
      false
    );

    // Navigate to Progress tab.
    await loggedInLearner.navigateToProgressSection();

    // Verify "Algebra I" has a progress of 100%.
    await loggedInLearner.expectTopicProgressInProgressTabToBe(
      'Algebra I',
      '100%'
    );

    // Verify "The Broken Calculator" story has a progress of 100%.
    await loggedInLearner.expectStoryProgressInProgressTabToBe(
      'The Broken Calculator',
      '100%'
    );

    // Navigate to Goals tab.
    await loggedInLearner.navigateToGoalsSection();

    // Verify "lessons" part of "Algebra I" is marked as completed.
    await loggedInLearner.expectGoalLessonsToBeCompleted('Algebra I');
  }, 600000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
