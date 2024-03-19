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
 * can open all the links on the "Get Started" page.
 */

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {LoggedInUser} from '../../user-utilities/logged-in-users-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Logged-in Users on the Get Started page ', function () {
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
    'should be able to use the "create one here" link',
    async function () {
      await testUser.clickCreateOneHereLinkInGetStartedPage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to use the "Welcome to Oppia" link',
    async function () {
      await testUser.clickWelcomeToOppiaLinkInGetStartedPage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to use the "Get Electrified!" link',
    async function () {
      await testUser.clickGetElectrifiedLinkInGetStartedPage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to use the "Programming with Carla" link',
    async function () {
      await testUser.clickProgrammingWithCarlaLinkInGetStartedPage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to use "in our user documentation" link',
    async function () {
      await testUser.clickInOurUserDocumentationLinkInGetStartedPage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to use the "embed it in your own web page" link',
    async function () {
      await testUser.clickEmbedItInYourOwnWebPageLinkInGetStartedPage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  it(
    'should be able to use the "discover more ways to get involved" link',
    async function () {
      await testUser.clickDiscoverMoreWaysToGetInvolvedLinkInGetStartedPage();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
