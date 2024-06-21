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
 * @fileoverview Acceptance Test for platform parameter management by site admin
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {SuperAdmin} from '../../utilities/user/super-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Super Admin', function () {
  let superAdmin: SuperAdmin;
  let curriculumAdmin: CurriculumAdmin;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
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

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should allow the admin to edit a platform parameter by adding rules, changing default values, and save those edits to storage',
    async function () {
      await superAdmin.navigateToAdminPagePlatformParametersTab();

      await superAdmin.addRuleToPlatformParameter(
        'dummy_parameter',
        'web',
        'always'
      );
      await superAdmin.savePlatformParameterChanges('dummy_parameter');
      await superAdmin.expectPlatformParameterToHaveRule(
        'dummy_parameter',
        'Platform Type in[Web]',
        'always'
      );

      await superAdmin.changeDefaultValueOfPlatformParameter(
        'dummy_parameter',
        'Test Value'
      );
      await superAdmin.savePlatformParameterChanges('dummy_parameter');
      await superAdmin.expectPlatformParameterToHaveDefaultValue(
        'dummy_parameter',
        'always'
      );

      await superAdmin.saveChangesToStorage();
      await superAdmin.expectActionSuccessMessage('Saved Successfully');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
