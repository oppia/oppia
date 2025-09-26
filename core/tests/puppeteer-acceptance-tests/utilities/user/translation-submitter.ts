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
import {showMessage} from '../common/show-message';

// Common Selectors.
const selectedSkillSelector = '.e2e-test-rte-skill-selected';

// Contributor Dashboard Selectors.
const paginationBtnSelectorPrefix = '.e2e-test-pagination-button';

// Contribution Dashboard > Translate Text Tab Selectors.
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
const saveRTECustomizationButtonSelector =
  '.e2e-test-close-rich-text-component-editor';
const textInputSelector = '.e2e-test-text-input';
const descriptionSelector = '.e2e-test-description-box';
const rteEditorBodySelector = '.e2e-test-rte';
const rteHelperModalContainerSelector = '.e2e-test-rte-helper-modal-container';
const skillNameInput = '.e2e-test-skill-name-input';
const skillItemInRTESelector = '.e2e-test-rte-skill-selector-item';
const discardChangeButton = '.e2e-test-discard-translation-chages';

const currentProgressSelector =
  '.e2e-test-opportunity-list-item-progress-percentage';

export class TranslationSubmitter extends BaseUser {
  /**
   * Clicks on the given pagination button.
   * @param button - The button to click on.
   */
  async clickOnPaginationButtonInTranslationSubmitterPage(
    button: 'previous' | 'next'
  ): Promise<void> {
    const selector = `${paginationBtnSelectorPrefix}-${button}`;
    await this.expectElementToBeVisible(selector);

    await this.expectElementToBeVisible(opportunityItemHeadingSelector);
    const preClickFirstHeading = await this.page.$eval(
      opportunityItemHeadingSelector,
      el => el.textContent
    );
    await this.clickOn(selector);

    await this.page.waitForFunction(
      (selector: string, preClickFirstHeading: string) => {
        const element = document.querySelector(selector);
        return element && element.textContent !== preClickFirstHeading;
      },
      {},
      opportunityItemHeadingSelector,
      preClickFirstHeading
    );
  }

  /**
   * Clicks on the RTE option with the given title.
   * @param title - The title of RTE option.
   */
  async clickOnRTEOptionContainingTitle(title: string): Promise<void> {
    await this.expectElementToBeVisible(rteEditorBodySelector);
    const rteEditor = new RTEEditor(this.page, this.page);
    await rteEditor.clickOnRTEOptionWithTitle(title);
  }

  /**
   * Clicks on the skip translation button in the translation modal.
   * This will skip the current translation and load the next one.
   */
  async clickOnSkipTranslationButton(): Promise<void> {
    await this.expectElementToBeVisible(textToTranslateContainerSelector);
    const preClickContent = await this.page.evaluate((sel: string) => {
      return document.querySelector(sel)?.textContent;
    }, textToTranslateContainerSelector);

    await this.expectElementToBeVisible(skipTranslationButtonSelector);
    await this.clickOn(skipTranslationButtonSelector);

    // Verify that the text to translate container is updated.
    await this.page.waitForFunction(
      (sel: string, htmlContent: string) => {
        const content = document.querySelector(sel)?.textContent;
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
    await this.waitForElementToStabilize(discardChangeButton);
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
  ): Promise<void> {
    const opportunityItem =
      await this.expectTranslationOpportunityToBePresentInTranslateTextTab(
        chapterName,
        storyName
      );

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
  ): Promise<void> {
    const selector = `${paginationBtnSelectorPrefix}-${button}`;
    await this.expectElementToBeVisible(selector, visible);
  }

  /**
   * Checks if the copy tool works properly.
   * @param description - The description of the image.
   * @param caption - The caption of the image.
   */
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
    await this.waitForElementToStabilize(textInputSelector);
    await this.clearAllTextFrom(textInputSelector);
    await this.type(textInputSelector, caption);

    // Add a description to the image.
    await this.expectElementToBeVisible(descriptionSelector);
    await this.clearAllTextFrom(descriptionSelector);
    await this.type(descriptionSelector, description);

    // Save the image.
    await this.clickOnSaveButtonInCustomizeRTEModal();

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
   * Clicks on the save button in the customize RTE modal.
   */
  async clickOnSaveButtonInCustomizeRTEModal(): Promise<void> {
    await this.expectElementToBeVisible(saveRTECustomizationButtonSelector);
    await this.waitForElementToStabilize(saveRTECustomizationButtonSelector);
    await this.clickOn(saveRTECustomizationButtonSelector);
    await this.expectElementToBeVisible(
      saveRTECustomizationButtonSelector,
      false
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
    const context =
      inputType === 'rte'
        ? await this.page.waitForSelector(rteHelperModalContainerSelector)
        : this.page;

    if (!context) {
      throw new Error('Context not found.');
    }

    await context.waitForSelector(baseSelector);
    const elements = await context.$$(baseSelector);

    if (elements.length < i + 1) {
      throw new Error(`Component ${i} not found.`);
    }

    const element = elements[i];

    // Clear all text from the element.
    await element.click({clickCount: 3});
    await this.page.keyboard.press('Backspace');

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
  async typeTextForRTE(text: string): Promise<void> {
    // Pre-checks.
    await this.expectElementToBeVisible(rteEditorBodySelector);
    const initialHTMLContent = await this.page.$eval(
      rteEditorBodySelector,
      el => (el as HTMLElement).textContent
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
        return element?.textContent !== initialHTMLContent;
      },
      {},
      rteEditorBodySelector,
      initialHTMLContent
    );
  }

  /**
   * TODO(#22539): Below function is duplicate of expectTranslationOpportunityToBePresent
   * in contributor.ts. Once fixed, combine these functions.
   * Checks if the translation opportunity is visible and matches the expected values.
   * @param heading - The expected heading of the translation opportunity.
   * @param subheading - The expected subheading of the translation opportunity.
   * @param visible - Whether the translation opportunity should be visible or not.
   */
  async expectTranslationOpportunityToBePresentInTranslateTextTab(
    heading: string,
    subheading: string,
    visible: boolean = true
  ): Promise<ElementHandle | null> {
    const translationOpportunitiesPreset = await this.isElementVisible(
      opportunityItemSelector
    );

    // Handle the case where the translation opportunity is not present.
    if (!translationOpportunitiesPreset) {
      if (visible) {
        throw new Error(
          `Translation opportunity for ${heading} in ${subheading} not found.`
        );
      } else {
        showMessage(
          `Success: Translation opportunity for ${heading} in ${subheading} not found.`
        );
        return null;
      }
    }

    // Get the opportunity item element.
    const opportunityItems = await this.page.$$(opportunityItemSelector);
    for (const opportunityItemElement of opportunityItems) {
      const opportunityItemHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunityItemHeadingSelector
      );
      const opportunityItemSubHeading = await opportunityItemElement.evaluate(
        (el: Element, sel: string) =>
          el.querySelector(sel)?.textContent?.trim(),
        opportunitySubHeadingSelector
      );

      if (
        opportunityItemHeading === heading &&
        opportunityItemSubHeading?.includes(subheading)
      ) {
        if (!visible) {
          throw new Error(
            `Failure: Translation opportunity for ${heading} in ${opportunityItemSubHeading} was found.`
          );
        }
        return opportunityItemElement;
      }
    }

    if (visible) {
      throw new Error(
        `Translation opportunity for ${heading} in ${subheading} not found.`
      );
    }
    showMessage(
      `Success: Translation opportunity for ${heading} in ${subheading} not found.`
    );
    return null;
  }

  /**
   * Checks if the translate button is disabled in the translation tab.
   * @param heading - The expected heading of the translation opportunity.
   * @param subheading - The expected subheading of the translation opportunity.
   */
  async expectTranslateButtonToBeDisabledInTranslateTextTab(
    heading: string,
    subheading: string
  ): Promise<void> {
    const opportunityItem =
      await this.expectTranslationOpportunityToBePresentInTranslateTextTab(
        heading,
        subheading
      );
    if (!opportunityItem) {
      throw new Error(
        `Translation opportunity for ${heading} in ${subheading} not found.`
      );
    }
    const opportunityTranslateButton = await opportunityItem.waitForSelector(
      opportunityTranslateButtonSelector
    );

    this.page.waitForFunction(
      isElementClickable,
      {},
      opportunityTranslateButton
    );
  }

  /**
   * Checks if the current progress is as expected.
   * @param {number} expectedProgress - The expected progress.
   */
  async expectCurrentProgressToBe(expectedProgress: number): Promise<void> {
    await this.expectTextContentToBe(
      currentProgressSelector,
      `(${expectedProgress}%)`
    );
  }

  /**
   * Fills the concept card modal and saves.
   * @param {string} skill - The skill to fill the concept card modal with.
   */
  async selectSkillInConceptCard(skill: string): Promise<void> {
    await this.type(skillNameInput, skill);
    await this.clickOn(skillItemInRTESelector);
    await this.expectTextContentToContain(
      `${selectedSkillSelector} label`,
      skill
    );
  }
}

export let TranslationSubmitterFactory = (): TranslationSubmitter =>
  new TranslationSubmitter();
