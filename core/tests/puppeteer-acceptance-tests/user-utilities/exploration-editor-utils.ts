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

const creatorDashboardAdminUrl = testConstants.URLs.CreatorDashboard;
const navigateToPreviewTabButton = '.e2e-test-preview-tab';

// Elements in exploration creator.
const createExplorationButtonSelector = 'button.e2e-test-create-activity';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const stateEditSelector = 'div.e2e-test-state-edit-content';
const explorationContentInput = 'div.oppia-rte';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const endInteractionSelector = '.e2e-test-interaction-tile-EndExploration';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const saveDraftButton = 'button.e2e-test-save-draft-button';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = '.e2e-test-add-new-response';
const floatFormInput = 'input.oppia-float-form-input';

const testNodeBackground = '.e2e-test-node';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const oppiaResponseSelector = '.oppia-click-to-start-editing';

// Preview tab elements.
const testContinueButton = '.e2e-test-continue-button';
const testFloatFormInput = '.e2e-test-float-form-input';
const nextCardButton = '.e2e-test-next-card-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const explorationRestartButton = '.e2e-preview-restart-button';
const explorationConversationContent = '.e2e-test-conversation-content';
const explorationCompletedMessage: string = 'div.toast-message';

export class ExplorationEditor extends BaseUser {
  /**
   * Function to navigate to the creator dashboard page.
   */
  async navigateToCreatorDashboard(): Promise<void> {
    await this.page.goto(creatorDashboardAdminUrl);
  }

  /**
   * Function to create an exploration in the Exploration Editor.
   * @param {string} content - The content in the Exploration.
   */
  async createExploration(content: string): Promise<void> {
    await this.page.click(createExplorationButtonSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.page.waitForSelector(stateEditSelector, {visible: true});
    await this.clickOn(stateEditSelector);

    await this.page.waitForSelector(explorationContentInput, {visible: true});
    await this.page.type(explorationContentInput, `${content}`);
    await this.clickOn(saveContentButton);
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   */
  async addAnInteractionToTheExploration(
    interactionToAdd: string
  ): Promise<void> {
    await this.page.waitForSelector(addInteractionButton);
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(endInteractionSelector, {visible: true});
    await this.clickOn(interactionToAdd);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector('.customize-interaction-body-container', {
      hidden: true,
    });
    ``;
    if (interactionToAdd !== ' End Exploration ') {
      await this.clickOn('.oppia-response-header');
    }
  }

  /**
   * Function to save an exploration draft.
   */
  async saveExplorationDraft(): Promise<void> {
    await this.clickOn(saveChangesButton);
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.page.waitForSelector(saveDraftButton, {visible: true});
    await this.clickOn(saveDraftButton);
    await this.page.waitForSelector(saveDraftButton, {hidden: true});

    await this.page.waitForFunction('document.readyState === "complete"');
  }

  /**
   * Function to create a new card in the exploration creator.
   * @param {string} cardName - The name of the card to be created.
   */
  async addANewCardToTheExploration(cardName: string): Promise<void> {
    await this.clickOn(openOutcomeDestButton);
    await this.page.select(destinationCardSelector, '/');
    await this.page.waitForSelector(addStateInput);
    await this.page.type(addStateInput, cardName);
    await this.clickOn(saveOutcomeDestButton);
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async goToTheCard(cardName: string): Promise<void> {
    await this.clickOn(cardName);
    await this.page.waitForNetworkIdle({idleTime: 700});
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {number} cardNum - The number of the card to navigate to.
   */
  async goToTheIntroductionCard(cardNum: number): Promise<void> {
    const selector = testNodeBackground;
    await this.page.waitForSelector(selector);
    const elements = await this.page.$$(selector);
    if (elements.length > cardNum) {
      await elements[cardNum].click();
    } else {
      throw new Error(
        `There are not enough elements to click on the ${cardNum}th element.`
      );
    }
  }

  /**
   * Function to add content to a card.
   * @param {string} questionText - The content to be added to the card.
   */
  async addContentToTheCard(questionText: string): Promise<void> {
    await this.page.waitForSelector(stateEditSelector, {visible: true});
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(explorationContentInput, {visible: true});
    await this.page.click(explorationContentInput, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.type(explorationContentInput, `${questionText}`);
    await this.clickOn(saveContentButton);
  }

  /**
   * Function to add an interaction to a card.
   * @param {string} interaction - The interaction to be added to the card.
   */
  async addAnInteractionToTheCard(interaction: string): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {visible: true});
    await this.clickOn(addInteractionButton);
    await this.clickOn(interaction);
    await this.clickOn(saveInteractionButton);
  }

  /**
   * Function to add responses to the interactions.
   * @param {string} response - response to be added.
   */
  async addResponsesToTheInteraction(response: string): Promise<void> {
    await this.page.waitForSelector(floatFormInput);
    await this.type(floatFormInput, response);
    await this.page.waitForSelector(oppiaResponseSelector);
    await this.clickOn(oppiaResponseSelector);
    await this.page.waitForSelector(explorationContentInput, {visible: true});
    await this.type(explorationContentInput, 'correct');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);
  }

  /**
   * Function to navigate to the preview tab.
   */
  async navigateToPreviewTab(): Promise<void> {
    await this.page.waitForSelector(navigateToPreviewTabButton, {
      visible: true,
    });
    await this.clickOn(navigateToPreviewTabButton);

    await this.page.waitForFunction('document.readyState === "complete"');
    await this.page.waitForNetworkIdle();
  }

  /**
   * Function to verify if the exploration tab is loading correctly in
   * the preview tab or not.
   * @param {string} text - The expected introduction card text.
   */
  async expectTheExplorationToStartFromIntroductionCard(
    text: string
  ): Promise<void> {
    await this.page.waitForSelector(explorationConversationContent, {
      visible: true,
    });
    const element = await this.page.$(explorationConversationContent);
    const introMessage = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (introMessage === text) {
      showMessage(
        'Exploration is loading correctly from Introduction card in the preview tab'
      );
    } else {
      throw new Error(
        'Exploration is not loading correctly form Introduction card in the preview tab'
      );
    }
  }

  /**
   * Function to complete the exploration in the preview tab.
   */
  async completeTheExplorationInPreviewTab(): Promise<void> {
    await this.clickOn(testContinueButton);
    await this.page.waitForSelector(testFloatFormInput);
    await this.type(testFloatFormInput, '-1');
    await this.clickOn(submitAnswerButton);
    await this.page.waitForSelector(nextCardButton);
    await this.clickOn(nextCardButton);
  }

  /**
   * Function to verify if the exploration is completed in the preview tab.
   */
  async expectTheExplorationToComplete(): Promise<void> {
    await this.page.waitForSelector(explorationCompletedMessage);
    if (explorationCompletedMessage) {
      showMessage('Exploration has completed successfully');
    } else {
      throw new Error('Exploration did not complete successfully');
    }
  }

  /**
   * Function to restart the exploration after it has been completed.
   */
  async restartTheExploration(): Promise<void> {
    await this.page.waitForSelector(explorationCompletedMessage, {
      hidden: true,
    });
    await this.page.waitForSelector(explorationRestartButton, {visible: true});
    await this.clickOn(explorationRestartButton);
  }

  /**
   * Function to verify if the exploration is restarting after
   * getting completed or not.
   * @param {string} text - The expected introduction card text after restart.
   */
  async expectTheExplorationToRestart(text: string): Promise<void> {
    await this.page.waitForSelector(explorationConversationContent);
    const element = await this.page.$(explorationConversationContent);
    const introMessage = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (introMessage === text) {
      showMessage('Exploration has restarted successfully');
    } else {
      throw new Error('Exploration has not restarted successfully');
    }
  }
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
