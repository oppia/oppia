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
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

const INTRODUCTION_CARD_CONTENT: string =
  'This exploration will test your understanding of negative numbers.';
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  END_EXPLORATION = 'End Exploration',
  MULTIPLE_CHOICE = 'Multiple Choice',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  MULTIPLE_CHOICE_QUESTION = 'Multiple Choice',
  FINAL_CARD = 'Final Card',
}

ConsoleReporter.setConsoleErrorsToIgnore([
  /Occurred at http:\/\/localhost:8181\/story_editor\/[a-zA-Z0-9]+\/.*Cannot read properties of undefined \(reading 'getStory'\)/,
  /Occurred at http:\/\/localhost:8181\/create\/[a-zA-Z0-9]+\/.*Invalid active state name: null/,
  new RegExp('Invalid active state name: null'),
]);

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor & TopicManager;
  let curriculumAdmin: CurriculumAdmin & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId: string | null;

  beforeAll(async function () {
    // We assign curriculum admin privileges to the exploration editor in
    // order to provide the ability to link particular state cards of
    // explorations with skills, which will often be repeated to test
    // the exploration editor user journey.
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      [ROLES.CURRICULUM_ADMIN]
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
      'exploration_editor_can_tag_misconceptions'
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
      CARD_NAME.FINAL_CARD,
      true,
      false
    );
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.MULTIPLE_CHOICE,
      '-101',
      'Wrong! -101 is smaller than -100.',
      '',
      false
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong.');
    await explorationEditor.addHintToState(
      'It is closer to zero but not a positive number.'
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

    await curriculumAdmin.openSkillEditor('Test Skill 1');
    await curriculumAdmin.addMisconception(
      'Addition Misconception',
      'Some might think 2 + 3 = 23.',
      'The correct answer is 5.'
    );
    await curriculumAdmin.addMisconception(
      'Subtraction Misconception',
      'Some might think 11 - 1 = 1.',
      'The correct answer is 10.',
      true
    );
    await curriculumAdmin.publishUpdatedSkill('Update');

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
    'should show the relevant linked misconception in state editor.',
    async function () {
      await explorationEditor.page.bringToFront();
      // We reload the page here and elsewhere in order to fetch the curated version of the
      // exploration since it isn't curated by default on initialization.
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(
        CARD_NAME.MULTIPLE_CHOICE_QUESTION
      );
      await explorationEditor.addSkillToState('Test Skill 1');
      await explorationEditor.verifyMisconceptionPresentForState(
        'Addition Misconception',
        true
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should allow user to mark misconceptions as inapplicable.',
    async function () {
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(
        CARD_NAME.MULTIPLE_CHOICE_QUESTION
      );
      await explorationEditor.toggleMisconceptionApplicableStatus(
        'Subtraction Misconception'
      );
      await explorationEditor.verifyOptionalMisconceptionApplicableStatus(
        'Subtraction Misconception',
        false
      );
      await explorationEditor.toggleMisconceptionApplicableStatus(
        'Subtraction Misconception'
      );
      await explorationEditor.verifyOptionalMisconceptionApplicableStatus(
        'Subtraction Misconception',
        true
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should tag answer group with misconception.',
    async function () {
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(
        CARD_NAME.MULTIPLE_CHOICE_QUESTION
      );
      await explorationEditor.tagAnswerGroupWithMisconception(
        1,
        'Addition Misconception',
        false
      );
      await explorationEditor.verifyMisconceptionPresentForState(
        'Addition Misconception',
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should change tagged misconception for response group',
    async function () {
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(
        CARD_NAME.MULTIPLE_CHOICE_QUESTION
      );
      await explorationEditor.changeTaggedAnswerGroupMisconception(
        1,
        'Subtraction Misconception',
        true
      );
      await explorationEditor.verifyMisconceptionPresentForState(
        'Addition Misconception',
        true
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should not display misconceptions after skill is removed from state.',
    async function () {
      await explorationEditor.reloadPage();
      await explorationEditor.navigateToCard(
        CARD_NAME.MULTIPLE_CHOICE_QUESTION
      );
      await explorationEditor.removeSkillFromState();
      await explorationEditor.verifyMisconceptionPresentForState(
        'Addition Misconception',
        false
      );
      await explorationEditor.verifyMisconceptionPresentForState(
        'Subtraction Misconception',
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
