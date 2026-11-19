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
 * can open all the links on the "Get Started" page.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Logged-out Users on Get Started page', function () {
  let loggedOutUser: LoggedOutUser;

  test.beforeAll(async function ({browser}) {
    loggedOutUser = await UserFactory.createLoggedOutUser(browser);
  });

  test.beforeEach(async function () {
    await loggedOutUser.navigateToGetStartedPage();
  });

  test('should be able to use the "create one here" link', async function () {
    await loggedOutUser.expectCreateOneHereLinkOnGetStartedPageToBeCorrect();
  });

  test('should be able to use the "Welcome to Oppia" link', async function () {
    await loggedOutUser.expectWelcomeToOppiaLinkOnGetStartedPageToBeCorrect();
  });

  test('should be able to use the "Get Electrified!" link', async function () {
    await loggedOutUser.expectGetElectrifiedLinkOnGetStartedPageToBeCorrect();
  });

  test('should be able to use the "Programming with Carla" link', async function () {
    await loggedOutUser.expectProgrammingWithCarlaLinkOnGetStartedPageToBeCorrect();
  });

  test('should be able to use "in our user documentation" link', async function () {
    await loggedOutUser.expectInOurUserDocumentationLinkOnGetStartedPageToBeCorrect();
  });

  test('should be able to use the "embed it in your own web page" link', async function () {
    await loggedOutUser.expectEmbedItInYourOwnWebPageLinkOnGetStartedPageToBeCorrect();
  });

  test('should be able to use the "discover more ways to get involved" link', async function () {
    await loggedOutUser.clickDiscoverMoreWaysToGetInvolvedLinkOnGetStartedPage();
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
