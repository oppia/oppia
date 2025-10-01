// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for download any version of the exploration from the history tab.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

describe('Exploration Creator', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );
    // Navigate to the creator dashboard and create a new exploration.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();

    await explorationEditor.createMinimalExploration(
      'Content',
      INTERACTION_TYPES.END_EXPLORATION
    );

    await explorationEditor.saveExplorationDraft();

    await explorationEditor.updateCardContent('Modified version 3 ');
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.updateCardContent('Modified version 4 ');
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.updateCardContent('Modified version 5 ');
    await explorationEditor.saveExplorationDraft();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should download any version of Exploration',
    async function () {
      // Navigate to the history tab, .
      await explorationEditor.navigateToHistoryTab();
      // Before publishing, the Exploration zip file name would be
      // oppia-unpublished_exploration-v{versionNumber}.zip or
      // oppia-unpublished_exploration-v{versionNumber} (numberOfDownloadsSameFile).zip.
      await explorationEditor.downloadExploration(5, false);
      await explorationEditor.downloadExploration(2, false);
      // Publish Exploration.
      await explorationEditor.publishExplorationWithMetadata(
        'Publish with an interaction',
        'This is the goal of exploration.',
        'Algebra'
      );
      // After publishing, the Exploration zip file name would be
      // oppia-{explorationTitle}-v{versionNumber}.zip or
      // oppia-{explorationTitle}-v{versionNumber} (numberOfDownloadSameFile).zip .
      await explorationEditor.downloadExploration(5, true);
      await explorationEditor.downloadExploration(2, true);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
