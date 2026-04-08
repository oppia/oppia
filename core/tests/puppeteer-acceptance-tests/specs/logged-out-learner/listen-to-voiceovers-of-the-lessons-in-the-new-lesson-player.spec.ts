// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * EL.VO. Learner can listen to voiceovers of the lessons in the new lesson player
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';

const ROLES = testConstants.Roles;
const CONTINUE_INTERACTION_VOICEOVER_IN_HI =
  testConstants.data.ContinueInteractionVoiceoverInHindi;
const LONG_VOICEOVER_IN_HI = testConstants.data.LongVoiceoverInHindi;

describe('Logged-Out Learner', function () {
  let explorationId: string;
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let voiceoverAdmin: VoiceoverAdmin;

  beforeAll(
    async function () {
      loggedOutLearner = await UserFactory.createLoggedOutUser();

      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordinator',
        'release_coordinator@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculum_admin@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      voiceoverAdmin = await UserFactory.createNewUser(
        'voiceoverAdm',
        'voiceover_admin@example.com',
        [ROLES.VOICEOVER_ADMIN]
      );

      // Enable required feature flags.
      await releaseCoordinator.enableFeatureFlag(
        'exploration_editor_can_modify_translations'
      );
      await releaseCoordinator.enableFeatureFlag('new_lesson_player');

      // Enable Voiceover Contributions.
      await voiceoverAdmin.addSupportedLanguageAccentPair('Hindi (India)');

      // Navigate to Exploration Editor.
      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();

      // Add Interaction Cards.
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.updateCardContent(
        'Welcome, to the Place Values Exploration.'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard('Second Card');

      await curriculumAdmin.navigateToCard('Second Card');
      await curriculumAdmin.updateCardContent(
        "What is 3/6 equal to in it's simplest form?"
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
      await curriculumAdmin.addResponsesToTheInteraction(
        INTERACTION_TYPES.FRACTION_INPUT,
        '2',
        'Correct!',
        'Final Card',
        true
      );
      await curriculumAdmin.editDefaultResponseFeedbackInExplorationEditorPage(
        'Incorrect, try again!'
      );

      await curriculumAdmin.navigateToCard('Final Card');
      await curriculumAdmin.updateCardContent(
        'You have successfully completed the lesson!'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await curriculumAdmin.saveExplorationDraft();
      explorationId = await curriculumAdmin.publishExplorationWithMetadata(
        'What are the Place Values?',
        'Learn basic Mathematics including Place Values',
        'Mathematics'
      );

      await curriculumAdmin.createAndPublishTopic(
        'Place Values',
        'Place Values',
        'place values'
      );

      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        'Place Values'
      );

      await curriculumAdmin.createAndPublishStoryWithChapter(
        'What are Place values',
        'place-values',
        'Understanding Place Values',
        explorationId as string,
        'Place Values'
      );

      // Add Translations.
      await curriculumAdmin.navigateToExplorationEditor(explorationId);
      await curriculumAdmin.navigateToCard('Second Card');
      await curriculumAdmin.navigateToTranslationsTab();
      await curriculumAdmin.dismissTranslationTabWelcomeModal();

      await curriculumAdmin.editTranslationOfContent(
        'हिन्दी (Hindi)',
        'Content',
        '3/6 का सबसे सरल रूप में क्या बराबर है?'
      );

      await curriculumAdmin.navigateToEditorTab();
      await curriculumAdmin.reloadPage();
      await curriculumAdmin.navigateToCard('Second Card');
      await curriculumAdmin.navigateToTranslationsTab();
      await curriculumAdmin.editTranslationOfContent(
        'हिन्दी (Hindi)',
        'Interaction',
        '3/6 का सबसे सरल रूप में क्या बराबर है?'
      );

      await curriculumAdmin.navigateToEditorTab();
      await curriculumAdmin.reloadPage();
      await curriculumAdmin.navigateToCard('Second Card');
      await curriculumAdmin.navigateToTranslationsTab();
      await curriculumAdmin.editTranslationOfContent(
        'हिन्दी (Hindi)',
        'Feedback',
        'सही!',
        1
      );

      // Add Voiceovers.
      await curriculumAdmin.navigateToEditorTab();
      await curriculumAdmin.reloadPage();
      await curriculumAdmin.navigateToTranslationsTab();
      await curriculumAdmin.addVoiceoverToContent(
        'हिन्दी (Hindi)',
        'Hindi (India)',
        'Content',
        LONG_VOICEOVER_IN_HI
      );

      await curriculumAdmin.navigateToEditorTab();
      await curriculumAdmin.reloadPage();
      await curriculumAdmin.navigateToTranslationsTab();
      await curriculumAdmin.addVoiceoverToContent(
        'हिन्दी (Hindi)',
        'Hindi (India)',
        'Interaction',
        CONTINUE_INTERACTION_VOICEOVER_IN_HI
      );

      await curriculumAdmin.saveExplorationDraft();
    },
    // Setup takes more time than default.
    1000000
  );

  it('should be able to play/pause the audio', async function () {
    // Navigate to Lesson Player.
    await loggedOutLearner.navigateToClassroomPage('math');
    await loggedOutLearner.selectAndOpenTopic('Place Values');
    await loggedOutLearner.selectChapterWithinStoryToLearn(
      'What are Place values',
      'Understanding Place Values',
      true
    );

    // Check Audiobar status.
    const isMobileViewPort = loggedOutLearner.isViewportAtMobileWidth();

    if (!isMobileViewPort) {
      expect(await loggedOutLearner.isTextVisibleToUser('Listen in')).toBe(
        false
      );
    }
    // Change language to hindi.
    await loggedOutLearner.changeLessonLang('hi');
    await loggedOutLearner.clickOnContinueButton();
    await loggedOutLearner.waitForPageToFullyLoad();
    if (!isMobileViewPort) {
      expect(await loggedOutLearner.isTextVisibleToUser('Listen in')).toBe(
        true
      );
    }

    await loggedOutLearner.expectNewAudioControlButtonVisible();
    await loggedOutLearner.expectScreenshotToMatch('newAudioBar', __dirname);

    await loggedOutLearner.expectVoiceoverPlayable();
    await loggedOutLearner.expectVoiceoverPauseState();
  });

  it('should be able to change the audio language', async function () {
    // Play voiceovers in Hindi.
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.changeLessonLang('hi');

    await loggedOutLearner.clickOnContinueButton();
    await loggedOutLearner.waitForPageToFullyLoad();
    await loggedOutLearner.expectVoiceoverPlayable();
  });

  it('should be able to skip some parts of audio', async function () {
    await loggedOutLearner.playLesson(explorationId);

    await loggedOutLearner.reloadPage();
    await loggedOutLearner.changeLessonLang('hi');
    await loggedOutLearner.clickOnContinueButton();

    await loggedOutLearner.expectVoiceoverAudioIsSkippable();
  });

  it('should be able to play audio till the end', async function () {
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.changeLessonLang('hi');
    await loggedOutLearner.clickOnContinueButton();

    await loggedOutLearner.playAudioTillEnd();
    await loggedOutLearner.expectVoiceoverIsPlaying(false);
    await loggedOutLearner.expectPlayButtonVisible();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  }, 600000);
});
