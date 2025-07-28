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
 * PP. Learner changes the site Language to an RTL (right-to-left) language
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;

describe('Logged-In Learner', function () {
  let loggedInUser1: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let explorationId: string | null;

  beforeAll(
    async function () {
      loggedInUser1 = await UserFactory.createNewUser(
        'loggedInLearner',
        'logged_in_learner@example.com'
      );

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculumAdmin@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.updateCardContent('Introduction to Fractions');
      await curriculumAdmin.addInteraction('Continue Button');

      // Add a new card with a basic algebra problem.
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard('Second Card');
      await curriculumAdmin.saveExplorationDraft();

      // Navigate to the new card and update its content.
      await curriculumAdmin.navigateToCard('Second Card');
      await curriculumAdmin.updateCardContent('Enter a negative number.');
      await curriculumAdmin.addInteraction('Number Input');

      await curriculumAdmin.addResponsesToTheInteraction(
        'Number Input',
        '-1',
        'Perfect!',
        'Last Card',
        true
      );
      await curriculumAdmin.editDefaultResponseFeedbackInExplorationEditorPage(
        'Wrong, try again!'
      );
      await curriculumAdmin.addHintToState(
        'Remember that negative numbers are less than 0.'
      );
      await curriculumAdmin.addSolutionToState(
        '-99',
        'The number -99 is a negative number.',
        true
      );
      await curriculumAdmin.saveExplorationDraft();

      // Navigate to the new card and add Study Guide content.
      await curriculumAdmin.navigateToCard('Last Card');
      await curriculumAdmin.updateCardContent(
        'Congratulations! You have completed the exploration.'
      );
      await curriculumAdmin.addInteraction('End Exploration');

      // Save the draft.
      await curriculumAdmin.saveExplorationDraft();
      explorationId = await curriculumAdmin.publishExplorationWithMetadata(
        'What is a Fraction?',
        'Learn the basics of Fractions',
        'Algebra'
      );

      await curriculumAdmin.createAndPublishTopic(
        'Fractions',
        'Basics Of Fractions',
        'fractions'
      );

      await curriculumAdmin.createAndPublishClassroom(
        'Math',
        'math',
        'Fractions'
      );

      await curriculumAdmin.createAndPublishStoryWithChapter(
        'Fraction Story',
        'fraction-story',
        'What is a Fraction?',
        explorationId as string,
        'Fractions'
      );
    },
    // Test takes longer than default timeout.
    600000
  );

  it('should be able to change the site language to an RTL language', async function () {
    await loggedInUser1.changeSiteLanguage('ar');

    await loggedInUser1.navigateToLearnerDashboard();
    await loggedInUser1.verifyPageIsRTL();
    await loggedInUser1.expectScreenshotToMatch(
      'RTLArabicLearnerDashboard',
      __dirname
    );

    await loggedInUser1.navigateToHome(false);
    await loggedInUser1.verifyPageIsRTL();
    await loggedInUser1.expectScreenshotToMatch('RTLArabicHomePage', __dirname);
  });

  it('should be able to visit about page', async function () {
    // Navigate to about page.
    await loggedInUser1.clickAboutButtonInAboutMenuOnNavbar();
    await loggedInUser1.verifyPageIsRTL();
    await loggedInUser1.expectScreenshotToMatch(
      'RTLArabicAboutPage',
      __dirname
    );
  });

  it('should be able to play an exploration and interact with pop-ups, modals and buttons', async function () {
    // Navigate to community library.
    await loggedInUser1.navigateToCommunityLibraryPage();
    await loggedInUser1.verifyPageIsRTL();

    // Check lesson player.
    await loggedInUser1.searchForLessonInSearchBar('What is a Fraction?');
    await loggedInUser1.playLessonFromSearchResults('What is a Fraction?');
    await loggedInUser1.verifyPageIsRTL();

    // Check hints and lesson info are displayed in RTL.
    await loggedInUser1.continueToNextCard();
    await loggedInUser1.submitAnswer('1');

    await loggedInUser1.viewHint();
    await loggedInUser1.verifyPageIsRTL();
    await loggedInUser1.closeHintModal();

    await loggedInUser1.openLessonInfoModal();
    await loggedInUser1.verifyPageIsRTL();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
