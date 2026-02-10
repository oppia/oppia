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
 * @fileoverview Acceptance Test for checking the site navigation and meta tags.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Site Navigation', function () {
  let guestUser: LoggedOutUser;

  beforeAll(async function () {
    guestUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should verify the navigation to the About page and check meta tags', async function () {
    await guestUser.clickOnAboutButton();
    await guestUser.expectPageTitleToContain('About');
    await guestUser.expectMetaTagToHaveContent('application-name', 'Oppia.org');
    await guestUser.expectMetaTagToBeNotEmpty('description');
    await guestUser.expectMetaTagWithItempropToExist('name');
  });

  it('should verify the navigation to the Get Started page and check meta tags', async function () {
    await guestUser.clickOnGetStartedButton();
    await guestUser.expectPageTitleToContain('Get Started');
    await guestUser.expectMetaTagToHaveContent('application-name', 'Oppia.org');
    await guestUser.expectMetaTagToBeNotEmpty('description');
    await guestUser.expectMetaTagWithItempropToExist('name');
  });

  it('should verify the navigation to the Donate page and check meta tags', async function () {
    await guestUser.clickOnDonateButton();
    await guestUser.expectPageTitleToContain('Donate');
    await guestUser.expectMetaTagToHaveContent('application-name', 'Oppia.org');
    await guestUser.expectMetaTagToBeNotEmpty('description');
    await guestUser.expectMetaTagWithItempropToExist('name');
  });

  it('should verify the navigation to the Contact page and check meta tags', async function () {
    await guestUser.gotoHome();
    await guestUser.clickOnContactButton();
    await guestUser.expectPageTitleToContain('Contact');
    await guestUser.expectMetaTagToHaveContent('application-name', 'Oppia.org');
    await guestUser.expectMetaTagToBeNotEmpty('description');
    await guestUser.expectMetaTagWithItempropToExist('name');
  });

  it('should verify the navigation to the Android page and check meta tags', async function () {
    await guestUser.navigateToAndroidPage();
    await guestUser.expectPageTitleToContain('Android');
    await guestUser.expectMetaTagToHaveContent('application-name', 'Oppia.org');
    await guestUser.expectMetaTagToBeNotEmpty('description');
    await guestUser.expectMetaTagWithItempropToExist('name');
  });

  it('should verify the navigation to the Math page and check meta tags', async function () {
    await guestUser.navigateToMathPage();
    await guestUser.expectPageTitleToContain('Math');
    await guestUser.expectMetaTagToHaveContent('application-name', 'Oppia.org');
    await guestUser.expectMetaTagToBeNotEmpty('description');
    await guestUser.expectMetaTagWithItempropToExist('name');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
