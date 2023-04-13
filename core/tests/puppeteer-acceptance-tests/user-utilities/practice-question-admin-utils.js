// created 4.2.23
/**
 * @fileoverview Practice Question Admin users utility file
 */
const baseUser = require(
    '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
    '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
    '../puppeteer-testing-utilities/show-message-utils.js');

const testUserName = 'Tester';
const contributerDashboardUrl = testConstants.URLs.ContributerDashboard;
const contributerDashboardAdminUrl = testConstants.URLs.ContributerDashboardAdminUrl;
const AdminUrl = testConstants.URLs.AdminPage;

// idk if these variables are correct or applicable here
// taken form /tests/webdriverio_utils/ContributerDashboardAdminPage.js
//var addContributionRightsForm = 'textarea.e2e-test-add-contribution-rights-form';
//var viewContributionRightsForm = $('.e2e-test-view-contribution-rights-form');

//var contributorUsernameCss = '.e2e-test-form-contributor-username';
//var categorySelectCss = '.e2e-test-form-contribution-rights-category-select';
//var contributionRightsFormSubmitButtonCss = ('.e2e-test-contribution-rights-form-submit-button');

const LABEL_SUBMIT_QUESTION_RIGHT_BUTTON = 'SUBMIT_QUESTION';
const LABEL_REVIEW_QUESTION_RIGHT_BUTTON = 'REVIEW_QUESTION';
const LABEL_ENTER_USERNAME_BUTTON = 'Enter User Name';
const LABEL_ADD_RIGHTS_BUTTON = 'Add Rights';
const LABEL_REMOVE_RIGHTS_BUTTON = 'Remove Rights';
// const addRightsButton = 'button.e2e-test-contribution-rights-form-submit-button'
// const removeRightsButton = 'button.e2e-test-contribution-rights-form-submit-button'

module.exports = class e2ePracticeQuestionAdmin extends baseUser {
    /**
     * Navigate to contributer dashboard
     */
    async navigateToContributerDashboardPage() {
        await this.goto(contributerDashboardUrl);
    }
    /**
     * Function for adding submit question rights
     * @param {string} username - username of user to add rights too
     */
    async addSubmitQuestionRights(username) {
        await this.goto(contributerDashboardAdminUrl);
        // type in username
        await this.type('e2e-test-add-reviewer-form.input#label-target-form-reviewer-username', username);
        // select submit question right
        await this.page.select(
            'select#label-target-form-review-category-select',
            LABEL_SUBMIT_QUESTION_RIGHT_BUTTON);
        await this.clickOn(addRightsButton);
        showMessage('Successfully added submit question rights');
    }
    /**
     * Function for adding review question rights
     * @param {string} username - username of user to add rights too
     */
    async addReviewQuestionRights(username) {
        // wait for selector?
        await this.goto(contributerDashboardAdminUrl);
        await this.type('e2e-test-add-reviewer-form.input#label-target-form-reviewer-username', username);
        // select form for correct question rights
        await this.page.select(
            'select#label-target-form-review-category-select',
            LABEL_REVIEW_QUESTION_RIGHT_BUTTON);

        await this.clickOn(LABEL_ADD_RIGHTS_BUTTON);
        showMessage('Successfully added review question rights');
    }

    /**
     * Function for removing submit question rights
     * @param {string} username - username of user to remove rights from
     */
    async removeSubmitQuestionRights(username) {
        await this.goto(contributerDashboardAdminUrl);
        await this.type('e2e-test-remove-reviewer-form.input#label-target-form-reviewer-username', username);
        await this.page.select(
            'select#label-target-form-review-category-select',
            LABEL_SUBMIT_QUESTION_RIGHT_BUTTON);

        await this.clickOn(LABEL_REMOVE_RIGHTS_BUTTON);
        showMessage('Successfully removed submit question rights');
    }

    /**
     * Function for removing review question rights
     * @param {string} username - username of user to remove rights from
     */
    async removeReviewQuestionRights(username) {
        await this.goto(contributerDashboardAdminUrl);
        await this.type('e2e-test-remove-reviewer-form.input#label-target-form-reviewer-username', username);
        await this.page.select(
            'select#label-target-form-review-category-select',
            LABEL_REVIEW_QUESTION_RIGHT_BUTTON);

        await this.clickOn(LABEL_REMOVE_RIGHTS_BUTTON);
        showMessage('Successfully removed review question rights');
    }

    /**
    * This function navigates to the Review Questions tab in the contributer-dashbaord.
    */
    async navigateToReviewQuestionsTab() {
        await this.goto(contributerDashboardUrl);
        await this.clickOn('Review Questions');
        showMessage('Navigated to rewiew questions tab.');
    }

    /**
    * This function navigates to the Submit Questions tab in the blog-dashboard.
    */
    async navigateToSubmitQuestionsTab() {
        await this.goto(contributerDashboardUrl);
        await this.clickOn('Submit Questions');
        showMessage('Navigated to submit questions tab.');
    }

    /**
     * Functions to check if user role has been correctly assigned or removed
     */
    async expectUserToHaveContributionRight(username, role) {
        const currentURL = this.page.url();
        await this.goto(contributerDashboardAdminUrl);
        await this.page.select(
            'select#label-target-view-reviewer-method',
            'By Username'
        )
        await this.type('input#e2e-test-form-contributer-username', username);
        await this.clickOn('View Role');

        //await this.page.waitForSelector('div.justify-content-between');
        await this.page.evaluate(() => {
            tableElement = document.getElementsByClassName(`e2e-test-question-${role}`);
            if (tableElement == 'Allowed') {
                return;
            }
            throw new Error(`User does not have the ${role} question right!`);
        });

        showMessage(`User has ${role} Question Right!`);
        await this.goto(currentURL);
    }

    async expectUserToNotHaveRight(username, role) {
        const currentURL = this.page.url();
        await this.goto(contributerDashboardAdminUrl);
        await this.page.select(
            'select#label-target-view-reviewer-method',
            'By Username'
        )
        await this.type('input#e2e-test-form-contributer-username', username);
        await this.clickOn('View Role');

        await this.page.evaluate(() => {
            tableElement = document.getElementsByClassName(`e2e-test-question-${role}`);
            if (tableElement == 'Not-allowed') {
                return;
            }
            throw new Error(`User has the ${role} question right!`);
        });

        showMessage(`User does not have ${role} Question Right!`);
        await this.goto(currentURL);
    }

    async expectNoSubmitQuestionTab() {
        const element = document.querySelector('[aria-label="See opportunities for adding new questions."]');

        const isInvisible = element.style.display === 'none' || element.style.visibility === 'hidden' || element.offsetParent === null;

        if (!isInvisible) {
            throw new Error('The submit questions right has not been properly removed.');
        }

        showMessage('User successfully cannot see Submit Question Tab.');
    }

    async expectNoReviewQuestionTab() {
        const element = document.querySelector('.oppia-contributions-show-review-side-navbar-container')

        const isInvisible = element.style.display === 'none' || element.style.visibility === 'hidden' || element.offsetParent === null;

        if (!isInvisible) {
            throw new Error('The review questions right has not been properly removed.');
        }

        showMessage('User successfully cannot see Review Question Tab.')
    }
}

