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

import {ConsoleReporter} from '../../puppeteer-testing-utilities/console-reporter';
import {showMessage} from '../../puppeteer-testing-utilities/show-message-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {ExplorationCreator} from '../../user-utilities/exploration-creator-utils';
import {SuperAdmin} from '../../user-utilities/super-admin-utils';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

/**
 * After deleting the exploration if we want to access the exploration with the
 * URL, then these errors can arise. So, we ignore these errors.
 * Using regex because each time the exploration ID will be different.
 */
ConsoleReporter.setConsoleErrorsToIgnore([
  /HttpErrorResponse:.*404 Not Found/,
  /Error: Could not find the resource http:\/\/localhost:8181\/explorehandler\/features\/[a-zA-Z0-9]+\.?/,
  /Could not find the resource http:\/\/localhost:8181\/createhandler\/permissions\/[a-zA-Z0-9]+\.?/,
]);

describe('Exploration Creator', function () {
  let explorationCreator: ExplorationCreator;
  let explorationVisitor: ExplorationCreator;
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    explorationCreator = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com'
    );
    showMessage('explorationCreator is signed up successfully');

    explorationVisitor = await UserFactory.createNewUser(
      'explorationVisitor',
      'exploration_visitor@example.com'
    );
    showMessage('explorationVisitor is signed up successfully.');

    superAdmin = await UserFactory.createNewSuperAdmin('Leader');

    const guestUser1 = await UserFactory.createNewUser(
      'guestUser1',
      'guest_user1@example.com'
    );
    showMessage('guestUser1 is signed up successfully.');
    await guestUser1.closeBrowser();

    const guestUser2 = await UserFactory.createNewUser(
      'guestUser2',
      'guest_user2@example.com'
    );
    showMessage('guestUser2 is signed up successfully.');
    await guestUser2.closeBrowser();

    const guestUser3 = await UserFactory.createNewUser(
      'guestUser3',
      'guest_user3@example.com'
    );
    showMessage('guestUser3 is signed up successfully.');
    await guestUser3.closeBrowser();

    await superAdmin.assignRoleToUser('explorationVisitor', 'curriculum admin');
    await superAdmin.expectUserToHaveRole(
      'explorationVisitor',
      'curriculum admin'
    );

    await superAdmin.assignRoleToUser('explorationCreator', 'voiceover admin');
    await superAdmin.expectUserToHaveRole(
      'explorationCreator',
      'voiceover admin'
    );

    await superAdmin.closeBrowser();
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should create an exploration and modify it via the Settings tab',
    async function () {
      await explorationCreator.openCreatorDashboardPage();
      await explorationCreator.createNewExploration();
      await explorationCreator.switchToEditorTab();
      await explorationCreator.updateExplorationIntroText(
        'Exploration intro text'
      );
      await explorationCreator.updateCardName('Test');
      await explorationCreator.addEndInteraction();

      await explorationCreator.goToSettingsTab();

      await explorationCreator.updateTitleTo(
        'We are testing the title' + 'truncation feature'
      );
      await explorationCreator.expectTruncatedTitleWhenMaxLengthExceeded(36);

      await explorationCreator.updateGoalTo('OppiaAcceptanceTestsCheck');
      await explorationCreator.expectGoalToBe('OppiaAcceptanceTestsCheck');

      await explorationCreator.selectCategory('Algebra');
      await explorationCreator.expectSelectedCategoryToBe('Algebra');

      await explorationCreator.selectLanguage('Arabic');
      await explorationCreator.expectSelectedLanguageToBe('Arabic');

      await explorationCreator.addTags(['TagA', 'TagB', 'TagC']);
      await explorationCreator.expectTagsToMatch(['TagA', 'TagB', 'TagC']);

      await explorationCreator.previewSummary();

      await explorationCreator.enableAutomaticTextToSpeech();

      await explorationCreator.assignUserToCollaboratorRole('guestUser1');
      await explorationCreator.assignUserToPlaytesterRole('guestUser2');

      await explorationCreator.publishExploration();

      await explorationCreator.addVoiceArtists([
        'guestUser1',
        'guestUser2',
        'guestUser3',
      ]);

      await explorationCreator.optInToEmailNotifications();

      await explorationVisitor.expectExplorationToBeAccessibleWithTheUrl('Yes');
      await explorationVisitor.switchToEditorTab();
      await explorationVisitor.goToSettingsTab();
      await explorationVisitor.deleteExploration();
      await explorationVisitor.expectExplorationToBeAccessibleWithTheUrl('No');
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
