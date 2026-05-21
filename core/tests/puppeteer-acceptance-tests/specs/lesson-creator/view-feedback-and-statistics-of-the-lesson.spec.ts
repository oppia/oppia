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
 * @fileoverview Acceptance test from CUJv3 sheet
 * https://docs.google.com/spreadsheets/d/1DIZ0_Gmf9uhjTbhuDpA495PTjYZW9ZE97r6urS-iXwg/edit?gid=888982708#gid=888982708
 *
 * LC.6. View Feedback and Statistics of the Lesson
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Lesson Creator', function () {
  let lessonCreator: ExplorationEditor & LoggedInUser;
  let learner1: LoggedInUser & LoggedOutUser;
  let learner2: LoggedInUser & LoggedOutUser;
  let explorationId: string;
  const EXPLORATION_TITLE = 'Simple Addition Exploration';

  beforeAll(async function () {
    lessonCreator = await UserFactory.createNewUser(
      'LessonCreator',
      'lessoncreator@example.com'
    );
    learner1 = await UserFactory.createNewUser(
      'Learner1',
      'learner1@example.com'
    );
    learner2 = await UserFactory.createNewUser(
      'Learner2',
      'learner2@example.com'
    );

    await lessonCreator.navigateToCreatorDashboardPage();
    await lessonCreator.navigateToExplorationEditorFromCreatorDashboard();
    await lessonCreator.dismissWelcomeModal();

    await lessonCreator.updateCardContent('What is 1 + 2?');

    await lessonCreator.addInteraction(INTERACTION_TYPES.NUMBER_INPUT, false);

    await lessonCreator.customizeNumberInputInteraction(true);

    await lessonCreator.fillValueInInteractionResponseModal('3', 'input');

    await lessonCreator.addResponseDetailsInResponseModal(
      'Correct',
      'Second',
      true,
      true
    );

    await lessonCreator.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try again'
    );

    await lessonCreator.navigateToCard('Second');
    await lessonCreator.updateCardContent('What is 11 + 99?');

    await lessonCreator.addInteraction(INTERACTION_TYPES.NUMBER_INPUT, false);

    await lessonCreator.customizeNumberInputInteraction(true);

    await lessonCreator.fillValueInInteractionResponseModal('110', 'input');

    await lessonCreator.addResponseDetailsInResponseModal(
      'Correct',
      'Final',
      true,
      true
    );

    await lessonCreator.editDefaultResponseFeedbackInExplorationEditorPage(
      'Try again'
    );

    await lessonCreator.navigateToCard('Final');
    await lessonCreator.updateCardContent('Great!');
    await lessonCreator.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    await lessonCreator.saveExplorationDraft();
    explorationId = await lessonCreator.publishExplorationWithMetadata(
      EXPLORATION_TITLE,
      'Testing feedback and stats',
      'Math'
    );

    await learner1.navigateToCommunityLibraryPage();
    await learner1.searchForLessonInSearchBar(EXPLORATION_TITLE);
    await learner1.playLessonFromSearchResults(EXPLORATION_TITLE);

    await learner1.submitAnswer('3');
    await learner1.continueToNextCard();

    await learner1.submitAnswer('110');
    await learner1.continueToNextCard();

    await learner1.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
    await learner1.rateExploration(3, 'Nice!', false);

    await learner2.navigateToCommunityLibraryPage();
    await learner2.searchForLessonInSearchBar(EXPLORATION_TITLE);
    await learner2.playLessonFromSearchResults(EXPLORATION_TITLE);
  }, 600000);

  it(
    'should view and reply to exploration feedback',
    async function () {
      await lessonCreator.navigateToFeedbackTab();
      await lessonCreator.expectFeedbackPageTobeVisible();

      await lessonCreator.startAFeedbackThread(
        'Feedback Subject',
        'Initial feedback message'
      );
      await lessonCreator.expectFeedbackThreadToBePresent('Feedback Subject');

      await lessonCreator.expectFeedbackStatusInList(1, 'Open');

      await lessonCreator.viewFeedbackThread(1);
      await lessonCreator.changeFeedbackStatus('fixed');
      await lessonCreator.replyToSuggestion('Thanks, issue noted.');

      await lessonCreator.goBackToTheFeedbackTab();
      await lessonCreator.expectFeedbackReplyDetailsToBeVisible();
      await lessonCreator.expectFeedbackStatusInList(1, 'Fixed');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should view exploration statistics and take action based on thems',
    async function () {
      await lessonCreator.navigateToExplorationEditor(explorationId);
      await lessonCreator.navigateToStatsTab();
      await lessonCreator.expectNumberOfPassersToBe(1);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
