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
 * @fileoverview Utility functions for the Exploration Editor page.
 */

import {Page, ElementHandle} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {ExplorationEditorModal} from '../common/exploration-editor';

const creatorDashboardPage = testConstants.URLs.CreatorDashboard;
const baseUrl = testConstants.URLs.BaseURL;

const createExplorationButtonSelector =
  'button.e2e-test-create-new-exploration-button';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';

const addInteractionModalSelector = 'customize-interaction-body-container';

const saveDraftButton = 'button.e2e-test-save-draft-button';
const commitMessageSelector = 'textarea.e2e-test-commit-message-input';
const publishExplorationButtonSelector = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';

const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = '.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';

const explorationStateGraphModalSelector =
  '.e2e-test-exploration-state-graph-modal';
const mobileStateGraphResizeButton = '.e2e-test-mobile-graph-resize-button';
const currentCardNameContainerSelector = '.e2e-test-state-name-container';

const stateEditSelector = '.e2e-test-state-edit-content';
const stateResponsesSelector = '.e2e-test-default-response-tab';
const oppiaFeebackEditorContainerSelector = '.e2e-test-response-body-default';

const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
// TODO(#23019): Required selector for code below.
// const stateContentSelector = '.e2e-test-actual-state-content';
const stateContentInputField = 'div.e2e-test-rte';

const toastMessage = '.e2e-test-toast-message';

const mobileChangesDropdownSelector = 'div.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButtonSelector =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButtonSelector = 'button.e2e-test-mobile-publish-button';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButtonSelector = 'i.e2e-test-mobile-options';
('h3.e2e-test-controls-bar-settings-container');

const tagsField = '.e2e-test-chip-list-tags';
const errorSavingExplorationModal = '.e2e-test-discard-lost-changes-button';

const customizeInteractionHeaderSelector =
  '.e2e-test-customize-interaction-header';

// Common Selectors.
const commonModalTitleSelector = '.e2e-test-modal-header';
const loadingFullPageOverlaySelector = '.oppia-loading-full-page';

export enum INTERACTION_TYPES {
  ALGEBRAIC_EXPRESSION = 'Algebraic Expression Input',
  CODE_EDITOR = 'Code Editor',
  CONTINUE_BUTTON = 'Continue Button',
  DRAG_AND_DROP_SORT = 'Drag And Drop Sort',
  END_EXPLORATION = 'End Exploration',
  FRACTION_INPUT = 'Fraction Input',
  GRAPH_THEORY = 'Graph Theory',
  ITEM_SELECTION = 'Item Selection',
  MATH_EQUATION = 'Math Equation Input',
  MULTIPLE_CHOICE = 'Multiple Choice',
  MUSIC_NOTES_INPUT = 'Music Notes Input',
  NUMBER_INPUT = 'Number Input',
  NUMBER_WITH_UNITS = 'Number With Units',
  NUMERIC_EXPRESSION = 'Numeric Expression Input',
  PENCIL_CODE_EDITOR = 'Pencil Code Editor',
  RATIO_EXPRESSION_INPUT = 'Ratio Expression Input',
  SET_INPUT = 'Set Input',
  TEXT_INPUT = 'Text Input',
  WORLD_MAP = 'World Map',
  NUMERIC_INPUT = 'Number Input',
}

export const INTERACTION_TABS = {
  MATHS: 'Math',
  PROGRAMMING: 'Programming',
  GEOGRAPHY: 'Geography',
  MUSIC: 'Music',
};

export const INTERACTION_TABS_SELECTORS: Record<string, string> = {
  [INTERACTION_TABS.MATHS]: '.e2e-test-interaction-tab-math',
  [INTERACTION_TABS.PROGRAMMING]: '.e2e-test-interaction-tab-programming',
  [INTERACTION_TABS.GEOGRAPHY]: '.e2e-test-interaction-tab-geography',
  [INTERACTION_TABS.MUSIC]: '.e2e-test-interaction-tab-music',
};

export const INTERACTION_TABS_OF_INTERACTION_TYPE: Record<string, string> = {
  [INTERACTION_TYPES.CODE_EDITOR]: INTERACTION_TABS.PROGRAMMING,
  [INTERACTION_TYPES.FRACTION_INPUT]: INTERACTION_TABS.MATHS,
} as const;

export class ExplorationEditor extends BaseUser {
  /**
   * Navigate to creator dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardPage);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   * @param {boolean} skipInteractionCustoization - Whether to skip interaction customization.
   */
  async addInteraction(
    interactionToAdd: string,
    skipInteractionCustoization: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);

    // Wait for any loading overlays to detach before clicking.
    await this.expectElementToBeVisible(loadingFullPageOverlaySelector, false);
    await this.clickOnElementWithSelector(addInteractionButton);

    // Check if modal title is correct.
    await this.expectModalTitleToBe('Choose Interaction');

    await this.changeTabInInteractionSelectionModal(
      interactionToAdd as INTERACTION_TYPES
    );

    await this.page.waitForLoadState('networkidle');
    // Use a higher timeout for math interactions as they are heavy to render.
    let tileText = interactionToAdd;

    const interactionElement = await this.page.waitForSelector(
      `xpath=//*[contains(normalize-space(text()), "${tileText}")]`,
      {timeout: 90000}
    );
    if (!interactionElement) {
      throw new Error(`Interaction "${interactionToAdd}" not found in modal.`);
    }
    await this.clickOnElement(interactionElement);
    if (skipInteractionCustoization) {
      await this.expectCustomizeInteractionTitleToBe(
        `Customize Interaction (${interactionToAdd})`
      );
      await this.expectElementToBeVisible(saveInteractionButton);
      await this.clickOnElementWithSelector(saveInteractionButton);
      await this.expectElementToBeVisible(addInteractionModalSelector, false);
    }
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Changes tab in interaction selection modal.
   * @param interactionType Interaction type to change tab.
   */
  async changeTabInInteractionSelectionModal(
    interactionType: INTERACTION_TYPES
  ): Promise<void> {
    const interactionTabs: Record<string, INTERACTION_TYPES[]> = {
      [INTERACTION_TABS.MATHS]: [
        INTERACTION_TYPES.FRACTION_INPUT,
        INTERACTION_TYPES.NUMBER_INPUT,
        INTERACTION_TYPES.SET_INPUT,
        INTERACTION_TYPES.NUMERIC_EXPRESSION,
        INTERACTION_TYPES.ALGEBRAIC_EXPRESSION,
        INTERACTION_TYPES.MATH_EQUATION,
        INTERACTION_TYPES.NUMBER_WITH_UNITS,
        INTERACTION_TYPES.RATIO_EXPRESSION_INPUT,
      ],
    };

    for (const interaction in interactionTabs) {
      if (interactionTabs[interaction].includes(interactionType)) {
        await this.waitForElementToStabilize(
          INTERACTION_TABS_SELECTORS[interaction]
        );
        await this.clickOnElementWithSelector(
          INTERACTION_TABS_SELECTORS[interaction]
        );
        showMessage(`Switched to ${interaction} tab.`);
        break;
      }
    }
  }

  /**
   * Function for creating an exploration with two cards.
   * @param {string} explorationTitle - The title of the exploration.
   * @param {string} category - The category of the exploration.,
   * @param {number} numberOfCards - The number of cards to create.
   */
  async createAndPublishExplorationWithCards(
    explorationTitle: string,
    category: string = 'Mathematics',
    numberOfCards: number = 2,
    expectedWelcomeModal: boolean = false
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.dismissWelcomeModal(expectedWelcomeModal);

    for (let i = 0; i < numberOfCards - 1; i++) {
      await this.updateCardContent(`Content ${i}`);
      await this.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await this.viewOppiaResponses();
      await this.directLearnersToNewCard(`Card ${i + 1}`);
      await this.saveExplorationDraft();
      await this.navigateToCard(`Card ${i + 1}`);
    }

    await this.updateCardContent(`Content ${numberOfCards - 1}`);
    await this.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await this.saveExplorationDraft();

    const explorationId = await this.publishExplorationWithMetadata(
      explorationTitle,
      `This is ${explorationTitle}\`s goals.`,
      category
    );

    if (explorationId) {
      showMessage('Exploration published successfully');
      return explorationId;
    } else {
      throw new Error('Exploration not published');
    }
  }

  /**
   * Function for creating an exploration with only EndExploration interaction with given title.
   * @param {string} title - The title of the exploration.
   * @param {string} category - The category of the exploration. Defaults to 'Algebra'.
   * @param {boolean} flag - Determines whether to dismiss the welcome modal.
   */
  async createAndPublishAMinimalExplorationWithTitle(
    title: string,
    category: string = 'Algebra',
    flag: boolean = false
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.dismissWelcomeModal(flag);
    await this.createMinimalExploration(
      'Exploration intro text',
      'End Exploration'
    );
    await this.saveExplorationDraft();
    return await this.publishExplorationWithMetadata(
      title,
      'This is Goal here.',
      category
    );
  }

  /**
   * Function to create an exploration with a content and interaction.
   * This is a composite function that can be used when a straightforward, simple exploration setup is required.
   *
   * @param content - content of the exploration
   * @param interaction - the interaction to be added to the exploration
   */
  async createMinimalExploration(
    content: string,
    interaction: string
  ): Promise<void> {
    await this.updateCardContent(content);
    await this.addInteraction(interaction);
    showMessage('A simple exploration is created.');
  }

  /**
   * Function to select the card that learners will be directed to from the current card.
   * @param {string} cardName - The name of the card to which learners will be directed.
   */
  async directLearnersToNewCard(cardName: string): Promise<void> {
    await this.expectElementToBeVisible(openOutcomeDestButton);
    await this.clickOnElementWithSelector(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.typeInInputField(addStateInput, cardName);
    await this.clickOnElementWithSelector(saveOutcomeDestButton);
    await this.expectElementToBeVisible(saveOutcomeDestButton, false);
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   * @param failIfMissing - Whether to fail if the welcome modal is not found.
   */
  async dismissWelcomeModal(failIfMissing: boolean = true): Promise<void> {
    const explorationEditor = new ExplorationEditorModal(this);
    await explorationEditor.dismissWelcomeModal(failIfMissing);
  }

  /**
   * Verifies that the customize interaction header is visible and contains the expected title.
   * @param {string} title The expected title of the customize interaction header.
   */
  async expectCustomizeInteractionTitleToBe(title: string): Promise<void> {
    await this.expectElementToBeVisible(customizeInteractionHeaderSelector);

    await this.expectTextContentToBe(customizeInteractionHeaderSelector, title);
  }

  /**
   * Verifies that the modal title is as expected.
   * @param {string} expectedTitle - The expected title.
   */
  async expectModalTitleToBe(expectedTitle: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToContain(
      commonModalTitleSelector,
      expectedTitle
    );
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async navigateToCard(cardName: string, retry: boolean = true): Promise<void> {
    let elements;
    if (this.isViewportAtMobileWidth()) {
      // Check if the state graph modal is already open before clicking the
      // resize button.
      const stateGraphModalIsOpen = await this.page.$(
        explorationStateGraphModalSelector
      );
      if (!stateGraphModalIsOpen) {
        // Wait for any blocking modal to close first before clicking the
        // resize button.
        const blockingModal = await this.page.$('div.modal-content');
        if (blockingModal) {
          await this.expectElementToBeVisible('div.modal-content', false);
        }
        await this.expectElementToBeVisible(mobileStateGraphResizeButton);
        await this.clickOnElementWithSelector(mobileStateGraphResizeButton);
      }
    }

    // Get all state node groups (not just labels) since we need to click the
    // background rect which has the click handler.
    const stateNodeGroupSelector = '.e2e-test-node';
    const scopedStateNodeGroupSelector = this.isViewportAtMobileWidth()
      ? `${explorationStateGraphModalSelector} ${stateNodeGroupSelector}`
      : stateNodeGroupSelector;
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(explorationStateGraphModalSelector);
    }
    await this.page.waitForSelector(scopedStateNodeGroupSelector);
    elements = await this.page.$$(scopedStateNodeGroupSelector);

    const cardNames = await Promise.all(
      elements.map(element =>
        element.$eval(
          '.e2e-test-node-label',
          node => node.textContent?.trim() || ''
        )
      )
    );
    const cardIndex = cardNames.indexOf(cardName);

    if (cardIndex === -1) {
      throw new Error(`Card name ${cardName} not found in the graph.`);
    }

    const nodeGroup: ElementHandle<Element> | null = elements[cardIndex];
    if (!nodeGroup) {
      throw new Error(`Could not find card button for card: ${cardName}`);
    }

    // Click on the node background rect which has the click handler.
    const nodeBackground = await nodeGroup.$('.e2e-test-node-background');
    if (!nodeBackground) {
      throw new Error(
        `Could not find clickable background for card: ${cardName}`
      );
    }
    await nodeBackground.evaluate(el =>
      el.scrollIntoView({block: 'center', inline: 'center'})
    );
    await this.clickOnElement(nodeBackground);
    await this.page.waitForLoadState('networkidle');

    const headingName = !cardName.trimEnd().endsWith('...')
      ? cardName
      : cardName.trimEnd().slice(0, -3);
    try {
      await this.page.waitForFunction(
        ({selector, value}: {selector: string; value: string}) => {
          const element = document.querySelector(selector);
          return element?.textContent?.includes(value);
        },
        {selector: currentCardNameContainerSelector, value: headingName}
      );
    } catch (error) {
      if (retry) {
        showMessage(`Unable to navigate to the card ${cardName}. Retrying...`);
        await this.navigateToCard(cardName, false);
      } else {
        const err = error instanceof Error ? error : new Error(String(error));
        err.message =
          `Unable to navigate to the card ${cardName}.\n` + err.message;
        throw err;
      }
    }
  }

  /**
   * Function to navigate to exploration editor from Creator Dashboard.
   */
  async navigateToExplorationEditorFromCreatorDashboard(): Promise<void> {
    await this.expectElementToBeVisible(createExplorationButtonSelector);
    await this.clickAndWaitForNavigation(createExplorationButtonSelector, true);
    await this.page.waitForURL(url => url.href.includes(`${baseUrl}/create/`), {
      timeout: 10000,
    });
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContent(content: string): Promise<void> {
    await this.expectElementToBeVisible(stateEditSelector);
    await this.clickOnElementWithSelector(stateEditSelector);
    await this.clearAllTextFrom(stateContentInputField);
    await this.typeInInputField(stateContentInputField, `${content}`);
    await this.clickOnElementWithSelector(saveContentButton);
    await this.expectElementToBeVisible(stateContentInputField, false);

    // TODO(#23019): Currently, the content automatically changes spaces in the
    // card content. So, skipping the post-check. Once the issue is resolved,
    // uncomment the following line.
    // await this.expectTextContentToContain(stateContentSelector, content);
    showMessage('Card content is updated successfully.');
  }

  /**
   * Function to save an exploration draft.
   * @param {string} commitMessage - The commit message text to be saved.
   */
  async saveExplorationDraft(
    commitMessage: string = 'Testing Testing'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.expectElementToBeVisible(mobileOptionsButtonSelector);
        await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
      }

      await this.page.waitForSelector(
        `${mobileSaveChangesButtonSelector}:not([disabled])`,
        {state: 'visible'}
      );
      await this.clickOnElementWithSelector(mobileSaveChangesButtonSelector);
    } else {
      await this.expectElementToBeVisible(saveChangesButton);
      await this.clickOnElementWithSelector(saveChangesButton);
    }
    // We skip the commit message if it's an empty string.
    if (commitMessage) {
      await this.clickOnElementWithSelector(commitMessageSelector);
      await this.typeInInputField(commitMessageSelector, commitMessage);
    }
    await this.clickOnElementWithSelector(saveDraftButton);
    await this.expectElementToBeVisible(saveDraftButton, false);

    // Toast message confirms that the draft has been saved.
    await this.expectElementToBeVisible(toastMessage);
    await this.expectElementToBeVisible(toastMessage, false);
    showMessage('Exploration is saved successfully.');
    await this.waitForPageToFullyLoad();
  }

  /**
   * Function to publish exploration.
   * This is a composite function that can be used when a straightforward, simple exploration published is required.
   * @param {string} title - The title of the exploration.
   * @param {string} goal - The goal of the exploration.
   * @param {string} category - The category of the exploration.,
   * @param {string} tags - The tags of the exploration.
   */
  async publishExplorationWithMetadata(
    title: string,
    goal: string,
    category: string,
    tags?: string
  ): Promise<string> {
    const publishExploration = async () => {
      if (this.isViewportAtMobileWidth()) {
        await this.waitForPageToFullyLoad();
        await this.expectElementToBeVisible(mobileNavbarDropdown);
        const element = await this.page.$(mobileNavbarOptions);
        // If the element is not present, it means the mobile navigation bar is not expanded.
        // The option to save changes appears only in the mobile view after clicking on the mobile options button,
        // which expands the mobile navigation bar.
        if (!element) {
          await this.clickOnElementWithSelector(mobileOptionsButtonSelector);
        }
        await this.clickOnElementWithSelector(mobileChangesDropdownSelector);
        await this.clickOnElementWithSelector(mobilePublishButtonSelector);
      } else {
        await this.expectElementToBeVisible(publishExplorationButtonSelector);
        await this.clickOnElementWithSelector(publishExplorationButtonSelector);
      }
    };

    const fillExplorationMetadataDetails = async () => {
      await this.clickOnElementWithSelector(explorationTitleInput);
      await this.typeInInputField(explorationTitleInput, title);
      await this.clickOnElementWithSelector(explorationGoalInput);
      await this.typeInInputField(explorationGoalInput, goal);
      await this.clickOnElementWithSelector(explorationCategoryDropdown);
      await this.clickOnElementWithText(category);
      if (tags) {
        await this.typeInInputField(tagsField, tags);
      }
    };

    const confirmPublish = async (): Promise<string> => {
      await this.clickOnElementWithSelector(saveExplorationChangesButton);
      await this.waitForPageToFullyLoad();
      await this.expectElementToBeVisible(explorationConfirmPublishButton);
      await this.clickOnElementWithSelector(explorationConfirmPublishButton);
      const success = await this.expectElementToBeVisible(explorationIdElement)
        .then(() => true)
        .catch(() => false);
      if (!success) {
        await this.reloadPage();
        await this.expectElementToBeVisible(explorationIdElement);
      }
      await this.expectElementToBeVisible(explorationIdElement);
      const explorationIdUrl = await this.page.$eval(
        explorationIdElement,
        element => (element as HTMLElement).innerText
      );
      const explorationId = explorationIdUrl.replace(/^.*\/explore\//, '');
      await this.waitForElementToStabilize(closePublishedPopUpButton);
      await this.clickOnElementWithSelector(closePublishedPopUpButton);
      await this.expectElementToBeVisible(closePublishedPopUpButton, false);

      if (!explorationId) {
        throw new Error('Failed to get exploration ID.');
      }
      return explorationId;
    };

    await publishExploration();
    await fillExplorationMetadataDetails();

    try {
      return await confirmPublish();
    } catch (error) {
      showMessage(
        'Failed to publish the exploration.\n' +
          (error instanceof Error ? error.stack : String(error))
      );

      const errorSavingExplorationElement = await this.page.$(
        errorSavingExplorationModal
      );
      if (errorSavingExplorationElement) {
        await this.clickOnElementWithSelector(errorSavingExplorationModal);
        await this.page.waitForLoadState('networkidle');
      }
      await publishExploration();
      return await confirmPublish();
    }
  }

  /**
   * Function to display the Oppia responses section.
   */
  async viewOppiaResponses(): Promise<void> {
    await this.expectElementToBeVisible(stateResponsesSelector);
    await this.clickOnElementWithSelector(stateResponsesSelector);
    await this.expectElementToBeVisible(oppiaFeebackEditorContainerSelector);
  }
}

export const ExplorationEditorFactory = (page: Page): ExplorationEditor => {
  return new ExplorationEditor(page);
};
