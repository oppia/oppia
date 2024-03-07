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
 * @fileoverview Acceptance Test for history tab in exploration editor.
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;
const endInteractionSelector = '.e2e-test-interaction-tile-EndExploration';
const versionNumber = '.e2e-history-table-index';
const notes = '.e2e-test-history-table-message';
const userName = '.e2e-test-history-table-profile';
const date = '.e2e-test-history-tab-commit-date';

describe('Exploration Admin', function() {
  let explorationAdmin = null;

  beforeAll(async function() {
    explorationAdmin = await userFactory.createNewExplorationAdmin(
      'explorationAdm', 'exploration_creator@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should be able to view, compare, revert, and download revisions',
    async function() {
      await explorationAdmin.navigateToCreatorDashboard();
      await explorationAdmin.createExploration(
        'Test-revision', endInteractionSelector);
      await explorationAdmin.createMultipleRevisionsOfTheSameExploration(
        'Test-revision', 13);

      await explorationAdmin.navigateToHistoryTab();
      await explorationAdmin.expectRevisionsToHave(
        versionNumber, notes, userName, date);
      await explorationAdmin.expectRevisionsToBeOrderedByDate();
      await explorationAdmin.filterRevisionsByUsername('explorationAdm');
      await explorationAdmin.ExpectPaginatorToChangeItemsPerPage(15);

      await explorationAdmin.compareDifferentRevisions();
      await explorationAdmin.expectCompareToDisplayMetadataChanges();
      await explorationAdmin.expectCompareToDisplayExplorationStateChanges();
      await explorationAdmin.downloadAndRevertRevision();
      await explorationAdmin.expectSuccessfulReversionOfRevision();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
