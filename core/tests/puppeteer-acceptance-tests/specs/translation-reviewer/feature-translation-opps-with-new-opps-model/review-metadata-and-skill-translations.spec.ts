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
 * translations. Only exists when ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS is on.
 *
 * TR.2 Review exploration metadata translations.
 * TR.2 Review skill translations.
 * TR.2 Delete a skill with pending translations.
 * TR.2 Unassign and reassign a skill with translations.
 *
 * CUJ Link: https://docs.google.com/spreadsheets/d/1IfKAMEZHl0qJTr0OPo6obImMHXgb-8WM5eAHLfgXsfM/edit?gid=659609865#gid=659609865
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
const CONTENT_TYPE_MISCONCEPTION_FEEDBACK = 'misconception feedback';
const SKILL_EXPLANATION = 'Review material for unit fractions.';
const MISCONCEPTION_FEEDBACK = 'A unit fraction has numerator one.';
const DELETION_SKILL_NAME = 'unit fractions deletion check';
const REASSIGNMENT_SKILL_NAME = 'unit fractions reassignment check';

const HINDI_TITLE = 'पाई काटना';
const HINDI_OBJECTIVE = 'केक को बराबर हिस्सों में बाँटना सीखें';
const HINDI_SKILL_DESCRIPTION = 'इकाई भिन्न';
const HINDI_SKILL_EXPLANATION = 'इकाई भिन्न के लिए समीक्षा सामग्री।';
const HINDI_MISCONCEPTION_FEEDBACK = 'इकाई भिन्न का अंश एक होता है।';

// The review modal walks through the suggestions that follow the row that was
// opened, so it names the next one until the last is reached.
const ACCEPT_AND_REVIEW_NEXT_LABEL = 'Accept and review next';
const ACCEPT_LABEL = 'Accept';
const REJECT_AND_REVIEW_NEXT_LABEL = 'Reject and review next';

const MAX_ITEMS_TO_SKIP = 15;

describe('Translation Reviewer: review translations', function () {
  let translationReviewer: TranslationReviewer & Contributor & LoggedInUser;
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;

  /** Adds the three translatable fields to a skill without creating duplicates. */
  const prepareSkill = async (skillName: string): Promise<void> => {
    await curriculumAdm.openSkillEditor(skillName);
    await curriculumAdm.updateReviewMaterial(SKILL_EXPLANATION);
    await curriculumAdm.addMisconception(
      'Unit fraction numerator',
      'Learners may confuse the numerator and denominator.',
      MISCONCEPTION_FEEDBACK
    );
    await curriculumAdm.publishUpdatedSkill('Add translatable skill content.');
  };

  /** Submits feedback first so the review queue is explanation, description, feedback. */
  const submitSkillTranslations = async (skillName: string): Promise<void> => {
    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationSubmitter.selectSubjectInTranslateTextTab(TOPIC_NAME);
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    for (const item of [
      {
        type: CONTENT_TYPE_MISCONCEPTION_FEEDBACK,
        text: HINDI_MISCONCEPTION_FEEDBACK,
        html: true,
      },
      {
        type: CONTENT_TYPE_SKILL_DESCRIPTION,
        text: HINDI_SKILL_DESCRIPTION,
        html: false,
      },
      {
        type: CONTENT_TYPE_SKILL_EXPLANATION,
        text: HINDI_SKILL_EXPLANATION,
        html: true,
      },
    ]) {
      await translationSubmitter.clickOnTranslateButtonInTranslateTextTab(
        skillName,
        SKILL_SUBHEADING
      );
      await translationSubmitter.skipToTranslationItemOfContentType(
        item.type,
        MAX_ITEMS_TO_SKIP
      );
      if (item.html) {
        await translationSubmitter.typeTextForRTE(item.text);
      } else {
        await translationSubmitter.typeTextInTranslationInput(item.text);
      }
      await translationSubmitter.saveTranslationAndCloseModal(
        'Submitted translation for review.'
      );
    }
  };

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
    await prepareSkill(SKILL_NAME);

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
    await translationSubmitter.saveTranslationAndCloseModal(
      'Submitted translation for review.'
    );

    await submitSkillTranslations(SKILL_NAME);

    // "Review Translations" is not a dashboard tab, it is the side navigation
    // item a reviewer already lands on when translations are their only review
    // right, so the dashboard opens on the list this spec reviews from.
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
  }, 2100000);

  it('should review exploration metadata translations', async function () {
    await translationReviewer.navigateToTabInMyContributions(
      'Review Translations'
    );
    await translationReviewer.filterContentByTopic(TOPIC_NAME);
    await translationReviewer.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.LESSONS
    );
    await translationReviewer.expectOpportunityActionButtonToBe(
      CHAPTER_NAME,
      LESSON_SUBHEADING,
      'Translations'
    );
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      CHAPTER_NAME,
      LESSON_SUBHEADING
    );
    // On mobile, the suggestion row itself opens the review modal. Only the
    // desktop layout includes a separate button labeled Review.
    if (!translationReviewer.isViewportAtMobileWidth()) {
      await translationReviewer.expectOpportunityActionButtonToBe(
        HINDI_OBJECTIVE,
        `${TOPIC_NAME} / ${CHAPTER_NAME}`,
        'Review'
      );
    }

    // Reviewable suggestions are returned ordered by descending creation date
    // (GeneralSuggestionModel.get_reviewable_translation_suggestions).
    // Because the objective translation was submitted after the title,
    // the objective suggestion appears first in the review queue and modal.
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_TITLE,
      `${TOPIC_NAME} / ${CHAPTER_NAME}`
    );

    await translationReviewer.startTranslationReview(
      HINDI_OBJECTIVE,
      `${TOPIC_NAME} / ${CHAPTER_NAME}`
    );
    await translationReviewer.expectSourceContentInTranslationReviewToBe(
      EXPLORATION_OBJECTIVE
    );

    // Verify the first suggestion's translated content (objective).
    await translationReviewer.expectCardContentToBeInTranslationReview(
      HINDI_OBJECTIVE
    );
    await translationReviewer.expectReviewButtonLabelToBe(
      'accept',
      ACCEPT_AND_REVIEW_NEXT_LABEL
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'accept',
      'Suggestion accepted.'
    );

    // Verify the second suggestion's translated content (title).
    await translationReviewer.expectSourceContentInTranslationReviewToBe(
      EXPLORATION_TITLE
    );
    await translationReviewer.expectCardContentToBeInTranslationReview(
      HINDI_TITLE
    );
    await translationReviewer.expectReviewButtonLabelToBe(
      'accept',
      ACCEPT_LABEL
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'accept',
      'Suggestion accepted.'
    );
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_TITLE,
      `${TOPIC_NAME} / ${CHAPTER_NAME}`,
      false
    );
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_OBJECTIVE,
      `${TOPIC_NAME} / ${CHAPTER_NAME}`,
      false
    );
  });

  it('should review skill translations', async function () {
    // In the "Content Type" dropdown, change the selection to "Skills".
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );

    // Reviewable suggestions are returned ordered by descending creation date
    // (GeneralSuggestionModel.get_reviewable_translation_suggestions).
    // Because the skill explanation was submitted after the skill description,
    // the explanation appears first in the review queue and modal.
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_SKILL_EXPLANATION,
      SKILL_NAME
    );
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_SKILL_DESCRIPTION,
      SKILL_NAME
    );

    // Open the first suggestion for review (explanation).
    await translationReviewer.startTranslationReview(
      HINDI_SKILL_EXPLANATION,
      SKILL_NAME
    );
    await translationReviewer.expectSourceContentInTranslationReviewToBe(
      SKILL_EXPLANATION
    );

    // Verify the first suggestion's translated content (skill explanation).
    await translationReviewer.expectCardContentToBeInTranslationReview(
      HINDI_SKILL_EXPLANATION
    );
    await translationReviewer.expectReviewButtonLabelToBe(
      'accept',
      ACCEPT_AND_REVIEW_NEXT_LABEL
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'accept',
      'Suggestion accepted.'
    );
    await translationReviewer.closeTranslationReviewModal();
    await translationReviewer.startTranslationReview(
      HINDI_SKILL_DESCRIPTION,
      SKILL_NAME
    );
    await translationReviewer.expectSourceContentInTranslationReviewToBe(
      SKILL_NAME
    );

    // Verify the second suggestion's translated content (skill description).
    await translationReviewer.expectCardContentToBeInTranslationReview(
      HINDI_SKILL_DESCRIPTION
    );
    await translationReviewer.expectReviewButtonLabelToBe(
      'accept',
      ACCEPT_AND_REVIEW_NEXT_LABEL
    );
    await translationReviewer.expectReviewButtonLabelToBe(
      'reject',
      REJECT_AND_REVIEW_NEXT_LABEL
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'reject',
      'Suggestion rejected.',
      'Please match the wording used in the skill description.'
    );
    await translationReviewer.closeTranslationReviewModal();
    await translationReviewer.startTranslationReview(
      HINDI_MISCONCEPTION_FEEDBACK,
      SKILL_NAME
    );
    await translationReviewer.expectSourceContentInTranslationReviewToBe(
      MISCONCEPTION_FEEDBACK
    );
    await translationReviewer.expectCardContentToBeInTranslationReview(
      HINDI_MISCONCEPTION_FEEDBACK
    );
    await translationReviewer.expectReviewButtonLabelToBe(
      'accept',
      ACCEPT_LABEL
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'accept',
      'Suggestion accepted.'
    );
    for (const translation of [
      HINDI_SKILL_DESCRIPTION,
      HINDI_SKILL_EXPLANATION,
      HINDI_MISCONCEPTION_FEEDBACK,
    ]) {
      await translationReviewer.expectOpportunityToBePresent(
        translation,
        SKILL_NAME,
        false
      );
    }
  });

  it('should reject pending translations when their skill is deleted', async function () {
    await curriculumAdm.createSkillForTopic(DELETION_SKILL_NAME, TOPIC_NAME);
    await prepareSkill(DELETION_SKILL_NAME);
    await submitSkillTranslations(DELETION_SKILL_NAME);
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationReviewer.filterContentByTopic(TOPIC_NAME);
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    for (const translation of [
      HINDI_SKILL_DESCRIPTION,
      HINDI_SKILL_EXPLANATION,
      HINDI_MISCONCEPTION_FEEDBACK,
    ]) {
      await translationReviewer.expectOpportunityToBePresent(
        translation,
        DELETION_SKILL_NAME
      );
    }
    await curriculumAdm.deleteSkill(DELETION_SKILL_NAME);

    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationReviewer.filterContentByTopic('All');
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    for (const translation of [
      HINDI_SKILL_DESCRIPTION,
      HINDI_SKILL_EXPLANATION,
      HINDI_MISCONCEPTION_FEEDBACK,
    ]) {
      await translationReviewer.expectOpportunityToBePresent(
        translation,
        DELETION_SKILL_NAME,
        false
      );
    }
  }, 900000);

  it('should preserve translations when their skill is unassigned and reassigned', async function () {
    await curriculumAdm.createSkillForTopic(
      REASSIGNMENT_SKILL_NAME,
      TOPIC_NAME
    );
    await prepareSkill(REASSIGNMENT_SKILL_NAME);
    const skillEditorPath = new URL(
      curriculumAdm.getCurrentUrlWithoutParameters()
    ).pathname;
    await curriculumAdm.assignSkillToSubtopicInTopicEditor(
      REASSIGNMENT_SKILL_NAME,
      SUBTOPIC_NAME,
      TOPIC_NAME
    );
    await submitSkillTranslations(REASSIGNMENT_SKILL_NAME);
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationReviewer.filterContentByTopic(TOPIC_NAME);
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationReviewer.startTranslationReview(
      HINDI_SKILL_DESCRIPTION,
      REASSIGNMENT_SKILL_NAME
    );
    await translationReviewer.submitTranslationReviewAndExpectToast(
      'accept',
      'Suggestion accepted.'
    );
    await translationReviewer.closeTranslationReviewModal();

    await translationSubmitter.navigateToContributorDashboardUsingProfileDropdown();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationSubmitter.selectSubjectInTranslateTextTab(TOPIC_NAME);
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationSubmitter.expectSkillTranslationProgressToBe(
      REASSIGNMENT_SKILL_NAME,
      1,
      2,
      3
    );

    // Removing the skill from the subtopic moves it to uncategorized skills,
    // keeping it inside the topic and preserving its translation opportunity.
    await curriculumAdm.removeSkillFromSubtopicInTopicEditor(
      REASSIGNMENT_SKILL_NAME,
      SUBTOPIC_NAME,
      TOPIC_NAME
    );
    await translationSubmitter.reloadPage();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationSubmitter.selectSubjectInTranslateTextTab('All');
    await translationSubmitter.expectSkillTranslationProgressToBe(
      REASSIGNMENT_SKILL_NAME,
      1,
      2,
      3
    );
    await translationSubmitter.selectSubjectInTranslateTextTab(TOPIC_NAME);
    await translationSubmitter.expectSkillTranslationProgressToBe(
      REASSIGNMENT_SKILL_NAME,
      1,
      2,
      3
    );

    await curriculumAdm.assignSkillToSubtopicInTopicEditor(
      REASSIGNMENT_SKILL_NAME,
      SUBTOPIC_NAME,
      TOPIC_NAME
    );
    await translationSubmitter.reloadPage();
    await translationSubmitter.switchToTabInContributionDashboard(
      'Translate Text'
    );
    await translationSubmitter.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationSubmitter.selectSubjectInTranslateTextTab(TOPIC_NAME);
    await translationSubmitter.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationSubmitter.expectSkillTranslationProgressToBe(
      REASSIGNMENT_SKILL_NAME,
      1,
      2,
      3
    );
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.selectLanguageFilter(TRANSLATION_LANGUAGE);
    await translationReviewer.filterContentByTopic(TOPIC_NAME);
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_SKILL_DESCRIPTION,
      REASSIGNMENT_SKILL_NAME,
      false
    );
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_SKILL_EXPLANATION,
      REASSIGNMENT_SKILL_NAME
    );
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_MISCONCEPTION_FEEDBACK,
      REASSIGNMENT_SKILL_NAME
    );
    for (const translation of [
      HINDI_SKILL_EXPLANATION,
      HINDI_MISCONCEPTION_FEEDBACK,
    ]) {
      await translationReviewer.expectOpportunityCountToBe(
        translation,
        REASSIGNMENT_SKILL_NAME,
        1
      );
    }
    await curriculumAdm.openSkillEditor(REASSIGNMENT_SKILL_NAME);
    expect(
      new URL(curriculumAdm.getCurrentUrlWithoutParameters()).pathname
    ).toBe(skillEditorPath);
  }, 900000);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
