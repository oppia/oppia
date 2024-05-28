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

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-in Users', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to the Get Started page using the footer',
    async function () {
      await testUser.navigateToAboutFoundationPage();
      await testUser.navigateToGetStartedPageViaFooter();
      await testUser.expectScreenshotToMatch(
        'navigateToGetStartedPageViaFooter'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  describe('on the Get Started page', function () {
    beforeEach(async function () {
      await testUser.navigateToGetStartedPage();
    }, DEFAULT_SPEC_TIMEOUT_MSECS);

    it(
      'should be able to use the "create one here" link in a new tab',
      async function () {
        await testUser.expectScreenshotToMatch(
          'clickCreateOneHereLinkInGetStartedPage2',
          await testUser.clickCreateOneHereLinkInGetStartedPage()
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "Welcome to Oppia" link in a new tab',
      async function () {
        await testUser.expectScreenshotToMatch(
          'clickWelcomeToOppiaLinkInGetStartedPage',
          await testUser.clickWelcomeToOppiaLinkInGetStartedPage()
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "Get Electrified!" link in a new tab',
      async function () {
        await testUser.expectScreenshotToMatch(
          'clickGetElectrifiedLinkInGetStartedPage',
          await testUser.clickGetElectrifiedLinkInGetStartedPage()
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "Programming with Carla" link in a new tab',
      async function () {
        await testUser.expectScreenshotToMatch(
          'clickProgrammingWithCarlaLinkInGetStartedPage',
          await testUser.clickProgrammingWithCarlaLinkInGetStartedPage()
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use "in our user documentation" link in a new tab',
      async function () {
        await testUser.expectScreenshotToMatch(
          'clickInOurUserDocumentationLinkInGetStartedPage',
          await testUser.clickInOurUserDocumentationLinkInGetStartedPage()
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "embed it in your own web page" link in a new tab',
      async function () {
        await testUser.expectScreenshotToMatch(
          'clickEmbedItInYourOwnWebPageLinkInGetStartedPage',
          await testUser.clickEmbedItInYourOwnWebPageLinkInGetStartedPage()
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "discover more ways to get involved" link',
      async function () {
        await testUser.clickDiscoverMoreWaysToGetInvolvedLinkInGetStartedPage();
        await testUser.expectScreenshotToMatch(
          'clickDiscoverMoreWaysToGetInvolvedLinkInGetStartedPage'
        );
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    afterAll(async function () {
      await UserFactory.closeAllBrowsers();
    });
  });
});
