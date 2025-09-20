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
 * SA.CR Edit user’s role.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {SuperAdmin} from '../../utilities/user/super-admin';

describe('Super Admin', function () {
  let superAdmin: SuperAdmin;
  let testRoleUser: LoggedInUser;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
    testRoleUser = await UserFactory.createNewUser(
      'testRoleChange',
      'test_role_change@example.com'
    );
  });

  it("should be able to change a user's role", async function () {
    await superAdmin.navigateToAdminPageRolesTab();
    await superAdmin.expectUserRolesVisualizerToBeVisible();

    // Assign a role to the user.
    await superAdmin.assignRoleToUser(
      testRoleUser.username ?? 'testRoleChange',
      testConstants.Roles.CURRICULUM_ADMIN
    );
    await superAdmin.expectUserToHaveRole(
      testRoleUser.username ?? 'testRoleChange',
      testConstants.Roles.CURRICULUM_ADMIN
    );

    // Check user role visualizer works properly.
    await superAdmin.selectRole(testConstants.Roles.CURRICULUM_ADMIN);
    await superAdmin.expectRoleToHaveAllocatedActions([
      'Accept any suggestion',
    ]);
    await superAdmin.expectRoleToHaveAssignedUsers([
      testRoleUser.username ?? 'testRoleChange',
    ]);
  });

  it("should be able to remove a user's role", async function () {
    await superAdmin.unassignRoleFromUser(
      testRoleUser.username ?? 'testRoleChange',
      testConstants.Roles.CURRICULUM_ADMIN
    );
    await superAdmin.page.reload();
    await superAdmin.selectRole(testConstants.Roles.CURRICULUM_ADMIN);
    await superAdmin.expectRoleToHaveAssignedUsers(
      [testRoleUser.username ?? 'testRoleChange'],
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
