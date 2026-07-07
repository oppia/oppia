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
 * @fileoverview Acceptance Test for managing auto-translation configurations
 * via the Contributor Dashboard Admin page.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {SuperAdmin} from '../../utilities/user/super-admin';

describe('Contributor Dashboard Admin - Translation Configuration', function () {
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdmin');
  });

  it('should allow the admin to enable auto-translation and map providers', async function () {
    // 1. Log in as super admin and navigate to CD admin page.
    await superAdmin.navigateToContributorDashboardAdminPage();

    // 2. Enable automatic translation suggestions.
    await superAdmin.enableAutoTranslation();

    // 3. Add Hindi -> Azure mapping.
    await superAdmin.addTranslationProviderMapping('hi', 'azure');

    // Verify mapping was added.
    let rowCount = await superAdmin.getProviderMappingRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // 4. Remove the mapping.
    await superAdmin.removeTranslationProviderMapping('hi');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
