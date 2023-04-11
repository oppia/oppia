// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for Blog Admin
 */

const userFactory = require(
  '../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged in learners', function() {
  let guestLearner = null;
  let superAdmin = null;

  beforeAll(async function() {
    superAdmin = await userFactory.createNewSuperAdmin('superAdm');
    guestLearner = await userFactory.createNewGuestUser(
      'guestusr1', 'guestusr1@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should expect learners to retrieve explorations and remove them',
    async function() {
      await superAdmin.createNewTestExploration();
      await guestLearner.addExploration();
      await guestLearner.removeExploration();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
