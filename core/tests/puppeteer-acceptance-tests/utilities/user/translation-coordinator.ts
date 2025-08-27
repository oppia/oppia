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
 * @fileoverview Translation coordinator role utility file.
 */

import {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';

const languageSelectorModalSelector = '.e2e-test-language-selector-modal-body';
const addLanguageButtonSelector = '.e2e-test-language-selector-add-button';
const selectedLangaugeContainerSelector =
  '.e2e-test-selected-language-container';
const selectedLanguageSelector = '.e2e-test-selected-language';
const closeButtonSelector = '.e2e-test-close-button';

const languageSelectorInAdminPageSelector = '.e2e-test-language-selector';
const languageOptionInAdminPageSelector = '.e2e-test-language-selector-option';
const languageSelectorSelectedInAdminPageSelector =
  '.e2e-test-language-selector-selected';

export class TranslationCoordinator extends BaseUser {
  /**
   * Adds a language to the language selector modal.
   * @param {string} languageCode - The language code to add.
   * @param {string} language - The language to add. Used to check if the
   *     language is added correctly.
   */
  async addLanguageInLanguageSelectorModal(
    languageCode: string,
    language: string
  ): Promise<void> {
    await this.expectElementToBeVisible(languageSelectorModalSelector);

    await this.select(`${languageSelectorModalSelector} select`, languageCode);

    await this.expectElementToBeVisible(addLanguageButtonSelector);
    await this.clickOn(addLanguageButtonSelector);

    await this.expectLanguageModalToContainLanguage(language);
  }

  /**
   * Checks if the language selector modal contains the given language.
   * @param {string} language - The language to check for.
   * @param {boolean} visible - Whether the language is expected to be visible.
   */
  async expectLanguageModalToContainLanguage(
    language: string,
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(languageSelectorModalSelector);
    await this.page.waitForFunction(
      (selector: string, language: string, visible: boolean) => {
        const elements = document.querySelectorAll(selector);
        for (const element of Array.from(elements)) {
          const elementText = element.textContent?.trim();
          if (elementText === language) {
            return visible === true;
          }
        }
        return visible === false;
      },
      {},
      selectedLanguageSelector,
      language,
      visible
    );
  }

  /**
   * Closes the language selector modal.
   */
  async closeLanguageSelectorModal(): Promise<void> {
    await this.expectElementToBeVisible(closeButtonSelector);
    await this.clickOn(closeButtonSelector);
    await this.expectElementToBeVisible(languageSelectorModalSelector, false);
  }

  /**
   * Selects a language in the contributor admin page.
   * @param {string} language - The language to select.
   */
  async selectLanguageInAdminPage(language: string): Promise<void> {
    await this.expectElementToBeVisible(languageSelectorInAdminPageSelector);
    await this.clickOn(languageSelectorInAdminPageSelector);

    await this.expectElementToBeVisible(languageOptionInAdminPageSelector);
    const languageOptions = await this.page.$$(
      languageOptionInAdminPageSelector
    );
    let languageOption: ElementHandle<Element> | null = null;
    for (const option of languageOptions) {
      const optionText = await option.evaluate(el => el.textContent?.trim());
      if (optionText === language) {
        languageOption = option;
        break;
      }
    }

    if (!languageOption) {
      const languageOptionTexts = await this.page.$$eval(
        languageOptionInAdminPageSelector,
        elements => elements.map(element => element.textContent)
      );

      throw new Error(
        `Language ${language} not found.\n` +
          `Found languages: ${languageOptionTexts.join(', ')}`
      );
    }

    await languageOption.click();

    const expectedLanguage = this.isViewportAtMobileWidth()
      ? language
      : `Language: ${language}`;
    await this.expectTextContentToBe(
      languageSelectorSelectedInAdminPageSelector,
      expectedLanguage
    );
  }

  /**
   * Removes a language from the language selector modal.
   * @param {string} language - The language to remove.
   */
  async removeLanguageFromLanguageSelectorModal(
    language: string
  ): Promise<void> {
    await this.expectElementToBeVisible(selectedLangaugeContainerSelector);

    const languageContainers = await this.page.$$(
      selectedLangaugeContainerSelector
    );
    let languageContainer: ElementHandle<Element> | null = null;
    for (const container of languageContainers) {
      const containerText = await container.evaluate(el =>
        el.textContent?.trim()
      );
      if (containerText?.includes(language)) {
        languageContainer = container;
        break;
      }
    }

    if (!languageContainer) {
      throw new Error(`Language ${language} not found.`);
    }

    const removeButton = await languageContainer.waitForSelector('button');
    if (!removeButton) {
      throw new Error('Remove button not found.');
    }
    await removeButton.click();

    await this.expectLanguageModalToContainLanguage(language, false);
  }
}

export let TranslationCoordinatorFactory = (): TranslationCoordinator =>
  new TranslationCoordinator();
