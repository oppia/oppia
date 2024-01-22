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
  const mediumDifficultyRubricNotes = [''];
  const hardDifficultyRubricNotes = [''];
  const questionText = 'Question 1: Test Question';
  const correctAnswer = 'Correct';
  const incorrectAnswer = 'Incorrect answer';
  const misconception = {
    name: '3 before 2',
    feedback: '2 to 3 (two to three)',
    mustBeTaggedToQuestion: false
  };
  const acceptedQuestionsPercentage = 30;

  let questionSubmitter = null;
  const ROLE_CURRICULUM_ADMIN = 'curriculum admin';
  const ROLE_QUESTION_ADMIN = 'question admin';
  const DIFFICULTY_MEDIUM = 'Medium';
  const DIFFICULTY_HARD = 'Hard';
  const RESPONSE_EQUAL_TO_ORDERING = 'is equal to ordering';
  const RESPONSE_EQUAL_TO_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION = (
    'is equal to ordering with one item at incorrect position');
  const RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG = 'all other answers are wrong';
  const SOLUTION_QUANTITY_ONLY_ONE = 'Only';

  beforeAll(async function() {
    const superAdmin = await userFactory.createNewSuperAdmin('superadm');
    await superAdmin.assignRoleToUser('superadm', ROLE_CURRICULUM_ADMIN);
    await superAdmin.assignRoleToUser('superadm', ROLE_QUESTION_ADMIN);

    const skill = {
      description: skillDescription,
      reviewMaterial: 'how to perform skill',
      difficulties: {
        [DIFFICULTY_MEDIUM]: { rubricNotes: mediumDifficultyRubricNotes },
        [DIFFICULTY_HARD]: { rubricNotes: hardDifficultyRubricNotes }
      },
      misconception,
      questionCount: 3,
    };
    await superAdmin.createSkill(skill);
    await superAdmin.createTopic({
      name: topicName,
      urlFragment: 'test-topic',
      webTitleFragment: 'Between "topic name |" and "| Oppia"',
      description: 'describe the topic',
      thumbnail: '',
      metaContent: 'test',
      assignedSkills: [skill],
      subtopics: [{
        title: 'Brief & understandable description for subtopic',
        urlFragment: 'test-subtopic',
        description: 'Detailed explanation of subtopic',
        thumbnail: 'example-topic-thumbnail.svg',
        assignedSkills: [skill]
      }],
      diagnosticTestSkills: [skill],
      isPublished: true
    });
    const topicId = await superAdmin.getTopicId();

    await superAdmin.editClassroom({ topics: [topicId] });

    questionSubmitter = (
      await userFactory.createNewQuestionSubmitter('questionsubmitter'));
  }, DEFAULT_SPEC_TIMEOUT);

  it('should suggest questions by selecting the difficulty to a lesson' +
    ' in a topic', async function() {
    await questionSubmitter.navigateToContributorDashboard();
    await questionSubmitter.navigateToSubmitQuestions();
    await questionSubmitter.expectSkillOpportunityToExist({
      topicName, skillDescription, suggestable: true
    });

    await questionSubmitter.suggestQuestionForSkillOpportunity(
      { topicName, skillDescription });
    await questionSubmitter.expectQuestionDifficultyChoices(
      {
        difficulty: DIFFICULTY_MEDIUM,
        rubricNotes: mediumDifficultyRubricNotes
      },
      {
        difficulty: DIFFICULTY_HARD,
        rubricNotes: hardDifficultyRubricNotes
      });

    await questionSubmitter.chooseDifficulty(DIFFICULTY_MEDIUM);
    await questionSubmitter.expectChosenDifficultyToBe(
      DIFFICULTY_MEDIUM);
    await questionSubmitter.expectSkillRubricNotesToHave(
      mediumDifficultyRubricNotes);
    await questionSubmitter.expectQuestionTextSection();

    await questionSubmitter.writeQuestionText(questionText);
    await questionSubmitter.expectQuestionTextToBe(questionText);

    await questionSubmitter.addInteraction();
    await questionSubmitter.expectInteractionChoices();
    await questionSubmitter.navigateToCommonInteractions();
    await questionSubmitter.chooseInteraction(
      INTERACTION_DRAG_AND_DROP_SORT);
    await questionSubmitter.expectDragAndDropSortInteractionEditor();
    await (
      questionSubmitter.expectUnmetMinimumDragAndDropSortItemCount());
    await questionSubmitter.expectDragAndDropSortItemCountToBe(1);

    await questionSubmitter.writeDragAndDropSortItems(['3', '1', '2']);
    await questionSubmitter.expectDragAndDropSortItemCountToBe(3);
    await questionSubmitter.allowMultipleSortItemsInSamePosition();
    await questionSubmitter.saveInteraction();
    await questionSubmitter.expectResponseEditor();

    await questionSubmitter.chooseResponseAssertion(
      RESPONSE_EQUAL_TO_ORDERING);
    await questionSubmitter.writeResponseFeedback(correctAnswer);
    await questionSubmitter.saveResponseAndAddAnother();
    await questionSubmitter.expectResponseEditor();
    await questionSubmitter.chooseResponseAssertion(
      RESPONSE_EQUAL_TO_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION);
    await questionSubmitter.tagResponseWithMisconception(
      misconception);
    await questionSubmitter.saveResponse();
    await questionSubmitter.expectResponseToExist({
      assertion: RESPONSE_EQUAL_TO_ORDERING,
      feedback: correctAnswer
    });
    await questionSubmitter.expectResponseToExist({
      assertion: RESPONSE_EQUAL_TO_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION,
      feedback: misconception.feedback
    });
    await questionSubmitter.expectResponseToExist({
      assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG,
      feedback: ''
    });
    await questionSubmitter.addHint(hint);
    await questionSubmitter.expectHint(hint);
    await questionSubmitter.expectMissingSolution();
    await questionSubmitter.addSolution({
      quantity: SOLUTION_QUANTITY_ONLY_ONE, solution, explanation
    });
    await questionSubmitter.expectSolutionToExist({
      solution, explanation });
    await questionSubmitter.expectDefaultOutcomeWithNoFeedback();

    await questionSubmitter.editResponse(
      { assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG, feedback: '' },
      { feedback: incorrectAnswer });
    await questionSubmitter.expectResponseToExist({
      assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG,
      feedback: incorrectAnswer
    });
    await questionSubmitter.suggestQuestion();
    await questionSubmitter.expectSuggestionSubmittedForReview();
    // TODO(#19075): After solving the aforementioned issue, change the
    // following expectation so that expected progressbar reflects said changes.
    await questionSubmitter.expectSkillOpportunityToExist({
      topicName, skillDescription,
      progress: { acceptedQuestionsPercentage }
    });
  }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
