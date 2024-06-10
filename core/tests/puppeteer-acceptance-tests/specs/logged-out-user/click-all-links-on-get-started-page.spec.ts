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

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out Users', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to the Get Started page using the footer',
    async function () {
      await loggedOutUser.navigateToAboutFoundationPage();
      await loggedOutUser.navigateToGetStartedPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  describe('on the Get Started page', function () {
    beforeEach(async function () {
      await loggedOutUser.navigateToGetStartedPage();
    }, DEFAULT_SPEC_TIMEOUT_MSECS);

    it(
      'should be able to use the "create one here" link',
      async function () {
        await loggedOutUser.clickCreateOneHereLinkInGetStartedPage();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "Welcome to Oppia" link',
      async function () {
        await loggedOutUser.clickWelcomeToOppiaLinkInGetStartedPage();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "Get Electrified!" link',
      async function () {
        await loggedOutUser.clickGetElectrifiedLinkInGetStartedPage();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "Programming with Carla" link',
      async function () {
        await loggedOutUser.clickProgrammingWithCarlaLinkInGetStartedPage();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use "in our user documentation" link',
      async function () {
        await loggedOutUser.clickInOurUserDocumentationLinkInGetStartedPage();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "embed it in your own web page" link',
      async function () {
        await loggedOutUser.clickEmbedItInYourOwnWebPageLinkInGetStartedPage();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    it(
      'should be able to use the "discover more ways to get involved" link',
      async function () {
        await loggedOutUser.clickDiscoverMoreWaysToGetInvolvedLinkInGetStartedPage();
      },
      DEFAULT_SPEC_TIMEOUT_MSECS
    );

    afterAll(async function () {
      await UserFactory.closeAllBrowsers();
    });
  });
});
