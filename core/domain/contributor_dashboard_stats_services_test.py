# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for core.domain.contributor_dashboard_stats_services."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import contributor_dashboard_stats_services, topic_domain
from core.storage.opportunity import gae_models as opportunity_models
from core.storage.suggestion import gae_models as suggestion_models
from core.storage.topic import gae_models as topic_models
from core.tests import test_utils


class ContributorDashboardStatsServicesTest(test_utils.GenericTestBase):
    """Unit tests for contributor dashboard stats service operations."""

    def setUp(self) -> None:
        super().setUp()
        self.topic_id = 'test_topic_id'
        self.topic = topic_models.TopicModel(
            id=self.topic_id,
            name='Algebra',
            canonical_name='algebra',
            url_fragment='algebra',
            description='Learn algebra fundamentals.',
            language_code='en',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=2,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=['skill_1', 'skill_2', 'skill_3'],
            page_title_fragment_for_web='algebra',
        )
        self.rights = topic_models.TopicRightsModel(
            id=self.topic_id, topic_is_published=True
        )
        self.rights.commit(
            'committer_id',
            'Created new topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}],
        )
        self.topic.commit(
            'committer_id',
            'Created new topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}],
        )

        self.unpub_topic_id = 'unpub_topic_id'
        self.unpub_rights = topic_models.TopicRightsModel(
            id=self.unpub_topic_id, topic_is_published=False
        )
        self.unpub_rights.commit(
            'committer_id',
            'Created unpublished topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}],
        )
        self.unpub_opp = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_unpub',
            topic_id=self.unpub_topic_id,
            topic_name='Unpublished Topic',
            story_id='story_unpub',
            story_title='Story Unpub',
            chapter_title='Chapter Unpub',
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 5},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=[],
        )
        self.unpub_opp.put()

        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        future_time = now + datetime.timedelta(hours=2)
        self.exp_opp = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_1',
            topic_id=self.topic_id,
            topic_name='Algebra',
            story_id='story_1',
            story_title='Story 1',
            chapter_title='Chapter 1: Equations',
            content_count=20,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'hi': 15},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=[],
        )
        self.exp_opp.last_updated = future_time
        self.exp_opp.update_timestamps(update_last_updated_time=False)
        self.exp_opp.put()

        self.exp_opp_2 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_2',
            topic_id=self.topic_id,
            topic_name='Algebra',
            story_id='story_1',
            story_title='Story 1',
            chapter_title='Chapter 2: Formulas',
            content_count=10,
            incomplete_translation_language_codes=[],
            translation_counts={'hi': 10},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=[],
        )
        self.exp_opp_2.put()

        self.exp_opp_3 = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_3',
            topic_id=self.topic_id,
            topic_name='Algebra',
            story_id='story_1',
            story_title='Story 1',
            chapter_title='Chapter 3: Graphs',
            content_count=10,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=[],
        )
        self.exp_opp_3.put()

        suggestion_models.GeneralSuggestionModel(
            id='sug_trans_in_review',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp_1',
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='author_1',
            change_cmd={'language_code': 'hi'},
            score_category=suggestion_models.SCORE_TYPE_CONTENT,
        ).put()

        suggestion_models.GeneralSuggestionModel(
            id='sug_trans_accepted',
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp_1',
            target_version_at_submission=1,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id='author_1',
            change_cmd={'language_code': 'hi'},
            score_category=suggestion_models.SCORE_TYPE_CONTENT,
        ).put()

        suggestion_models.GeneralSuggestionModel(
            id='sug_q_in_review',
            suggestion_type=feconf.SUGGESTION_TYPE_ADD_QUESTION,
            target_type=feconf.ENTITY_TYPE_SKILL,
            target_id='skill_2',
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='author_2',
            change_cmd={},
            score_category=suggestion_models.SCORE_TYPE_CONTENT,
        ).put()

        suggestion_models.GeneralSuggestionModel(
            id='sug_other',
            suggestion_type=feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id='exp_1',
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id='author_3',
            change_cmd={},
            score_category=suggestion_models.SCORE_TYPE_CONTENT,
        ).put()

        self.skill_opp_1 = opportunity_models.SkillOpportunityModel(
            id='skill_1',
            skill_description='Solving Linear Equations',
            question_count=12,
        )
        self.skill_opp_1.put()

        self.skill_opp_2 = opportunity_models.SkillOpportunityModel(
            id='skill_2',
            skill_description='Quadratic Formula',
            question_count=5,
        )
        self.skill_opp_2.put()

        self.skill_opp_3 = opportunity_models.SkillOpportunityModel(
            id='skill_3',
            skill_description='Polynomials',
            question_count=0,
        )
        self.skill_opp_3.put()

    def test_get_contributor_dashboard_stats_returns_expected_structure(
        self,
    ) -> None:
        stats = (
            contributor_dashboard_stats_services.get_contributor_dashboard_stats()
        )

        self.assertIn('topic_stats', stats)
        self.assertIn('language_stats', stats)
        self.assertIn('summary_stats', stats)
        self.assertIn('supported_languages', stats)
        self.assertIn('topic_names', stats)

        self.assertEqual(len(stats['topic_stats']), 1)
        topic_stat = stats['topic_stats'][0]
        self.assertEqual(topic_stat['topic_id'], self.topic_id)
        self.assertEqual(topic_stat['topic_name'], 'Algebra')
        self.assertEqual(topic_stat['total_chapters_count'], 3)
        self.assertEqual(topic_stat['total_cards_count'], 40)

        hi_stats = topic_stat['translation_stats_by_language']['hi']
        self.assertEqual(hi_stats['language_code'], 'hi')
        self.assertEqual(hi_stats['translated_cards_count'], 25)
        self.assertEqual(hi_stats['submitted_cards_count'], 26)
        self.assertEqual(hi_stats['completed_chapters_count'], 1)
        self.assertEqual(hi_stats['in_progress_chapters_count'], 1)
        self.assertEqual(hi_stats['unstarted_chapters_count'], 1)
        self.assertEqual(len(hi_stats['chapters']), 3)

        q_stats = topic_stat['question_stats']
        self.assertEqual(q_stats['total_skills_count'], 3)
        self.assertEqual(q_stats['completed_skills_count'], 1)
        self.assertEqual(q_stats['in_progress_skills_count'], 1)
        self.assertEqual(q_stats['unstarted_skills_count'], 1)

        summary = stats['summary_stats']
        self.assertGreaterEqual(summary['total_topics_count'], 1)
        self.assertGreaterEqual(summary['total_chapters_count'], 3)
        self.assertGreaterEqual(summary['total_skills_count'], 3)

    def test_get_contributor_dashboard_stats_stalled_and_completed_topic(
        self,
    ) -> None:
        stalled_topic_id = 'stalled_topic_id'
        past_time = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        ) - datetime.timedelta(days=40)

        topic = topic_models.TopicModel(
            id=stalled_topic_id,
            name='Geometry',
            canonical_name='geometry',
            url_fragment='geometry',
            description='Learn geometry.',
            language_code='en',
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            next_subtopic_id=1,
            subtopics=[],
            canonical_story_references=[],
            additional_story_references=[],
            uncategorized_skill_ids=[],
            page_title_fragment_for_web='geometry',
        )
        rights = topic_models.TopicRightsModel(
            id=stalled_topic_id, topic_is_published=True
        )
        rights.commit(
            'committer_id',
            'Created rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}],
        )
        topic.commit(
            'committer_id',
            'Created topic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}],
        )
        topic.last_updated = past_time
        topic.update_timestamps(update_last_updated_time=False)
        topic_models.base_models.BaseModel.put_multi([topic])

        exp_opp = opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp_geom',
            topic_id=stalled_topic_id,
            topic_name='Geometry',
            story_id='story_geom',
            story_title='Story Geom',
            chapter_title='Chapter Geom',
            content_count=10,
            incomplete_translation_language_codes=[],
            translation_counts={'hi': 10},
            language_codes_with_assigned_voice_artists=[],
            language_codes_needing_voice_artists=[],
        )
        exp_opp.last_updated = past_time
        exp_opp.update_timestamps(update_last_updated_time=False)
        exp_opp.put()

        stats = (
            contributor_dashboard_stats_services.get_contributor_dashboard_stats()
        )
        geom_stat = next(
            t for t in stats['topic_stats'] if t['topic_id'] == stalled_topic_id
        )
        self.assertTrue(geom_stat['is_stalled'])
        self.assertTrue(
            geom_stat['translation_stats_by_language']['hi'][
                'is_topic_completed'
            ]
        )
