// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * PP. Learner changes the site Language to an RTL (right-to-left) language
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

test.describe.configure({mode: 'serial'});

test.describe('Logged-In Learner', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser & ExplorationEditor;

  test.beforeAll(async function ({browser}) {
    loggedInUser1 = await UserFactory.createNewUser(
      'loggedInLearner',
      'logged_in_learner@example.com',
      browser
    );
  });

  test('demo block', async function () {
    await loggedInUser1.navigateToLearnerDashboard();
    await loggedInUser1.expectScreenshotToMatch('learnerdashboard');

    await loggedInUser1.navigateToCreatorDashboardPage();

    await loggedInUser1.expectScreenshotToMatch('creatordashboard');
  });

  test('should be able to visit about page', async function () {
    await loggedInUser1.navigateToLearnerDashboard();

    await loggedInUser1.expectScreenshotToMatch('learner');
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
