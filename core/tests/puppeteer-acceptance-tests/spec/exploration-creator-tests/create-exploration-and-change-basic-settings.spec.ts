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
import {CurriculumAdmin} from '../../user-utilities/curriculum-admin-utils';
import {ExplorationCreator} from '../../user-utilities/exploration-creator-utils';
import {VoiceoverAdmin} from '../../user-utilities/voiceover-admin-utils';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const ROLES = testConstants.Roles;

/**
 * After deleting the exploration if we want to access the exploration with the
 * URL, then these errors can arise. So, we ignore these errors.
 * Using regex because each time the exploration ID will be different.
 */
ConsoleReporter.setConsoleErrorsToIgnore([
  /HttpErrorResponse:.*404 Not Found/,
  /Error: Could not find the resource http:\/\/localhost:8181\/explorehandler\/features\/[a-zA-Z0-9]+\.?/,
  /Could not find the resource http:\/\/localhost:8181\/createhandler\/permissions\/[a-zA-Z0-9]+\.?/,
  /http:\/\/localhost:8181\/build\/webpack_bundles\/exploration_editor\.[a-f0-9]+\.bundle\.js/,
]);

describe('Exploration Creator', function () {
  let explorationCreator: ExplorationCreator;
  let voiceoverAdmin: VoiceoverAdmin;
  let curriculumAdmin: CurriculumAdmin;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationCreator = await UserFactory.createNewUser(
      'explorationCreator',
      'exploration_creator@example.com'
    );
    showMessage('explorationCreator is signed up successfully');

    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin@example.com',
      [ROLES.VOICEOVER_ADMIN]
    );
    showMessage('Voiceover admin is signed up successfully.');

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    showMessage('Curriculum admin is signed up successfully.');

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
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should create an exploration and modify it via the Settings tab',
    async function () {
      await explorationCreator.navigateToCreatorDashboardPage();
      await explorationCreator.createNewExploration();
      await explorationCreator.dismissWelcomeModal();
      await explorationCreator.updateExplorationIntroText(
        'Exploration intro text'
      );
      await explorationCreator.updateCardName('Test');
      await explorationCreator.addEndInteraction();

      await explorationCreator.navigateToSettingsTab();

      await explorationCreator.updateTitleTo(
        'This title is too long and will be truncated'
      );
      /**
       * Here expecting title to be truncated to 36 characters. It is the default
       * behavior of title input bar.
       */
      await explorationCreator.expectTitleToBe(
        'This title is too long and will be t'
      );

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

      await explorationCreator.saveDraftExploration();
      explorationId = await explorationCreator.publishExploration();
      await explorationCreator.optInToEmailNotifications();

      await voiceoverAdmin.navigateToExplorationEditor(explorationId);
      await voiceoverAdmin.dismissWelcomeModal();
      await voiceoverAdmin.navigateToExplorationSettingsTab();
      await voiceoverAdmin.openvoiceArtistDropdown();
      await voiceoverAdmin.addVoiceoverArtistsToExploration([
        'guestUser1',
        'guestUser2',
        'guestUser3',
      ]);

      await curriculumAdmin.navigateToExplorationEditor(explorationId);
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.navigateToExplorationSettingsTab();
      await curriculumAdmin.openExplorationControlDropdown();
      await curriculumAdmin.deleteExplorationPermanently();

      await explorationCreator.expectExplorationToBeNotAccessibleByUrl(
        explorationId
      );
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
