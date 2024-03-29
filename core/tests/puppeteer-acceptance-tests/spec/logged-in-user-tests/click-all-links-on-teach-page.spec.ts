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

describe('Logged-in Users', function () {
  let testUser: LoggedInUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should be able to navigate to the Creator Guidelines page using the footer',
    async function () {
      await testUser.navigateToAboutFoundationPage();
      await testUser.navigateToCreatorGuidelinesPageViaFooter();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  describe('on the Get Started page', function () {
    beforeEach(async function () {
      await testUser.navigateToCreatorGuidelinesPage();
    }, DEFAULT_SPEC_TIMEOUT);

    it(
      'should be able to use the "forum" link',
      async function () {
        await testUser.clickForumLinkOnCreatorGuidelinesPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );

    it(
      'should be able to use the "Design Tips" link',
      async function () {
        await testUser.clickDesignTipsLinkOnCreatorGuidelinesPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );

    it(
      'should be able to use the "Create an Exploration" link',
      async function () {
        await testUser.clickCreateAnExplorationLinkOnCreatorGuidelinesPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );

    it(
      'should be able to use the "Browse our Expectations" link',
      async function () {
        await testUser.clickBrowseOurExpectationsLinkOnCreatorGuidelinesPage();
      },
      DEFAULT_SPEC_TIMEOUT
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
