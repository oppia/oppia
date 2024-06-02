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
 * @fileoverview Acceptance Test for checking if Volunteer
 * can open links by clicking all buttons in volunteer page
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Volunteer in Volunteer page', function () {
  let testUser: LoggedOutUser;

  beforeAll(async function () {
    const now = new Date();
    const tempId =
      now.getHours().toString() +
      now.getMinutes().toString() +
      now.getSeconds().toString();
    testUser = await UserFactory.createNewUser(
      `volunteer${tempId}`,
      `volunteer${tempId}@example.com`
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await testUser.navigateToVolunteerPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should open the Volunteer form when the "Apply to Volunteer" button ' +
      'at the top is clicked.',
    async function () {
      await testUser.clickApplyToVolunteerAtTheTopOfVolunteerPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open the Volunteer form when the "Apply to Volunteer" button ' +
      'at the bottom is clicked.',
    async function () {
      await testUser.clickApplyToVolunteerAtTheBottomOfVolunteerPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
