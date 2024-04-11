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
const createExplorationButton = 'button.e2e-test-create-activity';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const stateEditSelector = 'div.e2e-test-state-edit-content';
const stateContentInputField = 'div.oppia-rte';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const saveDraftButton = 'button.e2e-test-save-draft-button';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = '.e2e-test-add-new-response';
const floatFormInput = 'input.e2e-test-float-form-input';

const stateNodeSelector = '.e2e-test-node';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const stateResponsesSelector = '.oppia-response-header';
const feedbackEditorSelector = '.e2e-test-open-feedback-editor';
const resonseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const mobileStateGraphResizeButton =
  '.e2e-test-oppia-mobile-graph-resize-button';
const mobileNavbarDropdown = '.e2e-test-mobile-options-dropdown';
const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButton = '.e2e-test-mobile-options';
const mobileSaveChangesButton = '.e2e-test-save-changes-for-small-screens';
const mobileStateNodeSelector = '.e2e-test-node-background';

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
   * Function to create an exploration in the Exploration Editor.
   */
  async createExploration(): Promise<void> {
    await this.clickOn(createExplorationButton);
    await this.clickOn(dismissWelcomeModalSelector);
  }

  /**
   * Function to add content to a card.
   * @param {string} questionText - The content to be added to the card.
   */
  async updateCardContent(questionText: string): Promise<void> {
    await this.clickOn(stateEditSelector);
    await this.waitForElementToBeClickable(stateContentInputField);
    await this.page.click(stateContentInputField, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.type(stateContentInputField, `${questionText}`);
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(stateContentInputField, {hidden: true});
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   */
  async addInteraction(interactionToAdd: string): Promise<void> {
    await this.clickOn(addInteractionButton);
    await this.clickOn(interactionToAdd);
    await this.clickOn(saveInteractionButton);
  }

  /**
   * Function to display the Oppia responses section.
   */
  async viewOppiaResponses(): Promise<void> {
    await this.page.waitForSelector(stateResponsesSelector, {visible: true});
    await this.page.click(stateResponsesSelector);
  }

  /**
   * Function to select the card that learners will be directed to from the current card.
   */
  async oppiaDirectlearnersTo(card: string): Promise<void> {
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    await this.page.select(destinationCardSelector, card);
  }

  /**
   * Function to name a new card in the exploration.
   */
  async nameNewCard(cardName: string): Promise<void> {
    await this.page.type(addStateInput, cardName);
    await this.waitForElementToBeClickable(saveOutcomeDestButton);
    await this.page.click(saveOutcomeDestButton);
  }

  /**
   * Function to save an exploration draft.
   */
  async saveExplorationDraft(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      if (!element) {
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(mobileSaveChangesButton);
      await this.clickOn(saveDraftButton);
      await this.page.waitForNetworkIdle();
    } else {
      await this.clickOn(saveChangesButton);
      await this.clickOn(saveDraftButton);
      await this.page.waitForNetworkIdle();
    }
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async navigateToCard(cardName: string): Promise<void> {
    if (cardName === 'Introduction' && this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileStateGraphResizeButton);
      await this.page.waitForSelector(mobileStateNodeSelector);
      const elements = await this.page.$$(mobileStateNodeSelector);
      await elements[3].click();
    } else if (cardName === 'Introduction') {
      await this.page.waitForSelector(stateNodeSelector);
      const elements = await this.page.$$(stateNodeSelector);
      await elements[0].click();
    } else if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileStateGraphResizeButton);
      await this.page.waitForSelector(mobileStateNodeSelector);
      const elements = await this.page.$$(mobileStateNodeSelector);
      if (cardName === 'Test Question ') {
        await elements[3].click();
      } else {
        await elements[5].click();
      }
      await this.page.waitForNetworkIdle({idleTime: 700});
    } else {
      await this.clickOn(cardName);
      await this.page.waitForNetworkIdle({idleTime: 700});
    }
  }

  /**
   * Function to add responses to the interactions.
   * @param {string} response - response to be added.
   */
  async addResponseToTheInteraction(response: string): Promise<void> {
    await this.type(floatFormInput, response);
    await this.clickOn(feedbackEditorSelector);
    await this.type(stateContentInputField, 'Correct Answer, You got that!');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);
    await this.page.waitForSelector(resonseModalHeaderSelector, {hidden: true});
  }

  /**
   * Function to navigate to the preview tab.
   */
  async navigateToPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobilePreviewTabButton);
      await this.page.waitForNavigation();
    } else {
      await this.clickOn(previewTabButton);
      await this.page.waitForNavigation();
    }
  }

  /**
   * Function to verify if the exploration is loading correctly in
   * the preview tab or not via checking the content of the Introduction(first) card.
   * @param {string} text - The expected introduction card text.
   */
  async expectCardContentToBe(text: string): Promise<void> {
    await this.page.waitForSelector(stateConversationContent, {
      visible: true,
    });
    const element = await this.page.$(stateConversationContent);
    const introMessage = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (introMessage === text) {
      showMessage(
        'Preview is on the Introduction card and is loading correctly.'
      );
    } else {
      throw new Error(
        'Preview is not on the Introduction card or is not loading correctly.'
      );
    }
  }

  /**
   * Functions to complete the exploration in the preview tab.
   */
  async continueToNextCard(): Promise<void> {
    await this.clickOn(nextCardButton);
  }

  async enterAnswer(answer: string): Promise<void> {
    await this.type(floatFormInput, answer);
  }

  async submitAnswer(): Promise<void> {
    await this.clickOn(submitAnswerButton);
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
    if (toastMessage && toastMessage.includes(message)) {
      showMessage('Exploration has completed successfully');
    } else {
      throw new Error('Exploration did not complete successfully');
    }
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      hidden: true,
    });
  }

  /**
   * Function to restart the preview after it has been completed.
   */
  async restartPreview(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      if (element) {
        await this.clickOn(mobileOptionsButton);
      }
      await this.clickOn(previewRestartButton);
    } else {
      await this.clickOn(previewRestartButton);
    }
  }
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
