

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

module.exports = class e2ePracticeQuestionSubmitter extends baseUser {
  async navigateToContributorDashboard() {
    await this.goto('/contributor-dashboard');
  }
};
