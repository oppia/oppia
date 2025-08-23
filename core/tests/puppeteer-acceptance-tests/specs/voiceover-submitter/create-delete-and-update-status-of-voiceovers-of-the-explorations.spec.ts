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
 * VS.EE. Create, delete, and update status of voiceovers of explorations.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';
import {VoiceoverSubmitter} from '../../utilities/user/voiceover-submitter';

const ROLES = testConstants.Roles;

describe('Voiceover Submitter', function () {
  let voiceoverSubmitter: VoiceoverSubmitter &
    ExplorationEditor &
    LoggedOutUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & VoiceoverAdmin;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId: string;

  beforeAll(async function () {
    // Create users with the required roles.
    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN, ROLES.VOICEOVER_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    // Enable required feature flags.
    await releaseCoordinator.enableFeatureFlag('enable_voiceover_contribution');
    await releaseCoordinator.enableFeatureFlag(
      'show_voiceover_tab_for_non_curated_explorations'
    );

    // Create an exploration for the voiceover submitter.
    explorationId = await curriculumAdm.createAndPublishExplorationWithCards(
      'Exploration for voiceover submitter'
    );
    await curriculumAdm.addSupportedLanguageAccentPair('English (India)');

    // Create a voiceover submitter.
    voiceoverSubmitter = await UserFactory.createNewUser(
      'voiceoverSubmitter',
      'voiceover_submitter@example.com',
      [ROLES.VOICEOVER_SUBMITTER],
      null,
      explorationId
    );
  }, 600000);

  it('should be able to add and remove voiceovers to explorations', async function () {
    // Navigate to the exploration editor.
    await voiceoverSubmitter.navigateToExplorationEditor(explorationId);
    await voiceoverSubmitter.dismissWelcomeModal();

    // Navigate to translation tab.
    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.dismissTranslationTabWelcomeModal();

    // Add voiceover in English (India).
    await voiceoverSubmitter.addVoiceoverToContent(
      'English',
      'English (India)',
      'Content',
      testConstants.data.VoiceoverEnglishIndia
    );
    // TODO(#23129): Once fixed remove the unnecessary navigation to editor
    // tab to change the card.
    await voiceoverSubmitter.navigateToEditorTab();
    await voiceoverSubmitter.navigateToCard('Card 1');
    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.addVoiceoverToContent(
      'English',
      'English (India)',
      'Content',
      testConstants.data.VoiceoverEnglishIndia
    );
    // TODO(#23129): Once fixed remove the unnecessary navigation to editor
    // tab to change the card.
    await voiceoverSubmitter.navigateToEditorTab();
    await voiceoverSubmitter.navigateToCard('Introduction');
    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.expectScreenshotToMatch(
      'voiceoverPageWithOneVoiceoverAddEnIndia',
      __dirname
    );
    await voiceoverSubmitter.expectVoiceoverIsPlayableInTranslationTab();

    // Check voiceover is visible in the preivew tab.
    await voiceoverSubmitter.saveExplorationDraft();
    await voiceoverSubmitter.navigateToPreviewTab();
    await voiceoverSubmitter.expectAudioExpandButtonToBeVisible();
    await voiceoverSubmitter.expandVoiceoverBar();
    await voiceoverSubmitter.expectCurrentVoiceoverLanguageToBe(
      'English (India)'
    );
    await voiceoverSubmitter.expectVoiceoverIsPlayable();

    // Remove voiceover.
    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.deleteVoiceoverInCurrentCard();
    await voiceoverSubmitter.saveExplorationDraft();
    await voiceoverSubmitter.navigateToPreviewTab();
    await voiceoverSubmitter.expandVoiceoverBar();
    await voiceoverSubmitter.expectVoiceoverPlayButtonToBe('disabled');
  });

  it('should not be able to upload a non-audio file', async function () {
    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.clickOnAddManualVoiceoverButton();
    await voiceoverSubmitter.uploadFile(testConstants.data.profilePicture);
    await voiceoverSubmitter.expectUploadErrorMessageToBe(
      'This file is not recognized as an audio file.'
    );
  });

  it('should not be able to upload audio file larger than 5 minutes', async function () {
    await voiceoverSubmitter.uploadFile(
      testConstants.data.VoiceoverEnglishIndiaOver5Min
    );
    await voiceoverSubmitter.clickOnSaveUploadVoiceoverButton();
    await voiceoverSubmitter.expectUploadErrorMessageToBe(
      'Audio files must be under 300 seconds in length.'
    );
  });

  it('should be able to mark/unmark voiceover as stale', async function () {
    // Mark voiceover as stale.
    await voiceoverSubmitter.uploadFile(
      testConstants.data.VoiceoverEnglishIndia
    );
    await voiceoverSubmitter.clickOnSaveUploadVoiceoverButton();
    await voiceoverSubmitter.toggleAudioNeedsUpdateButton();
    await voiceoverSubmitter.expectCurrentVoiceStatusButtonToBe('needs update');
    // TODO(#22748): Ideally changing the voiceover to stale should change the
    // status to "1/3" instead of "2/3". Once fixed, update the code below to
    // expect "1/3" instead of "2/3".
    await voiceoverSubmitter.expectTranslationNumericalStatusToBe('2/3');
    await voiceoverSubmitter.expectNodeWariningSignToBeVisible(true);

    // Mark voiceover as up to date.
    await voiceoverSubmitter.toggleAudioNeedsUpdateButton();
    await voiceoverSubmitter.expectCurrentVoiceStatusButtonToBe('upto date');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
