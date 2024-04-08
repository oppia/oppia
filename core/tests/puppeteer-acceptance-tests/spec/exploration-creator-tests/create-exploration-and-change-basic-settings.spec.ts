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

import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {ExplorationCreator} from '../../user-utilities/exploration-creator-utils';
import {SuperAdmin} from '../../user-utilities/super-admin-utils';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Exploration Creator', function () {
  let explorationCreator: ExplorationCreator;
  let explorationVisitor: ExplorationCreator;
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    explorationCreator = await UserFactory.createNewUser(
      'explorationAdm',
      'exploration_creator@example.com'
    );
    explorationVisitor = await UserFactory.createNewUser(
      'explorationSeeker',
      'exploration_visitor@example.com'
    );
    superAdmin = await UserFactory.createNewSuperAdmin('Leader');
    const guestUser1 = await UserFactory.createNewUser(
      'guestUsr1',
      'guest_user1@example.com'
    );
    await guestUser1.closeBrowser();

    const guestUser2 = await UserFactory.createNewUser(
      'guestUsr2',
      'guest_user2@example.com'
    );
    await guestUser2.closeBrowser();

    const guestUser3 = await UserFactory.createNewUser(
      'guestUsr3',
      'guest_user3@example.com'
    );
    await guestUser3.closeBrowser();

    await superAdmin.assignRoleToUser('explorationAdm', 'voiceover admin');
    await superAdmin.expectUserToHaveRole('explorationAdm', 'voiceover admin');

    await superAdmin.assignRoleToUser('explorationAdm', 'curriculum admin');
    await superAdmin.expectUserToHaveRole('explorationAdm', 'curriculum admin');

    await superAdmin.closeBrowser();
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should create an exploration and modify it via the Settings tab',
    async function () {
      await explorationCreator.openCreatorDashboardPage();
      await explorationCreator.switchToEditorTab();
      await explorationCreator.updateExplorationIntroText(
        'Exploration intro text'
      );
      await explorationCreator.updateCardName('Test');
      await explorationCreator.addEndInteraction();

      await explorationCreator.goToSettingsTab();

      await explorationCreator.addTitle('Your Title Here');
      await explorationCreator.expectTitleToHaveMaxLength(36);

      await explorationCreator.updateGoalTo('OppiaAcceptanceTestsCheck');
      await explorationCreator.expectGoalToEqual('OppiaAcceptanceTestsCheck');

      await explorationCreator.selectACategory('Algebra');
      await explorationCreator.expectSelectedCategoryToBe('Algebra');

      await explorationCreator.selectALanguage('Arabic');
      await explorationCreator.expectSelectedLanguageToBe('Arabic');

      await explorationCreator.addTags(['TagA', 'TagB', 'TagC']);
      await explorationCreator.expectTagsToBeAdded(['TagA', 'TagB', 'TagC']);

      await explorationCreator.previewSummary();

      await explorationCreator.enableAutomaticTextToSpeech();
      await explorationCreator.expectAutomaticTextToSpeechToBeEnabled();

      await explorationCreator.assignUserToCollaboratorRole('guestUsr1');
      await explorationCreator.assignUserToPlaytesterRole('guestUsr2');

      await explorationCreator.publishExploration();
      await explorationCreator.expectExplorationToBePublished();

      await explorationCreator.addVoiceArtists([
        'guestUsr1',
        'guestUsr2',
        'guestUsr3',
      ]);

      await explorationCreator.optInToEmailNotifications();
      await explorationCreator.expectEmailNotificationsToBeActivated();

      await explorationCreator.deleteExploration();
      await explorationVisitor.expectExplorationToBeDeletedSuccessfullyFromCreatorDashboard();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
