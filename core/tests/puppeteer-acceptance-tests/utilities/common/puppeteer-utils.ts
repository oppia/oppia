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
import isElementClickable from '../../functions/is-element-clickable';
import {ConsoleReporter} from './console-reporter';
import {TestToModulesMatcher} from '../../../test-dependencies/test-to-modules-matcher';
import {showMessage} from './show-message';

const VIEWPORT_WIDTH_BREAKPOINTS = testConstants.ViewportWidthBreakpoints;
const baseURL = testConstants.URLs.BaseURL;

const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
/** We accept the empty message because this is what is sent on
 * 'beforeunload' due to an issue with Chromium (see
 * https://github.com/puppeteer/puppeteer/issues/3725). */
const acceptedBrowserAlerts = [
  '',
  'Changes that you made may not be saved.',
  'This action is irreversible. Are you sure?',
];

interface ClickDetails {
  position: {x: number; y: number};
  timeInMilliseconds: number;
}

declare global {
  interface Window {
    logClick: (clickDetails: ClickDetails) => void;
  }
}

export type ModalUserInteractions = (
  _this: BaseUser,
  container: string
) => Promise<void>;

export class BaseUser {
  page!: Page;
  browserObject!: Browser;
  userHasAcceptedCookies: boolean = false;
  email: string = '';
  username: string = '';
  startTimeInMilliseconds: number = -1;

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
    const specName = process.env.SPEC_NAME;
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
        this.startTimeInMilliseconds = Date.now();
        this.browserObject = browser;
        ConsoleReporter.trackConsoleMessagesInBrowser(browser);
        if (!mobile) {
          TestToModulesMatcher.setGoldenFilePath(
            `core/tests/test-modules-mappings/acceptance/${specName}.txt`
          );
          TestToModulesMatcher.registerPuppeteerBrowser(browser);
        }
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
          this.page.setViewport({width: 1920, height: 1080});
        }
        this.page.on('dialog', async dialog => {
          const alertText = dialog.message();
          if (acceptedBrowserAlerts.includes(alertText)) {
            await dialog.accept();
          } else {
            throw new Error(`Unexpected alert: ${alertText}`);
          }
        });
        this.setupDebugTools();
      });

    return this.page;
  }

  /**
   * Checks if the application is in development mode.
   * @returns {Promise<boolean>} Returns true if the application is in development mode,
   * false otherwise.
   */
  async isInProdMode(): Promise<boolean> {
    const prodMode = process.env.PROD_ENV === 'true';
    return prodMode;
  }

  /**
   * Function to setup debug methods for the current page of any acceptance
   * test.
   */
  private async setupDebugTools(): Promise<void> {
    await this.setupClickLogger();
  }

  /**
   * This function sets up a click logger that logs click events to the
   * terminal.
   *
   * Any time this.page object is replaced, this function must be called
   * again before it start logging clicks again.
   */
  private async setupClickLogger(): Promise<void> {
    await this.page.exposeFunction(
      'logClick',
      ({position: {x, y}, timeInMilliseconds}: ClickDetails) => {
        // eslint-disable-next-line no-console
        console.log(
          `- Click position { x: ${x}, y: ${y} } from top-left corner ` +
            'of the viewport'
        );
        // eslint-disable-next-line no-console
        console.log(
          '- Click occurred ' +
            `${timeInMilliseconds - this.startTimeInMilliseconds} ms ` +
            'into the test'
        );
      }
    );
  }

  /**
   * This function logs click events from all enabled elements selected by
   * a given selector.
   *
   * The selector must be present in the document when called.
   *
   * this.setupClickLogger() must be called once before it can log click
   * events from the elements.
   */
  async logClickEventsFrom(selector: string): Promise<void> {
    await this.page.$$eval(
      selector,
      (elements: Element[], ...args: unknown[]) => {
        const selector = args[0] as string;
        for (const element of elements) {
          element.addEventListener('click', (event: Event) => {
            const mouseEvent = event as MouseEvent;
            // eslint-disable-next-line no-console
            console.log(`DEBUG: User clicked on ${selector}:`);
            window.logClick({
              position: {x: mouseEvent.clientX, y: mouseEvent.clientY},
              timeInMilliseconds: Date.now(),
            });
          });
        }
      },
      selector
    );
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
   * The function switches the current page to the tab that was just opened by
   * interacting with an element on the current page.
   */
  async switchToPageOpenedByElementInteraction(): Promise<void> {
    const newPage: Page =
      (await (
        await this.browserObject.waitForTarget(
          target => target.opener() === this.page.target()
        )
      ).page()) ?? (await this.browserObject.newPage());
    this.page = newPage;
    this.setupDebugTools();
  }

  /**
   * The function coordinates user interactions with the selected modal.
   */
  async doWithinModal({
    selector,
    beforeOpened = async (_this, container) => {
      await _this.page.waitForSelector(container, {visible: true});
    },
    whenOpened,
    afterClosing = async (_this, container) => {
      await _this.page.waitForSelector(container, {hidden: true});
    },
  }: {
    selector: string;
    beforeOpened?: ModalUserInteractions;
    whenOpened: ModalUserInteractions;
    afterClosing?: ModalUserInteractions;
  }): Promise<void> {
    await beforeOpened(this, selector);
    await whenOpened(this, selector);
    await afterClosing(this, selector);
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
   * The function clicks the element using the text on the button
   * and wait until the new page is fully loaded.
   */
  async clickAndWaitForNavigation(selector: string): Promise<void> {
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
      await Promise.all([
        this.page.waitForNavigation({
          waitUntil: ['networkidle2', 'load'],
        }),
        button.click(),
      ]);
    } else {
      await this.waitForElementToBeClickable(selector);
      await Promise.all([
        this.page.waitForNavigation({
          waitUntil: ['networkidle2', 'load'],
        }),
        this.page.click(selector),
      ]);
    }
  }

  /**
   * This function retrieves the text content of a specified element.
   */
  async getElementText(selector: string): Promise<string> {
    await this.page.waitForSelector(selector);
    const element = await this.page.$(selector);
    if (element === null) {
      throw new Error(`No element found for the selector: ${selector}`);
    }
    const textContent = await this.page.evaluate(el => el.textContent, element);
    return textContent ?? '';
  }

  /**
   * Checks if a given word is present on the page.
   * @param {string} word - The word to check.
   */
  async isTextPresentOnPage(text: string): Promise<boolean> {
    const pageContent = await this.page.content();
    return pageContent.includes(text);
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
    await this.page.goto(url, {waitUntil: ['networkidle0', 'load']});
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

  /**
   * This function checks the exploration accessibility by navigating to the
   * exploration page based on the explorationID.
   */
  async expectExplorationToBeAccessibleByUrl(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('ExplorationId is null');
    }
    const explorationUrlAfterPublished = `${baseURL}/create/${explorationId}#/gui/Introduction`;
    try {
      await this.page.goto(explorationUrlAfterPublished);
      showMessage('Exploration is accessible with the URL, i.e. published.');
    } catch (error) {
      throw new Error('The exploration is not public.');
    }
  }

  /**
   * This function checks the exploration inaccessibility by navigating to the
   * exploration page based on the explorationID.
   */
  async expectExplorationToBeNotAccessibleByUrl(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('ExplorationId is null');
    }
    const explorationUrlAfterPublished = `${baseURL}/create/${explorationId}#/gui/Introduction`;
    try {
      await this.page.goto(explorationUrlAfterPublished);
      throw new Error('The exploration is still public.');
    } catch (error) {
      showMessage('The exploration is not accessible with the URL.');
    }
  }

  /**
   * Waits for the page to fully load by checking the document's ready state.
   */
  async waitForPageToFullyLoad(): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
  }
}

export const BaseUserFactory = (): BaseUser => new BaseUser();
