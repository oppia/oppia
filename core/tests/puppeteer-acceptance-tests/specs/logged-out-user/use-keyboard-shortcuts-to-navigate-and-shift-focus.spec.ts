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
 * @fileoverview Acceptance tests for keyboard navigation and focus shifting.
 * Tests cover the usage of keyboard shortcuts for navigation and ensuring the correct element is focused.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const CONCEPT_CARD_CONTENT_EN = 'Numbers can be positive, negative, or zero.';
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  CONCEPT_CARD = 'Concept Card',
  FINAL_CARD = 'Final Card',
}

// This console would occur as we are try to access some of the pages only accessible to logged-in users being logged-out.
ConsoleReporter.setConsoleErrorsToIgnore([/.*401.*Unauthorized.*/]);

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning numbers today.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.CONCEPT_CARD);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and add concept content.
    await explorationEditor.navigateToCard(CARD_NAME.CONCEPT_CARD);
    await explorationEditor.updateCardContent(CONCEPT_CARD_CONTENT_EN);
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have learnt positive numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.publishExplorationWithMetadata(
      'Positive Numbers',
      'Learn positive numbers.',
      'Algebra'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate the site using keyboard shortcuts, check focus, and interact with the exploration player.',
    async function () {
      // Navigate to the Get Started page using the ‘Ctrl+6’ shortcut.
      await loggedOutUser.simulateKeyboardShortcut('Control+Digit6');
      await loggedOutUser.expectToBeOnPage('get started');

      // Navigate to the About page using the ‘Ctrl+4’ shortcut.
      await loggedOutUser.simulateKeyboardShortcut('Control+Digit4');
      await loggedOutUser.expectToBeOnPage('about');

      // Navigate to the Preferences page (Can't because logged-out, so will be navigated to login page) using the ‘Ctrl+5’ shortcut.
      await loggedOutUser.simulateKeyboardShortcut('Control+Digit5');
      await loggedOutUser.expectToBeOnPage('login');

      // Navigate to the learner-dashboard page (Can't because logged-out, so will be navigated to login page) using the ‘Ctrl+2’ shortcut.
      await loggedOutUser.simulateKeyboardShortcut('Control+Digit2');
      await loggedOutUser.expectToBeOnPage('login');

      // Navigate to the creator-dashboard page (Can't because logged-out, so will be navigated to login page) using the ‘Ctrl+3’ shortcut.
      await loggedOutUser.simulateKeyboardShortcut('Control+Digit3');
      await loggedOutUser.expectToBeOnPage('login');

      // Navigate to the Community Library page using the ‘Ctrl+1’ shortcut.
      await loggedOutUser.simulateKeyboardShortcut('Control+Digit1');
      await loggedOutUser.expectToBeOnPage('community library');

      // Expects the focus to be on Search bar in the Community Library page.
      await loggedOutUser.verifyFocusAfterShortcut('/');

      // Skips to the main content.
      await loggedOutUser.verifyFocusAfterShortcut('s');

      // Expects the focus to be on category dropdown in the Community Library page.
      await loggedOutUser.verifyFocusAfterShortcut('c');

      await loggedOutUser.searchForLessonInSearchBar('Positive Numbers');
      await loggedOutUser.playLessonFromSearchResults('Positive Numbers');

      // Skips to the main content.
      await loggedOutUser.verifyFocusAfterShortcut('s');

      await loggedOutUser.continueToNextCard();

      // Expects the focus to be on the back button in lesson player.
      await loggedOutUser.verifyFocusAfterShortcut('j');

      // Expects the focus to be on the continue or next button in lesson player.
      await loggedOutUser.verifyFocusAfterShortcut('k');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
