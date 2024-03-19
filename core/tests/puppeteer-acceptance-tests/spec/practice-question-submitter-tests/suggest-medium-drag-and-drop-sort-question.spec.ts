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

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {IQuestionSubmitter} from '../../user-utilities/question-submitter-utils';
import {SkillOpportunity} from '../../user-utilities/question-submitter-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const ROLES = testConstants.Roles;

describe('Practice Question Submitter', function () {
  const topicName = 'Test Topic';
  const skillDescription = 'Counting';
  const questionText = 'Question 1: Test Question';
  const correctAnswer = 'Correct';
  const incorrectAnswer = 'Incorrect answer';
  const misconception = {
    name: '3 before 2',
    feedback: '2 to 3 (two to three)',
    mustBeTaggedToQuestion: false,
  };
  const opportunity: SkillOpportunity = {topicName, skillDescription};
  const acceptedQuestionsPercentage = 30;

  let questionSubmitter: IQuestionSubmitter;
  const ROLE_CURRICULUM_ADMIN = 'curriculum admin';
  const DIFFICULTY_MEDIUM = 'Medium';
  const DIFFICULTY_HARD = 'Hard';
  const skillDifficulties = {
    [DIFFICULTY_MEDIUM]: {rubricExplanations: ['1 to 10']},
    [DIFFICULTY_HARD]: {rubricExplanations: ['1 to 100']},
  };
  const RESPONSE_EQUAL_ORDERING = 'is equal to ordering';
  const RESPONSE_EQUAL_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION =
    'is equal to ordering with one item at incorrect position';
  const RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG = 'all other answers are wrong';
  const SOLUTION_QUANTITY_ONLY_ONE = 'Only';
  const NO_FEEDBACK = '';

  beforeAll(async function () {
    const superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
    await superAdmin.assignRoleToUser('superAdm', ROLE_CURRICULUM_ADMIN);

    const skill = {
      description: skillDescription,
      reviewMaterial: 'how to perform skill',
      difficulties: skillDifficulties,
      misconception,
      questionCount: 3,
    };
    await superAdmin.createSkill(skill);
    await superAdmin.createTopic({
      name: topicName,
      urlFragment: 'test-topic',
      webTitleFragment: 'Between "topic name |" and "| Oppia"',
      description: 'describe the topic',
      thumbnail: testConstants.images.exampleTopicThumbnailImage,
      metaContent: 'test',
      assignedSkills: [skill],
      subtopics: [
        {
          title: 'Brief & understandable description for subtopic',
          urlFragment: 'test-subtopic',
          description: 'Detailed explanation of subtopic',
          thumbnail: testConstants.images.exampleTopicThumbnailImage,
          assignedSkills: [skill],
        },
      ],
      diagnosticTestSkills: [skill],
      isPublished: true,
    });

    const topicId = await superAdmin.getTopicIdBy({name: topicName});
    await superAdmin.editClassroom({topicId});
    await superAdmin.logout();

    const questionSubmitterName = 'questionSubmitter';
    questionSubmitter = await UserFactory.createNewUser(
      questionSubmitterName,
      'questionSubmitter@example.com'
    );
    await questionSubmitter.logout();

    const questionAdmin = await UserFactory.createNewUser(
      'questionAdm',
      'questionAdmin@example.com',
      [ROLES.QUESTION_ADMIN]
    );
    await questionAdmin.addSubmitQuestionRights(questionSubmitterName);
    await questionAdmin.logout();

    await questionSubmitter.signInWithEmail('questionSubmitter@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should suggest questions by selecting the difficulty to a lesson' +
      ' in a topic',
    async function () {
      await questionSubmitter.navigateToContributorDashboard();
      await questionSubmitter.navigateToSubmitQuestionsTab();
      await questionSubmitter.expectSkillOpportunityToBeSuggestable(
        opportunity
      );

      await questionSubmitter.suggestQuestionForSkillOpportunity(opportunity);
      await questionSubmitter.expectQuestionDifficultyChoices(
        skillDifficulties
      );

      await questionSubmitter.chooseDifficulty(DIFFICULTY_MEDIUM);
      await questionSubmitter.expectChosenDifficultyToBe({
        skillDifficulties,
        difficultyName: DIFFICULTY_MEDIUM,
      });
      await questionSubmitter.expectQuestionTextSection();

      await questionSubmitter.writeQuestionText(questionText);
      await questionSubmitter.expectQuestionTextToBe(questionText);

      await questionSubmitter.addInteraction();
      await questionSubmitter.expectInteractionChoices();
      await questionSubmitter.navigateToCommonInteractions();
      await questionSubmitter.chooseInteraction(INTERACTION_DRAG_AND_DROP_SORT);
      await questionSubmitter.expectDragAndDropSortInteractionEditor();
      await questionSubmitter.expectMissingMultipleItems();
      await questionSubmitter.expectDragAndDropSortItemCountToBe(1);

      await questionSubmitter.addDragAndDropSortItems(['3', '1', '2']);
      await questionSubmitter.expectDragAndDropSortItemCountToBe(3);
      await questionSubmitter.allowMultipleSortItemsInSamePosition();
      await questionSubmitter.saveInteraction();
      await questionSubmitter.expectResponseEditor();

      await questionSubmitter.chooseResponseAssertion(RESPONSE_EQUAL_ORDERING);
      await questionSubmitter.writeResponseFeedback(correctAnswer);
      await questionSubmitter.saveResponseAndAddAnother();
      await questionSubmitter.expectResponseEditor();
      await questionSubmitter.chooseResponseAssertion(
        RESPONSE_EQUAL_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION
      );
      await questionSubmitter.tagResponseWithMisconception(misconception);
      await questionSubmitter.saveResponse();
      await questionSubmitter.expectResponseToExist({
        assertion: RESPONSE_EQUAL_ORDERING,
        feedback: correctAnswer,
      });
      await questionSubmitter.expectResponseToExist({
        assertion: RESPONSE_EQUAL_ORDERING_WITH_ONE_ITEM_AT_INCORRECT_POSITION,
        feedback: misconception.feedback,
      });
      await questionSubmitter.expectResponseToExist({
        assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG,
        feedback: NO_FEEDBACK,
      });
      await questionSubmitter.addHint(hint);
      await questionSubmitter.expectHint(hint);
      await questionSubmitter.expectMissingSolution();
      await questionSubmitter.addSolution({
        quantity: SOLUTION_QUANTITY_ONLY_ONE,
        solution,
        explanation,
      });
      await questionSubmitter.expectSolutionToExist({
        solution,
        explanation,
      });
      await questionSubmitter.expectDefaultOutcomeWithNoFeedback();

      await questionSubmitter.editResponse(
        {
          assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG,
          feedback: NO_FEEDBACK,
        },
        {
          feedback: incorrectAnswer,
        }
      );
      await questionSubmitter.expectResponseToExist({
        assertion: RESPONSE_ALL_OTHER_ANSWERS_ARE_WRONG,
        feedback: incorrectAnswer,
      });
      await questionSubmitter.suggestQuestion();
      await questionSubmitter.expectSuggestionSubmittedForReview();
      // TODO(#19075): After solving the aforementioned issue, change the
      // following expectation so that expected progressbar reflects said
      // changes.
      await questionSubmitter.expectSkillOpportunityToHaveProgress(
        opportunity,
        {acceptedQuestionsPercentage}
      );
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
