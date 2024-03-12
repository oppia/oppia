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

import { BaseUser } from
  '../puppeteer-testing-utilities/puppeteer-utils';
import testConstants from
  '../puppeteer-testing-utilities/test-constants';
import { showMessage } from
  '../puppeteer-testing-utilities/show-message-utils';

const creatorDashboardAdminUrl =
  testConstants.URLs.CreatorDashboard;
const navigateToHistoryTabButton = '.e2e-test-history-tab';
const navigateToPreviewTabButton = '.e2e-test-preview-tab';
const navigateToSettingsTabButton = '.e2e-test-settings-tab';
const navigateToMainTabButton = '.e2e-test-main-tab';

// Elements in exploration creator.
const createExplorationButtonSelector = 'button.e2e-test-create-activity';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const stateEditSelector = 'div.e2e-test-state-edit-content';
const explorationTextInput = 'div.oppia-rte';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const endInteractionSelector = '.e2e-test-interaction-tile-EndExploration';
const numericInputSelector = '.e2e-test-interaction-tile-NumericInput';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const saveDraftButton = 'button.e2e-test-save-draft-button';
const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = '.e2e-test-add-new-response';
const floatFormInput = 'input.oppia-float-form-input';



// Revision property elements.
const revisionVersionNoSelector = '.e2e-history-table-index';
const revisionNoteSelector = '.e2e-test-history-table-message';
const revisionUsernameSelector = '.e2e-test-history-table-profile';
const revisionDateSelector = '.e2e-test-history-tab-commit-date';

// History tab elements.
const userNameEdit = 'input.e2e-history-filter-input';
const historyListItem = 'div.e2e-test-history-list-item';
const firstVersionDropdown = '.e2e-test-history-version-dropdown-first';
const secondVersionDropdown = '.e2e-test-history-version-dropdown-second';
const revertVersionButton = '.e2e-test-revert-version';
const downloadVersionButton = '.e2e-test-download-version';
const resetGraphButton = '.e2e-test-reset-graph';
const confirmRevertVersionButton = '.e2e-test-confirm-revert';
const paginatorToggler = '.mat-paginator-page-size-select';
const viewMatadataChangesButton = '.e2e-test-view-metadata-history';
const testNodeBackground = '.e2e-test-node';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const closeMetadataModal = '.e2e-test-close-history-metadata-modal';
const closeStateModal = '.e2e-test-close-history-state-modal';
const oppiaResponseSelector = '.oppia-click-to-start-editing';
const firstVersionOptionsButton = '#dropdownMenuButton-0';
const secondVersionOptionsButton = '#dropdownMenuButton-1';

// Preview tab elements.
const testContinueButton = '.e2e-test-continue-button';
const testFloatFormInput = '.e2e-test-float-form-input';
const nextCardButton = '.e2e-test-next-card-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const explorationRestartButton = '.e2e-preview-restart-button';
const explorationConversationContent = '.e2e-test-conversation-content';

// Settings tab elements.
const explorationTitleInput = '.e2e-test-exploration-title-input';
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
   * @param {string} text - The text in the Exploration.
   * @param {string} interaction - The interaction type in the Exploration.
   */
  async createExploration(text: string, interaction: string): Promise<void> {
    await this.clickOn(createExplorationButtonSelector);
    await this.page.waitForSelector(
      dismissWelcomeModalSelector, { visible: true });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForTimeout(300);
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(explorationTextInput, { visible: true });
    await this.page.type(explorationTextInput, `${text}`);
    await this.clickOn(saveContentButton);

    await this.page.waitForSelector(addInteractionButton);
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(endInteractionSelector, { visible: true });
    await this.clickOn(interaction);
    await this.clickOn(saveInteractionButton);
  }

  /**
   * Function to save an exploration draft.
   */
  async saveExplorationDraft(): Promise<void> {
    await this.clickOn(saveChangesButton);
    await this.page.waitForSelector(saveDraftButton, { visible: true });
    await this.page.waitForTimeout(500);
    await this.clickOn(saveDraftButton);
  }

  /**
   * Function to make metadata changes in the Exploration.
   * @param {string} title - The title of the Exploration.
   */
  async makeMetaDataChanges(title: string): Promise<void> {
    await this.page.waitForTimeout(200);
    await this.clickOn(navigateToSettingsTabButton);
    await this.page.waitForTimeout(200);
    await this.page.type(explorationTitleInput, title);
    await this.clickOn(navigateToMainTabButton);
  }

  /**
   * Function to create multiple revisions of the same Exploration.
   * @param {string} text - The text of the Exploration.
   * @param {number} numOfVersion - Number of versions to be created.
   */
  async createMultipleRevisionsOfTheSameExploration(
      text: string, numOfVersion: number): Promise<void> {
    await this.makeMetaDataChanges('changes');
    await this.saveExplorationDraft();
    await this.page.waitForTimeout(300);
    for (let i = 0; i < numOfVersion; i++) {
      await this.page.waitForSelector(stateEditSelector, { visible: true });
      await this.clickOn(stateEditSelector);
      await this.page.waitForSelector(explorationTextInput, { visible: true });
      await this.page.click(explorationTextInput, { clickCount: 3 });
      await this.page.keyboard.press('Backspace');
      await this.page.waitForTimeout(500);
      await this.page.type(explorationTextInput, `${text} ${i + 3}`);
      await this.clickOn(saveContentButton);
      await this.saveExplorationDraft();
    }
  }

  /**
   * Function to navigate to the History tab of the Exploration Editor.
   */
  async navigateToHistoryTab(): Promise<void> {
    await this.page.waitForTimeout(300);
    await this.clickOn(navigateToHistoryTabButton);
  }

  /**
   * Function to create a list of all the revisions created.
   * @param {string} versionsListSelector - Common selector for revisions.
   */

  async getRevisionsList(
      versionsListSelector: string
  ): Promise<{
    versionNo: string;
    notes: string;
    user: string;
    date: string;
  }[]> {
    let elements = await this.page.$$(versionsListSelector);
    let revisions: {
      versionNo: string; notes: string; user: string; date: string; }[] = [];
    for (let element of elements) {
      let versionNo = await element.$eval(
        revisionVersionNoSelector, async(el) => el.textContent);
      let notes = await element.$eval(
        revisionNoteSelector, async(el) => el.textContent);
      let user = await element.$eval(
        revisionUsernameSelector, async(el) => el.textContent);
      let date = await element.$eval(
        revisionDateSelector, async(el) => el.textContent);
      if (versionNo && notes && user && date) {
        revisions.push({ versionNo, notes, user, date });
      }
    }
    return revisions;
  }

  /**
   * Function to confirm the existence of the Version number, Notes, Username,
   * and Date for a given revision.
   */
  async expectlatestRevisionToHaveVersionNoNotesUsernameDate(): Promise<void> {
    await this.page.waitForTimeout(500);
    let element = await this.page.$(historyListItem);
    if (!element) {
      throw new Error('No revisions found');
    }
    let versionNo = await element.$eval(
      revisionVersionNoSelector, async(el) => el.textContent);
    let notes = await element.$eval(
      revisionNoteSelector, async(el) => el.textContent);
    let username = await element.$eval(
      revisionUsernameSelector, async(el) => el.textContent);
    let date = await element.$eval(
      revisionDateSelector, async(el) => el.textContent);
    if (!versionNo || typeof notes === 'undefined' || !username || !date) {
      throw new Error('The latest revision is missing one or more properties');
    }
    showMessage('The versions are not missing any properties');
  }

  /**
   * Function to verify whether the revisions are sorted by dates or not.
   */
  async expectRevisionsToBeOrderedByDate(): Promise<void> {
    let revisions = await this.getRevisionsList(historyListItem);
    for (let i = 0; i < revisions.length - 1; i++) {
      let date1 = new Date(revisions[i].date);
      let date2 = new Date(revisions[i + 1].date);
      if (date1 < date2) {
        throw new Error('Revisions are not sorted by date');
      }
    }
  }

  /**
   * Function to filter revisions by username.
   * @param {string} userName - The username to filter by.
   */
  async filterRevisionsByUsername(userName: string): Promise<void> {
    await this.page.type(userNameEdit, userName);
    await this.page.type(userNameEdit, '\u000d');
  }

  /**
   * Function to verify if the number of items per page adjusts according
   * to changes in the paginator settings.
   * @param {number} itemsPerPage - Number of items/revisions to show per page.
   */
  async ExpectPaginatorToChangeItemsPerPage(
      itemsPerPage: number): Promise<void> {
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector(paginatorToggler, { visible: true });
    await this.clickOn(paginatorToggler);
    await this.clickOn('#mat-option-1');

    await this.page.waitForTimeout(500);
    let revisions = await this.getRevisionsList(historyListItem);
    if (revisions.length !== itemsPerPage) {
      throw new Error(
        `Pagination Error: When the items per page is set to ${itemsPerPage},
        expected ${itemsPerPage} user revisions, but got ${revisions.length}`);
    } else {
      showMessage(
        `When the items per page is set to ${itemsPerPage}, 
        correctly shows ${itemsPerPage} user revisions.`);
    }
  }

  /**
   * Function for comparing different revisions.
   */
  async compareDifferentRevisions(): Promise<void> {
    await this.page.waitForSelector(firstVersionDropdown);
    await this.clickOn(firstVersionDropdown);
    await this.clickOn('#mat-option-1958');
    await this.page.waitForTimeout(300);
    await this.page.waitForSelector(secondVersionDropdown);
    await this.clickOn(secondVersionDropdown);
    await this.clickOn('#mat-option-1972');
  }

  /**
   * Function to check if modifications in the metadata are being reflected.
   */
  async expectCompareToDisplayMetadataChanges(): Promise<void> {
    await this.page.waitForTimeout(300);
    await this.clickOn(viewMatadataChangesButton);
    await this.page.waitForTimeout(300);
    const divContents = await this.page.$$eval(
      '.CodeMirror-code', divs => divs.map(div => div.textContent));
    if (divContents[0] !== divContents[1]) {
      showMessage('Metadata changes are reflected in the versions.');
    } else {
      throw new Error('No changes detected in the metadata.');
    }
    await this.clickOn(closeMetadataModal);
  }

  /**
   * Function to check if modifications in the exploration state are being
   * reflected or not.
   */
  async expectCompareToDisplayExplorationStateChanges(): Promise<void> {
    await this.page.waitForTimeout(400);
    await this.clickOn(testNodeBackground);
    await this.page.waitForTimeout(500);
    const divContent = await this.page.$$eval(
      '.CodeMirror-code', divs => divs.map(div => div.textContent));
    if (divContent[0] !== divContent[1]) {
      showMessage('State changes are reflected in the exploration.');
    } else {
      throw new Error('No changes detected in the exploration state.');
    }
    await this.clickOn(closeStateModal);
    await this.page.waitForSelector(resetGraphButton);
    await this.clickOn(resetGraphButton);
  }

  /**
   * Function downloads and reverts a version.
   * @param {number} version - revision version.
   * */
  async downloadAndRevertRevision(): Promise<void> {
    await this.page.waitForTimeout(1000);
    await this.clickOn(firstVersionOptionsButton);
    await this.page.waitForTimeout(1000);
    await this.page.waitForSelector(downloadVersionButton);
    await this.clickOn(downloadVersionButton);
    await this.page.waitForTimeout(1000);
    await this.clickOn(secondVersionOptionsButton);
    await this.page.waitForTimeout(1000);
    await this.clickOn(revertVersionButton);
    await this.page.click(confirmRevertVersionButton);
  }

  /**
   * Function verifies if a revision is reverting and downloading or not.
   */
  async expectSuccessfulReversionOfRevision(): Promise<void> {
    // This page takes 3-5 seconds to reload to reflect the reverted revision.
    await this.page.waitForTimeout(5000);
    await this.page.waitForSelector(historyListItem);
    let element = await this.page.$(historyListItem);
    if (element === null) {
      throw new Error('No Revisions found');
    }
    let notes = await element.$eval(
      revisionNoteSelector, async(el) => el.textContent);
    if (notes === null) {
      throw new Error('Revision does not contain a Note');
    }
    showMessage(notes);
    await this.page.waitForTimeout(500);
    if (notes === ' Reverted exploration to version 14 ') {
      showMessage('Revision is reverting successfully');
    } else {
      throw new Error('Revision is not reverting');
    }
  }

  /**
  * Function to create a new card in the exploration creator.
  * @param {string} cardName - name of the card created.
  */
  async createNewCard(cardName: string): Promise<void> {
    await this.clickOn(openOutcomeDestButton);
    await this.page.waitForTimeout(500);
    await this.page.select(destinationCardSelector, '/');
    await this.page.waitForSelector(addStateInput);
    await this.page.type(addStateInput, cardName);
    await this.clickOn(saveOutcomeDestButton);
  }

  /**
  * Function to open the next card in the exploration journey.
  * @param {number} cardNum - card number to switch to.
  */
  async goToNextCard(cardNum: number): Promise<void> {
    const selector = testNodeBackground;
    await this.page.waitForSelector(selector);
    const elements = await this.page.$$(selector);
    if (elements.length > cardNum) {
      await elements[cardNum].click();
    } else {
      throw new Error(
        `There are not enough elements to click on the ${cardNum}th element.`);
    }
  }

  /**
  * Function to create questions in the exploration card.
  * @param {string} question - question to be added.
  * @param {number} answer - answer of the question.
  */
  async loadCardWithQuestion(questionText: string, interaction: string):
    Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(explorationTextInput, { visible: true });
    await this.page.click(explorationTextInput, { clickCount: 3 });
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(500);
    await this.type(explorationTextInput, `${questionText}`);

    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(addInteractionButton, { visible: true });
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
    await this.page.waitForSelector(explorationTextInput, { visible: true });
    await this.type(explorationTextInput, 'correct');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);
  }

  /**
  * Function for creating an exploration containing questions
  * @param {string} text - text of the exploration.
  */
  async LoadExplorationWithQuestions(numQuestions: number): Promise<void> {
    await this.clickOn('.oppia-response-header');

    for (let i = 0; i < numQuestions; i++) {
      await this.createNewCard(`Question ${i + 1}`);
      await this.goToNextCard(i + 1);
      await this.loadCardWithQuestion(
        `mention a negative number greater than ${-100 - i}`,
        numericInputSelector);
      await this.addResponsesToTheInteraction(`${-99 - i}`);
    }

    await this.createNewCard('end');
    await this.goToNextCard(numQuestions + 1);
    await this.loadCardWithQuestion(
      'Exploration ends here', endInteractionSelector);
    await this.goToNextCard(0);

    await this.saveExplorationDraft();
  }

  /**
  * Function to navigate the preview tab.
  */
  async navigateToPreviewTab(): Promise<void> {
    await this.page.waitForTimeout(300);
    await this.clickOn(navigateToPreviewTabButton);
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  /**
  * Function to verify if the exploration tab is loading correctly in
  * the preview tab or not.
  */
  async expectTheExplorationToLoadInPreviewTab(text: string): Promise<void> {
    await this.page.waitForSelector(explorationConversationContent);
    const element = await this.page.$(explorationConversationContent);
    const introMessage = await this.page.evaluate(
      element => element.textContent, element);
    if (introMessage === text) {
      showMessage('Exploration is loading correctly in preview tab');
    } else {
      throw new Error('Exploration is not loading in preview tab');
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
    await this.page.waitForSelector(testFloatFormInput);
    await this.type(testFloatFormInput, '-3');
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
  * Function to verify if the exploration is restarting after
  * getting completed or not.
  */

  async restartTheExploration(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.clickOn(explorationRestartButton);
  }

  async expectTheExplorationToRestart(text: string): Promise<void> {
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector(explorationConversationContent);
    const element = await this.page.$(explorationConversationContent);
    const introMessage = await this.page.evaluate(
      element => element.textContent, element);
    if (introMessage === text) {
      showMessage('Exploration has restarted successfully');
    } else {
      throw new Error('Exploration has not restarted successfully');
    }
  }
}

export let ExplorationEditorFactory =
  (): ExplorationEditor => new ExplorationEditor();
