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
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

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
  /Occurred at http:\/\/localhost:8181\/story_editor\/[a-zA-Z0-9]+\/.*Cannot read properties of undefined \(reading 'getStory'\)/,
  /Occurred at http:\/\/localhost:8181\/create\/[a-zA-Z0-9]+\/.*Invalid active state name: null/,
  new RegExp('Invalid active state name: null'),
]);

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
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
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    // Enable the feature flag.
    await releaseCoordinator.enableFeatureFlag(
      'exploration_editor_can_modify_translations'
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
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.MULTIPLE_CHOICE,
      '-99',
      'Perfect!',
      CARD_NAME.TEXT_QUESTION,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong.');
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
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'minus',
      'Correct!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong.');
    await explorationEditor.addSolutionToState(
      'minus',
      'Minus is the opposite of plus.',
      false
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

    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Test Exploration',
      'This is a test exploration.',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error in publishing exploration successfully.');
    }

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    topicId = await curriculumAdmin.createTopic(
      'Test Topic 1',
      'test-topic-one'
    );
    if (!topicId) {
      throw new Error('Error in publishing topic successfully.');
    }

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
      'Test Chapter 1',
      explorationId,
      'Test Topic 1'
    );
    // We set an increased custom timeout since the setup takes too long unlike other specs.
  }, 400000);

  it(
    'should show translations of main content and edit them via the modal.',
    async function () {
      await explorationEditor.page.bringToFront();
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
      await explorationEditor.navigateToTranslationsTab();
      await explorationEditor.dismissTranslationTabWelcomeModal();
      await explorationEditor.editTranslationOfContent(
        'de',
        'Content',
        'Content translation text'
      );
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.updateCardContent('Content text.');
      await explorationEditor.openModifyExistingTranslationsModal();
      await explorationEditor.verifyTranslationInModifyTranslationsModal(
        'de',
        'Content translation text'
      );
      await explorationEditor.updateTranslationFromModal(
        'de',
        'Content',
        'New content translation text.'
      );
      await explorationEditor.verifyTranslationInTranslationsTab(
        'New content translation text.',
        'Content'
      );
      showMessage('The content translation has been verified successfully.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show translations of interactions and edit them via the modal.',
    async function () {
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(CARD_NAME.TEXT_QUESTION);
      await explorationEditor.navigateToTranslationsTab();
      await explorationEditor.editTranslationOfContent(
        'de',
        'Interaction',
        'Interaction translation text'
      );
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.updateTextInputInteraction(
        'Interaction text content.'
      );
      await explorationEditor.openModifyExistingTranslationsModal();
      await explorationEditor.verifyTranslationInModifyTranslationsModal(
        'de',
        'Interaction translation text'
      );
      await explorationEditor.updateTranslationFromModal(
        'de',
        'Interaction',
        'New interaction translation text.'
      );
      await explorationEditor.verifyTranslationInTranslationsTab(
        'New interaction translation text.',
        'Interaction'
      );
      showMessage(
        'The interaction translation has been verified successfully.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show translations of hints and edit them via the modal.',
    async function () {
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(
        CARD_NAME.MULTIPLE_CHOICE_QUESTION
      );
      await explorationEditor.navigateToTranslationsTab();
      if (explorationEditor.isViewportAtMobileWidth()) {
        await explorationEditor.closeEditorNavigationDropdownOnMobile();
      }
      await explorationEditor.editTranslationOfContent(
        'de',
        'Hint',
        'Hint translation text'
      );
      await explorationEditor.navigateToEditorTab();
      if (explorationEditor.isViewportAtMobileWidth()) {
        await explorationEditor.closeEditorNavigationDropdownOnMobile();
      }
      await explorationEditor.updateHint('Hint content.');
      await explorationEditor.openModifyExistingTranslationsModal();
      await explorationEditor.verifyTranslationInModifyTranslationsModal(
        'de',
        'Hint translation text'
      );
      await explorationEditor.updateTranslationFromModal(
        'de',
        'Hint',
        'New hint translation text.'
      );
      await explorationEditor.verifyTranslationInTranslationsTab(
        'New hint translation text.',
        'Hint'
      );
      showMessage('The hint translation has been verified successfully.');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show translations of solution explanations and edit them via the modal.',
    async function () {
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(CARD_NAME.TEXT_QUESTION);
      await explorationEditor.navigateToTranslationsTab();
      await explorationEditor.editTranslationOfContent(
        'de',
        'Solution',
        'Solution explanation translation text'
      );
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.updateSolutionExplanation(
        'Solution explanation.'
      );
      await explorationEditor.openModifyExistingTranslationsModal();
      await explorationEditor.verifyTranslationInModifyTranslationsModal(
        'de',
        'Solution explanation translation text'
      );
      await explorationEditor.updateTranslationFromModal(
        'de',
        'Solution',
        'New solution explanation translation text.'
      );
      await explorationEditor.verifyTranslationInTranslationsTab(
        'New solution explanation translation text.',
        'Solution'
      );
      showMessage(
        'The solution explanation translation has been verified successfully.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show translations of response feedback and edit them via the modal.',
    async function () {
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(
        CARD_NAME.MULTIPLE_CHOICE_QUESTION
      );
      await explorationEditor.navigateToTranslationsTab();
      await explorationEditor.editTranslationOfContent(
        'de',
        'Feedback',
        'Response feedback translation text',
        1
      );
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.editDefaultResponseFeedback('Feedback content.');
      await explorationEditor.openModifyExistingTranslationsModal();
      await explorationEditor.verifyTranslationInModifyTranslationsModal(
        'de',
        'Response feedback translation text'
      );
      await explorationEditor.updateTranslationFromModal(
        'de',
        'Feedback',
        'New feedback translation text.'
      );
      await explorationEditor.verifyTranslationInTranslationsTab(
        'New feedback translation text.',
        'Feedback',
        1
      );
      showMessage(
        'The response feedback translation has been verified successfully.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
