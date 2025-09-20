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
import {Contributor} from '../../utilities/user/contributor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {TopicManager} from '../../utilities/user/topic-manager';
import {TranslationReviewer} from '../../utilities/user/translation-reviewer';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

describe('Translation Reviewer', function () {
  let translationReviewer: TranslationReviewer &
    LoggedInUser &
    LoggedOutUser &
    Contributor;
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
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
      await curriculumAdm.createAndPublishExplorationWithCards(
        'Exploration 1',
        'Mathematics',
        4
      );
    const explorationId2 =
      await curriculumAdm.createAndPublishExplorationWithCards('Exploration 2');

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
    await curriculumAdm.openStoryEditor('The Picnic Problem', 'Fractions');
    await curriculumAdm.addChapter('Trading Slices', explorationId2);
    await curriculumAdm.saveStoryDraft();

    // Translate an exploration.
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );

    // Add translations to "Cutting the Pies" in Hindi.
    await translationSubmitter.selectLanguageFilter('हिन्दी (Hindi)');
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Cutting the Pies',
      'The Picnic Problem'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 1');
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 2');
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 3');
    await translationSubmitter.clickOnElementWithText('Save and close');

    // Add translations to "Trading Slices" in Akan.
    await translationSubmitter.selectLanguageFilter('Ákán (Akan)');
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Trading Slices',
      'The Picnic Problem'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 1');
    await translationSubmitter.clickOnElementWithText('Save and close');
  }, 900000);

  it('should be able to view all pending reviews', async function () {
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.expectPinIconToBeVisible();
    await translationReviewer.expectScreenshotToMatch(
      'translationReviewerReviewTab',
      __dirname
    );
  });

  it('should be able to move between review cards', async function () {
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      'Cutting the Pies',
      'Fractions - The Picnic Problem'
    );
    await translationReviewer.startTranslationReview(
      'सामग्री 0',
      'Fractions / The Picnic'
    );
    await translationReviewer.expectPaginationButtonToBeDisabled('previous');

    await translationReviewer.clickOnPaginationButton('next');
    await translationReviewer.expectPaginationButtonToBeDisabled(
      'previous',
      false
    );
    await translationReviewer.clickOnPaginationButton('previous');
  });

  it('should be able to accept the translation', async function () {
    // Accept the translation without adding review comment.
    await translationReviewer.submitTranslationReview('accept');
    await translationReviewer.expectCardContentToBeInTranslationReview(
      'सामग्री 1'
    );

    // Accept the translation with adding review comment.
    await translationReviewer.submitTranslationReview(
      'accept',
      'Review comment'
    );
    await translationReviewer.expectCardContentToBeInTranslationReview(
      'सामग्री 2'
    );

    // Accept the translation with adding review comment.
    await translationReviewer.clickOnElementWithText('Edit');
    // TODO(#23250): RTE not usable. Once the issue is fixed, uncomment the following line.
    // await translationReviewer.typeTextForRTE('Review comment');
    await translationReviewer.clickOnElementWithText('Update');
    await translationReviewer.submitTranslationReview(
      'accept',
      'I have added some changes.'
    );
    await translationReviewer.expectCardContentToBeInTranslationReview(
      'सामग्री 3'
    );
  });

  it('should be able to reject a translation', async function () {
    // Shouldn't be able to reject a review without a comment.
    await translationReviewer.expectRejectReviewButtonToBeDisabled();

    // Should be able to reject a review with a comment.
    await translationReviewer.submitTranslationReview(
      'reject',
      'Some lines are not translated properly'
    );
    await translationReviewer.expectReviewModalToBePresent(false);
  });

  it('should be able to check contribution stats', async function () {
    await translationReviewer.navigateToTabInMyContributions(
      'Contribution Stats'
    );
    await translationReviewer.selectContributionTypeInContributionDashboard(
      'Translation Reviews'
    );

    await translationReviewer.expectContributionTableToContainRow([
      null,
      'Fractions',
      '4',
      '8',
      '3',
      '6',
    ]);

    // Download certificate.
    // TODO(#22743): Unable to download certificate when To date is of today
    // and only contribution is made today.
  });

  it('should be able to see the badges', async function () {
    await translationReviewer.navigateToTabInMyContributions('Badges');
    await translationReviewer.expectBadgesToContain('1', 'Review', 'हिन्दी');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
