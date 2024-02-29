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

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

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
const giveTitle = 'div.oppia-rte';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const endInteractionSelector = '.e2e-test-interaction-tile-EndExploration';
const continueInteractionSelector = '.e2e-test-interaction-tile-Continue';
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
const versionsList = 'div.e2e-test-history-list-item';
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

// Preview tab elements.
const testContinueButton = '.e2e-test-continue-button';
const testFloatFormInput = '.e2e-test-float-form-input';
const nextCardButton = '.e2e-test-next-card-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const explorationRestartButton = '.e2e-preview-restart-button';
const explorationConversationContent = '.e2e-test-conversation-content';
const toastMessage = 'div.toast-message';

// Settings tab elements.
const explorationTitleInput = '.e2e-test-exploration-title-input';

module.exports = class explorationAdmin extends baseUser {
  /**
  * Function for navigating to the contributor dashboard page.
  */
  async navigateToCreatorDashboard() {
    await this.goto(creatorDashboardAdminUrl, { waitUntil: 'networkIdle0' });
  }

  /**
  * Function for creating an exploration in the Exploration Editor
  * @param {string} title - the title of the Exploration.
  */
  async createExploration(title) {
    await this.clickOn(createExplorationButtonSelector);
    await this.page.waitForSelector(
      dismissWelcomeModalSelector, { visible: true });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForTimeout(300);
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(giveTitle, { visible: true });
    await this.type(giveTitle, title + '1');
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(addInteractionButton);
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(
      endInteractionSelector, { visible: true });
    await this.clickOn(endInteractionSelector);
    await this.clickOn(saveInteractionButton);
    await this.clickOn(saveChangesButton);
    await this.page.waitForSelector(
      saveDraftButton, { visible: true });
    await this.clickOn(saveDraftButton);
  }

  async makeMetaDataChanges(title) {
    await this.waitForTimeout(200);
    await this.clickOn(navigateToSettingsTabButton);
    await this.page.waitForSelector(explorationTitleInput);
    await this.type(explorationTitleInput, title);
    await this.clickOn(navigateToMainTabButton);
  }

  /**
  * Function to create multiple revisions of the same Exploration.
  * @param {string} title - the title of the Exploration.
  */
  async createMultipleRevisionsOfTheSameExploration(title) {
    // Await this.makeMetaDataChanges('title-changed');
    await this.page.waitForTimeout(300);
    for (let i = 0; i < 13; i++) {
      await this.page.waitForSelector(stateEditSelector, { visible: true });
      await this.clickOn(stateEditSelector);
      await this.page.waitForSelector(giveTitle, { visible: true });
      await this.type(giveTitle, `${title} ${i + 2}`);
      await this.clickOn(saveContentButton);
      await this.clickOn(saveChangesButton);
      await this.page.waitForTimeout(700);
      await this.clickOn(saveDraftButton);
    }
  }

  /**
  * Function for navigating to the Hisotry tab of the Exploration Editor.
  */
  async navigateToHistoryTab() {
    await this.page.waitForTimeout(300);
    await this.clickOn(navigateToHistoryTabButton);
  }

  /**
  * Function to create a list of all the revisions created.
  * @param {string} versionsListSelector - common selector for revisions.
  */
  async getRevisionsList(versionsListSelector) {
    let elements = await this.page.$$(versionsListSelector);
    let revisions = [];
    for (let element of elements) {
      let versionNo = await element.$eval(
        revisionVersionNoSelector, async(el) => el.textContent);
      let notes = await element.$eval(
        revisionNoteSelector, async(el) => el.textContent);
      let user = await element.$eval(
        revisionUsernameSelector, async(el) => el.textContent);
      let date = await element.$eval(
        revisionDateSelector, async(el) => el.textContent);
      revisions.push({ versionNo, notes, user, date });
    }
    return revisions;
  }

  /**
  * Function to confirm the existence of the Version number, Notes, Username,
  * and Date for a given revision.
  */
  async expectRevisionsToHaveVersionNoNotesUsernameDate() {
    await this.page.waitForTimeout(500);
    let element = await this.page.$(versionsList);
    if (!element) {
      throw new Error('No revisions found');
    }
    let versionNo = await element.$eval(
      revisionVersionNoSelector, async(el) => el.textContent);
    let notes = await element.$eval(
      revisionNoteSelector, async(el) => el.textContent);
    let user = await element.$eval(
      revisionUsernameSelector, async(el) => el.textContent);
    let date = await element.$eval(
      revisionDateSelector, async(el) => el.textContent);
    if (!versionNo || !user || !date || typeof notes === 'undefined') {
      throw new Error('The latest revision is missing one or more properties');
    }

    showMessage('The versions are not missing any properties');
    return { versionNo, notes, user, date };
  }

  /**
  * Function to verify whether the revisions are sorted by dates and if the
  * current page displays 10 items as per the default paginator settings.
  */
  async expectRevisionsToBeDateOrderedAnd10ItemsPerPage() {
    let revisions = await this.getRevisionsList(versionsList);
    for (let i = 0; i < revisions.length - 1; i++) {
      let date1 = new Date(revisions[i].date);
      let date2 = new Date(revisions[i + 1].date);
      if (date1 < date2) {
        throw new Error('Revisions are not sorted by date');
      }
    }
    showMessage('Revisions are sorted by date');
    if (revisions.length !== 10) {
      throw new Error(
        `Pagination Error: When the items per page is set to 10,
         expected 10 user revisions, but got ${revisions.length}`);
    } else {
      showMessage(
        `When the items per page is set to 10, 
         correctly shows 10 user revisions.`);
    }
  }

  /**
  * Function to filter revisions by username.
  */
  async filterRevisionsByUsername() {
    await this.type(userNameEdit, 'explorationAdm');
    await this.type(userNameEdit, '\u000d');
  }

  /**
  * Function to verify if the number of items per page adjusts according
  *  to changes in the paginator settings.
  */
  async ExpectPaginatorToChangeItemsPerPage() {
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector(paginatorToggler, { visible: true });
    await this.clickOn(paginatorToggler);
    await this.clickOn('#mat-option-1');

    await this.page.waitForTimeout(500);
    let revisions = await this.getRevisionsList(versionsList);
    if (revisions.length !== 15) {
      throw new Error(
        `Pagination Error: When the items per page is set to 15,
         expected 15 user revisions, but got ${revisions.length}`);
    } else {
      showMessage(
        `When the items per page is set to 15, 
        correctly shows 15 user revisions.`);
    }
  }

  /**
  * Function for camparing different revision.
  */
  async compareDifferentRevisions() {
    await this.page.waitForTimeout(300);
    await this.page.waitForSelector(firstVersionDropdown);
    await this.clickOn(firstVersionDropdown);
    await this.clickOn('#mat-option-1297');
    await this.page.waitForTimeout(300);
    await this.page.waitForSelector(secondVersionDropdown);
    await this.clickOn(secondVersionDropdown);
    await this.clickOn('#mat-option-1306');
  }

  /**
  * Function to check if modifications in the metadata are being reflected.
  */
  async expectCompareToDisplayMetadataChanges() {
    await this.clickOn(viewMatadataChangesButton);
    await this.page.waitForTimeout(300);
    const divContents = await this.page.$$eval(
      '.CodeMirror-code', divs => divs.map(div => div.textContent));
    if (divContents[0] !== divContents[1]) {
      throw new Error('Changes are reflected even though there are no changes');
    }
    await this.clickOn(closeMetadataModal);
    await this.page.waitForSelector(resetGraphButton);
    await this.clickOn(resetGraphButton);
  }

  /**
  * Function to check if modifications in the exploration state are being
  * reflected or not.
  */
  async expectCompareToDisplayExplorationStateChanges() {
    await this.page.waitForTimeout(1000);
    await this.page.waitForSelector(testNodeBackground);
    await this.page.waitForTimeout(2000);
    await this.clickOn(testNodeBackground);
    await this.page.waitForSelector('.CodeMirror-code');
    const divContents = await this.page.$$eval(
      '.CodeMirror-code', divs => divs.map(div => div.textContent));
    if (divContents[0] !== divContents[1]) {
      showMessage('State changes are reflected in the exploration.');
    } else {
      showMessage('No changes detected in the exploration state.');
    }
    await this.clickOn(closeStateModal);
  }

  /**
  * Function downloads and reverts a version.
  * @param {number} version - revision version.
  * */
  async downloadAndRevertRevision() {
    await this.clickOn('#dropdownMenuButton-0');
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector(downloadVersionButton);
    await this.clickOn(downloadVersionButton);
    await this.clickOn(revertVersionButton);

    await this.page.click(confirmRevertVersionButton);
  }



  /**
  * Function verifies if a revsion is reverting and downloading or not.
  */
  async expectSuccessfulReversionOfRevision() {
    await this.page.waitForTimeout(1000);
    const element = await this.page.$('#dropdownMenuButton-0');
    let notes = await element.$eval(
      revisionNoteSelector, async(el) => el.textContent);
    if (notes === 'Reverted exploration to version 14') {
      showMessage('Revision is reverting successfully');
    } else {
      throw new Error('Revision is not reverting');
    }
  }

  /**
  * Function to create a new card in the exploration creator.
  * @param {string} title - title of the new card created.
  */
  async callNewCard(title) {
    await this.clickOn(openOutcomeDestButton);
    await this.page.waitForSelector(destinationCardSelector);
    await this.page.select(destinationCardSelector, '/');
    await this.page.waitForSelector(addStateInput);
    await this.page.type(addStateInput, title);
    await this.clickOn(saveOutcomeDestButton);
  }

  /**
  * Function to open the next card in the exploration journey.
  * @param {number} card_num - card number to switch to.
  */
  async openNextCard(cardNum) {
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
  async createQuestion(question, answer) {
    await this.page.waitForSelector(stateEditSelector);
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(giveTitle, { visible: true });
    await this.page.click(giveTitle, { clickCount: 3 });
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(500);
    await this.type(giveTitle, `${question}`);

    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(addInteractionButton, { visible: true });
    await this.clickOn(addInteractionButton);
    await this.clickOn(numericInputSelector);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(floatFormInput);
    await this.type(floatFormInput, answer);
    await this.page.waitForSelector('.oppia-click-to-start-editing');
    await this.clickOn('.oppia-click-to-start-editing');
    await this.page.waitForSelector(giveTitle, { visible: true });
    await this.type(giveTitle, 'correct');
    await this.clickOn(correctAnswerInTheGroupSelector);
    await this.clickOn(addNewResponseButton);
  }

  /**
  * Function for creating an exploration containing questions
  * @param {string} title - title of the exploration.
  */
  async createExplorationLoadedWithQuestions(title) {
    await this.clickOn(createExplorationButtonSelector);
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForTimeout(200);
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(giveTitle, { visible: true });
    await this.type(giveTitle, title);

    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(addInteractionButton, { visible: true });
    await this.clickOn(addInteractionButton);
    await this.clickOn(continueInteractionSelector);
    await this.clickOn(saveInteractionButton);
    await this.clickOn('.oppia-response-header');
    await this.callNewCard('Less Than or equal to 1');
    await this.openNextCard(1);
    await this.createQuestion('mention a number less than or equal to 5', '-3');
    await this.callNewCard('Less than or equal to 4');
    await this.openNextCard(2);
    await this.createQuestion('mention a number less than or equal 4', '-3');
    await this.callNewCard('end');
    await this.openNextCard(3);
    await this.page.waitForSelector(stateEditSelector, { visible: true });
    await this.clickOn(stateEditSelector);
    await this.page.waitForSelector(giveTitle, { visible: true });
    await this.type(giveTitle, 'last card');
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(addInteractionButton, { visible: true });
    await this.clickOn(addInteractionButton);
    await this.clickOn(endInteractionSelector);
    await this.clickOn(saveInteractionButton);
    await this.openNextCard(0);
    await this.clickOn(saveChangesButton);
    await this.page.waitForSelector(saveDraftButton, { visible: true });
    await this.clickOn(saveDraftButton);
  }

  /**
  * Function to navigate the preview tab.
  */
  async navigateToPreviewTab() {
    await this.page.waitForSelector(navigateToPreviewTabButton);
    await this.clickOn(navigateToPreviewTabButton);
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  /**
  * Function to verify if the exploration tab is loading correctly in
  * the preview tab or not.
  */
  async expectTheExplorationToLoadInPreviewTab() {
    await this.page.waitForSelector(explorationConversationContent);
    const element = await this.page.$(explorationConversationContent);
    const text = await this.page.evaluate(
      element => element.textContent, element);
    if (text === 'Test-revision') {
      showMessage('exploration is loading well in preview tab');
    } else {
      throw new Error('exploration is not loading in preview tab');
    }
  }

  /**
  * Function to complete the exploration in the preview tab.
  */
  async completeTheExplorationInPreviewTab() {
    await this.clickOn(testContinueButton);
    await this.page.waitForSelector(testFloatFormInput);
    await this.type(testFloatFormInput, '-1');
    await this.clickOn(submitAnswerButton);
    await this.page.waitForSelector(nextCardButton);
    await this.clickOn(nextCardButton);
    await this.page.waitForSelector(testFloatFormInput);
    await this.type('.e2e-test-float-form-input', '-3');
    await this.clickOn(submitAnswerButton);
    await this.page.waitForSelector(nextCardButton);
    await this.clickOn(nextCardButton);
    showMessage('Exploration has completed Successfully');
  }

  /**
  * Function to verify if the exploration is completed in the preview tab.
  */
  async expectTheExplorationToComplete() {
    const element = await this.page.waitForSelector(toastMessage);

    if (element) {
      showMessage('Journey completed successfully');
    } else {
      throw new Error('Journey did not complete successfully');
    }
  }

  /**
  * Function to verify if the exploration is restarting after
  * getting completed or not.
  */
  async expectTheExplorationToRestart() {
    await this.clickOn(explorationRestartButton);
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector(explorationConversationContent);
    const element = await this.page.$(explorationConversationContent);
    const text = await this.page.evaluate(
      element => element.textContent, element);
    if (text === 'Test-revision') {
      showMessage('exploration has restarted successfully');
    } else {
      throw new Error('exploration has not restarted successfully');
    }
  }
};
