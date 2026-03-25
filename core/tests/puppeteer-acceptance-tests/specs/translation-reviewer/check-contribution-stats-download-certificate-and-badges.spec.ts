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
 * @fileoverview Acceptance test for translation reviewer contribution stats,
 * certificate, and badges.
 *
 * Feature: TR.CD - Check contribution stats, download certificate and badges.
 * Related issue: https://github.com/oppia/oppia/issues/16989
 * Testing plan:
 * https://docs.google.com/spreadsheets/d/1BKcrqmFzfjpexiKb3geIGoxV3Gfm6IqzNvAlECT9hvA
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

describe('Translation Reviewer', function () {
  let translationReviewer: TranslationReviewer & Contributor & LoggedInUser;
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;

  beforeAll(async function () {
    translationSubmitter = await UserFactory.createNewUser(
      'translationsubmitter',
      'translationsubmitter@example.com'
    );

    translationReviewer = await UserFactory.createNewUser(
      'translationreviewer',
      'translationreviewer@example.com',
      [ROLES.TRANSLATION_REVIEWER],
      'ar'
    );

    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    const explorationId =
      await curriculumAdm.createAndPublishExplorationWithCards(
        'First Exploration'
      );

    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      'Test Topic',
      'Test Sub-topic',
      'Test Skill'
    );
    await curriculumAdm.createAndPublishStoryWithChapter(
      'Test Story',
      'test-story',
      'First Chapter',
      explorationId as string,
      'Test Topic'
    );

    await curriculumAdm.createAndPublishClassroom(
      'Math',
      'math-classroom',
      'Test Topic'
    );

    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter('العربية (Arabic)');

    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'First Chapter',
      'Test Story'
    );
    await translationSubmitter.typeTextForRTE('محتوى البطاقة 0');
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('محتوى البطاقة 1');
    await translationSubmitter.clickOnElementWithText('Save and close');

    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      'First Chapter',
      'Test Story'
    );
    await translationReviewer.startTranslationReview(
      'محتوى البطاقة 0',
      'Test Topic / Test Story'
    );

    await translationReviewer.submitTranslationReview('accept');
    await translationReviewer.submitTranslationReview('accept');

    await translationReviewer.switchToTabInContributionDashboard(
      'My Contributions'
    );
  }, 900000);

  it('should be able to check contribution stats', async function () {
    await translationReviewer.navigateToTabInMyContributions(
      'Contribution Stats'
    );
    await translationReviewer.selectContributionTypeInContributionDashboard(
      'Translation Reviews'
    );

    await translationReviewer.expectContributionTableToContainRow([
      null,
      'Test Topic',
      '2',
      null,
      '2',
      null,
    ]);
  });

  it('should be able to download a contribution certificate', async function () {
    // TODO(#22743): The "Download Certificate" button is only shown for
    // the "Translation Contributions" stats view, not "Translation Reviews".
    // A reviewer-only account has no contribution data to trigger the button.
    // Once the certificate download issue is resolved and the UI is updated
    // to support reviewer certificates, add assertions here.
  });

  it('should be able to check badges earned', async function () {
    await translationReviewer.navigateToTabInMyContributions('Badges');
    await translationReviewer.selectBadgeTypeInMobileView('Translation');
    await translationReviewer.expectBadgesToContain('1', 'Review', 'العربية');
    await translationReviewer.expectLockedBadgeTooltipText(
      '8 more reviews to achieve this badge'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
