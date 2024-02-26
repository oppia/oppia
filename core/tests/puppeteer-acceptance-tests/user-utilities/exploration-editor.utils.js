// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview exploration admin users utility file.
 */

const baseUser = require(
    "../puppeteer-testing-utilities/puppeteer-utils.js");
const testConstants = require(
    "../puppeteer-testing-utilities/test-constants.js");
const { showMessage } = require(
    "../puppeteer-testing-utilities/show-message-utils.js");
const { add } = require("lodash");

const creatorDashboardAdminUrl =
    testConstants.URLs.CreatorDashboard;
const navigateToHistoryTabButton = ".e2e-test-history-tab";
const navigateToPreviewTabButton = ".e2e-test-preview-tab";

// elements in exploration creator
const createExplorationButtonSelector = "button.e2e-test-create-activity";
const dismissWelcomeModalSelector = "button.e2e-test-dismiss-welcome-modal";
const stateEditSelector = "div.e2e-test-state-edit-content";
const giveTitle = "div.oppia-rte";
const saveContentButton = "button.e2e-test-save-state-content";
const addInteractionButton = "button.e2e-test-open-add-interaction-modal";
const endInteractionSelector = ".e2e-test-interaction-tile-EndExploration";
const continueInteractionSelector = ".e2e-test-interaction-tile-Continue";
const numericInputSelector = ".e2e-test-interaction-tile-NumericInput";
const saveInteractionButton = "button.e2e-test-save-interaction";
const saveChangesButton = "button.e2e-test-save-changes";
const saveDraftButton = "button.e2e-test-save-draft-button";
const correctAnswerInTheGroupSelector = ".e2e-test-editor-correctness-toggle";
const addNewResponseButton = ".e2e-test-add-new-response";
const floatFormInput = "input.oppia-float-form-input"

// revision property elements
const revisionVersionNoSelector = ".e2e-history-table-index";
const revisionNoteSelector = ".e2e-test-history-table-message";
const revisionUsernameSelector = ".e2e-test-history-table-profile";
const revisionDateSelector = ".e2e-test-history-tab-commit-date";

// History tab elements
const userNameEdit = "input.e2e-history-filter-input";
const versionsList = "div.e2e-test-history-list-item";
const firstVersionDropdown = ".e2e-test-history-version-dropdown-first";
const secondVersionDropdown = ".e2e-test-history-version-dropdown-second";
const revertVersionButton = ".e2e-test-revert-version";
const downloadVersionButton = ".e2e-test-download-version";
const resetGraphButton = ".e2e-test-reset-graph";
const confirmRevertVersionButton = ".e2e-test-confirm-revert";
const paginatorToggler = ".mat-paginator-page-size-select";
const viewMatadataChanges = ".e2e-test-view-metadata-history";
const testNodeBackground = ".e2e-test-node-background";
const historyListOptions = "div.e2e-test-history-list-options";
const openOutcomeDestButton = ".e2e-test-open-outcome-dest-editor";
const destinationCardSelector = "select.e2e-test-destination-selector-dropdown";
const addStateInput = ".e2e-test-add-state-input";
const saveOutcomeDestButton = ".e2e-test-save-outcome-dest"

// Preview tab elements 
const testContinueButton = ".e2e-test-continue-button";
const testFloatFormInput = ".e2e-test-float-form-input";
const nextCardButton = ".e2e-test-next-card-button";
const submitAnswerButton = ".e2e-test-submit-answer-button";
const explorationRestartButton = ".oppia-restart-text";
const explorationConversationContent = ".e2e-test-conversation-content";






module.exports = class explorationAdmin extends baseUser {

    /**
     * Function for navigating to the contributor dashboard page.
     */

    async navigateToCreatorDashboard() {
        await this.goto(creatorDashboardAdminUrl);
    }

    /**
     * Function for creating an exploration in the Exploration Editor
     * @param {string} title - the title of the Exploration.
     */

    async createExploration(title) {
        await this.clickOn(createExplorationButtonSelector);
        await this.clickOn(dismissWelcomeModalSelector);
        await this.page.waitForSelector(stateEditSelector + ":not([disabled])");
        await this.clickOn(stateEditSelector);
        await this.page.waitForSelector(giveTitle + ":not([disabled])");
        await this.type(giveTitle, title + "1");
        await this.clickOn(saveContentButton);
        await this.page.waitForSelector(addInteractionButton + ":not([disabled])");
        await this.clickOn(addInteractionButton);
        await this.clickOn(endInteractionSelector);
        await this.clickOn(saveInteractionButton);
        await this.clickOn(saveChangesButton);
        await this.page.waitForSelector(saveDraftButton + ":not([disabled])");
        await this.clickOn(saveDraftButton);
    }

    /**
     * Function to create multiple revisions of the same Exploration.
     * @param {string} title - the title of the Exploration.
     */

    async createMultipleRevisionsOfTheSameExploration(title) {
        for (let i = 0; i < 15; i++) {
            await this.clickOn(stateEditSelector);
            await this.page.waitForSelector(giveTitle + ":not([disabled])");
            await this.type(giveTitle, `${title} ${i + 2}`);
            await this.clickOn(saveContentButton);
            await this.clickOn(saveChangesButton);
            await this.page.waitForTimeout(1000);
            await this.clickOn(saveDraftButton);
        }
    }

    /**
     * Function for navigating to the Hisotry tab of the Exploration Editor.
     */

    async navigateToHistoryTab() {
        await this.page.waitForSelector(navigateToHistoryTabButton + ":not([disabled])");
        await this.clickOn(navigateToHistoryTabButton);
    }

    /**
     * Function to create a list of all the revisions created.
     * @param {string} versionsListSelector - common selector of the all the revisions on the screen. 
     */

    async getRevisionsList(versionsListSelector) {
        let elements = await this.page.$$(versionsListSelector);
        let revisions = [];
        for (let element of elements) {
            let versionNo = await element.$eval(revisionVersionNoSelector, async (el) => el.textContent);
            let notes = await element.$eval(revisionNoteSelector, async (el) => el.textContent);
            let user = await element.$eval(revisionUsernameSelector, async (el) => el.textContent);
            let date = await element.$eval(revisionDateSelector, async (el) => el.textContent);
            revisions.push({ versionNo, notes, user, date });
        }
        return revisions;
    }

    /**
     * Function to confirm the existence of the Version number, Notes, Username, and Date for a given revision.
     */

    async expectRevisionsToHaveVersionNoNotesUsernameDate() {
        await this.page.waitForTimeout(500);
        let element = await this.page.$(versionsList);
        if (!element) {
            throw new Error("No revisions found");
        }
        let versionNo = await element.$eval(revisionVersionNoSelector, async (el) => el.textContent);
        let notes = await element.$eval(revisionNoteSelector, async (el) => el.textContent);
        let user = await element.$eval(revisionUsernameSelector, async (el) => el.textContent);
        let date = await element.$eval(revisionDateSelector, async (el) => el.textContent);
        if (!versionNo || !user || !date || typeof notes === "undefined") {
            throw new Error("The latest revision is missing one or more properties");
        }

        showMessage("The versions are not missing any properties");
        return { versionNo, notes, user, date };
    }

    /**
     * Function to verify whether the revisions are sorted by dates and if the current page displays 10 items as per the default paginator settings.
     */

    async expectRevisionInChronologicalOrderAndHave10ItemPerPage() {
        let revisions = await this.getRevisionsList(versionsList);

        for (let i = 0; i < revisions.length - 1; i++) {
            let date1 = new Date(revisions[i].date);
            let date2 = new Date(revisions[i + 1].date);
            if (date1 < date2) {
                throw new Error("Revisions are not sorted by date");
            }
        }
        showMessage("Revisions are sorted by date")
        if (revisions.length != 10) {
            throw new Error(`Pagination Error: When the items per page is set to 10, expected 10 user revisions, but got ${revisions.length}`);
        } else {
            showMessage("When the items per page is set to 10, correctly shows 10 user revisions.");
        }
    }

    /**
     * Function to filter revisions by username.
     */

    async filterRevisionsByUsername() {
        await this.type(userNameEdit, "explorationAdm");
        await this.type(userNameEdit, "\u000d");
    }

    /**
     * Function to verify if the number of items per page adjusts according to changes in the paginator settings.
     */

    async ExpectPaginatorToChangeItemsPerPage() {
        await this.clickOn(paginatorToggler);
        await this.clickOn('#mat-option-1');

        await this.page.waitForTimeout(500);
        let revisions = await this.getRevisionsList(versionsList);
        if (revisions.length != 7) {
            throw new Error(`Pagination Error: When the items per page is set to 15, expected 15 user revisions, but got ${revisions.length}`);
        } else {
            showMessage("When the items per page is set to 15, correctly shows 15 user revisions.");
        }
    }

    /**
     * Function for camparing different revision.
     */

    async CompareDifferentRevisions() {
        await this.clickOn(firstVersionDropdown);
        await this.clickOn('#mat-option-1523');

        await this.clickOn(secondVersionDropdown);
        await this.page.waitForTimeout(30000);
        await this.clickOn('#mat-option-1542');

    }

    /**
     * Function to check if modifications in the metadata are being reflected or not.
     */

    async expectCompareRevisionToDisplayMetadataChanges() {
        await this.clickOn(viewMatadataChanges);
        const elements = await page.$$('.CodeMirror-merge-r-chunk-start');
        const element1Content = await (await elements[0].getProperty('textContent')).jsonValue();
        const element2Content = await (await elements[1].getProperty('textContent')).jsonValue();

        if (element1Content === element2Content) {
            console.log('Changes are appearing');
        } else {
            console.log('Changes are not appearing');
        }
        await this.clickOn(resetGraphButton);
    }

    /**
     * Function to check if modifications in the exploration state are being reflected or not.
     */

    async expectCompareRevisionToDisplayExplorationStateChanges() {

        await this.clickOn(testNodeBackground);
        const elements = await page.$$('.CodeMirror-merge-r-chunk-start');
        const element1Content = await (await elements[0].getProperty('textContent')).jsonValue();
        const element2Content = await (await elements[1].getProperty('textContent')).jsonValue();

        if (element1Content === element2Content) {
            console.log('Changes are appearing');
        } else {
            console.log('Changes are not appearing');
        }
        await this.clickOn(resetGraphButton);
    }

    /**
     * Function verify reverted or not.
     * @param {number} version - revision version.
     */

    async expectRevertToVersion(version) {
        await this.waitFor.numberOfElementsToBe(revisionNoteSelector, "History Table message", 4);
        const isReverted = await this.waitFor.textToBePresentInElement(revisionNoteSelector,
            "Reverted exploration to version " + version, "Revert message takes too long to appear");
        return isReverted;
    };

    /**
     * Function verify if revision are reverting and downloading or not.
     */

    async expectInteractionToDownloadAndRevertSelectedRevision() {
        await this.page.waitForSelector("");
        await this.clickOn(historyListOptions);
        await this.clickOn(downloadVersionButton);

        const selector = historyListOptions;
        await this.page.waitForSelector(selector);
        const elements = await this.page.$$(selector);

        await elements[2].click();
        await this.page.waitForSelector(revertVersionButton, { visible: true, timeout: 5000 });
        await this.clickOn(revertVersionButton);
        await this.clickOn(confirmRevertVersionButton);
        await this.page.waitForTimeout(1000);
        if (await this.expectRevertToVersion(15)) {
            console.log("Reverts successfully");
        } else {
            console.log("Does not revert successfully");
        }

    }

    /**
     * Function for acceptance testing of the preview tab.
     */

    /**
     * Function to create a new card in the exploration creator.
     * @param {string} title - title of the new card created.
     */


    async callNewCard(title) {
        await this.clickOn(openOutcomeDestButton);
        await this.page.waitForSelector(destinationCardSelector);
        await this.page.select(destinationCardSelector, "A New Card Called...");
        await this.page.waitForSelector(addStateInput);
        await this.page.type(addStateInput, title);
        await this.clickOn(saveOutcomeDestButton);
    }

    /**
     * Function to open the next card in the exploration journey. 
     * @param {number} card_num - card number to switch to.
     */

    async openNextCard(card_num) {
        const selector = testNodeBackground;
        await this.page.waitForSelector(selector);
        const elements = await this.page.$$(selector);
        if (elements.length > card_num) {
            await elements[card_num].click();
        } else {
            console.log(`There are not enough elements to click on the ${card_num}th element.`);
        }
    }

    /**
     * Function to create questions in the exploration card. 
     * @param {string} question - question to be added.
     * @param {number} answer - answer of the question.
     */

    async createQuestion(question, answer) {
        await this.clickOn(stateEditSelector);
        await this.page.waitForSelector(giveTitle + ":not([disabled])");
        await this.page.click(giveTitle);
        await this.page.type(giveTitle, question);
        await this.clickOn(saveContentButton);
        await this.page.waitForSelector(addInteractionButton + ":not([disabled])");
        await this.clickOn(addInteractionButton);
        await this.clickOn(numericInputSelector);
        await this.clickOn(saveInteractionButton);
        await this.page.waitForSelector(floatFormInput);
        await this.type(floatFormInput, answer);
        await this.page.waitForSelector(".oppia-click-to-start-editing");
        await this.clickOn(".oppia-click-to-start-editing");
        await this.page.waitForSelector(giveTitle + ":not([disabled])");
        await this.type(giveTitle, "correct");
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
        await this.page.waitForSelector(stateEditSelector + ":not([disabled])");
        await this.clickOn(stateEditSelector);
        await this.page.waitForSelector(giveTitle + ":not([disabled])");
        await this.type(giveTitle, title);

        await this.clickOn(saveContentButton);
        await this.page.waitForSelector(addInteractionButton + ":not([disabled])");
        await this.clickOn(addInteractionButton);
        await this.clickOn(continueInteractionSelector);
        await this.clickOn(saveInteractionButton);
        await this.clickOn(".oppia-response-header");
        await this.callNewCard("Less Than or equal to 1");
        await this.openNextCard(1);
        await this.createQuestion("mention a number less than or equal to 5", "-3")
        await this.callNewCard("Less than or equal to 4");
        await this.openNextCard(2);
        await this.createQuestion("mention a number less than or equal 4", "-3")
        await this.callNewCard("end")
        await this.openNextCard(3);
        await this.page.waitForSelector(stateEditSelector + ":not([disabled])");
        await this.clickOn(stateEditSelector);
        await this.page.waitForSelector(giveTitle + ":not([disabled])");
        await this.type(giveTitle, "last card");
        await this.clickOn(saveContentButton);
        await this.page.waitForSelector(addInteractionButton + ":not([disabled])");
        await this.clickOn(addInteractionButton);
        await this.clickOn(endInteractionSelector);
        await this.clickOn(saveInteractionButton);
        await this.openNextCard(0);
        await this.clickOn(saveChangesButton);
        await this.page.waitForSelector(saveDraftButton + ":not([disabled])");
        await this.clickOn(saveDraftButton);
    }

    /**
     * Function to navigate the preview tab.
     */

    async navigateToPreviewTab() {
        await this.page.waitForSelector(navigateToPreviewTabButton + ":not([disabled])");
        await this.clickOn(navigateToPreviewTabButton);
    }

    /**
     * Function to verify if the exploration tab is loading correctly in the preview tab or not.
     */

    async expectTheExplorationToLoadInPreviewTab() {
        await this.page.waitForSelector(explorationConversationContent);
        const element = await this.page.$(explorationConversationContent);
        const text = await this.page.evaluate(element => element.textContent, element);
        console.log(text);
        if (text == "Test-revision") {
            showMessage("exploration is loading well in preview tab")
        } else {
            throw new Error("exploration is not loading in preview tab");
        }
    }

    /**
     * Function to complete the exploration in the preview tab.
     */

    async completeTheExplorationInPreviewTab() {
        await this.clickOn(testContinueButton);
        await this.page.waitForSelector(testFloatFormInput);
        await this.type(testFloatFormInput, "-1");
        await this.clickOn(submitAnswerButton);
        await this.page.waitForSelector(nextCardButton);
        await this.clickOn(nextCardButton);
        await this.page.waitForSelector(testFloatFormInput);
        await this.type(e2e-test-float-form-input, "-3");
        await this.clickOn(submitAnswerButton);
        await this.page.waitForSelector(nextCardButton);
        await this.clickOn(nextCardButton);
        showMessage("Exploration has completed Successfully");
    }

    /**
     * Function to verify if the exploration is completed in the preview tab.
     */


    async expectTheExplorationToComplete() {
        const element = await this.page.waitForSelector("div.toast-message", { timeout: 5000 }).catch(() => null);

        if (element) {
            console.log("Journey completed successfully");
        } else {
            throw new Error("Journey did not complete successfully");
        }
    }

    /**
     * Function to verify if the exploration is restarting after getting completed or not.
     */

    async expectTheExplorationToRestart() {
        await this.clickOn(explorationRestartButton);
        await this.page.waitForTimeout(500);
        await this.page.waitForSelector(explorationConversationContent);
        const element = await this.page.$(explorationConversationContent);
        const text = await this.page.evaluate(element => element.textContent, element);
        console.log(text);
        if (text == "Test-revision") {
            showMessage("exploration has restarted successfully")
        } else {
            throw new Error("exploration has not restarted successfully");
        }
    }
}
