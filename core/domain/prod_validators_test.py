# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.prod_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import random

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import prod_validation_jobs_one_off
from core.domain import prod_validators
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(
    collection_models, exp_models, feedback_models,
    job_models, story_models, subtopic_models,
    suggestion_models, topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.job, models.NAMES.story, models.NAMES.subtopic,
    models.NAMES.suggestion, models.NAMES.topic, models.NAMES.user
])


class ExplorationModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        language_codes = ['ar', 'en', 'en']
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            language_code=language_codes[i]
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance_0 = exp_models.ExplorationModel.get_by_id('0')
        self.model_instance_1 = exp_models.ExplorationModel.get_by_id('1')
        self.model_instance_2 = exp_models.ExplorationModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.ExplorationModelAuditOneOffJob)

    def test_standard_operation(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')

        expected_output = [
            u'[u\'fully-validated ExplorationModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated ExplorationModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated ExplorationModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'ExplorationModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater than the time when '
                'the job was run\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_exploration_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'ExplorationModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language_code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated ExplorationModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_private_exploration_with_missing_interaction_in_state(self):
        expected_output = [
            u'[u\'fully-validated ExplorationModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_exploration_with_missing_interaction_in_state(self):
        owner = user_services.UserActionsInfo(self.owner_id)
        rights_manager.publish_exploration(owner, '0')
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'ExplorationModel\', [u\'Entity id 0: Entity fails '
                'domain validation with the error This state does not have any '
                'interaction specified.\']]'
            ),
            u'[u\'fully-validated ExplorationModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_commit_log_entry_model_failure(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        exp_models.ExplorationCommitLogEntryModel.get_by_id(
            'exploration-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'exploration_commit_log_entry_ids field check of '
                'ExplorationModel\', '
                '[u"Entity id 0: based on field '
                'exploration_commit_log_entry_ids having value '
                'exploration-0-1, expected model '
                'ExplorationCommitLogEntryModel with id exploration-0-1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        exp_models.ExpSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for exp_summary_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field exp_summary_ids having '
                'value 0, expected model ExpSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_rights_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field exploration_rights_ids '
                'having value 0, expected model ExplorationRightsModel '
                'with id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        exp_models.ExplorationSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model ExplorationSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        exp_models.ExplorationSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model ExplorationSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ExplorationSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            if exp.id != '0':
                exp_services.save_new_exploration(self.owner_id, exp)
            else:
                exp_services.save_new_exploration(self.user_id, exp)

        self.model_instance_0 = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated ExplorationSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'ExplorationSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field exploration_ids '
                'having value 0, expected model ExplorationModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_ids having value 0, expected model '
                'ExplorationModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of ExplorationSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'ExplorationSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for exploration model '
                'version check of ExplorationSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Exploration model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated ExplorationSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_state'
        }, {
            'cmd': 'delete_state',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit '
                'cmd delete_state check of '
                'ExplorationSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_state\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'state_name, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit '
                'cmd add_state check of '
                'ExplorationSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_state\'} '
                'failed with error: The following required attributes '
                'are missing: state_name"]]'
            ), u'[u\'fully-validated ExplorationSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_maximum_of_ten_errors_are_emitted(self):
        for i in python_utils.RANGE(20):
            exp_services.update_exploration(
                self.owner_id, '0', [exp_domain.ExplorationChange({
                    'cmd': 'edit_exploration_property',
                    'property_name': 'title',
                    'new_value': 'New title %s' % i
                })], 'Changes.')
        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, '', [])

        self.process_and_flush_pending_tasks()
        job_id = self.job_class.create_new()
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        self.job_class.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.process_and_flush_pending_tasks()
        actual_output = self.job_class.get_output(job_id)

        self.assertEqual(len(actual_output), 2)

        self.assertEqual(
            actual_output[1],
            '[u\'fully-validated ExplorationSnapshotMetadataModel\', 2]')

        full_error_list = []
        for i in python_utils.RANGE(22):
            full_error_list.append(
                'Entity id 0-%s: based on field exploration_ids having '
                'value 0, expected model ExplorationModel with id 0 but '
                'it doesn\'t exist' % (i + 1))
        actual_error_list = ast.literal_eval(actual_output[0])[1]
        self.assertEqual(len(actual_error_list), 10)
        for error in actual_error_list:
            assert (error in full_error_list), ('Extra error: %s' % error)


class ExplorationSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance_0 = (
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated ExplorationSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'ExplorationSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field exploration_ids '
                'having value 0, expected model ExplorationModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_ids having value 0, expected model '
                'ExplorationModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for exploration model '
                'version check of ExplorationSnapshotContentModel\', '
                '[u\'Entity id 0-3: Exploration model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated ExplorationSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ExplorationRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationRightsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        editor_email = 'user@editor.com'
        viewer_email = 'user@viewer.com'

        self.signup(editor_email, 'editor')
        self.signup(viewer_email, 'viewer')

        self.editor_id = self.get_user_id_from_email(editor_email)
        self.viewer_id = self.get_user_id_from_email(viewer_email)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.editor_id, rights_domain.ROLE_EDITOR)

        rights_manager.assign_role_for_exploration(
            self.owner, '2', self.viewer_id, rights_domain.ROLE_VIEWER)

        self.model_instance_0 = exp_models.ExplorationRightsModel.get_by_id('0')
        self.model_instance_1 = exp_models.ExplorationRightsModel.get_by_id('1')
        self.model_instance_2 = exp_models.ExplorationRightsModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.ExplorationRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        rights_manager.publish_exploration(self.owner, '0')
        expected_output = [
            u'[u\'fully-validated ExplorationRightsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated ExplorationRightsModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'ExplorationRightsModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater than the time when '
                'the job was run\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.last_updated)
        ]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_first_published_datetime_greater_than_current_time(
            self):
        rights_manager.publish_exploration(self.owner, '0')
        rights_manager.publish_exploration(self.owner, '1')
        self.model_instance_0.first_published_msec = (
            self.model_instance_0.first_published_msec * 1000000.0)
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for first published msec check '
                'of ExplorationRightsModel\', '
                '[u\'Entity id 0: The first_published_msec field has a '
                'value %s which is greater than the time when the job was '
                'run\']]'
            ) % (self.model_instance_0.first_published_msec),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field exploration_ids having '
                'value 0, expected model ExplorationModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_cloned_from_exploration_model_failure(self):
        self.model_instance_0.cloned_from = 'invalid'
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'cloned_from_exploration_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field cloned_from_exploration_ids '
                'having value invalid, expected model ExplorationModel with id '
                'invalid but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.user_id, rights_domain.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model '
                'ExplorationRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model '
                'ExplorationRightsSnapshotContentModel with id 0-1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ExplorationRightsSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationRightsSnapshotMetadataModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            if exp.id != '0':
                exp_services.save_new_exploration(self.owner_id, exp)
            else:
                exp_services.save_new_exploration(self.user_id, exp)

        self.model_instance_0 = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationRightsSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationRightsSnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_rights_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field exploration_rights_ids '
                'having value 0, expected model ExplorationRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_rights_ids having value 0, expected model '
                'ExplorationRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of ExplorationRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for exploration rights model '
                'version check of ExplorationRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: ExplorationRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_exploration_status',
            'old_status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, {
            'cmd': 'release_ownership',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_exploration_status check of '
                'ExplorationRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'old_status\': u\'public\', '
                'u\'cmd\': u\'change_exploration_status\'} '
                'failed with error: The following required '
                'attributes are missing: new_status"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'release_ownership check of '
                'ExplorationRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'release_ownership\', '
                'u\'invalid_attribute\': u\'invalid\'} '
                'failed with error: The following extra attributes '
                'are present: invalid_attribute"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ExplorationRightsSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationRightsSnapshotContentModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance_0 = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationRightsSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationRightsSnapshotContentModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field exploration_rights_ids '
                'having value 0, expected model ExplorationRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_rights_ids having value 0, expected model '
                'ExplorationRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for exploration rights model '
                'version check of ExplorationRightsSnapshotContentModel\', '
                '[u\'Entity id 0-3: ExplorationRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated ExplorationRightsSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ExplorationCommitLogEntryModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.rights_model_instance = (
            exp_models.ExplorationCommitLogEntryModel(
                id='rights-1-1',
                user_id=self.owner_id,
                exploration_id='1',
                commit_type='edit',
                commit_message='',
                commit_cmds=[],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_community_owned=False,
                post_commit_is_private=False))
        self.rights_model_instance.update_timestamps()
        self.rights_model_instance.put()

        self.model_instance_0 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-1'))
        self.model_instance_1 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-1-1'))
        self.model_instance_2 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        self.rights_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationCommitLogEntryModel\', '
                '[u"Entity id exploration-0-1: based on field '
                'exploration_ids having value 0, expected model '
                'ExplorationModel with id 0 '
                'but it doesn\'t exist", u"Entity id exploration-0-2: based '
                'on field exploration_ids having value 0, expected model '
                'ExplorationModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_rights_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationCommitLogEntryModel\', '
                '[u"Entity id rights-1-1: based on field '
                'exploration_rights_ids having value 1, expected model '
                'ExplorationRightsModel with id 1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.exploration_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for exploration model '
                'version check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Exploration model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            exp_models.ExplorationCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.exploration_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'ExplorationCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'ExplorationCommitLogEntryModel\', '
                '[u\'Entity id exploration-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id exploration-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
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
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
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
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_state'
        }, {
            'cmd': 'delete_state',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_state check of '
                'ExplorationCommitLogEntryModel\', '
                '[u"Entity id exploration-0-1: Commit command domain '
                'validation for command: {u\'cmd\': u\'delete_state\', '
                'u\'invalid_attribute\': u\'invalid\'} '
                'failed with error: The following required attributes '
                'are missing: state_name, '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_state check of '
                'ExplorationCommitLogEntryModel\', '
                '[u"Entity id exploration-0-1: Commit command domain '
                'validation for command: {u\'cmd\': u\'add_state\'} '
                'failed with error: The following required attributes '
                'are missing: state_name"]]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ExpSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExpSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        editor_email = 'user@editor.com'
        viewer_email = 'user@viewer.com'
        contributor_email = 'user@contributor.com'

        self.signup(editor_email, 'editor')
        self.signup(viewer_email, 'viewer')
        self.signup(contributor_email, 'contributor')

        self.editor_id = self.get_user_id_from_email(editor_email)
        self.viewer_id = self.get_user_id_from_email(viewer_email)
        self.contributor_id = self.get_user_id_from_email(contributor_email)

        language_codes = ['ar', 'en', 'en']
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            language_code=language_codes[i]
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp.tags = ['math', 'art']
            exp_services.save_new_exploration(self.owner_id, exp)

        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.editor_id, rights_domain.ROLE_EDITOR)
        exp_services.update_exploration(
            self.contributor_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')

        rights_manager.assign_role_for_exploration(
            self.owner, '2', self.viewer_id, rights_domain.ROLE_VIEWER)

        rating_services.assign_rating_to_exploration(self.user_id, '0', 3)
        rating_services.assign_rating_to_exploration(self.viewer_id, '0', 4)

        self.model_instance_0 = exp_models.ExpSummaryModel.get_by_id('0')
        self.model_instance_1 = exp_models.ExpSummaryModel.get_by_id('1')
        self.model_instance_2 = exp_models.ExpSummaryModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.ExpSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        rights_manager.publish_exploration(self.owner, '0')
        exp_services.update_exploration(
            self.owner_id, '1', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated ExpSummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExpSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            self.owner_id, '')
        exp_models.ExplorationModel.get_by_id('2').delete(
            self.owner_id, '')
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExpSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_first_published_datetime_greater_than_current_time(
            self):
        rights_manager.publish_exploration(self.owner, '0')
        rights_manager.publish_exploration(self.owner, '1')
        self.model_instance_0 = exp_models.ExpSummaryModel.get_by_id('0')
        self.model_instance_0.first_published_msec = (
            self.model_instance_0.first_published_msec * 1000000.0)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        rights_model = exp_models.ExplorationRightsModel.get_by_id('0')
        rights_model.first_published_msec = (
            self.model_instance_0.first_published_msec)
        rights_model.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for first published msec check '
                'of ExpSummaryModel\', '
                '[u\'Entity id 0: The first_published_msec field has a '
                'value %s which is greater than the time when the '
                'job was run\']]'
            ) % (self.model_instance_0.first_published_msec),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field exploration_ids having '
                'value 0, expected model ExplorationModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.user_id, rights_domain.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_contributor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.contributor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for contributor_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field contributor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.contributor_id, self.contributor_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_exploration_model_last_updated(self):
        last_human_update_time = (
            self.model_instance_0.exploration_model_last_updated)
        self.model_instance_0.exploration_model_last_updated = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for exploration model last '
                'updated check of ExpSummaryModel\', '
                '[u\'Entity id %s: The exploration_model_last_updated '
                'field: %s does not match the last time a commit was '
                'made by a human contributor: %s\']]'
            ) % (
                self.model_instance_0.id,
                self.model_instance_0.exploration_model_last_updated,
                last_human_update_time),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_schema(self):
        self.model_instance_0.ratings = {'10': 4, '5': 15}
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'ExpSummaryModel\', '
                '[u\'Entity id 0: Entity fails domain validation with '
                'the error Expected ratings to have keys: 1, 2, 3, 4, 5, '
                'received 10, 5\']]'
            ), u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_contributors_summary(self):
        sorted_contributor_ids = sorted(
            self.model_instance_0.contributors_summary.keys())
        self.model_instance_0.contributors_summary = {'invalid': 1}
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for contributors summary '
                'check of ExpSummaryModel\', '
                '[u"Entity id 0: Contributor ids: [u\'%s\', u\'%s\'] '
                'do not match the contributor ids obtained using '
                'contributors summary: [u\'invalid\']"]]') % (
                    sorted_contributor_ids[0], sorted_contributor_ids[1]
                ),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_exploration_related_property(self):
        self.model_instance_0.title = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for title field check of '
                'ExpSummaryModel\', '
                '[u\'Entity id %s: title field in entity: invalid does not '
                'match corresponding exploration title field: New title\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_exploration_rights_related_property(self):
        self.model_instance_0.status = 'public'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for status field check of '
                'ExpSummaryModel\', '
                '[u\'Entity id %s: status field in entity: public does not '
                'match corresponding exploration rights status field: '
                'private\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class GeneralFeedbackThreadModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackThreadModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'Subject', 'Text',
            has_suggestion=False)

        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER + exp.category)
        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': 'new suggestion content'
        }
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION, '0',
            1, suggestion_models.STATUS_ACCEPTED, self.owner_id,
            self.admin_id, change, score_category, self.thread_id, None)

        self.model_instance = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_id))
        self.model_instance.has_suggestion = True
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackThreadModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralFeedbackThreadModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackThreadModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackThreadModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]
        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_suggestion_model_failure(self):
        suggestion_models.GeneralSuggestionModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for suggestion_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field suggestion_ids having '
                'value %s, expected model GeneralSuggestionModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                '[u\'failed validation check for '
                'last_nonempty_message_author_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field '
                'last_nonempty_message_author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]'
            ) % (
                self.model_instance.id, self.owner_id, self.owner_id
            ),
            (
                '[u\'failed validation check for author_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]'
            ) % (
                self.model_instance.id, self.owner_id, self.owner_id
            ),
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_original_author_id_format_failure(self):
        self.model_instance.original_author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final author '
                'check of GeneralFeedbackThreadModel\', [u\'Entity id %s: '
                'Original author ID %s is in a wrong format. '
                'It should be either pid_<32 chars> or uid_<32 chars>.\']]'
            ) % (
                self.model_instance.id, self.model_instance.original_author_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_last_nonempty_message_author_id_format_failure(self):
        self.model_instance.last_nonempty_message_author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final author '
                'check of GeneralFeedbackThreadModel\', [u\'Entity id %s: '
                'Last non-empty message author ID %s is in a wrong format. '
                'It should be either pid_<32 chars> or uid_<32 chars>.\']]'
            ) % (
                self.model_instance.id,
                self.model_instance.last_nonempty_message_author_id
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field message_ids having value '
                '%s.0, expected model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_has_suggestion(self):
        self.model_instance.has_suggestion = False
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for has suggestion '
                'check of GeneralFeedbackThreadModel\', [u\'Entity id %s: '
                'has suggestion for entity is false but a suggestion exists '
                'with id same as entity id\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_entity_type(self):
        expected_output = [
            (
                u'[u\'failed validation check for entity type check '
                'of GeneralFeedbackThreadModel\', [u\'Entity id %s: Entity '
                'type exploration is not allowed\']]'
            ) % self.model_instance.id]
        with self.swap(
            prod_validators, 'TARGET_TYPE_TO_TARGET_MODEL', {}):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)


class GeneralFeedbackMessageModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackMessageModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'Subject', 'Text',
            has_suggestion=False)

        self.model_instance = (
            feedback_models.GeneralFeedbackMessageModel.get_by_id(
                '%s.0' % self.thread_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackMessageModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralFeedbackMessageModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackMessageModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackMessageModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralFeedbackMessageModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_author_id_format_failure(self):
        self.model_instance.author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final author '
                'check of GeneralFeedbackMessageModel\', [u\'Entity id %s: '
                'Author ID %s is in a wrong format. '
                'It should be either pid_<32 chars> or uid_<32 chars>.\']]'
            ) % (
                self.model_instance.id, self.model_instance.author_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_feedback_thread_model_failure(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for feedback_thread_ids field '
                'check of GeneralFeedbackMessageModel\', '
                '[u"Entity id %s: based on field feedback_thread_ids having '
                'value %s, expected model GeneralFeedbackThreadModel with '
                'id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_message_id(self):
        self.model_instance.message_id = 2
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for message id check of '
                'GeneralFeedbackMessageModel\', [u\'Entity id %s: '
                'message id 2 not less than total count of messages '
                '1 in feedback thread model with id %s '
                'corresponding to the entity\']]'
            ) % (self.model_instance.id, self.thread_id), (
                u'[u\'failed validation check for model id check '
                'of GeneralFeedbackMessageModel\', [u\'Entity id %s: '
                'Entity id does not match regex pattern\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class GeneralFeedbackThreadUserModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackThreadUserModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'Subject', 'Text',
            has_suggestion=False)

        self.model_instance = (
            feedback_models.GeneralFeedbackThreadUserModel.get_by_id(
                '%s.%s' % (self.owner_id, self.thread_id)))

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackThreadUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralFeedbackThreadUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackThreadUserModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackThreadUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_ids field '
                'check of GeneralFeedbackThreadUserModel\', '
                '[u"Entity id %s: based on field user_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of GeneralFeedbackThreadUserModel\', '
                '[u"Entity id %s: based on field message_ids having '
                'value %s.0, expected model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class FeedbackAnalyticsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(FeedbackAnalyticsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance = feedback_models.FeedbackAnalyticsModel(id='0')
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.FeedbackAnalyticsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FeedbackAnalyticsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of FeedbackAnalyticsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FeedbackAnalyticsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of FeedbackAnalyticsModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UnsentFeedbackEmailModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UnsentFeedbackEmailModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'Subject', 'Text',
            has_suggestion=False)

        feedback_message_references = [{
            'entity_type': 'exploration',
            'entity_id': '0',
            'thread_id': self.thread_id,
            'message_id': 0
        }]
        self.model_instance = feedback_models.UnsentFeedbackEmailModel(
            id=self.owner_id,
            feedback_message_references=feedback_message_references,
            retries=1)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.UnsentFeedbackEmailModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UnsentFeedbackEmailModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UnsentFeedbackEmailModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UnsentFeedbackEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_ids field '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: based on field user_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: based on field message_ids having value '
                '%s.0, expected model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_message_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('message_id')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'thread_id\': u\'%s\', u\'entity_id\': u\'0\', '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_thread_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('thread_id')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'entity_id\': u\'0\', u\'message_id\': 0, '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_entity_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('entity_id')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'message_id\': 0, u\'entity_type\': '
                'u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_entity_type_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('entity_type')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'thread_id\': u\'%s\', u\'entity_id\': u\'0\', '
                'u\'message_id\': 0}"]]'
            ) % (self.model_instance.id, self.thread_id)]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_entity_type_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0]['entity_type'] = (
            'invalid')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'entity_id\': u\'0\', u\'message_id\': 0, '
                'u\'entity_type\': u\'invalid\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_entity_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0]['entity_id'] = (
            'invalid')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'entity_id\': u\'invalid\', u\'message_id\': 0, '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class JobModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(JobModelValidatorTests, self).setUp()

        current_time_str = python_utils.UNICODE(
            int(utils.get_current_time_in_millisecs()))
        random_int = random.randint(0, 1000)
        self.model_instance = job_models.JobModel(
            id='test-%s-%s' % (current_time_str, random_int),
            status_code=job_models.STATUS_CODE_NEW, job_type='test',
            time_queued_msec=1, time_started_msec=10, time_finished_msec=20)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.JobModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated JobModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of JobModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [
            (
                u'[u\'failed validation check for current time check of '
                'JobModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater than the time when the job '
                'was run\']]'
            ) % (self.model_instance.id, self.model_instance.last_updated),
            u'[u\'fully-validated JobModel\', 1]']

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_invalid_empty_error(self):
        self.model_instance.status_code = job_models.STATUS_CODE_FAILED
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for error check '
                'of JobModel\', [u\'Entity id %s: '
                'error for job is empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_non_empty_error(self):
        self.model_instance.error = 'invalid'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for error check '
                'of JobModel\', [u\'Entity id %s: '
                'error: invalid for job is not empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_empty_output(self):
        self.model_instance.status_code = job_models.STATUS_CODE_COMPLETED
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for output check '
                'of JobModel\', [u\'Entity id %s: '
                'output for job is empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_non_empty_output(self):
        self.model_instance.output = 'invalid'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for output check '
                'of JobModel\', [u\'Entity id %s: '
                'output: invalid for job is not empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_queued_msec(self):
        self.model_instance.time_queued_msec = 15
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time queued check '
                'of JobModel\', [u\'Entity id %s: '
                'time queued 15.0 is greater than time started 10.0\']]'
            ) % self.model_instance.id,
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_started_msec(self):
        self.model_instance.time_started_msec = 25
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time started check '
                'of JobModel\', [u\'Entity id %s: '
                'time started 25.0 is greater than time finished 20.0\']]'
            ) % self.model_instance.id,
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_finished_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.time_finished_msec = current_time_msec * 10.0
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time finished '
                'check of JobModel\', [u\'Entity id %s: time '
                'finished %s is greater than the current time\']]'
            ) % (
                self.model_instance.id,
                self.model_instance.time_finished_msec),
            u'[u\'fully-validated JobModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ContinuousComputationModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ContinuousComputationModelValidatorTests, self).setUp()

        self.model_instance = job_models.ContinuousComputationModel(
            id='FeedbackAnalyticsAggregator',
            status_code=job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING,
            last_started_msec=1, last_stopped_msec=10, last_finished_msec=20)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .ContinuousComputationModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ContinuousComputationModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ContinuousComputationModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ContinuousComputationModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_last_started_msec(self):
        self.model_instance.last_started_msec = 25
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last started check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last started 25.0 is greater than both last finished 20.0 '
                'and last stopped 10.0\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_last_stopped_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.last_stopped_msec = current_time_msec * 10.0
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last stopped check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last stopped %s is greater than the current time\']]'
            ) % (self.model_instance.id, self.model_instance.last_stopped_msec)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_last_finished_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.last_finished_msec = current_time_msec * 10.0
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last finished check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last finished %s is greater than the current time\']]'
            ) % (
                self.model_instance.id,
                self.model_instance.last_finished_msec)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = job_models.ContinuousComputationModel(
            id='invalid',
            status_code=job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING,
            last_started_msec=1, last_stopped_msec=10, last_finished_msec=20)
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'ContinuousComputationModel\', '
                '[u\'Entity id invalid: Entity id does not match '
                'regex pattern\']]'
            ), u'[u\'fully-validated ContinuousComputationModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ExplorationContextModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationContextModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(2)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance_0 = (
            exp_models.ExplorationContextModel(id='0', story_id='0'))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        self.model_instance_1 = (
            exp_models.ExplorationContextModel(id='1', story_id='0'))
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        self.model_instance_2 = (
            exp_models.ExplorationContextModel(id='2', story_id='1'))
        self.model_instance_2.update_timestamps()
        self.model_instance_2.put()

        self.job_class = (
            prod_validation_jobs_one_off.ExplorationContextModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationContextModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ExplorationContextModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated ExplorationContextModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationContextModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids field '
                'check of ExplorationContextModel\', '
                '[u"Entity id 2: based on field story_ids '
                'having value 1, expected model StoryModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationContextModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exp_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'exp_ids field check of ExplorationContextModel\', '
                '[u"Entity id 2: based on field '
                'exp_ids having value 2, expected model ExplorationModel '
                'with id 2 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationContextModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SubtopicPageModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            topic_services.update_topic_and_subtopic_pages(
                self.owner_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageModel.get_by_id('0-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageModel.get_by_id('1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageModel.get_by_id('2-1'))

        self.job_class = (
            prod_validation_jobs_one_off.SubtopicPageModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageModel\', 3]']
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
                'of SubtopicPageModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated SubtopicPageModel\', 2]',
            (
                '[u\'failed validation check for current time check of '
                'SubtopicPageModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater '
                'than the time when the job was run\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.last_updated)
        ]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_subtopic_page_schema(self):
        self.model_instance_0.language_code = 'ar'
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'SubtopicPageModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field '
                'check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field topic_ids having value '
                '0, expected model TopicModel with id 0 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_commit_log_entry_model_failure(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
            'subtopicpage-0-1-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'subtopic_page_commit_log_entry_ids field check of '
                'SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field '
                'subtopic_page_commit_log_entry_ids having value '
                'subtopicpage-0-1-1, expected model '
                'SubtopicPageCommitLogEntryModel '
                'with id subtopicpage-0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
            '0-1-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field snapshot_metadata_ids having '
                'value 0-1-1, expected model SubtopicPageSnapshotMetadataModel '
                'with id 0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
            '0-1-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field snapshot_content_ids having '
                'value 0-1-1, expected model SubtopicPageSnapshotContentModel '
                'with id 0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SubtopicPageSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageSnapshotMetadataModelValidatorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            if index == 0:
                committer_id = self.user_id
            else:
                committer_id = self.owner_id
            topic_services.update_topic_and_subtopic_pages(
                committer_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '0-1-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '1-1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '2-1-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SubtopicPageSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SubtopicPageSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: based on field subtopic_page_ids '
                'having value 0-1, expected model SubtopicPageModel with '
                'id 0-1 but it doesn\'t exist", u"Entity id 0-1-2: based '
                'on field subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_subtopic_page_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='0-1-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic page model '
                'version check of SubtopicPageSnapshotMetadataModel\', '
                '[u\'Entity id 0-1-3: SubtopicPage model corresponding to '
                'id 0-1 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'create_new',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd create_new '
                'check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'create_new\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'subtopic_id, topic_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SubtopicPageSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageSnapshotContentModelValidatorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            topic_services.update_topic_and_subtopic_pages(
                self.owner_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '0-1-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '1-1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '2-1-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SubtopicPageSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SubtopicPageSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageSnapshotContentModel\', '
                '[u"Entity id 0-1-1: based on field subtopic_page_ids '
                'having value 0-1, expected model SubtopicPageModel with '
                'id 0-1 but it doesn\'t exist", u"Entity id 0-1-2: based '
                'on field subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_invalid_subtopic_page_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            subtopic_models.SubtopicPageSnapshotContentModel(id='0-1-3'))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic page model '
                'version check of SubtopicPageSnapshotContentModel\', '
                '[u\'Entity id 0-1-3: SubtopicPage model corresponding to '
                'id 0-1 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated SubtopicPageSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SubtopicPageCommitLogEntryModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            if index == 0:
                committer_id = self.user_id
            else:
                committer_id = self.owner_id
            topic_services.update_topic_and_subtopic_pages(
                committer_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-0-1-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-1-1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-2-1-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SubtopicPageCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SubtopicPageCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageCommitLogEntryModel\', '
                '[u"Entity id subtopicpage-0-1-1: based on field '
                'subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist", '
                'u"Entity id subtopicpage-0-1-2: based on field '
                'subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            subtopic_models.SubtopicPageCommitLogEntryModel.create(
                '0-1', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.subtopic_page_id = '0-1'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic page model '
                'version check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: SubtopicPage model corresponding '
                'to id 0-1 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            subtopic_models.SubtopicPageCommitLogEntryModel(
                id='invalid-0-1-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.subtopic_page_id = '0-1'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'SubtopicPageCommitLogEntryModel\', [u\'Entity id '
                'invalid-0-1-1: No commit command domain object defined '
                'for entity with commands: [{}]\']]'),
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id subtopicpage-0-1-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id subtopicpage-0-1-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
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
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
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
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'create_new',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd create_new '
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u"Entity id subtopicpage-0-1-1: Commit command domain '
                'validation for command: {u\'cmd\': u\'create_new\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'subtopic_id, topic_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
