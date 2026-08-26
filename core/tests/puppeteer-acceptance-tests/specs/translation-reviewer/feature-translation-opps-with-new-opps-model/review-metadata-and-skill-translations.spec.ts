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
 * @fileoverview Acceptance test for reviewing exploration metadata and skill
 * translations, and for the "Content Type" filter on the review tab. Both only
 * exist when ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS is on.
 *
 * TR.1 Filter the review list by content type.
 * TR.2 Review metadata translations and skill translations.
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
import {TranslationReviewer} from '../../../utilities/user/translation-reviewer';
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

const LESSON_SUBHEADING = `Exploration - ${TOPIC_NAME}`;
const SKILL_SUBHEADING = `Skill - ${TOPIC_NAME}`;

const CONTENT_TYPE_TITLE = 'title';
const CONTENT_TYPE_OBJECTIVE = 'objective';
const CONTENT_TYPE_SKILL_DESCRIPTION = 'skill description';
const CONTENT_TYPE_SKILL_EXPLANATION = 'skill explanation';

// A suggestion row truncates its heading at 30 characters, and the heading is
// the translation itself, so any translation looked up by heading below is
// kept under that limit.
const HINDI_TITLE = 'पाई काटना';
const HINDI_OBJECTIVE = 'केक को बराबर हिस्सों में बाँटना सीखें';
const HINDI_SKILL_DESCRIPTION = 'इकाई भिन्न';
const HINDI_SKILL_EXPLANATION = 'इकाई भिन्न की समीक्षा';

// The action button an opportunity card carries on the review tab. It opens
// the card's own suggestions rather than a review, which is what "Review" on
// each individual suggestion inside does.
const OPPORTUNITY_ACTION_BUTTON_LABEL = 'Translations';

// The review modal walks through the suggestions that follow the row that was
// opened, so it names the next one until the last is reached.
const ACCEPT_AND_REVIEW_NEXT_LABEL = 'Accept and review next';
const ACCEPT_LABEL = 'Accept';
const REJECT_LABEL = 'Reject';

const MAX_ITEMS_TO_SKIP = 15;

describe('Translation Reviewer', function () {
  let translationReviewer: TranslationReviewer & Contributor & LoggedInUser;
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    translationReviewer = await UserFactory.createNewUser(
      'translationReviewer',
      'translation_reviewer@example.com',
      [ROLES.TRANSLATION_REVIEWER],
      'hi'
    );
    translationSubmitter = await UserFactory.createNewUser(
      'translationSubmitter',
      'translation_submitter@example.com'
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
    const explorationId = await curriculumAdm.publishExplorationWithMetadata(
      EXPLORATION_TITLE,
      EXPLORATION_OBJECTIVE,
      'Mathematics'
    );

    await curriculumAdm.createAndPublishStoryWithChapter(
      'The Picnic Problem',
      'the-picnic-problem',
      CHAPTER_NAME,
      explorationId,
      TOPIC_NAME
    );

    // Submit the metadata and skill translations that this spec reviews.
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationSubmitter.selectSubjectInTranslateTextTab(TOPIC_NAME);

    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.LESSONS
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      CHAPTER_NAME,
      LESSON_SUBHEADING
    );
    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_TITLE,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.typeTextInTranslationInput(HINDI_TITLE);
    await translationSubmitter.saveTranslationAndMoveToNextItem();
    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_OBJECTIVE,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.typeTextInTranslationInput(HINDI_OBJECTIVE);
    await translationSubmitter.saveTranslationAndMoveToNextItem(
      'Submitted translation for review.'
    );
    await translationSubmitter.closeTranslateTextModal();

    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
      SKILL_NAME,
      SKILL_SUBHEADING
    );
    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_SKILL_DESCRIPTION,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.typeTextInTranslationInput(
      HINDI_SKILL_DESCRIPTION
    );
    await translationSubmitter.saveTranslationAndMoveToNextItem();
    await translationSubmitter.skipToTranslationItemOfContentType(
      CONTENT_TYPE_SKILL_EXPLANATION,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.typeTextForRTE(HINDI_SKILL_EXPLANATION);
    await translationSubmitter.clickOnElementWithText('Save and close');
    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );
  }, 2100000);

  it('should list both content types on the review tab', async function () {
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.filterContentByTopic(TOPIC_NAME);
    await translationReviewer.selectContentTypeFilter(CONTENT_TYPE_FILTER.ALL);

    // The lesson and the skill are listed together, each carrying the action
    // button that opens its own suggestions.
    await translationReviewer.expectOpportunityActionButtonToBe(
      CHAPTER_NAME,
      LESSON_SUBHEADING,
      OPPORTUNITY_ACTION_BUTTON_LABEL
    );
    await translationReviewer.expectOpportunityActionButtonToBe(
      SKILL_NAME,
      SKILL_SUBHEADING,
      OPPORTUNITY_ACTION_BUTTON_LABEL
    );
  });

  it('should list skill suggestions without an opportunity card', async function () {
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );

    // The skills filter shows the suggestions straight away, so the control
    // that returns from a lesson's suggestions to the lesson list is absent.
    await translationReviewer.expectBackToLessonsControlToBeVisible(false);
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_SKILL_DESCRIPTION,
      SKILL_NAME
    );
  });

  it('should be able to open a skill from the mixed list', async function () {
    // Reaching a skill's suggestions through its opportunity card is a
    // different path from the skills filter above, which skips the card, so
    // both are covered.
    await translationReviewer.selectContentTypeFilter(CONTENT_TYPE_FILTER.ALL);
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      SKILL_NAME,
      SKILL_SUBHEADING
    );
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_SKILL_EXPLANATION,
      SKILL_NAME
    );
  });

  it('should be able to accept and reject a skill translation', async function () {
    // The skill has two pending suggestions. Opening the first row means one
    // suggestion still follows it, which is what makes the labels below
    // deterministic rather than dependent on how the list is sorted.
    await translationReviewer.openFirstSuggestionForReview();

    await translationReviewer.expectReviewButtonLabelToBe(
      'accept',
      ACCEPT_AND_REVIEW_NEXT_LABEL
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'accept',
      'Suggestion accepted.'
    );

    // Accepting the first suggestion leaves the modal open on the second and
    // last one, where both buttons drop the mention of a next suggestion.
    await translationReviewer.expectReviewButtonLabelToBe(
      'accept',
      ACCEPT_LABEL
    );
    await translationReviewer.expectReviewButtonLabelToBe(
      'reject',
      REJECT_LABEL
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'reject',
      'Suggestion rejected.',
      'Please match the wording used in the lesson.'
    );
  });

  it('should be able to review a metadata translation', async function () {
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.LESSONS
    );
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      CHAPTER_NAME,
      LESSON_SUBHEADING
    );

    // A lesson's suggestions are reached through its opportunity card, so the
    // control that returns to the lesson list is present here.
    await translationReviewer.expectBackToLessonsControlToBeVisible();

    await translationReviewer.startTranslationReview(
      HINDI_TITLE,
      `${TOPIC_NAME} / ${CHAPTER_NAME}`
    );
    await translationReviewer.expectCardContentToBeInTranslationReview(
      HINDI_TITLE
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'accept',
      'Suggestion accepted.'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
