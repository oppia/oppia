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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * EE. Learner can complete the embedded lesson
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

/**
 * @fileoverview Acceptance Test for checking if a learner can play an
 * exploration in an embedded lesson
 */

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
    'should be able to play an embedded lesson',
    async function () {
      // Open the embedded exploration player.
      await loggedOutUser.goto(
        `http://localhost:8181/embed/exploration/${explorationId}`
      );

      // Verify UI elements expected in embedded player mode.
      await loggedOutUser.expectCardContentToMatch('Exploración de pruebas');
      await loggedOutUser.expectLanguageDropdownToBePresent();
      await loggedOutUser.expectLessonInfoTextToBePresent(false);
      await loggedOutUser.expectVoiceoverBarToBePresent(false);
      await loggedOutUser.expectSignInButtonToBePresent(false);
      await loggedOutUser.expectProgressBarToBePresent(false);

      // Ensure visual regression snapshot matches expected UI.
      await loggedOutUser.expectScreenshotToMatch(
        'lessonPlayerEmbedded',
        __dirname
      );

      // Submit correct answer to move to next card.
      await loggedOutUser.submitAnswer('0');
      await loggedOutUser.expectContinueToNextCardButtonToBePresent();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should be able to complete the embedded lesson, but not rate the exploration',
    async function () {
      // Complete the exploration and expect completion toast message.
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Logged-out users should not see rating options or suggestion section.
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

      // Change the site language using the embedded exploration URL parameter.
      await loggedOutUser.changeSiteLanguageForEmbeddedExploration('es');

      // Verify Spanish placeholder appears in number input interaction.
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
