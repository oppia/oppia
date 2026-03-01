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
 * EL.LP.  Learner can see the feedback and help cards.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  FRACTION_INPUT = 'Fraction Input',
  END_EXPLORATION = 'End Exploration',
}

enum CARDS {
  INTRODUCTION_CARD = 'Introduction',
  SECOND_CARD = 'Second Card',
  THIRD_CARD = 'Third Card',
  FINAL_CARD = 'Final',
}

enum EXPLORATION_TITLE {
  PLACE_VALUES = 'What are the Place Values?',
  EXPLORATION_1 = 'Exploration 1',
  EXPLORATION_2 = 'Exploration 2',
}

describe('Logged-Out Learner', function () {
  let explorationId: string;
  let exploration1Id: string;
  let exploration2Id: string;
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(
    async function () {
      loggedOutLearner = await UserFactory.createLoggedOutUser();

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculumAdm@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordinator1',
        'releaseCoordinator1@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      // Enable the feature flag.
      await releaseCoordinator.enableFeatureFlag('new_lesson_player');

      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
      // Add Interaction Cards.
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.updateCardContent(
        'Welcome, to the Place Values Exploration.'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard(CARDS.SECOND_CARD);

      await curriculumAdmin.navigateToCard(CARDS.SECOND_CARD);
      await curriculumAdmin.updateCardContent(
        "What is 3/6 equal to in it's simplest form?"
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
      await curriculumAdmin.addResponsesToTheInteraction(
        INTERACTION_TYPES.FRACTION_INPUT,
        '2',
        'Correct!',
        CARDS.THIRD_CARD,
        true
      );
      await curriculumAdmin.editDefaultResponseFeedbackInExplorationEditorPage(
        'Incorrect, try again!'
      );

      // Add 2 hints.
      await curriculumAdmin.addHintToState(
        'This hint 1 to help to answer the question.'
      );
      await curriculumAdmin.addHintToState(
        'This hint 2 to help to answer the question'
      );
      // Add answer with explanation.
      await curriculumAdmin.addSolutionToState('1/2', 'Answer is 1/2.', true);

      await curriculumAdmin.navigateToCard(CARDS.THIRD_CARD);
      await curriculumAdmin.updateCardContent('Good continue learning!!');
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard(CARDS.FINAL_CARD);

      await curriculumAdmin.navigateToCard(CARDS.FINAL_CARD);
      await curriculumAdmin.updateCardContent(
        'You have successfully completed the lesson!'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await curriculumAdmin.saveExplorationDraft();

      // Mark second card as a checkpoint.
      await curriculumAdmin.navigateToCard(CARDS.SECOND_CARD);
      await curriculumAdmin.setTheStateAsCheckpoint();
      // Mark third Card as a checkpoint.
      await curriculumAdmin.navigateToCard(CARDS.THIRD_CARD);
      await curriculumAdmin.setTheStateAsCheckpoint();

      await curriculumAdmin.saveExplorationDraft(
        'Add checkpoint as second and third card'
      );

      explorationId = await curriculumAdmin.publishExplorationWithMetadata(
        EXPLORATION_TITLE.PLACE_VALUES,
        'Learn basic Mathematics including Place Values',
        'Mathematics'
      );
      if (!explorationId) {
        throw new Error('Exploration ID is null or undefined.');
      }

      // Add two dummy exploration.
      // Add first dummy exploration.
      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
      // Add Interaction Cards.
      await curriculumAdmin.updateCardContent(
        `Welcome, to the ${EXPLORATION_TITLE.EXPLORATION_1}.`
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard(CARDS.FINAL_CARD);

      await curriculumAdmin.navigateToCard(CARDS.FINAL_CARD);
      await curriculumAdmin.updateCardContent(
        'You have successfully completed the lesson!'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await curriculumAdmin.saveExplorationDraft();
      exploration1Id = await curriculumAdmin.publishExplorationWithMetadata(
        EXPLORATION_TITLE.EXPLORATION_1,
        `Learn basic Mathematics including ${EXPLORATION_TITLE.EXPLORATION_1}`,
        'Mathematics'
      );
      if (!exploration1Id) {
        throw new Error(
          `Exploration title:${EXPLORATION_TITLE.EXPLORATION_1} ID is null or undefined.`
        );
      }

      // Add second dummy exploration.
      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
      // Add Interaction Cards.
      await curriculumAdmin.updateCardContent(
        `Welcome, to the ${EXPLORATION_TITLE.EXPLORATION_2}.`
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard(CARDS.FINAL_CARD);

      await curriculumAdmin.navigateToCard(CARDS.FINAL_CARD);
      await curriculumAdmin.updateCardContent(
        'You have successfully completed the lesson!'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await curriculumAdmin.saveExplorationDraft();
      exploration2Id = await curriculumAdmin.publishExplorationWithMetadata(
        EXPLORATION_TITLE.EXPLORATION_2,
        `Learn basic Mathematics including ${EXPLORATION_TITLE.EXPLORATION_2}`,
        'Mathematics'
      );
      if (!exploration2Id) {
        throw new Error(
          `Exploration title:${EXPLORATION_TITLE.EXPLORATION_2} ID is null or undefined.`
        );
      }

      // Create topic with 'Place Values'.
      const topicName = 'Place Values';
      const subtopicName = 'Place Values';
      const skillName = 'skill-1';
      await curriculumAdmin.createTopic(
        topicName,
        topicName.toLowerCase().replace(/ /g, '-')
      );
      // Create a subtopic 'Place Values' for topic 'Place Values'.
      await curriculumAdmin.createSubtopicForTopic(
        subtopicName,
        subtopicName.toLowerCase().replace(/ /g, '-'),
        topicName
      );
      // Create a skill with name 'skill-1' and 10 question inside it.
      await curriculumAdmin.createSkillForTopic(skillName, topicName, false);
      await curriculumAdmin.createQuestionsForSkill(skillName, 3);
      await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
        skillName,
        subtopicName,
        topicName
      );
      await curriculumAdmin.addSkillToDiagnosticTest(skillName, topicName);

      await curriculumAdmin.publishDraftTopic(topicName);

      // Create a story node with 3 chapters.
      await curriculumAdmin.createAndPublishStoryWithChapters(
        'What are Place values',
        'place-values',
        [
          {
            chapterTitle: EXPLORATION_TITLE.PLACE_VALUES,
            explorationId: explorationId,
          },
          {
            chapterTitle: EXPLORATION_TITLE.EXPLORATION_1,
            explorationId: exploration1Id,
          },
          {
            chapterTitle: EXPLORATION_TITLE.EXPLORATION_2,
            explorationId: exploration2Id,
          },
        ],
        topicName
      );

      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        topicName
      );

      // Go to creator dashboard.
      await curriculumAdmin.navigateToCreatorDashboardPage();

      // Select the exploration 'What are the Place Values?'.
      await curriculumAdmin.chooseExplorationForEditFromCreatorDashboard(
        explorationId
      );
      // Link concept card in the Introduction card.
      await curriculumAdmin.navigateToCard(CARDS.INTRODUCTION_CARD);

      await curriculumAdmin.linkSkillToState('skill-1');

      // Publish the changes of exploration.
      await curriculumAdmin.saveExplorationDraft('Link concept card: skill-1');
    },
    // Setup takes more time than default.
    1000000
  );

  it('should be able to resume progress using the 72-hour link', async function () {
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.clickOnContinueButton();
    await loggedOutLearner.submitAnswerInTextArea('1/2');

    // Click on the 'Save' button.
    await loggedOutLearner.clickOnSaveProgressButton();
    await loggedOutLearner.expectSaveProgressModal();
    // Click on 'copy' button.
    await loggedOutLearner.clickOnCopyButton();
    const newTab = await loggedOutLearner.pasteLinkAndResumeLesson();
    // Fraction card content is visible.
    await loggedOutLearner.expectLearnerCardHeading(
      "What is 3/6 equal to in it's simplest form?"
    );
    await loggedOutLearner.expectSignInButtonToBePresent();
    await newTab.close();
  });

  it('should be able to sign up to permanently save the progress', async function () {
    await loggedOutLearner.clickOnCreateAnAccountInSaveProgressModal();
    await loggedOutLearner.expectToBeOnLoginPage();
    await loggedOutLearner.signUpNewUser(
      'loggedoutLearner',
      'loggedoutLearner@example.com'
    );
    await loggedOutLearner.expectProgressRemainderModal();
    await loggedOutLearner.clickOnLessonResumeButton();
    expect(await loggedOutLearner.isSaveLessonProgressButtonPresent()).toBe(
      false
    );
    await loggedOutLearner.expectProfileAvatarVisible();
    expect(await loggedOutLearner.isSignInButtonVisible()).toBe(false);
  });
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
