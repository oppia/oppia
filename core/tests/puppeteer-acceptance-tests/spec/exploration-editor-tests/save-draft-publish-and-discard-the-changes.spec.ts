// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for savedraft, publish and discard the changes.
 */

import {showMessage} from '../../puppeteer-testing-utilities/show-message-utils';
import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {ExplorationEditor} from '../../user-utilities/exploration-editor-utils';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

describe('Exploration Creator', function () {
  let explorationEditor: ExplorationEditor;
  let explorationVisitor: ExplorationEditor;
  let explorationId: string | null;
  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );
    showMessage('explorationEditor is signed up successfully.');

    explorationVisitor = await UserFactory.createNewUser(
      'explorationVisitor',
      'exploration_visitor@example.com'
    );
    showMessage('explorationVisitor is signed up successfully.');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should draft, discard and publish the changes',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorPage();
      await explorationEditor.dismissWelcomeModal();

      await explorationEditor.createMinimalExploration(
        'Exploration intro text',
        INTERACTION_TYPES.END_EXPLORATION
      );

      await explorationEditor.saveExplorationDraft();
      explorationId = await explorationEditor.publishExplorationWithMetadata(
        'Old Title',
        'OppiaAcceptanceTestsCheck',
        'Algebra'
      );

      await explorationVisitor.expectExplorationToBeAccessibleByUrl(
        explorationId
      );

      await explorationEditor.navigateToSettingsTab();

      await explorationEditor.updateTitleTo('New Title');
      await explorationEditor.discardCurrentChanges();
      await explorationEditor.expectTitleToBe('Old Title');

      await explorationEditor.updateTitleTo('New Title');
      await explorationEditor.saveExplorationDraft();
      await explorationEditor.expectTitleToBe('New Title');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
