// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * TS.CD.01 Translate exploration in target language.
 */

import {test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  Contributor,
  ContributorFactory,
} from '../../utilities/user/contributor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {
  TranslationSubmitter,
  TranslationSubmitterFactory,
} from '../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

const FEATURED_LANGUAGES = [
  'português (Portuguese)',
  'العربية (Arabic)',
  'Naijá (Nigerian Pidgin)',
  'español (Spanish)',
  'kiswahili (Swahili)',
  'हिन्दी (Hindi)',
  'Harshen Hausa (Hausa)',
  'Ásụ̀sụ́ Ìgbò (Igbo)',
  'Èdè Yoùbá (Yoruba)',
] as const;

const HINDI_RTE_BUTTON_TITLES = {
  BOLD: 'बोल्ड',
  ITALIC: 'इटैलिक',
  NUMBERED_LIST: 'अंकीय सूची',
  BULLETED_LIST: 'बुलॅट सूची',
  PRE: 'Pre',
  BLOCK_QUOTE: 'ब्लॉक-कोट',
  INCREASE_INDENT: 'इन्डॅन्ट बढ़ायें',
  DECREASE_INDENT: 'इन्डॅन्ट कम करें',
  IMAGE: 'image',
  MATH_FORMULA: 'mathematical formula',
  CONCEPT_CARD: 'Concept Card',
} as const;

test.describe.configure({mode: 'serial'});

test.describe('Translation Submitter', function () {
  let translationSubmitter: LoggedInUser & Contributor & TranslationSubmitter;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor;

  test.beforeAll(async function ({browser}) {
    // Creating the topic, eleven explorations, and two stories can take several
    // minutes on a cold development server.
    test.setTimeout(2_100_000);

    translationSubmitter = await UserFactory.createNewUser(
      'translator',
      'translator@example.com',
      browser,
      [],
      undefined,
      [ContributorFactory, TranslationSubmitterFactory]
    );
    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdm@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdm.createAndPublishTopic(
      'Fractions',
      'Fraction Foundations',
      'Math'
    );

    // Create the exploration containing all rich-text components exercised by
    // the translation editor.
    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.dismissWelcomeModal();
    await curriculumAdm.addExplorationDescriptionContainingBasicRTEComponents();

    await curriculumAdm.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await curriculumAdm.viewOppiaResponses();
    await curriculumAdm.directLearnersToNewCard('Last Card');
    await curriculumAdm.saveExplorationDraft();
    await curriculumAdm.navigateToCard('Last Card');
    await curriculumAdm.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await curriculumAdm.addImageRTEToCardContent(
      testConstants.data.profilePicture,
      'Profile Photo',
      'Profile Photo'
    );

    await curriculumAdm.saveExplorationDraft();
    const explorationId = await curriculumAdm.publishExplorationWithMetadata(
      'Fair Shares',
      'Learn dividing a birthday cake into equal parts',
      'Mathematics'
    );

    await curriculumAdm.createAndPublishStoryWithChapter(
      'The Picnic Problem',
      'the-picnic-problem',
      'Cutting the Pies',
      explorationId,
      'Fractions'
    );

    const explorationIds =
      await curriculumAdm.createAndPublishExplorationsWithCards(10);

    await curriculumAdm.createTopic('States of Matter', 'states-of-matter');
    await curriculumAdm.addStoryToTopic(
      'The Mystery of the Melting Ice',
      'melting-ice',
      'States of Matter'
    );
    for (const id of explorationIds) {
      await curriculumAdm.addChapter(`Chapter ${id}`, id);
    }
    await curriculumAdm.saveStoryDraft();
    await curriculumAdm.publishStoryDraft();
  });

  test('should be able to navigate to contribution page', async function () {
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    // Username is only visible in desktop view.
    if (!translationSubmitter.isViewportAtMobileWidth()) {
      await translationSubmitter.expectUsernameToBe('translator');
    }
    await translationSubmitter.expectScreenshotToMatch('contributorDashboard');

    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.expectActiveTabNameToBe('Translate Text');
    await translationSubmitter.expectActiveTabDescriptionToBe(
      'Translate the lesson text to help non-English speakers follow the lessons.'
    );
    await translationSubmitter.expectTranslationOpportunitiesToBePresent(false);
    await translationSubmitter.expectScreenshotToMatch(
      'translationTabInContributionDashboard'
    );

    await translationSubmitter.clickOnLanguageFilterDropdown();
    await translationSubmitter.expectFeaturedLanguagesToContain([
      ...FEATURED_LANGUAGES,
    ]);
    await translationSubmitter.mouseOverFeaturedLanguageTooltip(
      0,
      'For learners in Brazil, Angola and Mozambique.'
    );

    await translationSubmitter.selectLanguageFilter('हिन्दी (Hindi)');
    await translationSubmitter.expectTranslationOpportunitiesToBePresent();
    await translationSubmitter.expectOpportunityToBePresent(
      'Cutting the Pies',
      'Fractions - The Picnic Problem'
    );

    await translationSubmitter.expectPaginationButtonToBeVisible('next');
    await translationSubmitter.expectPaginationButtonToBeVisible(
      'previous',
      false
    );
    await translationSubmitter.clickOnPaginationButtonInTranslationSubmitterPage(
      'next'
    );
    await translationSubmitter.expectPaginationButtonToBeVisible('next', false);
    await translationSubmitter.expectPaginationButtonToBeVisible('previous');
    await translationSubmitter.expectOpportunityToBePresent(
      'Cutting the Pies',
      'Fractions - The Picnic Problem',
      false
    );

    await translationSubmitter.clickOnPaginationButtonInTranslationSubmitterPage(
      'previous'
    );
    await translationSubmitter.selectSubjectInTranslateTextTab('Fractions');
    await translationSubmitter.expectPaginationButtonToBeVisible('next', false);
    await translationSubmitter.expectOpportunityToBePresent(
      'Cutting the Pies',
      'Fractions - The Picnic Problem'
    );
  });

  test('should be able to use RTE', async function () {
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'Cutting the Pies',
      'Fractions - The Picnic Problem'
    );

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.BOLD
    );
    await translationSubmitter.typeTextForRTE('बोल्ड टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.BOLD
    );

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.ITALIC
    );
    await translationSubmitter.typeTextForRTE('इटैलिक टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.ITALIC
    );

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.NUMBERED_LIST
    );
    await translationSubmitter.typeTextForRTE('अंकीय सूची टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.INCREASE_INDENT
    );
    await translationSubmitter.typeTextForRTE('इन्डॅन्ट बढ़ायें');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.DECREASE_INDENT
    );
    await translationSubmitter.typeTextForRTE('इन्डॅन्ट कम करें');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.NUMBERED_LIST
    );

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.BULLETED_LIST
    );
    await translationSubmitter.typeTextForRTE('बुलॅट सूची टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.BULLETED_LIST
    );

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.PRE
    );
    await translationSubmitter.typeTextForRTE('Pre स्वरूपित पाठ');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.BLOCK_QUOTE
    );
    await translationSubmitter.typeTextForRTE('ब्लॉक-कोट टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.BLOCK_QUOTE
    );

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.IMAGE
    );
    await translationSubmitter.clickOnElementWithText('UPLOAD');
    await translationSubmitter.uploadFile(testConstants.data.profilePicture);
    await translationSubmitter.clickOnElementWithText('Use This Image');
    await translationSubmitter.expectImageUploadToComplete();
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'textarea',
      'छवि विवरण'
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'तस्वीर का शीर्षक'
    );
    await translationSubmitter.clickOnSaveButtonInCustomizeRTEModal();
    await translationSubmitter.page.keyboard.press('ArrowRight');

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.MATH_FORMULA
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'textarea',
      '\\frac{x}{y}'
    );
    await translationSubmitter.clickOnSaveButtonInCustomizeRTEModal();
    await translationSubmitter.page.keyboard.press('Enter');

    await translationSubmitter.clickOnRTEOptionContainingTitle(
      HINDI_RTE_BUTTON_TITLES.CONCEPT_CARD
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'संक्षिप्त होने वाला ब्लॉक खोल लिया है।'
    );
    await translationSubmitter.selectSkillInConceptCard('Math');
    await translationSubmitter.clickOnSaveButtonInCustomizeRTEModal();
    await translationSubmitter.page.keyboard.press('Enter');
  });

  test('should be able to use copy tool', async function () {
    await translationSubmitter.clickOnElementWithText(
      'Save and translate another'
    );
    await translationSubmitter.expectTranslationSubmittedToast();
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.clickAndVerifyAnchorWithInnerText(
      'here',
      'https://oppia-user-guide.readthedocs.io/en/latest/contributor/translate.html'
    );
    await translationSubmitter.expectCopyToolWorksProperly(
      'छवि विवरण',
      'तस्वीर का शीर्षक'
    );
  });

  test('should be able to submit the translation', async function () {
    await translationSubmitter.clickOnElementWithText('Save and close');
    await translationSubmitter.expectTranslationSubmittedToast();
  });

  test('should be able to persist selected translation language', async function () {
    await translationSubmitter.page.reload();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.expectSelectedFilterLanguageToBe(
      'हिन्दी (Hindi)'
    );
  });

  test('should be able to check status of the translations', async function () {
    await translationSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );
    await translationSubmitter.expectContributionStatusToBe(
      'बोल्ड टेक्स्ट इटैलिक टेक्स्...',
      'Fractions / The Picnic',
      'Awaiting review'
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
