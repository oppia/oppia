// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * LC.1. Create a basic exploration.
 */
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
describe('Lesson Creator', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'ExpEditor1',
      'expeditor1@example.com'
    );
  });

  it(
    'should create a new exploration',
    async function () {
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();
      await explorationEditor.expectToBeInCreatorDashboard();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should generate warning message if card height limit is exceeded',
    async function () {
      await explorationEditor.updateStateName('1 - Intro');
      await explorationEditor.saveExplorationDraft('Renamed initial card');

      await explorationEditor.expectStateNameToBe('1 - Intro');
      await explorationEditor.expectExplorationGraphToContainCard('1 - Intro');

      const questionText = 'What is the capital of France?';
      await explorationEditor.updateCardContent(questionText);
      await explorationEditor.expectCardContentToBe(questionText);

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectPreviewCardContentToBe(
        '1 - Intro',
        questionText
      );

      await explorationEditor.navigateToEditorTab();
      await explorationEditor.expectCardContentToBe(questionText);

      const longContent = Array.from(
        {length: 15},
        (_, i) => `Line ${i + 1}`
      ).join('\n');

      await explorationEditor.updateCardContent(longContent);

      await explorationEditor.expectCardHeightLimitWarningToBeVisible();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show warning when there are 50 unsaved changes',
    async function () {
      await explorationEditor.saveExplorationDraft();

      for (let i = 1; i <= 50; i++) {
        await explorationEditor.updateCardContent(`Content ${i}`);
      }

      await explorationEditor.expectSaveRecommendationModalToBeVisible();
      await explorationEditor.saveExplorationDraftFromSaveRecommendationModal();
      await explorationEditor.expectSaveDraftButtonToBeDisabled(true);
    },
    50 * 60 * 1000 // Test takes longer that 35 minutes.
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
