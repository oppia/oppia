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
 * VA.MA. Assign, unassign voiceover artists to an exploration
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import testConstants from '../../utilities/common/test-constants';

const ROLES = testConstants.Roles;
const invalidIdErrorToastMessage =
  'Sorry, we could not find the specified user.';
enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

// TODO(#24715): Once ConsoleReporter is ported to Playwright, re-add the
// suppression for the expected 400 from adding an invalid user ID as a
// voiceover artist (see the Puppeteer version of this spec for reference).
// The frontend toast message for this case is asserted directly below.

test.describe.configure({mode: 'serial'});

test.describe('Voiceover Admin', function () {
  let voiceoverAdmin: VoiceoverAdmin;
  let explorationEditor: ExplorationEditor;
  let explorationId: string | null;

  test.beforeAll(async function ({browser}) {
    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin@example.com',
      browser,
      [ROLES.VOICEOVER_ADMIN]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();

    await explorationEditor.createMinimalExploration(
      'Exploration one',
      INTERACTION_TYPES.END_EXPLORATION
    );
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Exploration one',
      'Exploration one',
      'Algebra'
    );

    await UserFactory.createNewUser(
      'voiceoverartist',
      'voiceoverartist@example.com',
      browser
    );
  });

  test('should be able to add voiceover artist to an exploration', async function () {
    await voiceoverAdmin.navigateToExplorationEditor(explorationId);
    await voiceoverAdmin.dismissWelcomeModal();
    await voiceoverAdmin.navigateToExplorationSettingsTab();
    await voiceoverAdmin.expectVoiceoverArtistsListToBeEmpty();

    // Add invalid user as a voiceover artist.
    await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
      'invalidUserId'
    );
    await voiceoverAdmin.addVoiceoverArtistsToExploration(
      ['invalidUserId'],
      false
    );

    await voiceoverAdmin.expectToSeeErrorToastMessage(
      invalidIdErrorToastMessage
    );
    await voiceoverAdmin.closeToastMessage();
    await voiceoverAdmin.verifyVoiceoverArtistStillOmitted('invalidUserId');

    // Add a valid user as a voiceover artist.
    await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
      'voiceoverartist'
    );
    await voiceoverAdmin.addVoiceoverArtistsToExploration(['voiceoverartist']);

    await voiceoverAdmin.expectVoiceoverArtistsListContains('voiceoverartist');
  });

  test('should be able to remove voiceover artist from an exploration', async function () {
    await voiceoverAdmin.removeVoiceoverArtist('voiceoverartist');
    await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
      'voiceoverartist'
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
