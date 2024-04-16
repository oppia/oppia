// Copyright 2023 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview exploration admin users utility file.
 */

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';

const creatorDashboardUrl = testConstants.URLs.CreatorDashboard;
const previewTabButton = '.e2e-test-preview-tab';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-button';

// Elements in exploration creator.
const createExplorationButton = '.e2e-test-create-activity';
const dismissWelcomeModalSelector = '.e2e-test-dismiss-welcome-modal';
const stateEditSelector = '.e2e-test-state-edit-content';
const stateContentInputField = '.oppia-rte';
const saveContentButton = '.e2e-test-save-state-content';
const addInteractionButton = '.e2e-test-open-add-interaction-modal';
const saveInteractionButton = '.e2e-test-save-interaction';
const saveChangesButton = '.e2e-test-save-changes';
const saveDraftButton = '.e2e-test-save-draft-button';
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
const mobileSaveChangesButton = '.e2e-test-save-changes-for-small-screens';

// Preview tab elements.
const nextCardButton = '.e2e-test-next-card-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const previewRestartButton = '.e2e-test-preview-restart-button';
const stateConversationContent = '.e2e-test-conversation-content';
const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';

export class ExplorationEditor extends BaseUser {
  /**
   * Function to navigate to the creator dashboard page.
   */
  async navigateToCreatorDashboard(): Promise<void> {
    await this.page.goto(creatorDashboardUrl);
  }

  /**
   * Function to click on the 'Create Exploration' button.
   */
  async clickCreateExplorationButton(): Promise<void> {
    await this.clickOn(createExplorationButton);
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
    await this.page.waitForSelector(saveInteractionButton, {hidden: true});
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
      // The option to save changes in mobile width, appears only after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileSaveChangesButton);
    } else {
      await this.clickOn(saveChangesButton);
    }
    await this.clickOn(saveDraftButton);
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
      await this.page.waitForSelector(stateNodeSelector);
      elements = await this.page.$$(stateNodeSelector);
    } else {
      await this.page.waitForSelector(stateNodeSelector);
      elements = await this.page.$$(stateNodeSelector);
    }

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
   * @param {boolean} correctness - Whether the response is marked as correct.
   */
  async addResponsesToTheInteraction(
    interactionType: string,
    answer: string,
    feedback: string,
    destination: string,
    correctness: boolean
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
    if (correctness) {
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
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
