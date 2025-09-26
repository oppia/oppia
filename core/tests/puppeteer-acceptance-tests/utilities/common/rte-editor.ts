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
 * @fileoverview Utility class to interact with RTE editor.
 */

import puppeteer from 'puppeteer';

const rteTextAreaSelector = '.e2e-test-rte';
const ckeBtnOnClass = 'cke_button_on';
const paragraphFormatOptionSelector = 'a[title*="Format"]';
const bodyFocusedSelector = '.cke_focus';

export class RTEEditor {
  parentPage: puppeteer.Page;
  context: puppeteer.Page | puppeteer.ElementHandle;

  /**
   * Constructor for RTEEditor.
   * @param {puppeteer.Page} parentPage - The parent page.
   * @param {puppeteer.Page|puppeteer.ElementHandle} context - The context of the editor.
   */
  constructor(
    parentPage: puppeteer.Page,
    context: puppeteer.Page | puppeteer.ElementHandle
  ) {
    this.parentPage = parentPage;
    this.context = context;
  }

  /**
   * Clicks on the RTE option with the given title.
   * @param title - The title of RTE option.
   */
  async clickOnRTEOptionWithTitle(title: string): Promise<void> {
    const optionSelector = `a[title*="${title}"]`;
    await this.context.waitForSelector(optionSelector);
    const optionElement = await this.context.$(optionSelector);
    if (!optionElement) {
      throw new Error(`Option with title ${title} not found.`);
    }

    // Check if element is active or not to use in post check.
    const isActive = await optionElement.evaluate(
      (el: Element, cls: string) => {
        return el.classList.contains(cls);
      },
      ckeBtnOnClass
    );
    const initialInnerHTML = await this.parentPage.evaluate(
      (selector: string) => {
        // We are using innerHTML so, we can also track option changes.
        // eslint-disable-next-line oppia/no-inner-html
        return document.querySelector(selector)?.innerHTML;
      },
      rteTextAreaSelector
    );

    await optionElement.click();

    if (title.includes('Indent')) {
      await this.parentPage.waitForFunction(
        (selector: string, innerHTML: string) => {
          // We are using innerHTML so, we can also track option changes.
          // eslint-disable-next-line oppia/no-inner-html
          return document.querySelector(selector)?.innerHTML !== innerHTML;
        },
        {},
        rteTextAreaSelector,
        initialInnerHTML ?? ''
      );
    } else {
      try {
        await this.parentPage.waitForFunction(
          (selector: string, cls: string, present: boolean) => {
            const element = document.querySelector(selector);
            return element?.classList.contains(cls) === present;
          },
          {},
          optionSelector,
          ckeBtnOnClass,
          !isActive
        );
      } catch (error) {
        await this.parentPage.evaluate((selector: string) => {
          const element = document.querySelector(selector);
          // Log the class list for debugging purposes.
          // eslint-disable-next-line no-console
          console.log(`[debug] Class List: ${element?.classList}`);
        }, optionSelector);
        throw error;
      }
    }
  }

  /**
   * Changes the format of the current editor to the given format.
   * @param {'heading' | 'normal'} format - The format to change to.
   */
  async changeFormatTo(format: 'heading' | 'normal'): Promise<void> {
    await this.context.waitForSelector(paragraphFormatOptionSelector);
    const optionElement = await this.context.$(paragraphFormatOptionSelector);
    if (!optionElement) {
      throw new Error('Format option not found.');
    }
    await optionElement.click();

    const iframes = this.parentPage.frames();

    let iframe: puppeteer.Frame | null = null;
    for (const frame of iframes) {
      if (frame.name().includes('cke')) {
        iframe = frame;
        break;
      }
    }

    if (!iframe) {
      throw new Error('RTE iframe not found.');
    }

    const selector = `a[title*="${format}"]`;
    const element = await iframe.waitForSelector(selector);
    if (!element) {
      throw new Error(`Format ${format} not found.`);
    }
    await element.click();

    await this.parentPage.waitForFunction(
      (selector: string, value: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim().includes(value);
      },
      {},
      paragraphFormatOptionSelector,
      format
    );
  }

  /**
   * Clicks on the text area of the editor.
   */
  async clickOnTextArea(): Promise<void> {
    const textAreaElement =
      await this.context.waitForSelector(rteTextAreaSelector);
    if (!textAreaElement) {
      throw new Error('Text area element not found.');
    }
    await textAreaElement.click();

    await this.parentPage.waitForSelector(
      `${rteTextAreaSelector}${bodyFocusedSelector}`
    );
  }
}
