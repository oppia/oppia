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
 * TM.SE Topic manager create and edit questions in skills dashboard
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager & CurriculumAdmin & ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_adm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    const explorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Solving problems without a calculator',
        'Mathematics'
      );
    await curriculumAdmin.createAndPublishTopic(
      'Arithmetic Operations',
      'Addition',
      'Addition'
    );
    await curriculumAdmin.addStoryToTopic(
      'The Broken Calculator',
      'the-broken-calculator',
      'Arithmetic Operations'
    );
    await curriculumAdmin.addChapter(
      'Solving problems without a calculator',
      explorationId
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Maths',
      'maths',
      'Arithmetic Operations'
    );

    // Create more topics and skills.
    await curriculumAdmin.createTopic('Whole Numbers', 'whole-numbers');
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Subtraction',
      'Review Material for Subtraction'
    );
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Word Problems',
      'Review Material for Word Problems'
    );

    // Create topic manager user.
    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Arithmetic Operations'
    );
  }, 600000);

  it('should be able to add questions to skills using the skill editor', async function () {
    await topicManager.openSkillEditor('Addition');
    await topicManager.addMisconception(
      'Lining up the numbers incorrectly',
      'The numbers are not lining up correctly.',
      'Feedback for Lining up the numbers incorrectly.',
      true
    );
    await topicManager.publishUpdatedSkill('Updated review material');

    // Image Region.
    await topicManager.clickOnCreateNewQuestionButtonInSkillEditor();
    await topicManager.updateCardContent('Select bottom half of the image');
    await topicManager.addImageInteraction();
    await topicManager.toggleMisconceptionApplicableStatus(
      'Lining up the numbers incorrectly'
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await topicManager.addHintToState('Select button half of the image.');
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible(
      'Select bottom half of the image'
    );

    // Item Selection.
    await topicManager.clickOnAddQuestionButton();
    await topicManager.updateCardContent('Select any one correct option.');
    await topicManager.addInteraction(INTERACTION_TYPES.ITEM_SELECTION, false);
    await topicManager.customizeItemSelectionInteraction(
      ['Option 1', 'Option 2', 'Correct Option 1', 'Correct Option 2'],
      1,
      2
    );
    // Correct Response.
    await topicManager.updateItemSelectionLearnersAnswerInResponseModal(
      'contains at least one of',
      ['Correct Option 1', 'Correct Option 2']
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Great!',
      undefined,
      true,
      false
    );
    // Incorrect Response.
    await topicManager.updateItemSelectionLearnersAnswerInResponseModal(
      'contains at least one of',
      ['Option 1', 'Option 2']
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Wrong',
      undefined,
      false,
      true
    );
    await topicManager.tagAnswerGroupWithMisconceptionInQuestionEditor(
      1,
      'Lining up the numbers incorrectly',
      true
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await topicManager.addHintToState('Select any of the correct option.');
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible(
      'Select any one correct option.'
    );

    // Multiple Choice Interaction.
    await topicManager.clickOnAddQuestionButton();
    await topicManager.updateCardContent('Select the correct option.');
    await topicManager.addMultipleChoiceInteraction([
      'Option 1',
      'Option 2',
      'Correct Response',
      'Not correct response',
    ]);
    await topicManager.updateMultipleChoiceLearnersAnswerInResponseModal(
      'is equal to',
      'Correct Response'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Great!',
      undefined,
      true,
      false
    );
    await topicManager.updateMultipleChoiceLearnersAnswerInResponseModal(
      'is equal to',
      'Not correct response'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Wrong Answer',
      undefined,
      false
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await topicManager.tagAnswerGroupWithMisconceptionInQuestionEditor(
      1,
      'Lining up the numbers incorrectly',
      true
    );
    await topicManager.addHintToState('Select the correct option.');
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible('Select the correct option.');

    // Text Input Interaction.
    await topicManager.clickOnAddQuestionButton();
    await topicManager.updateCardContent('Enter text input.');
    await topicManager.addTextInputInteraction();
    await topicManager.updateAnswersInResponseModal(
      INTERACTION_TYPES.TEXT_INPUT,
      'Hello, Oppia!'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Great!',
      undefined,
      true,
      false
    );
    await topicManager.updateAnswersInResponseModal(
      INTERACTION_TYPES.TEXT_INPUT,
      'Hello'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Wrong Answer',
      undefined,
      false
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer'
    );
    await topicManager.tagAnswerGroupWithMisconceptionInQuestionEditor(
      1,
      'Lining up the numbers incorrectly',
      true
    );
    await topicManager.addHintToState('Test Hint 3');
    await topicManager.addSolutionToState(
      'Hello, Oppia!',
      'Test Solution 1',
      false
    );
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible('Enter text input.');

    // Drag and Drop Sort Interaction.
    await topicManager.clickOnAddQuestionButton();
    await topicManager.updateCardContent('Drag and Drop Sort.');
    await topicManager.addInteraction(
      INTERACTION_TYPES.DRAG_AND_DROP_SORT,
      false
    );
    await topicManager.customizeDragAndDropSortInteraction([
      'First',
      'Third',
      'Second',
    ]);
    await topicManager.updateDragAndDropSortLearnersAnswerInResponseModal(
      'is equal to ordering ...',
      [1, 3, 2]
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Great!',
      undefined,
      true,
      false
    );
    await topicManager.updateDragAndDropSortLearnersAnswerInResponseModal(
      'is equal to ordering ...',
      [3, 1, 2]
    );
    await topicManager.addResponseDetailsInResponseModal(
      "Wrong it's in decreasing order",
      undefined,
      false
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer'
    );
    await topicManager.tagAnswerGroupWithMisconceptionInQuestionEditor(
      1,
      'Lining up the numbers incorrectly',
      true
    );
    await topicManager.addHintToState('Test Hint 4');
    await topicManager.addDragAndDropSortSolution(
      ['First', 'Second', 'Third'],
      'As given in the question.'
    );
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible('Drag and Drop Sort.');

    // Number Input Interaction.
    await topicManager.clickOnAddQuestionButton();
    await topicManager.updateCardContent('Number Input.');
    await topicManager.addInteraction(INTERACTION_TYPES.NUMBER_INPUT, false);
    await topicManager.customizeNumberInputInteraction(true);
    await topicManager.updateAnswersInResponseModal(
      INTERACTION_TYPES.NUMBER_INPUT,
      '100'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Great!',
      undefined,
      true,
      false
    );
    await topicManager.updateAnswersInResponseModal(
      INTERACTION_TYPES.NUMBER_INPUT,
      '1000'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Wrong',
      undefined,
      false
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer'
    );
    await topicManager.tagAnswerGroupWithMisconceptionInQuestionEditor(
      1,
      'Lining up the numbers incorrectly',
      true
    );
    await topicManager.addHintToState('Test Hint 5');
    await topicManager.addSolutionToState(
      '100',
      'As said in the question itself.',
      true
    );
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible('Number Input.');

    // Fraction Input Interaction.
    await topicManager.clickOnAddQuestionButton();
    await topicManager.updateCardContent('Enter 1/2.');
    await topicManager.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
    await topicManager.updateAnswersInResponseModal(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Great!',
      undefined,
      true,
      false
    );
    await topicManager.updateAnswersInResponseModal(
      INTERACTION_TYPES.FRACTION_INPUT,
      '1'
    );
    await topicManager.addResponseDetailsInResponseModal(
      'Wrong',
      undefined,
      false
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer'
    );
    await topicManager.tagAnswerGroupWithMisconceptionInQuestionEditor(
      1,
      'Lining up the numbers incorrectly',
      true
    );
    await topicManager.addHintToState('Test Hint 6');
    await topicManager.addSolutionToState(
      '1/2',
      'As given in the question.',
      true
    );
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible('Enter 1/2.');

    // Number with Units Interaction.
    await topicManager.clickOnAddQuestionButton();
    await topicManager.updateCardContent('Enter 160km.');
    await topicManager.addInteraction(
      INTERACTION_TYPES.NUMBER_WITH_UNITS,
      false
    );
    await topicManager.fillValueInInteractionResponseModal('160km', 'input');
    await topicManager.addResponseDetailsInResponseModal(
      'Great!',
      undefined,
      true,
      false
    );
    await topicManager.fillValueInInteractionResponseModal('100km', 'input');
    await topicManager.addResponseDetailsInResponseModal(
      'Wrong',
      undefined,
      false
    );
    await topicManager.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer'
    );
    await topicManager.tagAnswerGroupWithMisconceptionInQuestionEditor(
      1,
      'Lining up the numbers incorrectly',
      true
    );
    await topicManager.addHintToState('Test Hint');
    await topicManager.addSolutionToState(
      '160km',
      'As given in the question.',
      true
    );
    await topicManager.saveQuestion();
    await topicManager.expectQuestionToBeVisible('Enter 160km.');

    // Navigate to the preview tab.
    // TODO(#23453): Currently, there is issue where all questions are not previewed
    // await topicManager.navigateToSkillPreviewTab();
    // in the preview tab. Once fixed, uncomment the below line.
    // for (const question of [
    //   'Select bottom half of the image',
    //   'Select any one correct option.',
    //   'Select the correct option.',
    //   'Enter text input.',
    //   'Drag and Drop Sort',
    //   'Number Input',
    //   'Enter 1/2',
    //   'Enter 160km',
    // ]) {
    //   await topicManager.expectQuestionToPreviewProperly(question);
    // }
  });

  it('should be able to edit questions in skills editor', async function () {
    await topicManager.openSkillEditor('Addition');
    await topicManager.updateRubric('Hard', 'This is for hard questions.');
    await topicManager.publishSkillChanges();

    await topicManager.navigateToSkillQuestionEditorTab();
    await topicManager.openQuestionEditor('Enter 160km.');
    await topicManager.selectQuestionDifficultyInQuestionEditor('Hard');
    await topicManager.updateCardContent('Enter 25km');
    await topicManager.updateHint('This is the new hint.');
    await topicManager.updateSolution(
      '25 km',
      'This is the new solution explanation.'
    );

    await topicManager.expectScreenshotToMatch(
      'updatedQuestionInQuestionEditor',
      __dirname
    );

    // TODO(#23439): Currently, the input field is covered by submit and cancel button.
    // Once fixed, uncomment step and expectation below.
    // await topicManager.updateResponse(0, '25km', 'This is the new feedback.');
    // await topicManager.expectSaveQuestionButtonToBeEnabled();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
