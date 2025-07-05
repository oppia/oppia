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

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const contributorDashboardUrl = testConstants.URLs.ContributorDashboard;
const imageToUpload = testConstants.data.curriculumAdminThumbnailImage;
const imageToUploadInQuestion = testConstants.data.profilePicture;

const submitQuestionTab = 'a.e2e-test-submitQuestionTab';
const opportunityHeadingTitlSelector =
  '.e2e-test-opportunity-list-item-heading';
const opportunitySubheadingTitle = '.e2e-test-opportunity-list-item-subheading';
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
const feedbackEditorButton =
  'div.oppia-edit-feedback .oppia-click-to-start-editing';
const addElementToTextInputInteraction = 'button.e2e-test-add-list-entry';
const skillDifficultyEasy = '.e2e-test-skill-difficulty-easy';
const skillDifficultyMedium = '.e2e-test-skill-difficulty-medium';
const skillDifficultyHard = '.e2e-test-skill-difficulty-hard';
const viewQuestionSudggestionModalHeader =
  '.e2e-test-question-suggestion-review-modal-header';
const questionSuggestionModalDifficultySelector = '.oppia-difficulty-title';
const questionDifficultySelectionModalSelector =
  '.e2e-test-question-opportunity-difficulty';

const LABEL_FOR_SAVE_DESTINATION_BUTTON = ' Save Destination ';

export class QuestionSubmitter extends BaseUser {
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
    await this.isElementVisible(submitQuestionTab);
    await this.clickOn(submitQuestionTab);
    await this.page.waitForSelector(opportunityListItem, {visible: true});
    const opportunityListItems = await this.page.$$(opportunityListItem);
    for (const item of opportunityListItems) {
      await item.waitForSelector(opportunityHeadingTitlSelector, {
        visible: true,
      });
      const headingElement = await item.$(opportunityHeadingTitlSelector);

      await item.waitForSelector(opportunitySubheadingTitle, {visible: true});
      const subheadingElement = await item.$(opportunitySubheadingTitle);

      if (!subheadingElement || !headingElement) {
        continue;
      }

      const subheading = await subheadingElement.evaluate(el =>
        el.textContent?.trim()
      );
      const heading = await headingElement.evaluate(el =>
        el.textContent?.trim()
      );

      if (subheading === topicName && heading === skillName) {
        const button = await item.$(suggestQuestionButton);
        await this.page.evaluate(button => {
          button.click();
        }, button);

        await this.isElementVisible(questionDifficultySelectionModalSelector);
        return;
      }
    }

    throw new Error(
      `No opportunity found for topic "${topicName}" and skill "${skillName}"`
    );
  }

  /**
   * Function to select the difficulty level of the question to be suggested.
   * @param {string} difficulty - The difficulty level of the question.
   */
  async selectQuestionDifficulty(difficulty: string = 'Medium'): Promise<void> {
    await this.isElementVisible(questionDifficultySelectionModalSelector);
    if (difficulty === 'Easy') {
      await this.clickOn(skillDifficultyEasy);
    } else if (difficulty === 'Medium') {
      await this.clickOn(skillDifficultyMedium);
    } else if (difficulty === 'Hard') {
      await this.clickOn(skillDifficultyHard);
    } else {
      throw new Error(`Invalid difficulty level: ${difficulty}`);
    }
    await this.clickOn(confirmSkillDificultyButton);

    await this.isElementVisible(confirmSkillDificultyButton, false);
  }

  /**
   * Function to seed text to the question.
   * @param {string} text - The text to be added to the question.
   */
  async seedTextToQuestion(text: string): Promise<void> {
    await this.isElementVisible(textStateEditSelector);
    await this.clickOn(textStateEditSelector);
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.clickOn(stateContentInputField);
    await this.type(stateContentInputField, text);
    await this.clickOn(saveStateEditorContentButton);

    await this.isElementVisible(saveStateEditorContentButton, false);
  }

  /**
   * Function to add a math expression to the question.
   */
  async addMathExpressionToQuestion(): Promise<void> {
    await this.isElementVisible(textStateEditSelector);
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

    await this.isElementVisible(saveStateEditorContentButton, false);
  }

  /**
   * Function to add an image to the question.
   */
  async addImageToQuestion(): Promise<void> {
    await this.isElementVisible(textStateEditSelector);
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

    await this.isElementVisible(saveStateEditorContentButton);
  }

  /**
   * Function to add a hint to the current state card.
   * @param {string} hint - The hint to be added to the current state card.
   */
  async addHintToState(hint: string): Promise<void> {
    await this.isElementVisible(addHintButton);
    await this.clickOn(addHintButton);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintButton);

    await this.isElementVisible(saveHintButton, false);
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
    await this.isElementVisible(addSolutionButton);
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

    await this.isElementVisible(submitSolutionButton, false);
  }

  /**
   * Function to submit the question suggestion.
   */
  async submitQuestionSuggestion(): Promise<void> {
    await this.isElementVisible(submitQuestionButon);
    await this.clickOn(submitQuestionButon);

    this.isElementVisible(submitQuestionButon, false);
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
        const button = await item.$(suggestQuestionButton);
        await this.page.evaluate(button => {
          button.click();
        }, button);

        await item.waitForSelector(suggestQuestionButton, {hidden: true});
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
  async addMultipleChoiceInteraction(options: string[]): Promise<void> {
    await this.isElementVisible(addInteractionButton);
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

    await this.waitForElementToBeClickable(feedbackEditorButton);
    await this.clickOn(feedbackEditorButton);
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.type(stateContentInputField, 'Last Card');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);

    await this.isElementVisible(addNewResponseButton, false);
    showMessage('Multiple Choice interaction has been added successfully.');
  }

  /**
   * Add a text input interaction to the card.
   */
  async addTextInputInteraction(answer: string): Promise<void> {
    await this.isElementVisible(addInteractionButton);
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

    await this.waitForElementToBeClickable(feedbackEditorButton);
    await this.clickOn(feedbackEditorButton);
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.type(stateContentInputField, 'Last Card');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);

    await this.isElementVisible(addNewResponseButton, false);
    showMessage('Text input interaction has been added successfully.');
  }

  /**
   * Adds a math interaction to the current exploration.
   * @param {string} interactionToAdd - The interaction type to add to the exploration.
   */
  async addMathInteraction(interactionToAdd: string): Promise<void> {
    await this.isElementVisible(addInteractionButton);
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
   * Adds an Image interaction to the current exploration.
   */
  async addImageInteraction(): Promise<void> {
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

    await this.waitForElementToBeClickable(feedbackEditorButton);
    await this.clickOn(feedbackEditorButton);
    await this.page.waitForSelector(addAnswerGroupComponentSelector, {
      visible: true,
    });
    await this.page.waitForSelector(stateContentInputField, {visible: true});
    await this.type(stateContentInputField, 'Last Card');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);

    await this.isElementVisible(addNewResponseButton, false);
    showMessage('Image interaction has been added successfully.');
  }

  // TODO (#22539): This function has a duplicate in exploration-editor.ts.
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
    }

    if (directToCard) {
      await this.clickOn(openOutcomeDestButton);
      await this.page.select(destinationSelectorDropdown, directToCard);
      await this.clickOn(LABEL_FOR_SAVE_DESTINATION_BUTTON);
    }

    if (directToCardWhenStuck) {
      await this.clickOn(outcomeDestWhenStuckSelector);
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.select(destinationWhenStuckSelectorDropdown, '4: /');
      await this.type(addDestinationStateWhenStuckInput, directToCardWhenStuck);
      await this.clickOn(LABEL_FOR_SAVE_DESTINATION_BUTTON);
    }
  }
}

export let QuestionSubmitterFactory = (): QuestionSubmitter =>
  new QuestionSubmitter();
