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

const actionStatusMessageSelector = '.e2e-test-status-message';

export class BaseUser {
  page!: Page;
  browserObject!: Browser;
  userHasAcceptedCookies: boolean = false;
  email: string = '';
  username: string = '';
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
            `${mobile ? 'mobile' : 'desktop'}-${specName}-${new Date().toISOString()}-${uniqueString}.mp4`.replace(
              /[^a-z0-9.-]/gi,
              '_'
            );

          const outputDir = testConstants.TEST_VIDEO_DIR;
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, {recursive: true});
          }

          const config = {
            followNewTab: true,
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

          this.screenRecorder = new PuppeteerScreenRecorder(this.page, config);
          await this.screenRecorder.start(path.join(outputDir, outputFileName));

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
    let i: number = 0;
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
    for (const instance of BaseUser.instances) {
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
        i = i + 1;
      }
    }
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
    try {
      const element =
        typeof selector === 'string'
          ? await this.page.waitForSelector(selector)
          : selector;
      await this.page.waitForFunction(isElementClickable, {}, element);
    } catch (error) {
      if (error instanceof Error) {
        error.message =
          `Element with selector ${selector} took too long to be clickable.\n` +
          'Original Error:\n' +
          error.message;
      }
      throw error;
    }
    showMessage(`Element (${selector}) is clickable, as expected.`);
  }

  /**
   * The function clicks the element using the text on the button.
   * @param selector The text of the button to click on.
   * @param forceSelector If true, the function will try to find the element by its CSS selector.
   */
  async clickOn(
    selector: string,
    forceSelector: boolean = false
  ): Promise<void> {
    /** Normalize-space is used to remove the extra spaces in the text.
     * Check the documentation for the normalize-space function here :
     * https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/normalize-space */
    const [button] = await this.page.$x(
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
      await this.waitForElementToBeClickable(selector);
      showMessage(`Element (selector: ${selector}) is clickable, as expected.`);
      await this.page.click(selector);
      showMessage(`Element (selector: ${selector}) is clicked.`);
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
    await this.page.waitForSelector(selector, {visible: true});
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

    if (verifyURL && this.page.url() !== url) {
      // If the URL is not the expected one, throw an error.
      throw new Error(
        `Failed to navigate to ${url}. Current URL is ${this.page.url()}.`
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
    if (
      fs.existsSync(CONFIG_FILE) &&
      !(process.env.VIDEO_RECORDING_IS_ENABLED === '1')
    ) {
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
      } else {
        await this.page.waitForSelector(selector, {
          hidden: true,
          timeout: timeout,
        });
      }
      return true;
    } catch {
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
      if (typeof newPage !== 'undefined') {
        await newPage.close();
      }
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
    expectedDestinationPageUrl: string
  ): Promise<void> {
    await this.page.waitForXPath(`//a[contains(text(),"${anchorInnerText}")]`);
    const pageTarget = this.page.target();
    await this.clickOn(anchorInnerText);
    const newTarget = await this.browserObject.waitForTarget(
      target => target.opener() === pageTarget
    );
    const newTabPage = await newTarget.page();
    expect(newTabPage).toBeDefined();
    expect(newTabPage?.url()).toBe(expectedDestinationPageUrl);
    await newTabPage?.close();
  }

  /**
   * Creates a new tab in the browser and switches to it.
   */
  async createAndSwitchToNewTab(): Promise<puppeteer.Page> {
    const newPage = await this.browserObject.newPage();

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
   * Scrolls to the bottom of the page.
   */
  async scrollToBottomOfPage(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
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
   */
  async expectElementToBeVisible(
    selector: string,
    visibility: boolean = true
  ): Promise<void> {
    const options = visibility ? {visible: true} : {hidden: true};
    await this.page.waitForSelector(selector, options);
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
   * Verify text content inside an element
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
      throw new Error(
        `Failed: Text content of "${selector}" is not "${text}".\nOriginal Error:\n${error.stack}`
      );
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

  /*
   * Checks if the text content of the element contains the given text.
   * @param selector The selector of the element.
   * @param text The text to check for.
   */
  async expectTextContentToContain(
    selector: string,
    text: string
  ): Promise<void> {
    await this.expectElementToBeVisible(selector);

    try {
      await this.page.waitForFunction(
        (selector: string, text: string) => {
          const element = document.querySelector(selector);
          return element?.textContent?.includes(text);
        },
        {},
        selector,
        text
      );

      showMessage(`Text content of "${selector}" contains "${text}".`);
    } catch (error) {
      const actualTextContent = await this.page.$eval(selector, element =>
        (element as HTMLElement).textContent?.trim()
      );
      error.message =
        `Failed: Text content of "${selector}" does not contain "${text}", it contains ${actualTextContent}.\n` +
        'Original Error:\n' +
        `${error.message}`;
      throw error;
    }
  }

  /**
   * Checks if element is clickable or not.
   */
  async expectElementToBeClickable(
    selector: string,
    clickable: boolean = true
  ): Promise<void> {
    const element = await this.page.$(selector);
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
   */
  async expectPageURLToContain(url: string): Promise<void> {
    await this.page.waitForFunction(
      (url: string) => {
        return window.location.href.includes(url);
      },
      {},
      url
    );
  }

  /**
   * Function to verify the value of the input field.
   * @param {string} selector - The selector of the input field.
   * @param {string} value - The expected value of the input field.
   */
  async expectInputValueToBe(selector: string, value: string): Promise<void> {
    await this.page.waitForFunction(
      (selector: string, value: string) => {
        const element: HTMLInputElement | null =
          document.querySelector(selector);
        return element?.value === value;
      },
      {},
      selector,
      value
    );
  }

  /**
   * This function returns all elements matching the given selector.
   * @param selector - The selector to find elements for.
   * @param parentElement - The parent element to search within.
   */
  async getAllElementsBySelector(
    selector: string,
    parentElement?: puppeteer.ElementHandle
  ): Promise<puppeteer.ElementHandle[]> {
    const context = parentElement ?? this.page;

    await context.waitForSelector(selector, {
      visible: true,
    });

    const elements = await context.$$(selector);

    if (!elements) {
      throw new Error(`No elements found for selector ${selector}`);
    }

    return elements;
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
}

export const BaseUserFactory = (): BaseUser => new BaseUser();
