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
 * @fileoverview Utilty class for translation submitter.
 */

import {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import {RTEEditor} from '../common/rte-editor';
import isElementClickable from '../../functions/is-element-clickable';

// Common Selectors.
const activeTabSelector = '.e2e-test-active-tab';

// Contributor Dashboard Selectors.
const contributionTabSelector = '.e2e-test-contribution-tab';
const paginationBtnSelectorPrefix = '.e2e-test-pagination-button';

// Contribution Dashboard > Translate Text Tab Selectors.
const languageSelector = '.e2e-test-language-selector';
const selectedLanguageSelector = '.e2e-test-language-selector-selected';
const featuredLanguageOptionSelector = '.e2e-test-featured-language';
const languageOptionSelector = '.e2e-test-language-selector-option';
const topicSelector = '.e2e-test-topic-selector';
const selectedTopicSelector = '.e2e-test-topic-selector-selected';
const topicOptionSelector = '.e2e-test-topic-selector-option';
const opportunityItemSelector = '.e2e-test-opportunity-list-item';
const opportunityItemHeadingSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubHeadingSelector =
  '.e2e-test-opportunity-list-item-subheading';
const opportunityTranslateButtonSelector =
  '.e2e-test-opportunity-list-item-button';
const translateTextModalHeaderContainerSelector =
  '.e2e-test-translate-text-header-container';
const textToTranslateContainerSelector = '.oppia-text-to-translate-container';
const skipTranslationButtonSelector = '.e2e-test-skip-translation-button';
const copyButtonSelector = '.e2e-test-copy-button';
const closeModalButtonSelector = '.e2e-test-close-modal-button';
const imageSelector = '.e2e-test-image';
const saveImageButtonSelector = '.e2e-test-close-rich-text-component-editor';
const textInputSelector = '.e2e-test-text-input';
const descriptionSelector = '.e2e-test-description-box';
const rteEditorBodySelector = '.e2e-test-rte';
const rteHelperModalContainerSelector = '.e2e-test-rte-helper-modal-container';
const skillNameInput = '.e2e-test-skill-name-input';
const skillItemInRTESelector = '.e2e-test-rte-skill-selector-item';
const contributionTableSelector = '.e2e-test-topics-table';
const discardChangeButton = '.e2e-test-discard-translation-chages';

export class TranslationSubmitter extends BaseUser {
  /**
   * Clicks on the given pagination button.
   * @param button - The button to click on.
   */
  async clickOnPaginationButtonInTranslationSubmitterPage(
    button: 'previous' | 'next'
  ) {
    const selector = `${paginationBtnSelectorPrefix}-${button}`;
    await this.expectElementToBeVisible(selector);

    await this.clickOn(selector);

    // TODO: Post-check: Verify if the page is loaded.
  }

  /**
   * Clicks on the RTE option with the given title.
   * @param title - The title of RTE option.
   */
  async clickOnRTEOptionContainingTitle(title: string) {
    const rteEditor = new RTEEditor(this.page, this.page);
    rteEditor.clickOnRTEOptionWithTitle(title);
  }

  /**
   * Clicks on the skip translation button in the translation modal.
   * This will skip the current translation and load the next one.
   */
  async clickOnSkipTranslationButton() {
    await this.expectElementToBeVisible(textToTranslateContainerSelector);
    const preClickContent = await this.page.evaluate((sel: string) => {
      return document.querySelector(sel)?.innerHTML;
    }, textToTranslateContainerSelector);

    await this.expectElementToBeVisible(skipTranslationButtonSelector);
    await this.clickOn(skipTranslationButtonSelector);

    // Verify that the text to translate container is updated.
    await this.page.waitForFunction(
      (sel: string, htmlContent: string) => {
        const content = document.querySelector(sel)?.innerHTML;
        return content !== htmlContent;
      },
      {},
      textToTranslateContainerSelector,
      preClickContent ?? ''
    );
  }

  /**
   * Clicks on the discard changes button in the translation modal.
   */
  async clickOnDiscardChangesButton(): Promise<void> {
    await this.expectElementToBeVisible(discardChangeButton);
    await this.clickOn(discardChangeButton);
    await this.expectElementToBeVisible(discardChangeButton, false);
  }

  /**
   * Clicks on the translate button in the translation modal.
   * @param chapterName - The name of the chapter.
   * @param storyName - The name of the story.
   */
  async clickOnTranslateButtonInTranslateTextTab(
    chapterName: string,
    storyName: string
  ) {
    await this.expectElementToBeVisible(opportunityItemSelector);

    const opportunityItems = await this.page.$$(opportunityItemSelector);
    let opportunityItem: ElementHandle<Element> | null = null;
    for (const opportunityItemElement of opportunityItems) {
      const opportunityItemHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunityItemHeadingSelector
      );
      const opportunityItemSubHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim() ?? '',
        opportunitySubHeadingSelector
      );

      if (
        opportunityItemHeading === chapterName &&
        opportunityItemSubHeading.includes(storyName)
      ) {
        opportunityItem = opportunityItemElement;
        break;
      }
    }

    if (!opportunityItem) {
      throw new Error(
        `Opportunity item for chapter ${chapterName} and story ${storyName} not found.`
      );
    }

    // Click on translate button in the opportunity item.
    const translateButton = await opportunityItem.waitForSelector(
      opportunityTranslateButtonSelector
    );
    if (!translateButton) {
      throw new Error(
        `Translate button for chapter ${chapterName} and story ${storyName} not found.`
      );
    }
    await translateButton.click();

    // Verify that the translation editor is opened.
    await this.expectElementToBeVisible(
      translateTextModalHeaderContainerSelector
    );
  }

  /**
   * Closes the translation modal.
   */
  async closeTranslateTextModal(): Promise<void> {
    await this.expectElementToBeVisible(closeModalButtonSelector);
    await this.clickOn(closeModalButtonSelector);

    // Verify that the modal is closed.
    await this.expectElementToBeVisible(
      translateTextModalHeaderContainerSelector,
      false
    );
  }

  /**
   * Checks if the pagination button is visible or not.
   * @param button - The button to check for.
   * @param visible - Whether the button should be visible or not.
   */
  async expectPaginationButtonToBeVisible(
    button: 'previous' | 'next',
    visible: boolean = true
  ) {
    const selector = `${paginationBtnSelectorPrefix}-${button}`;
    await this.expectElementToBeVisible(selector, visible);
  }

  async expectCopyToolWorksProperly(
    description: string,
    caption: string
  ): Promise<void> {
    await this.toggleCopyButton('On');

    // Click on the image.
    await this.expectElementToBeVisible(imageSelector);
    await this.clickOn(imageSelector);

    // Add a caption to the image.
    await this.expectElementToBeVisible(textInputSelector);
    await this.clearAllTextFrom(textInputSelector);
    await this.type(textInputSelector, caption);

    // Add a description to the image.
    await this.expectElementToBeVisible(descriptionSelector);
    await this.clearAllTextFrom(descriptionSelector);
    await this.type(descriptionSelector, description);

    // Save the image.
    await this.expectElementToBeVisible(saveImageButtonSelector);
    await this.clickOn(saveImageButtonSelector);
    await this.expectElementToBeVisible(saveImageButtonSelector, false);

    await this.page.waitForFunction(
      (selector: string, n: number) => {
        const elements = document.querySelectorAll(selector);
        return elements.length === n;
      },
      {},
      imageSelector,
      2
    );
  }

  /**
   * Expects the contribution table to contain a row with the given topic name,
   * accepted cards, and accepted words.
   * @param topicName - The topic name to search for.
   * @param acceptedCards - The number of accepted cards.
   * @param acceptedWords - The number of accepted words.
   */
  async expectContributionTableToContainRow(
    topicName: string,
    acceptedCards: number,
    acceptedWords: number
  ): Promise<void> {
    await this.expectElementToBeVisible(contributionTableSelector);

    const table = await this.page.$(contributionTableSelector);
    const tableRows = await table?.$$('tr');
    if (!tableRows || tableRows.length === 0) {
      throw new Error('No rows found in the contribution table.');
    }

    for (const row of tableRows) {
      const rowCells = await row.$$('td');
      if (rowCells.length === 0) {
        throw new Error('No cells found in the contribution table row.');
      }

      const found = await this.page.evaluate(
        (
          row: Element,
          topicName: string,
          acceptedCards: number,
          acceptedWords: number
        ) => {
          const cells = row.querySelectorAll('td');
          return (
            cells[1].textContent?.trim() === topicName &&
            cells[2].textContent?.trim() === acceptedCards.toString() &&
            cells[3].textContent?.trim() === acceptedWords.toString()
          );
        },
        {},
        row,
        topicName,
        acceptedCards,
        acceptedWords
      );
      if (found) {
        return;
      }
    }

    throw new Error(
      `Row with topic name ${topicName} not found in the contribution table.`
    );
  }

  /**
   * Fills the value in the customize component.
   * @param inputType - The type of the component.
   * @param value - The value to fill.
   * @param i - The index of the component.
   */
  async fillValueInTranslateTextCustomizeComponent(
    inputType: 'input' | 'rte' | 'textarea',
    value: string,
    i: number = 0
  ): Promise<void> {
    const baseSelector = inputType === 'rte' ? '.e2e-test-rte' : inputType;

    const rteHelperModal = await this.page.waitForSelector(
      rteHelperModalContainerSelector,
      {visible: true}
    );
    if (!rteHelperModal) {
      throw new Error('RTE Helper Modal not found.');
    }
    await rteHelperModal.waitForSelector(baseSelector);
    const elements = await this.page.$$(baseSelector);

    if (elements.length < i + 1) {
      throw new Error(`Component ${i} not found.`);
    }

    const element = elements[i];
    await element.type(value);

    await this.page.waitForFunction(
      (element: HTMLElement, value: string) => {
        return (
          (element as HTMLInputElement).value === value ||
          element.textContent?.includes(value)
        );
      },
      {},
      element,
      value
    );
    return;

    // TODO: remove.
    const selector = `${rteHelperModalContainerSelector} ${baseSelector}`;
    await this.expectElementToBeVisible(selector);
    await this.clearAllTextFrom(selector);
    await this.type(selector, value);
    await this.page.waitForFunction(
      (sel: string, val: string) => {
        const element = document.querySelector(sel);
        return (
          element &&
          ((element as HTMLInputElement).value === val ||
            (element as HTMLElement).textContent?.includes(val))
        );
      },
      {},
      selector,
      value
    );
  }

  /**
   * Searches for a skill in the RTE editor.
   * @param skillName - The name of the skill to search for.
   */
  async searchAndSelectSkillInRTE(skillName: string): Promise<void> {
    const skillSearchElement = await this.page.$(skillNameInput);
    await skillSearchElement?.type(skillName);
    await this.clickOn(skillItemInRTESelector);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Selects the contribution type in the contribution dashboard.
   * @param contributionType - The contribution type to select.
   */
  async selectContributionTypeInContributionDashboard(
    contributionType: 'Translation Contributions'
  ): Promise<void> {
    await this.page.waitForSelector(topicSelector);
    const elementIndex = this.isViewportAtMobileWidth() ? 0 : 1;

    const optionSelectElements = await this.page.$$(topicSelector);
    const optionSelectElement = optionSelectElements[elementIndex];
    await optionSelectElement.click();

    await this.expectElementToBeVisible(topicOptionSelector);
    const contibutionTypeOptions = await this.page.$$(topicOptionSelector);
    let optionElement: ElementHandle<Element> | null = null;
    for (const option of contibutionTypeOptions) {
      const optionText = await option.evaluate(el => el.textContent?.trim());
      if (optionText === contributionType) {
        optionElement = option;
        break;
      }
    }

    if (!optionElement) {
      throw new Error(`Option ${contributionType} not found.`);
    }

    // Click on the option.
    await optionElement.click();

    // Verify option is selected.
    await this.expectElementToBeVisible(selectedLanguageSelector);
    const selectedOptionElements = await this.page.$$(selectedLanguageSelector);
    const selectedOptionElement = selectedOptionElements[elementIndex];
    await this.page.waitForFunction(
      (element: Element, value: string) => {
        return element.textContent?.trim() === value;
      },
      {},
      selectedOptionElement,
      contributionType
    );
  }

  /**
   * Clicks on language selection dropdown and selects the given language.
   * @param language - The language to select.
   */
  async selectLanguageInTranslateTextTab(language: string): Promise<void> {
    // Open the language selector dropdown.
    await this.expectElementToBeVisible(languageSelector);
    await this.clickOn(languageSelector);

    // Find the language option in the dropdown.
    let languageOption: ElementHandle<Element> | null = null;
    for (const optionSelector of [
      featuredLanguageOptionSelector,
      languageOptionSelector,
    ]) {
      await this.expectElementToBeVisible(optionSelector);
      // Get the language option element.
      for (const option of await this.page.$$(optionSelector)) {
        const optionText = await option.evaluate(el => el.textContent?.trim());
        if (optionText?.includes(language)) {
          languageOption = option;
          break;
        }
      }

      // If the language option is found, break the loop.
      if (languageOption) {
        break;
      }
    }

    if (!languageOption) {
      throw new Error(`Language ${language} not found.`);
    }

    // Click on the language option.
    await languageOption.click();

    // Verify language is selected.
    await this.expectElementToBeVisible(opportunityItemSelector, false);
    await this.expectTextContentToContain(selectedLanguageSelector, language);
  }

  /**
   * Clicks on subject selection dropdown and selects the given subject.
   * @param subject - The subject to select.
   */
  async selectSubjectInTranslateTextTab(subject: string): Promise<void> {
    await this.expectElementToBeVisible(topicSelector);
    await this.clickOn(topicSelector);

    // Find the subject option in the dropdown.
    let subjectOption: ElementHandle<Element> | null = null;
    await this.expectElementToBeVisible(topicOptionSelector);
    for (const option of await this.page.$$(topicOptionSelector)) {
      const optionText = await option.evaluate(el => el.textContent?.trim());
      if (optionText?.includes(subject)) {
        subjectOption = option;
        break;
      }
    }

    if (!subjectOption) {
      throw new Error(`Subject ${subject} not found.`);
    }

    // Click on the subject option.
    await subjectOption.click();

    // Verify subject is selected.
    await this.expectTextContentToContain(selectedTopicSelector, subject);
  }

  /**
   * Switches to the tab in the contribution dashboard.
   * @param tabName - The name of the tab to switch to.
   */
  async switchToTabInContributionDashboard(
    tabName: 'Translate Text' | 'My Contributions'
  ) {
    await this.page.waitForSelector(contributionTabSelector);

    // Get required tab element.
    const tabElements = await this.page.$$(contributionTabSelector);
    let tabElement: ElementHandle<Element> | null = null;
    for (const tabEle of tabElements) {
      const tabText = await tabEle.evaluate(el => el.textContent?.trim());
      if (tabText === tabName) {
        tabElement = tabEle;
        break;
      }
    }

    if (!tabElement) {
      throw new Error(`Tab ${tabName} not found.`);
    }

    await this.page.waitForFunction(isElementClickable, {}, tabElement);

    // Click on the tab.
    await tabElement.click();

    // Verify tab is active.
    const activeContributionTabSelector = `${contributionTabSelector}${activeTabSelector}`;
    await this.expectTextContentToBe(activeContributionTabSelector, tabName);
  }

  /**
   * Toggles the copy button.
   * @param mode - The mode to toggle the copy button to.
   */
  async toggleCopyButton(mode: 'On' | 'Off'): Promise<void> {
    await this.expectElementToBeVisible(copyButtonSelector);
    await this.expectTextContentToBe(
      copyButtonSelector,
      mode === 'On' ? 'Off' : 'On'
    );

    await this.clickOn(copyButtonSelector);
    await this.expectTextContentToBe(
      copyButtonSelector,
      mode === 'On' ? 'On' : 'Off'
    );
  }

  /**
   * Types the given text by simulating keyboard events. Only clicks on the
   * RTE editor if it is not already focused.
   * @param text - The text to type in the RTE editor.
   */
  async typeTextForRTE(text: string) {
    // Pre-checks.
    await this.expectElementToBeVisible(rteEditorBodySelector);
    const initialHTMLContent = await this.page.$eval(
      rteEditorBodySelector,
      el => (el as HTMLElement).innerHTML
    );
    const isRTEFocused = await this.isElementVisible(
      `${rteEditorBodySelector}.cke_focus`,
      true,
      5000
    );
    if (!isRTEFocused) {
      await this.clickOn(rteEditorBodySelector);
    }

    // Type the text in the RTE editor.
    await this.page.keyboard.type(`${text}\n`);

    // Post-checks.
    await this.page.waitForFunction(
      (selector: string, initialHTMLContent: string) => {
        const element = document.querySelector(selector);
        return element?.innerHTML !== initialHTMLContent;
      },
      {},
      rteEditorBodySelector,
      initialHTMLContent
    );
  }
}

export let TranslationSubmitterFactory = (): TranslationSubmitter =>
  new TranslationSubmitter();
