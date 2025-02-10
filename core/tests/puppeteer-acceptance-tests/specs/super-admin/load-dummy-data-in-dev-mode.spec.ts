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
 * @fileoverview Acceptance Test for loading dummy data in development mode
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {SuperAdmin} from '../../utilities/user/super-admin';
import {showMessage} from '../../utilities/common/show-message';
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const mathClassroomURl = testConstants.URLs.MathClassroom;
const ROLES = testConstants.Roles;

describe('Super Admin', function () {
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
    await UserFactory.assignRolesToUser(superAdmin, [ROLES.CURRICULUM_ADMIN]);
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  describe('When run in development mode, Super Admin', function () {
    it(
      'should be able to load dummy data',
      async function () {
        const isInProdMode = await superAdmin.isInProdMode();
        if (isInProdMode) {
          showMessage(
            'The application is currently running in production mode.' +
              'The test for loading dummy data is designed to run in development mode only,' +
              'so it will be skipped.'
          );
          // Skip the test if the server is running in production mode.
          return;
        }
        await superAdmin.navigateToAdminPageActivitiesTab();

        await superAdmin.reloadExplorations('solar_system');
        await superAdmin.navigateToCommunityLibrary();
        await superAdmin.expectActivityToBePresent('The Solar System');

        await superAdmin.reloadCollections('welcome_to_collections.yaml');
        await superAdmin.navigateToCommunityLibrary();
        await superAdmin.expectActivityToBePresent(
          'First Example Exploration in Collection'
        );

        await superAdmin.generateAndPublishDummyExplorations(2, 2);
        await superAdmin.navigateToCommunityLibrary();
        // Expecting 3 activities: 1 reloaded from line 51 and 2 generated from line 61.
        await superAdmin.expectNoOfActivitiesToBePresent(3);

        await superAdmin.generateDummySkill();
        await superAdmin.expectSkillInTopicsAndSkillsDashboard('Dummy Skill');

        await superAdmin.loadDummyNewStructuresData();
        await superAdmin.expectTopicInTopicsAndSkillDashboard('Dummy Topic 1');

        await superAdmin.generateDummyMathClassroom();
        await superAdmin.expectMathClassroomToBePresentAtTheUrl(
          mathClassroomURl
        );

        await superAdmin.generateDummyBlogPost();
        await superAdmin.navigateToBlogPage();
        await superAdmin.expectBlogPostToBePresent('Education');
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );
  });

  describe('When run in production mode, Super Admin', function () {
    it(
      'should not be able to load dummy data',
      async function () {
        const isInProdMode = await superAdmin.isInProdMode();
        if (!isInProdMode) {
          showMessage(
            'The application is currently running in development mode.' +
              'Therefore, the user journey flow of the activities tab,' +
              'which is specific to production mode, will be skipped.'
          );
          // Skip the test if the server is running in development mode.
          return;
        }
        await superAdmin.navigateToAdminPageActivitiesTab();
        await superAdmin.expectControlsNotAvailable();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
