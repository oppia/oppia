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
 * @fileoverview Acceptance Test for checking if logged-in users
 * can open link by clicking all buttons on navbar
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../user-utilities/logged-in-users-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in User', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
    await testUser.navigateToAboutFoundationPage();
    await testUser.navigateToGetStartedPageViaFooter();
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'clicks "create one here" link',
    async function () {
      await testUser.clickCreateOneHereLink();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'clicks "Welcome to Oppia" link',
    async function () {
      await testUser.clickWelcomeToOppiaLink();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'clicks "Get Electrified!" link',
    async function () {
      await testUser.clickGetElectrifiedLink();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'clicks "Programming with Carla" link',
    async function () {
      await testUser.clickProgrammingWithCarlaLink();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'clicks "in our user documentation" link',
    async function () {
      await testUser.clickInOurUserDocumentationLink();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'clicks "embed it in your own web page" link',
    async function () {
      await testUser.clickEmbedItInYourOwnWebPageLink();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'clicks "discover more ways to get involved" link',
    async function () {
      await testUser.clickDiscoverMoreWaysToGetInvolvedLink();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
