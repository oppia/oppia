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
 * can open links by clicking all buttons in teach page
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out User in Teach page', function () {
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
  });

  test.beforeEach(async function () {
    await loggedOutUser.navigateToTeachPage();
  });

  test('should open the classrooms page when "Explore Lessons" button is clicked', async function () {
    await loggedOutUser.clickExploreLessonsButtonAtTheBottomInTeachPage();
    await loggedOutUser.expectScreenshotToMatch('classroomsPage');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
