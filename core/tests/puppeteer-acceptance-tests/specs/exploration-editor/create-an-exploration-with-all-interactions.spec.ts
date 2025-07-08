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
 * @fileoverview
 * Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * IO.PP. Partner submits a partnerships application.
 */

import exp from 'constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

describe('Interested Partner Organization', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToEditorTab();
  });

  it('should be able to use "continue button" interaction', async function () {
    // Update the card content.
    await explorationEditor.updateCardContent(
      'This is a "Continue Button" interaction.'
    );
    await explorationEditor.expectCardContentToBe(
      'This is a "Continue Button" interaction.'
    );
    await explorationEditor.expectEditCardContentPencilButtonToBeVisible();

    // Add a new interaction.
    await explorationEditor.addInteraction('Continue Button');
    await explorationEditor.expectInteractionPreviewCardToBeVisible();
    await explorationEditor.expectRemoveInteractionButtonToBeVisible();

    // Update the default response feedback.
    await explorationEditor.updateDefaultResponseFeedbackInExplorationEditorPage(
      "Great! Now let's check other interactions"
    );
    // TODO: Response feedback is displayed in the box.
    // TODO: Pen icon for feedback is still visible.

    // Direct learners to new card.
    await explorationEditor.directLearnersToNewCard('Second Card');
    await explorationEditor.expectCurrentOutcomeDestinationToBe('Second Card');
    await explorationEditor.expectEditOutcomeDestPencilButtonToBeVisible();
    await explorationEditor.expectExplorationGraphToContainCard('Second Card');
  });

  it('should be able to use "multiple choice" interaction', async function () {
    await explorationEditor.navigateToCard('Second Card');

    // Add a multiple choice interaction.
    await explorationEditor.updateCardContent('This is a multiple choice.');
    await explorationEditor.addMultipleChoiceInteraction([
      'Option 1',
      'Option 2',
      'Correct Response',
      'Option 4',
    ]);
    await explorationEditor.expectAddResponseModalHeaderToBe('Add Response');

    // Add responses.
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.MULTIPLE_CHOICE,
      'Correct Response',
      'Great Job!',
      'Third Card',
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    await explorationEditor.addHintToState('Try Google Search.');
    await explorationEditor.expectHintsToConatin('Try Google Search.');
  });

  it('should be able to use "number input" interaction', async function () {
    await explorationEditor.navigateToCard('Third Card');

    // Add a number input interaction.
    await explorationEditor.updateCardContent('Enter number 100.');
    await explorationEditor.expectCardContentToBe('Enter number 100.');
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMBER_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMBER_INPUT,
      '100',
      'Perfect!',
      'Fourth Card',
      true
    );

    await explorationEditor.addSolutionToState(
      '100',
      'As said in the question itself.',
      true
    );
    await explorationEditor.expectSolutionsToContain(
      'One solution is "100". As said in the question itself..'
    );
  });

  it('should be able to use "text input" interaction', async function () {
    await explorationEditor.navigateToCard('Fourth Card');

    // Add a text input interaction.
    await explorationEditor.updateCardContent('Enter text "Hello, Oppia!".');
    await explorationEditor.expectCardContentToBe(
      'Enter text "Hello, Oppia!".'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.TEXT_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.TEXT_INPUT,
      'Hello',
      'Perfect!',
      'Fifth Card',
      true
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
