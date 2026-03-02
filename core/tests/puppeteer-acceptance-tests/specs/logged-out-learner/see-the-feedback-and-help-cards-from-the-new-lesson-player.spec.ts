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

  it('should be able to see the first card of the lesson', async function () {
    // Visit Math classroom page.
    await loggedOutLearner.navigateToClassroomPage('math');
    await loggedOutLearner.selectAndOpenTopic('Place Values');
    await loggedOutLearner.selectChapterWithinStoryToLearn(
      'What are Place values',
      EXPLORATION_TITLE.PLACE_VALUES,
      true
    );

    await loggedOutLearner.expectScreenshotToMatch(
      'newLessonPlayerWithCheckpoint',
      __dirname
    );
    expect(await loggedOutLearner.getCheckpointFocusNodeNumber()).toBe(0);
    await loggedOutLearner.expectNoColorNodeInCheckpoint();
    expect(await loggedOutLearner.isContinueButtonPresent()).toBe(true);
    expect(await loggedOutLearner.isSaveLessonProgressButtonPresent()).toBe(
      true
    );
  });

  it('should be able to check the concept card', async function () {
    // Wait for few minutes to see the concept card.
    await loggedOutLearner.page.waitForTimeout(180000);
    await loggedOutLearner.expectConceptCardButton();
    await loggedOutLearner.expectScreenshotToMatch(
      'conceptCardInConversion',
      __dirname
    );
    // Open concept card.
    await loggedOutLearner.openConceptCard();
    await loggedOutLearner.expectConceptCardContent(
      'Review material text content for skill-1'
    );
  });

  it('should be able to go forward by one card', async function () {
    await loggedOutLearner.closeConceptCard();
    await loggedOutLearner.clickOnContinueButton();
    await loggedOutLearner.page.waitForTimeout(10000);
    await loggedOutLearner.expectCheckpointCelebrationComponentAppears();
    expect(await loggedOutLearner.getCheckpointFocusNodeNumber()).toBe(1);
    expect(await loggedOutLearner.isBackButtonPresent()).toBe(true);
    expect(await loggedOutLearner.isContinueButtonPresent()).toBe(false);
    await loggedOutLearner.expectScreenshotToMatch(
      'fractionCardInNewLessonPlayer',
      __dirname
    );
    expect(await loggedOutLearner.isCheckpointNodeColor(0)).toBe(true);
    expect(await loggedOutLearner.isResponseSubmitButtonPresent()).toBe(true);
  });

  it('should be able to go backward by one card', async function () {
    await loggedOutLearner.clickBackCardButton();
    // Expect the first card content.
    await loggedOutLearner.expectLearnerCardHeading(
      'Welcome, to the Place Values Exploration.'
    );
    expect(await loggedOutLearner.isCheckpointNodeColor(0)).toBe(true);
    expect(await loggedOutLearner.getCheckpointFocusNodeNumber()).toBe(1);
    // Next card arrow button visible.
    expect(await loggedOutLearner.isNextCardNavigationButtonPresent()).toBe(
      true
    );
  });

  it('should be able to get feedback on the incorrect answer', async function () {
    await loggedOutLearner.clickNextCardButton();
    // Enter wrong answer in input box.
    await loggedOutLearner.submitFractionInputResponse('4');
    await loggedOutLearner.page.waitForTimeout(10000);
    await loggedOutLearner.expectLatestFeedbackContent('Incorrect, try again!');
  });

  it('should be able to get a hint or a solution when the user gets stuck', async function () {
    await loggedOutLearner.submitFractionInputResponse('ABC');
    await loggedOutLearner.expectErrorMessageForWrongInputToBe(
      'Please only use numerical digits, spaces or forward slashes (/)'
    );
    await loggedOutLearner.expectSubmitButton('Disabled');
    // Wait for few minutes to see the hint.
    await loggedOutLearner.page.waitForTimeout(180000);
    await loggedOutLearner.expectTextPresentOnPage('View hint');
    await loggedOutLearner.expectConversationContentByButton(
      'View hint',
      'Need extra help solving the problem? Check out the hint.'
    );
    await loggedOutLearner.clickOnElementWithText('View hint');
    await loggedOutLearner.expectHintContentInHintModal(
      'This hint 1 to help to answer the question.'
    );
    await loggedOutLearner.closeHintModal();
    // Again wait for few minutes to see another hint.
    await loggedOutLearner.page.waitForTimeout(180000);
    await loggedOutLearner.expectTextPresentOnPage('View hint 2');
    await loggedOutLearner.expectConversationContentByButton(
      'View hint 2',
      "Don't worry! Here is another hint that might be helpful to you."
    );
    await loggedOutLearner.clickOnElementWithText('View hint 2');
    await loggedOutLearner.expectHintContentInHintModal(
      'This hint 2 to help to answer the question'
    );
    await loggedOutLearner.closeHintModal();
    // Wait for few minutes to see the solution.
    await loggedOutLearner.page.waitForTimeout(300000);
    // Submit few wrong answer.
    await loggedOutLearner.submitFractionInputResponse('4');
    await loggedOutLearner.page.waitForTimeout(10000);
    await loggedOutLearner.submitFractionInputResponse('4');
    await loggedOutLearner.page.waitForTimeout(20000);
    await loggedOutLearner.submitFractionInputResponse('4');
    await loggedOutLearner.page.waitForTimeout(20000);

    await loggedOutLearner.expectTextPresentOnPage('View Solution');
    await loggedOutLearner.expectConversationContentByButton(
      'View Solution',
      'It seems like you are not sure how to continue. If you want, you can view the solution for this lesson.'
    );
    await loggedOutLearner.clickOnElementWithText('View Solution');

    await loggedOutLearner.expectWarningModalBeforeViewSolution();
    expect(
      await loggedOutLearner.expectTextPresentOnPage('SHOW SOLUTION')
    ).toBe(true);
    await loggedOutLearner.clickOnElementWithText('SHOW SOLUTION');

    await loggedOutLearner.expectSolutionModelVisible();
    await loggedOutLearner.expectSolution('1/2>');
    await loggedOutLearner.expectSolutionExplanation('Answer is 1/2.');
    await loggedOutLearner.expectScreenshotToMatch(
      'solutionModalLearnerPage',
      __dirname
    );
    await loggedOutLearner.closeSolution();
  }, 1200000);

  it('should be able to submit the correct answer and see the celebration pop-up', async function () {
    await loggedOutLearner.submitFractionInputResponse('1/2');
    await loggedOutLearner.clickOnContinueButton();
    await loggedOutLearner.expectCheckpointCelebrationComponentAppears();
    await loggedOutLearner.expectSubmitButton('Hidden');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
