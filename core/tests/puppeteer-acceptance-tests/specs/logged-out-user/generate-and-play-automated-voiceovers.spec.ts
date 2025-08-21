// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for regenerating and playing voiceovers in an exploration.
 */
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

const INTRODUCTION_CARD_CONTENT: string = 'Content 0';
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  FINAL_CARD = 'Final Card',
}

ConsoleReporter.setConsoleErrorsToIgnore([
  /Occurred at http:\/\/localhost:8181\/create\/[a-zA-Z0-9]+\/.*Invalid active state name: null/,
  new RegExp('Invalid active state name: null'),
]);

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin;
  let releaseCoordinator: ReleaseCoordinator;
  let loggedOutUser: LoggedOutUser;
  let voiceoverAdmin: VoiceoverAdmin;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin@example.com',
      [ROLES.VOICEOVER_ADMIN]
    );

    await voiceoverAdmin.addSupportedLanguageAccentPair(
      'English (United States)'
    );
    await voiceoverAdmin.enableAutogenerationForLanguageAccentPair('en-US');

    await UserFactory.enableVoiceoverAutogenerationUsingCloudService();

    // Enable the feature flag.
    await releaseCoordinator.enableFeatureFlag(
      'exploration_editor_can_modify_translations'
    );
    await releaseCoordinator.enableFeatureFlag(
      'automatic_voiceover_regeneration_from_exp'
    );
    await releaseCoordinator.enableFeatureFlag(
      'show_regenerated_voiceovers_to_learners'
    );

    // Navigate to the creator dashboard and create a new exploration.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(INTRODUCTION_CARD_CONTENT);
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add the final card.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.saveExplorationDraft();

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

    await curriculumAdmin.createAndPublishTopic(
      'Algebra I',
      'Negative Numbers',
      'Negative Numbers'
    );

    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Algebra I'
    );

    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Algebra Story',
      'algebra-story',
      'Understanding Negative Numbers',
      explorationId as string,
      'Algebra I'
    );

    // Generate voiceovers for the exploration.
    await explorationEditor.navigateToEditorTab();
    await explorationEditor.reloadPage();
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.navigateToTranslationsTab();
    await explorationEditor.dismissTranslationTabWelcomeModal();
    await explorationEditor.regenerateVoiceoverForContent(
      'English',
      'English (United States)',
      'Content'
    );

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.navigateToTranslationsTab();
    await explorationEditor.regenerateVoiceoverForContent(
      'English',
      'English (United States)',
      'Interaction'
    );

    await explorationEditor.navigateToEditorTab();
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.navigateToTranslationsTab();
    await explorationEditor.regenerateVoiceoverForContent(
      'English',
      'English (United States)',
      'Content'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    // Setup is taking really long.
  }, 600000);

  it(
    'should allow the learner to view and play a lesson entirely in a particular language and start listening to the voiceover from any state',
    async function () {
      await loggedOutUser.navigateToClassroomPage('math');
      await loggedOutUser.selectAndOpenTopic('Algebra I');
      await loggedOutUser.selectChapterWithinStoryToLearn(
        'Algebra Story',
        'Understanding Negative Numbers'
      );

      await loggedOutUser.startVoiceover();
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.verifyVoiceoverIsPlaying(true);

      // Pausing the voiceover and restarting it to confirm that voiceover can be started on any state/card.
      await loggedOutUser.pauseVoiceover();
      await loggedOutUser.startVoiceover();
      await loggedOutUser.verifyVoiceoverIsPlaying(true);
      await loggedOutUser.pauseVoiceover();
      await loggedOutUser.verifyVoiceoverIsPlaying(false);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  }, 450000);
});
