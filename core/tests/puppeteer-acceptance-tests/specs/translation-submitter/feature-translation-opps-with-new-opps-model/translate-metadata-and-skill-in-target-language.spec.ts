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
 * @fileoverview Acceptance test for translating exploration metadata and
 * skills, and for the "Content Type" filter that selects between them. Both
 * only exist when ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS is on.
 *
 * TS.1 Filter opportunities by content type.
 * TS.2 Translate exploration metadata, and translate a skill.
 */

import testConstants from '../../../utilities/common/test-constants';
import {UserFactory} from '../../../utilities/common/user-factory';
import {
  Contributor,
  CONTENT_TYPE_FILTER,
} from '../../../utilities/user/contributor';
import {CurriculumAdmin} from '../../../utilities/user/curriculum-admin';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../../utilities/user/logged-in-user';
import {ReleaseCoordinator} from '../../../utilities/user/release-coordinator';
import {TopicManager} from '../../../utilities/user/topic-manager';
import {TranslationSubmitter} from '../../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

Error.stackTraceLimit = 20;

const TRANSLATION_LANGUAGE = 'हिन्दी (Hindi)';

const TOPIC_NAME = 'Fractions';
const SUBTOPIC_NAME = 'Fraction Foundations';
const SKILL_NAME = 'unit fractions';
const CHAPTER_NAME = 'Cutting the Pies';

const EXPLORATION_TITLE = 'Fair Shares';
const EXPLORATION_OBJECTIVE = 'Learn dividing a birthday cake into equal parts';
const EXPLORATION_CATEGORY = 'Mathematics';
const EXPLORATION_TAG = 'fractions';

// The subheadings the opportunity list gives each content type, built from the
// entity type and the topic the opportunity belongs to.
const LESSON_SUBHEADING = `Exploration - ${TOPIC_NAME}`;
const SKILL_SUBHEADING = `Skill - ${TOPIC_NAME}`;

// The content types as the translation modal spells them out to a contributor.
const CONTENT_TYPE_TITLE = 'title';
const CONTENT_TYPE_OBJECTIVE = 'objective';
const CONTENT_TYPE_SKILL_DESCRIPTION = 'skill description';
const CONTENT_TYPE_SKILL_EXPLANATION = 'skill explanation';

// The skill's concept card explanation is built from its description by
// createSkillForTopic, so the source text of the explanation item is known.
const SKILL_EXPLANATION = `Review material text content for ${SKILL_NAME}.`;

const HINDI_TITLE = 'पाई काटना';
const HINDI_OBJECTIVE =
  'जन्मदिन के केक को बराबर हिस्सों में बाँटना सीखें और भिन्नों को समझें';
const HINDI_SKILL_DESCRIPTION = 'इकाई भिन्न';
const HINDI_SKILL_EXPLANATION = 'इकाई भिन्न के लिए समीक्षा सामग्री।';

// A lesson title translation is capped at the width the lesson tile can show.
// Anything longer is refused with the message below and the save button is
// disabled until it is shortened.
const TITLE_CHARACTER_LIMIT = 36;
const OVERLONG_HINDI_TITLE = 'पाई काटना और बराबर हिस्सों में बाँटना सीखिए';
const TITLE_LENGTH_ERROR =
  'Translation exceeds the allowed character limit. The translation for ' +
  `the above content must be ${TITLE_CHARACTER_LIMIT} characters or fewer.`;

// The number of items the modal may serve before the one under test. A lesson
// has one item per card plus one per populated metadata field, so this is
// generous enough to reach any of them and small enough to fail rather than
// loop forever.
const MAX_ITEMS_TO_SKIP = 15;

describe('Translation Submitter', function () {
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    translationSubmitter = await UserFactory.createNewUser(
      'translator',
      'translator@example.com'
    );
    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'enable_translation_opps_with_new_opp_models'
    );

    // A skill only gets a translation opportunity while it is assigned to a
    // topic, so the skill is created through the topic that owns it.
    await curriculumAdm.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdm.createAndPublishTopic(
      TOPIC_NAME,
      SUBTOPIC_NAME,
      SKILL_NAME
    );

    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.dismissWelcomeModal();
    await curriculumAdm.updateCardContent(
      'A birthday cake is cut into equal pieces.'
    );
    await curriculumAdm.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await curriculumAdm.saveExplorationDraft();

    // The tag gives the lesson a tag metadata item to translate, alongside the
    // title, objective and category items.
    const explorationId = await curriculumAdm.publishExplorationWithMetadata(
      EXPLORATION_TITLE,
      EXPLORATION_OBJECTIVE,
      EXPLORATION_CATEGORY,
      EXPLORATION_TAG
    );

    await curriculumAdm.createAndPublishStoryWithChapter(
      'The Picnic Problem',
      'the-picnic-problem',
      CHAPTER_NAME,
      explorationId,
      TOPIC_NAME
    );
  }, 2100000);

  it('should be able to filter the opportunity list by content type', async function () {
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationSubmitter.selectSubjectInTranslateTextTab(TOPIC_NAME);

    // The filter offers exactly three options and starts on "All".
    await translationSubmitter.expectSelectedContentTypeFilterToBe(
      CONTENT_TYPE_FILTER.ALL
    );
    await translationSubmitter.expectContentTypeFilterOptionsToBe([
      CONTENT_TYPE_FILTER.ALL,
      CONTENT_TYPE_FILTER.LESSONS,
      CONTENT_TYPE_FILTER.SKILLS,
    ]);

    // "All" lists the lesson and the skill together, each under a subheading
    // naming its own content type.
    await translationSubmitter.selectContentTypeFilter(CONTENT_TYPE_FILTER.ALL);
    await translationSubmitter.expectOpportunityToBePresent(
      CHAPTER_NAME,
      LESSON_SUBHEADING
    );
    await translationSubmitter.expectOpportunityToBePresent(
      SKILL_NAME,
      SKILL_SUBHEADING
    );

    // "Lessons" drops the skill.
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.LESSONS
    );
    await translationSubmitter.expectOpportunityToBePresent(
      CHAPTER_NAME,
      LESSON_SUBHEADING
    );
    await translationSubmitter.expectOpportunityToBePresent(
      SKILL_NAME,
      SKILL_SUBHEADING,
      false
    );

    // "Skills" drops the lesson.
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationSubmitter.expectOpportunityToBePresent(
      SKILL_NAME,
      SKILL_SUBHEADING
    );
    await translationSubmitter.expectOpportunityToBePresent(
      CHAPTER_NAME,
      LESSON_SUBHEADING,
      false
    );
  });

  it('should not show the content type filter on tabs that cannot use it', async function () {
    // "Submit Question" is not checked here because that tab is only shown to
    // a user who can suggest questions, which a translator cannot.
    await translationSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );
    await translationSubmitter.navigateToTabInMyContributions(
      'Contribution Stats'
    );
    await translationSubmitter.expectContentTypeFilterToBeVisible(false);

    await translationSubmitter.navigateToTabInMyContributions('Badges');
    await translationSubmitter.expectContentTypeFilterToBeVisible(false);
  });

  it('should be able to translate exploration metadata', async function () {
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.LESSONS
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      CHAPTER_NAME,
      LESSON_SUBHEADING
    );

    // The title item names its content type in words and shows the English
    // title as its source text.
    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_TITLE,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.expectTranslationInstructionToBe(
      CONTENT_TYPE_TITLE,
      TRANSLATION_LANGUAGE
    );
    await translationSubmitter.expectTextToTranslateToBe(EXPLORATION_TITLE);

    // A title translation over the limit is refused and blocks the save.
    await translationSubmitter.typeTextInTranslationInput(OVERLONG_HINDI_TITLE);
    await translationSubmitter.expectTranslationErrorToBe(TITLE_LENGTH_ERROR);
    await translationSubmitter.expectSaveTranslationButtonToBeEnabled(false);

    // Shortening it clears the error and allows the save.
    await translationSubmitter.typeTextInTranslationInput(HINDI_TITLE);
    await translationSubmitter.expectNoTranslationErrors();
    await translationSubmitter.expectSaveTranslationButtonToBeEnabled();
    await translationSubmitter.saveTranslationAndMoveToNextItem();

    // The limit is the title's alone, so the same length is accepted for the
    // objective.
    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_OBJECTIVE,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.expectTextToTranslateToBe(EXPLORATION_OBJECTIVE);
    await translationSubmitter.typeTextInTranslationInput(HINDI_OBJECTIVE);
    await translationSubmitter.expectNoTranslationErrors();
    await translationSubmitter.expectSaveTranslationButtonToBeEnabled();
    await translationSubmitter.saveTranslationAndMoveToNextItem(
      'Submitted translation for review.'
    );
    await translationSubmitter.closeTranslateTextModal();
  });

  it('should be able to translate a skill', async function () {
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      SKILL_NAME,
      SKILL_SUBHEADING
    );

    // A skill's items are its description, then its concept card explanation.
    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_SKILL_DESCRIPTION,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.expectTranslationInstructionToBe(
      CONTENT_TYPE_SKILL_DESCRIPTION,
      TRANSLATION_LANGUAGE
    );
    await translationSubmitter.expectTextToTranslateToBe(SKILL_NAME);
    await translationSubmitter.typeTextInTranslationInput(
      HINDI_SKILL_DESCRIPTION
    );
    await translationSubmitter.saveTranslationAndMoveToNextItem();

    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_SKILL_EXPLANATION,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.expectTranslationInstructionToBe(
      CONTENT_TYPE_SKILL_EXPLANATION,
      TRANSLATION_LANGUAGE
    );
    await translationSubmitter.expectTextToTranslateToBe(SKILL_EXPLANATION);
    await translationSubmitter.typeTextForRTE(HINDI_SKILL_EXPLANATION);
    await translationSubmitter.clickOnElementWithText('Save and close');

    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );
  });

  it('should list the submitted metadata and skill translations', async function () {
    await translationSubmitter.switchToTabInContributionDashboard(
      'My Contributions'
    );

    // A metadata translation is listed against the lesson it belongs to.
    await translationSubmitter.expectContributionStatusToBe(
      HINDI_TITLE,
      `${TOPIC_NAME} / ${CHAPTER_NAME}`,
      'Awaiting review'
    );

    // A skill translation is listed under the skill's description rather than
    // under its id or a placeholder for a deleted opportunity.
    await translationSubmitter.expectContributionStatusToBe(
      HINDI_SKILL_DESCRIPTION,
      SKILL_NAME,
      'Awaiting review'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
