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
 * CL.5 Subscribe to a favourite creator
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

describe('Community Library Browser', function () {
  let communityLibraryBrowser: LoggedInUser & LoggedOutUser;
  let curriculumAdmin: ExplorationEditor & CurriculumAdmin;

  beforeAll(async function () {
    communityLibraryBrowser = await UserFactory.createNewUser(
      'communityLibraryBrowser',
      'community_library_browser@example.com'
    );
    curriculumAdmin = await UserFactory.createNewUser(
      'currAdm',
      'curriculum_adm@example.com',
      [testConstants.Roles.CURRICULUM_ADMIN]
    );

    const explorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Solving problems without calculator',
        'Algebra'
      );

    await curriculumAdmin.createAndPublishTopic(
      'Fractions',
      'Basics of Fractions',
      'fractions'
    );
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Story 1',
      'story-one',
      'Chapter 1',
      explorationId,
      'Fractions'
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Math',
      'math',
      'Fractions'
    );
  }, 500000);

  it('should be able to subscribe to creators', async function () {
    // Start a community lesson.
    await communityLibraryBrowser.navigateToClassroomPage('math');
    await communityLibraryBrowser.selectAndOpenTopic('Fractions');
    await communityLibraryBrowser.selectChapterWithinStoryToLearn(
      'Story 1',
      'Chapter 1'
    );
    await communityLibraryBrowser.continueToNextCard();

    // Subscribe to creator.
    await communityLibraryBrowser.openLessonInfoModal();
    await communityLibraryBrowser.clickOnProfileIconInLessonInfoModel();
    await communityLibraryBrowser.subscribeToCreator();

    // Check subscribed creators in preferences page.
    await communityLibraryBrowser.navigateToPreferencesPageUsingProfileDropdown();
    await communityLibraryBrowser.expectSubscribedCreatorsToContain('currAdm');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
