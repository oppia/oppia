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
 * @fileoverview Acceptance Test for topic management by curriculum admin
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
    'should be able to assign, unassign role and be able to see the' +
      'allocated actions and assigned users to a role',
    async function () {
      await superAdmin.navigateToAdminPageRolesTab();

      await superAdmin.expectUserNotToHaveRole(
        'guestUser1',
        ROLES.TOPIC_MANAGER
      );
      await superAdmin.assignRoleToUser(
        'guestUser1',
        ROLES.TOPIC_MANAGER,
        'Test Topic 1'
      );
      await superAdmin.expectUserToHaveRole('guestUser1', ROLES.TOPIC_MANAGER);

      await superAdmin.selectRole(ROLES.TOPIC_MANAGER);
      await superAdmin.expectRoleToHaveAllocatedActions([
        'Edit owned story',
        'Edit skill',
        'Manage question skill status',
      ]);
      await superAdmin.expectRoleToHaveAssignedUsers(['guestUser1']);

      await superAdmin.unassignRoleFromUser('guestUser1', ROLES.TOPIC_MANAGER);
      await superAdmin.expectUserNotToHaveRole(
        'guestUser1',
        ROLES.TOPIC_MANAGER
      );
    },

    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
