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

var path = require('path');
var fs = require('fs');

import {toMatchImageSnapshot} from 'jest-image-snapshot';
import {PuppeteerScreenRecorder} from 'puppeteer-screen-recorder';
expect.extend({toMatchImageSnapshot});
const backgroundBanner = '.oppia-background-image';
const libraryBanner = '.e2e-test-library-banner';

const commonModalTitleSelector = '.e2e-test-modal-header';
const commonModalBodySelector = '.e2e-test-modal-body';
const commonModalConfirmBtnSelector = '.e2e-test-confirm-action-button';
const commonModalCancelBtnSelector = '.e2e-test-cancel-action-button';
const uploadErrorMessageDivSelector = '.e2e-test-upload-error-message';
const currentMatTabHeaderSelector = '.mat-tab-label-active';
const actionStatusMessageSelector = '.e2e-test-status-message';
const toastMessageSelector = '.e2e-test-toast-message';
const warningToastMessageSelector = '.e2e-test-toast-warning-message';
const warningToastCloseButtonSelector = '.e2e-test-close-toast-warning';

const VIEWPORT_WIDTH_BREAKPOINTS = testConstants.ViewportWidthBreakpoints;
const baseURL = testConstants.URLs.BaseURL;

const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
/** We accept the empty message because this is what is sent on
 * 'beforeunload' due to an issue with Chromium (see
 * https://github.com/puppeteer/puppeteer/issues/3725). */
const acceptedBrowserAlerts = [
  '',
  'Changes that you made may not be saved.',
  'This action is irreversible.',
  'This action is irreversible. Are you sure?',
  'This action is irreversible. If you insist to proceed, please enter the commit message for the update',
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
  pages: Page[] = [];
  browserObject!: Browser;
  userHasAcceptedCookies: boolean = false;
  email: string | null = null;
  username: string | null = null;
  startTimeInMilliseconds: number = -1;
  screenRecorder!: PuppeteerScreenRecorder;
  static instances: BaseUser[] = []; // Track instances.

  constructor() {
    BaseUser.instances.push(this);
  }

  /**
   * This is a function that opens a new browser instance for the user.
   */
  async openBrowser(): Promise<Page> {
    const args: string[] = [
      '--window-size=1920,1080',
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
        this.pages.push(this.page);

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

        // Enable Video Recording.
        if (process.env.VIDEO_RECORDING_IS_ENABLED === '1') {
          const uniqueString = Math.random().toString(36).substring(2, 8);
          const outputFileName =
            `${this.username}-${new Date().toISOString()}-${uniqueString}.mp4`.replace(
              /[^a-z0-9.-]/gi,
              '_'
            );

          const folderName =
            `${mobile ? 'mobile' : 'desktop'}-${specName}`.replace(
              /[^a-z0-9.-]/gi,
              '_'
            );
          const outputDir = path.join(testConstants.TEST_VIDEO_DIR, folderName);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, {recursive: true});
          }

          const config = {
            followNewTab: false,
            fps: 25,
            ffmpeg_Path: null,
            // Below dimensions are of recorded video.
            videoFrame: {
              width: 1280,
              height: 720,
            },
            aspectRatio: '16:9',
            videoCrf: 18,
            videoCodec: 'libx264',
            videoPreset: 'medium',
            videoBitrate: 1000,
            autopad: {
              color: 'black',
            },
            waitForFrameBeforeStart: 2000,
            waitForFrameAfterPageLoad: 2000,
            maxRetries: 3, // Add retry mechanism.
            ffmpegFlags: [
              // Additional ffmpeg flags for stability.
              '-movflags',
              '+faststart',
              '-max_muxing_queue_size',
              '9999',
            ],
          };

          const fullScreenRecordingPath = path.join(outputDir, outputFileName);
          showMessage(`Saving screen recording to ${fullScreenRecordingPath}`);
          this.screenRecorder = new PuppeteerScreenRecorder(this.page, config);
          await this.screenRecorder.start(fullScreenRecordingPath);

          // Ensure recording is stopped when the test fails.
          process.on('SIGTERM', async () => {
            await this.screenRecorder.stop();
          });
          process.on('SIGINT', async () => {
            await this.screenRecorder.stop();
          });
        }

        // Set up Download Folder.
        const downloadDir = testConstants.TEST_DOWNLOAD_DIR;

        // Ensure the folder exists.
        if (!fs.existsSync(downloadDir)) {
          fs.mkdirSync(downloadDir, {recursive: true});
        }

        // Enable download behavior using Chrome DevTools Protocol (CDP).
        const client = await this.page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: downloadDir,
        });

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
   * This function takes the screenshot of all the instances of browser during a test failure.
   */
  async captureScreenshotsForFailedTest(): Promise<void> {
    const specName = process.env.SPEC_NAME;
    const outputDir = testConstants.TEST_SCREENSHOT_DIR;
    const outputFileName = `${specName}-${new Date().toISOString()}`.replace(
      /[^a-z0-9.-]/gi,
      '_'
    );
    const randomString = Math.random().toString(36).substring(2, 8);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {recursive: true});
    }

    // Prepare an array of promises for screenshots.
    const screenshotPromises = BaseUser.instances.map(async (instance, i) => {
      if (instance.page) {
        await instance.page.screenshot({
          path: path.join(
            outputDir,
            outputFileName + randomString + `-instance-${i}.png`
          ),
        });
        showMessage(
          `Screenshot captured for test failure and saved as : ${path.join(outputDir, outputFileName + `-instance-${i}.png`)}`
        );
      }
    });

    // Await all screenshots to complete concurrently.
    await Promise.all(screenshotPromises);
    showMessage(`All screenshots captured for ${this.username}`);
  }

  /**
   * Checks if the application is in production mode.
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
    await this.clickAndWaitForNavigation('Sign In');
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
    await this.clickAndWaitForNavigation(LABEL_FOR_SUBMIT_BUTTON);
    this.username = username;
    this.email = email;
  }

  /**
   * Function to reload the current page.
   */
  async reloadPage(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.reload({waitUntil: ['networkidle0', 'load']});
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
   * Checks for a new page opened in the context of the current page.
   * @param cotext - The context in which the new page is opened.
   * @returns A promise that resolves to the new page.
   */
  async waitForNewPage(cotext: Page = this.page): Promise<Page> {
    const pageTarget = cotext.target();
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();
    expect(newTabPage).toBeDefined();
    if (!newTabPage) {
      throw new Error('Failed to get new page opened.');
    }
    return newTabPage;
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
    showMessage(`Checking if element ${selector} is clickable...`);
    const element =
      typeof selector === 'string'
        ? await this.page.waitForSelector(selector)
        : selector;
    try {
      await this.page.waitForFunction(isElementClickable, {}, element);
    } catch (error) {
      if (error instanceof Error) {
        await this.page.evaluate(isElementClickable, element, true, true);
        error.message =
          `Element with selector ${selector} took too long to be clickable.\n` +
          'Original Error:\n' +
          error.message;
      }
      throw error;
    }
  }

  /**
   * The function clicks the element using the text on the button.
   * @param selector The text of the button to click on.
   * @param forceSelector If true, the function will try to find the element by its CSS selector.
   * @param parentElement The parent element to search within.
   */
  async clickOn(
    selector: string,
    forceSelector: boolean = false,
    parentElement?: puppeteer.ElementHandle
  ): Promise<void> {
    const context = parentElement ?? this.page;
    /** Normalize-space is used to remove the extra spaces in the text.
     * Check the documentation for the normalize-space function here :
     * https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/normalize-space */
    const [button] = await context.$x(
      `\/\/*[contains(text(), normalize-space('${selector}'))]`
    );
    // If we fail to find the element by its XPATH, then the button is undefined and
    // we try to find it by its CSS selector.
    if (button !== undefined && !forceSelector) {
      await this.waitForElementToBeClickable(button);
      showMessage(`Button (text: ${selector}) is clickable, as expected.`);
      await button.click();
      showMessage(`Button (text: ${selector}) is clicked.`);
    } else {
      const element = await context.waitForSelector(selector, {visible: true});
      if (!element) {
        throw new Error(`Element not found for selector ${selector}`);
      }
      await this.waitForElementToBeClickable(element);
      showMessage(`Element (selector: ${selector}) is clickable, as expected.`);
      await element.click();
      showMessage(`Element (selector: ${selector}) is clicked.`);
    }
  }

  /**
   * Clicks on the element and returns a new page opened by the click.
   * @param selector The selector of the element.
   * @returns The new page opened by the click.
   */
  async clickOnElementAndGetNewPage(selector: string): Promise<Page> {
    const newPagePromise: Promise<Page> = new Promise<Page>(resolve =>
      this.browserObject.once('targetcreated', async target => {
        const page = await target.page();
        resolve(page);
      })
    );
    await this.clickOn(selector);
    const newPage = await newPagePromise;
    return newPage;
  }

  /**
   * Checks if the mat chip with the given text content is visible.
   * @param textContent The text content of the mat chip.
   * @returns The element handle of the mat chip.
   */
  async expectMatChipToBeVisible(
    textContent: string
  ): Promise<ElementHandle<Element>> {
    const matChipElement = await this.page.waitForXPath(
      `//mat-chip[contains(text(), '${textContent}')]`
    );
    if (!matChipElement) {
      throw new Error(`Mat chip with text ${textContent} not found.`);
    }
    return matChipElement;
  }

  /**
   * Selects the mat-option with the given value.
   * @param value The value of the mat-option to select.
   */
  async selectMatOption(value: string): Promise<void> {
    await this.page.waitForSelector('mat-option');
    const matOptionElements = await this.page.$$('mat-option');
    for (const matOptionElement of matOptionElements) {
      if (
        (await matOptionElement.evaluate(el => el.textContent?.trim())) ===
        value
      ) {
        await matOptionElement.click();
        break;
      }
    }

    await this.page.waitForSelector('mat-option', {
      hidden: true,
    });
  }

  /**
   * The function clicks the element using the text on the button
   * and wait until the new page is fully loaded.
   * @param selector - The selector of button to click.
   * @param options - The navigation options.
   */
  async clickAndWaitForNavigation(
    selector: string,
    options: puppeteer.WaitForOptions = {
      waitUntil: ['networkidle2', 'load'],
    }
  ): Promise<void> {
    const navigationPromise = this.page.waitForNavigation(options);

    await this.clickOn(selector, false);
    await navigationPromise;
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
    const element = await this.getElementInParent(selector);
    await element.click({clickCount: 3});
    await this.page.keyboard.press('Backspace');
  }

  /**
   * The function selects all text content and copies it.
   * @param {string} selector - The element from which the text is to
   * be copied.
   */
  async copyTextFrom(selector: string): Promise<void> {
    await this.waitForElementToBeClickable(selector);
    await this.page.click(selector, {clickCount: 3});
    await this.page.keyboard.down('ControlLeft');
    await this.page.keyboard.press('C');
    await this.page.keyboard.up('ControlLeft');
  }

  /**
   * The function selects all text content using Control+A and copies it.
   * @param {string} selector - The element from which the text is to
   * be copied.
   */
  async copyAllTextFrom(selector: string): Promise<void> {
    await this.waitForElementToBeClickable(selector);
    await this.page.click(selector);
    await this.page.keyboard.down('ControlLeft');
    await this.page.keyboard.press('A');
    await this.page.keyboard.press('C');
    await this.page.keyboard.up('ControlLeft');
  }

  /**
   * The function pastes all the text on the clipboard to
   * the given selector.
   * @param {string} selector - The element to which the text is to
   * be pasted.
   */
  async pasteTextTo(selector: string): Promise<void> {
    await this.waitForElementToBeClickable(selector);
    await this.page.click(selector);
    await this.page.keyboard.down('ControlLeft');
    await this.page.keyboard.press('V');
    await this.page.keyboard.up('ControlLeft');
  }

  /**
   * This function types the text in the input field using its CSS selector.
   */
  async type(selector: string, text: string): Promise<void> {
    await this.page.waitForSelector(selector, {visible: true});
    await this.waitForElementToStabilize(selector);
    await this.waitForElementToBeClickable(selector);
    await this.page.type(selector, text);
  }

  /**
   * This selects a value in a dropdown.
   */
  async select(selector: string, option: string): Promise<void> {
    await this.page.waitForSelector(selector);
    await this.waitForElementToBeClickable(selector);
    await this.page.select(selector, option);
  }

  /**
   * This function navigates to the given URL.
   */
  async goto(url: string, verifyURL: boolean = true): Promise<void> {
    await this.page.goto(url, {waitUntil: ['networkidle0', 'load']});

    if (verifyURL) {
      await this.page.waitForFunction(
        (url: string) => {
          return window.location.href.includes(url);
        },
        {},
        url
      );
    }
  }

  /**
   * This function uploads a file using the given file path.
   */
  async uploadFile(filePath: string): Promise<void> {
    const inputUploadHandle =
      await this.page.waitForSelector('input[type=file]');
    if (inputUploadHandle === null) {
      throw new Error('No file input found while attempting to upload a file.');
    }
    let fileToUpload = filePath;
    inputUploadHandle.uploadFile(fileToUpload);
  }

  /**
   * This function validates whether an anchor tag correctly links to external PDFs or links
   * that cannot be opened directly. Puppeteer, in headless mode, does not
   * natively support opening external PDFs.
   */
  async openExternalLink(selector: string, expectedUrl: string): Promise<void> {
    await this.page.waitForSelector(selector, {visible: true});
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
    showMessage(
      `Started closing broswer for ${this.username ?? 'unknown user'}.`
    );
    // Stop the screen recorder.
    if (this.screenRecorder) {
      try {
        await this.screenRecorder.stop();
        showMessage(
          `Screen recording stopped for ${this.username ?? 'unknown user'}.`
        );
      } catch (error) {
        showMessage(
          `Error while stopping screen recording for ${this.username}: ${error}`
        );
      }
    }

    const CONFIG_FILE = path.resolve(
      __dirname,
      '../../jest-runtime-config.json'
    );
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        if (configData.testFailureDetected) {
          fs.unlinkSync(CONFIG_FILE);
          // Signal all BaseUser instances to take screenshots.
          await this.captureScreenshotsForFailedTest();
        }
      } catch (error) {
        showMessage(
          `Error while taking screenshot for ${this.username ?? 'unknown user'}: ${error}`
        );
      }
    }
    await this.browserObject.close();
    showMessage(`Browser closed for ${this.username ?? 'unknown user'}.`);
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
      await this.goto(explorationUrlAfterPublished);
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
   * Waits and checks for the element to be visible.
   * @param {string} selector - The selector of the element to wait for.
   * @param {boolean} hidden - Whether the element should be hidden or not. Default is false.
   * @param {number} timeout - The maximum amount of time to wait, in milliseconds. Default is 30000.
   */
  async isElementVisible(
    selector: string,
    visible: boolean = true,
    timeout: number = 30000
  ): Promise<boolean> {
    try {
      if (visible) {
        await this.page.waitForSelector(selector, {
          visible: true,
          timeout: timeout,
        });
        showMessage(`Element (selector: ${selector}) is visible.`);
      } else {
        await this.page.waitForSelector(selector, {
          hidden: true,
          timeout: timeout,
        });
        showMessage(`Element (selector: ${selector}) is hidden.`);
      }
      return true;
    } catch {
      showMessage(
        `Element (selector: ${selector}) is not ${visible ? 'visible' : 'hidden'}.`
      );
      return false;
    }
  }

  /**
   * Waits for the static assets on the page to load.
   */
  async waitForStaticAssetsToLoad(): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
  }

  /**
   * Waits for the page to fully load by checking the document's ready state and waiting for the respective
   * HTML to load completely.
   *
   * Caution: Using this function multiple times in the same test can increase the test execution time,
   * as it waits for the page to fully load.
   */
  async waitForPageToFullyLoad(): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.waitTillHTMLRendered(this.page);
  }

  /**
   * This function waits until a page is fully rendered.
   * It does so via checking every second if the size of the HTML content of the page is stable.
   * If the size is stable for at least 3 checks, it considers the page fully rendered.
   * If the size is not stable within the timeout, it stops checking.
   * @param {Page} page - The page to wait for.
   * @param {number} timeout - The maximum amount of time to wait, in milliseconds. Default is 30000.
   */
  private async waitTillHTMLRendered(
    page: Page,
    timeout: number = 30000
  ): Promise<void> {
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while (checkCounts++ <= maxChecks) {
      let html = await page.content();
      let currentHTMLSize = html.length;

      if (lastHTMLSize !== 0 && currentHTMLSize === lastHTMLSize) {
        countStableSizeIterations++;
      } else {
        countStableSizeIterations = 0;
      }
      if (countStableSizeIterations >= minStableSizeIterations) {
        showMessage('Page rendered fully.');
        break;
      }

      lastHTMLSize = currentHTMLSize;
      await page.waitForTimeout(checkDurationMsecs);
    }
  }

  /**
   * This function takes a screenshot of the page.
   * If there's no image with the given filename, it stores the screenshot with the given filename in the folder:
   *   - prod-desktop-screenshots or prod-mobile-screenshots for screenshots in production mode
   *   - dev-desktop-screenshots or dev-mobile-screenshots for screenshots in development mode
   * Otherwise, it compares the screenshot with the image named as the given string
   * to check if they match. If they don't match, it generates an image in the folder
   * diff-snapshots to show the difference. To check the folder on CI, download the artifact folder
   * diff-snapshots from the github workflow.
   * To replace the screenshot(s), simply delete the screenshot(s) and rerun the acceptance test.
   * Name the image by describing what the page is, and add 'with..' if there's something notable in the screenshots.
   * @param {string} imageName - The name for the image
   * @param {string} testPath - The path of the file that called this function
   * @param {Page|undefined} newPage - The page to take screenshot from. If not
   *     specified, uses this.page instead.
   */
  async expectScreenshotToMatch(
    imageName: string,
    testPath: string,
    newPage?: Page
  ): Promise<void> {
    const currentPage = typeof newPage !== 'undefined' ? newPage : this.page;
    await currentPage.mouse.move(0, 0);
    // To wait for all images to load and the page to be stable.
    await currentPage.waitForTimeout(5000);

    /* The variable failureTrigger is the percentage of the difference between the stored screenshot and the current screenshot that would trigger a failure
     * In general, it is set as 0.04/4% (desktop) 0.042/4.2% (mobile) for the randomness of the page that are small enough to be ignored.
     * Based on the existence of the background/library banner, which are randomly selected from a set of four,
     * failureTrigger is set in the specific percentage for the randomness of the banner in desktop mode and mobile mode.
     */
    var failureTrigger = 0;
    var dirName = '';
    if (this.isViewportAtMobileWidth()) {
      if (await this.isInProdMode()) {
        dirName = '/prod-mobile-screenshots';
      } else {
        dirName = '/dev-mobile-screenshots';
      }
      failureTrigger += 0.048;
      if (await currentPage.$(backgroundBanner)) {
        failureTrigger += 0.0352;
      } else if (await currentPage.$(libraryBanner)) {
        failureTrigger += 0.0039;
      }
    } else {
      if (await this.isInProdMode()) {
        dirName = '/prod-desktop-screenshots';
      } else {
        dirName = '/dev-desktop-screenshots';
      }
      failureTrigger += 0.04;
      if (await currentPage.$(backgroundBanner)) {
        failureTrigger += 0.03;
      } else if (await currentPage.$(libraryBanner)) {
        failureTrigger += 0.006;
      }
    }

    try {
      expect(await currentPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: failureTrigger,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: imageName,
        customSnapshotsDir: path.join(testPath, dirName),
        /*
         * The following checks if the tests are running on CI. If it is, the folder diff-snapshots will be uploaded as
         * artifacts in the github workflow.
         */
        customDiffDir: __dirname.startsWith('/home/runner')
          ? path.join(
              '/home/runner/work/oppia/oppia/core/tests/puppeteer-acceptance-tests/diff-snapshots',
              path.basename(dirName)
            )
          : path.join(testPath, dirName, 'diff-snapshots'),
      });
    } catch (error) {
      if (__dirname.startsWith('/home/runner')) {
        throw new Error(
          error.message +
            '\r\nDownload the artifact folder diff-snapshots from the github workflow to check the screenshot(s).'
        );
      } else {
        throw new Error(error.message);
      }
    }
  }

  /**
   * Waits for the network to become idle on the given page.
   *
   * If the network does not become idle within the specified timeout, this function will log a message and continue. This is
   * because the main objective of the test is to interact with the page, not specifically to ensure that the network becomes
   * idle within a certain timeframe. However, a timeout of 30 seconds should be sufficient for the network to become idle in
   * almost all cases and for the page to fully load.
   *
   * @param {Object} options The options to pass to page.waitForNetworkIdle. Defaults to {timeout: 30000, idleTime: 500}.
   * @param {Page} page The page to wait for network idle. Defaults to the current page.
   */
  async waitForNetworkIdle(
    options: {timeout?: number; idleTime?: number} = {
      timeout: 30000,
      idleTime: 500,
    },
    page: Page = this.page
  ): Promise<void> {
    try {
      await page.waitForNetworkIdle(options);
    } catch (error) {
      if (error.message.includes('Timeout')) {
        showMessage(
          'Network did not become idle within the specified timeout, but we can continue.'
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Function to click an anchor tag and check if it opens the expected destination
   * in a new tab. Closes the tab afterwards.
   */
  async clickLinkAnchorToNewTab(
    anchorInnerText: string,
    expectedDestinationPageUrl: string,
    closePage: boolean = true,
    context: Page = this.page
  ): Promise<Page | null> {
    const xpath = `//a[normalize-space(.)="${anchorInnerText}"]`;
    const element = await context.waitForXPath(xpath);
    const pageTarget = context.target();
    await element?.click();
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();
    if (!newTabPage) {
      throw new Error('No new tab opened.');
    }
    await newTabPage.bringToFront();
    expect(newTabPage).toBeDefined();
    expect(newTabPage.url()).toBe(expectedDestinationPageUrl);
    if (closePage) {
      await newTabPage.close();
      return null;
    }
    return newTabPage;
  }

  /**
   * Verify that the anchor tag with the given inner text is present on the page.
   * @param {string} anchorInnerText - The inner text of the anchor tag.
   * @param {string} targetPageUrl - The URL of the page to which the anchor tag should link.
   * @param {puppeteer.Page} context - The page on which the anchor tag should be verified.
   */
  async verifyAnchorTagIsPresent(
    anchorInnerText: string,
    targetPageUrl: string,
    context: puppeteer.Page = this.page
  ): Promise<void> {
    const anchor = await context.waitForSelector(`a[href="${targetPageUrl}"]`);
    expect(anchor).toBeTruthy();
    const anchorText = await anchor?.evaluate(el =>
      (el as HTMLAnchorElement).innerText.trim()
    );
    expect(anchorText).toEqual(anchorInnerText);
  }

  /**
   * Clicks on an anchor element with the given inner text and verifies that the
   * target page URL contains the given URL.
   * @param anchorInnerText The inner text of the anchor element.
   * @param targetPageUrl The URL of the target page.
   * @param context The context in which the anchor element is located.
   */
  async clickAndVerifyAnchorWithInnerText(
    anchorInnerText: string,
    targetPageUrl: string,
    context: Page = this.page
  ): Promise<void> {
    // Get an anchor element with the given inner text.
    await context.waitForSelector('a');
    const anchorElements = await context.$$('a');
    let element: puppeteer.ElementHandle<Element> | null = null;
    for (const anchorElement of anchorElements) {
      const innerText = await anchorElement.evaluate(el =>
        (el as HTMLAnchorElement).innerText.trim()
      );
      if (innerText === anchorInnerText) {
        element = anchorElement;
        break;
      }
    }
    if (!element) {
      throw new Error(`Anchor with inner text ${anchorInnerText} not found.`);
    }

    // Check if anchor target is the same as the current page.
    const isTargetSamePage = await element.evaluate(el => {
      return (el as HTMLAnchorElement).target !== '_blank';
    });
    if (!isTargetSamePage) {
      showMessage('Anchor target is not the same as the current page.');
      const pageTarget = context.target();
      await element.click();
      const newTarget = await this.browserObject.waitForTarget(
        target => target.opener() === pageTarget
      );
      const newTabPage = await newTarget.page();
      expect(newTabPage).toBeDefined();
      expect(newTabPage?.url()).toBe(targetPageUrl);
      await newTabPage?.close();
    } else {
      showMessage('Anchor target is the same as the current page.');
      await element.click();
      await this.expectPageURLToContain(targetPageUrl, context);
      await context.goBack();
    }
  }

  /**
   * Creates a new tab in the browser and switches to it.
   */
  async createAndSwitchToNewTab(): Promise<puppeteer.Page> {
    const newPage = await this.browserObject.newPage();
    this.pages.push(newPage);

    if (this.isViewportAtMobileWidth()) {
      // Set viewport for mobile.
      await newPage.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        isLandscape: false,
      });
      await newPage.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) ' +
          'AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 ' +
          'Mobile/15A372 Safari/604.1'
      );
    } else {
      // Set viewport for desktop.
      await newPage.setViewport({width: 1920, height: 1080});
    }

    await newPage.bringToFront();
    this.page = newPage;
    return newPage;
  }

  /**
   * Switches to the previous page.
   */
  async switchToNextPage(): Promise<void> {
    const currentPageIndex = this.pages.indexOf(this.page);
    if (currentPageIndex === -1) {
      throw new Error('Current page not found in pages array.');
    }
    const nextPageIndex = (currentPageIndex + 1) % this.pages.length;
    this.page = this.pages[nextPageIndex];

    this.page.bringToFront();
  }

  /**
   * Switches to the previous page.
   */
  async switchToPreviousPage(): Promise<void> {
    const currentPageIndex = this.pages.indexOf(this.page);
    if (currentPageIndex === -1) {
      throw new Error('Current page not found in pages array.');
    }
    const previousPageIndex =
      (currentPageIndex - 1 + this.pages.length) % this.pages.length;
    this.page = this.pages[previousPageIndex];

    this.page.bringToFront();
  }

  /**
   * Scrolls to the bottom of the page.
   */
  async scrollToBottomOfPage(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.waitForPageToFullyLoad();
  }

  /**
   * Scrolls to the top of the page.
   */
  async scrollToTopOfPage(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await this.waitForPageToFullyLoad();
  }

  /**
   * Returns text in nested element
   * @param {string} selector - The selector of the element to get text from.
   */
  async getTextContent(selector: string): Promise<string> {
    const element = await this.page.$(selector);
    const text = await this.page.evaluate(
      (el: Element) => el.textContent,
      element
    );
    return text?.trim() ?? '';
  }

  /**
   * Verify text content inside an element, waiting until it matches expected text.
   * @param selector - The selector of the element to get text from.
   * @param expectedText - The expected text content.
   */
  async expectElementContentToBe(
    selector: string,
    expectedText: string
  ): Promise<void> {
    try {
      await this.page.waitForFunction(
        (sel: string, text: string) => {
          const el = document.querySelector(sel);
          return el && el.textContent?.trim() === text;
        },
        {timeout: 5000},
        selector,
        expectedText
      );
    } catch (err) {
      const currentText = await this.getTextContent(selector);
      throw new Error(
        `Text did not match within timeout.\nSelector: "${selector}"\nExpected: "${expectedText}"\nActual: "${currentText}"`
      );
    }
  }

  /**
   * Verify that element is visilbe or not.
   * @param {string} selector - The selector of the element to get text from.
   * @param {boolean} visibility - Whether the element should be visible or not.
   * @param {Page} context - The page on which the selector should be verified.
   */
  async expectElementToBeVisible(
    selector: string,
    visibility: boolean = true,
    context: Page = this.page
  ): Promise<void> {
    const options = visibility ? {visible: true} : {hidden: true};
    await context.waitForSelector(selector, options);
    showMessage(`Element ${selector} is ${visibility ? 'visible' : 'hidden'}.`);
  }

  /**
   * Verify text content inside an element
   * @param {string} selector - The selector of the element to get text from.
   * @param {string} text - The expected text content.
   */
  async expectTextContentToMatch(
    selector: string,
    textContent: string
  ): Promise<void> {
    await this.page.waitForFunction(
      (selector: string, value: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() === value;
      },
      {},
      selector,
      textContent
    );
  }

  /**
   * Waits for the given element to be visible, and then checks if the text
   * content matches the expected text.
   * @param {string} selector - The selector of the element to get text from.
   * @param {string} text - The expected text content.
   */
  async expectTextContentToBe(selector: string, text: string): Promise<void> {
    await this.expectElementToBeVisible(selector);

    try {
      await this.page.waitForFunction(
        (selector: string, text: string) => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() === text.trim();
        },
        {},
        selector,
        text
      );

      showMessage(`Text content of "${selector}" is "${text}".`);
    } catch (error) {
      const actualTextContent = await this.page.evaluate((selector: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim();
      }, selector);
      error.message =
        `Text content of "${selector}" does not match the expected text.\n` +
        `Expected: "${text}"\n` +
        `Actual: "${actualTextContent}"\n` +
        'Original Error:\n' +
        error.message;
      throw error;
    }
  }

  /**
   * Verify text content inside an element, waiting until it matches expected text.
   * @param selector - The selector of the element to get text from.
   * @param expectedText - The expected text content.
   */
  async expectElementContentToContain(
    selector: string,
    expectedText: string
  ): Promise<void> {
    try {
      await this.page.waitForFunction(
        (sel: string, text: string) => {
          const el = document.querySelector(sel);
          return el && el.textContent?.includes(text);
        },
        {},
        selector,
        expectedText
      );
    } catch (err) {
      const currentText = await this.getTextContent(selector);
      throw new Error(
        `Text did not match within timeout.\nSelector: "${selector}"\nExpected: "${expectedText}"\nActual: "${currentText}"`
      );
    }
  }

  /*
   * Checks if the text content of the element contains the given text.
   * @param selector The selector of the element.
   * @param text The text to check for.
   */
  async expectTextContentToContain(
    selector: string,
    text: string
  ): Promise<void> {
    try {
      await this.page.waitForFunction(
        (selector: string, text: string) => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim().includes(text.trim());
        },
        {},
        selector,
        text
      );
    } catch (error) {
      const actualText = await this.page.evaluate((selector: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim();
      }, selector);
      error.message =
        `Element ${selector} does not contain "${text}". It contains "${actualText}".\n` +
        error.message;
      throw error;
    }
  }

  /**
   * Function to find an element by its CSS selector.
   * @param {string} selector - The CSS selector of the element.
   * @param {ElementHandle<Element>} parentElement - The parent element to search in.
   * @returns {Promise<ElementHandle<Element>>} The element handle.
   */
  async getElementInParent(
    selector: string,
    parentElement?: ElementHandle<Element>
  ): Promise<ElementHandle<Element>> {
    const context = parentElement ?? this.page;
    const element = await context.waitForSelector(selector, {visible: true});
    if (!element) {
      throw new Error(`Element with selector ${selector} not found.`);
    }
    return element;
  }

  /**
   * Verifies that the element value matches the expected value.
   * @param {string | ElementHandle<Element>} selector - The CSS selector of the element.
   * @param {string} value - The expected value.
   */
  async expectElementValueToBe(
    selector: string | ElementHandle,
    value: string
  ): Promise<void> {
    // Change the selector to the actual element.
    if (typeof selector === 'string') {
      await this.expectElementToBeVisible(selector);
      selector = await this.getElementInParent(selector);
    }

    // Wait until the element value matches the expected value.
    try {
      await this.page.waitForFunction(
        (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
          return element.value.trim() === value;
        },
        {},
        selector,
        value
      );
    } catch (error) {
      throw new Error(
        `Element ${selector} does not have the expected value "${value}". ` +
          `Found "${await selector.evaluate(el => (el as HTMLInputElement).value)}".\n` +
          `Original Error: ${error.stack}`
      );
    }
  }

  /**
   * Checks if element is clickable or not.
   */
  async expectElementToBeClickable(
    selector: string | ElementHandle<Element>,
    clickable: boolean = true
  ): Promise<void> {
    const element =
      typeof selector === 'string'
        ? await this.page.waitForSelector(selector)
        : selector;
    await this.page.waitForFunction(isElementClickable, {}, element, clickable);
  }

  /**
   * Helper method to wait for a action progress message to disappear
   * @param {string} progressMessage - The processing message to wait for completion
   */
  private async waitForProgressMessageDisappear(progressMessage: string) {
    const maxWaitTime = 10000; // 10 seconds.
    const pollInterval = 500; // 500ms.
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const currentMessage = await this.page.$eval(
        actionStatusMessageSelector,
        el => el.textContent?.trim()
      );

      // If the current message doesn't contain the processing message, we're done.
      if (!currentMessage?.includes(progressMessage)) {
        return;
      }

      // Wait before checking again.
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // If we get here, processing didn't complete within the timeout.
    throw new Error(
      `Progress message "${progressMessage}" did not disappear within ${maxWaitTime}ms`
    );
  }

  /**
   * Verifies that the action status message matches the expected message.
   * @param {string} statusMessage - The expected status message to check for.
   * @param {string} [progressMessage] - Optional processing message to wait for before checking the expected message.
   * @throws {Error} If the actual status message does not match the expected message according to the comparison type.
   */
  async expectActionStatusMessageToBe(
    statusMessage: string,
    progressMessage?: string
  ): Promise<void> {
    // If progressMessage is provided, wait for it to disappear.
    if (progressMessage) {
      await this.waitForProgressMessageDisappear(progressMessage);
    }

    await this.expectTextContentToContain(
      actionStatusMessageSelector,
      statusMessage
    );
  }

  /**
   * This function checks if the page URL contains the given URL.
   * @param {string} url - The URL to check.
   * @param {Page} context - The page on which the URL should be checked.
   */
  async expectPageURLToContain(
    url: string,
    context: Page = this.page
  ): Promise<void> {
    await context.waitForFunction(
      (url: string) => {
        return window.location.href.includes(url);
      },
      {},
      url
    );
  }

  /**
   * Function to verify that the anchor opens the correct page.
   * @param {string} selector - The selector of the anchor.
   * @param {string} newPageURL - The expected page.
   */
  async expectAnchorToOpenCorrectPage(
    selector: string,
    newPageURL: string
  ): Promise<void> {
    await this.expectElementToBeVisible(selector);

    const newPagePromise: Promise<Page> = new Promise<Page>(resolve => {
      this.browserObject.once(
        'targetcreated',
        async (target: puppeteer.Target) => {
          const newTab = await target.page();
          if (newTab) {
            await newTab.bringToFront();
            resolve(newTab);
          }
        }
      );
    });
    await this.page.click(selector);
    const newPage = await newPagePromise;

    await newPage.waitForFunction(
      (expectedURL: string) => {
        return document.URL.includes(expectedURL);
      },
      {},
      newPageURL
    );

    await newPage.close();
  }

  /**
   * Function to update the mat-option.
   * @param {string} selector - The selector of the mat-option.
   * @param {string} value - The value to be updated.
   * @param {ElementHandle<Element>} parentElement - The parent element to search in.
   */
  async updateMatOption(
    selector: string,
    value: string,
    parentElement?: ElementHandle<Element>
  ): Promise<void> {
    try {
      // Get context where the selector is located.
      const context = parentElement ?? this.page;
      await context.waitForSelector(selector);

      // Click on select element.
      const selectElement = await this.getElementInParent(
        selector,
        parentElement
      );
      await selectElement.click();

      // Select the option.
      await this.page.waitForSelector('mat-option');
      const options = await this.page.$$('mat-option');
      const optionTexts: string[] = [];

      let optionElement: ElementHandle<Element> | null = null;
      for (const option of options) {
        const optionText = await option.evaluate(el => el.textContent?.trim());
        optionTexts.push(optionText ?? 'Undefined');
        if (optionText === value) {
          optionElement = option;
          break;
        }
      }

      if (!optionElement) {
        throw new Error(
          `Option "${value}" not found.\n` +
            `Found options: "${optionTexts.join('", "')}"`
        );
      }

      // Click on the option.
      await optionElement.click();

      // Verify the value of the select is updated.
      await this.expectTextContentToBe(selector, value);
    } catch (error) {
      const newError = new Error(`Failed to update mat-option: ${error}`);
      newError.stack = error.stack;
      throw newError;
    }
  }

  /**
   * This function returns the text contents of the given elements.
   * @param elements - The elements to get the text contents from.
   */
  async getTextContentsFromElements(
    elements: ElementHandle[]
  ): Promise<string[]> {
    const textContents: string[] = [];

    for (const element of elements) {
      const textContent = await element.evaluate(element =>
        element.textContent?.trim()
      );
      textContents.push(textContent ?? '');
    }

    return textContents;
  }

  /**
   * Verifies that the tooltip text matches the expected tooltip text.
   * @param {string} selector - The selector of the element to hover over.
   * @param {string} expectedToolTip - The expected tooltip text.
   */
  async expectToolTipTextToBe(
    selector: string,
    expectedToolTip: string
  ): Promise<void> {
    // Hover over element.
    await this.page.waitForSelector(selector, {visible: true});
    await this.page.hover(selector);

    // Wait for the tooltip to appear.
    await this.page.waitForSelector('.tooltip', {
      visible: true,
    });

    // Check the tooltip content.
    const tooltipText = await this.page.$eval('.tooltip', el => el.textContent);

    // Verify Tooltip.
    expect(tooltipText).toBe(expectedToolTip);
  }

  /**
   * Waits until the click function is attached to the given selector.
   * @param {string} selector - The selector of the element.
   */
  async waitUntilClickFunctionIsAttached(selector: string): Promise<void> {
    await this.page.waitForFunction(
      (selector: string) => {
        const el: HTMLInputElement | null = document.querySelector(selector);
        return el?.click !== undefined || el?.addEventListener || el?.click;
      },
      {},
      selector
    );
  }

  /**
   * Waits for an element to stabilize.
   * @param {string} selector - The selector of the element.
   * @param {number} timeout - The timeout in milliseconds.
   */
  async waitForElementToStabilize(
    selector: string | ElementHandle<Element>,
    timeout: number = 5000
  ): Promise<void> {
    const element =
      typeof selector === 'string'
        ? await this.page.waitForSelector(selector, {visible: true})
        : selector;
    if (!element) {
      throw new Error('Element not found');
    }

    let previousBox = await element.boundingBox();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(100);
      const currentBox = await element.boundingBox();

      if (
        previousBox &&
        currentBox &&
        Math.abs(previousBox.x - currentBox.x) < 1 &&
        Math.abs(previousBox.y - currentBox.y) < 1
      ) {
        return;
      }

      showMessage(
        `Waiting for element ${selector} to stabilize...\n` +
          `Previous Position: ${previousBox?.x?.toFixed(4)}, ${previousBox?.y?.toFixed(4)}\n` +
          `Current Position: ${currentBox?.x?.toFixed(4)}, ${currentBox?.y?.toFixed(4)}`
      );
      previousBox = currentBox;
    }

    showMessage(`Element ${selector} did not stabilize within ${timeout} ms`);
  }

  /**
   * Checks if the modal title matches the expected title.
   * @param expectedTitle The expected title of the modal.
   */
  async expectModalTitleToBe(expectedTitle: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToBe(commonModalTitleSelector, expectedTitle);
  }

  /**
   * Checks if the modal body contains the expected text.
   * @param expectedText The expected text of the modal body.
   */
  async expectModalBodyToContain(expectedText: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalBodySelector);
    await this.expectTextContentToContain(
      commonModalBodySelector,
      expectedText
    );
  }

  /**
   * Checks if the current mat tab header matches the expected header.
   * @param expectedHeader The expected header of the mat tab.
   */
  async expectCurrentMatTabHeaderToBe(expectedHeader: string): Promise<void> {
    await this.expectElementToBeVisible(currentMatTabHeaderSelector);
    await this.expectTextContentToBe(
      currentMatTabHeaderSelector,
      expectedHeader
    );
  }

  /**
   * Returns all elements matching the given selector.
   * @param selector - The selector to find elements for.
   * @param parentElement - The parent element to search within.
   * @returns An array of ElementHandles.
   */
  async getAllElementsBySelector(
    selector: string,
    parentElement?: ElementHandle<Element>
  ): Promise<ElementHandle<Element>[]> {
    const context = parentElement ?? this.page;
    await context.waitForSelector(selector, {visible: true});

    const elements = await this.page.$$(selector);

    return elements;
  }

  /**
   * Expects the text content of the toast message to match the given expected message.
   * @param {string} expectedMessage - The expected message to match the toast message against.
   */
  async expectToastMessage(expectedMessage: string): Promise<void> {
    await this.page.waitForSelector(toastMessageSelector, {visible: true});
    const toastMessageElement = await this.page.$(toastMessageSelector);
    const toastMessage = await this.page.evaluate(
      el => el.textContent.trim(),
      toastMessageElement
    );

    if (toastMessage !== expectedMessage) {
      throw new Error(
        `Expected toast message to be "${expectedMessage}", but it was "${toastMessage}".`
      );
    }
    if (this.isViewportAtMobileWidth()) {
      await this.page.click(toastMessageSelector);
    }
    await this.expectElementToBeVisible(toastMessageSelector, false);
  }

  /**
   * Clicks on the button in the modal with the given title and action.
   * @param title - The title of the modal.
   * @param action - The action to click on the button in the modal.
   */
  async clickButtonInModal(
    title: string,
    action: 'confirm' | 'cancel'
  ): Promise<void> {
    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToBe(commonModalTitleSelector, title);

    const currentActionBtnSelector =
      action === 'confirm'
        ? commonModalConfirmBtnSelector
        : commonModalCancelBtnSelector;
    await this.expectElementToBeVisible(currentActionBtnSelector);
    await this.clickOn(currentActionBtnSelector);

    await this.expectElementToBeVisible(currentActionBtnSelector, false);
  }

  /**
   * Checks if the upload error message contains the expected text.
   * @param expectedErrorMessage The expected text of the upload error message.
   */
  async expectUploadErrorMessageToBe(
    expectedErrorMessage: string
  ): Promise<void> {
    await this.expectElementToBeVisible(uploadErrorMessageDivSelector);
    await this.expectTextContentToContain(
      uploadErrorMessageDivSelector,
      expectedErrorMessage
    );
  }

  /**
   * Checks if the toast warning message matches the expected warning message.
   * @param {string} expectedWarningMessage - The expected warning message.
   */
  async expectToastWarningMessageToBe(
    expectedWarningMessage: string
  ): Promise<void> {
    await this.expectElementToBeVisible(warningToastMessageSelector);
    await this.expectTextContentToContain(
      warningToastMessageSelector,
      expectedWarningMessage
    );
  }

  /**
   * Clicks on the close button in the toast warning message.
   */
  async closeToastWarningMessage(): Promise<void> {
    await this.expectElementToBeVisible(warningToastCloseButtonSelector);
    await this.clickOn(warningToastCloseButtonSelector);
    await this.expectElementToBeVisible(warningToastMessageSelector, false);
  }

  protected parseLocaleAbbreviatedDatetimeString(dateString: string): number {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if it's a time string (today) - format: "2:30 PM".
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
    const timeMatch = dateString.match(timeRegex);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();

      if (ampm === 'PM' && hours !== 12) {
        hours += 12;
      }
      if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }

      const date = new Date(today);
      date.setHours(hours, minutes, 0, 0);
      return date.getTime();
    }

    // Check if it's current year format - "MMM D" (e.g., "Oct 10").
    const currentYearRegex = /^([A-Za-z]{3})\s+(\d{1,2})$/;
    const currentYearMatch = dateString.match(currentYearRegex);

    if (currentYearMatch) {
      const monthStr = currentYearMatch[1];
      const day = parseInt(currentYearMatch[2]);

      // Parse month abbreviation.
      const monthMap: {[key: string]: number} = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };

      const month = monthMap[monthStr];
      if (month !== undefined) {
        const date = new Date(now.getFullYear(), month, day, 0, 0, 0, 0);
        return date.getTime();
      }
    }

    // Check if it's short date format - "MM/DD/YY" (e.g., "10/22/35").
    const shortDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
    const shortDateMatch = dateString.match(shortDateRegex);

    if (shortDateMatch) {
      const month = parseInt(shortDateMatch[1]) - 1;
      const day = parseInt(shortDateMatch[2]);
      let year = parseInt(shortDateMatch[3]);

      // Convert 2-digit year to 4-digit year.
      year += 2000;

      const date = new Date(year, month, day, 0, 0, 0, 0);
      return date.getTime();
    }

    // If no pattern matches, throw an error.
    throw new Error(`Unable to parse date string: "${dateString}"`);
  }

  /**
   * Clicks on the element with the given text.
   * @param text The text of the element to click on.
   */
  async clickOnElementWithText(text: string): Promise<void> {
    // Normalize-space is used to remove the extra spaces in the text.
    // Check the documentation for the normalize-space function here :
    // https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/normalize-space.
    const element = await this.page.waitForXPath(
      `//*[contains(normalize-space(text()), normalize-space("${text}"))]`,
      {timeout: 10000}
    );

    if (!element) {
      throw new Error(`Element not found for text: ${text}`);
    }
    await this.waitForElementToStabilize(element);
    await this.waitForElementToBeClickable(element);
    await element.click();
    showMessage(`Element (text: ${text}) is clicked.`);
  }
}

export const BaseUserFactory = (): BaseUser => new BaseUser();
