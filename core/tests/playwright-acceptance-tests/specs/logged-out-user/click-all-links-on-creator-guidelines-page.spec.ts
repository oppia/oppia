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
 * @fileoverview Acceptance Test for checking if logged-out users
 * can open all the links on the "Creator Guidelines" page.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out Users', function () {
  // The "Create an Exploration" link opens the creator dashboard, which needs
  // a signed-in user, so this spec uses a new user, as the Puppeteer version did.
  let testUser: LoggedOutUser & LoggedInUser;

  test.beforeAll(async function ({browser}) {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com',
      browser
    );
  });

  test.beforeEach(async function () {
    await testUser.navigateToCreatorGuidelinesPage();
  });

  test('should be able to use the "forum" link', async function () {
    await testUser.expectForumLinkOnCreatorGuidelinesPageToBeCorrect();
  });

  test('should be able to use the "Design Tips" link', async function () {
    await testUser.expectDesignTipsLinkOnCreatorGuidelinesPageToBeCorrect();
  });

  test('should be able to use the "Create an Exploration" link', async function () {
    await testUser.clickCreateAnExplorationLinkOnCreatorGuidelinesPage();
  });

  test('should be able to use the "Browse our Explorations" link', async function () {
    await testUser.clickBrowseOurExplorationsLinkOnCreatorGuidelinesPage();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
