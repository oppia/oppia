# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.opportunity_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import prod_validation_jobs_one_off
from core.domain import question_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(
    exp_models, opportunity_models, skill_models,
    story_models, topic_models) = (
        models.Registry.import_models([
            models.NAMES.exploration, models.NAMES.opportunity,
            models.NAMES.skill, models.NAMES.story,
            models.NAMES.topic]))
datastore_services = models.Registry.import_datastore_services()


class ExplorationOpportunitySummaryModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationOpportunitySummaryModelValidatorTests, self).setUp()

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationOpportunitySummaryModelAuditOneOffJob)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category='category',
            end_state_name='End State',
            correctness_feedback_enabled=True
        ) for i in python_utils.RANGE(5)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-three')]
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic.next_subtopic_id = 2
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'A story', 'Description', self.TOPIC_ID,
            'story-one')
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)

        story_change_list = [story_domain.StoryChange({
            'cmd': 'add_story_node',
            'node_id': 'node_%s' % i,
            'title': 'Node %s' % i,
            }) for i in python_utils.RANGE(1, 4)]

        story_change_list += [story_domain.StoryChange({
            'cmd': 'update_story_node_property',
            'property_name': 'destination_node_ids',
            'node_id': 'node_%s' % i,
            'old_value': [],
            'new_value': ['node_%s' % (i + 1)]
            }) for i in python_utils.RANGE(1, 3)]

        story_change_list += [story_domain.StoryChange({
            'cmd': 'update_story_node_property',
            'property_name': 'exploration_id',
            'node_id': 'node_%s' % i,
            'old_value': None,
            'new_value': '%s' % i
            }) for i in python_utils.RANGE(1, 4)]

        story_services.update_story(
            self.owner_id, self.STORY_ID, story_change_list, 'Changes.')

        self.model_instance_1 = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_by_id('1'))
        self.model_instance_2 = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_by_id('2'))
        self.model_instance_3 = (
            opportunity_models.ExplorationOpportunitySummaryModel
            .get_by_id('3'))

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_1.created_on = (
            self.model_instance_1.last_updated + datetime.timedelta(days=1))
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationOpportunitySummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_1.id,
                self.model_instance_1.created_on,
                self.model_instance_1.last_updated
            ), u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationOpportunitySummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\', '
            'u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\', '
            'u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (
            self.model_instance_1.id, self.model_instance_1.last_updated,
            self.model_instance_2.id, self.model_instance_2.last_updated,
            self.model_instance_3.id, self.model_instance_3.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=True)

    def test_missing_story_model_failure(self):
        story_model = story_models.StoryModel.get_by_id(self.STORY_ID)
        story_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for story_ids field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: based on field story_ids having value story, '
                'expected model StoryModel with id story but it doesn\'t '
                'exist", u"Entity id 2: based on field story_ids having value '
                'story, expected model StoryModel with id story but it '
                'doesn\'t exist", u"Entity id 3: based on field story_ids '
                'having value story, expected model StoryModel with id story '
                'but it doesn\'t exist"]]'
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=True)

    def test_missing_topic_model_failure(self):
        topic_model = topic_models.TopicModel.get_by_id(self.TOPIC_ID)
        topic_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: based on field topic_ids having value topic, '
                'expected model TopicModel with id topic but it doesn\'t '
                'exist", u"Entity id 2: based on field topic_ids having value '
                'topic, expected model TopicModel with id topic but it '
                'doesn\'t exist", u"Entity id 3: based on field topic_ids '
                'having value topic, expected model TopicModel with id topic '
                'but it doesn\'t exist"]]'
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=True)

    def test_missing_exp_model_failure(self):
        exp_model = exp_models.ExplorationModel.get_by_id('1')
        exp_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [(
            u'[u\'failed validation check for exploration_ids field check '
            'of ExplorationOpportunitySummaryModel\', '
            '[u"Entity id 1: based on field exploration_ids having '
            'value 1, expected model ExplorationModel with id 1 but it '
            'doesn\'t exist"]]'), (
                u'[u\'fully-validated ExplorationOpportunitySummaryModel\','
                ' 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_content_count(self):
        self.model_instance_1.content_count = 10
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for content count check '
                'of ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: Content count: 10 does not match the '
                'content count of external exploration model: 2"]]'
            ), u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=True)

    def test_model_with_invalid_translation_counts(self):
        self.model_instance_1.translation_counts = {'hi': 0}
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for translation count check '
                'of ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: Translation counts: {u\'hi\': 0} does not '
                'match the translation counts of external exploration model: '
                '{}"]]'
            ), u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=True)

    def test_model_with_invalid_chapter_title(self):
        self.model_instance_1.chapter_title = 'Invalid title'
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for chapter title check '
                'of ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: Chapter title: Invalid title does not match '
                'the chapter title of external story model: Node 1"]]'
            ), u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=True)

    def test_model_with_invalid_topic_related_property(self):
        self.model_instance_1.topic_name = 'invalid'
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic_name field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u\'Entity id %s: topic_name field in entity: invalid does '
                'not match corresponding topic name field: topic\']]'
            ) % self.model_instance_1.id,
            u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_story_related_property(self):
        self.model_instance_1.story_title = 'invalid'
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for story_title field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u\'Entity id %s: story_title field in entity: invalid does '
                'not match corresponding story title field: A story\']]'
            ) % self.model_instance_1.id,
            u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SkillOpportunityModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SkillOpportunityModelValidatorTests, self).setUp()

        self.job_class = (
            prod_validation_jobs_one_off
            .SkillOpportunityModelAuditOneOffJob)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        for i in python_utils.RANGE(3):
            skill_id = '%s' % i
            self.save_new_skill(
                skill_id, self.admin_id, description='description %d' % i)

        self.QUESTION_ID = question_services.get_new_question_id()
        self.save_new_question(
            self.QUESTION_ID, self.owner_id,
            self._create_valid_question_data('ABC'), ['0'])
        question_services.create_new_question_skill_link(
            self.owner_id, self.QUESTION_ID, '0', 0.3)

        self.model_instance_0 = (
            opportunity_models.SkillOpportunityModel.get('0'))
        self.model_instance_1 = (
            opportunity_models.SkillOpportunityModel.get('1'))
        self.model_instance_2 = (
            opportunity_models.SkillOpportunityModel.get('2'))

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated SkillOpportunityModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillOpportunityModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\', '
            'u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\', '
            'u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (
            self.model_instance_0.id, self.model_instance_0.last_updated,
            self.model_instance_1.id, self.model_instance_1.last_updated,
            self.model_instance_2.id, self.model_instance_2.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=True)

    def test_missing_skill_model_failure(self):
        skill_model = skill_models.SkillModel.get_by_id('0')
        skill_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of SkillOpportunityModel\', '
                '[u"Entity id 0: based on field skill_ids having '
                'value 0, expected model SkillModel with id 0 but it '
                'doesn\'t exist"]]'
            ),
            u'[u\'fully-validated SkillOpportunityModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_skill_description(self):
        self.model_instance_0.skill_description = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for skill_description field '
                'check of SkillOpportunityModel\', '
                '[u\'Entity id %s: skill_description field in entity: invalid '
                'does not match corresponding skill description field: '
                'description 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SkillOpportunityModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_count(self):
        self.model_instance_0.question_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for question_count check of '
                'SkillOpportunityModel\', '
                '[u\'Entity id %s: question_count: 10 does not match the '
                'question_count of external skill model: 1\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SkillOpportunityModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_count_schema(self):
        self.model_instance_0.question_count = -1
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'SkillOpportunityModel\', '
                '[u\'Entity id 0: Entity fails domain validation with the '
                'error Expected question_count to be a non-negative integer, '
                'received -1\']]'
            ),
            (
                u'[u\'failed validation check for question_count check of '
                'SkillOpportunityModel\', '
                '[u\'Entity id 0: question_count: -1 does not match the '
                'question_count of external skill model: 1\']]'
            ), u'[u\'fully-validated SkillOpportunityModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
