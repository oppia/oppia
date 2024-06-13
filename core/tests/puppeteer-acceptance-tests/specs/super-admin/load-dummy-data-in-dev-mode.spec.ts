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
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Super Admin', function () {
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  describe('When run in development mode, Super Admin', function () {
    it('should be able to load dummy data', async function () {
      const isInDevMode = await superAdmin.isInDevMode();
      if (!isInDevMode) {
        pending('Running in production mode');
        return;
      }
      await superAdmin.navigateToActivitiesTab();

      await superAdmin.reloadExplorations('solar system');
      await superAdmin.navigateToCommunityLibrary();
      await superAdmin.expectExplorationToBePresent('solar system');

      await superAdmin.reloadCollections('welcome to collections');
      await superAdmin.navigateToCommunityLibrary();
      await superAdmin.expectCollectionToBePresent('Test Collection');

      await superAdmin.generateAndPublishDummyExplorations(2, 2);
      await superAdmin.navigateToCommunityLibrary();
      await superAdmin.expectNoOfExplorationToBePresent(2);

      await superAdmin.loadDummyNewStructuresData();
      await superAdmin.navigateToTopicsAndSkillsDashboard();
      await superAdmin.expectTopic();

      await superAdmin.generateDummySkill();
      await superAdmin.navigateToTopicsAndSkillsDashboard();
      await superAdmin.expectSkillToBePresent();

      await superAdmin.generateMathClassroom();
      await superAdmin.expectMathClassroomToBePresentAtTheUrl();

      await superAdmin.generateBlogPosts();
      await superAdmin.navigateToBlogDashboard();
      await superAdmin.expectBlogPostToBePresent();
    });
  });

  describe('When run in production mode, Super Admin', function () {
    it('should not be able to load dummy data', async function () {
      const isInDevMode = await superAdmin.isInDevMode();
      if (isInDevMode) {
        pending('Running in development mode');
        return;
      }
      await superAdmin.navigateToAdminPage();
      await superAdmin.navigateToActivitiesTab();
      await superAdmin.expectControlsNotAvailable();
    });
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
