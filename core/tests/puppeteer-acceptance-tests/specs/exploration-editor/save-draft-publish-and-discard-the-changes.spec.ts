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
 * @fileoverview Acceptance Test for saving drafts, publishing, and discarding changes.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  END_EXPLORATION = 'End Exploration',
}

describe('Exploration Creator', function () {
  let explorationEditor: ExplorationEditor;
  let explorationVisitor: LoggedInUser;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    explorationVisitor = await UserFactory.createNewUser(
      'explorationVisitor',
      'exploration_visitor@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should draft, discard and publish the changes',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();

      await explorationEditor.createMinimalExploration(
        'Exploration intro text',
        INTERACTION_TYPES.END_EXPLORATION
      );

      await explorationEditor.saveExplorationDraft();
      explorationId = await explorationEditor.publishExplorationWithMetadata(
        'Old Title',
        'This is the goal of exploration.',
        'Algebra'
      );

      await explorationVisitor.expectExplorationToBeAccessibleByUrl(
        explorationId
      );

      await explorationEditor.navigateToSettingsTab();

      await explorationEditor.updateTitleTo('New Title');
      await explorationEditor.discardCurrentChanges();
      await explorationEditor.expandSettingsTabSection('Basic Settings');
      await explorationEditor.expectTitleToBe('Old Title');

      await explorationEditor.updateTitleTo('New Title');
      await explorationEditor.saveExplorationDraft();
      await explorationEditor.expectTitleToBe('New Title');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should generate warning message if card height limit is exceeded',
    async function () {
      await explorationEditor.navigateToEditorTab();
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
      await explorationEditor.discardCurrentChanges();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should discard drafts and create Second and Final cards',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();

      await explorationEditor.updateCardContent('Old content');
      await explorationEditor.saveExplorationDraft('First edit');

      await explorationEditor.updateCardContent('New Content');
      await explorationEditor.discardCurrentChanges();
      await explorationEditor.expectCardContentToBe('Old content');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should update first card and validate preview content',
    async function () {
      await explorationEditor.updateStateName('First');
      await explorationEditor.saveExplorationDraft('Renamed initial card');

      await explorationEditor.expectStateNameToBe('First');

      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard('Second');
      await explorationEditor.expectCurrentOutcomeDestinationToBe('Second');

      await explorationEditor.navigateToCard('Second');
      await explorationEditor.updateCardContent('This is the second card.');

      await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await explorationEditor.viewOppiaResponses();
      await explorationEditor.directLearnersToNewCard('Final');
      await explorationEditor.expectCurrentOutcomeDestinationToBe('Final');

      await explorationEditor.expectExplorationGraphToContainCard('Final');

      await explorationEditor.navigateToCard('Final');
      await explorationEditor.updateCardContent('Final Card');
      await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

      await explorationEditor.saveExplorationDraft(
        'Created Second and Final cards'
      );

      await explorationEditor.expectExplorationGraphToContainCard('First');
      await explorationEditor.expectExplorationGraphToContainCard('Second');
      await explorationEditor.expectExplorationGraphToContainCard('Final');
      await explorationEditor.navigateToSettingsTab();
      await explorationEditor.selectFirstCard('Second');
      await explorationEditor.reloadPage();
      await explorationEditor.waitForPageToFullyLoad();
      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectPreviewCardContentToBe(
        'Second',
        'This is the second card.'
      );
    },
    10 * 60 * 1000
  );

  it(
    'should remove an existing state and save exploration draft',
    async function () {
      await explorationEditor.navigateToEditorTab();

      await explorationEditor.deleteState('First');
      await explorationEditor.saveExplorationDraft();

      await explorationEditor.expectExplorationGraphToNotContainCard('First');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should show warning when there are 50 unsaved changes',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
      await explorationEditor.navigateToEditorTab();
      await explorationEditor.page.keyboard.press('Escape');
      await explorationEditor.updateCardContent('Initial content');
      await explorationEditor.saveExplorationDraft();

      for (let i = 1; i <= 50; i++) {
        await explorationEditor.updateCardContent(`Content ${i}`);
      }

      await explorationEditor.expectSaveRecommendationModalToBeVisible();
      await explorationEditor.saveExplorationDraftFromSaveRecommendationModal();
      await explorationEditor.expectSaveDraftButtonToBeDisabled(true);
    },
    50 * 60 * 1000
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
