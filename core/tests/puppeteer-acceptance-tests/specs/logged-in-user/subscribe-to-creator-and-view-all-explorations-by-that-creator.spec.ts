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
 * @fileoverview Acceptance Test for checking if a user can subscribe to a creator
 * and view all explorations created by that creator
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in User', function () {
  let testLearner: LoggedInUser;
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    testLearner = await UserFactory.createNewUser(
      'testLearner',
      'test_user@example.com'
    );
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
      'Test Exploration'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should subscribe to a creator and view all explorations created by that creator',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.expectNumberOfSubscribersToBe(0);

      await testLearner.navigateToProfilePage('explorationEditor');
      await testLearner.subscribeToCreator('explorationEditor');

      await explorationEditor.reloadPage();
      await explorationEditor.expectNumberOfSubscribersToBe(1);

      await explorationEditor.openSubscribersTab();
      await explorationEditor.expectUserToBeASubscriber('testLearner');

      await testLearner.expectExplorationToBePresentInProfilePageWithTitle(
        'Test Exploration'
      );
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
