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
 * EL.CL. Learner can play a complete community lesson.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;
const CARD_NAMES = {
  FIRST_CARD: 'Introduction',
  SECOND_CARD: '2nd Card',
  THIRD_CARD: 'Last Card',
};

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let explorationEditor: ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin;
  let explorationId: string | null;

  beforeAll(async function () {
    loggedOutLearner = await UserFactory.createLoggedOutUser();

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Introduction to Oppia', 'intro-oppia');
    await curriculumAdmin.createSkillForTopic('Math', 'Introduction to Oppia');

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    // Create a new exploration "What are the place values?" using the
    // exploration editor user.
    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent('Introduction to Fractions');
    await explorationEditor.addInteraction('Continue Button');
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAMES.SECOND_CARD);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the second card and update its content.
    await explorationEditor.navigateToCard(CARD_NAMES.SECOND_CARD);
    await explorationEditor.addExplorationDescriptionContainingAllRTEComponents();
    await explorationEditor.saveExplorationDraft();
    await explorationEditor.addInteraction('Fraction Input');
    await explorationEditor.addResponsesToTheInteraction(
      'Fraction Input',
      '2',
      'Prefect!',
      CARD_NAMES.THIRD_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAMES.THIRD_CARD);
    await explorationEditor.updateCardContent(
      'I hope you enjoyed this exploration! '
    );
    await explorationEditor.addInteraction('End Exploration');
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'What are the place values?',
      'Learn about place values',
      'Algorithms'
    );

    if (!explorationId) {
      throw new Error('Exploration ID is null or undefined.');
    }
    // Create two more dummy explorations to test the community library.
    await explorationEditor.createAndPublishExplorationWithCards(
      'Dummy Exploration 1',
      'Algorithms'
    );
    await explorationEditor.createAndPublishExplorationWithCards(
      'Dummy Exploration 2',
      'Algorithms'
    );
  }, 900000); // Setup takes loner than default timeout.

  it('should use all RTE components in the exploration', async function () {
    // Navigate to community library page and expect it to contain 3
    // different explorations.
    await loggedOutLearner.navigateToCommunityLibraryPage();
    await loggedOutLearner.expectSearchResultsToContain([
      'What are the place values?',
      'Dummy Exploration 1',
      'Dummy Exploration 2',
    ]);

    // Search and play the exploration "What are the place values?".
    // Expect to be on the exploration player page and there is "Lesson info" text.
    await loggedOutLearner.searchForLessonInSearchBar(
      'What are the place values?'
    );
    await loggedOutLearner.playLessonFromSearchResults(
      'What are the place values?'
    );
    await loggedOutLearner.expectToBeOnPage(
      `http://localhost:8181/explore/${explorationId}`
    );
    await loggedOutLearner.waitForPageToFullyLoad();

    await loggedOutLearner.expectLessonInfoTextToBe('Lesson Info');

    // Continue to next card.
    await loggedOutLearner.continueToNextCard();
    await loggedOutLearner.expectGoBackToPreviousCardButton(true);
    await loggedOutLearner.expectContinueToNextCardButtonToBePresent(false);

    // Concept Card RTE.
    await loggedOutLearner.expectConceptCardLinkInLessonToWorkProperly(
      'Review material text content for Math.'
    );

    // Video RTE.
    await loggedOutLearner.expectVideoRTEToBePresent();

    // Link RTE.
    await loggedOutLearner.expectLinkRTEToPresent('https://www.oppia.org');

    // Collapsible RTE.
    await loggedOutLearner.expectCollapsibleRTEToBePresent();

    // Tab RTE.
    await loggedOutLearner.expectTabElementInLessonCardToContain(
      'Hint introduction',
      'This set of tabs shows some hints. Click on the other tabs to display the relevant hints.'
    );
    await loggedOutLearner.expectTabElementInLessonCardToContain(
      'Hint 1',
      'This is a first hint.'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
