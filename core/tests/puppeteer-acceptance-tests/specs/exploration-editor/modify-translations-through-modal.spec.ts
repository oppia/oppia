// Copyright 2024 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use explorationEditor file except in compliance with the License.
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
 * @fileoverview Acceptance Test for translation modification modal in exploration editor.
 */
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {showMessage} from '../../utilities/common/show-message';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {TopicManager} from '../../utilities/user/topic-manager';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

const INTRODUCTION_CARD_CONTENT: string =
  'This exploration will test your understanding of negative numbers.';
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
  MULTIPLE_CHOICE = 'Multiple Choice',
  TEXT_INPUT = 'Text Input',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  MULTIPLE_CHOICE_QUESTION = 'Multiple Choice',
  TEXT_QUESTION = 'Text Input',
  FINAL_CARD = 'Final Card',
}

ConsoleReporter.setConsoleErrorsToIgnore([
  /Error: Occurred at http:\/\/localhost:8181\/story_editor\/[a-zA-Z0-9]+\/.*Cannot read properties of undefined \(reading 'getStory'\)/,
  /Error: Occurred at http:\/\/localhost:8181\/create\/[a-zA-Z0-9]+\/.*Invalid active state name: null/,
]);

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & TopicManager;
  let explorationId: string | null;
  let topicId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Navigate to the creator dashboard and create a new exploration.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(INTRODUCTION_CARD_CONTENT);
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(
      CARD_NAME.MULTIPLE_CHOICE_QUESTION
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.MULTIPLE_CHOICE_QUESTION);
    await explorationEditor.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await explorationEditor.addMultipleChoiceInteraction([
      '-99',
      '-101',
      '0',
      '101',
    ]);
    await explorationEditor.addResponseToTheInteraction(
      INTERACTION_TYPES.MULTIPLE_CHOICE,
      '-99',
      'Perfect!',
      CARD_NAME.TEXT_QUESTION,
      true
    );
    await explorationEditor.addDefaultResponseFeedback('Wrong.');
    await explorationEditor.addHintToState(
      'It is closer to zero but not a positive number.'
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.TEXT_QUESTION);
    await explorationEditor.updateCardContent(
      'What is the sign to represent negative numbers called?'
    );
    await explorationEditor.addTextInputInteraction();
    await explorationEditor.addResponseToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'minus',
      'Correct!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.addDefaultResponseFeedback('Wrong.');
    await explorationEditor.addSolutionToState(
      'minus',
      'Minus is the opposite of plus.'
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();

    explorationId = await explorationEditor.publishExplorationWithContent(
      'Test Exploration',
      'This is a test exploration.',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
    await curriculumAdmin.createSubtopicForTopic(
      'Test Subtopic 1',
      'test-subtopic-one',
      'Test Topic 1'
    );

    await curriculumAdmin.createSkillForTopic('Test Skill 1', 'Test Topic 1');
    await curriculumAdmin.createQuestionsForSkill('Test Skill 1', 3);
    await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
      'Test Skill 1',
      'Test Subtopic 1',
      'Test Topic 1'
    );
    await curriculumAdmin.addSkillToDiagnosticTest(
      'Test Skill 1',
      'Test Topic 1'
    );

    await curriculumAdmin.publishDraftTopic('Test Topic 1');
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Test Story 1',
      'test-story-one',
      explorationId,
      'Test Topic 1'
    );

    topicId = await curriculumAdmin.getTopicId('Test Topic 1');
    if (!topicId) {
      throw new Error('Error publishing topic successfully.');
    }

    await curriculumAdmin.createNewClassroom('Test Class', 'test');
    await curriculumAdmin.addTopicToClassroom('Test Class', topicId);
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should show translations of main content in the modal.',
    async function () {
      await explorationEditor.page.bringToFront();
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToTranslationsTab();
      await explorationEditor.dismissTranslationTabWelcomeModal();
      await explorationEditor.editTranslationOfContent(
        'de',
        CARD_NAME.INTRODUCTION,
        'Interaction',
        'Translation'
      );
      showMessage('explorationEditor is signed up successfully.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
