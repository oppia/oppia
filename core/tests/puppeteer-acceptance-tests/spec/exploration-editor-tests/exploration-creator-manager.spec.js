
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

describe('Exploration Creator and Exploration Manager', function() {
  let explorationCreator = null;
  let guestUser1 = null;
  let guestUser2 = null;
  let guestUser3 = null;
  let superAdmin = null;

  beforeAll(async function() {
    guestUser1 = await userFactory.createNewGuestUser(
      'guestUsr1', 'guest_user1@example.com');
    guestUser2 = await userFactory.createNewGuestUser(
      'guestUsr2', 'guest_user2@example.com');
    guestUser3 = await userFactory.createNewGuestUser(
      'guestUsr3', 'guest_user3@example.com');
    explorationCreator = await userFactory.createExplorationCreator(
    'explorationAdm');
    superAdmin = await userFactory.createNewSuperAdmin('Leader'); 
  }, DEFAULT_SPEC_TIMEOUT);

  it('should perform exploration creation and basic actions',
   async function() {
    await superAdmin.assignRoleToUser(
    'explorationAdm', 'voiceover admin');

    await explorationCreator.createExploration();
    await explorationCreator.goToBasicSettingsTab();
    await explorationCreator.expectTitleToHaveMaxLength(36);
    await explorationCreator.updateBasicSettings();
    await explorationCreator.expectGoalToBeSet();
    await explorationCreator.expectCategoryToBeSelected();
    await explorationCreator.expectLanguageToBeSelected();
    await explorationCreator.previewSummary();
    await explorationCreator.expectPreviewSummaryToBeVisible();
    await explorationCreator.updateAdvancedSettings();
    await explorationCreator.expectAutomaticTextToSpeechToBeEnabledOrDisabled();
    await explorationCreator.assignUserToCollaboratorRole('guestUsr1');
    await explorationCreator.assignUserToPlayTesterRole('guestUsr2');
    await explorationCreator.makeExplorationPublic();
    await explorationCreator.expectExplorationAccessibility();
    await explorationCreator.voiceArtistAdded(); 
    await explorationCreator.expectVoiceArtistToBeAdded();
    await explorationCreator.selectVoiceArtist();
    await explorationCreator.chooseToRecieveNotification();
    await explorationCreator.expectFeedbackNotificationChoice();
    await explorationCreator.deleteExploration();
    await explorationCreator.expectExplorationToBeDeleted();
  }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function () {
    await userFactory.closeAllBrowsers();
  });
});

