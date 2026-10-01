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
 * @fileoverview Acceptance test for the translated lesson metadata and
 * translated concept cards a learner sees once a translation is accepted.
 * Both only exist when ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS
 * is on.
 *
 * LO.4 View translated lesson metadata and concept cards in the player.
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
import {LoggedOutUser} from '../../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../../utilities/user/release-coordinator';
import {TopicManager} from '../../../utilities/user/topic-manager';
import {TranslationReviewer} from '../../../utilities/user/translation-reviewer';
import {TranslationSubmitter} from '../../../utilities/user/translation-submitter';

const ROLES = testConstants.Roles;

const TRANSLATION_LANGUAGE = 'हिन्दी (Hindi)';
const HINDI_SITE_LANGUAGE_CODE = 'hi';

const TOPIC_NAME = 'Fractions';
const SUBTOPIC_NAME = 'Fraction Foundations';
const SKILL_NAME = 'unit fractions';
const CHAPTER_NAME = 'Cutting the Pies';

const EXPLORATION_TITLE = 'Fair Shares';
const EXPLORATION_OBJECTIVE = 'Learn dividing a birthday cake into equal parts';
const EXPLORATION_CARD_CONTENT = 'A birthday cake is cut into equal pieces.';

const LESSON_SUBHEADING = `Exploration - ${TOPIC_NAME}`;
const SKILL_SUBHEADING = `Skill - ${TOPIC_NAME}`;

const CONTENT_TYPE_TITLE = 'title';
const CONTENT_TYPE_OBJECTIVE = 'objective';
const CONTENT_TYPE_SKILL_EXPLANATION = 'skill explanation';

// A suggestion row truncates its heading at 30 characters, and the heading is
// the translation itself, so any translation looked up by heading below is
// kept under that limit.
const HINDI_TITLE = 'पाई काटना';
const HINDI_OBJECTIVE = 'केक को बराबर बाँटना सीखें';
const HINDI_NO_TAGS_TEXT = 'कोई टैग्स नहीं जुड़े है।';
const HINDI_SKILL_EXPLANATION = 'इकाई भिन्न की समीक्षा';

const MAX_ITEMS_TO_SKIP = 15;

// The lesson contributes a title and an objective and the skill contributes an
// explanation, so no list here holds more than a handful of suggestions. The
// bound only exists so a modal that stops closing fails instead of looping.
const MAX_SUGGESTIONS_TO_ACCEPT = 6;

describe('Logged-out User', function () {
  let loggedOutUser: LoggedOutUser;
  let translationReviewer: TranslationReviewer & Contributor & LoggedInUser;
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin &
    ExplorationEditor &
    TopicManager &
    LoggedInUser;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId: string;

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

    // The concept card link is what makes the skill's explanation reachable
    // from inside the lesson. It is added to the card content here because the
    // skill it points at has to exist first.
    await curriculumAdm.navigateToCreatorDashboardPage();
    await curriculumAdm.navigateToExplorationEditorFromCreatorDashboard();
    await curriculumAdm.dismissWelcomeModal();
    await curriculumAdm.updateCardContentWithConceptCard(
      EXPLORATION_CARD_CONTENT
    );
    await curriculumAdm.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await curriculumAdm.saveExplorationDraft();
    explorationId = await curriculumAdm.publishExplorationWithMetadata(
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

    // Submit Hindi translations for the lesson title, the lesson objective and
    // the skill explanation.
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
      CONTENT_TYPE_SKILL_EXPLANATION,
      MAX_ITEMS_TO_SKIP
    );
    await translationSubmitter.typeTextForRTE(HINDI_SKILL_EXPLANATION);
    await translationSubmitter.clickOnElementWithText('Save and close');
    await translationSubmitter.expectToastMessage(
      'Submitted translation for review.'
    );

    // Accept all three, since only an accepted translation reaches a learner.
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.filterContentByTopic(TOPIC_NAME);

    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.LESSONS
    );
    await translationReviewer.clickOnTranslateButtonInTranslateTextTabInTranslationReview(
      CHAPTER_NAME,
      LESSON_SUBHEADING
    );
    await translationReviewer.acceptAllSuggestionsInReviewModal(
      'Suggestion accepted.',
      MAX_SUGGESTIONS_TO_ACCEPT
    );

    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );
    await translationReviewer.acceptAllSuggestionsInReviewModal(
      'Suggestion accepted.',
      MAX_SUGGESTIONS_TO_ACCEPT
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();
    await loggedOutUser.changeSiteLanguage(HINDI_SITE_LANGUAGE_CODE);
  }, 2100000);

  it('should view translated lesson metadata and concept cards in the player', async function () {
    await loggedOutUser.goto(
      `${testConstants.URLs.ExplorationPlayer}${explorationId}`
    );

    // The lesson title displays in Hindi in the player.
    await loggedOutUser.expectExplorationTitleInPlayerToBe(HINDI_TITLE);

    // The lesson title, objective, and tags display in Hindi in the Lesson Info modal.
    await loggedOutUser.openLessonInfoModal();
    await loggedOutUser.expectLessonInfoModalHeaderToBe(HINDI_TITLE);
    await loggedOutUser.expectLessonInfoModalObjectiveToBe(HINDI_OBJECTIVE);
    await loggedOutUser.expectLessonInfoModalTagsToBe(HINDI_NO_TAGS_TEXT);
    await loggedOutUser.closeLessonInfoModal();

    // The concept card displays the translated skill explanation in Hindi.
    await loggedOutUser.expectConceptCardLinkInLessonToWorkProperly(
      HINDI_SKILL_EXPLANATION
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
