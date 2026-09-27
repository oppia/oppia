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
 * @fileoverview Practice question submitter users utility file.
 */

import {Page, ElementHandle} from '@playwright/test';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {Contributor} from './contributor';

const contributorDashboardUrl = testConstants.URLs.ContributorDashboard;
const imageToUpload = testConstants.data.curriculumAdminThumbnailImage;
const imageToUploadInQuestion = testConstants.data.profilePicture;

const submitQuestionTab = 'a.e2e-test-submitQuestionTab';
const opportunityHeadingTitleSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunityListItem = '.e2e-test-opportunity-list-item';
const suggestQuestionButton = 'button.e2e-test-opportunity-list-item-button';
const confirmSkillDifficultyButton =
  'button.e2e-test-confirm-skill-difficulty-button';
const stateContentInputField = 'div.e2e-test-rte';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationSelectorDropdown = '.e2e-test-destination-selector-dropdown';
const destinationWhenStuckSelectorDropdown =
  '.e2e-test-destination-when-stuck-selector-dropdown';
const addDestinationStateWhenStuckInput = '.protractor-test-add-state-input';
const outcomeDestWhenStuckSelector =
  '.protractor-test-open-outcome-dest-if-stuck-editor';
const addInteractionModalSelector = 'customize-interaction-body-container';
const multipleChoiceInteractionButton =
  'div.e2e-test-interaction-tile-MultipleChoiceInput';
const addResponseOptionButton = 'button.e2e-test-add-list-entry';
const textInputInteractionButton = 'div.e2e-test-interaction-tile-TextInput';
const textInputField =
  '.e2e-test-schema-based-list-editor-table-data .e2e-test-text-input';
const uploadImageButton = '.e2e-test-upload-image';
const useTheUploadImageButton = '.e2e-test-use-image';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = 'button.e2e-test-add-new-response';
const imageRegionSelector = '.e2e-test-svg';
const textStateEditSelector = 'div.e2e-test-state-edit-content';
const imageButtonSelector = 'a.cke_button__oppiaimage[title="Insert image"]';
const mathButtonSelector =
  'a.cke_button__oppiamath[title="Insert mathematical formula"]';
const mathExpressionInputSelector = 'textarea[placeholder*="LaTeX"]';
const addAnswerGroupComponentSelector =
  'oppia-add-answer-group-modal-component';
const imageDescriptionTextInputSelector = 'textarea.e2e-test-description-box';
const closeRichTextEditorButton =
  'button.e2e-test-close-rich-text-component-editor';
const saveStateEditorContentButton = 'button.e2e-test-save-state-content';
const submitQuestionButton = '.e2e-test-save-question-button';
const editFeedbackButtonSelector =
  'div.oppia-edit-feedback .oppia-click-to-start-editing';
const editFeedbackButtonMobileSelector = '.e2e-test-open-feedback-editor';
const addElementToTextInputInteraction = 'button.e2e-test-add-list-entry';
const viewQuestionSuggestionModalHeader =
  '.e2e-test-question-suggestion-review-modal-header';
const questionSuggestionModalDifficultySelector = '.oppia-difficulty-title';
const questionDifficultySelectionModalSelector =
  '.e2e-test-question-opportunity-difficulty';
const saveDestinationButtonSelector = '.e2e-test-save-outcome-dest';
const saveStuckDestinationButtonSelector = '.e2e-test-save-stuck-destination';
const responseModalBodyClass = 'e2e-test-response-modal-body';
const imageRegionDeleteButtonSelector = '.btn-danger';
const imageRegionInteractionTileSelector =
  'xpath=//*[contains(normalize-space(text()), "Image Region")]';

export class PracticeQuestionSubmitter extends Contributor {
  /**
   * Function for navigating to the contributor dashboard page.
   */
  async navigateToContributorDashboard(): Promise<void> {
    await this.goto(contributorDashboardUrl);
  }

  /**
   * Returns the selector of the "edit feedback" button, based on the viewport.
   */
  private getEditFeedbackButtonSelector(): string {
    return this.isViewportAtMobileWidth()
      ? editFeedbackButtonMobileSelector
      : editFeedbackButtonSelector;
  }

  /**
   * Function to open the suggest questions modal and select a specific skill and topic.
   * @param {string} skillName - The name of the skill to suggest questions for.
   * @param {string} topicName - The name of the topic to suggest questions for.
   */
  async suggestQuestionsForSkillandTopic(
    skillName: string,
    topicName: string
  ): Promise<void> {
    await this.expectElementToBeVisible(submitQuestionTab);
    await this.clickOnElementWithSelector(submitQuestionTab);

    const questionElement = await this.expectOpportunityToBePresent(
      skillName,
      topicName
    );

    if (!questionElement) {
      throw new Error(
        `No opportunity found for topic "${topicName}" and skill "${skillName}"`
      );
    }

    const button = await questionElement.$(suggestQuestionButton);
    if (!button) {
      throw new Error('Suggest Question button not found.');
    }
    await this.clickOnElement(button);

    await this.expectElementToBeVisible(
      questionDifficultySelectionModalSelector
    );
  }

  /**
   * Function to select the difficulty level of the question to be suggested.
   * @param {string} difficulty - The difficulty level of the question.
   */
  async selectQuestionDifficultyInPracticeQuestionSubmittion(
    // TODO(#23370): The difficulty is currently unused. Use it to select
    // the difficulty once the difficulty selector is visible.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
  ): Promise<void> {
    await this.expectElementToBeVisible(
      questionDifficultySelectionModalSelector
    );
    // TODO(#23370): Currently, the difficulty selector is not visible.
    // Uncomment the following line when the issue is fixed.
    // const skillDifficultySelector = `.e2e-test-skill-difficulty-${difficulty.toLocaleLowerCase()}`;
    // await this.clickOnElementWithSelector(skillDifficultySelector);
    await this.clickOnElementWithSelector(confirmSkillDifficultyButton);

    await this.expectElementToBeVisible(confirmSkillDifficultyButton, false);
  }

  /**
   * Function to seed text to the question.
   * @param {string} text - The text to be added to the question.
   */
  async seedTextToQuestion(text: string): Promise<void> {
    await this.expectElementToBeVisible(textStateEditSelector);
    await this.waitForElementToStabilize(textStateEditSelector);
    await this.clickOnElementWithSelector(textStateEditSelector);
    await this.expectElementToBeVisible(stateContentInputField);
    await this.waitForElementToStabilize(stateContentInputField);
    await this.typeInInputField(stateContentInputField, text);
    await this.clickOnElementWithSelector(saveStateEditorContentButton);

    await this.expectElementToBeVisible(saveStateEditorContentButton, false);
  }

  /**
   * Function to add a math expression to the question.
   */
  async addMathExpressionToQuestion(): Promise<void> {
    await this.expectElementToBeVisible(textStateEditSelector);
    await this.clickOnElementWithSelector(textStateEditSelector);
    await this.expectElementToBeVisible(stateContentInputField);
    await this.clickOnElementWithSelector(stateContentInputField);

    // The CKEditor toolbar buttons are not always clickable by mouse, so we
    // trigger the click through the DOM.
    const insertMathExpressionButton =
      await this.expectElementToBeAttachedInDOM(mathButtonSelector);
    await insertMathExpressionButton?.evaluate(button =>
      (button as HTMLElement).click()
    );

    await this.expectElementToBeVisible(mathExpressionInputSelector);
    await this.typeInInputField(mathExpressionInputSelector, '\\frac{1}{2}');

    await this.waitForElementToBeClickable(closeRichTextEditorButton);
    await this.clickOnElementWithSelector(closeRichTextEditorButton);
    await this.clickOnElementWithSelector(saveStateEditorContentButton);

    await this.expectElementToBeVisible(saveStateEditorContentButton, false);
  }

  /**
   * Function to add an image to the question.
   */
  async addImageToQuestion(): Promise<void> {
    await this.expectElementToBeVisible(textStateEditSelector);
    await this.clickOnElementWithSelector(textStateEditSelector);
    await this.expectElementToBeVisible(stateContentInputField);

    // The CKEditor toolbar buttons are not always clickable by mouse, so we
    // trigger the click through the DOM.
    const insertImageButton =
      await this.expectElementToBeAttachedInDOM(imageButtonSelector);
    await insertImageButton?.evaluate(button =>
      (button as HTMLElement).click()
    );

    await this.expectElementToBeVisible(uploadImageButton);
    await this.clickOnElementWithSelector(uploadImageButton);
    await this.uploadFile(imageToUploadInQuestion);
    await this.clickOnElementWithSelector(useTheUploadImageButton);
    await this.waitForPageToFullyLoad();
    await this.typeInInputField(
      imageDescriptionTextInputSelector,
      'Test Description'
    );

    await this.waitForElementToBeClickable(closeRichTextEditorButton);
    await this.clickOnElementWithSelector(closeRichTextEditorButton);
    await this.clickOnElementWithSelector(saveStateEditorContentButton);

    await this.expectElementToBeVisible(saveStateEditorContentButton, false);
  }

  /**
   * Function to submit the question suggestion.
   */
  async submitQuestionSuggestion(): Promise<void> {
    await this.expectElementToBeVisible(submitQuestionButton);
    await this.clickOnElementWithSelector(submitQuestionButton);

    await this.expectElementToBeVisible(submitQuestionButton, false);
  }

  /**
   * Function to find the opportunity with the given heading in the contributor dashboard.
   * @param {string} opportunityHeadingTitle - The heading of the opportunity.
   * @returns The opportunity list item, or null if it is not found.
   */
  private async findOpportunityWithHeadingInContributorDashboard(
    opportunityHeadingTitle: string
  ): Promise<ElementHandle<Element> | null> {
    await this.navigateToContributorDashboard();
    await this.expectElementToBeVisible(opportunityListItem);
    const opportunityListItems = await this.page.$$(opportunityListItem);
    for (const item of opportunityListItems) {
      const headingElement = await item.waitForSelector(
        opportunityHeadingTitleSelector,
        {state: 'visible'}
      );
      const heading = await headingElement.evaluate(el =>
        el.textContent?.trim()
      );

      if (heading === opportunityHeadingTitle) {
        return item;
      }
    }
    return null;
  }

  /**
   * Function to expect the question suggestion to be in the contributor dashboard.
   * @param {string} opportunityHeadingTitle - The heading of the opportunity to be found in the contributor dashboard.
   */
  async expectQuestionSuggestionInContributorDashboard(
    opportunityHeadingTitle: string
  ): Promise<void> {
    const item = await this.findOpportunityWithHeadingInContributorDashboard(
      opportunityHeadingTitle
    );
    if (!item) {
      throw new Error(
        `No opportunity found for heading "${opportunityHeadingTitle}"`
      );
    }
    showMessage(
      `Question suggestion "${opportunityHeadingTitle}" is present in the contributor dashboard.`
    );
  }

  /**
   * Function to view the question suggestion in the contributor dashboard.
   * @param {string} opportunityHeadingTitle - The heading of the opportunity to be found in the contributor dashboard.
   */
  async viewQuestionSuggestion(opportunityHeadingTitle: string): Promise<void> {
    const item = await this.findOpportunityWithHeadingInContributorDashboard(
      opportunityHeadingTitle
    );
    if (!item) {
      throw new Error(
        `No opportunity found for heading "${opportunityHeadingTitle}"`
      );
    }

    const button = await item.waitForSelector(suggestQuestionButton);
    await this.clickOnElement(button);

    await this.expectQuestionInReviewModalToBe(opportunityHeadingTitle);
  }

  /**
   * Function to expect the question suggestion modal to have a specific difficulty level.
   * @param {string} difficulty - The expected difficulty.
   */
  async expectQuestionSuggestionModalToHaveDifficulty(
    difficulty: string
  ): Promise<void> {
    await this.expectElementToBeVisible(viewQuestionSuggestionModalHeader);
    await this.expectTextContentToBe(
      questionSuggestionModalDifficultySelector,
      `Selected Difficulty: ${difficulty}`
    );
  }

  /**
   * Fills the "Last Card" feedback, marks the answer group as correct and
   * saves the new response.
   */
  private async saveCorrectAnswerGroupWithLastCardFeedback(): Promise<void> {
    await this.expectElementToBeVisible(stateContentInputField);
    await this.typeInInputField(stateContentInputField, 'Last Card');
    await this.clickOnElementWithSelector(correctAnswerInTheGroupSelector);
    await this.clickOnElementWithSelector(addNewResponseButton);

    await this.expectElementToBeVisible(addNewResponseButton, false);
  }

  /**
   * Function to add a multiple choice interaction to the question.
   * Any number of options can be added to the multiple choice interaction
   * using the options array.
   * @param {string[]} options - The options to be added to the multiple choice interaction.
   */
  async addMultipleChoiceInteractionByQuestionSubmitter(
    options: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);
    await this.clickOnElementWithSelector(addInteractionButton);
    await this.expectElementToBeVisible(multipleChoiceInteractionButton);
    await this.clickOnElementWithSelector(multipleChoiceInteractionButton);

    for (let i = 0; i < options.length - 1; i++) {
      await this.expectElementToBeVisible(addResponseOptionButton);
      await this.clickOnElementWithSelector(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(`${options[i]}`);
    }

    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectElementToBeVisible(addInteractionModalSelector, false);

    const editFeedbackSelector = this.getEditFeedbackButtonSelector();
    await this.waitForElementToStabilize(editFeedbackSelector);
    await this.clickOnElementWithSelector(editFeedbackSelector);
    await this.saveCorrectAnswerGroupWithLastCardFeedback();
    showMessage('Multiple Choice interaction has been added successfully.');
  }

  /**
   * Add a text input interaction to the card.
   * @param {string} answer - The answer to be added to the text input interaction.
   */
  async addTextInputInteractionInQuestionEditor(answer: string): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);
    await this.clickOnElementWithSelector(addInteractionButton);
    await this.expectElementToBeVisible(textInputInteractionButton);
    await this.clickOnElementWithSelector(textInputInteractionButton);
    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectElementToBeVisible(addInteractionModalSelector, false);
    await this.waitForNetworkIdle();

    await this.clickOnElementWithSelector(addElementToTextInputInteraction);
    await this.expectElementToBeVisible(textInputField);
    await this.typeInInputField(textInputField, answer);

    const editFeedbackSelector = this.getEditFeedbackButtonSelector();
    await this.waitForElementToBeClickable(editFeedbackSelector);
    await this.clickOnElementWithSelector(editFeedbackSelector);
    await this.saveCorrectAnswerGroupWithLastCardFeedback();
    showMessage('Text input interaction has been added successfully.');
  }

  /**
   * Adds response details in the question response modal.
   * @param {string} feedback - The feedback for the response.
   * @param {boolean} correctResponse - Whether the response is correct.
   */
  async addResponseDetailsInQuestionResponseModal(
    feedback: string,
    correctResponse: boolean = true
  ): Promise<void> {
    const editFeedbackSelector = this.getEditFeedbackButtonSelector();
    await this.waitForElementToBeClickable(editFeedbackSelector);
    await this.clickOnElementWithSelector(editFeedbackSelector);

    await this.typeInInputField(stateContentInputField, feedback);
    if (correctResponse) {
      await this.clickOnElementWithSelector(correctAnswerInTheGroupSelector);
    }
    await this.clickOnElementWithSelector(addNewResponseButton);

    await this.expectElementToBeVisible(addNewResponseButton, false);
  }

  /**
   * Adds an Image Region interaction to the question.
   */
  async addImageInteractionInQuestionEditor(): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);
    await this.clickOnElementWithSelector(addInteractionButton);
    // The interaction tiles may take a while to render.
    await this.expectElementToBeVisible(
      imageRegionInteractionTileSelector,
      true,
      this.page,
      60000
    );
    await this.clickOnElementWithSelector(imageRegionInteractionTileSelector);
    await this.clickOnElementWithSelector(uploadImageButton);
    await this.uploadFile(imageToUpload);
    await this.clickOnElementWithSelector(useTheUploadImageButton);
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(imageRegionDeleteButtonSelector);

    // Select the central 50% area of the image by clicking and dragging from
    // 25% to 75% of the image (both horizontally and vertically).
    const imageElement =
      await this.expectElementToBeVisible(imageRegionSelector);
    const box = await imageElement?.boundingBox();
    if (!box) {
      throw new Error('Unable to get bounding box for image element.');
    }
    const startX = box.x + box.width * 0.25;
    const startY = box.y + box.height * 0.25;
    const endX = box.x + box.width * 0.75;
    const endY = box.y + box.height * 0.75;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    // Add steps for smooth dragging.
    await this.page.mouse.move(endX, endY, {steps: 10});
    await this.page.mouse.up();

    await this.clickOnElementWithSelector(saveInteractionButton);
    await this.expectElementToBeVisible(addInteractionModalSelector, false);

    await this.clickOnElementWithSelector(this.getEditFeedbackButtonSelector());
    await this.expectElementToBeVisible(addAnswerGroupComponentSelector);
    await this.saveCorrectAnswerGroupWithLastCardFeedback();
    showMessage('Image interaction has been added successfully.');
  }

  // TODO(#22539): This function has a duplicate in exploration-editor.ts.
  // To avoid unexpected behavior, ensure that any modifications here are also
  // made in editDefaultResponseFeedbackInExplorationEditorPage() in exploration-editor.ts.
  /**
   * Function to add feedback for default responses of a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   * @param {string} [directToCard] - The card to direct to (optional).
   * @param {string} [directToCardWhenStuck] - The card to direct to when the learner is stuck (optional).
   */
  async editDefaultResponseFeedbackInQuestionEditorPage(
    defaultResponseFeedback: string,
    directToCard?: string,
    directToCardWhenStuck?: string
  ): Promise<void> {
    await this.clickOnElementWithSelector(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.clickOnElementWithSelector(openOutcomeFeedBackEditor);
      await this.clickOnElementWithSelector(stateContentInputField);
      await this.typeInInputField(
        stateContentInputField,
        `${defaultResponseFeedback}`
      );
      await this.clickOnElementWithSelector(saveOutcomeFeedbackButton);
      await this.expectElementToBeVisible(saveOutcomeFeedbackButton, false);
    }

    if (directToCard) {
      await this.clickOnElementWithSelector(openOutcomeDestButton);
      await this.select(destinationSelectorDropdown, directToCard);
      await this.clickOnElementWithSelector(saveDestinationButtonSelector);
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
      await this.clickOnElementWithSelector(saveStuckDestinationButtonSelector);
      await this.expectElementToBeVisible(
        saveStuckDestinationButtonSelector,
        false
      );
    }
  }

  /**
   * Fills the value in the input field in the response modal.
   * @param {string} value - The value to fill.
   * @param {'input' | 'textarea'} inputType - The type of the input field.
   * @param {number} index - The index of the input field.
   */
  async fillValueInInteractionResponseModal(
    value: string,
    inputType: 'input' | 'textarea',
    index: number = 0
  ): Promise<void> {
    const xpath = `//div[contains(@class, '${responseModalBodyClass}')]//${inputType}[${index + 1}]`;
    const inputElement = await this.expectElementToBeVisible(`xpath=${xpath}`);
    if (!inputElement) {
      throw new Error(`Input element not found for selector ${xpath}`);
    }

    await this.waitForElementToStabilize(inputElement);
    await inputElement.click({clickCount: 3});
    await inputElement.type(value);

    await this.expectElementValueToBe(inputElement, value);
  }

  /**
   * This is a composite function that starts a question suggestion and completes it.
   * @param {string} skill - The skill to suggest questions for.
   * @param {string} topic - The topic to suggest questions for.
   * @param {string} question - The question to be added.
   * @param {string[]} [multipleChoiceOptions] - The options to be added to the multiple choice interaction.
   * @param {'Easy' | 'Medium' | 'Hard'} [difficulty] - The difficulty level of the question.
   * @param {string} [defaultResponseFeedback] - The feedback for the default responses.
   * @param {string} [hint] - The hint to be added to the current state card.
   */
  async startAndCompleteQuestionSuggestion(
    skill: string,
    topic: string,
    question: string,
    multipleChoiceOptions?: string[],
    difficulty?: 'Easy' | 'Medium' | 'Hard',
    defaultResponseFeedback?: string,
    hint?: string
  ): Promise<void> {
    await this.suggestQuestionsForSkillandTopic(skill, topic);
    await this.selectQuestionDifficultyInPracticeQuestionSubmittion(
      difficulty ?? 'Medium'
    );
    await this.seedTextToQuestion(question);
    await this.addMultipleChoiceInteractionByQuestionSubmitter(
      multipleChoiceOptions ?? ['5', '-1', '6', '1.5']
    );
    await this.editDefaultResponseFeedbackInQuestionEditorPage(
      defaultResponseFeedback ?? 'Wrong Answer'
    );
    await this.addHintToState(
      hint ??
        'If you have 2 apples and someone gives you 3 apples, how many apples do you have?'
    );
    await this.submitQuestionSuggestion();
    await this.expectToastMessage('Submitted question for review.');
  }

  /**
   * Clicks on the view button in the submitted question.
   * @param {string} question - The question to view.
   * @param {string} skill - The skill the question belongs to.
   */
  async viewSubmittedQuestion(question: string, skill: string): Promise<void> {
    const questionElement = await this.expectOpportunityToBePresent(
      question,
      skill
    );

    if (!questionElement) {
      throw new Error(`Opportunity item for question ${question} not found.`);
    }

    if (this.isViewportAtMobileWidth()) {
      await this.clickOnElement(questionElement);
    } else {
      const viewButton = await questionElement.waitForSelector(
        suggestQuestionButton
      );
      await this.clickOnElement(viewButton);
    }
    await this.expectElementToBeVisible(viewQuestionSuggestionModalHeader);
  }
}

export const PracticeQuestionSubmitterFactory = (
  page: Page
): PracticeQuestionSubmitter => {
  return new PracticeQuestionSubmitter(page);
};
