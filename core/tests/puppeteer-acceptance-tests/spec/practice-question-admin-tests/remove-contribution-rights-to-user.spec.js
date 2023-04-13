// created 4/12/23 Acceptance Testing for Oppia
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

describe('Practice Question Reviewer', function () {
    const ROLE_CURRICULUM_ADMIN = 'curriculum admin';
    const ROLE_CONTRIBUTER_DASHBOARD_ADMIN = 'contributor dashboard admin';
    let superAdmin = null;
    let contribDashboardAdmin = null;

    beforeAll(async function () {
        superAdmin = await userFactory.createNewSuperAdmin('superAdm');
        contribDashboardAdmin = await userFactory.createNewPracticeQuestionAdmin('contribAdm');
    }, DEFAULT_SPEC_TIMEOUT);

    it('should remove question reviewer/submission rights to users',
        async function () {
            const testerUser1 = await userFactory.createNewGuestUser(
                'Tester', 'admin.tester@example.com');

            // remove question submission rights from testerUser1
            contribDashboardAdmin.removeReviewQuestionRights('Tester');

            // check if successfully updated
            contribDashboardAdmin.expectUserToNotHaveRight('Tester', 'contributer');

            // remove question review rights from testerUser1
            contribDashboardAdmin.removeSubmitQuestionRights('Tester');

            // check if successfully updated
            contribDashboardAdmin.expectUserToNotHaveRight('Tester', 'reviewer');

            // see if testerUser1 can access submit question tab and review questions tab
            testerUser1.expectNoSubmitQuestionTab();
            testerUser1.expectNoReviewQuestionTab();
        })

    afterAll(async function () {
        await userFactory.closeAllBrowsers();
    })
})