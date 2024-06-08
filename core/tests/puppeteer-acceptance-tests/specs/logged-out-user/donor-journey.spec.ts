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
 * @fileoverview Acceptance Test for Logged-out User as a Donor
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Donor', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to donate page when started from home page' +
      'and see the donorbox form in donate page.',
    async function () {
      await loggedOutUser.clickAboutFoundationButtonInAboutMenuOnNavbar();
      await loggedOutUser.navigateToHome();
      await loggedOutUser.navigateToAboutFoundationPageViaFooter();

      // Navigating to donate page by clicking on the "donations" link.
      await loggedOutUser.clickDonationsLinkInAboutFoundation();
      await loggedOutUser.isDonorBoxVisbleOnDonatePage();

      await loggedOutUser.navigateToThanksForDonatingPage();
      await loggedOutUser.clickDismissButtonInThanksForDonatingPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
