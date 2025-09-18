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
 * TS.CD.02 Check their accomplishment.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Contributor} from '../../utilities/user/contributor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {TopicManager} from '../../utilities/user/topic-manager';
import {TranslationReviewer} from '../../utilities/user/translation-reviewer';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

describe('Translation Submitter', function () {
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;
  let translationReviewer: TranslationReviewer & Contributor & LoggedInUser;

  beforeAll(async function () {
    // Create users.
    translationSubmitter = await UserFactory.createNewUser(
      'translator',
      'translator@example.com'
    );

    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    translationReviewer = await UserFactory.createNewUser(
      'translationReviewer',
      'translationReviewer@example.com',
      [ROLES.TRANSLATION_REVIEWER],
      'hi'
    );

    // Create a curated exploration.
    const explorationId =
      await curriculumAdm.createAndPublishExplorationWithCards('Fair Share');

    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      'Fractions',
      'Fraction Foundations',
      'Unit Fractions'
    );
    await curriculumAdm.createAndPublishStoryWithChapter(
      'The Picnic Problem',
      'the-picnic-problem',
      'Cutting the Pies',
      explorationId as string,
      'Fractions'
    );

    // Submit a translation.
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter('हिन्दी (Hindi)');

    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Cutting the Pies',
      'Fractions - The Picnic Problem'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOn('Save and translate another');
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 1');
    await translationSubmitter.clickOn('Save and close');
    await translationSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );

    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      'Cutting the Pies',
      'Fractions - The Picnic Problem'
    );
    await translationReviewer.startTranslationReview(
      'सामग्री 0',
      'Fractions / The Picnic'
    );
    await translationReviewer.submitTranslationReview('accept');
    await translationReviewer.submitTranslationReview('accept');
  }, 900000);

  it('should be able to verify contribution stats', async function () {
    // Check contribution stats.
    await translationSubmitter.navigateToTabInMyContributions(
      'Contribution Stats'
    );
    await translationSubmitter.selectContributionTypeInContributionDashboard(
      'Translation Contributions'
    );
    await translationSubmitter.expectScreenshotToMatch(
      'translationSubmitterAccomplishment',
      __dirname
    );
    await translationSubmitter.expectContributionTableToContainRow([
      null, // Date can't be compared as it will be different every time.
      'Fractions', // Topic.
      '2', // Accepted translations.
      '4', // Words translated.
    ]);

    // Download Certificate.
    // TODO(#22743): Unable to download certificate when To date is of today
    // and only contribution is made today.
  });

  it('should be able to check badges earned', async function () {
    await translationSubmitter.navigateToTabInMyContributions('Badges');
    await translationSubmitter.expectScreenshotToMatch(
      'translationSubmitterBadges',
      __dirname
    );
    await translationSubmitter.expectBadgesToContain(
      '1',
      'Submission',
      'हिन्दी'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
