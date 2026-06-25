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

const multipleChoiceResponseDropdown =
  'mat-select.e2e-test-main-html-select-selector';
const multipleChoiceResponseOption = 'mat-option.e2e-test-html-select-selector';
const responseModalBodySelector = '.e2e-test-response-modal-body';
const floatFormInput = '.e2e-test-float-form-input';
const addResponseOptionButton = 'button.e2e-test-add-list-entry';
const textInputInteractionOption =
  'tr[id^="e2e-test-schema-based-list-editor-table-row"]';
const intEditorField = '.e2e-test-editor-int';

const feedbackEditorSelector = '.e2e-test-open-feedback-editor';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = 'button.e2e-test-add-new-response';
const responseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const addAnotherResponseButton = 'button.e2e-test-add-another-response';

const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const destinationSelectorDropdown = '.e2e-test-destination-selector-dropdown';
const destinationWhenStuckSelectorDropdown =
  '.e2e-test-destination-when-stuck-selector-dropdown';
const saveDestinationButtonSelector = '.e2e-test-save-outcome-dest';
const saveStuckDestinationButtonSelector = '.e2e-test-save-stuck-destination';
const addDestinationStateWhenStuckInput = '.protractor-test-add-state-input';
const outcomeDestWhenStuckSelector =
  '.protractor-test-open-outcome-dest-if-stuck-editor';

const customizeInteractionHeaderSelector =
  '.e2e-test-customize-interaction-header';
const loadingFullPageOverlaySelector = '.oppia-loading-full-page';

// Common Selectors.
const commonModalTitleSelector = '.e2e-test-modal-header';

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
    // Wait for active tab panel fade transition to complete.
    await this.page.waitForSelector('css=.tab-pane.active.show', {
      timeout: 90000,
    });

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
   * Adds the response details in the response modal.
   * @param feedback The feedback to be added in the response modal.
   * @param destination The destination to be added in the response modal.
   * @param responseIsCorrect The response is correct or not.
   * @param isLastResponse Whether the response is the last response or not.
   */
  async addResponseDetailsInResponseModal(
    feedback: string,
    destination?: string,
    responseIsCorrect?: boolean,
    isLastResponse: boolean = true
  ): Promise<void> {
    await this.clickOnElementWithSelector(feedbackEditorSelector);
    await this.typeInInputField(stateContentInputField, feedback);
    await this.expectTextContentToBe(stateContentInputField, feedback);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    if (destination) {
      await this.select(destinationCardSelector, '/');
      await this.typeInInputField(addStateInput, destination);
    }
    if (responseIsCorrect) {
      await this.clickOnElementWithSelector(correctAnswerInTheGroupSelector);
    }
    if (isLastResponse) {
      await this.page.waitForSelector(addNewResponseButton, {
        state: 'visible',
      });
      await this.clickOnElementWithSelector(addNewResponseButton);
      await this.page
        .waitForSelector(responseModalHeaderSelector, {
          state: 'hidden',
        })
        .catch(async () => {
          await this.clickOnElementWithSelector(addNewResponseButton);
        });
    } else {
      await this.clickOnElementWithSelector(addAnotherResponseButton);
      // The waitForNetworkIdle method waits for the response
      // to the "Save Draft" request from change-list.service.ts
      // to get executed, the Add Response modal to fully appear
      // and all the fields in it to become clickable before
      // moving on to next steps.
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Function to add responses to the interactions.
   * Currently, it only handles 'Number Input', 'Multiple Choice', 'Number Input', and 'Text Input' interaction types.
   * @param {string} interactionType - The type of the interaction.
   * @param {string} answer - The response to be added.
   * @param {string} feedback - The feedback for the response.
   * @param {string} destination - The destination state for the response.
   * @param {boolean} responseIsCorrect - Whether the response is marked as correct.
   * @param {boolean} isLastResponse - Whether the response is last and more aren't going to be added.
   */
  async addResponsesToTheInteraction(
    interactionType: string,
    answer: string,
    feedback: string,
    destination?: string,
    responseIsCorrect?: boolean,
    isLastResponse: boolean = true
  ): Promise<void> {
    await this.updateAnswersInResponseModal(
      interactionType as INTERACTION_TYPES,
      answer
    );

    await this.addResponseDetailsInResponseModal(
      feedback,
      destination,
      responseIsCorrect,
      isLastResponse
    );
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

  // TODO(#22539): This function has a duplicate in exploration-editor.ts.
  // To avoid unexpected behavior, ensure that any modifications here are also
  // made in editDefaultResponseFeedbackInQuestionEditorPage() in question-submitter.ts.
  /**
   * Function to add feedback for default responses of a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   * @param {string} [directToCard] - The card to direct to (optional).
   * @param {string} [directToCardWhenStuck] - The card to direct to when the learner is stuck (optional).
   */
  async editDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string,
    directToCard?: string,
    directToCardWhenStuck?: string
  ): Promise<void> {
    await this.page.waitForSelector(defaultFeedbackTab, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.updateDefaultResponseFeedbackInExplorationEditorPage(
        defaultResponseFeedback
      );
    }

    if (directToCard) {
      await this.clickOnElementWithSelector(openOutcomeDestButton);
      await this.page.selectOption(destinationSelectorDropdown, directToCard);
      await this.page.click(saveDestinationButtonSelector);
      await this.expectElementToBeVisible(saveDestinationButtonSelector, false);
    }

    if (directToCardWhenStuck) {
      await this.clickOnElementWithSelector(outcomeDestWhenStuckSelector);
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.select(destinationWhenStuckSelectorDropdown, '4: /');
      await this.typeInInputField(
        addDestinationStateWhenStuckInput,
        directToCardWhenStuck
      );
      await this.page.click(saveStuckDestinationButtonSelector);
      await this.expectElementToBeVisible(
        saveStuckDestinationButtonSelector,
        false
      );
    }
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
   * Function to navigate to exploration editor.
   */
  async navigateToExplorationEditorPage(): Promise<void> {
    await this.clickAndWaitForNavigation(createExplorationButtonSelector, true);
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
   * This function updates the answers in the response modal.
   * @param {INTERACTION_TYPES} interactionType - The type of the interaction.
   * @param {string} answer - The answer to set in the response modal.
   */
  async updateAnswersInResponseModal(
    interactionType: INTERACTION_TYPES,
    answer: string
  ): Promise<void> {
    switch (interactionType) {
      case INTERACTION_TYPES.NUMBER_INPUT:
        await this.waitForElementToStabilize(
          `${responseModalBodySelector} ${floatFormInput}`
        );
        await this.typeInInputField(
          `${responseModalBodySelector} ${floatFormInput}`,
          answer
        );
        break;
      case INTERACTION_TYPES.MULTIPLE_CHOICE:
        await this.page.waitForSelector(multipleChoiceResponseDropdown, {
          state: 'visible',
          timeout: 5000,
        });
        await this.clickOnElementWithSelector(multipleChoiceResponseDropdown);
        await this.page.waitForSelector(multipleChoiceResponseOption, {
          state: 'visible',
        });

        await this.page.evaluate(
          ({
            answer,
            multipleChoiceResponseOption,
          }: {
            answer: string;
            multipleChoiceResponseOption: string;
          }) => {
            const optionElements = Array.from(
              document.querySelectorAll(multipleChoiceResponseOption)
            );
            const element = optionElements.find(
              el => el.textContent?.trim() === answer
            ) as HTMLElement;
            if (element) {
              element.click();
            } else {
              throw new Error(`Cannot find "${answer}" in options.`);
            }
          },
          {answer, multipleChoiceResponseOption}
        );
        break;
      case INTERACTION_TYPES.TEXT_INPUT:
        await this.page.waitForSelector(responseModalBodySelector, {
          state: 'visible',
        });
        await this.clickOnElementWithSelector(addResponseOptionButton);
        await this.page.waitForSelector(textInputInteractionOption);
        await this.page.type(textInputInteractionOption, answer);
        break;
      case INTERACTION_TYPES.FRACTION_INPUT:
        await this.page.waitForSelector(intEditorField, {
          state: 'visible',
        });
        await this.clearAllTextFrom(intEditorField);
        await this.typeInInputField(intEditorField, answer);
        break;
      // Add cases for other interaction types here
      // case 'otherInteractionType':
      //   await this.type(otherFormInput, answer);
      //   break;
      default:
        throw new Error(`Unsupported interaction type: ${interactionType}`);
    }
  }

  /**
   * Function to update the default response feedback for a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   */
  async updateDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string
  ): Promise<void> {
    await this.page.waitForSelector(openOutcomeFeedBackEditor, {
      state: 'visible',
    });
    await this.clickOnElementWithSelector(openOutcomeFeedBackEditor);
    await this.clickOnElementWithSelector(stateContentInputField);
    await this.typeInInputField(
      stateContentInputField,
      defaultResponseFeedback
    );
    await this.clickOnElementWithSelector(saveOutcomeFeedbackButton);

    await this.page.waitForSelector(saveOutcomeDestButton, {
      state: 'hidden',
    });
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
