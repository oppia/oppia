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
 * SA.MA (selected buttons)
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {SuperAdmin} from '../../utilities/user/super-admin';

describe('Super Admin', function () {
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');

    let voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin@example.com',
      [testConstants.Roles.VOICEOVER_ADMIN]
    );

    await voiceoverAdmin.addSupportedLanguageAccentPair(
      'English (United States)'
    );
    await voiceoverAdmin.enableAutogenerationForLanguageAccentPair('en-US');
  });

  it('should be able to regenerate topic summaries', async function () {
    await superAdmin.navigateToAdminPageMiscTab();
    await superAdmin.regenerateTopicSummaries();
    await superAdmin.expectActionStatusMessageToBe(
      'Successfully regenerated all topic summaries.'
    );
  });

  it('should be able to get number of users whose deletion is currently in progress', async function () {
    await superAdmin.getNumberOfPendingDeletionRequests();
    await superAdmin.expectActionSuccessMessage(
      'The number of users that are being deleted is: 0'
    );
  });

  it('should be able to update Azure TTS service', async function () {
    await superAdmin.enableTextToSpeechSynthesisUsingCloudService();
    await superAdmin.expectActionSuccessMessage('Success!');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
