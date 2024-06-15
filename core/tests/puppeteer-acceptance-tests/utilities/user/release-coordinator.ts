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
 * @fileoverview Utility functions for the release coordinator page.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

export class ReleaseCoordinator extends BaseUser {
  async navigateToReleaseCoordinatorPage(): Promise<void> {
    await this.page.goto(testConstants.URLs.releaseCoordinatorPage);
  }

  async navigateToPromoBarTab(): Promise<void> {
    await this.clickAndWaitForNavigation(' Misc');
  }

  async enablePromoBar(): Promise<void> {
    await this.page.waitForSelector('#mat-slide-toggle-2');
    await this.clickOn('#mat-slide-toggle-2');
  }

  async enterPromoBarMessage(promoMessage: string): Promise<void> {
    await this.page.waitForSelector('.mat-input-element');
    await this.page.type('.mat-input-element', promoMessage);
  }

  async savePromoBarMessage(): Promise<void> {
    await this.clickOn(' Save changes ');
  }

  async navigateToSplashPage(): Promise<void> {
    await this.page.goto(testConstants.URLs.splashPage);
  }

  async expectPromoMessageToBe(expectedMessage: string): Promise<void> {
    await this.page.waitForSelector('.promo-bar-message');
    const actualMessage = await this.page.$eval(
      '.promo-bar-message',
      el => el.textContent
    );
    expect(actualMessage).toEqual(expectedMessage);
  }
}

export let ReleaseCoordinatorFactory = (): ReleaseCoordinator =>
  new ReleaseCoordinator();
