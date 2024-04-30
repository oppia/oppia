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
 * @fileoverview Utility File for the Acceptance Tests.
 */

import puppeteer, {Page, Browser, Viewport, ElementHandle} from 'puppeteer';
import testConstants from './test-constants';
import isElementClickable from '../functions/is-element-clickable';
import {ConsoleReporter} from './console-reporter';

const VIEWPORT_WIDTH_BREAKPOINTS = testConstants.ViewportWidthBreakpoints;

const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
/** We accept the empty message because this is what is sent on
 * 'beforeunload' due to an issue with Chromium (see
 * https://github.com/puppeteer/puppeteer/issues/3725). */
const acceptedBrowserAlerts = [
  '',
  'Changes that you made may not be saved.',
  'This action is irreversible. Are you sure?',
];

export class BaseUser {
  page!: Page;
  browserObject!: Browser;
  userHasAcceptedCookies: boolean = false;
  email: string = '';
  username: string = '';

  constructor() {}

  /**
   * This is a function that opens a new browser instance for the user.
   */
  async openBrowser(): Promise<Page> {
    const args: string[] = [
      '--start-fullscreen',
      '--use-fake-ui-for-media-stream',
    ];

    const headless = process.env.HEADLESS === 'true';
    const mobile = process.env.MOBILE === 'true';
    /**
     * Here we are disabling the site isolation trials because it is causing
     * tests to fail while running in non headless mode (see
     * https://github.com/puppeteer/puppeteer/issues/7050).
     */
    if (!headless) {
      args.push('--disable-site-isolation-trials');
    }

    await puppeteer
      .launch({
        /** TODO(#17761): Right now some acceptance tests are failing on
         * headless mode. As per the expected behavior we need to make sure
         * every test passes on both modes. */
        headless,
        args,
      })
      .then(async browser => {
        ConsoleReporter.trackConsoleMessagesInBrowser(browser);
        this.browserObject = browser;
        this.page = await browser.newPage();

        if (mobile) {
          // This is the default viewport and user agent settings for iPhone 6.
          await this.page.setViewport({
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
          });
          await this.page.setUserAgent(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) ' +
              'AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 ' +
              'Mobile/15A372 Safari/604.1'
          );
        } else {
          await this.page.setViewport({width: 1920, height: 1080});
        }
        this.page.on('dialog', async dialog => {
          const alertText = dialog.message();
          if (acceptedBrowserAlerts.includes(alertText)) {
            await dialog.accept();
          } else {
            throw new Error(`Unexpected alert: ${alertText}`);
          }
        });
      });

    return this.page;
  }

  /**
   * Function to sign in the user with the given email to the Oppia website.
   */
  async signInWithEmail(email: string): Promise<void> {
    await this.goto(testConstants.URLs.Home);
    if (!this.userHasAcceptedCookies) {
      await this.clickOn('OK');
      this.userHasAcceptedCookies = true;
    }
    await this.clickOn('Sign in');
    await this.type(testConstants.SignInDetails.inputField, email);
    await this.clickOn('Sign In');
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
  }

  /**
   * This function signs up a new user with the given username and email.
   */
  async signUpNewUser(username: string, email: string): Promise<void> {
    await this.signInWithEmail(email);
    await this.type('input.e2e-test-username-input', username);
    await this.clickOn('input.e2e-test-agree-to-terms-checkbox');
    await this.page.waitForSelector(
      'button.e2e-test-register-user:not([disabled])'
    );
    await this.clickOn(LABEL_FOR_SUBMIT_BUTTON);
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});

    this.username = username;
    this.email = email;
  }

  /**
   * Function to reload the current page.
   */
  async reloadPage(): Promise<void> {
    await this.page.reload({waitUntil: ['networkidle0', 'domcontentloaded']});
  }

  /**
   * This function waits for an element to be clickable either by its CSS selector or
   * by the ElementHandle.
   */
  async waitForElementToBeClickable(
    selector: string | ElementHandle<Element>
  ): Promise<void> {
    try {
      const element =
        typeof selector === 'string'
          ? await this.page.waitForSelector(selector)
          : selector;
      await this.page.waitForFunction(isElementClickable, {}, element);
    } catch (error) {
      throw new Error(`Element ${selector} took too long to be clickable.`);
    }
  }

  /**
   * The function clicks the element using the text on the button.
   */
  async clickOn(selector: string): Promise<void> {
    /** Normalize-space is used to remove the extra spaces in the text.
     * Check the documentation for the normalize-space function here :
     * https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/normalize-space */
    const [button] = await this.page.$x(
      `\/\/*[contains(text(), normalize-space('${selector}'))]`
    );
    // If we fail to find the element by its XPATH, then the button is undefined and
    // we try to find it by its CSS selector.
    if (button !== undefined) {
      await this.waitForElementToBeClickable(button);
      await button.click();
    } else {
      await this.waitForElementToBeClickable(selector);
      await this.page.click(selector);
    }
  }
  /**
   * The function selects all text content and delete it.
   */
  async clearAllTextFrom(selector: string): Promise<void> {
    await this.waitForElementToBeClickable(selector);
    // Clicking three times on a line of text selects all the text.
    await this.page.click(selector, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
  }

  /**
   * This function types the text in the input field using its CSS selector.
   */
  async type(selector: string, text: string): Promise<void> {
    await this.page.waitForSelector(selector);
    await this.page.type(selector, text);
  }

  /**
   * This selects a value in a dropdown.
   */
  async select(selector: string, option: string): Promise<void> {
    await this.page.waitForSelector(selector);
    await this.page.select(selector, option);
  }

  /**
   * This function navigates to the given URL.
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url, {waitUntil: 'networkidle0'});
  }

  /**
   * This function uploads a file using the given file path.
   */
  async uploadFile(filePath: string): Promise<void> {
    const inputUploadHandle = await this.page.$('input[type=file]');
    if (inputUploadHandle === null) {
      throw new Error('No file input found while attempting to upload a file.');
    }
    let fileToUpload = filePath;
    inputUploadHandle.uploadFile(fileToUpload);
  }

  /**
   * This function validates whether an anchor tag is correctly linked
   * to external PDFs or not. Use this particularly when interacting with
   * buttons associated with external PDF links, because Puppeteer,
   * in headless-mode, does not natively support the opening of external PDFs.
   */
  async openExternalPdfLink(
    selector: string,
    expectedUrl: string
  ): Promise<void> {
    await this.page.waitForSelector(selector);
    const href = await this.page.$eval(selector, element =>
      element.getAttribute('href')
    );
    if (href === null) {
      throw new Error(`The ${selector} does not have a href attribute!`);
    }
    if (href !== expectedUrl) {
      throw new Error(`Actual URL differs from expected. It opens: ${href}.`);
    }
  }

  /**
   * This function logs out the current user.
   */
  async logout(): Promise<void> {
    await this.goto(testConstants.URLs.Logout);
    await this.page.waitForSelector(testConstants.Dashboard.MainDashboard);
  }

  /**
   * This function closes the current Puppeteer browser instance.
   */
  async closeBrowser(): Promise<void> {
    await this.browserObject.close();
  }

  /**
   * This function returns the current viewport of the page.
   */
  get viewport(): Viewport {
    const viewport = this.page.viewport();
    if (viewport === null) {
      throw new Error('Viewport is not defined.');
    }
    return viewport;
  }

  /**
   * This function checks if the viewport is at mobile width.
   */
  isViewportAtMobileWidth(): boolean {
    return this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX;
  }

  /**
   * This function gets the current URL of the page without parameters.
   */
  getCurrentUrlWithoutParameters(): string {
    return this.page.url().split('?')[0];
  }
}

export const BaseUserFactory = (): BaseUser => new BaseUser();
