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
 * @fileoverview Question Submitters utility file.
 */

import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {Contributor} from './contributor';

const contributorDashboardUrl = testConstants.URLs.ContributorDashboard;
const imageToUpload = testConstants.data.curriculumAdminThumbnailImage;
const imageToUploadInQuestion = testConstants.data.profilePicture;

const submitQuestionTab = 'a.e2e-test-submitQuestionTab';
const opportunityHeadingTitlSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunityListItem = '.e2e-test-opportunity-list-item';
const suggestQuestionButton = 'button.e2e-test-opportunity-list-item-button';
const confirmSkillDificultyButton =
  'button.e2e-test-confirm-skill-difficulty-button';
const stateContentInputField = 'div.e2e-test-rte';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const mathInteractionsTab = '.e2e-test-interaction-tab-math';

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
const addAnswerGroupComponentSelector =
  'oppia-add-answer-group-modal-component';
const imageDescriptionTextInputSelector = 'textarea.e2e-test-description-box';
const closeRichTextEditorButton =
  'button.e2e-test-close-rich-text-component-editor';
const saveStateEditorContentButton = 'button.e2e-test-save-state-content';
const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';
const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const solutionInputNumeric = 'oppia-add-or-update-solution-modal input';
const solutionInputTextArea =
  '.e2e-test-interaction-html textarea.e2e-test-description-box';
const submitQuestionButon = '.e2e-test-save-question-button';
const editFeedbackButtonSelector =
  'div.oppia-edit-feedback .oppia-click-to-start-editing';
const editFeedbackButtonMobileSelector = '.e2e-test-open-feedback-editor';
const addElementToTextInputInteraction = 'button.e2e-test-add-list-entry';
const viewQuestionSudggestionModalHeader =
  '.e2e-test-question-suggestion-review-modal-header';
const questionSuggestionModalDifficultySelector = '.oppia-difficulty-title';
const questionDifficultySelectionModalSelector =
  '.e2e-test-question-opportunity-difficulty';

const saveDestinationButtonSelector = '.e2e-test-save-outcome-dest';
const saveStuckDestinationButtonSelector = '.e2e-test-save-stuck-destination';
const responseModalBodyClass = 'e2e-test-response-modal-body';
const closeModalButtonSelector = '.e2e-test-close-modal-button';

export class PracticeQuestionSubmitter extends Contributor {
  /**
   * Function for navigating to the contributor dashboard admin page.
   */
  async navigateToContributorDashboard(): Promise<void> {
    await this.goto(contributorDashboardUrl);
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
    await this.clickOn(submitQuestionTab);

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
    await button.click();

    await this.expectElementToBeVisible(
      questionDifficultySelectionModalSelector
    );
  }

  /**
   * Function to select the difficulty level of the question to be suggested.
   * @param difficulty - The difficulty level of the question.
   */
  async selectQuestionDifficulty(
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
  ): Promise<void> {
    await this.expectElementToBeVisible(
      questionDifficultySelectionModalSelector
    );
    // TODO(#23370): Currently, the difficulty selector is not visible.
    // Uncomment the following line when the issue is fixed.
    // const skillDifficultySelector = `.e2e-test-skill-difficulty-${difficulty.toLocaleLowerCase()}`;
    // await this.clickOn(skillDifficultySelector);
    await this.clickOn(confirmSkillDificultyButton);

    await this.expectElementToBeVisible(confirmSkillDificultyButton, false);
  }

  /**
   * Function to seed text to the question.
   * @param {string} text - The text to be added to the question.
   */
  async seedTextToQuestion(text: string): Promise<void> {
    await this.expectElementToBeVisible(textStateEditSelector);
    await this.waitForElementToStabilize(textStateEditSelector);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.type(stateContentInputField, text);
    await this.waitForElementToStabilize(stateContentInputField);
    await this.clickOn(saveStateEditorContentButton);

    await this.expectElementToBeVisible(saveStateEditorContentButton, false);
  }

  /**
   * Function to add a math expression to the question.
   */
  async addMathExpressionToQuestion(): Promise<void> {
    await this.expectElementToBeVisible(textStateEditSelector);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.clickOn(stateContentInputField);
    const insertMathExpressionButton = await this.page.$(mathButtonSelector);
    await this.page.evaluate(
      (b: HTMLElement) => b.click(),
      insertMathExpressionButton
    );

    await this.page.waitForSelector('textarea[placeholder*="LaTeX"]', {
      visible: true,
    });
    await this.type('textarea[placeholder*="LaTeX"]', '\\frac{1}{2}');

    await this.waitForElementToBeClickable(closeRichTextEditorButton);
    await this.clickOn(closeRichTextEditorButton);
    await this.clickOn(saveStateEditorContentButton);

    await this.expectElementToBeVisible(saveStateEditorContentButton, false);
  }

  /**
   * Function to add an image to the question.
   */
  async addImageToQuestion(): Promise<void> {
    await this.expectElementToBeVisible(textStateEditSelector);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(stateContentInputField, {visible: true});

    const insertImageButton = await this.page.$(imageButtonSelector);
    await this.page.evaluate((b: HTMLElement) => b.click(), insertImageButton);

    await this.page.waitForSelector(uploadImageButton, {visible: true});
    await this.clickOn(uploadImageButton);
    await this.uploadFile(imageToUploadInQuestion);
    await this.clickOn(useTheUploadImageButton);
    await this.waitForPageToFullyLoad();
    await this.type(imageDescriptionTextInputSelector, 'Test Description');

    await this.waitForElementToBeClickable(closeRichTextEditorButton);
    await this.clickOn(closeRichTextEditorButton);
    await this.clickOn(saveStateEditorContentButton);

    await this.expectElementToBeVisible(saveStateEditorContentButton);
  }

  /**
   * Function to add a hint to the current state card.
   * @param {string} hint - The hint to be added to the current state card.
   */
  async addHintToState(hint: string): Promise<void> {
    await this.expectElementToBeVisible(addHintButton);
    await this.clickOn(addHintButton);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintButton);

    await this.expectElementToBeVisible(saveHintButton, false);
  }

  /**
   * Function to add a solution for a state interaction.
   * @param {string} answer - The solution of the current state card.
   * @param {string} answerExplanation - The explanation for this state card's solution.
   * @param {boolean} isSolutionNumericInput - Whether the solution is for a numeric input interaction.
   */
  async addSolutionToState(
    answer: string,
    answerExplanation: string,
    isSolutionNumericInput: boolean
  ): Promise<void> {
    await this.expectElementToBeVisible(addSolutionButton);
    await this.clickOn(addSolutionButton);

    const solutionSelector = isSolutionNumericInput
      ? solutionInputNumeric
      : solutionInputTextArea;
    await this.page.waitForSelector(solutionSelector, {visible: true});
    await this.type(solutionSelector, answer);
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOn(submitAnswerButton);
    await this.type(stateContentInputField, answerExplanation);
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);

    await this.expectElementToBeVisible(submitSolutionButton, false);
  }

  /**
   * Function to submit the question suggestion.
   */
  async submitQuestionSuggestion(): Promise<void> {
    await this.expectElementToBeVisible(submitQuestionButon);
    await this.clickOn(submitQuestionButon);

    await this.expectElementToBeVisible(submitQuestionButon, false);
  }

  /**
   * Function to expect the question suggestion to be in the contributor dashboard.
   * @param {string} opportunityHeadingTitle - The heading of the opportunity to be found in the contributor dashboard.
   */
  async expectQuestionSuggestionInContributorDashboard(
    opportunityHeadingTitle: string
  ): Promise<void> {
    await this.navigateToContributorDashboard();
    await this.page.waitForSelector(opportunityListItem, {visible: true});
    const opportunityListItems = await this.page.$$(opportunityListItem);
    for (const item of opportunityListItems) {
      await item.waitForSelector(opportunityHeadingTitlSelector, {
        visible: true,
      });
      const headingElement = await item.$(opportunityHeadingTitlSelector);

      if (!headingElement) {
        continue;
      }

      const heading = await headingElement.evaluate(el =>
        el.textContent?.trim()
      );

      if (heading === opportunityHeadingTitle) {
        return;
      }
    }

    throw new Error(
      `No opportunity found for heading "${opportunityHeadingTitle}"`
    );
  }

  /**
   * Function to view the question suggestion in the contributor dashboard.
   * @param {string} opportunityHeadingTitle - The heading of the opportunity to be found in the contributor dashboard.
   */
  async viewQuestionSuggestion(opportunityHeadingTitle: string): Promise<void> {
    await this.navigateToContributorDashboard();
    await this.page.waitForSelector(opportunityListItem, {visible: true});
    const opportunityListItems = await this.page.$$(opportunityListItem);
    for (const item of opportunityListItems) {
      await item.waitForSelector(opportunityHeadingTitlSelector, {
        visible: true,
      });
      const headingElement = await item.$(opportunityHeadingTitlSelector);

      if (!headingElement) {
        continue;
      }

      const heading = await headingElement.evaluate(el =>
        el.textContent?.trim()
      );

      if (heading === opportunityHeadingTitle) {
        const button = await item.waitForSelector(suggestQuestionButton);
        if (!button) {
          throw new Error('Suggest Question button not found.');
        }
        await button.click();

        await this.expectQuestionInReviewModalToBe(opportunityHeadingTitle);
        return;
      }
    }

    throw new Error(
      `No opportunity found for heading "${opportunityHeadingTitle}"`
    );
  }

  /**
   * Function to expect the question suggestion modal to have a specific difficulty level.
   */
  async expectQuestionSuggestionModalToHaveDifficulty(
    difficulty: string
  ): Promise<void> {
    await this.page.waitForSelector(viewQuestionSudggestionModalHeader, {
      visible: true,
    });

    const questionDifficulty = await this.page.$(
      questionSuggestionModalDifficultySelector
    );

    if (!questionDifficulty) {
      throw new Error('Difficulty element not found');
    }

    const difficultyText = await questionDifficulty.evaluate(el =>
      el.textContent?.trim()
    );

    if (difficultyText !== `Selected Difficulty: ${difficulty}`) {
      throw new Error(
        `Expected difficulty "${difficulty}", but found "${difficultyText}"`
      );
    }
  }

  /**
   * Function to add a multiple choice interaction to the exploration.
   * Any number of options can be added to the multiple choice interaction
   * using the options array.
   * @param {string[]} options - The options to be added to the multiple choice interaction.
   */
  async addMultipleChoiceInteractionByQuestionSubmitter(
    options: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(multipleChoiceInteractionButton, {
      visible: true,
    });
    await this.clickOn(multipleChoiceInteractionButton);

    for (let i = 0; i < options.length - 1; i++) {
      await this.page.waitForSelector(addResponseOptionButton, {visible: true});
      await this.clickOn(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(`${options[i]}`);
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });

    const editFeedbackSelector = this.isViewportAtMobileWidth()
      ? editFeedbackButtonMobileSelector
      : editFeedbackButtonSelector;

    await this.waitForElementToStabilize(editFeedbackSelector);
    await this.clickOn(editFeedbackSelector);
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.type(stateContentInputField, 'Last Card');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);

    await this.expectElementToBeVisible(addNewResponseButton, false);
    showMessage('Multiple Choice interaction has been added successfully.');
  }

  /**
   * Add a text input interaction to the card.
   * @param {string} answer - The answer to be added to the text input interaction.
   */
  async addTextInputInteractionInQuestionEditor(answer: string): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(textInputInteractionButton, {
      visible: true,
    });
    await this.clickOn(textInputInteractionButton);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    await this.waitForNetworkIdle();

    await this.clickOn(addElementToTextInputInteraction);
    await this.page.waitForSelector(textInputField, {visible: true});
    await this.type(textInputField, answer);

    const editFeedbackSelector = this.isViewportAtMobileWidth()
      ? editFeedbackButtonMobileSelector
      : editFeedbackButtonSelector;
    await this.waitForElementToBeClickable(editFeedbackSelector);
    await this.clickOn(editFeedbackSelector);
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.type(stateContentInputField, 'Last Card');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);

    await this.expectElementToBeVisible(addNewResponseButton, false);
    showMessage('Text input interaction has been added successfully.');
  }

  /**
   * Adds a math interaction to the current exploration.
   * @param {string} interactionToAdd - The interaction type to add to the exploration.
   */
  async addMathInteraction(interactionToAdd: string): Promise<void> {
    await this.expectElementToBeVisible(addInteractionButton);
    await this.clickOn(addInteractionButton);
    await this.clickOn(mathInteractionsTab);
    await this.clickOn(` ${interactionToAdd} `);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Adds response details in the question response modal.
   * @param feedback - The feedback for the response.
   * @param correctResponse - Whether the response is correct.
   */
  async addResponseDetailsInQuestionResponseModal(
    feedback: string,
    correctResponse: boolean = true
  ): Promise<void> {
    const editFeedbackSelector = this.isViewportAtMobileWidth()
      ? editFeedbackButtonMobileSelector
      : editFeedbackButtonSelector;

    await this.waitForElementToBeClickable(editFeedbackSelector);
    await this.clickOn(editFeedbackSelector);

    await this.type(stateContentInputField, feedback);
    if (correctResponse) {
      await this.clickOn(correctAnswerInTheGroupSelector);
    }
    await this.clickOn(addNewResponseButton);

    await this.expectElementToBeVisible(addNewResponseButton, false);
  }

  /**
   * Adds an Image interaction to the current exploration.
   */
  async addImageInteractionInQuestionEditor(): Promise<void> {
    await this.isElementVisible(addInteractionButton);

    await this.clickOn(addInteractionButton);
    await this.clickOn('Image Region');
    await this.clickOn(uploadImageButton);
    await this.uploadFile(imageToUpload);
    await this.clickOn(useTheUploadImageButton);
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector('.btn-danger', {visible: true});

    // Select area of image by clicking and dragging.
    const imageElement = await this.page.$(imageRegionSelector);

    if (imageElement) {
      const box = await imageElement.boundingBox();

      if (box) {
        // Calculate the start and end coordinates for a selection area. The selection starts from a point located at 25% from the top-left corner (both horizontally and vertically) and extends to a point located at 75% from the top-left corner (both horizontally and vertically).This effectively selects the central 50% area of the element.
        const startX = box.x + box.width * 0.25;
        const startY = box.y + box.height * 0.25;
        const endX = box.x + box.width * 0.75;
        const endY = box.y + box.height * 0.75;

        // Click and drag to select an area.
        await this.page.mouse.move(startX, startY);
        await this.page.mouse.down();

        // Add steps for smooth dragging.
        await this.page.mouse.move(endX, endY, {steps: 10});

        await this.page.mouse.up();
      } else {
        console.error('Unable to get bounding box for image element.');
      }
    } else {
      console.error('Image element not found.');
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });

    const editButtonSelector = this.isViewportAtMobileWidth()
      ? editFeedbackButtonMobileSelector
      : editFeedbackButtonSelector;
    await this.waitForElementToStabilize(editButtonSelector);
    await this.waitForElementToBeClickable(editButtonSelector);
    await this.clickOn(editButtonSelector);
    await this.page.waitForSelector(addAnswerGroupComponentSelector, {
      visible: true,
    });
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.type(stateContentInputField, 'Last Card');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);

    await this.expectElementToBeVisible(addNewResponseButton, false);
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
    await this.clickOn(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.clickOn(openOutcomeFeedBackEditor);
      await this.clickOn(stateContentInputField);
      await this.type(stateContentInputField, `${defaultResponseFeedback}`);
      await this.clickOn(saveOutcomeFeedbackButton);
      await this.expectElementToBeVisible(saveOutcomeFeedbackButton, false);
    }

    if (directToCard) {
      await this.clickOn(openOutcomeDestButton);
      await this.page.select(destinationSelectorDropdown, directToCard);
      await this.clickOn(saveDestinationButtonSelector);
      await this.expectElementToBeVisible(saveDestinationButtonSelector, false);
    }

    if (directToCardWhenStuck) {
      await this.clickOn(outcomeDestWhenStuckSelector);
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.select(destinationWhenStuckSelectorDropdown, '4: /');
      await this.type(addDestinationStateWhenStuckInput, directToCardWhenStuck);
      await this.clickOn(saveStuckDestinationButtonSelector);
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
    const xpath = `//div[contains(@class, '${responseModalBodyClass}')]//${inputType === 'textarea' ? 'textarea' : 'input'}[${index + 1}]`;
    const inputElement = await this.page.waitForXPath(xpath, {
      visible: true,
    });

    if (!inputElement) {
      throw new Error(`Input element not found for selector ${xpath}`);
    }

    await this.waitForElementToStabilize(inputElement);
    await inputElement.click({clickCount: 3});
    await inputElement.type(value);

    await this.page.waitForFunction(
      (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
        return element.value.trim() === value;
      },
      {},
      inputElement,
      value
    );
  }

  /**
   * This is a composite function that starts a question suggestion and completes it.
   * @param {string} [skill] - The skill to suggest questions for.
   * @param {string} [topic] - The topic to suggest questions for.
   * @param {'Easy' | 'Medium' | 'Hard'} [difficulty] - The difficulty level of the question.
   * @param {string} [question] - The question to be added to the question.
   * @param {string[]} [multipleChoiceOptions] - The options to be added to the multiple choice interaction.
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
    await this.selectQuestionDifficulty(difficulty ?? 'Medium');
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
      await questionElement.click();
    } else {
      const viewButton = await questionElement.waitForSelector(
        suggestQuestionButton
      );
      if (!viewButton) {
        throw new Error('View button not found.');
      }

      await viewButton.click();
    }
    await this.expectElementToBeVisible(viewQuestionSudggestionModalHeader);
  }

  /**
   * Closes the translation modal.
   */
  async closePracticeQuestionModal(): Promise<void> {
    await this.expectElementToBeVisible(closeModalButtonSelector);
    await this.clickOn(closeModalButtonSelector);

    // Verify that the modal is closed.
    await this.expectElementToBeVisible(closeModalButtonSelector, false);
  }
}

export let QuestionSubmitterFactory = (): PracticeQuestionSubmitter =>
  new PracticeQuestionSubmitter();
