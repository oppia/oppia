// Copyright 2023 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use explorationEditor file except in compliance with the License.
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

import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {ExplorationEditor} from '../../user-utilities/exploration-editor-utils';

const DEFAULT_SPEC_TIMEOUT_MSECS: number =
  testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const DATE: string = 'Date';
enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.createExplorationWithContentAndInteraction(
      'Solar System Exploration',
      INTERACTION_TYPES.END_EXPLORATION
    );

    // Create multiple revisions.
    await explorationEditor.updateCardContent(
      'In this exploration, we will learn about the planets in our solar system.'
    );
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.updateCardContent(
      'In this exploration, we will learn about the planets and moons in our solar system.'
    );
    await explorationEditor.saveExplorationDraft();

    // Create a new revision with metadata changes.
    await explorationEditor.navigateToSettingsTab();
    await explorationEditor.updateExplorationTitle(
      'Solar System Exploration - Revision 5'
    );
    await explorationEditor.navigateToMainTab();
    await explorationEditor.saveExplorationDraft();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to view, compare, download, and revert exploration revisions',
    async function () {
      await explorationEditor.navigateToHistoryTab();

      // Check properties of revisions.
      await explorationEditor.expectRevisionToHave(1, [
        'Version No.',
        'Notes',
        'User',
        'Date',
      ]);
      await explorationEditor.expectRevisionToHave(2, [
        'Version No.',
        'Notes',
        'User',
        'Date',
      ]);

      // Check order of revisions and filter by user.
      await explorationEditor.expectRevisionsToBeOrderedBy(DATE);
      await explorationEditor.filterRevisionsByUser('explorationEditor');
      await explorationEditor.expectNumberOfRevisions(5);

      // Adjust paginator and select revisions for comparison.
      await explorationEditor.adjustPaginatorToShowRevisionsPerPage(15);
      await explorationEditor.expectNextPageOfRevisionsButtonToBe('disabled');

      // Select two revisions for comparison and verify changes in metadata and state.
      await explorationEditor.selectTwoRevisionsForComparison(1, 5);
      await explorationEditor.expectMetadataChangesInProperties(['title']);
      await explorationEditor.expectStateChangesInProperties(['html']);
      await explorationEditor.resetComparisonResults();

      // Download and revert revisions.
      await explorationEditor.downloadRevision(1);
      await explorationEditor.revertToVersion(2);
      await explorationEditor.expectReversionToVersion(2);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
