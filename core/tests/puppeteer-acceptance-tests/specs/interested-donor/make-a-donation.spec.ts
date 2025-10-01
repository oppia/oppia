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
 * ID.DP. Donor makes a donation
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Interested Donor', function () {
  let interestedDonor: LoggedOutUser;

  beforeAll(async function () {
    interestedDonor = await UserFactory.createLoggedOutUser();
  });

  it('should be able to find the donate page', async function () {
    await interestedDonor.clickDonateButtonOnNavbar();
    await interestedDonor.expectScreenshotToMatch('donatePage', __dirname);

    await interestedDonor.expectDonationPageHeadingToBe(' Our Impact ');
    await interestedDonor.expectOurImpactSectionInDonationPageToBePresent();
    await interestedDonor.expectOurNetworkSectionInDonationPageToBePresent();
    await interestedDonor.expectOurLearnersSectionInDonationPageToBePresent();
    await interestedDonor.expectReadyToMakeAnImpactToBePresent();

    await interestedDonor.isDonorBoxVisbleOnDonatePage();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
