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
    // Create all users.
    translationSubmitter = await UserFactory.createNewUser(
      'translationsubmitter',
      'translationsubmitter@example.com'
    );

    // Translation reviewer is given Arabic review rights.
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

    // Create and publish an exploration with 2 cards.
    const explorationId =
      await curriculumAdm.createAndPublishExplorationWithCards(
        'First Exploration'
      );

    // Set up topic, skill, story, chapter, and classroom.
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

    // Translation submitter submits translations in Arabic.
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

    // Translation reviewer reviews and accepts the submitted translations.
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      'First Chapter',
      'Test Story'
    );
    await translationReviewer.startTranslationReview(
      'محتوى البطاقة 0',
      'Test Topic / Test Story'
    );
    // Accept both card translations.
    await translationReviewer.submitTranslationReview('accept');
    await translationReviewer.submitTranslationReview('accept');

    await translationReviewer.switchToTabInContributionDashboard(
      'My Contributions'
    );
  }, 900000);

  it('should be able to check contribution stats', async function () {
    // Navigate to Contribution Stats and select Translation Reviews.
    await translationReviewer.navigateToTabInMyContributions(
      'Contribution Stats'
    );
    await translationReviewer.selectContributionTypeInContributionDashboard(
      'Translation Reviews'
    );

    // Verify the stats table row contains the expected data.
    // Column order for translation reviews: Date | Topic | Reviewed Cards |
    // Reviewed Word Count | Accepted Cards | Accepted Word Count.
    await translationReviewer.expectContributionTableToContainRow([
      null, // Date — changes every run.
      'Test Topic', // Topic.
      '2', // Reviewed cards (both cards submitted were reviewed).
      null, // Reviewed word count can vary by card content.
      '2', // Accepted cards (both cards were accepted).
      null, // Accepted word count can vary by card content.
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
    // Select Translation type in mobile view (desktop shows all badges).
    await translationReviewer.selectBadgeTypeInMobileView('Translation');
    // Should show a badge for 2 translation reviews (both cards accepted).
    // The badge value '1' is the threshold level of the first badge.
    await translationReviewer.expectBadgesToContain('1', 'Review', 'العربية');
    // Verify the tooltip on the first locked (next achievable) badge.
    // With 2 reviews done and next threshold at 10: 10 - 2 = 8 more needed.
    await translationReviewer.expectLockedBadgeTooltipText(
      '8 more reviews to achieve this badge'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
