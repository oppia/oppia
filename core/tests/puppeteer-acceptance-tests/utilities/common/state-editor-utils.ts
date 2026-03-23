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
 * @fileoverview Utility module for common State Editor actions.
 */

import {BaseUser} from './puppeteer-utils';

const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const addInteractionModalSelector = 'customize-interaction-body-container';
const richTextEditorWrapperSelector = 'oppia-ck-editor-wrapper';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const defaultResponseFeedbackInput = 'oppia-rte-editor';
const saveDefaultResponseFeedbackButton =
  'button.e2e-test-save-default-response-feedback';
const defaultResponseTab = 'div.e2e-test-default-response-tab';
const addResponseButton = 'button.e2e-test-open-add-response-modal';
const answerInputSelector = '.e2e-test-answer-input';
const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const stateContentInputField = '.e2e-test-state-content-editor';
const saveHintButton = 'button.e2e-test-save-hint';
const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const solutionInputNumeric = 'oppia-add-or-update-solution-modal input';
const solutionInputTextArea = 'textarea.e2e-test-html-select-selector';
const submitAnswerButton = 'button.e2e-test-submit-answer-button';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';

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

enum INTERACTION_TABS {
  PROGRAMMING = 'PROGRAMMING',
  MATHS = 'MATHS',
  MUSIC = 'MUSIC',
  GEOGRAPHY = 'GEOGRAPHY',
}

const INTERACTION_TABS_SELECTORS: Record<string, string> = {
  [INTERACTION_TABS.PROGRAMMING]: '.e2e-test-interaction-tab-programming',
  [INTERACTION_TABS.MATHS]: '.e2e-test-interaction-tab-math',
  [INTERACTION_TABS.GEOGRAPHY]: '.e2e-test-interaction-tab-geography',
  [INTERACTION_TABS.MUSIC]: '.e2e-test-interaction-tab-music',
};

export class StateEditorUtils {
  private user: BaseUser;

  constructor(user: BaseUser) {
    this.user = user;
  }

  async changeTabInInteractionSelectionModal(
    interactionType: INTERACTION_TYPES | string
  ): Promise<void> {
    const interactionTabs: Record<string, string[]> = {
      [INTERACTION_TABS.PROGRAMMING]: [
        INTERACTION_TYPES.CODE_EDITOR,
        INTERACTION_TYPES.PENCIL_CODE_EDITOR,
      ],
      [INTERACTION_TABS.MATHS]: [
        INTERACTION_TYPES.FRACTION_INPUT,
        INTERACTION_TYPES.GRAPH_THEORY,
        INTERACTION_TYPES.NUMBER_INPUT,
        INTERACTION_TYPES.SET_INPUT,
        INTERACTION_TYPES.NUMERIC_EXPRESSION,
        INTERACTION_TYPES.ALGEBRAIC_EXPRESSION,
        INTERACTION_TYPES.MATH_EQUATION,
        INTERACTION_TYPES.NUMBER_WITH_UNITS,
        INTERACTION_TYPES.RATIO_EXPRESSION_INPUT,
      ],
      [INTERACTION_TABS.GEOGRAPHY]: [INTERACTION_TYPES.WORLD_MAP],
      [INTERACTION_TABS.MUSIC]: [INTERACTION_TYPES.MUSIC_NOTES_INPUT],
    };

    for (const interaction in interactionTabs) {
      if (interactionTabs[interaction].includes(interactionType as string)) {
        await this.user.waitForElementToStabilize(
          INTERACTION_TABS_SELECTORS[interaction]
        );
        await this.user.clickOnElementWithSelector(
          INTERACTION_TABS_SELECTORS[interaction]
        );
      }
    }
  }

  async addInteraction(
    interactionToAdd: string,
    skipInteractionCustoization: boolean = true
  ): Promise<void> {
    await this.user.expectElementToBeVisible(addInteractionButton);
    await this.user.clickOnElementWithSelector(addInteractionButton);

    await this.changeTabInInteractionSelectionModal(interactionToAdd);

    await this.user.waitForNetworkIdle();
    await this.user.clickOnElementWithText(` ${interactionToAdd} `);

    if (skipInteractionCustoization) {
      // Some interactions (like Continue Button) do not render the customization
      // container, so we just wait for the Save button to be actionable.
      await this.user.page.waitForSelector(saveInteractionButton, {
        visible: true,
      });
      await this.user.clickOnElementWithSelector(saveInteractionButton);
      const interactiveModalSelector = `[class$="${addInteractionModalSelector}"]`;
      await this.user.page.waitForSelector(interactiveModalSelector, {
        hidden: true,
      });
    }
  }

  async addMathInteraction(interactionToAdd: string): Promise<void> {
    await this.user.expectElementToBeVisible(addInteractionButton);
    await this.user.clickOnElementWithSelector(addInteractionButton);

    const mathTabSelector = '.e2e-test-interaction-tab-math';
    await this.user.page.waitForSelector(mathTabSelector, {visible: true});
    await this.user.clickOnElementWithSelector(mathTabSelector);

    await this.user.clickOnElementWithText(` ${interactionToAdd} `);

    await this.user.page.waitForSelector(saveInteractionButton, {
      visible: true,
    });
    await this.user.clickOnElementWithSelector(saveInteractionButton);
    const interactiveModalSelector = `[class$="${addInteractionModalSelector}"]`;
    await this.user.page.waitForSelector(interactiveModalSelector, {
      hidden: true,
    });
  }

  async editDefaultResponseFeedback(
    feedback: string,
    isOptional: boolean = false
  ): Promise<void> {
    if (isOptional) {
      try {
        await this.user.page.waitForSelector(defaultResponseTab, {
          visible: true,
          timeout: 5000,
        });
      } catch (error) {
        return;
      }
    } else {
      await this.user.page.waitForSelector(defaultResponseTab, {
        visible: true,
      });
    }

    await this.user.clickOnElementWithSelector(defaultResponseTab);
    const feedbackInputSelector = `${defaultResponseTab} ${defaultResponseFeedbackInput}`;

    await this.user.page.waitForSelector(feedbackInputSelector, {
      visible: true,
    });
    await this.user.clearAllTextFrom(feedbackInputSelector);
    await this.user.typeInInputField(feedbackInputSelector, feedback);
    await this.user.clickOnElementWithSelector(
      saveDefaultResponseFeedbackButton
    );

    await this.user.page.waitForSelector(saveDefaultResponseFeedbackButton, {
      hidden: true,
    });
  }

  async addHintToState(hint: string): Promise<void> {
    await this.user.page.waitForSelector(addHintButton, {visible: true});
    await this.user.clickOnElementWithSelector(addHintButton);
    const hintInputField = '.e2e-test-hint-text .e2e-test-rte';
    await this.user.typeInInputField(hintInputField, hint);
    await this.user.clickOnElementWithSelector(saveHintButton);
    await this.user.page.waitForSelector(saveHintButton, {hidden: true});
  }

  async addSolutionToState(
    answer: string,
    answerExplanation: string,
    isSolutionNumericInput: boolean
  ): Promise<void> {
    const solutionSelector = isSolutionNumericInput
      ? solutionInputNumeric
      : solutionInputTextArea;
    await this.user.page.waitForSelector(addSolutionButton, {visible: true});
    await this.user.clickOnElementWithSelector(addSolutionButton);
    await this.user.page.waitForSelector(solutionSelector, {visible: true});
    await this.user.typeInInputField(solutionSelector, answer);
    await this.user.page.waitForSelector(
      `${submitAnswerButton}:not([disabled])`
    );
    await this.user.clickOnElementWithSelector(submitAnswerButton);
    const solutionExplanationInputField =
      'oppia-add-or-update-solution-modal .e2e-test-rte';
    await this.user.typeInInputField(
      solutionExplanationInputField,
      answerExplanation
    );
    await this.user.page.waitForSelector(
      `${submitSolutionButton}:not([disabled])`
    );
    await this.user.clickOnElementWithSelector(submitSolutionButton);
    await this.user.page.waitForSelector(submitSolutionButton, {hidden: true});
  }
}
