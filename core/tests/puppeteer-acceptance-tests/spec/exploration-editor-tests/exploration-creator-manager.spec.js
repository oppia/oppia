
// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for Exploration Creator and Exploration Manager
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Exploration Creator', function() {
  let explorationCreator = null;
  let superAdmin = null;

  beforeAll(async function() {
    guestUser1 = await userFactory.createNewGuestUser(
      'guestUsr1', 'guest_user1@example.com');
    guestUser2 = await userFactory.createNewGuestUser(
      'guestUsr2', 'guest_user2@example.com');
    guestUser3 = await userFactory.createNewGuestUser(
      'guestUsr3', 'guest_user3@example.com');
    explorationCreator = await userFactory.createNewExplorationCreator(
      'explorationAdm', 'exploration_creator@example.com');
    superAdmin = await userFactory.createNewSuperAdmin('Leader');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should create exploration and can modify it from settings tab',
    async function() {
      await superAdmin.assignRoleToUser(
        'explorationAdm', 'voiceover admin');
      await superAdmin.expectUserToHaveRole(
        'explorationAdm', 'voiceover admin');

      await superAdmin.assignRoleToUser(
        'explorationAdm', 'curriculum admin');
      await superAdmin.expectUserToHaveRole(
        'explorationAdm', 'curriculum admin');

      await explorationCreator.goToDashboardUrl();
      await explorationCreator.goToEditorSection();
      await explorationCreator.updateCardName('Test question');
      await explorationCreator.updateExplorationIntroText(
        'Exploration intro text');
      await explorationCreator.addInteraction();
      await explorationCreator.explorationCreatedSuccessfully();

      await explorationCreator.goToSettingsTab();

      await explorationCreator.updateTitle('Your Title Here');
      await explorationCreator.expectTitleToHaveMaxLength(36);

      await explorationCreator.updateGoal('NeedSuccessInLifeAndMoney');
      await explorationCreator.expectGoalToBeSet('NeedSuccessInLifeAndMoney');

      await explorationCreator.selectCategory();
      await explorationCreator.expectCategoryToBeSelected('Algebra');

      await explorationCreator.selectLanguage();
      await explorationCreator.expectLanguageToBeSelected('English');

      await explorationCreator.addTags('Your Tag Here');

      await explorationCreator.successfullyUpdatedSettings();

      await explorationCreator.previewSummary();
      await explorationCreator.expectPreviewSummaryToBeVisible();

      await explorationCreator.updateAutomaticTextToSpeech();
      await explorationCreator.
        expectAutomaticTextToSpeechToBeDisabled();

      await explorationCreator.assignUserToCollaboratorRole('guestUsr1');
      await explorationCreator.assignUserToPlaytesterRole('guestUsr2');

      await explorationCreator.makeExplorationPublic();
      await explorationCreator.expectExplorationToBePublished();

      await explorationCreator.addVoiceArtist();
      await explorationCreator.expectVoiceArtistToBeAdded('guestUsr3');

      await explorationCreator.
        chooseToReceiveSuggestedEmailsAsNotification();
      await explorationCreator.expectEmailNotificationToBeActivated();

      await explorationCreator.deleteExploration();
      await explorationCreator.expectExplorationToBeDeletedSuccessfully();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
