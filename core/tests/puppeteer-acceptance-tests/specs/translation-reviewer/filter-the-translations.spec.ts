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
 * TR.CD. Filter the translations.
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
      await curriculumAdm.createAndPublishExplorationWithCards('Exploration 1');
    const explorationId2 =
      await curriculumAdm.createAndPublishExplorationWithCards('Exploration 2');
    const explorationId3 =
      await curriculumAdm.createAndPublishExplorationWithCards('Exploration 3');

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
    await translationSubmitter.selectLanguageInTranslateTextTab(
      'हिन्दी (Hindi)'
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Cutting the Pies',
      'The Picnic Problem'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOn('Save and translate another');
    await translationSubmitter.clickOnDiscardChangesButton();
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 1');
    await translationSubmitter.clickOn('Save and translate another');
    await translationSubmitter.clickOnDiscardChangesButton();
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 2');
    await translationSubmitter.clickOn('Save and close');
    await translationSubmitter.clickOnDiscardChangesButton();

    // Add translations to "Trading Slices" in Akan.
    await translationSubmitter.selectLanguageInTranslateTextTab('Ákán (Akan)');
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Trading Slices',
      'The Picnic Problem'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOn('Save and translate another');
    await translationSubmitter.clickOnDiscardChangesButton();
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 1');
    await translationSubmitter.clickOn('Save and close');
    await translationSubmitter.clickOnDiscardChangesButton();

    // Add translations to "Chemical Reactions" in Hindi.
    await translationSubmitter.selectLanguageInTranslateTextTab(
      'हिन्दी (Hindi)'
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Chemical Reactions',
      'The Ideal Gas Law'
    );
    await translationSubmitter.typeTextForRTE('सामग्री 0');
    await translationSubmitter.clickOn('Save and translate another');
    await translationSubmitter.clickOnDiscardChangesButton();
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.typeTextForRTE('सामग्री 1');
    await translationSubmitter.clickOn('Save and close');
    await translationSubmitter.clickOnDiscardChangesButton();
  });

  it('should be able to filter by topic', async function () {
    // TODO: Can't see the one with different language.
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.expectPinIconToBeVisible();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
