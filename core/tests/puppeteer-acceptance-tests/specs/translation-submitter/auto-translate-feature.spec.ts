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
 * @fileoverview Acceptance test verifying the auto-translate generation flow.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {Contributor} from '../../utilities/user/contributor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {TopicManager} from '../../utilities/user/topic-manager';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;

describe('Auto-Translate Feature', function () {
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    translationSubmitter = await UserFactory.createNewUser(
      'autotranslator',
      'autotranslator@example.com'
    );
    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdmAuto',
      'curriculumAdmAuto@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [testConstants.Roles.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.navigateToReleaseCoordinatorPage();
    await releaseCoordinator.navigateToFeaturesTab();
    await releaseCoordinator.enableFeatureFlag(
      'enable_automatic_translation_suggestions'
    );

    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      'Algebra',
      'Algebra Foundations',
      'Math'
    );

    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.dismissWelcomeModal();

    // Add some basic text with math and link to the state.
    await curriculumAdm.addExplorationDescriptionContainingBasicRTEComponents();

    await curriculumAdm.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await curriculumAdm.saveExplorationDraft();
    const explorationId = await curriculumAdm.publishExplorationWithMetadata(
      'Math Links',
      'Learn math and links',
      'Mathematics'
    );

    await curriculumAdm.createAndPublishStoryWithChapter(
      'Math Adventures',
      'math-adventures',
      'Chapter 1',
      explorationId,
      'Algebra'
    );
  }, 2100000);

  it('should auto-translate text with math and links preserved', async function () {
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter('हिन्दी (Hindi)');

    // Mock the backend API for generate translation. The mock response must
    // include the same custom Oppia tags as the original exploration content
    // (image, math, skillreview) so that validation passes.
    await translationSubmitter.page.setRequestInterception(true);
    translationSubmitter.page.on('request', request => {
      if (request.url().includes('/generate-translation')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            translated_text:
              '<p><strong>बोल्ड पाठ</strong></p>' +
              '<p><em>इटैलिक पाठ</em></p>' +
              '<p>यहाँ एक गणितीय सूत्र है ' +
              '<oppia-noninteractive-math ' +
              'math_content-with-value="{&quot;raw_latex&quot;:' +
              '&quot;x^2 + y^2 = z^2&quot;,&quot;svg_filename&quot;:' +
              '&quot;&quot;}">' +
              '</oppia-noninteractive-math></p>' +
              '<oppia-noninteractive-image ' +
              'filepath-with-value="&quot;img_test.png&quot;" ' +
              'caption-with-value="&quot;परीक्षण छवि शीर्षक&quot;" ' +
              'alt-with-value="&quot;परीक्षण छवि&quot;">' +
              '</oppia-noninteractive-image>' +
              '<oppia-noninteractive-skillreview ' +
              'skill_id-with-value="&quot;skill_id&quot;" ' +
              'text-with-value="&quot;कौशल समीक्षा&quot;">' +
              '</oppia-noninteractive-skillreview>',
            translation_provider: 'Google',
          }),
        });
      } else {
        request.continue();
      }
    });

    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Chapter 1',
      'Algebra - Math Adventures'
    );

    await translationSubmitter.clickOnAutoTranslateButton();
    await translationSubmitter.page.waitForTimeout(1000);

    await translationSubmitter.clickOnElementWithText('Save and close');

    // The unedited confirmation modal appears because the auto-generated
    // translation was not edited. Click the confirm button to proceed.
    await translationSubmitter.page.waitForSelector(
      '.e2e-test-confirm-unedited-save-button',
      {visible: true}
    );
    await translationSubmitter.page.click(
      '.e2e-test-confirm-unedited-save-button'
    );

    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
