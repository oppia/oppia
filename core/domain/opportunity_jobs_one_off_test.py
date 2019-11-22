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

"""Tests for opportunity one-off jobs."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import opportunity_jobs_one_off
from core.domain import opportunity_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import python_utils


memcache_services = models.Registry.import_memcache_services()
taskqueue_services = models.Registry.import_taskqueue_services()
(opportunity_models, story_models, exp_models) = models.Registry.import_models(
    [models.NAMES.opportunity, models.NAMES.story, models.NAMES.exploration])


class ExplorationOpportunitySummaryModelRegenerationJobTest(
        test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""

    def setUp(self):
        super(
            ExplorationOpportunitySummaryModelRegenerationJobTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.topic_id_1 = 'topic1'
        self.topic_id_2 = 'topic2'

        story_id_1 = 'story1'
        story_id_2 = 'story2'

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        topic_1 = topic_domain.Topic.create_default_topic(
            topic_id=self.topic_id_1, name='topic1')
        topic_services.save_new_topic(self.owner_id, topic_1)

        topic_2 = topic_domain.Topic.create_default_topic(
            topic_id=self.topic_id_2, name='topic2')
        topic_services.save_new_topic(self.owner_id, topic_2)

        story_1 = story_domain.Story.create_default_story(
            story_id_1, title='A story', corresponding_topic_id=self.topic_id_1)
        story_2 = story_domain.Story.create_default_story(
            story_id_2, title='A story', corresponding_topic_id=self.topic_id_2)

        story_services.save_new_story(self.owner_id, story_1)
        story_services.save_new_story(self.owner_id, story_2)
        topic_services.add_canonical_story(
            self.owner_id, self.topic_id_1, story_id_1)
        topic_services.add_canonical_story(
            self.owner_id, self.topic_id_2, story_id_2)
        story_services.update_story(
            self.owner_id, story_id_1, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')
        story_services.update_story(
            self.owner_id, story_id_2, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '1'
            })], 'Changes.')

    def test_regeneration_job_returns_the_initial_opportunity(self):
        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)
        old_opportunities, _, more = (
            opportunity_services.get_translation_opportunities('hi', None))

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)

        expected = [['SUCCESS', 2]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        new_opportunities, _, more = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertFalse(more)

        old_opportunity_dicts = [opp.to_dict() for opp in old_opportunities]
        new_opportunity_dicts = [opp.to_dict() for opp in new_opportunities]
        self.assertEqual(old_opportunity_dicts, new_opportunity_dicts)

    def test_regeneration_job_returns_correct_output(self):
        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)

        expected = [['SUCCESS', 2]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_regeneration_job_generates_expected_number_of_models(self):
        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)

        expected = [['SUCCESS', 2]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

    def test_regeneration_job_creates_new_models(self):
        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        old_creation_time = all_opportunity_models[0].created_on

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)
        expected = [['SUCCESS', 2]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        new_creation_time = all_opportunity_models[0].created_on

        self.assertLess(old_creation_time, new_creation_time)

    def test_regeneration_job_with_no_story_model_for_all_topics(self):
        story_models.StoryModel.get('story1').delete(
            self.owner_id, 'Delete story', force_deletion=True)
        story_models.StoryModel.get('story2').delete(
            self.owner_id, 'Delete story', force_deletion=True)
        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)
        expected = [['FAILED (2)', [
            'Failed to regenerate opportunities for topic id: topic1, '
            'missing_exp_with_ids: [], '
            'missing_story_with_ids: [u\'story1\']',
            'Failed to regenerate opportunities for topic id: topic2, '
            'missing_exp_with_ids: [], '
            'missing_story_with_ids: [u\'story2\']'
        ]]]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 0)

    def test_regeneration_job_with_no_story_model_for_some_topics(self):
        story_models.StoryModel.get('story1').delete(
            self.owner_id, 'Delete story', force_deletion=True)

        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)
        expected = [['FAILED (1)', [
            'Failed to regenerate opportunities for topic id: topic1, '
            'missing_exp_with_ids: [], '
            'missing_story_with_ids: [u\'story1\']'
        ]], ['SUCCESS', 1]]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 1)

    def test_regeneration_job_with_no_exp_model_for_some_topics(self):
        exp_models.ExplorationModel.get('0').delete(
            self.owner_id, 'Delete exploration', force_deletion=True)
        exploration_memcache_key = exp_fetchers.get_exploration_memcache_key(
            '0')
        memcache_services.delete(exploration_memcache_key)

        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)
        expected = [['FAILED (1)', [
            'Failed to regenerate opportunities for topic id: topic1, '
            'missing_exp_with_ids: [u\'0\'], '
            'missing_story_with_ids: []'
        ]], ['SUCCESS', 1]]

        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 1)

    def test_regeneration_job_for_deleted_topic_returns_empty_list_output(self):
        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        topic_services.delete_topic(self.owner_id, self.topic_id_1)
        topic_services.delete_topic(self.owner_id, self.topic_id_2)

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)
        self.assertEqual(output, [])
