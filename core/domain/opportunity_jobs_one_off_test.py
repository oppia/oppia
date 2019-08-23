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
import ast

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import opportunity_jobs_one_off
from core.domain import opportunity_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

(opportunity_models,) = models.Registry.import_models(
    [models.NAMES.opportunity])
taskqueue_services = models.Registry.import_taskqueue_services()


class ExplorationOpportunitySummaryModelRegenerationJobTest(
        test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""

    def setUp(self):
        super(
            ExplorationOpportunitySummaryModelRegenerationJobTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic_id = 'topic'
        story_id = 'story'
        explorations = [exp_domain.Exploration.create_default_exploration(
            '0',
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(owner_id, exp)

        topic = topic_domain.Topic.create_default_topic(
            topic_id=topic_id, name='topic')
        topic_services.save_new_topic(owner_id, topic)

        story = story_domain.Story.create_default_story(
            story_id, title='A story', corresponding_topic_id=topic_id)
        story_services.save_new_story(owner_id, story)
        topic_services.add_canonical_story(owner_id, topic_id, story_id)
        story_services.update_story(
            owner_id, story_id, [story_domain.StoryChange({
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

    def test_regeneration_job(self):
        """Tests the case where user has no created or edited explorations."""

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 1)
        old_opportunities, _, more = (
            opportunity_services.get_translation_opportunities('hi', None))

        self.assertFalse(more)

        old_creation_time = all_opportunity_models[0].created_on

        job_id = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob.create_new())
        (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob.enqueue(job_id)
        )
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        output = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob.get_output(
                job_id))
        expected = [['SUCCESS', 1]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())
        self.assertEqual(len(all_opportunity_models), 1)

        new_opportunities, _, more = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertFalse(more)

        self.assertEqual(old_opportunities, new_opportunities)

        new_creation_time = all_opportunity_models[0].created_on

        self.assertTrue(old_creation_time < new_creation_time)
