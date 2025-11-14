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
const paragraphFormatOptionSelector = 'a[title*="Format"]';
const bodyFocusedSelector = '.cke_focus';
const customizeInteractionModalHeaderSelector =
  '.e2e-test-rte-helper-modal-header';
const saveRTEButtonSelector = '.e2e-test-save-state-content';

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
    const initialInnerHTML = await this.parentPage.evaluate(
      (selector: string) => {
        0;
        // eslint-disable-next-line oppia/no-inner-html
        return document.querySelector(selector)?.innerHTML;
      },
      rteTextAreaSelector
    );

    await optionElement.click();

    try {
      await this.parentPage.waitForFunction(
        (selector: string, innerHTML: string, ele2Selector: string) => {
          const element = document.querySelector(selector);
          // eslint-disable-next-line oppia/no-inner-html
          const classChanged = element?.innerHTML !== innerHTML;
          const headerElement = document.querySelector(ele2Selector);

          return classChanged || headerElement;
        },
        {},
        optionSelector,
        initialInnerHTML ?? '',
        customizeInteractionModalHeaderSelector
      );
    } catch (error) {
      await this.parentPage.evaluate((selector: string) => {
        const element = document.querySelector(selector);
        // eslint-disable-next-line no-console
        console.log(`[debug] Class List: ${element?.classList}`);
      }, optionSelector);
      throw error;
    }
  }

  /**
   * Clears the content of the editor.
   * Requires the editor to be visible. Does not save the content.
   */
  async clearAll(): Promise<void> {
    const textAreaElement = await this.context.waitForSelector(
      rteTextAreaSelector,
      {visible: true}
    );

    if (!textAreaElement) {
      throw new Error('Text area element not found.');
    }

    await textAreaElement.click({clickCount: 3});
    await this.parentPage.keyboard.press('Backspace');

    await this.parentPage.waitForFunction(
      (element: Element) => {
        return element?.textContent === '';
      },
      {},
      textAreaElement
    );
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

  /**
   * Updates the content of the editor and saves it.
   * After calling this function, the editor is closed,
   * so it should not be used anymore.
   * @param {string} content - The content to update the editor with.
   */
  async updateAndSaveContent(content: string): Promise<void> {
    await this.parentPage.waitForSelector(rteTextAreaSelector, {visible: true});
    await this.parentPage.type(rteTextAreaSelector, content);
    await this.parentPage.click(saveRTEButtonSelector);
    await this.parentPage.waitForSelector(rteTextAreaSelector, {
      hidden: true,
    });
  }
}

export const RTE_BUTTON_TITLES = {
  BOLD: {
    EN: 'Bold',
    HI: 'बोल्ड',
  },
  ITALIC: {
    EN: 'Italic',
    HI: 'इटैलिक',
  },
  NUM_LIST: {
    EN: 'Numbered List',
    HI: 'अंकीय सूची',
  },
  BULLETED_LIST: {
    EN: 'Bulleted List',
    HI: 'बुलॅट सूची',
  },
  PRE: {
    EN: 'Pre',
    HI: 'Pre',
  },
  BLOCK_QUOTE: {
    HI: 'ब्लॉक-कोट',
  },
  INCR_INDENT: {
    EN: 'Increase Indent',
    HI: 'इन्डॅन्ट बढ़ायें',
  },
  DECR_INDENT: {
    EN: 'Decrease Indent',
    HI: 'इन्डॅन्ट कम करें',
  },
  COLLAPSIBLE: {
    EN: 'collapsible',
    HI: 'collapsible',
  },
  IMAGE: {
    EN: 'image',
    HI: 'image',
  },
  LINK: {
    EN: 'link',
    HI: 'link',
  },
  MATH_FORMULA: {
    EN: 'mathematical formula',
    HI: 'mathematical formula',
  },
  CONCEPT_CARD: {
    EN: 'Concept Card',
    HI: 'Concept Card',
  },
  TABS: {
    EN: 'Insert tabs',
    HI: 'Insert tabs',
  },
  VIDEO: {
    EN: 'Insert video',
    HI: 'Insert video',
  },
};
