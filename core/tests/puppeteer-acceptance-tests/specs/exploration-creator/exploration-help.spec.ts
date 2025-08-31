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
 * EC. Help.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
  });

  it('should be able to visit exploration help tab', async function () {
    await explorationEditor.clickOnHelpButton();
    await explorationEditor.expectHelpModalTitleToBe('Need Help?');
  });

  it('should be able to visit help center', async function () {
    await explorationEditor.expectHelpCenterButtonToWorkProperly();
  });

  it('should be able to take a tour of the exploration editor', async function () {
    await explorationEditor.clickOnHelpButton();
    await explorationEditor.clickOnTakeATourButton();

    await explorationEditor.expectJoyrideTitleToBe('Creating in Oppia');
    await explorationEditor.expectJoyrideContentToContain(
      'Explorations are learning experiences that you create using Oppia'
    );
    await explorationEditor.expectJoyridePreviousButtonToBeVisible(false);

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Content');
    await explorationEditor.expectJoyrideContentToContain(
      "An Oppia exploration is divided into several 'cards'."
    );

    // Check previous button.
    await explorationEditor.continueToPreviousJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Creating in Oppia');
    await explorationEditor.continueToNextJoyrideStep();

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Interaction');
    await explorationEditor.expectJoyrideContentToContain(
      "After you've written the content of your conversation, choose an interaction type"
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Responses');
    await explorationEditor.expectJoyrideContentToContain(
      "After the learner uses the interaction you created, it's your turn again to choose how your exploration will respond to their input."
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Preview');
    await explorationEditor.expectJoyrideContentToContain(
      'Tap on this "Options" dropdown to access the Preview option and play through your exploration.'
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Save');
    await explorationEditor.expectJoyrideContentToContain(
      'When you\'re done making changes, tap the "Save Draft" button to save your work.'
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Tutorial Complete');
    await explorationEditor.expectJoyrideContentToContain(
      'Now for the fun part...'
    );

    await explorationEditor.expectJoyrideNextButtonToBeVisible(false);
    await explorationEditor.expectJoyrideDoneButtonToBeVisible(true);
    await explorationEditor.finishJoyride();
  });

  it('should be able to take a tour of translations tab', async function () {
    await explorationEditor.clickOnHelpButton();
    await explorationEditor.clickOnTakeATranslationsTourButton();
    await explorationEditor.dismissTranslationTabWelcomeModal();

    await explorationEditor.expectJoyrideTitleToBe('Translations In Oppia');
    await explorationEditor.expectJoyrideContentToContain(
      'Hello, welcome to the Translation Tab!'
    );
    await explorationEditor.expectJoyridePreviousButtonToBeVisible(false);

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Choose Language');
    await explorationEditor.expectJoyrideContentToContain(
      'Start your translation by choosing the language that you want to translate to.'
    );

    // Add a small delay before trying to click the Previous button in mobile mode
    await explorationEditor.page.waitForTimeout(1000);
    // Wait for Previous button to be both visible and clickable
    await explorationEditor.page.waitForSelector(
      '.joyride-step__prev-container .joyride-button',
      {visible: true}
    );
    await explorationEditor.continueToPreviousJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Translations In Oppia');
    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Choose Language');

    await explorationEditor.continueToNextJoyrideStep();
    // In mobile mode, the tour skips the "Choose a Card to Translate" step
    // (translationTabStatusGraph) since the status graph is only visible on desktop,
    // and goes directly to the card options step
    await explorationEditor.expectJoyrideTitleToBe(
      'Choose a Part of the Card to Translate'
    );
    await explorationEditor.expectJoyrideContentToContain(
      'Next, choose a part of the lesson card to translate.'
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe(
      'Choose a Part of the Card to Translate'
    );
    await explorationEditor.expectJoyrideContentToContain(
      'Next, choose a part of the lesson card to translate.'
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Recording Audio');
    await explorationEditor.expectJoyrideContentToContain(
      'To create audio translations in Oppia, we recommend using the  button to upload audio files from your computer.'
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Re-record/Re-upload audio');
    await explorationEditor.expectJoyrideContentToContain(
      'The audio recording also has options related to updating and deleting translations'
    );

    await explorationEditor.continueToNextJoyrideStep();
    await explorationEditor.expectJoyrideTitleToBe('Tutorial Complete');
    await explorationEditor.expectJoyrideContentToContain(
      'Now, you are ready to begin adding translations to your explorations!'
    );

    await explorationEditor.expectJoyrideNextButtonToBeVisible(false);
    await explorationEditor.expectJoyrideDoneButtonToBeVisible(true);

    await explorationEditor.finishJoyride();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
