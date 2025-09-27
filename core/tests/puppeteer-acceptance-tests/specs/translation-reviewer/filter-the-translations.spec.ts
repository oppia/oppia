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
 * TR.CD.01 Filter the translations.
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
      ['hi', 'ak']
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
      await curriculumAdm.createAndPublishAMinimalExplorationWithTitle(
        'Exploration 1'
      );
    const explorationId2 =
      await curriculumAdm.createAndPublishAMinimalExplorationWithTitle(
        'Exploration 2'
      );
    const explorationId3 =
      await curriculumAdm.createAndPublishAMinimalExplorationWithTitle(
        'Exploration 3'
      );

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

    await curriculumAdm.createAndPublishTopic(
      'States of Matter',
      'States of Matter',
      'Skill States of Matter'
    );
    await curriculumAdm.createAndPublishStoryWithChapter(
      'The Ideal Gas Law',
      'the-ideal-gas-law',
      'Chemical Reactions',
      explorationId3 as string,
      'States of Matter'
    );

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
    await translationSubmitter.typeTextForRTE('सामग्री 0 (पाई काटना)');
    await translationSubmitter.clickOn('Save and close');

    // Add translations to "Trading Slices" in Akan.
    await translationSubmitter.selectLanguageFilter('Ákán (Akan)');
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Trading Slices',
      'The Picnic Problem'
    );
    await translationSubmitter.typeTextForRTE(
      'emu nsɛm 0 (slices a wɔde sesa wɔn ho wɔn ho)'
    );
    await translationSubmitter.clickOn('Save and close');

    // Add translations to "Chemical Reactions" in Hindi.
    await translationSubmitter.selectLanguageFilter('हिन्दी (Hindi)');
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Chemical Reactions',
      'The Ideal Gas Law'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOn('Save and close');
  }, 1200000);

  it('should be able to filter by topic', async function () {
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.filterContentByTopic('Fractions');

    // Translation of "States of Matter" should not be present.
    await translationReviewer.expectOpportunityToBePresent(
      'Chemical Reactions',
      'States of Matter',
      false
    );
    // Translation of "Fractions" should be present.
    await translationReviewer.expectOpportunityToBePresent(
      'Cutting the Pies',
      'Fractions',
      true
    );
    await translationReviewer.expectOpportunityToBePresent(
      'Trading Slices',
      'Fractions',
      true
    );
  });

  it('should be able to filter translations by language', async function () {
    await translationReviewer.selectLanguageFilter('हिन्दी (Hindi)');

    // Translation in Hindi should be present.
    await translationReviewer.expectOpportunityToBePresent(
      'Cutting the Pies',
      'Fractions',
      true
    );
    // Translation in Akan should not be present.
    await translationReviewer.expectOpportunityToBePresent(
      'Trading Slices',
      'Fractions',
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
