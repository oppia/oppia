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
 * @fileoverview Acceptance test for checking the behavior of the classroom index page
 * for 0 classrooms, 1 classroom, and more than 1 classroom.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

ConsoleReporter.setConsoleErrorsToIgnore([
  /http:\/\/localhost:8181\/access_validation_handler\/can_access_classrooms_page Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
]);

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be redirected to a 404 error page if no classrooms are present.',
    async function () {
      await loggedOutUser.navigateToClassroomsPage();
      await loggedOutUser.expectToBeOnErrorPage(404);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  // TODO (#20610): Add test for one and more than one classroom.
  // Once issue with relase coordinator user is fixed.

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
