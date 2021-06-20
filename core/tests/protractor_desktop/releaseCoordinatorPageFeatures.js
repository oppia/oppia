// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for release coordinator page functionality.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var ReleaseCoordinatorPage = require(
  '../protractor_utils/ReleaseCoordinatorPage.js');

describe('Release Coordinator Page', function() {
  var adminPage = null;
  var releaseCoordinatorPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    releaseCoordinatorPage = (
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage());

    await users.createUser(
      'releaseCoordinator@example.com', 'ReleaseCoordinator');
    await users.createAndLoginAdminUser(
      'management@example.com', 'management');
    await adminPage.get();
    await adminPage.updateRole('ReleaseCoordinator', 'release coordinator');
    await users.logout();
  });

  it('should run, verify and stop one-off jobs', async function() {
    await users.login('releaseCoordinator@example.com');
    await releaseCoordinatorPage.get();

    // The following jobs are selected arbitrarily.
    await releaseCoordinatorPage.startOneOffJob(
      'FeedbackThreadCacheOneOffJob');
    await releaseCoordinatorPage.expectJobToBeRunning(
      'FeedbackThreadCacheOneOffJob');
    await releaseCoordinatorPage.expectNumberOfRunningOneOffJobs(1);

    await releaseCoordinatorPage.startOneOffJob(
      'ExplorationValidityJobManager');
    await releaseCoordinatorPage.expectJobToBeRunning(
      'ExplorationValidityJobManager');
    await releaseCoordinatorPage.expectNumberOfRunningOneOffJobs(2);

    await releaseCoordinatorPage.stopOneOffJob(
      'FeedbackThreadCacheOneOffJob');
    await releaseCoordinatorPage.expectJobToBeRunning(
      'ExplorationValidityJobManager');
    await releaseCoordinatorPage.expectNumberOfRunningOneOffJobs(1);

    await releaseCoordinatorPage.stopOneOffJob(
      'ExplorationValidityJobManager');
    await releaseCoordinatorPage.expectNumberOfRunningOneOffJobs(0);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
