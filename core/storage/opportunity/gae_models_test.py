# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.opportunity.gae_models."""

from __future__ import annotations

from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import opportunity_models

(base_models, opportunity_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.OPPORTUNITY
])


class ExplorationOpportunitySummaryModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationOpportunitySummaryModel class."""

    def setUp(self) -> None:
        super().setUp()

        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id1',
            topic_id='topic_id1',
            topic_name='a_topic name',
            story_id='story_id1',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        ).put()
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id2',
            topic_id='topic_id2',
            topic_name='b_topic name',
            story_id='story_id2',
            story_title='A new story title',
            chapter_title='A new chapter title',
            content_count=120,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        ).put()
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id3',
            topic_id='topic_id1',
            topic_name='a_topic name',
            story_id='story_id3',
            story_title='A third story title',
            chapter_title='A third chapter title',
            content_count=120,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
            language_codes_needing_voice_artists=[],
            language_codes_with_assigned_voice_artists=[]
        ).put()
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id4',
            topic_id='topic_id3',
            topic_name='c_topic name',
            story_id='story_id4',
            story_title='A fourth story title',
            chapter_title='A fourth chapter title',
            content_count=120,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
            language_codes_needing_voice_artists=[],
            language_codes_with_assigned_voice_artists=[]
        ).put()
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id5',
            topic_id='topic_id4',
            topic_name='d_topic name',
            story_id='story_id5',
            story_title='A fifth story title',
            chapter_title='A fifth chapter title',
            content_count=120,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
            language_codes_needing_voice_artists=[],
            language_codes_with_assigned_voice_artists=[]
        ).put()
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id6',
            topic_id='topic_id3',
            topic_name='c_topic name',
            story_id='story_id6',
            story_title='A sixth story title',
            chapter_title='A sixth chapter title',
            content_count=120,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
            language_codes_needing_voice_artists=[],
            language_codes_with_assigned_voice_artists=[]
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'chapter_title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'content_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'incomplete_translation_language_codes':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'translation_counts': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_codes_with_assigned_voice_artists':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_codes_needing_voice_artists':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_export_policy(),
            expected_export_policy_dict
        )

    def test_get_all_translation_opportunities(self) -> None:
        results, cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_all_translation_opportunities(6, None, 'hi', ''))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 6)
        self.assertEqual(results[0].topic_name, 'a_topic name')
        self.assertEqual(results[1].topic_name, 'a_topic name')
        self.assertEqual(results[2].topic_name, 'b_topic name')
        self.assertEqual(results[3].topic_name, 'c_topic name')
        self.assertEqual(results[4].topic_name, 'c_topic name')
        self.assertEqual(results[5].topic_name, 'd_topic name')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, str))

    def test_get_all_translation_opportunities_pagination(self) -> None:
        results, cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_all_translation_opportunities(1, None, 'hi', ''))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].topic_name, 'a_topic name')
        self.assertTrue(more)
        self.assertTrue(isinstance(cursor, str))

        results, second_cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_all_translation_opportunities(1, cursor, 'hi', ''))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].topic_name, 'a_topic name')
        self.assertTrue(more)
        self.assertTrue(isinstance(second_cursor, str))

        results, third_cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_all_translation_opportunities(1, second_cursor, 'hi', ''))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].topic_name, 'b_topic name')
        self.assertTrue(more)
        self.assertTrue(isinstance(third_cursor, str))

    def test_get_translation_opportunities_by_topic(self) -> None:
        results, cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_all_translation_opportunities(
                    5, None, 'hi', 'a_topic name'))
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertEqual(results[1].id, 'opportunity_id3')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, str))

    def test_get_by_topic(self) -> None:
        model_list = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_by_topic('topic_id1'))
        # Ruling out the possibility of None for mypy type checking.
        assert model_list is not None
        self.assertEqual(len(model_list), 2)
        self.assertEqual(model_list[0].id, 'opportunity_id1')

        model_list = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_by_topic('topic_id2'))
        # Ruling out the possibility of None for mypy type checking.
        assert model_list is not None
        self.assertEqual(len(model_list), 1)
        self.assertEqual(model_list[0].id, 'opportunity_id2')

    def test_get_by_topic_for_non_existing_topic(self) -> None:
        model_list = (
            opportunity_models.ExplorationOpportunitySummaryModel
                .get_by_topic('non_existing_topic_id'))
        # Ruling out the possibility of None for mypy type checking.
        assert model_list is not None
        self.assertEqual(len(model_list), 0)


class SkillOpportunityModelTest(test_utils.GenericTestBase):
    """Tests for the SkillOpportunityModel class."""

    def setUp(self) -> None:
        super().setUp()

        opportunity_models.SkillOpportunityModel(
            id='opportunity_id1',
            skill_description='A skill description',
            question_count=20,
        ).put()
        opportunity_models.SkillOpportunityModel(
            id='opportunity_id2',
            skill_description='A skill description',
            question_count=30,
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            opportunity_models.SkillOpportunityModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            opportunity_models.SkillOpportunityModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'question_count': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            opportunity_models.SkillOpportunityModel.get_export_policy(),
            expected_export_policy_dict
        )

    def test_get_skill_opportunities(self) -> None:
        results, cursor, more = (
            opportunity_models.SkillOpportunityModel
                .get_skill_opportunities(5, None))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertEqual(results[1].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, str))

    def test_get_skill_opportunities_pagination(self) -> None:
        results, cursor, more = (
            opportunity_models.SkillOpportunityModel.get_skill_opportunities(
                1, None))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertTrue(more)
        self.assertTrue(isinstance(cursor, str))

        results, cursor, more = (
            opportunity_models.SkillOpportunityModel.get_skill_opportunities(
                1, cursor))
        # Ruling out the possibility of None for mypy type checking.
        assert results is not None
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, str))
