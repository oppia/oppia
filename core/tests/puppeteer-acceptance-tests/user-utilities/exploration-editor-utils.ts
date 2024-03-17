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
const navigateToHistoryTabButton = '.e2e-test-history-tab';
const navigateToPreviewTabButton = '.e2e-test-preview-tab';
const navigateToSettingsTabButton = '.e2e-test-settings-tab';
const navigateToMainTabButton = '.e2e-test-main-tab';

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
const viewMetadataChangesButton = '.e2e-test-view-metadata-history';
const testNodeBackground = '.e2e-test-node';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const closeMetadataModal = '.e2e-test-close-history-metadata-modal';
const closeStateModal = '.e2e-test-close-history-state-modal';
const oppiaResponseSelector = '.oppia-click-to-start-editing';

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
   * @param {string} content - The content in the Exploration.
   */
  async createExploration(content: string): Promise<void> {
    await this.clickOn(createExplorationButtonSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForTimeout(300);
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
    if (interactionToAdd !== ' End Exploration ') {
      await this.clickOn('.oppia-response-header');
    }
  }

  /**
   * Function to save an exploration draft.
   */
  async saveExplorationDraft(): Promise<void> {
    await this.clickOn(saveChangesButton);
    await this.page.waitForSelector(saveDraftButton, {visible: true});
    await this.page.waitForTimeout(500);
    await this.clickOn(saveDraftButton);
  }

  /**
   * Function to navigate to the settings tab in the Exploration Editor.
   */
  async navigateToSettingsTab(): Promise<void> {
    await this.page.waitForTimeout(200);
    await this.clickOn(navigateToSettingsTabButton);
    await this.page.waitForTimeout(200);
  }

  /**
   * Function to edit the title of the Exploration.
   * @param {string} title - The new title of the Exploration.
   */
  async editExplorationTitle(title: string): Promise<void> {
    await this.page.type(explorationTitleInput, title);
  }

  /**
   * Function to navigate to the main tab in the Exploration Editor.
   */
  async navigateToMainTab(): Promise<void> {
    await this.clickOn(navigateToMainTabButton);
  }

  /**
   * Function to edit the content of the Exploration.
   * @param {string} content - The new content of the Exploration.
   */
  async editExplorationContent(content: string): Promise<void> {
    await this.page.waitForTimeout(300);
    await this.page.waitForSelector(stateEditSelector, {visible: true});
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(explorationContentInput, {visible: true});
    await this.page.click(explorationContentInput, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(500);
    await this.page.type(explorationContentInput, content);
    await this.clickOn(saveContentButton);
  }

  /**
   * Function to navigate to the history tab in the Exploration Editor.
   */
  async navigateToHistoryTab(): Promise<void> {
    await this.page.waitForTimeout(300);
    await this.clickOn(navigateToHistoryTabButton);
  }

  /**
   * Function to create a list of all the revisions created.
   * @param {string} versionsListSelector - Common selector for revisions.
   */
  async getRevisionsList(versionsListSelector: string): Promise<
    {
      versionNo: string;
      notes: string;
      user: string;
      date: string;
    }[]
  > {
    let elements = await this.page.$$(versionsListSelector);
    let revisions: {
      versionNo: string;
      notes: string;
      user: string;
      date: string;
    }[] = [];
    for (let element of elements) {
      let versionNo = await element.$eval(
        revisionVersionNoSelector,
        async el => el.textContent
      );
      let notes = await element.$eval(
        revisionNoteSelector,
        async el => el.textContent
      );
      let user = await element.$eval(
        revisionUsernameSelector,
        async el => el.textContent
      );
      let date = await element.$eval(
        revisionDateSelector,
        async el => el.textContent
      );
      if (versionNo && notes && user && date) {
        revisions.push({versionNo, notes, user, date});
      }
    }
    return revisions;
  }

  /**
   * Function to confirm the existence of the Version number, Notes, Username,
   * and Date for a given revision.
   */
  async expectRevision1ToHave(property: string): Promise<void> {
    await this.page.waitForTimeout(500);
    let element = await this.page.$(`${historyListItem}:nth-child(${6})`);
    if (!element) {
      throw new Error('Revision 1 not found');
    }
    let selector: string;
    switch (property) {
      case 'Version No.':
        selector = revisionVersionNoSelector;
        break;
      case 'Notes':
        selector = revisionNoteSelector;
        break;
      case 'User':
        selector = revisionUsernameSelector;
        break;
      case 'Date':
        selector = revisionDateSelector;
        break;
      default:
        throw new Error(`Invalid property: ${property}`);
    }
    let value = await element.$eval(selector, async el => el.textContent);
    if (property === 'Notes' && typeof value === 'undefined') {
      throw new Error(`Revision 1 is missing ${property}`);
    } else if (property !== 'Notes' && (!value || value.trim() === '')) {
      throw new Error(`Revision 1 is missing or has an empty ${property}`);
    }
    showMessage(`Revision 1 has the property ${property} `);
  }

  /**
   * Function to check if a specific revision has a certain property.
   * @param {string} property - The property to check for.
   */
  async expectRevision2ToHave(property: string): Promise<void> {
    await this.page.waitForTimeout(500);
    let element = await this.page.$(`${historyListItem}:nth-child(${5})`);
    if (!element) {
      throw new Error('Revision 2 not found');
    }
    let selector: string;
    switch (property) {
      case 'Version No.':
        selector = revisionVersionNoSelector;
        break;
      case 'Notes':
        selector = revisionNoteSelector;
        break;
      case 'User':
        selector = revisionUsernameSelector;
        break;
      case 'Date':
        selector = revisionDateSelector;
        break;
      default:
        throw new Error(`Invalid property: ${property}`);
    }
    let value = await element.$eval(selector, async el => el.textContent);
    if (property === 'Notes' && typeof value === 'undefined') {
      throw new Error(`Revision 2 is missing ${property}`);
    } else if (property !== 'Notes' && (!value || value.trim() === '')) {
      throw new Error(`Revision 2 is missing or has an empty ${property}`);
    }
    showMessage(`Revision 2 has the property ${property} `);
  }

  /**
   * Function to verify whether the revisions are sorted by dates or not.
   * @param {string} property - The property to sort by.
   */
  async expectRevisionsToBeOrderedBy(property: string): Promise<void> {
    let revisions = await this.getRevisionsList(historyListItem);
    for (let i = 0; i < revisions.length - 1; i++) {
      let date1 = new Date(revisions[i].date);
      let date2 = new Date(revisions[i + 1].date);
      if (date1 < date2) {
        throw new Error(`Revisions are not sorted by ${property}`);
      }
    }
  }

  /**
   * Function to filter revisions by username.
   * @param {string} userName - The username to filter by.
   */
  async filterRevisionsBySpecificUser(userName: string): Promise<void> {
    await this.page.type(userNameEdit, userName);
    await this.page.type(userNameEdit, '\u000d');
  }

  /**
   * Function to check if a specific user has a certain number of revisions.
   * @param {number} numberOfVersions - The number of revisions to check for.
   */
  async expectSpecificUserToHaveNumberOfRevisions(
    numberOfVersions: number
  ): Promise<void> {
    let revisions = await this.getRevisionsList(historyListItem);
    if (revisions.length !== numberOfVersions) {
      throw new Error(
        'The number of revisions are not equal to the created by the user'
      );
    } else {
      showMessage(
        'The number of revisions are equal to the created by the user'
      );
    }
  }

  /**
   * Function to adjust the paginator to show a certain number of revisions per page.
   */
  async adjustPaginatorToShowRevisionsPerPage(): Promise<void> {
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector(paginatorToggler, {visible: true});
    await this.clickOn(paginatorToggler);
    const PaginatorOptionsSelector = '.mat-select-panel';
    await this.clickOn(`${PaginatorOptionsSelector} mat-option:nth-child(2)`);
  }

  /**
   * Function to check if the next page of revisions button is in a certain status.
   * @param {string} status - The status to check for.
   */
  async expectNextPageOfRevisionsButtonToBe(status: string): Promise<void> {
    const nextPageButton = await this.page.$('.mat-paginator-navigation-next');
    if (!nextPageButton) {
      throw new Error('Next page button not found');
    }
    const isDisabled = await nextPageButton.evaluate(
      button => button.getAttribute('disabled') === 'true'
    );
    if (
      (status === 'disabled' && isDisabled) ||
      (status === 'enabled' && !isDisabled)
    ) {
      showMessage(`Next page button is ${status}`);
      if (status === 'enabled') {
        showMessage(`Next page button is ${status}`);
        await nextPageButton.click();
      }
    } else {
      throw new Error(
        `Expected next page button to be ${status}, but it was ${isDisabled ? 'disabled' : 'enabled'}`
      );
    }
  }
  /**
   * Function for comparing different revisions.
   */
  async compareDifferentRevisions(
    version1: number,
    version2: number
  ): Promise<void> {
    await this.page.waitForSelector(firstVersionDropdown);
    await this.clickOn(firstVersionDropdown);
    const panel1 = '.mat-select-panel';
    await this.clickOn(`${panel1} mat-option:nth-last-child(${version1})`);
    await this.page.waitForSelector(secondVersionDropdown);
    await this.clickOn(secondVersionDropdown);
    const panel2 = '#mat-select-2-panel';
    await this.clickOn(`${panel2} mat-option:nth-last-child(${version2})`);
  }

  /**
   * Function to check if modifications in the metadata are being reflected.
   */
  async expectMetadataChangesToIncludeChangesIn(
    property: string
  ): Promise<void> {
    await this.page.waitForSelector(viewMetadataChangesButton, {visible: true});
    await this.clickOn(viewMetadataChangesButton);
    await this.page.waitForTimeout(300);
    const divContents = await this.page.$$eval('.CodeMirror-code', divs =>
      divs.map(div => div.textContent)
    );
    if (divContents[0] !== divContents[1]) {
      showMessage(`Metadata changes are reflecting changes in ${property}.`);
    } else {
      throw new Error(
        `Metadata changes are not reflecting changes ${property}`
      );
    }
    await this.clickOn(closeMetadataModal);
  }

  /**
   * Function to check if modifications in the exploration state are being
   * reflected or not.
   */
  async expectDisplayExplorationStateToIncludeChangesIn(
    property: string
  ): Promise<void> {
    await this.page.waitForTimeout(400);
    await this.clickOn(testNodeBackground);
    await this.page.waitForTimeout(500);
    const divContent = await this.page.$$eval('.CodeMirror-code', divs =>
      divs.map(div => div.textContent)
    );
    if (divContent[0] !== divContent[1]) {
      showMessage(
        `Exploration state changes are reflected in the ${property}.`
      );
    } else {
      throw new Error('No changes detected in the exploration state.');
    }
    await this.clickOn(closeStateModal);
    await this.page.waitForSelector(resetGraphButton);
    await this.clickOn(resetGraphButton);
  }

  /**
   * Function to download a specific revision.
   * @param {number} revisionNo - The number of the revision to be downloaded.
   */
  async downloadRevision(revisionNo: number): Promise<void> {
    await this.page.waitForTimeout(1000);
    const buttons = await this.page.$$('.history-table-option');
    await buttons[revisionNo - 1].click();
    await this.page.waitForTimeout(1000);
    await this.page.waitForSelector(downloadVersionButton);
    await this.clickOn(downloadVersionButton);
  }

  /**
   * Function to revert to a specific revision.
   * @param {number} revisionNo - The number of the revision to revert to.
   */
  async revertRevision(revisionNo: number): Promise<void> {
    const buttons = await this.page.$$('.history-table-option');
    await buttons[revisionNo - 1].click();
    await this.page.waitForTimeout(1000);
    await this.clickOn(revertVersionButton);
    await this.clickOn(confirmRevertVersionButton);
  }

  /**
   * Function to verify if a revision is reverting and downloading or not.
   * @param {number} revisionNo - The number of the revision to check.
   */
  async expectSuccessfulReversionOfRevision(revisionNo: number): Promise<void> {
    // This page takes 3-5 seconds to reload to reflect the reverted revision.
    await this.page.waitForTimeout(5000);
    await this.page.waitForSelector(historyListItem);
    let element = await this.page.$(historyListItem);
    if (element === null) {
      throw new Error('No Revisions found');
    }
    let notes = await element.$eval(
      revisionNoteSelector,
      async el => el.textContent
    );
    if (notes === null) {
      throw new Error('Revision does not contain a Note');
    }
    await this.page.waitForTimeout(500);
    if (notes === ` Reverted exploration to version ${revisionNo} `) {
      showMessage('Revision is reverting successfully');
    } else {
      throw new Error('Revision is not reverting');
    }
  }

  /**
   * Function to create a new card in the exploration creator.
   * @param {string} cardName - The name of the card to be created.
   */
  async addANewCardToTheExploration(cardName: string): Promise<void> {
    await this.clickOn(openOutcomeDestButton);
    await this.page.waitForSelector(destinationCardSelector, {visible: true});
    await this.select(destinationCardSelector, '/');
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
    await this.page.waitForTimeout(2000);
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(explorationContentInput, {visible: true});
    await this.page.click(explorationContentInput, {clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(500);
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
    await this.clickOn(navigateToPreviewTabButton);
    await this.page.waitForNavigation({waitUntil: 'networkidle2'});
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
    await this.page.waitForTimeout(2500);
    await this.clickOn(explorationRestartButton);
  }

  /**
   * Function to verify if the exploration is restarting after
   * getting completed or not.
   * @param {string} text - The expected introduction card text after restart.
   */
  async expectTheExplorationToRestart(text: string): Promise<void> {
    /**
     * An explicit timeout is set because the page reloads when the
     * exploration restart button is clicked, and it takes approximately
     * 0.4-0.5 seconds to load properly
     */
    await this.page.waitForTimeout(500);
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
