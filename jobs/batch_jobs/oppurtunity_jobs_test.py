# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.oppurtunity_jobs."""

from __future__ import absolute_import
from __future__ import unicode_literals

from constants import constants
from core.domain import opportunity_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_services
from core.domain import subtopic_page_domain
from core.domain import topic_services
from core.domain import topic_domain
from core.platform import models
from jobs import job_test_utils
from jobs.batch_jobs import opportunity_jobs
from jobs.types import job_run_result
import python_utils

from typing import Dict, List, Union # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import exp_models

(exp_models, opportunity_models, 
topic_models, story_models,) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.opportunity,
        models.NAMES.topic, models.NAMES.story]))


class ExplorationOpportunitySummaryModelRegenerationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = opportunity_jobs.ExplorationOpportunitySummaryModelRegenerationJob

    def setUp(self):
        super(
            ExplorationOpportunitySummaryModelRegenerationJobTests, self).setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.topic_id_1 = 'topic1'
        self.topic_id_2 = 'topic2'

        story_id_1 = 'story1'
        story_id_2 = 'story2'

        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            end_state_name='End State',
            correctness_feedback_enabled=True
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic_1 = topic_domain.Topic.create_default_topic(
            self.topic_id_1, 'topic', 'abbrev-one', 'description')
        topic_1.thumbnail_filename = 'thumbnail.svg'
        topic_1.thumbnail_bg_color = '#C6DCDA'
        topic_1.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic_1.next_subtopic_id = 2
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.topic_id_1))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic_1)
        topic_services.publish_topic(self.topic_id_1, self.admin_id)

        topic_2 = topic_domain.Topic.create_default_topic(
            self.topic_id_2, 'topic2', 'abbrev-two', 'description')
        topic_2.thumbnail_filename = 'thumbnail.svg'
        topic_2.thumbnail_bg_color = '#C6DCDA'
        topic_2.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.topic_id_2))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic_2.next_subtopic_id = 2
        topic_services.save_new_topic(self.owner_id, topic_2)
        topic_services.publish_topic(self.topic_id_2, self.admin_id)

        story_1 = story_domain.Story.create_default_story(
            story_id_1, 'A story', 'description', self.topic_id_1,
            'story-one')
        story_2 = story_domain.Story.create_default_story(
            story_id_2, 'A story', 'description', self.topic_id_2,
            'story-two')

        story_services.save_new_story(self.owner_id, story_1)
        story_services.save_new_story(self.owner_id, story_2)
        topic_services.add_canonical_story(
            self.owner_id, self.topic_id_1, story_id_1)
        topic_services.publish_story(self.topic_id_1, story_id_1, self.admin_id)
        topic_services.add_canonical_story(
            self.owner_id, self.topic_id_2, story_id_2)
        topic_services.publish_story(self.topic_id_2, story_id_2, self.admin_id)
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
        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)
        old_opportunities, _, more = (
            opportunity_services.get_translation_opportunities('hi', None))

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS'),
            job_run_result.JobRunResult(stdout='SUCCESS')])
