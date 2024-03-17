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

const DEFAULT_SPEC_TIMEOUT: number = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationAdm',
      'exploration_creator@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should be able to view, compare, revert, and download revisions',
    async function () {
      await explorationEditor.navigateToCreatorDashboard();
      await explorationEditor.createExploration('Test-revision 1');
      await explorationEditor.addAnInteractionToTheExploration(
        ' End Exploration '
      );
      await explorationEditor.saveExplorationDraft();

      // This block creates a new Revision of the same exploration with changes in metadata.
      await explorationEditor.navigateToSettingsTab();
      await explorationEditor.editExplorationTitle('Test-Revision 2');
      await explorationEditor.navigateToMainTab();
      await explorationEditor.saveExplorationDraft();

      // The following block of code creates an additional revision of the same exploration.
      await explorationEditor.editExplorationContent('Test-Revision 3');
      await explorationEditor.saveExplorationDraft();

      // The following block of code creates an additional revision of the same exploration.
      await explorationEditor.editExplorationContent('Test-Revision 4');
      await explorationEditor.saveExplorationDraft();

      // The following block of code creates an additional revision of the same exploration.
      await explorationEditor.editExplorationContent('Test-Revision 5');
      await explorationEditor.saveExplorationDraft();

      await explorationEditor.navigateToHistoryTab();

      await explorationEditor.expectRevision1ToHave('Version No.');
      await explorationEditor.expectRevision1ToHave('Notes');
      await explorationEditor.expectRevision1ToHave('User');
      await explorationEditor.expectRevision1ToHave('Date');

      await explorationEditor.expectRevision2ToHave('Version No.');
      await explorationEditor.expectRevision2ToHave('Notes');
      await explorationEditor.expectRevision2ToHave('User');
      await explorationEditor.expectRevision2ToHave('Date');

      await explorationEditor.expectRevisionsToBeOrderedBy('Date');
      await explorationEditor.filterRevisionsBySpecificUser('explorationAdm');
      await explorationEditor.expectSpecificUserToHaveNumberOfRevisions(6);

      await explorationEditor.adjustPaginatorToShowRevisionsPerPage();
      await explorationEditor.expectNextPageOfRevisionsButtonToBe('disabled');

      await explorationEditor.compareDifferentRevisions(1, 5);
      await explorationEditor.expectMetadataChangesToIncludeChangesIn('title');
      await explorationEditor.expectDisplayExplorationStateToIncludeChangesIn(
        'content'
      );

      await explorationEditor.downloadRevision(1);
      await explorationEditor.revertRevision(2);
      await explorationEditor.expectSuccessfulReversionOfRevision(5);
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
