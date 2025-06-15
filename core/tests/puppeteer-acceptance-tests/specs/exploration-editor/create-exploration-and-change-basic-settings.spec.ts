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
 * @fileoverview Acceptance Test for creating and modifying an exploration on/via the settings tab.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;
enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

// After deleting the exploration, if we want to access the exploration with the
// URL, then these errors can arise. So, we ignore these errors.
// Using regex because each time the exploration ID will be different.
ConsoleReporter.setConsoleErrorsToIgnore([/.*404.*Not Found.*/]);

describe('Exploration Creator', function () {
  let explorationEditor: ExplorationEditor;
  let voiceoverAdmin: VoiceoverAdmin;
  let curriculumAdmin: CurriculumAdmin;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin@example.com',
      [ROLES.VOICEOVER_ADMIN]
    );

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    const guestUser1 = await UserFactory.createNewUser(
      'guestUser1',
      'guest_user1@example.com'
    );
    await guestUser1.closeBrowser();

    const guestUser2 = await UserFactory.createNewUser(
      'guestUser2',
      'guest_user2@example.com'
    );
    await guestUser2.closeBrowser();

    const guestUser3 = await UserFactory.createNewUser(
      'guestUser3',
      'guest_user3@example.com'
    );
    await guestUser3.closeBrowser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should create an exploration and modify it via the Settings tab',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();

      await explorationEditor.navigateToExplorationEditorPage();

      await explorationEditor.dismissWelcomeModal();

      await explorationEditor.createMinimalExploration(
        'Exploration intro text',
        INTERACTION_TYPES.END_EXPLORATION
      );

      await explorationEditor.navigateToSettingsTab();

      await explorationEditor.updateTitleTo(
        'This title is too long and will be truncated'
      );
      /**
       * Here expecting title to be truncated to 36 characters. It is the default
       * behavior of title input bar.
       */
      await explorationEditor.expectTitleToBe(
        'This title is too long and will be t'
      );

      await explorationEditor.updateGoalTo('OppiaAcceptanceTestsCheck');
      await explorationEditor.expectGoalToBe('OppiaAcceptanceTestsCheck');

      await explorationEditor.selectCategory('Algebra');
      await explorationEditor.expectSelectedCategoryToBe('Algebra');

      await explorationEditor.selectLanguage('Arabic');
      await explorationEditor.expectSelectedLanguageToBe('Arabic');

      await explorationEditor.addTags(['TagA', 'TagB', 'TagC']);
      await explorationEditor.expectTagsToMatch(['TagA', 'TagB', 'TagC']);

      await explorationEditor.previewSummary();

      await explorationEditor.enableAutomaticTextToSpeech();

      await explorationEditor.assignUserToCollaboratorRole('guestUser1');
      await explorationEditor.assignUserToPlaytesterRole('guestUser2');

      await explorationEditor.saveExplorationDraft();
      explorationId = await explorationEditor.publishExploration();
      await explorationEditor.optInToEmailNotifications();

      await voiceoverAdmin.navigateToExplorationEditor(explorationId);
      await voiceoverAdmin.dismissWelcomeModal();
      await voiceoverAdmin.navigateToExplorationSettingsTab();
      if (voiceoverAdmin.isViewportAtMobileWidth()) {
        await voiceoverAdmin.closeEditorNavigationDropdownOnMobile();
      }
      await voiceoverAdmin.openvoiceArtistDropdown();
      await voiceoverAdmin.addVoiceoverArtistsToExploration([
        'guestUser1',
        'guestUser2',
        'guestUser3',
      ]);

      await curriculumAdmin.navigateToExplorationEditor(explorationId);
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.navigateToExplorationSettingsTab();
      if (curriculumAdmin.isViewportAtMobileWidth()) {
        await curriculumAdmin.closeEditorNavigationDropdownOnMobile();
      }
      await curriculumAdmin.openExplorationControlDropdown();
      await curriculumAdmin.deleteExplorationPermanently();

      await explorationEditor.expectExplorationToBeNotAccessibleByUrl(
        explorationId
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
