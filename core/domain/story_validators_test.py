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

"""Unit tests for core.domain.story_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import prod_validation_jobs_one_off
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

exp_models, story_models, user_models = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.story, models.NAMES.user])


class StoryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StoryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category',
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')
        topic_services.save_new_topic(self.owner_id, topic)

        language_codes = ['ar', 'en', 'en']
        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(3)]

        for index, story in enumerate(stories):
            story.language_code = language_codes[index]
            story_services.save_new_story(self.owner_id, story)
            topic_services.add_canonical_story(
                self.owner_id, topic.id, story.id)
            story_services.update_story(
                self.owner_id, story.id, [story_domain.StoryChange({
                    'cmd': 'add_story_node',
                    'node_id': 'node_1',
                    'title': 'Node1',
                }), story_domain.StoryChange({
                    'cmd': 'add_story_node',
                    'node_id': 'node_2',
                    'title': 'Node2',
                }), story_domain.StoryChange({
                    'cmd': 'update_story_node_property',
                    'property_name': 'destination_node_ids',
                    'node_id': 'node_1',
                    'old_value': [],
                    'new_value': ['node_2']
                }), story_domain.StoryChange({
                    'cmd': 'update_story_node_property',
                    'property_name': 'exploration_id',
                    'node_id': 'node_1',
                    'old_value': None,
                    'new_value': explorations[index * 2].id
                }), story_domain.StoryChange({
                    'cmd': 'update_story_node_property',
                    'property_name': 'exploration_id',
                    'node_id': 'node_2',
                    'old_value': None,
                    'new_value': explorations[index * 2 + 1].id
                })], 'Changes.')

        self.model_instance_0 = story_models.StoryModel.get_by_id('0')
        self.model_instance_1 = story_models.StoryModel.get_by_id('1')
        self.model_instance_2 = story_models.StoryModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.StoryModelAuditOneOffJob)

    def test_standard_operation(self):
        story_services.update_story(
            self.owner_id, '0', [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
                'new_value': 'New title',
                'old_value': 'title 0'
            })], 'Changes.')

        expected_output = [
            u'[u\'fully-validated StoryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of StoryModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated StoryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated StoryModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'StoryModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater than the time when '
                'the job was run\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_story_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'StoryModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated StoryModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of StoryModel\', '
                '[u"Entity id 0: based on field exploration_ids having value '
                '1, expected model ExplorationModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_story_commit_log_entry_model_failure(self):
        story_services.update_story(
            self.owner_id, '0', [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
                'new_value': 'New title',
                'old_value': 'title 0'
            })], 'Changes.')
        story_models.StoryCommitLogEntryModel.get_by_id(
            'story-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'story_commit_log_entry_ids field check of '
                'StoryModel\', '
                '[u"Entity id 0: based on field '
                'story_commit_log_entry_ids having value '
                'story-0-1, expected model StoryCommitLogEntryModel '
                'with id story-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        story_models.StorySummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for story_summary_ids '
                'field check of StoryModel\', '
                '[u"Entity id 0: based on field story_summary_ids having '
                'value 0, expected model StorySummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        story_models.StorySnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of StoryModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model StorySnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        story_models.StorySnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of StoryModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model StorySnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class StorySnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StorySnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(3)]

        for story in stories:
            if story.id != '0':
                story_services.save_new_story(self.owner_id, story)
            else:
                story_services.save_new_story(self.user_id, story)
            topic.add_canonical_story(story.id)

        topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            story_models.StorySnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            story_models.StorySnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            story_models.StorySnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .StorySnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        story_services.update_story(
            self.owner_id, '0', [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
                'new_value': 'New title',
                'old_value': 'title 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated StorySnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance_1.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated StorySnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance_1.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated StorySnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StorySnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'StorySnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StorySnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StorySnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field story_ids '
                'having value 0, expected model StoryModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'story_ids having value 0, expected model '
                'StoryModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'StorySnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of StorySnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'StorySnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StorySnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for story model '
                'version check of StorySnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Story model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated StorySnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_story_node'
        }, {
            'cmd': 'delete_story_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_story_node check of '
                'StorySnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_story_node\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'node_id, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd add_story_node '
                'check of StorySnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_story_node\'} '
                'failed with error: The following required attributes '
                'are missing: node_id, title"]]'
            ), u'[u\'fully-validated StorySnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class StorySnapshotContentModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StorySnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(3)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)
            topic.add_canonical_story(story.id)

        topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            story_models.StorySnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            story_models.StorySnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            story_models.StorySnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .StorySnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        story_services.update_story(
            self.owner_id, '0', [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
                'new_value': 'New title',
                'old_value': 'title 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated StorySnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StorySnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'StorySnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StorySnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StorySnapshotContentModel\', '
                '[u"Entity id 0-1: based on field story_ids '
                'having value 0, expected model StoryModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'story_ids having value 0, expected model '
                'StoryModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'StorySnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StorySnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for story model '
                'version check of StorySnapshotContentModel\', '
                '[u\'Entity id 0-3: Story model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated StorySnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class StoryCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StoryCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(3)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)
            topic.add_canonical_story(story.id)

        topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            story_models.StoryCommitLogEntryModel.get_by_id(
                'story-0-1'))
        self.model_instance_1 = (
            story_models.StoryCommitLogEntryModel.get_by_id(
                'story-1-1'))
        self.model_instance_2 = (
            story_models.StoryCommitLogEntryModel.get_by_id(
                'story-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .StoryCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        story_services.update_story(
            self.owner_id, '0', [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
                'new_value': 'New title',
                'old_value': 'title 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated StoryCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_user_id_migration_bot(self):
        self.model_instance_1.user_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated StoryCommitLogEntryModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_user_id(self):
        self.model_instance_1.user_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated StoryCommitLogEntryModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StoryCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StoryCommitLogEntryModel\', '
                '[u"Entity id story-0-1: based on field story_ids '
                'having value 0, expected model StoryModel with id 0 '
                'but it doesn\'t exist", u"Entity id story-0-2: based '
                'on field story_ids having value 0, expected model '
                'StoryModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StoryCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.story_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for story model '
                'version check of StoryCommitLogEntryModel\', '
                '[u\'Entity id %s: Story model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated StoryCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            story_models.StoryCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.story_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'StoryCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'StoryCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated StoryCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'StoryCommitLogEntryModel\', '
                '[u\'Entity id story-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of StoryCommitLogEntryModel\', '
                '[u\'Entity id story-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'public'
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of StoryCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of StoryCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_story_node'
        }, {
            'cmd': 'delete_story_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_story_node check of '
                'StoryCommitLogEntryModel\', '
                '[u"Entity id story-0-1: Commit command domain '
                'validation for command: {u\'cmd\': u\'delete_story_node\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: node_id, '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_story_node check of StoryCommitLogEntryModel\', '
                '[u"Entity id story-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_story_node\'} '
                'failed with error: The following required attributes '
                'are missing: node_id, title"]]'
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class StorySummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StorySummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        language_codes = ['ar', 'en', 'en']

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(3)]

        for index, story in enumerate(stories):
            story.description = 'story-test'
            story.language_code = language_codes[index]
            story_services.save_new_story(self.owner_id, story)
            topic.add_canonical_story(story.id)

        topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = story_models.StorySummaryModel.get_by_id('0')
        self.model_instance_1 = story_models.StorySummaryModel.get_by_id('1')
        self.model_instance_2 = story_models.StorySummaryModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.StorySummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        story_services.update_story(
            self.owner_id, '1', [story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
                'new_value': 'New title',
                'old_value': 'title 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated StorySummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_node_titles_in_story_models(self):
        story_id = story_services.get_new_story_id()
        story = story_domain.Story.create_default_story(
            story_id, 'Title', 'Description', 'topic_id', 'url')
        story.add_node('node_1', 'Node title')
        story_services.save_new_story(self.owner_id, story)
        story_model = story_models.StoryModel.get_by_id(story_id)
        nodes = story_model.story_contents['nodes']
        with self.assertRaisesRegexp(
            Exception, '\'dict\' object has no attribute \'title\''):
            _ = [node.title for node in nodes]

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StorySummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated StorySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        story_services.delete_story(self.owner_id, '1')
        story_services.delete_story(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StorySummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_model = story_models.StoryModel.get_by_id('0')
        story_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.story_model_last_updated = (
            story_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StorySummaryModel\', '
                '[u"Entity id 0: based on field story_ids having '
                'value 0, expected model StoryModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated StorySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_node_titles(self):
        self.model_instance_0.node_titles = ['Title 1']
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for node titles check of '
                'StorySummaryModel\', [u"Entity id 0: Node titles: '
                '[u\'Title 1\'] does not match the nodes in story_contents '
                'dict: []"]]'
            ), u'[u\'fully-validated StorySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_story_related_property(self):
        self.model_instance_0.title = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for title field check of '
                'StorySummaryModel\', '
                '[u\'Entity id %s: title field in entity: invalid does not '
                'match corresponding story title field: title 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated StorySummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
