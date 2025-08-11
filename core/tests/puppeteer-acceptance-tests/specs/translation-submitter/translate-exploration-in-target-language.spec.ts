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
 * TS.CD.??. Translate exploration in target language.
 */

import testConstants, {FILEPATHS} from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {TopicManager} from '../../utilities/user/topic-manager';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

describe('Translation Submitter', function () {
  let translationSubmitter: TranslationSubmitter & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;

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

    // Create an exploration.
    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.dismissTranslationTabWelcomeModal();
    await curriculumAdm.updateCardContent(
      'Hello, This is me -- Oppia Web Tester'
    );
    await curriculumAdm.addImageRTEToCardContent(
      FILEPATHS.PROFILE_PHOTO_SVG,
      'Profile Photo',
      'Check this. How do I look?'
    );
    await curriculumAdm.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await curriculumAdm.saveExplorationDraft();
    const explorationId = await curriculumAdm.publishExplorationWithMetadata(
      'Exploration 1',
      'This is a test exploration',
      'Algebra'
    );
    // const explorationId =
    //   await curriculumAdm.createAndPublishExplorationWithCards('Exploration 1');
    const explorationIds =
      await curriculumAdm.createAndPublishExplorationsWithCards(10);

    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      'Fractions',
      'Understanding Numerators and Denominators',
      'Recognize equivalent fractions'
    );
    await curriculumAdm.createAndPublishStoryWithChapter(
      'Dividing a Birthday Cake',
      'dividing-a-birthday-cake',
      'The Birthday Cake Arrives',
      explorationId as string,
      'Fractions'
    );

    await curriculumAdm.createAndPublishTopic(
      'Test Topic 1',
      'Test Subtopic 1',
      'Test Skill 1'
    );
    await curriculumAdm.addStoryToTopic(
      'Test Story 1',
      'test-story-1',
      'Test Topic 1'
    );

    for (const id of explorationIds) {
      await curriculumAdm.openStoryEditor('Test Story 1', 'Test Topic 1');
      await curriculumAdm.addChapter(`Chapter ${id}`, id);
    }
  }, 1200000);

  it('should be able to check translation opportunities', async function () {
    // Navigate to the contributor dashboard.
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.expectScreenshotToMatch(
      'contributorDashboard',
      __dirname
    );
    await translationSubmitter.expectUsernameToBe('translator');

    // Switch to the translation tab.
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.expectScreenshotToMatch(
      'translationTabInContributionDashboard',
      __dirname
    );

    // Change the translation language.
    await translationSubmitter.selectLanguageInTranslateTextTab(
      'हिन्दी (Hindi)'
    );

    // Check if pagination works properly.
    await translationSubmitter.expectPaginationButtonToBeVisible('next');
    await translationSubmitter.expectPaginationButtonToBeVisible(
      'previous',
      false
    );
    await translationSubmitter.clickOnPaginationButton('next');
    await translationSubmitter.expectPaginationButtonToBeVisible('next', false);
    await translationSubmitter.expectPaginationButtonToBeVisible('previous');
    await translationSubmitter.clickOnPaginationButton('previous');

    // Change the subject.
    await translationSubmitter.selectSubjectInTranslateTextTab('Fractions');
    await translationSubmitter.expectPaginationButtonToBeVisible('next', false);
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'The Birthday Cake Arrives',
      'Dividing a Birthday Cake'
    );

    // Check if anchor text for copy tool works properly.
    await translationSubmitter.clickAndVerifyAnchorWithInnerText(
      'here',
      'https://oppia-user-guide.readthedocs.io/en/latest/contributor/translate.html'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
