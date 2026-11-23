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

from core.domain import contributor_dashboard_stats_services
from core.storage.opportunity import gae_models as opportunity_models
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
            uncategorized_skill_ids=['skill_1', 'skill_2'],
            page_title_fragment_for_web='algebra',
        )
        self.rights = topic_models.TopicRightsModel(
            id=self.topic_id, topic_is_published=True
        )
        super(topic_models.TopicRightsModel, self.rights).put()
        super(topic_models.TopicModel, self.topic).put()

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
        self.exp_opp.put()

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

        self.assertGreaterEqual(len(stats['topic_stats']), 1)
        topic_stat = stats['topic_stats'][0]
        self.assertEqual(topic_stat['topic_id'], self.topic_id)
        self.assertEqual(topic_stat['topic_name'], 'Algebra')
        self.assertEqual(topic_stat['total_chapters_count'], 1)
        self.assertEqual(topic_stat['total_cards_count'], 20)

        # Verify translation metrics for Hindi.
        hi_stats = topic_stat['translation_stats_by_language']['hi']
        self.assertEqual(hi_stats['language_code'], 'hi')
        self.assertEqual(hi_stats['translated_cards_count'], 15)
        self.assertEqual(hi_stats['total_cards_count'], 20)
        self.assertEqual(hi_stats['progress_percentage'], 75.0)
        self.assertEqual(hi_stats['in_progress_chapters_count'], 1)
        self.assertEqual(len(hi_stats['chapters']), 1)
        self.assertEqual(
            hi_stats['chapters'][0]['chapter_title'], 'Chapter 1: Equations'
        )

        # Verify practice question metrics.
        q_stats = topic_stat['question_stats']
        self.assertEqual(q_stats['total_skills_count'], 2)
        self.assertEqual(q_stats['target_questions_count'], 20)
        self.assertEqual(q_stats['skills_with_sufficient_questions_count'], 1)
        self.assertEqual(q_stats['total_questions_submitted'], 17)
        # 12 is capped at 10 for skill_1 + 5 for skill_2 = 15/20 = 75.0%.
        self.assertEqual(q_stats['progress_percentage'], 75.0)
        self.assertEqual(len(q_stats['skills']), 2)

        # Verify summary stats.
        summary = stats['summary_stats']
        self.assertGreaterEqual(summary['total_topics_count'], 1)
        self.assertGreaterEqual(summary['total_chapters_count'], 1)
        self.assertGreaterEqual(summary['total_skills_count'], 2)
