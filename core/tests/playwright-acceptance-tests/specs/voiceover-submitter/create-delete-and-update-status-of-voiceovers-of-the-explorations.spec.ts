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
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=1494217687#gid=1494217687
 *
 * VS.1. Add, remove, and update the status of a single voiceover.
 */

import {test} from '@playwright/test';
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
import {VoiceoverSubmitter} from '../../utilities/user/voiceover-submitter';

const ROLES = testConstants.Roles;

test.describe.configure({mode: 'serial', timeout: 600000});

test.describe('Voiceover Submitter', function () {
  let voiceoverSubmitter: VoiceoverSubmitter &
    ExplorationEditor &
    LoggedOutUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & VoiceoverAdmin;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId: string;

  test.beforeAll(async function ({browser}) {
    // Create users with the required roles.
    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN, ROLES.VOICEOVER_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      browser,
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'show_voiceover_tab_for_non_curated_explorations'
    );

    // Create the exploration manually.
    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.waitForPageToFullyLoad();
    await curriculumAdm.dismissWelcomeModal();

    // Card 1 (Introduction).
    await curriculumAdm.updateCardContent('What is 2 + 3?');
    await curriculumAdm.addTextInputInteraction();
    await curriculumAdm.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      '5',
      'Great!',
      'End',
      true,
      true
    );
    await curriculumAdm.updateTextInputInteraction('Type your answer here.');
    await curriculumAdm.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try Again'
    );
    await curriculumAdm.addHintToState(
      'If you have 2 apples and someone gives you 3 apples, how many apples you have?'
    );
    await curriculumAdm.addSolutionToState('5', '2 + 3 = 5', false);
    await curriculumAdm.saveExplorationDraft();

    // Card 2 (End).
    await curriculumAdm.navigateToCard('End');
    await curriculumAdm.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await curriculumAdm.saveExplorationDraft();

    // Publish and configure the supported voiceover language.
    explorationId = await curriculumAdm.publishExplorationWithMetadata(
      'Exploration for voiceover submitter',
      'Testing voiceover translations',
      'Mathematics'
    );
    await curriculumAdm.addSupportedLanguageAccentPair('English (India)');

    voiceoverSubmitter = await UserFactory.createNewUser(
      'voiceoverSubmitter',
      'voiceover_submitter@example.com',
      browser,
      [ROLES.VOICEOVER_SUBMITTER],
      explorationId
    );
  });

  test('should see content for voiceover in exploration language', async function () {
    await voiceoverSubmitter.goto(
      `${testConstants.URLs.BaseURL}/create/${explorationId}#/`
    );
    await voiceoverSubmitter.waitForPageToFullyLoad();
    await voiceoverSubmitter.dismissWelcomeModal();
    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.dismissTranslationTabWelcomeModal();

    await voiceoverSubmitter.selectVoiceoverContentType('Content');
    await voiceoverSubmitter.expectContentVoiceoverToContain('What is 2 + 3?');

    await voiceoverSubmitter.selectVoiceoverContentType('Interaction');
    await voiceoverSubmitter.expectInteractionVoiceoverToContain(
      'Type your answer here.'
    );

    await voiceoverSubmitter.selectVoiceoverContentType('Feedback');
    await voiceoverSubmitter.expectVisibleFeedbackTextsToContain([
      'Great!',
      'Try Again',
    ]);

    await voiceoverSubmitter.selectVoiceoverContentType('Hints');
    await voiceoverSubmitter.expectVisibleHintTextsToContain([
      'If you have 2 apples and someone gives you 3 apples, how many apples you have?',
    ]);

    await voiceoverSubmitter.selectVoiceoverContentType('Solution');
    await voiceoverSubmitter.expectSolutionVoiceoverToContain('5');
  });

  test('should see correct accessibility labels in the voiceover translation tab', async function () {
    await voiceoverSubmitter.selectVoiceoverContentType('Content');
    await voiceoverSubmitter.expectTranslationProgressAriaLabelToMatch(
      '0 items translated out of 7 items'
    );
    await voiceoverSubmitter.expectTranslationSubTabAriaLabelToBe(
      'Content',
      'Content of the card'
    );
    await voiceoverSubmitter.expectTranslationSubTabAriaLabelToBe(
      'Feedback',
      'Feedback responses for answer groups'
    );
    await voiceoverSubmitter.expectTranslationSubTabAriaLabelToBe(
      'Hints',
      'Hints for the state'
    );
    await voiceoverSubmitter.expectTranslationSubTabAriaLabelToBe(
      'Solution',
      'Solutions for the state'
    );

    await voiceoverSubmitter.selectVoiceoverLanguageAccent('English (India)');
    await voiceoverSubmitter.clickOnAddManualVoiceoverButton();
    await voiceoverSubmitter.expectUploadVoiceoverFileButtonAccessibleNameToBe(
      'Upload voiceover file'
    );
    await voiceoverSubmitter.uploadFile(
      testConstants.data.VoiceoverEnglishIndia
    );
    await voiceoverSubmitter.clickOnSaveUploadVoiceoverButton();
    await voiceoverSubmitter.expectPlayVoiceoverButtonAccessibleNameToBe(
      'Play recorded audio'
    );
    await voiceoverSubmitter.deleteVoiceoverInCurrentCard();
    await voiceoverSubmitter.saveExplorationDraft();
  });

  test('should be able to add and remove voiceovers to explorations', async function () {
    await voiceoverSubmitter.addVoiceoverToContent(
      'English',
      'English (India)',
      'Content',
      testConstants.data.VoiceoverEnglishIndia
    );
    // TODO(#23129): Once fixed remove the unnecessary navigation to editor
    // tab to change the card.
    await voiceoverSubmitter.navigateToEditorTab();
    await voiceoverSubmitter.navigateToCard('End');
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
      'voiceoverPageWithOneVoiceoverAddEnIndia'
    );
    await voiceoverSubmitter.expectVoiceoverIsPlayableInTranslationTab();
    await voiceoverSubmitter.saveExplorationDraft();

    await voiceoverSubmitter.navigateToPreviewTab();
    await voiceoverSubmitter.expectAudioExpandButtonToBeVisible();
    await voiceoverSubmitter.expandVoiceoverBar();
    await voiceoverSubmitter.expectCurrentVoiceoverLanguageToBe(
      'English (India)'
    );
    await voiceoverSubmitter.expectVoiceoverIsPlayable();

    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.deleteVoiceoverInCurrentCard();
    await voiceoverSubmitter.saveExplorationDraft();
    await voiceoverSubmitter.navigateToPreviewTab();
    await voiceoverSubmitter.expandVoiceoverBar();
    await voiceoverSubmitter.expectVoiceoverPlayButtonToBe('disabled');
  });

  test('should not be able to upload a non-audio file', async function () {
    await voiceoverSubmitter.navigateToTranslationsTab();
    await voiceoverSubmitter.clickOnAddManualVoiceoverButton();
    await voiceoverSubmitter.uploadFile(testConstants.data.profilePicture);
    await voiceoverSubmitter.expectUploadErrorMessageToBe(
      'This file is not recognized as an audio file.'
    );
  });

  test('should not be able to upload audio file larger than 5 minutes', async function () {
    await voiceoverSubmitter.uploadFile(
      testConstants.data.VoiceoverEnglishIndiaOver5Min
    );
    await voiceoverSubmitter.clickOnSaveUploadVoiceoverButton();
    await voiceoverSubmitter.expectUploadErrorMessageToBe(
      'Audio files must be under 300 seconds in length.'
    );
  });

  test('should be able to mark/unmark voiceover as stale', async function () {
    await voiceoverSubmitter.uploadFile(
      testConstants.data.VoiceoverEnglishIndia
    );
    await voiceoverSubmitter.clickOnSaveUploadVoiceoverButton();
    await voiceoverSubmitter.toggleAudioNeedsUpdateButton();
    await voiceoverSubmitter.expectCurrentVoiceStatusButtonToBe('needs update');
    await voiceoverSubmitter.expectTranslationNumericalStatusToBe('1/7');
    await voiceoverSubmitter.expectNodeWariningSignToBeVisible(true);

    await voiceoverSubmitter.toggleAudioNeedsUpdateButton();
    await voiceoverSubmitter.expectCurrentVoiceStatusButtonToBe('upto date');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
