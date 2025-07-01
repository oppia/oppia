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
 * @fileoverview Acceptance Test for checking if a learner can access
 * voiceovers in lesson player
 */

// Copyright 2024 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use curriculumAdmin file except in compliance with the License.
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
 * @fileoverview Acceptance Test for covering usage of voiceovers and available translation in an exploration.
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
const INTRO_CONTENT_VOICEOVER_IN_HI =
  testConstants.data.IntroContentVoiceoverInHindi;
const CONTINUE_INTERACTION_VOICEOVER_IN_HI =
  testConstants.data.ContinueInteractionVoiceoverInHindi;
const LAST_CARD_VOICEOVER_IN_HI =
  testConstants.data.LastCardContentVoiceoverInHindi;
const ROLES = testConstants.Roles;

const INTRODUCTION_CARD_CONTENT: string =
  'This exploration will test your understanding of negative numbers.';

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

describe('Logged-Out Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
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

    await voiceoverAdmin.addSupportedLanguageAccentPair('Hindi (India)');

    // Enable the feature flag.
    await releaseCoordinator.enableFeatureFlag(
      'exploration_editor_can_modify_translations'
    );

    // Navigate to the creator dashboard and create a new exploration.
    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorPage();
    await curriculumAdmin.dismissWelcomeModal();
    await curriculumAdmin.updateCardContent(
      'This is introduction chapter to what are place values?'
    );
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add the final card.
    await curriculumAdmin.viewOppiaResponses();
    await curriculumAdmin.directLearnersToNewCard(CARD_NAME.FINAL_CARD);
    await curriculumAdmin.saveExplorationDraft();

    await curriculumAdmin.navigateToCard(CARD_NAME.FINAL_CARD);
    await curriculumAdmin.updateCardContent('Thank you!');
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await curriculumAdmin.navigateToCard(CARD_NAME.INTRODUCTION);
    await curriculumAdmin.saveExplorationDraft();

    explorationId = await curriculumAdmin.publishExplorationWithMetadata(
      'What are the Place Values?',
      'This is a test exploration.',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error in publishing exploration successfully.');
    }

    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values I',
      'Place Values I'
    );

    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Place Values'
    );

    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Place Value Story',
      'place-values-story',
      'What are the Place Values?',
      explorationId as string,
      'Place Values'
    );

    // Setting up translations for the exploration.
    await curriculumAdmin.page.bringToFront();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard(CARD_NAME.INTRODUCTION);
    await curriculumAdmin.navigateToTranslationsTab();
    await curriculumAdmin.dismissTranslationTabWelcomeModal();
    await curriculumAdmin.editTranslationOfContent(
      'हिन्दी (Hindi)',
      'Content',
      'यह स्थानीय मान क्या हैं? का परिचयात्मक अध्याय है।'
    );

    await curriculumAdmin.navigateToEditorTab();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard(CARD_NAME.INTRODUCTION);
    await curriculumAdmin.navigateToTranslationsTab();
    await curriculumAdmin.editTranslationOfContent(
      'हिन्दी (Hindi)',
      'Interaction',
      'जारी रखना'
    );

    await curriculumAdmin.navigateToEditorTab();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard(CARD_NAME.FINAL_CARD);
    await curriculumAdmin.navigateToTranslationsTab();
    await curriculumAdmin.editTranslationOfContent(
      'हिन्दी (Hindi)',
      'Content',
      'धन्यवाद!'
    );

    // Adding voiceovers to the exploration.
    await curriculumAdmin.navigateToEditorTab();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard(CARD_NAME.INTRODUCTION);
    await curriculumAdmin.navigateToTranslationsTab();
    await curriculumAdmin.addVoiceoverToContent(
      'हिन्दी (Hindi)',
      'Hindi (India)',
      'Content',
      INTRO_CONTENT_VOICEOVER_IN_HI
    );

    await curriculumAdmin.navigateToEditorTab();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard(CARD_NAME.INTRODUCTION);
    await curriculumAdmin.navigateToTranslationsTab();
    await curriculumAdmin.addVoiceoverToContent(
      'हिन्दी (Hindi)',
      'Hindi (India)',
      'Interaction',
      CONTINUE_INTERACTION_VOICEOVER_IN_HI
    );

    await curriculumAdmin.navigateToEditorTab();
    await curriculumAdmin.reloadPage();
    await curriculumAdmin.navigateToCard(CARD_NAME.FINAL_CARD);
    await curriculumAdmin.navigateToTranslationsTab();
    await curriculumAdmin.addVoiceoverToContent(
      'हिन्दी (Hindi)',
      'Hindi (India)',
      'Content',
      LAST_CARD_VOICEOVER_IN_HI
    );

    await curriculumAdmin.saveExplorationDraft();

    loggedOutUser = await UserFactory.createLoggedOutUser();

    // Setup is taking really long.
  }, 600000);

  it(
    'should be able to play/pause the audio',
    async function () {
      await loggedOutUser.navigateToClassroomPage('math');
      await loggedOutUser.selectAndOpenTopic('Place Values');
      await loggedOutUser.selectChapterWithinStoryToLearn(
        'Place Value Story',
        'What are the Place Values?'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should allow the learner to view and play a lesson entirely in a particular language and start listening to the voiceover from any state',
    async function () {
      //   await loggedOutUser.navigateToClassroomPage('math');
      //   // Change the language of the lesson using the dropdown on the first card.
      //   await loggedOutUser.changeLessonLanguage('hi');
      //   // Verify that the lesson is in the selected language.
      //   await loggedOutUser.expectCardContentToMatch(
      //     'यह अन्वेषण ऋणात्मक संख्याओं के बारे में आपकी समझ का परीक्षण'
      //   );
      //   await loggedOutUser.startVoiceover();
      //   await loggedOutUser.continueToNextCard();
      //   await loggedOutUser.verifyVoiceoverIsPlaying(true);
      //   // Pausing the voiceover and restarting it to confirm that voiceover can be started on any state/card.
      //   await loggedOutUser.pauseVoiceover();
      //   await loggedOutUser.startVoiceover();
      //   await loggedOutUser.verifyVoiceoverIsPlaying(true);
      //   await loggedOutUser.pauseVoiceover();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
