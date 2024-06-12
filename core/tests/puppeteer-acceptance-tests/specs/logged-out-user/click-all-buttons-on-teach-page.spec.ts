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
 * can click all the buttons on the "Teach" page.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out Users', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    await loggedOutUser.navigateToTeachPage();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to use the "Browse our Lessons" button',
    async function () {
      await loggedOutUser.clickBrowseOurLessonsOnTeachPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to use the "Access the Android app" button',
    async function () {
      await loggedOutUser.clickAccessTheAndroidAppOnTeachPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to use the "VISIT CLASSROOM" button',
    async function () {
      await loggedOutUser.clickVisitClassroomOnTeachPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to use the "BROWSE LIBRARY" button',
    async function () {
      await loggedOutUser.clickBrowseLibraryOnTeachPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to use the "EXPLORE LESSONS" button',
    async function () {
      await loggedOutUser.clickExploreLessonsOnTeachPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
