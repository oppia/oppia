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
 * @fileoverview Acceptance test for logged out user to subscribe to newletter
 */

/*
  This is the user journey of a logged-out-user:
  1. Navigate to the footer of the page where the newsletter subscription field is located.
  2. Enter their email address into the respective field and click on the "Subscribe" button to submit their email address for newsletter subscription.
  3. Upon successful subscription, view a "Thanks for subscribing" modal and within this modal, find and click on the "Watch a video" button to verify its functionality.
  4. Similarly, within the same modal, find and click on the "Read our blog" button to confirm its functionality.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    "should be able to enter the email in the subscription field, click 'Subscribe,' see a 'Thanks for subscribing' message, and access the 'Watch a video' and 'Read our blog' buttons.",
    async function () {
      // Submit Email to the Newsletter Input Field.
      await loggedOutUser.submitEmailForNewsletter('example.abc@domain.xyz.mn');
      // Check for Thanks Message.
      await loggedOutUser.expectNewsletterSubscriptionThanksMessage();
      // Finds the Watch a video button then clicks it.
      await loggedOutUser.clickWatchAVideoButton();
      // Navigate to the home page.
      await loggedOutUser.navigateToHome();
      await loggedOutUser.submitEmailForNewsletter('example.abc@domain.xyz.mn');
      // Finds the Read Blog button then clicks it.
      await loggedOutUser.clickReadBlogButton();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
