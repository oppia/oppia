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
 * @fileoverview Acceptance Test for checking if logged-out users can
 * navigate using all the links under the "TEACH/LEARN" footer section.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out User', function () {
  let testUser: LoggedOutUser;

  beforeAll(async function () {
    testUser = await UserFactory.createNewUser(
      'testuser',
      'testuser@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  beforeEach(async function () {
    // Navigate to a page that has the oppia footer.
    await testUser.navigateToAboutFoundationPage();
  });

  it(
    'should open "Get Started" page via the footer',
    async function () {
      await testUser.clickOnGetStartedLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Creator Guidelines" page via the footer',
    async function () {
      await testUser.clickOnCreatorGuidelinesLinkinFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Teach" page via the footer',
    async function () {
      await testUser.clickOnForParentsSlashTeachersLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Community Library" page via the footer',
    async function () {
      await testUser.clickOnBrowseTheLibraryLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should open "Contact" page via the footer',
    async function () {
      await testUser.clickOnContactUsLinkInFooter();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
