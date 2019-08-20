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

from core.platform import models
from core.tests import test_utils

(opportunity_models,) = models.Registry.import_models(
    [models.NAMES.opportunity])


class ExplorationOpportunitySummaryModelUnitTest(test_utils.GenericTestBase):
    """Test the ExplorationOpportunitySummaryModel class."""

    def setUp(self):
        super(ExplorationOpportunitySummaryModelUnitTest, self).setUp()

        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id1',
            topic_id='topic_id1',
            topic_name='A topic',
            story_id='story_id1',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            need_voice_artist_in_language_codes=['en'],
            assigned_voice_artist_in_language_codes=[]
        ).put()
        opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id2',
            topic_id='topic_id2',
            topic_name='A new topic',
            story_id='story_id2',
            story_title='A new story title',
            chapter_title='A new chapter title',
            content_count=120,
            incomplete_translation_language_codes=['hi'],
            translation_counts={},
            need_voice_artist_in_language_codes=['en'],
            assigned_voice_artist_in_language_codes=[]
        ).put()

    def test_get_all_translation_opportunities(self):
        results, cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_all_translation_opportunities(5, None, 'hi'))
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertEqual(results[1].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, basestring))

    def test_get_all_translation_opportunities_pagination(self):
        results, cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_all_translation_opportunities(1, None, 'hi'))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertTrue(more)
        self.assertTrue(isinstance(cursor, basestring))

        results, new_cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_all_translation_opportunities(1, cursor, 'hi'))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(new_cursor, basestring))

    def test_get_all_voiceover_opportunities(self):
        results, cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_all_voiceover_opportunities(5, None, 'en'))
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertEqual(results[1].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(cursor, basestring))

    def test_get_all_voiceover_opportunities_pagination(self):
        results, cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_all_voiceover_opportunities(1, None, 'en'))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id1')
        self.assertTrue(more)
        self.assertTrue(isinstance(cursor, basestring))

        results, new_cursor, more = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_all_voiceover_opportunities(1, cursor, 'en'))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, 'opportunity_id2')
        self.assertFalse(more)
        self.assertTrue(isinstance(new_cursor, basestring))

    def test_get_by_topic(self):
        model_list = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_by_topic('topic_id1'))
        self.assertEqual(len(model_list), 1)
        self.assertEqual(model_list[0].id, 'opportunity_id1')

        model_list = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_by_topic('topic_id2'))
        self.assertEqual(len(model_list), 1)
        self.assertEqual(model_list[0].id, 'opportunity_id2')

    def test_get_by_topic_for_non_existing_topic(self):
        model_list = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_by_topic('non_existing_topic_id'))
        self.assertEqual(len(model_list), 0)
