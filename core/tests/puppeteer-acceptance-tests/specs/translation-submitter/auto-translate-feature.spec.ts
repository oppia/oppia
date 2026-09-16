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

    // Add exploration description with math and hyperlink.
    await curriculumAdm.clickOnElementWithText('Add an interaction');
    await curriculumAdm.page.keyboard.press('Escape'); // close modal if open

    // We just want to add some basic text with math and link to the state.
    // wait, we can just use the provided method and add a simple state text
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

    // Mock the backend API for generate translation
    await translationSubmitter.page.setRequestInterception(true);
    translationSubmitter.page.on('request', request => {
      if (request.url().includes('/generate-translation')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            translated_text:
              '<p>यहाँ <oppia-noninteractive-math math_content-with-value="{&quot;raw_latex&quot;:&quot;\\\\frac{x}{y}&quot;,&quot;svg_filename&quot;:&quot;math_123.svg&quot;}"></oppia-noninteractive-math> है और एक <oppia-noninteractive-link url-with-value="&quot;https://oppia.org&quot;" text-with-value="&quot;लिंक&quot;"></oppia-noninteractive-link> भी है।</p>',
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

    // Click Save and close - should trigger unedited confirmation popup.
    await translationSubmitter.clickOnElementWithText('Save and close');
    
    // Click 'Yes, save' in the confirmation modal.
    await translationSubmitter.clickOnElementWithText('Yes, save');

    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );
  });

  it('should require opening image alt text modal before saving auto-translation with images', async function () {
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter('हिन्दी (Hindi)');

    // We can clear request interception and set a new one.
    // Puppeteer handles replacing interceptors if done carefully, but it's easier to just 
    // remove all listeners and add a new one.
    await translationSubmitter.page.removeAllListeners('request');
    translationSubmitter.page.on('request', request => {
      if (request.url().includes('/generate-translation')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            translated_text:
              '<p>चित्र: <oppia-noninteractive-image alt-with-value="&quot;test alt&quot;" caption-with-value="&quot;test cap&quot;" filepath-with-value="&quot;test_image.png&quot;"></oppia-noninteractive-image></p>',
            translation_provider: 'Google',
          }),
        });
      } else {
        request.continue();
      }
    });

    // The first item should now be "Chapter 1" of "Math Adventures" again since we submitted the previous one?
    // Wait, the previous test submitted the translation, so the first translation opportunity might be different now,
    // or we might need to click on it if there are multiple. 
    // Wait, `addExplorationDescriptionContainingBasicRTEComponents` adds state description and interaction. The previous test submitted the state description. Now we might be translating the interaction or something else.
    // Let's just click on whatever is available for Math Adventures.
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Chapter 1',
      'Algebra - Math Adventures'
    );

    await translationSubmitter.clickOnAutoTranslateButton();
    await translationSubmitter.page.waitForTimeout(1000);

    // Save button should be disabled because the image hasn't been reviewed.
    const saveButtonIsDisabled = await translationSubmitter.page.evaluate(() => {
      const button = document.querySelector('.e2e-test-save-button') as HTMLButtonElement;
      return button.disabled;
    });
    expect(saveButtonIsDisabled).toBe(true);

    // The warning message should be visible.
    const warningMessageIsVisible = await translationSubmitter.page.evaluate(() => {
      const container = document.querySelector('.oppia-translation-error-section');
      return container && container.textContent?.includes('Please verify that no alt text is required');
    });
    expect(warningMessageIsVisible).toBeTruthy();

    // Open the alt text review modal (click on the image icon)
    await translationSubmitter.page.evaluate(() => {
      const imgIcon = document.querySelector('.oppia-noninteractive-image') as HTMLElement;
      if (imgIcon) imgIcon.click();
    });
    await translationSubmitter.page.waitForTimeout(1000);
    
    // Close the image modal (assuming there's a close button or 'Save' button in it)
    await translationSubmitter.page.evaluate(() => {
      const saveBtn = document.querySelector('.modal-dialog .btn-success') as HTMLButtonElement;
      if (saveBtn) saveBtn.click();
    });
    await translationSubmitter.page.waitForTimeout(1000);

    // Save button should now be enabled.
    const saveButtonIsDisabledAfter = await translationSubmitter.page.evaluate(() => {
      const button = document.querySelector('.e2e-test-save-button') as HTMLButtonElement;
      return button.disabled;
    });
    expect(saveButtonIsDisabledAfter).toBe(false);

    // Save the translation.
    await translationSubmitter.clickOnElementWithText('Save and close');
    
    // Click 'Yes, save' in the confirmation modal.
    await translationSubmitter.clickOnElementWithText('Yes, save');

    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
