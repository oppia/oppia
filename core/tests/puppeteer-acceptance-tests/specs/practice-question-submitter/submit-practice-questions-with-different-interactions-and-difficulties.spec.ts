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
 * @fileoverview Acceptance Test for question submitters to submit practice questions with different interactions and difficulties.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {QuestionAdmin} from '../../utilities/user/question-admin';
import {QuestionSubmitter} from '../../utilities/user/question-submitter';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Question Submitter', function () {
  let curriculumAdmin: CurriculumAdmin;
  let questionAdmin: QuestionAdmin;
  let questionSubmitter: QuestionSubmitter;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create a skill and link it to a Topic.
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
    await curriculumAdmin.createSkillForTopic('Test Skill 1', 'Test Topic 1');

    // Add difficulty rubrics to the skill.
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.openSkillEditor('Test Skill 1');
    await curriculumAdmin.updateRubric('Easy', 'This is for easy questions');
    await curriculumAdmin.updateRubric(
      'Medium',
      'This is for medium questions'
    );
    await curriculumAdmin.updateRubric('Hard', 'This is for hard questions');
    await curriculumAdmin.publishUpdatedSkill('Added rubrics to skill');

    // Create a classroom and add the topic to it.
    await curriculumAdmin.createNewClassroom(
      'Test Classroom 1',
      'test-classroom-one'
    );
    await curriculumAdmin.addTopicToClassroom(
      'Test Classroom 1',
      'Test Topic 1'
    );

    questionAdmin = await UserFactory.createNewUser(
      'questionAdm',
      'question_admin@example.com',
      [ROLES.QUESTION_ADMIN]
    );

    questionSubmitter = await UserFactory.createNewUser(
      'questionSubmitter',
      'question_submitter@example.com'
    );

    // Add submit question rights to the question submitter.
    await questionAdmin.navigateToContributorDashboardAdminPage();
    await questionAdmin.addSubmitQuestionRights('questionSubmitter');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should submit question suggestion with images and math expressions and image interaction with easy difficulty',
    async () => {
      await questionSubmitter.navigateToContributorDashboard();
      await questionSubmitter.suggestQuestionsForSkillandTopic(
        'Test Skill 1',
        'Test Topic 1'
      );
      await questionSubmitter.selectQuestionDifficulty('Easy');

      await questionSubmitter.seedTextToQuestion('Test Question 1');
      await questionSubmitter.addMathExpressionToQuestion();
      await questionSubmitter.addImageToQuestion();

      await questionSubmitter.addImageInteractionInQuestionEditor();

      await questionSubmitter.addHintToState('Test Hint 1');
      await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
        'Wrong Answer'
      );
      await questionSubmitter.submitQuestionSuggestion();

      await questionSubmitter.expectQuestionSuggestionInContributorDashboard(
        '[Image] Test Question 1 [Math]'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should submit question suggestion with images and math expressions and multiple choice interaction with medium difficulty',
    async () => {
      await questionSubmitter.navigateToContributorDashboard();
      await questionSubmitter.suggestQuestionsForSkillandTopic(
        'Test Skill 1',
        'Test Topic 1'
      );
      await questionSubmitter.selectQuestionDifficulty('Medium');

      await questionSubmitter.seedTextToQuestion('Test Question 2');
      await questionSubmitter.addMathExpressionToQuestion();
      await questionSubmitter.addImageToQuestion();

      await questionSubmitter.addMultipleChoiceInteractionByQuestionSubmitter([
        'Option 1',
        'Option 2',
        'Option 3',
        'Option 4',
      ]);

      await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
        'Wrong Answer'
      );
      await questionSubmitter.addHintToState('Test Hint 2');
      await questionSubmitter.submitQuestionSuggestion();

      await questionSubmitter.expectQuestionSuggestionInContributorDashboard(
        '[Image] Test Question 2 [Math]'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should submit question suggestion with images and math expressions and text input interaction with hard difficulty',
    async () => {
      await questionSubmitter.navigateToContributorDashboard();
      await questionSubmitter.suggestQuestionsForSkillandTopic(
        'Test Skill 1',
        'Test Topic 1'
      );
      await questionSubmitter.selectQuestionDifficulty('Hard');

      await questionSubmitter.seedTextToQuestion('Test Question 3');
      await questionSubmitter.addMathExpressionToQuestion();
      await questionSubmitter.addImageToQuestion();

      await questionSubmitter.addTextInputInteractionInQuestionEditor('Answer');

      await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
        'Wrong Answer'
      );
      await questionSubmitter.addHintToState('Test Hint 3');
      await questionSubmitter.addSolutionToState(
        'Answer',
        'Test Solution 1',
        false
      );
      await questionSubmitter.submitQuestionSuggestion();

      await questionSubmitter.expectQuestionSuggestionInContributorDashboard(
        '[Image] Test Question 3 [Math]'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should view all the previous submissions in the contributor dashboard',
    async () => {
      await questionSubmitter.viewQuestionSuggestion(
        '[Image] Test Question 1 [Math]'
      );
      await questionSubmitter.expectQuestionSuggestionModalToHaveDifficulty(
        'Easy'
      );

      await questionSubmitter.viewQuestionSuggestion(
        '[Image] Test Question 2 [Math]'
      );
      await questionSubmitter.expectQuestionSuggestionModalToHaveDifficulty(
        'Medium'
      );

      await questionSubmitter.viewQuestionSuggestion(
        '[Image] Test Question 3 [Math]'
      );
      await questionSubmitter.expectQuestionSuggestionModalToHaveDifficulty(
        'Hard'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
