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
 * @fileoverview Utility functions for voiceover admin page if voiceover admin
 * can add voiceover artist to an exploration
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {VoiceoverAdmin} from '../../user-utilities/voiceover-admin-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const ROLES = testConstants.Roles;

describe('Voiceover Admin', function () {
  let testUser: VoiceoverAdmin;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com',
      [ROLES.VOICEOVER_ADMIN]
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should be able to see error while adding `xyz` voiceover artist to an exploration',
    async function () {
      await testUser.navigateToCreatorDashboardPage();
      await testUser.createExplorationWithTitle('Test Exploration');

      await testUser.navigateToExplorationSettingsTab();
      await testUser.addVoiceoverArtistToExploration('xyz');

      await testUser.expectToSeeErrorToastMessage(
        'Sorry, we could not find the specified user.'
      );
      await testUser.closeToastMessage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to add regular user as voiceover artist to an exploration',
    async function () {
      await UserFactory.createNewUser(
        'voiceoverartist',
        'voiceoverartist@example.com'
      );
      await testUser.page.reload();
      await testUser.addVoiceoverArtistToExploration('voiceoverartist');
      await testUser.expectVoiceoverArtistToBe('voiceoverartist');
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
