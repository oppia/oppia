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

/**
 * @fileoverview Utility File for Playwright Acceptance Tests.
 */

import {ViewportSize} from '@playwright/test';
import {Page, ElementHandle} from '@playwright/test';
import isElementClickable from '../../functions/is-element-clickable';
import testConstants from './test-constants';
import {showMessage} from './show-message';

const toastMessageSelector = '.e2e-test-toast-message';

const VIEWPORT_WIDTH_BREAKPOINTS = testConstants.ViewportWidthBreakpoints;

const pagesWithDialogHandler = new WeakSet<Page>();

const usernameInputSelector = 'input.e2e-test-username-input';
const agreeToTermsCheckboxSelector = 'input.e2e-test-agree-to-terms-checkbox';
const registerButtonSelector = 'button.e2e-test-register-user:not([disabled])';
const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';

export class BaseUser {
  readonly page: Page;
  userHasAcceptedCookies: boolean = false;
  username: string | null = null;
  email: string | null = null;
  static instances: BaseUser[] = [];

  constructor(page: Page) {
    this.page = page;
    BaseUser.instances.push(this);
    if (!pagesWithDialogHandler.has(page)) {
      pagesWithDialogHandler.add(page);
      this.installPageDialogHandler();
    }
  }

  /**
   * This function navigates to the given URL.
   * @param {string} url - The URL to navigate to.
   * @param {boolean} verifyURL - Whether to verify that the final URL includes the given URL after navigation. Defaults to true.
   */
  async goto(url: string, verifyURL: boolean = true): Promise<void> {
    const currentUrl = this.page.url();

    // Normalize: only treat as "same page" if the URL matches exactly
    // or continues with /, ?, or # — not a hash fragment of a sub-route.
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

  /**
   * Installs a dialog handler on the page that automatically accepts known
   * browser alerts and throws on unexpected ones.
   */
  private installPageDialogHandler(): void {
    const acceptedBrowserAlerts = [
      '',
      'Changes that you made may not be saved.',
      'This action is irreversible.',
      'This action is irreversible. Are you sure?',
      'This action is irreversible. If you insist to proceed, please enter the commit message for the update',
    ];

    this.page.on('dialog', async dialog => {
      const alertText = dialog.message();
      if (acceptedBrowserAlerts.includes(alertText)) {
        await dialog.accept();
      } else {
        throw new Error(`Unexpected alert: ${alertText}`);
      }
    });
  }

  /**
   * Waits for Angular to finish any pending async operations.
   * This ensures the UI is stable before interacting with elements.
   */
  async waitForAngularStability(): Promise<void> {
    await this.page.evaluate(async () => {
      const win = window as unknown as {
        getAllAngularTestabilities?: () => {
          whenStable: (cb: () => void) => void;
        }[];
      };
      const testabilities = win.getAllAngularTestabilities?.();
      if (testabilities?.[0]) {
        await new Promise<void>(resolve =>
          testabilities[0].whenStable(() => resolve())
        );
      }
    });
  }

  /**
   * * This function types the text in the input field using its CSS selector or ElementHandle.
   * @param {string | ElementHandle<Element>} selector - The CSS selector or ElementHandle of the input field.
   * @param {string} text - The text to type.
   */
  async typeInInputField(
    selector: string | ElementHandle<Element>,
    text: string
  ): Promise<void> {
    let element =
      typeof selector === 'string'
        ? await this.page.waitForSelector(selector)
        : selector;
    if (!element) {
      throw new Error(`Element not found for selector: ${selector}`);
    }
    await this.waitForElementToStabilize(element);
    await this.waitForElementToBeClickable(element);
    await this.waitForElementToStabilize(selector);

    await element.type(text);
  }

  /**
   * Function to reload the current page.
   */
  async reloadPage(): Promise<void> {
    await this.page.reload({waitUntil: 'networkidle'});
  }

  /**
   * Function to sign in the user with the given email to the Oppia website.
   * @param {string} email - The email to sign in with.
   */
  async signInWithEmail(email: string): Promise<void> {
    await this.goto(testConstants.URLs.Home);
    if (!this.userHasAcceptedCookies) {
      await this.clickOnElementWithText('OK');
      this.userHasAcceptedCookies = true;
    }
    await this.clickOnElementWithText('Sign in');
    await this.typeInInputField(testConstants.SignInDetails.inputField, email);
    await this.clickAndWaitForNavigation('Sign In');
  }

  /**
   * This function signs up a new user with the given username and email.
   * @param {string} username - The username for the new user.
   * @param {string} email - The email for the new user.
   */
  async signUpNewUser(username: string, email: string): Promise<void> {
    await this.signInWithEmail(email);
    await this.typeInInputField(usernameInputSelector, username);
    await this.clickOnElementWithSelector(agreeToTermsCheckboxSelector);
    await this.expectElementToBeVisible(registerButtonSelector);
    await this.clickAndWaitForNavigation(LABEL_FOR_SUBMIT_BUTTON);
    this.username = username;
    this.email = email;
  }

  /**
   * Clicks on the element with the given text.
   * @param {string} text - The text of the element to click on.
   */
  async clickOnElementWithText(text: string): Promise<void> {
    // Normalize-space is used to remove the extra spaces in the text.
    // Check the documentation for the normalize-space function here :
    // https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/normalize-space.
    const element = await this.page.waitForSelector(
      `xpath=//*[contains(normalize-space(text()), normalize-space("${text}"))]`,
      {timeout: 10000}
    );

    if (!element) {
      throw new Error(`Element not found for text: ${text}`);
    }
    await this.clickOnElement(element);
    showMessage(`Element (text: ${text}) clicked.`);
  }

  /**
   * Waits for the static assets on the page to load.
   */
  async waitForStaticAssetsToLoad(): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
  }

  /**
   * This selects a value in a dropdown.
   * @param {string} selector - The CSS selector of the dropdown element.
   * @param {string} option - The value of the option to select.
   */
  async select(selector: string, option: string): Promise<void> {
    await this.expectElementToBeVisible(selector);
    await this.waitForElementToBeClickable(selector);
    await this.page.selectOption(selector, option);
  }

  /**
   * Waits and checks for the element to be visible.
   * @param {string} selector - The selector of the element to wait for.
   * @param {boolean} visible - Whether the element should be visible or not. Default is true.
   * @param {number} timeout - The maximum amount of time to wait, in milliseconds. Default is 10000.
   */
  async isElementVisible(
    selector: string,
    visible: boolean = true,
    timeout: number = 10000
  ): Promise<boolean> {
    try {
      if (visible) {
        await this.page.waitForSelector(selector, {
          state: 'visible',
          timeout: timeout,
        });
        showMessage(`Element (selector: ${selector}) is visible.`);
      } else {
        await this.page.waitForSelector(selector, {
          state: 'hidden',
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
   * Checks if a given text is present on the page.
   * @param {string} text - The text to check.
   */
  async isTextPresentOnPage(text: string): Promise<boolean> {
    const pageContent = await this.page.content();
    return pageContent.includes(text);
  }

  /**
   * Waits for the given element to be attached in the DOM.
   * @param {string} selector - The selector of the element to wait for.
   * @param {Page} context - The page on which the selector should be verified.
   * @param {number} timeout - The maximum time to wait in milliseconds.
   * If not provided, Playwright's default timeout is used (30 seconds).
   */
  async expectElementToBeAttachedInDOM(
    selector: string,
    context: Page = this.page,
    timeout?: number
  ): Promise<void> {
    const options: {state: 'attached'; timeout?: number} = {
      state: 'attached',
      ...(timeout !== undefined && {timeout}),
    };
    await context.waitForSelector(selector, options);
    showMessage(`Element ${selector} is attached in DOM.`);
  }

  /**
   * Verify that element is visible or not.
   * @param {string} selector - The selector of the element to verify.
   * @param {boolean} visibility - Whether the element should be visible or not.
   * @param {Page} context - The page on which the selector should be verified.
   * @param {number} timeout - The maximum time to wait in milliseconds.
   * If not provided, Playwright's default timeout is used (30 seconds).
   */
  async expectElementToBeVisible(
    selector: string,
    visibility: boolean = true,
    context: Page = this.page,
    timeout?: number
  ): Promise<void> {
    const options: {state: 'visible' | 'hidden'; timeout?: number} = {
      state: visibility ? 'visible' : 'hidden',
      ...(timeout !== undefined && {timeout}),
    };
    await context.waitForSelector(selector, options);
    showMessage(`Element ${selector} is ${visibility ? 'visible' : 'hidden'}.`);
  }

  /**
   * This function checks if the viewport is at mobile width.
   */
  isViewportAtMobileWidth(): boolean {
    return this.viewport.width < VIEWPORT_WIDTH_BREAKPOINTS.MOBILE_PX;
  }

  /**
   * This function returns the current viewport of the page.
   */
  get viewport(): ViewportSize {
    const viewport = this.page.viewportSize();
    if (viewport === null) {
      throw new Error('Viewport is not defined.');
    }
    return viewport;
  }

  /**
   * The function selects all text content and delete it.
   * @param {string} selector - The CSS selector of the element to clear text from.
   */
  async clearAllTextFrom(selector: string): Promise<void> {
    // Clicking three times on a line of text selects all the text.
    const element = await this.getElementInParent(selector);
    await this.waitForElementToBeClickable(element);
    await element.click();
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('A');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.press('Backspace');
  }

  /**
   * Waits for the given element to be visible, and then checks if the text
   * content matches the expected text.
   * @param {string} selector - The selector of the element to get text from.
   * @param {string} text - The expected text content.
   * @param {ElementHandle<Element>} context - The context in which the element is located.
   */
  async expectTextContentToBe(
    selector: string,
    text: string,
    context: ElementHandle<Element> | null = null
  ): Promise<void> {
    await this.expectElementToBeVisible(selector);

    try {
      await this.page.waitForFunction(
        ({selector, text}: {selector: string; text: string}) => {
          const element = document.querySelector(selector);
          return element && element.textContent?.trim() === text.trim();
        },
        {selector, text}
      );

      showMessage(`Text content of "${selector}" is "${text}".`);
    } catch (error) {
      const actualTextContent = context
        ? await context.evaluate(
            (el, selector) => el.querySelector(selector)?.textContent?.trim(),
            selector
          )
        : await this.page.evaluate(
            selector => document.querySelector(selector)?.textContent?.trim(),
            selector
          );

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const newError = new Error(
        `Text content of "${selector}" does not match the expected text.\n` +
          `Expected: "${text}"\n` +
          `Actual: "${actualTextContent}"\n` +
          'Original Error:\n' +
          errorMessage
      );
      throw newError;
    }
  }

  /**
   * Verify text content inside an element, waiting until it matches expected text.
   * @param {string} selector - The selector of the element to get text from.
   * @param {string} text - The expected text content.
   */
  async expectTextContentToContain(
    selector: string,
    text: string
  ): Promise<void> {
    await this.expectElementToBeVisible(selector);
    try {
      await this.page.waitForFunction(
        ({selector, text}: {selector: string; text: string}) => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim().includes(text.trim());
        },
        {selector, text}
      );
    } catch (error) {
      const actualText = await this.page.evaluate((selector: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim();
      }, selector);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const newError = new Error(
        `Element ${selector} does not contain "${text}". It contains "${actualText}".\n` +
          errorMessage
      );
      throw newError;
    }
  }

  /**
   * Expects the text content of the toast message to match the given expected message.
   * @param {string} expectedMessage - The expected message to match the toast message against.
   */
  async expectToastMessage(expectedMessage: string): Promise<void> {
    // The toast message disappears after a few seconds, so we need to process
    // the toastMessageElement as soon as we receive it. Otherwise, the text
    // within it may no longer be showing at the time of evaluation.
    const toastMessageElement = await this.page.waitForSelector(
      toastMessageSelector,
      {state: 'visible'}
    );
    const toastMessage = await this.page.evaluate(
      el => el.textContent?.trim() || '',
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
    const element = await context.waitForSelector(selector, {state: 'visible'});
    if (!element) {
      throw new Error(`Element with selector ${selector} not found.`);
    }
    return element;
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
   * The function clicks an element and waits until the new page is fully loaded.
   * @param {string} selector - The selector of button to click.
   * @param {boolean} useSelector - Whether to use the selector or the text.
   * @param {number} timeout - The maximum time to wait for navigation in milliseconds. Defaults to 60000.
   */
  async clickAndWaitForNavigation(
    selector: string,
    useSelector: boolean = false,
    timeout: number = 60000
  ): Promise<void> {
    const navigationPromise = this.page.waitForNavigation({
      waitUntil: 'networkidle',
      timeout,
    });

    if (useSelector) {
      await this.waitForElementToStabilize(selector);
      await this.clickOnElementWithSelector(selector);
    } else {
      await this.clickOnElementWithText(selector);
    }

    await navigationPromise;
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

  /**
   * This function waits for an element to be clickable either by its CSS selector or
   * by the ElementHandle.
   * @param {string | ElementHandle<Element>} selector - The CSS selector or ElementHandle of the element to wait for.
   */
  async waitForElementToBeClickable(
    selector: string | ElementHandle<Element>
  ): Promise<void> {
    const elementDesc = await this.getElementDescription(selector);
    showMessage(`Checking if element ${elementDesc} is clickable...`);
    const element =
      typeof selector === 'string'
        ? await this.page.waitForSelector(selector)
        : selector;
    try {
      await this.page.waitForFunction(isElementClickable, element, {
        timeout: 10000,
      });
    } catch (error) {
      if (error instanceof Error) {
        const clickabilityDiagnostics = await this.page.evaluate(
          (targetElement: Element) => {
            const describeElement = (el: Element | null): string => {
              if (!el) {
                return 'none';
              }

              const tag = el.tagName.toLowerCase();
              const id = el.id ? `#${el.id}` : '';
              const classNames = el.className
                ? String(el.className).trim().split(/\s+/).filter(Boolean)
                : [];
              const classes =
                classNames.length > 0 ? `.${classNames.join('.')}` : '';
              return `<${tag}${id}${classes}>`;
            };

            const rect = targetElement.getBoundingClientRect();
            const inViewport =
              rect.top <= window.innerHeight &&
              rect.bottom > 0 &&
              rect.left <= window.innerWidth &&
              rect.right > 0;

            const isNativeDisabled =
              (targetElement instanceof HTMLButtonElement ||
                targetElement instanceof HTMLInputElement ||
                targetElement instanceof HTMLSelectElement ||
                targetElement instanceof HTMLTextAreaElement ||
                targetElement instanceof HTMLOptionElement) &&
              targetElement.disabled;
            const isAriaDisabled =
              targetElement.getAttribute('aria-disabled') === 'true' ||
              targetElement.closest('[aria-disabled="true"]') !== null;
            const isDisabled = isNativeDisabled || isAriaDisabled;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const centerTopElement = document.elementFromPoint(
              centerX,
              centerY
            );
            const firstClientRect = targetElement.getClientRects()[0];
            const firstRectTopElement = firstClientRect
              ? document.elementFromPoint(
                  firstClientRect.left + firstClientRect.width / 2,
                  firstClientRect.top + firstClientRect.height / 2
                )
              : null;

            const isCoveredByOtherElement = [
              centerTopElement,
              firstRectTopElement,
            ]
              .filter(Boolean)
              .some(topElement => {
                if (!topElement) {
                  return false;
                }
                return (
                  topElement !== targetElement &&
                  !targetElement.contains(topElement) &&
                  !topElement.contains(targetElement)
                );
              });

            const blockingElement =
              [centerTopElement, firstRectTopElement]
                .filter(
                  topElement =>
                    topElement &&
                    topElement !== targetElement &&
                    !targetElement.contains(topElement) &&
                    !topElement.contains(targetElement)
                )
                .map(topElement => describeElement(topElement))[0] ?? 'none';

            const reasons: string[] = [];
            if (isDisabled) {
              reasons.push('Element is disabled.');
            }
            if (!inViewport) {
              reasons.push('Element is not in the viewport.');
            }
            if (isCoveredByOtherElement) {
              reasons.push(`Element is blocked by ${blockingElement}.`);
            }

            return {
              reasons,
              isDisabled,
              inViewport,
              isCoveredByOtherElement,
              blockingElement,
            };
          },
          element
        );
        await this.page.evaluate(({el, a, b}) => isElementClickable(el, a, b), {
          el: element,
          a: true,
          b: true,
        });
        const reasonsText =
          clickabilityDiagnostics.reasons.length > 0
            ? clickabilityDiagnostics.reasons
                .map(
                  (reason: string, index: number) => `${index + 1}. ${reason}`
                )
                .join('\n')
            : 'No specific reason detected from diagnostics.';

        error.message =
          `Element ${elementDesc} took too long to be clickable.\n` +
          `Detected reasons:\n${reasonsText}\n` +
          'Original Error:\n' +
          error.message;
      }
      throw error;
    }
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
   * Gets a human-readable description of an element for logging purposes.
   * If a string selector is provided, returns it directly.
   * If an ElementHandle is provided, extracts tag name and key attributes.
   * @param {string | ElementHandle<Element>} selector - The CSS selector or ElementHandle of the element to describe.
   */
  private async getElementDescription(
    selector: string | ElementHandle<Element>
  ): Promise<string> {
    if (typeof selector === 'string') {
      return selector;
    }
    try {
      const description = await selector.evaluate(el => {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className
          ? `.${el.className.toString().trim().split(/\s+/).join('.')}`
          : '';
        const text = el.textContent?.trim().slice(0, 30) || '';
        const textSuffix = text
          ? ` "${text}${el.textContent && el.textContent.trim().length > 30 ? '...' : ''}"`
          : '';
        return `<${tag}${id}${classes}>${textSuffix}`;
      });
      return description;
    } catch {
      return '<detached element>';
    }
  }

  /**
   * The function clicks the element matching the given CSS selector
   * @param {string} selector - The CSS selector of the element to click on.
   * @param {ElementHandle<Element>} parentElement - The parent element to search within.
   * @param {number} elementPlace - 1-based index to select nth element with the given selector.
   */
  async clickOnElementWithSelector(
    selector: string,
    parentElement?: ElementHandle | null,
    elementPlace?: number
  ): Promise<void> {
    await this.page.mouse.move(-1, -1);
    const context = parentElement ?? this.page;
    let element = await context.waitForSelector(selector, {timeout: 60000});

    // Get nth element if elementPlace is given.
    if (elementPlace) {
      const elements = await context.$$(selector);
      if (elements.length < elementPlace) {
        throw Error(
          `Only ${elements.length} elements found for selecter "${selector}".\n` +
            `Required atleast ${elementPlace}`
        );
      }

      element = elements[elementPlace - 1];
    }

    // Click on the element.
    if (!element) {
      throw new Error(`Element not found for selector ${selector}`);
    }
    await this.clickOnElement(element);
    showMessage(`Element (selector: ${selector}) clicked.`);
  }

  /**
   * Clicks on the given element after checking if it's clickable and not in
   * transition animation.
   * Note: This function doesn't have post-check.
   * @param {ElementHandle<Element>} element - The element to click on.
   * @param {Parameters<ElementHandle['click']>[0]} options - Click options.
   */
  async clickOnElement(
    element: ElementHandle<Element>,
    options: Parameters<ElementHandle['click']>[0] = {}
  ): Promise<void> {
    await this.waitForElementToStabilize(element);
    await this.waitForElementToBeClickable(element);
    await element.click(options);
  }

  /**
   * Checks if the mat chip with the given text content is visible.
   * @param textContent The text content of the mat chip.
   * @returns The element handle of the mat chip.
   */
  async expectMatChipToBeVisible(
    textContent: string
  ): Promise<ElementHandle<Element>> {
    const matChipElement = await this.page.waitForSelector(
      `xpath=//mat-chip[contains(text(), '${textContent}')]`
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
        await this.clickOnElement(matOptionElement);
        break;
      }
    }

    await this.page.waitForSelector('mat-option', {
      state: 'hidden',
    });
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
    await inputUploadHandle.setInputFiles(fileToUpload);
  }

  /**
   * Waits for an element to stabilize.
   * @param {string | ElementHandle<Element>} selector - The CSS selector or ElementHandle of the element.
   * @param {number} timeout - The timeout in milliseconds. Defaults to 5000.
   */
  async waitForElementToStabilize(
    selector: string | ElementHandle<Element>,
    timeout: number = 5000
  ): Promise<void> {
    let element =
      typeof selector === 'string'
        ? await this.page.waitForSelector(selector, {state: 'visible'})
        : selector;
    if (!element) {
      throw new Error('Element not found');
    }

    const elementDesc = await this.getElementDescription(selector);
    let previousBox = await element.boundingBox();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(100);

      // If selector is given, try getting the latest attached element.
      element =
        (typeof selector === 'string'
          ? await this.page.$(selector)
          : element) ?? element;
      if (!element) {
        showMessage(`Element ${elementDesc} seems to have detached.`);
        continue;
      }
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
        `Waiting for element ${elementDesc} to stabilize... ` +
          `moved from (${previousBox?.x?.toFixed(0)}, ${previousBox?.y?.toFixed(0)}) ` +
          `to (${currentBox?.x?.toFixed(0)}, ${currentBox?.y?.toFixed(0)})`
      );
      previousBox = currentBox;
    }

    showMessage(
      `Element ${elementDesc} did not stabilize within ${timeout} ms`
    );
  }
}

export const BaseUserFactory = (page: Page): BaseUser => {
  return new BaseUser(page);
};
