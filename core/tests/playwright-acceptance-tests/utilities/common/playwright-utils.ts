// Copyright 2026 The Oppia Authors. All Rights Reserved.
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

import {expect, Page} from '@playwright/test';
import testConstants from './test-constants';
import {showMessage} from './show-message';
import {toMatchImageSnapshot} from 'jest-image-snapshot';

expect.extend({toMatchImageSnapshot});

const backgroundBanner = '.oppia-background-image';
const libraryBanner = '.e2e-test-library-banner';

const commonModalTitleSelector = '.e2e-test-modal-header';

/**
 * BaseUser class (migrated from ../base-user.ts). Exported so other helpers
 * and factories can import the user type from this common module like in
 * the Puppeteer utilities.
 */
export class BaseUser {
  readonly page: Page;
  username: string | null = null;
  email: string | null = null;
  static instances: BaseUser[] = [];

  constructor(page: Page) {
    this.page = page;
    BaseUser.instances.push(this);
  }

  async goto(url: string, verifyURL: boolean = true): Promise<void> {
    const currentUrl = this.page.url();

    // Normalize: only treat as "same page" if the URL matches exactly
    // or continues with /, ?, or # — not a hash fragment of a sub-route
    const isSamePage =
      currentUrl === url ||
      currentUrl === `${url}/` ||
      currentUrl.startsWith(`${url}?`);

    // If already on the same URL, force a reload to reset page state.
    // This matches Puppeteer's behavior where goto always triggers
    // a full navigation even to the same URL.
    if (isSamePage) {
      await this.page.reload();
    } else {
      await this.page.goto(url, {waitUntil: 'networkidle'});
    }

    if (verifyURL) {
      await this.page.waitForURL((currentURL: URL) =>
        currentURL.href.includes(url)
      );
    }
  }

  async clearAllTextFrom(selector: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.click({clickCount: 3});
    await this.page.keyboard.press('Backspace');
  }

  async typeInInputField(selector: string, text: string): Promise<void> {
    const locator = this.page.locator(selector);
    // Detect if the target is a native input/textarea or a contenteditable
    // RTE. For inputs we can use `fill`. For contenteditable elements
    // (CKEditor, etc.), use keyboard events so the editor picks up the
    // change and emits its valueChange events.
    const elementInfo = await locator.evaluate((el: Element) => {
      return {
        tagName: el.tagName.toLowerCase(),
        isContentEditable: (el as HTMLElement).isContentEditable,
      };
    });

    if (elementInfo.tagName === 'input' || elementInfo.tagName === 'textarea') {
      await locator.fill(text);
      return;
    }

    if (elementInfo.isContentEditable) {
      await locator.click();
      // Select existing content and replace it to ensure editor's change
      // events are fired.
      await this.page.keyboard.press('Control+A');
      await this.page.keyboard.press('Backspace');
      await this.page.keyboard.type(text);
      // Blur to trigger any change/validation handlers.
      await this.page.keyboard.press('Tab');
      return;
    }

    // Fallback for other cases: attempt to fill (may throw for non-inputs).
    await locator.fill(text);
  }

  async expectElementValueToBe(
    selector: string,
    expectedValue: string
  ): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(expectedValue);
  }

  async clickOnElementWithText(text: string): Promise<void> {
    await this.page.getByText(text).first().click();
    showMessage(`Element (text: ${text}) clicked.`);
  }

  async expectModalTitleToBe(expectedTitle: string): Promise<void> {
    await expect(this.page.locator(commonModalTitleSelector)).toHaveText(
      expectedTitle
    );
  }

  async reloadPage(): Promise<void> {
    await this.page.reload({waitUntil: 'networkidle'});
  }

  async signInWithEmail(email: string): Promise<void> {
    await this.goto(testConstants.URLs.Home);
    await this.page
      .locator('.e2e-test-oppia-cookie-banner-accept-button')
      .click();
    await this.page.locator('button.e2e-mobile-test-login').click();
    await this.typeInInputField(testConstants.SignInDetails.inputField, email);
    await this.page.locator('button.e2e-test-sign-in-button').click();
  }

  async signUpNewUser(username: string, email: string): Promise<void> {
    await this.signInWithEmail(email);
    await this.typeInInputField('input.e2e-test-username-input', username);
    await this.page.locator('input.e2e-test-agree-to-terms-checkbox').click();
    await this.page
      .locator('button.e2e-test-register-user:not([disabled])')
      .waitFor({state: 'visible'});
    await this.clickOnElementWithText('Submit and start contributing');
    await this.page.waitForURL((url: URL) => !url.href.includes('/signup'), {
      timeout: 30000,
    });
    this.username = username;
    this.email = email;
  }

  async logout(): Promise<void> {
    await this.goto(testConstants.URLs.Logout);
  }

  async expectToastMessage(expectedMessage: string): Promise<void> {
    await expect(this.page.locator('.e2e-test-toast-message')).toHaveText(
      expectedMessage
    );
  }

  async expectElementToBeVisible(
    selector: string,
    visible: boolean = true
  ): Promise<void> {
    const locator = this.page.locator(selector);
    if (visible) {
      await expect(locator).toBeVisible();
    } else {
      await expect(locator).toBeHidden();
    }
  }

  isViewportAtMobileWidth(): boolean {
    return (this.page.viewportSize()?.width ?? 1920) < 768;
  }

  async expectScreenshotToMatch(
    imageName: string,
    newPage: Page | undefined = undefined,
    options: Parameters<Page['screenshot']>[0] = {}
  ): Promise<void> {
    const currentPage = typeof newPage !== 'undefined' ? newPage : this.page;
    await currentPage.mouse.move(0, 0);
    // To wait for all images to load and the page to be stable.
    await currentPage.waitForTimeout(5000);

    let failureTrigger = 0;

    if (this.isViewportAtMobileWidth()) {
      failureTrigger += 0.048;
      if (await currentPage.$(backgroundBanner)) {
        failureTrigger += 0.0352;
      } else if (await currentPage.$(libraryBanner)) {
        failureTrigger += 0.0039;
      }
    } else {
      failureTrigger += 0.04;
      if (await currentPage.$(backgroundBanner)) {
        failureTrigger += 0.03;
      } else if (await currentPage.$(libraryBanner)) {
        failureTrigger += 0.006;
      }
    }

    // Playwright's toHaveScreenshot auto-creates the baseline on first run,
    // and diffs + saves artifacts on failure — no manual directory logic needed.
    await expect(currentPage).toHaveScreenshot(`${imageName}.png`, {
      maxDiffPixelRatio: failureTrigger,
      ...options,
    });
  }

  /**
   * Close a single user's browser context.
   */
  async closeBrowser(): Promise<void> {
    try {
      await this.page.context().close();
      showMessage(`Browser closed for ${this.username ?? 'unknown user'}.`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error closing browser for user', this.username, e);
    }
  }

  /**
   * Close all browsers for live BaseUser instances. This mirrors Puppeteer's
   * `closeBrowser` behaviour that closes all user contexts and captures
   * failure screenshots when required.
   */
  async closeAllBrowsers(): Promise<void> {
    showMessage(
      `Closing ${BaseUser.instances.length} browser(s) for all users.`
    );
    const instances = [...BaseUser.instances];
    for (const inst of instances) {
      try {
        await inst.closeBrowser();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          'Error while closing browser for instance',
          inst.username,
          e
        );
      }
    }
    // Clear the instances array so subsequent runs start fresh.
    BaseUser.instances.length = 0;
    showMessage('All user browsers closed.');
  }
}

export const BaseUserFactory = (page: Page): BaseUser => {
  return new BaseUser(page);
};
