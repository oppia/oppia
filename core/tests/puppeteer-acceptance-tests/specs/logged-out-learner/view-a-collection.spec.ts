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
 * @fileoverview Acceptance test for LO.13: View collection - logged-out learner.
 *
 * https://docs.google.com/spreadsheets/d/1IrxN13IC5xwWdAFnGMu_4p3FU1ADL4QO-eLZIuTowIA/edit?gid=888982708#gid=888982708
 * Test LO.13 (View collection)
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CollectionEditor} from '../../utilities/user/collection-editor';

const ROLES = testConstants.Roles;
const FIRST_EXPLORATION_TITLE = 'Positive Numbers';
const SECOND_EXPLORATION_TITLE = 'Negative Numbers';
const EXPLORATION_COMPLETION_TOAST_MESSAGE =
  'Congratulations! You have finished!';
const ALTERNATE_EXPLORATION_COMPLETION_TOAST_MESSAGE =
  'Congratulations for completing this lesson!';
const LONG_SETUP_TIMEOUT_MSECS = 12 * 60 * 1000;

describe('Logged-Out Learner', function () {
  let loggedOutLearner: LoggedOutUser;
  let lessonCreator: ExplorationEditor & CollectionEditor;

  beforeAll(async function () {
    loggedOutLearner = await UserFactory.createLoggedOutUser();
    lessonCreator = (await UserFactory.createNewUser(
      'lessonCreator',
      'lessoncreator@example.com',
      [ROLES.COLLECTION_EDITOR]
    )) as unknown as ExplorationEditor & CollectionEditor;

    const expId1 = await lessonCreator.createAndPublishExplorationWithCards(
      FIRST_EXPLORATION_TITLE
    );
    const expId2 = await lessonCreator.createAndPublishExplorationWithCards(
      SECOND_EXPLORATION_TITLE
    );

    await lessonCreator.createAndPublishCollection(
      'Numbers',
      'Learn about numbers.',
      'Algebra',
      [expId1, expId2]
    );
  }, LONG_SETUP_TIMEOUT_MSECS);

  it('should find the collection in the community library', async function () {
    await loggedOutLearner.navigateToCommunityLibraryPage();
    await loggedOutLearner.expectCollectionToBeVisibleInLibrary('Numbers');
  });

  it('should display both explorations on the collection page', async function () {
    await loggedOutLearner.navigateToCollectionFromLibrary('Numbers');

    // Verify the collection begin button and both explorations are visible.
    await loggedOutLearner.expectBeginCollectionButtonToBePresent('Numbers');
    await loggedOutLearner.expectExplorationToBeListedInCollection(
      FIRST_EXPLORATION_TITLE
    );
    await loggedOutLearner.expectExplorationToBeListedInCollection(
      SECOND_EXPLORATION_TITLE
    );
  });

  it('should complete an exploration started from the collection', async function () {
    // Open the first exploration from the collection page.
    await loggedOutLearner.navigateToExplorationFromCollection(
      FIRST_EXPLORATION_TITLE
    );
    await loggedOutLearner.expectContinueToNextCardButtonToBePresent();
    await loggedOutLearner.continueToNextCard();

    // Verify the exploration completion toast message.
    await loggedOutLearner.expectExplorationCompletionToastMessageWithFallback(
      EXPLORATION_COMPLETION_TOAST_MESSAGE,
      ALTERNATE_EXPLORATION_COMPLETION_TOAST_MESSAGE
    );
  });

  it('should return to the collection after completing the exploration', async function () {
    await loggedOutLearner.clickBackToCollectionButton();
    await loggedOutLearner.expectToBeOnPage('/collection/');
  });

  it('should display "COMPARTIR ESTA COLECCIÓN" when language is changed to Spanish', async function () {
    // Change the site language to Spanish and reload the collection page.
    await loggedOutLearner.changeSiteLanguage('es');
    await loggedOutLearner.navigateToCollectionPage();

    await loggedOutLearner.expectShareCollectionFooterText(
      'COMPARTIR ESTA COLECCIÓN'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
