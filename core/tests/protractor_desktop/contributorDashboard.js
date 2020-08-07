// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the contributor dashboard page.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var ContributorDashboardPage = require(
  '../protractor_utils/ContributorDashboardPage.js');

describe('Contributor Dashboard page', function() {
  var contributorDashboardPage = null;
  var contributorDashboardTranslateTextTab = null;

  beforeAll(async function() {
    contributorDashboardPage = (
      new ContributorDashboardPage.ContributorDashboardPage());
    contributorDashboardTranslateTextTab = (
      contributorDashboardPage.getTranslateTextTab());
  });

  beforeEach(async function() {
    await browser.get('/contributor-dashboard');
    await waitFor.pageToFullyLoad();
    await contributorDashboardPage.navigateToTranslateTextTab();
  });

  it('should allow user to switch to translate text tab', async function() {
    await contributorDashboardTranslateTextTab.changeLanguage('Hindi');
    await contributorDashboardTranslateTextTab.expectSelectedLanguageToBe(
      'Hindi');
  });

  describe('featured languages', () => {
    beforeAll(async function() {
      await users.createAndLoginAdminUser(
        'config@contributorDashboard.com', 'contributorDashboard');
      const adminPage = new AdminPage.AdminPage();
      await adminPage.editConfigProperty(
        'Featured Translation Languages',
        'List',
        async function(elem) {
          const featured = await elem.addItem('Dictionary');
          await (await featured.editEntry(0, 'Unicode')).setValue('fr');
          await (await featured.editEntry(1, 'Unicode'))
            .setValue('Partnership with ABC');
        });
      await users.logout();
    });

    it('should show correct featured languages', async function() {
      await contributorDashboardTranslateTextTab
        .expectFeaturedLanguagesToBe(['French']);
    });

    it('should show correct explanation', async function() {
      await contributorDashboardTranslateTextTab
        .mouseoverFeaturedLanguageTooltip(0);
      await contributorDashboardTranslateTextTab
        .expectFeaturedLanguageExplanationToBe('Partnership with ABC');
    });
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
