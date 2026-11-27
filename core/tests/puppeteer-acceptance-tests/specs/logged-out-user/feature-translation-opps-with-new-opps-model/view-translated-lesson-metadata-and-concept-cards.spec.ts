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
import {ExplorationEditor} from '../../../utilities/user/exploration-editor';
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

const CONTENT_TYPE_SKILL_EXPLANATION = 'skill explanation';

const HINDI_TITLE = 'पाई काटना';
const HINDI_OBJECTIVE = 'केक को बराबर बाँटना सीखें';
const HINDI_TAG = 'भिन्नों';
const HINDI_SKILL_EXPLANATION = 'इकाई भिन्न की समीक्षा';

// The lesson contributes a title, objective and tag, and the skill contributes an
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

    explorationId = await curriculumAdm.setUpCuratedLessonWithSkill({
      topicName: TOPIC_NAME,
      subtopicName: SUBTOPIC_NAME,
      skillName: SKILL_NAME,
      skillExplanation: 'Review material for unit fractions.',
      explorationTitle: EXPLORATION_TITLE,
      explorationObjective: EXPLORATION_OBJECTIVE,
      explorationTag: 'fractions',
      explorationCardContent: EXPLORATION_CARD_CONTENT,
      linkConceptCard: true,
      storyTitle: 'The Picnic Problem',
      storyUrlFragment: 'the-picnic-problem',
      chapterTitle: CHAPTER_NAME,
    });

    // Submit the three metadata items and the skill explanation from LO.4.
    await translationSubmitter.submitLessonMetadataTranslations(
      TRANSLATION_LANGUAGE,
      TOPIC_NAME,
      CHAPTER_NAME,
      LESSON_SUBHEADING,
      {
        title: HINDI_TITLE,
        objective: HINDI_OBJECTIVE,
        tag: HINDI_TAG,
      }
    );

    await translationSubmitter.submitSkillTranslations(
      TRANSLATION_LANGUAGE,
      TOPIC_NAME,
      SKILL_NAME,
      SKILL_SUBHEADING,
      [
        {
          type: CONTENT_TYPE_SKILL_EXPLANATION,
          text: HINDI_SKILL_EXPLANATION,
          html: true,
        },
      ]
    );

    // Only accepted translations are displayed to the learner.
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.filterContentByTopic(TOPIC_NAME);
    await translationReviewer.selectLanguageFilter(TRANSLATION_LANGUAGE);

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
      `${testConstants.URLs.ExplorationPlayer}${explorationId}` +
        `?initialContentLanguageCode=${HINDI_SITE_LANGUAGE_CODE}`
    );

    // The title, objective and actual tag are shown in Lesson Info.
    await loggedOutUser.openLessonInfoModal();
    await loggedOutUser.expectLessonInfoModalHeaderToBe(HINDI_TITLE);
    await loggedOutUser.expectLessonInfoModalObjectiveToBe(HINDI_OBJECTIVE);
    await loggedOutUser.expectLessonInfoModalTagsToBe(HINDI_TAG);
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
