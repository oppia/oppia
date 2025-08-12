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
 * TR.CD. Review the translations.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {TopicManager} from '../../utilities/user/topic-manager';
import {TranslationReviewer} from '../../utilities/user/translation-reviewer';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

describe('Translation Reviewer', function () {
  let translationReviewer: TranslationReviewer & LoggedInUser & LoggedOutUser;
  let translationSubmitter: TranslationSubmitter & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;

  beforeAll(async function () {
    translationReviewer = await UserFactory.createNewUser(
      'translatorReviewer',
      'translatorReviewer@example.com',
      [ROLES.TRANSLATION_REVIEWER],
      'hi'
    );

    translationSubmitter = await UserFactory.createNewUser(
      'translatorSubmitter',
      'translatorSubmitter@example.com'
    );
    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create translation opportunity.
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

    // Translate an exploration.
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageInTranslateTextTab(
      'हिन्दी (Hindi)'
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'The Birthday Cake Arrives',
      'Dividing a Birthday Cake'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOn('Save and close');
    await translationSubmitter.clickOn('Discard changes');
    await translationSubmitter.clickOn('Skip');
    await translationSubmitter.typeTextForRTE('सामग्री 1');
    await translationSubmitter.clickOn('Save and close');
    await translationSubmitter.clickOn('Discard changes');
  });

  it('should be able to view all pending reviews', async function () {
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
