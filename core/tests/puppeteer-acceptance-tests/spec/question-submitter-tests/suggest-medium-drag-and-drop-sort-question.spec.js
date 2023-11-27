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
 * @fileoverview Acceptance Test for practice question submitters to
 * suggest question of medium difficulty with a drag and drop sort
 * interaction.
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Practice Question Submitter', function() {
  const topicName = 'Test Topic';
  const skillDescription = 'Counting';
  const mediumDifficultyRubric = '';
  const hardDifficultyRubric = '';
  const questionText = 'Question 1: Test Question';
  const correctAnswer = 'Correct';
  const incorrectAnswer = 'Incorrect answer'
  const misconception = {
    feedback: ''
  };
  const hintText = 'Sort by number';
  const acceptedQuestionsPercentage = 30;

  let practiceQuestionSubmitter = null;

  beforeAll(async function() {
    const superAdmin = await userFactory.createNewSuperAdmin('superadmin');
    await superAdmin.assignRoleToUser('superadmin', ROLE_CURRICULUM_ADMIN);
    await superAdmin.assignRoleToUser('superadmin', ROLE_QUESTION_ADMIN);

    practiceQuestionSubmitter = (
      await userFactory.createPracticeQuestionSubmitter('questionsubmitter')); 

    const skill = {
      description: skillDescription,
      difficulties: {
        medium: { rubric: mediumDifficultyRubric },
        hard: { rubric: hardDifficultyRubric }
      },
      misconception,
      questions: await superAdmin.createDummyQuestionsOfQuantity(3),
    };
    await superAdmin.createSkill(skill);
    await superAdmin.createTopic({
      name: topicName,
      metaContent: 'test',
      assignedSkills: [skill],
      subtopics: [{
        assignedSkills: [skill]
      }],
      diagnosticSkill: skill
    });

    const classroomName = 'Math';
    await superAdmin.addTopicToClassroom(topicName, classroomName);
  });

  it('should suggest questions by selecting the difficulty to a lesson' +
    ' in a topic', async function() {
    await practiceQuestionSubmitter.navigateToContributorDashboard();
    await practiceQuestionSubmitter.navigateToSubmitQuestions();
    await practiceQuestionSubmitter.expectSkillOpportunity({
      topicName,
      skillDescription,
      suggestable: true
    });

    await practiceQuestionSubmitter.suggestQuestionForSkillOpportunity(
      { topicName, skillDescription });
    await practiceQuestionSubmitter.expectQuestionDifficultyChoicePrompt();
    await practiceQuestionSubmitter.expectDifficultyWithRubric(
      DIFFICULTY_MEDIUM, mediumDifficultyRubric);
    await practiceQuestionSubmitter.expectDifficultyWithRubric(
      DIFFICULTY_HARD, hardDifficultyRubric);
    
    await practiceQuestionSubmitter.chooseDifficulty(DIFFICULTY_MEDIUM);
    await practiceQuestionSubmitter.continueToQuestionEditor();
    await practiceQuestionSubmitter.expectChosenDifficultyToBe(
      DIFFICULTY_MEDIUM);
    await practiceQuestionSubmitter.expectSkillRubricToBe(
      mediumDifficultyRubric);
    await practiceQuestionSubmitter.expectQuestionTextSection();

    await practiceQuestionSubmitter.writeQuestionText(questionText);
    await practiceQuestionSubmitter.saveQuestionText();
    await practiceQuestionSubmitter.expectQuestionTextToBe(questionText);
    await practiceQuestionSubmitter.addInteraction();
    await practiceQuestionSubmitter.expectInteractionChoices();
    await practiceQuestionSubmitter.navigateToCommonInteractions();
    await practiceQuestionSubmitter.chooseInteraction(INTERACTION_DRAG_AND_DROP_SORT);
    await practiceQuestionSubmitter.expectDragAndDropSortInteractionEditor();
    await practiceQuestionSubmitter.expectUnmetRequirementOfMinimumDragAndDropSortItemCount();
    await practiceQuestionSubmitter.expectDragAndDropSortItemCountToBeExactly(1);

    await practiceQuestionSubmitter.writeDragAndDropSortItem(firstItem, '1');
    await practiceQuestionSubmitter.addDragAndDropSortItem();
    await practiceQuestionSubmitter.expectDragAndDropSortItemCountToBeExactly(2);
    await practiceQuestionSubmitter.writeDragAndDropSortItem(secondItem, '2');
    await practiceQuestionSubmitter.addDragAndDropSortItem();
    await practiceQuestionSubmitter.expectDragAndDropSortItemCountToBeExactly(3);
    await practiceQuestionSubmitter.writeDragAndDropSortItem(thirdItem, '3');
    await practiceQuestionSubmitter.allowMultipleSortItemsInSamePosition();
    await practiceQuestionSubmitter.saveInteraction();
    await practiceQuestionSubmitter.expectDragAndDropSortInteractionResponseEditor();

    await practiceQuestionSubmitter.chooseResponseAssertion(RESPONSE_EQUAL_TO_ORDERING);
    await practiceQuestionSubmitter.writeResponseFeedback(correctAnswer);
    await practiceQuestionSubmitter.saveResponseAndAddAnother();
    await practiceQuestionSubmitter.expectDragAndDropSortInteractionResponseEditor();
    await practiceQuestionSubmitter.chooseResponseAssertion(
      RESPONSE_EQUAL_TO_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION);
    await practiceQuestionSubmitter.tagResponseWithMisconception(misconception);
    await practiceQuestionSubmitter.saveResponse();
    await practiceQuestionSubmitter.expectResponse({
      assertion: RESPONSE_EQUAL_TO_ORDERING,
      feedback: correctAnswer
    });
    await practiceQuestionSubmitter.expectResponse({
      assertion: RESPONSE_EQUAL_TO_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION, 
      feedback: misconception.feedback
    });
    await practiceQuestionSubmitter.expectResponse({
      assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG,
      feedback: ''
    });
    await practiceQuestionSubmitter.addHint();
    await practiceQuestionSubmitter.expectHintEditor();

    await practiceQuestionSubmitter.writeHint(hintText);
    await practiceQuestionSubmitter.saveHint();
    await practiceQuestionSubmitter.expectHint(hintText);
    await practiceQuestionSubmitter.expectUnmetRequirementOfMinimumSolutionCount();
    await practiceQuestionSubmitter.addSolution();
    await practiceQuestionSubmitter.expectSolutionEditor();

    await practiceQuestionSubmitter.chooseSolutionQuantity(SOLUTION_QUANTITY_ONLY_ONE);
    await practiceQuestionSubmitter.writeDragAndDropSortSolution(solution);
    await practiceQuestionSubmitter.navigateToSolutionExplanation();
    await practiceQuestionSubmitter.writeSolutionExplanation(explanation);
    await practiceQuestionSubmitter.saveSolution();
    await practiceQuestionSubmitter.expectSolution({ solution, explanation });
    await practiceQuestionSubmitter.expectUnmetRequirementOfDefaultOutcomeToHaveFeedback();

    await practiceQuestionSubmitter.viewResponseDetails({
      assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG
    });
    await practiceQuestionSubmitter.editResponseDetailFeedback(incorrectAnswer);
    await practiceQuestionSubmitter.saveResponse();
    await practiceQuestionSubmitter.expectResponse({
      assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG,
      feedback: incorrectAnswer
    });
    await practiceQuestionSubmitter.suggestQuestion();
    await practiceQuestionSubmitter.expectQuestionToBeSuccessfullySubmittedForReview();
    // TODO #19075: After solving the aforementioned issue, change the following
    // expectation so that expected progressbar reflects said changes 
    await practiceQuestionSubmitter.expectSkillOpportunity({
      topicName,
      skillDescription,
      progress: { acceptedQuestionsPercentage }
    });
  }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
