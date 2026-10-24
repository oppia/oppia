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
 * @fileoverview Translation coordinator role utility file.
 */

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';

const languageSelectorModalSelector = '.e2e-test-language-selector-modal-body';
const addLanguageButtonSelector = '.e2e-test-language-selector-add-button';
const selectedLanguageContainerSelector =
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
    await this.clickOnElementWithSelector(addLanguageButtonSelector);

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
    const languageLocator = this.page
      .locator(languageSelectorModalSelector)
      .locator(selectedLanguageSelector)
      .filter({hasText: language});
    if (visible) {
      await expect(languageLocator.first()).toBeVisible();
    } else {
      await expect(languageLocator).toHaveCount(0);
    }
  }

  /**
   * Closes the language selector modal.
   */
  async closeLanguageSelectorModal(): Promise<void> {
    await this.expectElementToBeVisible(closeButtonSelector);
    await this.clickOnElementWithSelector(closeButtonSelector);
    await this.expectElementToBeVisible(languageSelectorModalSelector, false);
  }

  /**
   * Selects a language in the contributor admin page.
   * @param {string} language - The language to select.
   */
  async selectLanguageInAdminPage(language: string): Promise<void> {
    const dropdown = this.page
      .locator(languageSelectorInAdminPageSelector)
      .locator('visible=true')
      .first();
    await dropdown.waitFor({state: 'visible'});
    await dropdown.click();

    const option = this.page
      .locator(languageOptionInAdminPageSelector)
      .filter({hasText: language})
      .locator('visible=true')
      .first();
    await option.waitFor({state: 'visible'});
    await option.click();

    const selected = this.page
      .locator(languageSelectorSelectedInAdminPageSelector)
      .locator('visible=true')
      .first();
    await expect(selected).toContainText(language);
  }

  /**
   * Removes a language from the language selector modal.
   * @param {string} language - The language to remove.
   */
  async removeLanguageFromLanguageSelectorModal(
    language: string
  ): Promise<void> {
    await this.expectElementToBeVisible(selectedLanguageContainerSelector);

    const container = this.page
      .locator(selectedLanguageContainerSelector)
      .filter({hasText: language})
      .first();
    await expect(container).toBeVisible();

    const removeButton = container.locator('button').first();
    await removeButton.click();

    await this.expectLanguageModalToContainLanguage(language, false);
  }
}

export const TranslationCoordinatorFactory = (
  page: Page
): TranslationCoordinator => new TranslationCoordinator(page);
