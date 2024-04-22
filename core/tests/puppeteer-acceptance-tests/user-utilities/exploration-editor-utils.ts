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
 * @fileoverview Utility functions for the Exploration Editor page.
 */

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';
import {ElementHandle} from 'puppeteer';
import {values} from 'lodash';

const creatorDashboardPage = testConstants.URLs.CreatorDashboard;
const previewTabButton = '.e2e-test-preview-tab';
const SettingsTabButton = '.e2e-test-settings-tab';
const MainTabButton = '.e2e-test-main-tab';
const HistoryTabButton = '.e2e-test-history-tab';
const mobileSettingsTabButton = '.e2e-test-mobile-settings-tab-button';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-tab-button';
const mobileHistoryTabButton = '.e2e-test-mobile-history-tab-button';
const mobileMainTabButton = '.e2e-test-mobile-main-tab-button';

const createExplorationButton = 'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const saveDraftButton = 'button.e2e-test-save-draft-button';

const publishExplorationButton = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = 'button.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closeShareModalButton = 'button.e2e-test-share-publish-close';

const mobileChangesDropdown = '.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButton =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButton = 'button.e2e-test-mobile-publish-button';

const stateEditSelector = '.e2e-test-state-edit-content';
const stateContentInputField = '.oppia-rte';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = '.e2e-test-add-new-response';
const floatFormInput = '.e2e-test-float-form-input';

const stateNodeSelector = '.e2e-test-node-label';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const stateResponsesSelector = '.e2e-test-default-response-tab';
const feedbackEditorSelector = '.e2e-test-open-feedback-editor';
const responseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const mobileStateGraphResizeButton = '.e2e-test-mobile-graph-resize-button';
const mobileNavbarDropdown = '.e2e-test-mobile-options-dropdown';
const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButton = '.e2e-test-mobile-options';
const toastMessage = '.e2e-test-toast-message';

// Preview tab elements.
const nextCardButton = '.e2e-test-next-card-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const previewRestartButton = '.e2e-test-preview-restart-button';
const stateConversationContent = '.e2e-test-conversation-content';
const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';

// Settings tab elements.
const explorationTitleInputField = '.e2e-test-exploration-title-input';

// History tab elements.
const userNameEdit = 'input.e2e-test-history-filter-input';
const historyListItem = 'div.e2e-test-history-list-item';
const firstRevisionDropdown = '.e2e-test-history-version-dropdown-first';
const secondRevisionDropdown = '.e2e-test-history-version-dropdown-second';
const revertVersionButton = '.e2e-test-revert-version';
const downloadVersionButton = '.e2e-test-download-version';
const resetGraphButton = '.e2e-test-reset-graph';
const confirmRevertVersionButton = '.e2e-test-confirm-revert';
const paginatorToggler = '.mat-paginator-page-size-select';
const viewMetadataChangesButton = '.e2e-test-view-metadata-history';
const testNodeBackground = '.e2e-test-node';
const closeMetadataModal = '.e2e-test-close-history-metadata-modal';
const closeStateModal = '.e2e-test-close-history-state-modal';
const revisionVersionNoSelector = '.e2e-test-history-table-index';
const revisionNoteSelector = '.e2e-test-history-table-message';
const revisionUsernameSelector = '.e2e-test-history-table-profile';
const revisionDateSelector = '.e2e-test-history-tab-commit-date';
export class ExplorationEditor extends BaseUser {
  /**
   * Function to navigate to creator dashboard page
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.page.goto(creatorDashboardPage);
  }

  /**
   * Function to navigate to exploration editor
   */
  async navigateToExplorationEditorPage(): Promise<void> {
    await this.clickOn(createExplorationButton);
  }

  /**
   * Function to create an exploration with a content and interaction.
   * This is a composite function that can be used when a straightforward, simple exploration setup is required.
   *
   * @param content - content of the exploration
   * @param interaction - the interaction to be added to the exploration
   */
  async createExplorationWithContentAndInteraction(
    content: string,
    interaction: string
  ): Promise<void> {
    await this.updateCardContent(content);
    await this.addInteraction(interaction);
    await this.saveExplorationDraft();
  }

  /**
   * Function to publish exploration
   * @param {string} title - The title of the exploration.
   * @param {string} goal - The goal of the exploration.
   * @param {string} category - The category of the exploration.
   */
  async publishExploration(
    title: string,
    goal: string,
    category: string
  ): Promise<string | null> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(toastMessage, {
        visible: true,
      });
      await this.page.waitForSelector(toastMessage, {
        hidden: true,
      });
      await this.clickOn(mobileChangesDropdown);
      await this.clickOn(mobilePublishButton);
    } else {
      await this.clickOn(publishExplorationButton);
    }
    await this.clickOn(explorationTitleInput);
    await this.type(explorationTitleInput, `${title}`);
    await this.clickOn(explorationGoalInput);
    await this.type(explorationGoalInput, `${goal}`);
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn(`${category}`);
    await this.clickOn(saveExplorationChangesButton);
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(explorationIdElement);
    const explorationIdUrl = await this.page.$eval(
      explorationIdElement,
      element => (element as HTMLElement).innerText
    );
    const explorationId = explorationIdUrl.replace(/^.*\/explore\//, '');

    await this.clickOn(closeShareModalButton);
    return explorationId;
  }

  /**
   * Function to dismiss welcome modal
   */
  async dismissWelcomeModal(): Promise<void> {
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContent(content: string): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });
    await this.clickOn(stateEditSelector);
    await this.waitForElementToBeClickable(stateContentInputField);
    await this.type(stateContentInputField, `${content}`);
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(stateContentInputField, {hidden: true});
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   * Note: A space is added before and after the interaction name to match the format in the UI.
   */
  async addInteraction(interactionToAdd: string): Promise<void> {
    await this.clickOn(addInteractionButton);
    await this.clickOn(` ${interactionToAdd} `);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector('.customize-interaction-body-container', {
      hidden: true,
    });
  }

  /**
   * Function to display the Oppia responses section.
   */
  async viewOppiaResponses(): Promise<void> {
    await this.clickOn(stateResponsesSelector);
  }

  /**
   * Function to select the card that learners will be directed to from the current card.
   * @param {string} cardName - The name of the card to which learners will be directed.
   */
  async directLearnersToNewCard(cardName: string): Promise<void> {
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, cardName);
    await this.clickOn(saveOutcomeDestButton);
  }

  /**
   * Function to save an exploration draft.
   */
  async saveExplorationDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileSaveChangesButton);
    } else {
      await this.clickOn(saveChangesButton);
    }
    await this.clickOn(saveDraftButton);
    await this.page.waitForSelector(saveDraftButton, {hidden: true});
    await this.page.waitForNetworkIdle();
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async navigateToCard(cardName: string): Promise<void> {
    let elements;
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileStateGraphResizeButton);
    }

    await this.page.waitForSelector(stateNodeSelector);
    elements = await this.page.$$(stateNodeSelector);

    const cardNames = await Promise.all(
      elements.map(element => element.$eval('tspan', node => node.textContent))
    );
    // The card name is suffixed with a space to match the format in the UI.
    const cardIndex = cardNames.indexOf(cardName + ' ');

    if (cardIndex === -1) {
      throw new Error(`Card name ${cardName} not found in the graph.`);
    }

    if (this.isViewportAtMobileWidth()) {
      await elements[cardIndex + elements.length / 2].click();
    } else {
      await elements[cardIndex].click();
    }

    await this.page.waitForNetworkIdle({idleTime: 700});
  }

  /**
   * Function to add responses to the interactions. Currently, it only handles 'Number Input' interaction type.
   * @param {string} interactionType - The type of the interaction.
   * @param {string} answer - The response to be added.
   * @param {string} feedback - The feedback for the response.
   * @param {string} destination - The destination state for the response.
   * @param {boolean} responseIsCorrect - Whether the response is marked as correct.
   */
  async addResponseToTheInteraction(
    interactionType: string,
    answer: string,
    feedback: string,
    destination: string,
    responseIsCorrect: boolean
  ): Promise<void> {
    switch (interactionType) {
      case 'Number Input':
        await this.type(floatFormInput, answer);
        break;
      // Add cases for other interaction types here
      // case 'otherInteractionType':
      //   await this.type(otherFormInput, answer);
      //   break;
      default:
        throw new Error(`Unsupported interaction type: ${interactionType}`);
    }

    await this.clickOn(feedbackEditorSelector);
    await this.type(stateContentInputField, feedback);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, destination);
    if (responseIsCorrect) {
      await this.clickOn(correctAnswerInTheGroupSelector);
    }
    await this.clickOn(addNewResponseButton);
    await this.page.waitForSelector(responseModalHeaderSelector, {
      hidden: true,
    });
  }

  /**
   * Function to navigate to the preview tab.
   */
  async navigateToPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobilePreviewTabButton);
    } else {
      await this.clickOn(previewTabButton);
    }
    await this.page.waitForNavigation();
  }

  /**
   * Function to verify if the preview is on a particular card by checking the content of the card.
   * @param {string} cardName - The name of the card to check.
   * @param {string} expectedCardContent - The expected text content of the card.
   */
  async expectPreviewCardContentToBe(
    cardName: string,
    expectedCardContent: string
  ): Promise<void> {
    await this.page.waitForSelector(stateConversationContent, {
      visible: true,
    });
    const element = await this.page.$(stateConversationContent);
    const cardContent = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (cardContent !== expectedCardContent) {
      throw new Error(
        `Preview is not on the ${cardName} card or is not loading correctly.`
      );
    }
    showMessage(`Preview is on the ${cardName} card and is loading correctly.`);
  }

  /**
   * Function to navigate to the next card in the preview tab.
   */
  async continueToNextCard(): Promise<void> {
    await this.clickOn(nextCardButton);
  }

  /**
   * Function to submit an answer to a form input field.
   *
   * This function first determines the type of the input field in the DOM using the getInputType function.
   * Currently, it only supports 'text', 'number', and 'float' input types. If the input type is anything else, it throws an error.
   * @param {string} answer - The answer to submit.
   */
  async submitAnswer(answer: string): Promise<void> {
    await this.waitForElementToBeClickable(floatFormInput);
    const inputType = await this.getInputType(floatFormInput);

    switch (inputType) {
      case 'text':
      case 'number':
      case 'float':
        await this.type(floatFormInput, answer);
        break;
      default:
        throw new Error(`Unsupported input type: ${inputType}`);
    }

    await this.clickOn(submitAnswerButton);
  }

  /**
   * Function to Get the type of an input field in the DOM.
   * @param {string} selector - The CSS selector for the input field.
   */
  async getInputType(selector: string): Promise<string> {
    const inputField = await this.page.$(selector);
    if (!inputField) {
      throw new Error(`Input field not found for selector: ${selector}`);
    }
    const inputType = (await (
      await inputField.getProperty('type')
    ).jsonValue()) as string;
    return inputType;
  }

  /**
   * Function to verify if the exploration is completed in the preview tab via checking the toast message.
   * @param {string} message - The expected toast message.
   */
  async expectPreviewCompletionToastMessage(message: string): Promise<void> {
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      visible: true,
    });
    const element = await this.page.$(explorationCompletionToastMessage);
    const toastMessage = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (!toastMessage || !toastMessage.includes(message)) {
      throw new Error('Exploration did not complete successfully');
    }
    showMessage('Exploration has completed successfully');
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      hidden: true,
    });
  }

  /**
   * Function to restart the preview after it has been completed.
   */
  async restartPreview(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      // If the mobile navigation bar is expanded, it can overlap with the restart button,
      // making it unclickable. So, we check for its presence and collapse it.
      const element = await this.page.$(mobileNavbarOptions);
      if (element) {
        await this.clickOn(mobileOptionsButton);
      }
    }
    await this.clickOn(previewRestartButton);
  }

  async navigateToSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileSettingsTabButton);
    } else {
      await this.clickOn(SettingsTabButton);
    }
  }

  async updateExplorationTitle(title: string): Promise<void> {
    await this.type(explorationTitleInputField, title);
  }

  async navigateToMainTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileMainTabButton);
    } else {
      await this.clickOn(MainTabButton);
    }
  }

  async navigateToHistoryTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileHistoryTabButton);
    } else {
      await this.clickOn(HistoryTabButton);
    }
  }

  /**
   * This function checks if a specific revision has certain properties.
   * @param {number} revisionNumber - The number of the revision to check.
   * @param {string[]} properties - The properties to check for in the revision.
   */
  async expectRevisionToHave(
    revisionNumber: number,
    properties: string[]
  ): Promise<void> {
    let elements = await this.page.$$(historyListItem);
    if (elements.length < revisionNumber) {
      throw new Error(
        `There are not enough revisions. Requested: ${revisionNumber}, available: ${elements.length}`
      );
    }

    let element = elements[revisionNumber - 1];

    const propertyToSelector = {
      'Version No.': revisionVersionNoSelector,
      Notes: revisionNoteSelector,
      User: revisionUsernameSelector,
      Date: revisionDateSelector,
    };

    for (let property of properties) {
      let selector = propertyToSelector[property];
      if (!selector) {
        throw new Error(`Invalid property: ${property}`);
      }

      let value = await element.$eval(selector, async el => el.textContent);
      if (property !== 'Notes' && (!value || value.trim() === '')) {
        throw new Error(
          `Revision ${revisionNumber} is missing or has an empty ${property}`
        );
      }

      showMessage(`Revision ${revisionNumber} has the property ${property}`);
    }
  }

  /**
   * This function checks if the revisions are ordered by a specific property.
   * @param {string} property - The property to check the order by.
   */
  async expectRevisionsToBeOrderedBy(property: string): Promise<void> {
    let revisions = await this.page.$$(historyListItem);
    for (let i = 0; i < revisions.length - 1; i++) {
      let value1 = revisions[i][property];
      let value2 = revisions[i + 1][property];

      if (typeof value1 === 'string') {
        value1 = new Date(value1);
        value2 = new Date(value2);
      }

      if (value1 < value2) {
        throw new Error(`Revisions are not sorted by ${property}`);
      }
    }

    showMessage(`Revisions are sorted by ${property}`);
  }

  /**
   * This function filters the revisions by a specific user.
   * @param {string} userName - The name of the user to filter the revisions by.
   */
  async filterRevisionsByUser(userName: string): Promise<void> {
    await this.type(userNameEdit, userName);
    // The unicode '\u000d' is used to simulate the Enter key press.
    await this.type(userNameEdit, '\u000d');
  }

  /**
   * This function checks if the number of revisions matches the expected number.
   * @param {number} expectedNumber - The expected number of revisions.
   */
  async expectNumberOfRevisions(expectedNumber: number): Promise<void> {
    let revisions = await this.page.$$(historyListItem);
    if (revisions.length !== expectedNumber) {
      throw new Error(
        `Expected ${expectedNumber} revisions, but found ${revisions.length}`
      );
    } else {
      showMessage(`Found ${expectedNumber} revisions as expected`);
    }
  }

  /**
   * This function adjusts the paginator to show a specific number of revisions per page.
   *
   * @param {number} revisionsPerPage - The number of revisions to show per page. Can be 10, 15, or 20.
   */
  async adjustPaginatorToShowRevisionsPerPage(
    revisionsPerPage: number
  ): Promise<void> {
    const revisionsToIndex = {
      10: 1,
      15: 2,
      20: 3,
    };

    const index = revisionsToIndex[revisionsPerPage];
    if (index === undefined) {
      throw new Error(
        `Invalid number of revisions per page: ${revisionsPerPage}`
      );
    }

    await this.page.waitForSelector(paginatorToggler, {visible: true});
    await this.page.click(paginatorToggler);
    const PaginatorOptionsSelector = '.mat-select-panel';
    await this.clickOn(
      `${PaginatorOptionsSelector} mat-option:nth-child(${index})`
    );
  }

  /**
   * Function to check if the next page of revisions button is in a certain status.
   * @param {string} status - The status to check for.
   */
  async expectNextPageOfRevisionsButtonToBe(status: string): Promise<void> {
    const nextPageButton = await this.page.$('.mat-paginator-navigation-next');
    if (!nextPageButton) {
      throw new Error('Next page button not found');
    }
    const isDisabled = await nextPageButton.evaluate(
      button => button.getAttribute('disabled') === 'true'
    );
    if (
      (status === 'disabled' && isDisabled) ||
      (status === 'enabled' && !isDisabled)
    ) {
      showMessage(`Next page button is ${status}`);
      if (status === 'enabled') {
        await nextPageButton.click();
      }
    } else {
      throw new Error(
        `Expected next page button to be ${status}, but it was ${isDisabled ? 'disabled' : 'enabled'}`
      );
    }
  }

  /**
   * Function to select two revisions of an exploration for comparison.
   * @param {number} revisionIndex1 - The index of the first revision to select.
   * @param {number} revisionIndex2 - The index of the second revision to select.
   */
  async selectTwoRevisionsForComparison(
    revisionIndex1: number,
    revisionIndex2: number
  ): Promise<void> {
    if (revisionIndex1 === revisionIndex2) {
      throw new Error('Both revision indexes cannot be the same.');
    }

    await this.page.waitForSelector(firstRevisionDropdown);
    await this.clickOn(firstRevisionDropdown);
    const panel1 = '#mat-select-0-panel';
    await this.page.waitForSelector(
      `${panel1} mat-option:nth-last-child(${revisionIndex1})`
    );
    await this.clickOn(
      `${panel1} mat-option:nth-last-child(${revisionIndex1})`
    );

    await this.page.waitForSelector(secondRevisionDropdown);
    await this.clickOn(secondRevisionDropdown);
    const panel2 = '#mat-select-2-panel';
    await this.page.waitForSelector(
      `${panel2} mat-option:nth-last-child(${revisionIndex2})`
    );
    await this.clickOn(
      `${panel2} mat-option:nth-last-child(${revisionIndex2})`
    );
  }

  /**
   * Function to verify if changes are reflected for each property within a single code block.
   * @param {string[]} properties - The properties to check for.
   */
  async expectChangesInProperties(properties: string[]): Promise<void> {
    // Function to extract property values from a block.
    const extractPropertyValues = async () => {
      const values = {};
      for (let property of properties) {
        await this.page.waitForSelector('.cm-atom', {visible: true});
        const elements = await this.page.$$('.cm-atom');
        console.log(elements.length);
        const propertyElements = await Promise.all(
          elements.map(async el => {
            const textContent = await el.evaluate(node => node.textContent);
            return textContent === property ? el : null;
          })
        );

        const filteredElements = propertyElements.filter(el => el !== null);
        console.log(filteredElements);

        if (filteredElements.length >= 2) {
          const line1 = filteredElements[0]
            ? await filteredElements[0].evaluate(
                el => el.nextElementSibling?.nextElementSibling?.textContent
              )
            : null;
          const line2 = filteredElements[1]
            ? await filteredElements[1].evaluate(
                el => el.nextElementSibling?.nextElementSibling?.textContent
              )
            : null;

          values[property] = [line1, line2];
        }
      }
      return values;
    };

    // Extract property values.
    const propertyValues = await extractPropertyValues();
    console.log(propertyValues);

    // Check if the property values are the same for each property.
    for (let property in propertyValues) {
      if (propertyValues[property][0] === propertyValues[property][1]) {
        throw new Error(`No changes are reflected in ${property}`);
      } else {
        showMessage(`Changes are reflected in ${property}.`);
      }
    }
  }

  /**
   * Function to verify if metadata changes are reflected for each property within a single code block.
   * @param {string[]} properties - The properties to check for.
   */
  async expectMetadataChangesInProperties(properties: string[]): Promise<void> {
    await this.page.waitForSelector(viewMetadataChangesButton, {visible: true});
    await this.clickOn(viewMetadataChangesButton);

    await this.expectChangesInProperties(properties);

    await this.clickOn(closeMetadataModal);
  }

  /**
   * Function to verify if exploration state changes are reflected for each property within a single code block.
   * @param {string[]} properties - The properties to check for.
   */
  async expectStateChangesInProperties(properties: string[]): Promise<void> {
    await this.clickOn(testNodeBackground);
    await this.page.waitForTimeout(2000);
    await this.expectChangesInProperties(properties);

    await this.clickOn(closeStateModal);
  }

  /**
   * Function to reset the comparison results.
   */
  async resetComparisonResults(): Promise<void> {
    await this.page.waitForSelector(resetGraphButton);
    await this.clickOn(resetGraphButton);
  }

  /**
   * Function to find the button for a specific version.
   * @param {number} version - The version number to find.
   */
  async findOptionsButtonForVersion(version: number): Promise<ElementHandle> {
    const buttons = await this.page.$$('.history-table-option');
    if (version - 1 < 0 || version - 1 >= buttons.length) {
      throw new Error(`No button found for version ${version}`);
    }
    return buttons[version - 1];
  }

  /**
   * Function to download a specific version.
   * @param {number} version - The version number to be downloaded.
   */
  async downloadRevision(version: number): Promise<void> {
    const button = await this.findOptionsButtonForVersion(version);
    await button.click();
    await this.clickOn(downloadVersionButton);
  }

  /**
   * Function to revert to a specific version.
   * @param {number} version - The version number to revert to.
   */
  async revertToVersion(version: number): Promise<void> {
    const button = await this.findOptionsButtonForVersion(version);
    await button.click();
    await this.clickOn(revertVersionButton);
    await this.clickOn(confirmRevertVersionButton);
  }

  /**
   * Function to verify if a version is reverting and downloading or not.
   * @param {number} version - The version number to check.
   */
  async expectReversionToVersion(version: number): Promise<void> {
    await this.page.waitForSelector(historyListItem);
    let element = await this.page.$(historyListItem);
    if (element === null) {
      throw new Error('No Revisions found');
    }
    let notes = await element.$eval(
      revisionNoteSelector,
      async el => el.textContent
    );
    if (notes === null) {
      throw new Error('Revision does not contain a Note');
    }
    console.log(notes);
    if (notes === ` Reverted exploration to version ${version} `) {
      showMessage('Revision is reverting successfully');
    } else {
      throw new Error('Revision is not reverting');
    }
  }
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
