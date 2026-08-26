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
 * @fileoverview Acceptance test for the AI auto-translate button on the
 * Contributor Dashboard translation modal.
 *
 * TS.CD.AUTO.01  Verify that the auto-translate button is visible on the
 *                translation modal.
 * TS.CD.AUTO.02  Verify that clicking the button populates the editor and
 *                shows the AI-generated badge.
 * TS.CD.AUTO.03  Verify that editing the AI-generated text changes the badge
 *                to "AI-generated · edited".
 * TS.CD.AUTO.04  Verify that math component tags (oppia-noninteractive-math)
 *                are preserved in the translated output.
 * TS.CD.AUTO.05  Verify that hyperlink URL attributes are preserved in the
 *                translated output.
 *
 * NOTE: The /generate-translation endpoint is intercepted by the browser's
 * Network DevTools (via Puppeteer's request interception) and returns a
 * synthetic response so that these tests do not require a live AI provider.
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

const ROLES = testConstants.Roles;

Error.stackTraceLimit = 20;

/** Source HTML with a math component used in translation tests. */
const MATH_CONTENT_HTML =
  '<p>The area is ' +
  '<oppia-noninteractive-math ' +
  'math_content-with-value=\'{&quot;raw_latex&quot;:&quot;A=\\\\pi r^2&quot;}\'>' +
  '</oppia-noninteractive-math>' +
  '.</p>';

/** Translated version that preserves the math component tag. */
const MATH_TRANSLATED_HTML =
  '<p>El área es ' +
  '<oppia-noninteractive-math ' +
  'math_content-with-value=\'{&quot;raw_latex&quot;:&quot;A=\\\\pi r^2&quot;}\'>' +
  '</oppia-noninteractive-math>' +
  '.</p>';

/** Source HTML with a hyperlink component. */
const LINK_CONTENT_HTML =
  '<p>Visit ' +
  '<oppia-noninteractive-link ' +
  'url-with-value="&amp;quot;https://oppia.org&amp;quot;" ' +
  'text-with-value="&amp;quot;Oppia&amp;quot;">' +
  '</oppia-noninteractive-link>' +
  '.</p>';

/** Translated version that preserves the hyperlink URL. */
const LINK_TRANSLATED_HTML =
  '<p>Visita ' +
  '<oppia-noninteractive-link ' +
  'url-with-value="&amp;quot;https://oppia.org&amp;quot;" ' +
  'text-with-value="&amp;quot;Oppia&amp;quot;">' +
  '</oppia-noninteractive-link>' +
  '.</p>';

/**
 * A fake /generate-translation response that covers the standard case
 * (plain text without special components).
 */
const PLAIN_TRANSLATION_RESPONSE = {
  translated_text: '<p>Contenido traducido por IA.</p>',
  translation_provider: 'azure',
};

describe('Translation Submitter — Auto-translate button', function () {
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;

  beforeAll(async function () {
    // Create the users needed for this test suite.
    translationSubmitter = await UserFactory.createNewUser(
      'autoTranslateSubmitter',
      'autoTranslateSubmitter@example.com'
    );
    curriculumAdm = await UserFactory.createNewUser(
      'autoTranslateAdmin',
      'autoTranslateAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Create a topic so that the exploration can be published.
    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      'Auto-translate Test Topic',
      'Auto-translate Foundation',
      'Math'
    );

    // Create and publish an exploration with rich-text content so there is
    // translatable content available on the contributor dashboard.
    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.dismissWelcomeModal();
    await curriculumAdm.updateContentWithTextAndMathComponent(
      'What is π r²?',
      MATH_CONTENT_HTML
    );
    await curriculumAdm.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await curriculumAdm.saveExplorationDraft();
    await curriculumAdm.publishExploration();
    await curriculumAdm.addExplorationToNewStory(
      'Auto-translate Story',
      'Auto-translate Story URL',
      'Auto-translate Test Topic'
    );
  }, 450000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });

  describe('TS.CD.AUTO.01 — Auto-translate button visibility', function () {
    it(
      'should show the auto-translate button when the modal is open ' +
        'and the data format is html',
      async function () {
        await translationSubmitter.navigateToContributorDashboardPage();
        await translationSubmitter.navigateToTranslateTextTab();

        // Intercept the /generate-translation request before opening the
        // modal so the button works without a live AI service.
        await translationSubmitter.interceptTranslationRequests(
          '/generate-translation',
          PLAIN_TRANSLATION_RESPONSE
        );

        await translationSubmitter.clickButtonToStartTranslating();
        await translationSubmitter.selectLanguage('español (Spanish)');

        const isVisible =
          await translationSubmitter.isAutoTranslateButtonVisible();
        expect(isVisible).toBeTrue();
      }
    );
  });

  describe('TS.CD.AUTO.02 — Editor population and badge display', function () {
    it(
      'should populate the editor with translated text and display the ' +
        '"AI-generated" badge after clicking auto-translate',
      async function () {
        await translationSubmitter.navigateToContributorDashboardPage();
        await translationSubmitter.navigateToTranslateTextTab();
        await translationSubmitter.interceptTranslationRequests(
          '/generate-translation',
          PLAIN_TRANSLATION_RESPONSE
        );
        await translationSubmitter.clickButtonToStartTranslating();
        await translationSubmitter.selectLanguage('español (Spanish)');

        await translationSubmitter.clickAutoTranslateButton();

        const editorContent =
          await translationSubmitter.getTranslationEditorContent();
        expect(editorContent).toContain('Contenido traducido por IA');

        const badgeVisible =
          await translationSubmitter.isAiGeneratedBadgeVisible();
        expect(badgeVisible).toBeTrue();

        const editedBadgeVisible =
          await translationSubmitter.isAiEditedBadgeVisible();
        expect(editedBadgeVisible).toBeFalse();
      }
    );
  });

  describe('TS.CD.AUTO.03 — Edited badge after contributor modification', function () {
    it(
      'should switch the badge to "AI-generated · edited" when the ' +
        'contributor modifies the auto-translated text',
      async function () {
        await translationSubmitter.navigateToContributorDashboardPage();
        await translationSubmitter.navigateToTranslateTextTab();
        await translationSubmitter.interceptTranslationRequests(
          '/generate-translation',
          PLAIN_TRANSLATION_RESPONSE
        );
        await translationSubmitter.clickButtonToStartTranslating();
        await translationSubmitter.selectLanguage('español (Spanish)');

        await translationSubmitter.clickAutoTranslateButton();
        // Verify the plain badge is shown first.
        expect(
          await translationSubmitter.isAiGeneratedBadgeVisible()
        ).toBeTrue();

        // Simulate the contributor editing the AI-generated text.
        await translationSubmitter.editTranslationInEditor(
          ' (editado por el contribuidor)'
        );

        // The "edited" variant should now be shown.
        expect(
          await translationSubmitter.isAiEditedBadgeVisible()
        ).toBeTrue();
        expect(
          await translationSubmitter.isAiGeneratedBadgeVisible()
        ).toBeFalse();
      }
    );
  });

  describe(
    'TS.CD.AUTO.04 — Math component preservation',
    function () {
      it(
        'should preserve oppia-noninteractive-math tags in the translated ' +
          'HTML returned by the backend',
        async function () {
          await translationSubmitter.navigateToContributorDashboardPage();
          await translationSubmitter.navigateToTranslateTextTab();
          // Intercept with a response that retains the math component.
          await translationSubmitter.interceptTranslationRequests(
            '/generate-translation',
            {
              translated_text: MATH_TRANSLATED_HTML,
              translation_provider: 'azure',
            }
          );
          await translationSubmitter.clickButtonToStartTranslating();
          await translationSubmitter.selectLanguage('español (Spanish)');

          await translationSubmitter.clickAutoTranslateButton();

          // The component verifies the translation is valid by checking that
          // all RTE components from the source are present in the translation.
          // If math tags were stripped, the editor would show a validation
          // error; we assert that NO such error is shown.
          const hasError =
            await translationSubmitter.isTranslationIncompleteErrorVisible();
          expect(hasError).toBeFalse();

          const editorHtml =
            await translationSubmitter.getTranslationEditorContent();
          // The raw editor content must contain the math component tag.
          expect(editorHtml).toContain('oppia-noninteractive-math');
        }
      );
    }
  );

  describe(
    'TS.CD.AUTO.05 — Hyperlink URL preservation',
    function () {
      it(
        'should preserve the URL attribute of oppia-noninteractive-link ' +
          'tags in the translated HTML',
        async function () {
          await translationSubmitter.navigateToContributorDashboardPage();
          await translationSubmitter.navigateToTranslateTextTab();
          await translationSubmitter.interceptTranslationRequests(
            '/generate-translation',
            {
              translated_text: LINK_TRANSLATED_HTML,
              translation_provider: 'azure',
            }
          );
          await translationSubmitter.clickButtonToStartTranslating();
          await translationSubmitter.selectLanguage('español (Spanish)');

          await translationSubmitter.clickAutoTranslateButton();

          const editorHtml =
            await translationSubmitter.getTranslationEditorContent();
          // The translated HTML must preserve both the tag and the original URL.
          expect(editorHtml).toContain('oppia-noninteractive-link');
          expect(editorHtml).toContain('https://oppia.org');
        }
      );
    }
  );
});
