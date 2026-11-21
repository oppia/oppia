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
 * @fileoverview Acceptance test for the "Content Type" filter on the review tab.
 * Only exists when ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS is on.
 *
 * TR.1 Filter opportunities by Entity Type.
 *
 * CUJ Link: https://docs.google.com/spreadsheets/d/1IfKAMEZHl0qJTr0OPo6obImMHXgb-8WM5eAHLfgXsfM/edit
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {
  Contributor,
  CONTENT_TYPE_FILTER,
} from '../../utilities/user/contributor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {TopicManager} from '../../utilities/user/topic-manager';
import {TranslationReviewer} from '../../utilities/user/translation-reviewer';
import {TranslationSubmitter} from '../../utilities/user/translation-submitter';

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

const CONTENT_TYPE_SKILL_DESCRIPTION = 'skill description';
const CONTENT_TYPE_SKILL_EXPLANATION = 'skill explanation';

// A suggestion row truncates its heading at 30 characters, and the heading is
// the translation itself, so any translation looked up by heading below is
// kept under that limit.
const HINDI_TITLE = 'पाई काटना';
const HINDI_OBJECTIVE = 'केक को बराबर हिस्सों में बाँटना सीखें';
const HINDI_SKILL_DESCRIPTION = 'इकाई भिन्न';
const HINDI_SKILL_EXPLANATION = 'इकाई भिन्न की समीक्षा';

describe('Translation Reviewer: filter opportunities by entity type', function () {
  let translationReviewer: TranslationReviewer & Contributor & LoggedInUser;
  let translationSubmitter: TranslationSubmitter & Contributor & LoggedInUser;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor & TopicManager;

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

    await curriculumAdm.setUpCuratedLessonWithSkill({
      topicName: TOPIC_NAME,
      subtopicName: SUBTOPIC_NAME,
      skillName: SKILL_NAME,
      explorationTitle: EXPLORATION_TITLE,
      explorationObjective: EXPLORATION_OBJECTIVE,
      storyTitle: 'The Picnic Problem',
      storyUrlFragment: 'the-picnic-problem',
      chapterTitle: CHAPTER_NAME,
    });

    // Submit the metadata and skill translations that this spec reviews.
    await translationSubmitter.submitLessonMetadataTranslations(
      TRANSLATION_LANGUAGE,
      TOPIC_NAME,
      CHAPTER_NAME,
      LESSON_SUBHEADING,
      {
        title: HINDI_TITLE,
        objective: HINDI_OBJECTIVE,
      }
    );

    await translationSubmitter.submitSkillTranslations(
      TRANSLATION_LANGUAGE,
      TOPIC_NAME,
      SKILL_NAME,
      SKILL_SUBHEADING,
      [
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
      ]
    );
  }, 2100000);

  it('should filter opportunities by entity type', async function () {
    await translationReviewer.navigateToContributorDashboardUsingProfileDropdown();
    await translationReviewer.filterContentByTopic(TOPIC_NAME);

    // In the "Content Type" dropdown, change the selection to "Skills".
    await translationReviewer.selectContentTypeFilter(
      CONTENT_TYPE_FILTER.SKILLS
    );

    // 1. Only submitted skill translation suggestions show up in the review
    // list.
    await translationReviewer.expectOpportunityToBePresent(
      HINDI_SKILL_DESCRIPTION,
      SKILL_NAME
    );

    // 2. Submitted exploration translations (such as "Cutting the Pies")
    // should not be visible in the list.
    await translationReviewer.expectOpportunityToBePresent(
      CHAPTER_NAME,
      LESSON_SUBHEADING,
      false
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
