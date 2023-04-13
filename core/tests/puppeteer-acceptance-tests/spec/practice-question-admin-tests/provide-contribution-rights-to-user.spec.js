// created 4/2/23 Acceptance Testing for Oppia
// Testing user story for Practice Question Admin
// 
/**
 * @fileoverview Acceptance Test for Practice Question Admin
 */

const userFactory = require(
    '../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
    '../puppeteer-testing-utilities/test-constants.js');
const showMessage = require(
    '../puppeteer-testing-utilities/show-message-utils.js');
const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

/** TODO: This test should be done without the need of super admin, as
* practice question admin must be able to revoke question reviewer role of other users from the
* /contributer-dashboard-admin page. But this is not the case now, only super admin can do this
*/
describe('Practice Question Reviewer', function () {
    const ROLE_CURRICULUM_ADMIN = 'curriculum admin';
    const ROLE_CONTRIBUTER_DASHBOARD_ADMIN = 'contributer dashboard admin';
    let superAdmin = null;
    let contribDashboardAdmin = null;

    beforeAll(async function () {
        superAdmin = await userFactory.createNewSuperAdmin('superAdm');
        contribDashboardAdmin = await userFactory.createNewPracticeQuestionAdmin('contribAdm');
    }, DEFAULT_SPEC_TIMEOUT);

    it('should assign question reviewer/submission rights to users',
        async function () {
            const testerUser1 = await userFactory.createNewGuestUser(
                'Tester', 'admin.tester@example.com');

            // add question submission rights to testerUser1
            contribDashboardAdmin.addSubmitQuestionRights('Tester');
            // check if successfully updated
            contribDashboardAdmin.expectUserToHaveContributionRight('Tester', 'contributor');
            // add question review rights to testerUser 1
            contribDashboardAdmin.addReviewQuestionRights('Tester');
            // check if successfully added
            contribDashboardAdmin.expectUserToHaveContributionRight('Tester', 'reviewer');

            //go to submit question tab on contributer-dashboard page as tester user
            testerUser1.navigateToSubmitQuestionsTab();
            // got to review questions tab
            testerUser1.navigateToReviewQuestionsTab();

        })

    afterAll(async function () {
        await userFactory.closeAllBrowsers();
    });
});