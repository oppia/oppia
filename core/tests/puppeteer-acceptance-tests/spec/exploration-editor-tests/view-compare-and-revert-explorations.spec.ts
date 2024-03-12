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

import { UserFactory } from
  '../../puppeteer-testing-utilities/user-factory';
import testConstants from
  '../../puppeteer-testing-utilities/test-constants';
import { ExplorationEditor } from '../../user-utilities/exploration-editor-utils';

const DEFAULT_SPEC_TIMEOUT: number = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Exploration Editor', function() {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function() {
    explorationEditor = await UserFactory.createNewUser(
      'explorationAdm', 'exploration_creator@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should be able to view, compare, revert, and download revisions',
    async function() {
      await explorationEditor.navigateToCreatorDashboard();
      await explorationEditor.createExploration(
        'Test-revision', ' End Exploration ');
      await explorationEditor.createMultipleRevisionsOfTheSameExploration(
        'Test-revision', 13);

      await explorationEditor.navigateToHistoryTab();
      await explorationEditor.
        expectlatestRevisionToHaveVersionNoNotesUsernameDate();
      await explorationEditor.expectRevisionsToBeOrderedByDate();
      await explorationEditor.filterRevisionsByUsername('explorationAdm');
      await explorationEditor.ExpectPaginatorToChangeItemsPerPage(15);

      await explorationEditor.compareDifferentRevisions();
      await explorationEditor.expectCompareToDisplayMetadataChanges();
      await explorationEditor.expectCompareToDisplayExplorationStateChanges();
      await explorationEditor.downloadAndRevertRevision();
      await explorationEditor.expectSuccessfulReversionOfRevision();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await UserFactory.closeAllBrowsers();
  });
});
