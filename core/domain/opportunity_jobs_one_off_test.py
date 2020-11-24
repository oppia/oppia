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

from constants import constants
from core.domain import caching_services
from core.domain import opportunity_jobs_one_off
from core.domain import opportunity_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import python_utils


(opportunity_models, story_models, exp_models) = models.Registry.import_models(
    [models.NAMES.opportunity, models.NAMES.story, models.NAMES.exploration])

datastore_services = models.Registry.import_datastore_services()


class ExplorationOpportunitySummaryModelRegenerationJobTest(
        test_utils.GenericTestBase):
    """Tests for the exploration opportunity summary model regenration job."""

    def setUp(self):
        super(
            ExplorationOpportunitySummaryModelRegenerationJobTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

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
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
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
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None, ['0'])

        exp_opp_summary_model_regen_job_class = (
            opportunity_jobs_one_off
            .ExplorationOpportunitySummaryModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        job_id = exp_opp_summary_model_regen_job_class.create_new()
        exp_opp_summary_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

        output = exp_opp_summary_model_regen_job_class.get_output(job_id)
        self.assertEqual(output, [])


class SkillOpportunityModelRegenerationJobTest(test_utils.GenericTestBase):
    """Tests for the Skill opportunity model regeneration job."""

    def setUp(self):
        super(SkillOpportunityModelRegenerationJobTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.skill_id_1 = 'skill_1'
        self.skill_desc_1 = 'skill 1'
        self.skill_id_2 = 'skill_2'
        self.skill_desc_2 = 'skill 2'

        self.save_new_skill(
            self.skill_id_1, self.admin_id, description=self.skill_desc_1)
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description=self.skill_desc_2)

    def test_regeneration_job_returns_the_initial_opportunity(self):
        skill_opp_model_regen_job_class = (
            opportunity_jobs_one_off.SkillOpportunityModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())

        self.assertEqual(len(all_opportunity_models), 2)

        old_opportunities, _, more = (
            opportunity_services.get_skill_opportunities(None))

        job_id = skill_opp_model_regen_job_class.create_new()
        skill_opp_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

        output = skill_opp_model_regen_job_class.get_output(job_id)

        expected = [['SUCCESS', 2]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        new_opportunities, _, more = (
            opportunity_services.get_skill_opportunities(None))
        self.assertFalse(more)

        old_opportunity_dicts = [opp.to_dict() for opp in old_opportunities]
        new_opportunity_dicts = [opp.to_dict() for opp in new_opportunities]
        self.assertEqual(old_opportunity_dicts, new_opportunity_dicts)

    def test_regeneration_job_creates_new_models(self):
        skill_opp_model_regen_job_class = (
            opportunity_jobs_one_off.SkillOpportunityModelRegenerationJob)

        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        old_creation_time = all_opportunity_models[0].created_on

        job_id = skill_opp_model_regen_job_class.create_new()
        skill_opp_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

        output = skill_opp_model_regen_job_class.get_output(job_id)
        expected = [['SUCCESS', 2]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

        all_opportunity_models = list(
            opportunity_models.SkillOpportunityModel.get_all())
        self.assertEqual(len(all_opportunity_models), 2)

        new_creation_time = all_opportunity_models[0].created_on

        self.assertLess(old_creation_time, new_creation_time)

    def test_regeneration_job_for_deleted_skill_returns_empty_list_output(self):
        skill_opp_model_regen_job_class = (
            opportunity_jobs_one_off.SkillOpportunityModelRegenerationJob)

        skill_services.delete_skill(self.admin_id, self.skill_id_1)
        skill_services.delete_skill(self.admin_id, self.skill_id_2)

        job_id = skill_opp_model_regen_job_class.create_new()
        skill_opp_model_regen_job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

        output = skill_opp_model_regen_job_class.get_output(job_id)
        self.assertEqual(output, [])


class MockExplorationOpportunitySummaryModel(
        opportunity_models.ExplorationOpportunitySummaryModel):
    need_voice_artist_in_language_codes = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    assigned_voice_artist_in_language_codes = (
        datastore_services.StringProperty(repeated=True, indexed=True))


class RenameExplorationOpportunitySummaryModelPropertiesJobTest(
        test_utils.GenericTestBase):
    """Tests for the exploration opportunity summary model rename attributes
    job.
    """

    def test_job_replaces_value_correctly_to_renamed_properties(self):
        with self.swap(
            opportunity_models, 'ExplorationOpportunitySummaryModel',
            MockExplorationOpportunitySummaryModel):
            old_model = opportunity_models.ExplorationOpportunitySummaryModel(
                id='opportunity_id',
                topic_id='topic1',
                topic_name='The Topic!',
                story_id='story1',
                story_title='The story!',
                chapter_title='The content!',
                content_count=5,
                incomplete_translation_language_codes=['hi'],
                translation_counts={'en': 5},
                need_voice_artist_in_language_codes=['hi'],
                assigned_voice_artist_in_language_codes=['en'])
            old_model.put()

            self.assertEqual(
                old_model.language_codes_with_assigned_voice_artists, [])
            self.assertEqual(
                old_model.language_codes_needing_voice_artists, [])

            job_class = (
                opportunity_jobs_one_off.
                RenameExplorationOpportunitySummaryModelPropertiesJob)

            job_id = job_class.create_new()
            job_class.enqueue(job_id)

            self.assertEqual(
                self.count_jobs_in_mapreduce_taskqueue(
                    taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
            self.process_and_flush_pending_mapreduce_tasks()

            output = job_class.get_output(job_id)
            self.assertEqual(
                output, [
                    u'[u\'SUCCESS_RENAMED['
                    'assigned_voice_artist_in_language_codes]\', 1]', u'['
                    'u\'SUCCESS_RENAMED[need_voice_artist_in_language_codes]\','
                    ' 1]'])

            new_model = (
                opportunity_models.ExplorationOpportunitySummaryModel.get_by_id(
                    'opportunity_id'))

            self.assertEqual(
                old_model.assigned_voice_artist_in_language_codes,
                new_model.language_codes_with_assigned_voice_artists)
            self.assertEqual(
                old_model.need_voice_artist_in_language_codes,
                new_model.language_codes_needing_voice_artists)

            self.assertFalse(
                'assigned_voice_artist_in_language_codes'
                in new_model._properties) # pylint: disable=protected-access
            self.assertFalse(
                'need_voice_artist_in_language_codes' in new_model._properties) # pylint: disable=protected-access

    def test_job_for_new_models_with_updated_properties_works_correctly(self):
        old_model = opportunity_models.ExplorationOpportunitySummaryModel(
            id='opportunity_id',
            topic_id='topic1',
            topic_name='The Topic!',
            story_id='story1',
            story_title='The story!',
            chapter_title='The content!',
            content_count=5,
            incomplete_translation_language_codes=['hi'],
            translation_counts={'en': 5},
            language_codes_with_assigned_voice_artists=['hi'],
            language_codes_needing_voice_artists=['en'])
        old_model.put()

        job_class = (
            opportunity_jobs_one_off.
            RenameExplorationOpportunitySummaryModelPropertiesJob)

        job_id = job_class.create_new()
        job_class.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

        output = job_class.get_output(job_id)
        self.assertEqual(output, [])

        new_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get_by_id(
                'opportunity_id'))

        self.assertEqual(
            new_model.language_codes_with_assigned_voice_artists, ['hi'])
        self.assertEqual(
            new_model.language_codes_needing_voice_artists, ['en'])
