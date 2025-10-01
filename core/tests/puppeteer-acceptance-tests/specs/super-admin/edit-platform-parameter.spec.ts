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
 * SA.PP Edit platform parameter.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {SuperAdmin} from '../../utilities/user/super-admin';

const dummyPlatformParameter = 'dummy_parameter';

describe('Super Admin', function () {
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
  });

  it('should be able to edit the default value of a platform parameter', async function () {
    await superAdmin.navigateToAdminPagePlatformParametersTab();
    await superAdmin.expectPlatformParameterToHaveDefaultValue(
      dummyPlatformParameter,
      ''
    );
    await superAdmin.changeDefaultValueOfPlatformParameter(
      dummyPlatformParameter,
      'test'
    );
    await superAdmin.savePlatformParameterChanges(dummyPlatformParameter);
    await superAdmin.page.reload();
    await superAdmin.expectPlatformParameterToHaveDefaultValue(
      dummyPlatformParameter,
      'test'
    );
  });

  it('should be able to edit rule for a platform parameter', async function () {
    await superAdmin.addRuleToPlatformParameter(
      dummyPlatformParameter,
      'Web',
      'abcd'
    );
    await superAdmin.savePlatformParameterChanges(dummyPlatformParameter);
    await superAdmin.expectPlatformParameterToHaveRule(
      dummyPlatformParameter,
      'Platform Type in [Web]',
      'abcd'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
