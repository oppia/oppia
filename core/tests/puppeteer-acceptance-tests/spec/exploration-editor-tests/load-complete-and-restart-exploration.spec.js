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
 * @fileoverview Acceptance Test for preview tab in exploration editor.
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const continueInteractionSelector = '.e2e-test-interaction-tile-Continue';
const explorationCompletedMessage = 'div.toast-message';



describe('Exploration Admin', function() {
  let explorationAdmin = null;

  beforeAll(async function() {
    explorationAdmin = await userFactory.createNewExplorationAdmin(
      'explorationAdm', 'exploration_creator@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should be able to load, complete and restart an exploration preview',
    async function() {
      await explorationAdmin.navigateToCreatorDashboard();
      await explorationAdmin.createExploration(
        'Exploration begins', continueInteractionSelector);
      await explorationAdmin.LoadExplorationWithQuestions(2);

      await explorationAdmin.navigateToPreviewTab();
      await explorationAdmin.expectTheExplorationToLoadInPreviewTab(
        'Exploration begins');
      await explorationAdmin.completeTheExplorationInPreviewTab();

      await explorationAdmin.expectTheExplorationToComplete(
        explorationCompletedMessage);
      await explorationAdmin.expectTheExplorationToRestart(
        'Exploration begins');
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
