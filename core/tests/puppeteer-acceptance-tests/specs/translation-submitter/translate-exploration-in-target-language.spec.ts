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

import {RTE_BUTTON_TITLES} from '../../utilities/common/rte-editor';
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
const youtubeVideoURL = 'https://www.youtube.com/watch?v=mDfiDLn2Rko';

Error.stackTraceLimit = 20;

describe('Translation Submitter', function () {
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
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

    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      'Fractions',
      'Understanding Numerators',
      'Recognize equivalent fractions'
    );
    await curriculumAdm.createSkillForTopic('Math', 'Fractions');

    // Create an exploration.
    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.dismissWelcomeModal();
    await curriculumAdm.addImageRTEToCardContent(
      testConstants.data.profilePicture,
      'Image Description',
      'Image Caption'
    );
    // await curriculumAdm.addExplorationDescriptionContainingAllRTEComponents();
    await curriculumAdm.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await curriculumAdm.viewOppiaResponses();
    await curriculumAdm.directLearnersToNewCard('Last Card');
    await curriculumAdm.saveExplorationDraft();
    await curriculumAdm.navigateToCard('Last Card');
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

    await curriculumAdm.createAndPublishStoryWithChapter(
      'Dividing a Birthday Cake',
      'dividing-a-birthday-cake',
      'The Birthday Cake Arrives',
      explorationId as string,
      'Fractions'
    );

    await curriculumAdm.createAndPublishTopic(
      'Test Topic',
      'Test Subtopic',
      'Test Skill'
    );
    await curriculumAdm.addStoryToTopic(
      'Test Story',
      'test-story',
      'Test Topic'
    );

    for (const id of explorationIds) {
      await curriculumAdm.openStoryEditor('Test Story', 'Test Topic');
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
    await translationSubmitter.expectActiveTabNameToBe('Translate Text');
    await translationSubmitter.expectActiveTabDescriptionToBe(
      'Translate the lesson text to help non-English speakers follow the lessons.'
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

    // Check if common buttons work properly.
    await translationSubmitter.clickOnSkipTranslationButton();
    await translationSubmitter.toggleCopyButton('On');
    await translationSubmitter.toggleCopyButton('Off');
    await translationSubmitter.closeTranslateTextModal();
  });

  it('should be able to use copy tool', async function () {
    // Open the translation modal again.
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      'The Birthday Cake Arrives',
      'Dividing a Birthday Cake'
    );
    await translationSubmitter.expectCopyToolWorksProperly(
      'छवि विवरण',
      'तस्वीर का शीर्षक'
    );
  });

  it('should be able to use RTE', async function () {
    // Bold Text.
    await translationSubmitter.clickOnRTEOptionContainingTitle('बोल्ड');
    await translationSubmitter.typeTextForRTE('बोल्ड टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle('बोल्ड');

    // Italic Text.
    await translationSubmitter.clickOnRTEOptionContainingTitle('इटैलिक');
    await translationSubmitter.typeTextForRTE('इटैलिक टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle('इटैलिक');

    // Numbered List, INcrease Indent, and Decrease Indent.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.NUM_LIST.HI
    );
    await translationSubmitter.typeTextForRTE('अंकीय सूची टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.INCR_INDENT.HI
    );
    await translationSubmitter.typeTextForRTE('इन्डॅन्ट बढ़ायें');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.DECR_INDENT.HI
    );
    await translationSubmitter.typeTextForRTE('इन्डॅन्ट कम करें');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.NUM_LIST.HI
    );

    // Bulleted List.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.BULLETED_LIST.HI
    );
    await translationSubmitter.typeTextForRTE('बुलॅट सूची टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.BULLETED_LIST.HI
    );

    // Pre formatted Text.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.PRE.HI
    );
    await translationSubmitter.typeTextForRTE('Pre स्वरूपित पाठ');

    // Block Quote.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.BLOCK_QUOTE.HI
    );
    await translationSubmitter.typeTextForRTE('ब्लॉक-कोट टेक्स्ट');
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.BLOCK_QUOTE.HI
    );

    // Collapsible Block.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.COLLAPSIBLE.HI
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'नमूना शीर्षलेख'
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'rte',
      'आपने संक्षिप्त होने वाला ब्लॉक खोल लिया है।'
    );
    await translationSubmitter.clickOn('Done');

    // Image.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.IMAGE.HI
    );
    await translationSubmitter.clickOn('UPLOAD');
    await translationSubmitter.uploadFile(testConstants.data.profilePicture);
    await translationSubmitter.clickOn('Use This Image');
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'textarea',
      'छवि विवरण'
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'तस्वीर का शीर्षक'
    );
    await translationSubmitter.clickOn('Done');

    // Link.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.LINK.HI
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'https://www.oppia.org'
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'ओपीआ',
      1
    );
    await translationSubmitter.clickOn('Done');

    // Math Formula.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.MATH_FORMULA.HI
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'textarea',
      '\\frac{x}{y}'
    );
    await translationSubmitter.clickOn('Done');

    // Concept Card.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.CONCEPT_CARD.HI
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'संक्षिप्त होने वाला ब्लॉक खोल लिया है।'
    );
    await translationSubmitter.clickOn('Done');

    // Tabs.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.TABS.HI
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'संकेत परिचय'
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'rte',
      'टैब सामग्री'
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      'संकेत 1',
      1
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'rte',
      'टैब सामग्री 1',
      1
    );
    await translationSubmitter.clickOn('Done');

    // Video RTE.
    await translationSubmitter.clickOnRTEOptionContainingTitle(
      RTE_BUTTON_TITLES.VIDEO.HI
    );
    await translationSubmitter.fillValueInTranslateTextCustomizeComponent(
      'input',
      youtubeVideoURL
    );
    await translationSubmitter.clickOn('Done');
  });

  it('should be able submit a translation', async function () {
    await translationSubmitter.clickOn('Save and translate another');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
