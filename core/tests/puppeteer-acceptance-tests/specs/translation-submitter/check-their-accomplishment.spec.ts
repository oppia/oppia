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
 * TS.TA??. Check their accomplishment.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {TopicManager} from '../../utilities/user/topic-manager';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

describe('Translation Submitter', function () {
  let translationSubmitter: TranslationSubmitter & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;

  beforeAll(async function () {
    translationSubmitter = await UserFactory.createNewUser(
      'translator',
      'translator@example.com'
    );

    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    const explorationId =
      await curriculumAdm.createAndPublishExplorationWithCards('Exploration 1');

    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      'Fractions',
      'Understanding Numerators',
      'Recognize equivalent fractions'
    );
    await curriculumAdm.createAndPublishStoryWithChapter(
      'Dividing a Birthday Cake',
      'dividing-a-birthday-cake',
      'The Birthday Cake Arrives',
      explorationId as string,
      'Fractions'
    );
  });

  it('should be able to check contribution stats', async function () {
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'The Birthday Cake Arrives',
      'Dividing a Birthday Cake'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
