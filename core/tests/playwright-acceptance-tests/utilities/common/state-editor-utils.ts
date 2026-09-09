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
 * @fileoverview Utility class for state editor actions shared across
 * multiple user roles (e.g. ExplorationEditor, PracticeQuestionSubmitter).
 * Extracted here to avoid duplicate implementations of the same action
 * across user utility files. See issue #22539.
 */

import {BaseUser} from './playwright-utils';

const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const stateContentInputField = 'div.e2e-test-rte';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationSelectorDropdown = '.e2e-test-destination-selector-dropdown';
const saveDestinationButtonSelector = '.e2e-test-save-outcome-dest';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const outcomeDestWhenStuckSelector =
  '.protractor-test-open-outcome-dest-if-stuck-editor';
const destinationWhenStuckSelectorDropdown =
  '.e2e-test-destination-when-stuck-selector-dropdown';
const addDestinationStateWhenStuckInput = '.protractor-test-add-state-input';
const saveStuckDestinationButtonSelector = '.e2e-test-save-stuck-destination';

export class StateEditorUtils {
  userInstance: BaseUser;

  constructor(userInstance: BaseUser) {
    this.userInstance = userInstance;
  }

  /**
   * Function to add feedback for default responses of a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   * @param {string} [directToCard] - The card to direct to (optional).
   * @param {string} [directToCardWhenStuck] - The card to direct to when the learner is stuck (optional).
   */
  async editDefaultResponseFeedback(
    defaultResponseFeedback: string,
    directToCard?: string,
    directToCardWhenStuck?: string
  ): Promise<void> {
    await this.userInstance.clickOnElementWithSelector(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.updateDefaultResponseFeedbackInExplorationEditorPage(
        defaultResponseFeedback
      );
    }

    if (directToCard) {
      await this.userInstance.clickOnElementWithSelector(openOutcomeDestButton);
      await this.userInstance.select(destinationSelectorDropdown, directToCard);
      await this.userInstance.clickOnElementWithSelector(
        saveDestinationButtonSelector
      );
      await this.userInstance.expectElementToBeVisible(
        saveDestinationButtonSelector,
        false
      );
    }

    if (directToCardWhenStuck) {
      await this.userInstance.clickOnElementWithSelector(
        outcomeDestWhenStuckSelector
      );
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.userInstance.select(
        destinationWhenStuckSelectorDropdown,
        '4: /'
      );
      await this.userInstance.typeInInputField(
        addDestinationStateWhenStuckInput,
        directToCardWhenStuck
      );
      await this.userInstance.clickOnElementWithSelector(
        saveStuckDestinationButtonSelector
      );
      await this.userInstance.expectElementToBeVisible(
        saveStuckDestinationButtonSelector,
        false
      );
    }
  }

  /**
   * Function to update the default response feedback for a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   */
  async updateDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string
  ): Promise<void> {
    await this.userInstance.clickOnElementWithSelector(
      openOutcomeFeedBackEditor
    );
    await this.userInstance.clickOnElementWithSelector(stateContentInputField);
    await this.userInstance.typeInInputField(
      stateContentInputField,
      defaultResponseFeedback
    );
    await this.userInstance.clickOnElementWithSelector(
      saveOutcomeFeedbackButton
    );

    await this.userInstance.expectElementToBeVisible(
      saveOutcomeDestButton,
      false
    );
  }
}
