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
 * @fileoverview Acceptance test from CUJ spreadsheet
 * https://docs.google.com/spreadsheets/d/1IrxN13IC5xwWdAFnGMu_4p3FUlADL4Q0-elZIuTow/
 *
 * LO.11. Play an embedded exploration
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-Out Learner in Embedded Lesson', function () {
  let loggedOutUser: LoggedOutUser;
  let explorationEditor: ExplorationEditor;
  let explorationId: string;

  beforeAll(async function () {
    // Create a new exploration editor user to set up the exploration.
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();

    // Create the first card with a NumberInput interaction.
    await explorationEditor.updateCardContent('Exploración de pruebas');
    await explorationEditor.addInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      false
    );

    // Customize the interaction to allow numeric input.
    await explorationEditor.customizeNumberInputInteraction(true);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '0',
      'Correct!',
      'END',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Please try again!'
    );
    await explorationEditor.saveExplorationDraft();

    await explorationEditor.navigateToCard('END');
    await explorationEditor.updateCardContent('You have completed!');
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await explorationEditor.saveExplorationDraft();

    // Set exploration language to Spanish to verify localization behaviour.
    await explorationEditor.navigateToSettingsTab();
    await explorationEditor.selectLanguage('español (Spanish)');
    await explorationEditor.saveExplorationDraft();

    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Exploración de pruebas',
      'Learn basic counting',
      'Algebra'
    );

    // Create a logged-out user to simulate anonymous learner behavior.
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to play and complete an embedded lesson',
    async function () {
      // Open the embedded exploration player.
      await loggedOutUser.goto(
        `http://localhost:8181/embed/exploration/${explorationId}`
      );

      // Verify UI elements expected in embedded player mode.
      await loggedOutUser.expectCardContentToMatch('Exploración de pruebas');
      await loggedOutUser.expectLanguageDropdownToBePresent();
      await loggedOutUser.expectPageLanguageToMatch('en');

      await loggedOutUser.expectLessonInfoTextToBePresent(false);
      await loggedOutUser.expectVoiceoverBarToBePresent(false);
      await loggedOutUser.expectSignInButtonToBePresent(false);
      await loggedOutUser.expectProgressBarToBePresent(false);
      await loggedOutUser.expectRateOptionsNotAvailable();

      // Screenshot verification.
      await loggedOutUser.expectScreenshotToMatch(
        'lessonPlayerEmbedded',
        __dirname
      );

      // Play until checkpoint.
      await loggedOutUser.submitAnswer('0');
      await loggedOutUser.expectContinueToNextCardButtonToBePresent();
      await loggedOutUser.continueToNextCard();

      // TODO(#24066): Verify checkpoint behavior. Currently, the expected behavior is not observed.

      // Complete lesson.
      // Confetti poppup behavior. Currently, the expected behavior is not observed.
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Post-completion checks.
      await loggedOutUser.expectRateOptionsNotAvailable();
      await loggedOutUser.expectSuggestionSectionToBePresent(false);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should use URL language as site language',
    async function () {
      await loggedOutUser.goto(
        `http://localhost:8181/embed/exploration/${explorationId}`
      );

      // Change the site language using the embedded exploration.
      await loggedOutUser.changeSiteLanguageForEmbeddedExploration('es');

      // Verify Spanish placeholder.
      await loggedOutUser.expectNumberInputPlaceholderToMatch(
        'Ingresa un número'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
