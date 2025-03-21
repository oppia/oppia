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
 * @fileoverview Acceptance Test for viewing and searching blog posts as a logged-out user.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {SuperAdmin} from '../../utilities/user/super-admin';
import testConstants from '../../utilities/common/test-constants';
import {showMessage} from '../../utilities/common/show-message';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const NUM_OF_DUMMY_BLOGS = 30;

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;
  let superAdmin: SuperAdmin;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
    superAdmin = await UserFactory.createNewSuperAdmin('superAdm');

    const isInProdMode = await superAdmin.isInProdMode();
    if (!isInProdMode) {
      await superAdmin.navigateToAdminPageActivitiesTab();
      await superAdmin.generateDummyBlogPosts(NUM_OF_DUMMY_BLOGS);
    } else {
      showMessage(
        'The application is currently running in production mode. Skipping dummy blog post generation.'
      );
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToBlogPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to view blog posts with tags',
    async function () {
      await loggedOutUser.expectBlogPostsToHaveAtLeastOneTag();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to navigate through blog pages using pagination',
    async function () {
      await loggedOutUser.expectBlogPaginationControlsVisible();

      await loggedOutUser.clickNextBlogPage();
      await loggedOutUser.clickPreviousBlogPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to search blog posts by tags',
    async function () {
      await loggedOutUser.filterBlogPostsByTag('Community');
      await loggedOutUser.expectBlogSearchResultsToHaveTag('Community');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to search blog posts by keywords',
    async function () {
      await loggedOutUser.filterBlogPostsByKeyword('Education');
      await loggedOutUser.expectBlogSearchResultsToContain('Education');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
