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
 * QS.CD Submit Practice Questions for review and check their status.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Contributor} from '../../utilities/user/contributor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {PracticeQuestionReviewer} from '../../utilities/user/practice-question-reviewer';
import {PracticeQuestionSubmitter} from '../../utilities/user/practice-question-submitter';
import {QuestionAdmin} from '../../utilities/user/question-admin';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

Error.stackTraceLimit = 30;

describe('Practice Question Submitter', function () {
  let questionSubmitter: PracticeQuestionSubmitter &
    Contributor &
    ExplorationEditor &
    LoggedInUser;
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let questionAdmin: QuestionAdmin;
  let questionReviewer: PracticeQuestionReviewer & LoggedInUser;

  beforeAll(async function () {
    // Create users.
    questionSubmitter = await UserFactory.createNewUser(
      'questionSubmitter',
      'question_submitter@example.com'
    );

    questionReviewer = await UserFactory.createNewUser(
      'questionReviewer',
      'question_reviewer@example.com'
    );

    questionAdmin = await UserFactory.createNewUser(
      'questionAdm',
      'question_admin@example.com',
      [ROLES.QUESTION_ADMIN]
    );

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Add submit question rights to the question submitter.
    await questionAdmin.navigateToContributorDashboardAdminPage();
    await questionAdmin.addSubmitQuestionRights('questionSubmitter');
    await questionAdmin.addReviewQuestionRights('questionReviewer');

    // Create a topic and add story with a chapter.
    const explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'Test Exploration 1'
      );

    await curriculumAdmin.createAndPublishTopic(
      'Arithmetic Operations',
      'Addition and Subtraction',
      'Addition'
    );
    await curriculumAdmin.addStoryToTopic(
      'The Broken Calculator',
      'the-broken-calculator',
      'Arithmetic Operations'
    );
    await curriculumAdmin.openStoryEditor(
      'The Broken Calculator',
      'Arithmetic Operations'
    );
    await curriculumAdmin.addChapter(
      'Addition without a calculator',
      explorationId1
    );

    // Update skill rubric.
    await curriculumAdmin.openSkillEditor('Addition');
    await curriculumAdmin.updateRubric('Hard', 'This is for hard questions');
    await curriculumAdmin.updateRubric('Easy', 'This is for easy questions');
    await curriculumAdmin.updateRubric(
      'Medium',
      'This is for medium questions'
    );
    await curriculumAdmin.updateRubric('Hard', 'This is for hard questions');
    await curriculumAdmin.publishUpdatedSkill('Added rubrics to skill');

    // Add topic the Math classroom.
    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math-classroom',
      'Arithmetic Operations'
    );
  }, 600000);

  it('should be able to submit practice questions', async function () {
    // Go to the contribution dashboard.
    await questionSubmitter.navigateToContributorDashboardUsingProfileDropdown();

    await questionSubmitter.expectScreenshotToMatch(
      'emptyPracticeQuestionOpportunities',
      __dirname
    );

    // Go to "Submit Questions" tab.
    await questionSubmitter.switchToTabInContributionDashboard(
      'Submit Question'
    );
    // Wait for the opportunities to load, so that screenshot comparasion is
    // not flaky.
    await questionSubmitter.expectOpportunityToBePresent(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.expectScreenshotToMatch(
      'practiceQuestionSubmissionTab',
      __dirname
    );

    // Submit an easy question.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Easy');
    await questionSubmitter.seedTextToQuestion('What is 2 + 3?');
    await questionSubmitter.addMultipleChoiceInteractionByQuestionSubmitter([
      '5',
      '-1',
      '6',
      '1.5',
    ]);
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState('1 + 2 = 3');
    await questionSubmitter.submitQuestionSuggestion();

    // Submit a medium question.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Medium');
    await questionSubmitter.seedTextToQuestion('14 + 12');
    await questionSubmitter.addMultipleChoiceInteractionByQuestionSubmitter([
      '26',
      '12',
      '16',
      '18',
    ]);
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState('1 + 2 = 3');
    await questionSubmitter.submitQuestionSuggestion();

    // Submit a hard question.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Hard');
    await questionSubmitter.seedTextToQuestion('What is 10 + 11?');
    await questionSubmitter.addMultipleChoiceInteractionByQuestionSubmitter([
      '13',
      '10',
      '11',
      '12',
    ]);
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState('1 + 2 = 3');
    await questionSubmitter.submitQuestionSuggestion();

    // Verify that the questions are submitted successfully.
    await questionSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );
    await questionSubmitter.expectOpportunityToBePresent(
      'What is 2 + 3?',
      'Addition'
    );
    await questionSubmitter.expectContributionStatusToBe(
      'What is 2 + 3?',
      'Addition',
      'Awaiting review'
    );
  });

  it('should be able to check question status', async function () {
    // Reject the question suggestion.
    await questionReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await questionReviewer.startQuestionReview('What is 10 + 11?', 'Addition');
    await questionReviewer.submitReview('reject', 'No answer is correct.');
    // Edit the question suggestion.
    await questionReviewer.startQuestionReview('14 + 12', 'Addition');
    await questionReviewer.editQuestionInReview('What is 14 + 12?');
    await questionReviewer.submitReview('accept');
    // Accept the question suggestion.
    await questionReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await questionReviewer.startQuestionReview('What is 2 + 3?', 'Addition');
    await questionReviewer.submitReview('accept');

    // Check question status.
    await questionSubmitter.page.reload();
    await questionSubmitter.expectContributionStatusToBe(
      'What is 2 + 3?',
      'Addition',
      'Accepted'
    );
    await questionSubmitter.expectContributionStatusToBe(
      'What is 14 + 12?',
      'Addition',
      'Accepted'
    );
    await questionSubmitter.expectContributionStatusToBe(
      'What is 10 + 11?',
      'Addition',
      'Revisions Requested'
    );
  });

  it('should be able to use all interactions in the question', async function () {
    await questionSubmitter.switchToTabInContributionDashboard(
      'Submit Question'
    );

    // Image Region Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Easy');
    await questionSubmitter.seedTextToQuestion('What is 10 + 11?');
    await questionSubmitter.addImageInteractionInQuestionEditor();
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer.'
    );
    await questionSubmitter.addHintToState(
      'Select area in the bottom of the image.'
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Item Selection Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Medium');
    await questionSubmitter.seedTextToQuestion('What is 14 + 12?');
    await questionSubmitter.addInteraction(
      INTERACTION_TYPES.ITEM_SELECTION,
      false
    );
    await questionSubmitter.customizeItemSelectionInteraction(
      ['Option 1', 'Option 2', 'Correct Option 1', 'Correct Option 2'],
      1,
      2
    );
    await questionSubmitter.updateItemSelectionLearnersAnswerInResponseModal(
      'contains at least one of',
      ['Correct Option 1', 'Correct Option 2']
    );
    await questionSubmitter.addResponseDetailsInQuestionResponseModal(
      'Great!',
      true
    );
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer. Please try again'
    );
    await questionSubmitter.addHintToState('Select the correct option.');
    await questionSubmitter.submitQuestionSuggestion();

    // Multiple Choice Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Medium');
    await questionSubmitter.seedTextToQuestion('What is 12 + 13?');
    await questionSubmitter.addMultipleChoiceInteraction([
      'Option 1',
      'Option 2',
      'Correct Response',
      'Option 4',
    ]);
    await questionSubmitter.updateMultipleChoiceLearnersAnswerInResponseModal(
      'is equal to',
      'Correct Response'
    );
    await questionSubmitter.addResponseDetailsInQuestionResponseModal(
      'Great!',
      true
    );
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer. Please try again'
    );
    await questionSubmitter.addHintToState('Select the correct option.');
    await questionSubmitter.submitQuestionSuggestion();

    // Text Input Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Hard');
    await questionSubmitter.seedTextToQuestion('What is 10 + 11?');
    await questionSubmitter.addTextInputInteractionInQuestionEditor(
      'Correct Answer'
    );
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState('Test Hint 3');
    await questionSubmitter.addSolutionToState(
      'Correct Answer',
      'Test Solution 1',
      false
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Drag and Drop Sort Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Hard');
    await questionSubmitter.seedTextToQuestion('What is 14 + 12?');
    await questionSubmitter.addInteraction(
      INTERACTION_TYPES.DRAG_AND_DROP_SORT,
      false
    );
    await questionSubmitter.customizeDragAndDropSortInteraction([
      'First',
      'Third',
      'Second',
    ]);
    await questionSubmitter.updateDragAndDropSortLearnersAnswerInResponseModal(
      'is equal to ordering ...',
      [1, 3, 2]
    );
    await questionSubmitter.addResponseDetailsInQuestionResponseModal(
      'Great!',
      true
    );
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Try Again!'
    );
    await questionSubmitter.addHintToState('Arrage in ascending order');
    await questionSubmitter.addDragAndDropSortSolution(
      ['First', 'Second', 'Third'],
      'As given in the question.'
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Number Input Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Hard');
    await questionSubmitter.seedTextToQuestion('What is 10 + 11?');
    await questionSubmitter.addInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      false
    );
    await questionSubmitter.customizeNumberInputInteraction(true);
    await questionSubmitter.fillValueInInteractionResponseModal('100', 'input');
    await questionSubmitter.addResponseDetailsInQuestionResponseModal(
      'Perfect!'
    );

    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState('Test Hint 3');
    await questionSubmitter.addSolutionToState(
      '100',
      'As said in the question itself.',
      true
    );
    await questionSubmitter.expectSolutionsToContain(
      'One solution is "100". As said in the question itself..'
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Fraction Input Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Hard');
    await questionSubmitter.seedTextToQuestion('What is 10/11?');
    await questionSubmitter.addInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      true
    );
    await questionSubmitter.fillValueInInteractionResponseModal('2', 'input');
    await questionSubmitter.addResponseDetailsInQuestionResponseModal(
      'Perfect!'
    );
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState('Test Hint');
    await questionSubmitter.addSolutionToState(
      '1/2',
      'As given in the question.',
      true
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Number With Units Interaction.
    await questionSubmitter.suggestQuestionsForSkillandTopic(
      'Addition',
      'Arithmetic Operations'
    );
    await questionSubmitter.selectQuestionDifficulty('Hard');
    await questionSubmitter.seedTextToQuestion('What is 10km + 11km?');
    await questionSubmitter.addInteraction(
      INTERACTION_TYPES.NUMBER_WITH_UNITS,
      false
    );
    await questionSubmitter.fillValueInInteractionResponseModal(
      '21km',
      'input'
    );
    await questionSubmitter.addResponseDetailsInQuestionResponseModal(
      'Perfect!'
    );
    await questionSubmitter.editDefaultResponseFeedbackInQuestionEditorPage(
      'Wrong Answer'
    );
    await questionSubmitter.addHintToState('Test Hint');
    await questionSubmitter.addSolutionToState(
      '21km',
      'As given in the question.',
      true
    );
    await questionSubmitter.submitQuestionSuggestion();

    // Verify question submitted.
    await questionSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );
    await questionSubmitter.expectContributionStatusToBe(
      'What is 10km + 11km?',
      'Addition',
      'Awaiting review'
    );
    await questionSubmitter.viewSubmittedQuestion(
      'What is 10km + 11km?',
      'Addition'
    );
    await questionSubmitter.expectScreenshotToMatch(
      'questionContributionPreviewModal',
      __dirname
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
