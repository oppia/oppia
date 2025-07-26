// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * IP.TP. Parent signs up for Oppia’s newsletter
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Parent', function () {
  let interestedParent: LoggedOutUser;

  beforeAll(async function () {
    interestedParent = await UserFactory.createLoggedOutUser();
  });

  it("should be able to sign up for the Oppia's newletter", async function () {
    // Submit Email to the Newsletter Input Field.
    await interestedParent.submitEmailForNewsletter(
      'example.abc@domain.xyz.mn'
    );
    // Check for Thanks Message.
    await interestedParent.expectNewsletterSubscriptionThanksMessage();
    // Finds the Watch a video button then clicks it.
    await interestedParent.clickWatchAVideoButton();
    // Navigate to the home page.
    await interestedParent.navigateToHome();
    await interestedParent.submitEmailForNewsletter(
      'example.abc@domain.xyz.mn'
    );
    // Finds the Read Blog button then clicks it.
    await interestedParent.clickReadBlogButton();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
