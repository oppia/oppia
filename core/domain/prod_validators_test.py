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

import datetime
import math
import random
import time
import types

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.domain import prod_validation_jobs_one_off
from core.domain import prod_validators
from core.domain import question_domain
from core.domain import question_services
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subscription_services
from core.domain import subtopic_page_domain
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_query_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'
CURRENT_DATETIME = datetime.datetime.utcnow()

(
    audit_models, classifier_models, collection_models,
    config_models, email_models, exp_models,
    feedback_models, job_models,
    opportunity_models, question_models, skill_models,
    story_models, subtopic_models, suggestion_models,
    topic_models, user_models

) = models.Registry.import_models([
    models.NAMES.audit, models.NAMES.classifier, models.NAMES.collection,
    models.NAMES.config, models.NAMES.email, models.NAMES.exploration,
    models.NAMES.feedback, models.NAMES.job,
    models.NAMES.opportunity, models.NAMES.question,
    models.NAMES.skill, models.NAMES.story,
    models.NAMES.subtopic, models.NAMES.suggestion, models.NAMES.topic,
    models.NAMES.user
])


class RoleQueryAuditModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(RoleQueryAuditModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        admin_model = user_models.UserSettingsModel.get_by_id(self.admin_id)
        admin_model.role = feconf.ROLE_ID_ADMIN
        admin_model.update_timestamps()
        admin_model.put()

        model_id = '%s.%s.%s.%s' % (
            self.admin_id, int(math.floor(time.time())),
            feconf.ROLE_ACTION_UPDATE, random.randint(0, 1000))
        self.model_instance = audit_models.RoleQueryAuditModel(
            id=model_id, user_id=self.admin_id,
            intent=feconf.ROLE_ACTION_UPDATE, role='c', username='d')
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.RoleQueryAuditModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated RoleQueryAuditModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of RoleQueryAuditModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'RoleQueryAuditModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get(self.admin_id).delete()
        expected_output = [(
            u'[u\'failed validation check for user_ids field check of '
            'RoleQueryAuditModel\', '
            '[u"Entity id %s: based on field user_ids having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.admin_id, self.admin_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_invalid_id = '%s.%s.%s.%s' % (
            'a', int(math.floor(time.time())), feconf.ROLE_ACTION_UPDATE,
            random.randint(0, 1000))
        model_instance_with_invalid_id = audit_models.RoleQueryAuditModel(
            id=model_invalid_id, user_id=self.admin_id,
            intent=feconf.ROLE_ACTION_UPDATE, role='c', username='d')
        model_instance_with_invalid_id.update_timestamps()
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated RoleQueryAuditModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'RoleQueryAuditModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_invalid_id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UsernameChangeAuditModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UsernameChangeAuditModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        admin_model = user_models.UserSettingsModel.get_by_id(self.admin_id)
        admin_model.role = feconf.ROLE_ID_ADMIN
        admin_model.update_timestamps()
        admin_model.put()

        model_id = (
            '%s.%d' % (self.admin_id, utils.get_current_time_in_millisecs()))
        self.model_instance = audit_models.UsernameChangeAuditModel(
            id=model_id, committer_id=self.admin_id,
            old_username=USER_NAME, new_username='new')
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.UsernameChangeAuditModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [
            u'[u\'fully-validated UsernameChangeAuditModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UsernameChangeAuditModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UsernameChangeAuditModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get(self.admin_id).delete()
        expected_output = [(
            u'[u\'failed validation check for committer_ids field check of '
            'UsernameChangeAuditModel\', '
            '[u"Entity id %s: based on field committer_ids having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.admin_id, self.admin_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_invalid_id = (
            '%d.%s' % (utils.get_current_time_in_millisecs(), self.admin_id))
        model_instance_with_invalid_id = audit_models.UsernameChangeAuditModel(
            id=model_invalid_id, committer_id=self.admin_id,
            old_username=USER_NAME, new_username='new')
        model_instance_with_invalid_id.update_timestamps()
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated UsernameChangeAuditModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'UsernameChangeAuditModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_invalid_id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        language_codes = ['ar', 'en', 'en']

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
            language_code=language_codes[i]
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance_0 = collection_models.CollectionModel.get_by_id('0')
        self.model_instance_1 = collection_models.CollectionModel.get_by_id('1')
        self.model_instance_2 = collection_models.CollectionModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.CollectionModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')

        expected_output = [
            u'[u\'fully-validated CollectionModel\', 3]']
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
                'of CollectionModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_collection_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'CollectionModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated CollectionModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_private_collection_with_missing_title(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': ''
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_collection_with_missing_title(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': ''
            }], 'Changes.')
        owner = user_services.UserActionsInfo(self.owner_id)
        rights_manager.publish_collection(owner, '0')
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'CollectionModel\', [u\'Entity id 0: Entity fails '
                'domain validation with the error A title must be specified '
                'for the collection.\']]'
            ),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'exploration_ids field check of CollectionModel\', '
                '[u"Entity id 0: based on field exploration_ids having value '
                '1, expected model ExplorationModel '
                'with id 1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_collection_commit_log_entry_model_failure(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        collection_models.CollectionCommitLogEntryModel.get_by_id(
            'collection-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'collection_commit_log_entry_ids field check of '
                'CollectionModel\', '
                '[u"Entity id 0: based on field '
                'collection_commit_log_entry_ids having value '
                'collection-0-1, expected model CollectionCommitLogEntryModel '
                'with id collection-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        collection_models.CollectionSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for collection_summary_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field collection_summary_ids '
                'having value 0, expected model CollectionSummaryModel with '
                'id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field collection_rights_ids having '
                'value 0, expected model CollectionRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        collection_models.CollectionSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model CollectionSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        collection_models.CollectionSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model CollectionSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            if collection.id != '0':
                collection_services.save_new_collection(
                    self.owner_id, collection)
            else:
                collection_services.save_new_collection(
                    self.user_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field collection_ids '
                'having value 0, expected model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_ids having value 0, expected model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection model '
                'version check of CollectionSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Collection model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated CollectionSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_collection_node',
        }, {
            'cmd': 'delete_collection_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node check of '
                'CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_collection_node\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'exploration_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node check of '
                'CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_collection_node\'} failed '
                'with error: The following required attributes are '
                'missing: exploration_id"]]'
            ), u'[u\'fully-validated CollectionSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field collection_ids '
                'having value 0, expected model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_ids having value 0, expected model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection model '
                'version check of CollectionSnapshotContentModel\', '
                '[u\'Entity id 0-3: Collection model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated CollectionSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionRightsModelValidatorTests, self).setUp()

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
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        rights_manager.assign_role_for_collection(
            self.owner, '0', self.editor_id, rights_domain.ROLE_EDITOR)

        rights_manager.assign_role_for_collection(
            self.owner, '2', self.viewer_id, rights_domain.ROLE_VIEWER)

        self.model_instance_0 = (
            collection_models.CollectionRightsModel.get_by_id('0'))
        self.model_instance_1 = (
            collection_models.CollectionRightsModel.get_by_id('1'))
        self.model_instance_2 = (
            collection_models.CollectionRightsModel.get_by_id('2'))

        self.job_class = (
            prod_validation_jobs_one_off.CollectionRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        rights_manager.publish_collection(self.owner, '0')
        expected_output = [
            u'[u\'fully-validated CollectionRightsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsModel\', '
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
        rights_manager.publish_collection(self.owner, '0')
        rights_manager.publish_collection(self.owner, '1')
        self.model_instance_0.first_published_msec = (
            self.model_instance_0.first_published_msec * 1000000.0)
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for first published msec check '
                'of CollectionRightsModel\', '
                '[u\'Entity id 0: The first_published_msec field has a '
                'value %s which is greater than the time when the job was '
                'run\']]'
            ) % (self.model_instance_0.first_published_msec),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field collection_ids having '
                'value 0, expected model CollectionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_collection(
            self.owner, '0', self.user_id, rights_domain.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model '
                'CollectionRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        collection_models.CollectionRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model '
                'CollectionRightsSnapshotContentModel with id 0-1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionRightsSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionRightsSnapshotMetadataModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            if collection.id != '0':
                collection_services.save_new_collection(
                    self.owner_id, collection)
            else:
                collection_services.save_new_collection(
                    self.user_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionRightsSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field collection_rights_ids '
                'having value 0, expected model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_rights_ids having value 0, expected model '
                'CollectionRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection rights model '
                'version check of CollectionRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: CollectionRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_collection_status',
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
                'change_collection_status check of '
                'CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation for '
                'command: {u\'old_status\': u\'public\', '
                'u\'cmd\': u\'change_collection_status\'} failed with error: '
                'The following required attributes are missing: '
                'new_status"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'release_ownership check of '
                'CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'release_ownership\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionRightsSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionRightsSnapshotContentModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionRightsSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotContentModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field collection_rights_ids '
                'having value 0, expected model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_rights_ids having value 0, expected model '
                'CollectionRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection rights model '
                'version check of CollectionRightsSnapshotContentModel\', '
                '[u\'Entity id 0-3: CollectionRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated CollectionRightsSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.rights_model_instance = (
            collection_models.CollectionCommitLogEntryModel(
                id='rights-1-1',
                user_id=self.owner_id,
                collection_id='1',
                commit_type='edit',
                commit_message='',
                commit_cmds=[],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_community_owned=False,
                post_commit_is_private=False))
        self.rights_model_instance.update_timestamps()
        self.rights_model_instance.put()

        self.model_instance_0 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-0-1'))
        self.model_instance_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-1-1'))
        self.model_instance_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        self.rights_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionCommitLogEntryModel\', '
                '[u"Entity id collection-0-1: based on field collection_ids '
                'having value 0, expected model CollectionModel with id 0 '
                'but it doesn\'t exist", u"Entity id collection-0-2: based '
                'on field collection_ids having value 0, expected model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionCommitLogEntryModel\', '
                '[u"Entity id rights-1-1: based on field '
                'collection_rights_ids having value 1, expected model '
                'CollectionRightsModel with id 1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.collection_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection model '
                'version check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Collection model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            collection_models.CollectionCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.collection_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'CollectionCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = (
            feconf.POST_COMMIT_STATUS_PUBLIC)
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                '%s but post_commit_is_private is True\']]'
            ) % (self.model_instance_0.id, feconf.POST_COMMIT_STATUS_PUBLIC),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = (
            feconf.POST_COMMIT_STATUS_PRIVATE)
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                '%s but post_commit_is_private is False\']]'
            ) % (self.model_instance_0.id, feconf.POST_COMMIT_STATUS_PRIVATE),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_collection_node'
        }, {
            'cmd': 'delete_collection_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node check of '
                'CollectionCommitLogEntryModel\', '
                '[u"Entity id collection-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_collection_node\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'exploration_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node check of CollectionCommitLogEntryModel\', '
                '[u"Entity id collection-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_collection_node\'} '
                'failed with error: The following required attributes '
                'are missing: exploration_id"]]'),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionSummaryModelValidatorTests, self).setUp()

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

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        language_codes = ['ar', 'en', 'en']
        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
            language_code=language_codes[i]
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection.tags = ['math', 'art']
            collection_services.save_new_collection(self.owner_id, collection)

        rights_manager.assign_role_for_collection(
            self.owner, '0', self.editor_id, rights_domain.ROLE_EDITOR)
        collection_services.update_collection(
            self.contributor_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')

        rights_manager.assign_role_for_collection(
            self.owner, '2', self.viewer_id, rights_domain.ROLE_VIEWER)

        self.model_instance_0 = (
            collection_models.CollectionSummaryModel.get_by_id('0'))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        self.model_instance_1 = (
            collection_models.CollectionSummaryModel.get_by_id('1'))
        self.model_instance_2 = (
            collection_models.CollectionSummaryModel.get_by_id('2'))

        self.job_class = (
            prod_validation_jobs_one_off.CollectionSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        rights_manager.publish_collection(self.owner, '0')
        collection_services.update_collection(
            self.owner_id, '1', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        collection_services.delete_collection(self.owner_id, '1')
        collection_services.delete_collection(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_model = collection_models.CollectionModel.get_by_id('0')
        collection_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.collection_model_last_updated = (
            collection_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field collection_ids having '
                'value 0, expected model CollectionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_collection(
            self.owner, '0', self.user_id, rights_domain.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_contributor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.contributor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for contributor_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field contributor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.contributor_id, self.contributor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
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
                'check of CollectionSummaryModel\', '
                '[u"Entity id 0: Contributor ids: [u\'%s\', u\'%s\'] do '
                'not match the contributor ids obtained using '
                'contributors summary: [u\'invalid\']"]]'
            ) % (sorted_contributor_ids[0], sorted_contributor_ids[1]),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_node_count(self):
        self.model_instance_0.node_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for node count check '
                'of CollectionSummaryModel\', '
                '[u"Entity id 0: Node count: 10 does not match the number '
                'of nodes in collection_contents dict: [{u\'exploration_id\': '
                'u\'0\'}, {u\'exploration_id\': u\'1\'}]"]]'
            ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_ratings(self):
        self.model_instance_0.ratings = {'1': 0, '2': 1}
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        self.model_instance_1.ratings = {}
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [(
            u'[u\'failed validation check for ratings check of '
            'CollectionSummaryModel\', '
            '[u"Entity id 0: Expected ratings for the entity to be empty '
            'but received {u\'1\': 0, u\'2\': 1}"]]'
        ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_collection_related_property(self):
        self.model_instance_0.title = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for title field check of '
                'CollectionSummaryModel\', '
                '[u\'Entity id %s: title field in entity: invalid does not '
                'match corresponding collection title field: New title\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_collection_rights_related_property(self):
        self.model_instance_0.status = 'public'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for status field check of '
                'CollectionSummaryModel\', '
                '[u\'Entity id %s: status field in entity: public does not '
                'match corresponding collection rights status field: '
                'private\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ConfigPropertyModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ConfigPropertyModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.model_instance = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.model_instance.commit(feconf.SYSTEM_COMMITTER_ID, [])

        self.csrf_model_instance = config_models.ConfigPropertyModel.get_by_id(
            'oppia_csrf_secret')

        self.job_class = (
            prod_validation_jobs_one_off.ConfigPropertyModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ConfigPropertyModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.commit(self.admin_id, [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ConfigPropertyModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated
                ),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete(self.admin_id, '', [{}])
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertyModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
            'config_model-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of ConfigPropertyModel\', '
                '[u"Entity id config_model: based on field '
                'snapshot_metadata_ids having '
                'value config_model-1, expected model '
                'ConfigPropertySnapshotMetadataModel '
                'with id config_model-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        config_models.ConfigPropertySnapshotContentModel.get_by_id(
            'config_model-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of ConfigPropertyModel\', '
                '[u"Entity id config_model: based on field '
                'snapshot_content_ids having '
                'value config_model-1, expected model '
                'ConfigPropertySnapshotContentModel '
                'with id config_model-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ConfigPropertySnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ConfigPropertySnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.config_model = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.config_model.commit(self.admin_id, [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                'config_model-1'))
        self.csrf_model_instance = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                'oppia_csrf_secret-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ConfigPropertySnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        self.config_model.commit(self.admin_id, [])
        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ConfigPropertySnapshotMetadataModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertySnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_config_property_model_failure(self):
        self.config_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for config_property_ids '
                'field check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: based on field '
                'config_property_ids having value config_model, '
                'expected model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Entity id config_model-2: based on field '
                'config_property_ids having value config_model, expected model '
                'ConfigPropertyModel with id config_model but it doesn\'t '
                'exist"]]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: based on field committer_ids '
                'having value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.admin_id, self.admin_id),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_config_property_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='config_model-3', committer_id=self.admin_id,
                commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for config property model '
                'version check of ConfigPropertySnapshotMetadataModel\', '
                '[u\'Entity id config_model-3: ConfigProperty model '
                'corresponding to id config_model has a version 1 '
                'which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance.commit_cmds = [{
            'cmd': 'change_property_value',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_property_value check of '
                'ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: Commit command domain '
                'validation for command: {u\'cmd\': '
                'u\'change_property_value\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'new_value, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ConfigPropertySnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ConfigPropertySnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.config_model = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.config_model.commit(self.admin_id, [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.ConfigPropertySnapshotContentModel.get_by_id(
                'config_model-1'))
        self.csrf_model_instance = (
            config_models.ConfigPropertySnapshotContentModel.get_by_id(
                'oppia_csrf_secret-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ConfigPropertySnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        self.config_model.commit(self.admin_id, [])
        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ConfigPropertySnapshotContentModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated
                ),
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertySnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_config_property_model_failure(self):
        self.config_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for config_property_ids '
                'field check of ConfigPropertySnapshotContentModel\', '
                '[u"Entity id config_model-1: based on field '
                'config_property_ids having value config_model, '
                'expected model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Entity id config_model-2: based on field '
                'config_property_ids having value config_model, expected model '
                'ConfigPropertyModel with id config_model but it '
                'doesn\'t exist"]]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_config_property_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.ConfigPropertySnapshotContentModel(
                id='config_model-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for config property model '
                'version check of ConfigPropertySnapshotContentModel\', '
                '[u\'Entity id config_model-3: ConfigProperty model '
                'corresponding to id config_model has a version 1 '
                'which is less than the version 3 in snapshot '
                'content model id\']]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SentEmailModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SentEmailModelValidatorTests, self).setUp()

        def mock_generate_hash(
                unused_cls, unused_recipient_id, unused_email_subject,
                unused_email_body):
            return 'Email Hash'

        self.sender_email = 'noreply@oppia.org'
        self.sender_id = 'sender'
        self.sender_model = user_models.UserSettingsModel(
            id=self.sender_id,
            email=self.sender_email)
        self.sender_model.update_timestamps()
        self.sender_model.put()

        self.recipient_email = 'recipient@email.com'
        self.recipient_id = 'recipient'
        self.recipient_model = user_models.UserSettingsModel(
            id=self.recipient_id,
            email=self.recipient_email)
        self.recipient_model.update_timestamps()
        self.recipient_model.put()

        with self.swap(
            email_models.SentEmailModel, '_generate_hash',
            types.MethodType(mock_generate_hash, email_models.SentEmailModel)):
            email_models.SentEmailModel.create(
                self.recipient_id, self.recipient_email, self.sender_id,
                self.sender_email, feconf.EMAIL_INTENT_SIGNUP,
                'Email Subject', 'Email Body', datetime.datetime.utcnow())

        self.model_instance = email_models.SentEmailModel.get_by_hash(
            'Email Hash')[0]

        self.job_class = (
            prod_validation_jobs_one_off.SentEmailModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated SentEmailModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SentEmailModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=20))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'SentEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'SentEmailModel\', '
            '[u"Entity id %s: based on field recipient_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_id, self.recipient_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_recipient_email(self):
        self.recipient_model.email = 'invalid@email.com'
        self.recipient_model.update_timestamps()
        self.recipient_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient email check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Recipient email %s in entity does not match '
            'with email %s of user obtained through recipient id %s\']]') % (
                self.model_instance.id, self.model_instance.recipient_email,
                self.recipient_model.email, self.model_instance.recipient_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_sent_datetime_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for sent datetime check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.SentEmailModel(
            id='invalid', recipient_id=self.recipient_id,
            recipient_email=self.recipient_email, sender_id=self.sender_id,
            sender_email='noreply@oppia.org', intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='Email Subject', html_body='Email Body',
            sent_datetime=datetime.datetime.utcnow())
        model_instance_with_invalid_id.update_timestamps()
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated SentEmailModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % 'invalid']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class BulkEmailModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BulkEmailModelValidatorTests, self).setUp()

        self.sender_email = 'sender@email.com'
        self.sender_id = 'sender'
        self.sender_model = user_models.UserSettingsModel(
            id=self.sender_id,
            email=self.sender_email)
        self.sender_model.update_timestamps()
        self.sender_model.put()

        self.recipient_ids = ['recipient1', 'recipient2']
        self.recipient_model_1 = user_models.UserSettingsModel(
            id=self.recipient_ids[0],
            email='recipient1@email.com')
        self.recipient_model_1.update_timestamps()
        self.recipient_model_1.put()
        self.recipient_model_2 = user_models.UserSettingsModel(
            id=self.recipient_ids[1],
            email='recipient2@email.com')
        self.recipient_model_2.update_timestamps()
        self.recipient_model_2.put()

        self.model_id = 'bulkemailid1'
        email_models.BulkEmailModel.create(
            self.model_id, self.recipient_ids, self.sender_id,
            self.sender_email, feconf.BULK_EMAIL_INTENT_MARKETING,
            'Email Subject', 'Email Body', datetime.datetime.utcnow())
        self.model_instance = email_models.BulkEmailModel.get_by_id(
            self.model_id)

        self.job_class = (
            prod_validation_jobs_one_off.BulkEmailModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated BulkEmailModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BulkEmailModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=20))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'BulkEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model_1.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'BulkEmailModel\', '
            '[u"Entity id %s: based on field recipient_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_ids[0],
                self.recipient_ids[0])]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_sender_email(self):
        self.sender_model.email = 'invalid@email.com'
        self.sender_model.update_timestamps()
        self.sender_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender email check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: Sender email %s in entity does not match with '
            'email %s of user obtained through sender id %s\']]') % (
                self.model_instance.id, self.model_instance.sender_email,
                self.sender_model.email, self.model_instance.sender_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_sent_datetime_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for sent datetime check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.BulkEmailModel(
            id='invalid:id', recipient_ids=self.recipient_ids,
            sender_id=self.sender_id, sender_email=self.sender_email,
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='Email Subject', html_body='Email Body',
            sent_datetime=datetime.datetime.utcnow())
        model_instance_with_invalid_id.update_timestamps()
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated BulkEmailModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_instance_with_invalid_id.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class GeneralFeedbackEmailReplyToIdModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(GeneralFeedbackEmailReplyToIdModelValidatorTests, self).setUp()

        self.thread_id = feedback_services.create_thread(
            'exploration', 'expid', None, 'a subject', 'some text')

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = (
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                self.user_id, self.thread_id))
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackEmailReplyToIdModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [(
            u'[u\'fully-validated GeneralFeedbackEmailReplyToIdModel\', 1]')]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [(
            u'[u\'failed validation check for item.id.user_id field check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u"Entity id %s: based on field item.id.user_id having value '
            '%s, expected model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.user_id, self.user_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_non_existent_thread_id(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [(
            u'[u\'failed validation check for item.id.thread_id field check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u"Entity id %s: based on field item.id.thread_id having value '
            '%s, expected model GeneralFeedbackThreadModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.thread_id, self.thread_id)]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_reply_to_id(self):
        while len(
                self.model_instance.reply_to_id) <= (
                    email_models.REPLY_TO_ID_LENGTH):
            self.model_instance.reply_to_id = (
                self.model_instance.reply_to_id + 'invalid')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for reply_to_id length check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Entity id %s: reply_to_id %s should have length less than or '
            'equal to %s but instead has length %s\']]'
        ) % (
            self.model_instance.id, self.model_instance.reply_to_id,
            email_models.REPLY_TO_ID_LENGTH,
            len(self.model_instance.reply_to_id))]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


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
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
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
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRightsModel\', '
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
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, '0',
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


class QuestionModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        misconceptions = [
            skill_domain.Misconception(
                0, 'name', '<p>notes</p>',
                '<p>default_feedback</p>', True),
            skill_domain.Misconception(
                1, 'name', '<p>notes</p>',
                '<p>default_feedback</p>', False)
        ]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i * 12,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill.misconceptions = misconceptions
            skill.next_misconception_id = 2
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2) * 12, '%s' % (i * 2 + 1) * 12]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = question_models.QuestionModel.get_by_id('0')
        self.model_instance_1 = question_models.QuestionModel.get_by_id('1')
        self.model_instance_2 = question_models.QuestionModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.QuestionModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')

        expected_output = [
            u'[u\'fully-validated QuestionModel\', 3]']
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
                'of QuestionModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'QuestionModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated QuestionModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_linked_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('111111111111').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for linked_skill_ids field '
                'check of QuestionModel\', '
                '[u"Entity id 0: based on field linked_skill_ids '
                'having value 111111111111, expected model SkillModel with id '
                '111111111111 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_question_commit_log_entry_model_failure(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        question_models.QuestionCommitLogEntryModel.get_by_id(
            'question-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'question_commit_log_entry_ids field check of '
                'QuestionModel\', '
                '[u"Entity id 0: based on field '
                'question_commit_log_entry_ids having value '
                'question-0-1, expected model QuestionCommitLogEntryModel '
                'with id question-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        question_models.QuestionSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for question_summary_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field question_summary_ids having '
                'value 0, expected model QuestionSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        question_models.QuestionSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model QuestionSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        question_models.QuestionSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model QuestionSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_inapplicable_skill_misconception_ids_invalid_skill_failure(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'inapplicable_skill_misconception_ids',
                'new_value': ['invalidskill-0'],
                'old_value': []
            })], 'Add invalid skill misconception id.')

        expected_output = [
            u'[u\'failed validation check for skill id of QuestionModel\','
            u' [u\'Entity id 0: skill with the following id does not exist: '
            u'invalidskill\']]',
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_inapplicable_skill_misconception_ids_invalid_id_failure(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'inapplicable_skill_misconception_ids',
                'new_value': ['000000000000-99'],
                'old_value': []
            })], 'Add invalid skill misconception id.')

        expected_output = [
            u'[u\'failed validation check for misconception id of '
            u'QuestionModel\', [u\'Entity id 0: misconception with '
            u'the id 99 does not exist in the skill with id 000000000000\']]',
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_inapplicable_skill_misconception_ids_validation_success(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'inapplicable_skill_misconception_ids',
                'new_value': ['000000000000-0', '000000000000-1'],
                'old_value': []
            })], 'Add invalid skill misconception id.')

        expected_output = [
            u'[u\'fully-validated QuestionModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class QuestionSkillLinkModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSkillLinkModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(3)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (2 - i)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionSkillLinkModel(
                id='0:2', question_id='0', skill_id='2', skill_difficulty=0.5))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        self.model_instance_1 = (
            question_models.QuestionSkillLinkModel(
                id='1:1', question_id='1', skill_id='1', skill_difficulty=0.5))
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        self.model_instance_2 = (
            question_models.QuestionSkillLinkModel(
                id='2:0', question_id='2', skill_id='0', skill_difficulty=0.5))
        self.model_instance_2.update_timestamps()
        self.model_instance_2.put()

        self.job_class = (
            prod_validation_jobs_one_off.QuestionSkillLinkModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated QuestionSkillLinkModel\', 3]']
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
                'of QuestionSkillLinkModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSkillLinkModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of QuestionSkillLinkModel\', '
                '[u"Entity id 0:2: based on field skill_ids '
                'having value 2, expected model SkillModel with id 2 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'question_ids field check of QuestionSkillLinkModel\', '
                '[u"Entity id 0:2: based on field '
                'question_ids having value 0, expected model QuestionModel '
                'with id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id_failure(self):
        model_with_invalid_id = question_models.QuestionSkillLinkModel(
            id='0:1', question_id='1', skill_id='2', skill_difficulty=0.5)
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'QuestionSkillLinkModel\', [u\'Entity id 0:1: Entity id '
                'does not match regex pattern\']]'
            ), u'[u\'fully-validated QuestionSkillLinkModel\', 3]']
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


class QuestionSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            if index == 0:
                question_services.create_new_question(
                    self.user_id, question, 'test question')
            else:
                question_services.create_new_question(
                    self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .QuestionSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of QuestionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field question_ids '
                'having value 0, expected model QuestionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'question_ids having value 0, expected model '
                'QuestionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for question model '
                'version check of QuestionSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Question model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated QuestionSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'update_question_property'
        }, {
            'cmd': 'create_new_fully_specified_question',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'create_new_fully_specified_question check of '
                'QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': '
                'u\'create_new_fully_specified_question\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'question_dict, skill_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'update_question_property check of '
                'QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'update_question_property\'} '
                'failed with error: The following required attributes '
                'are missing: new_value, old_value, property_name"]]'
            ), u'[u\'fully-validated QuestionSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class QuestionSnapshotContentModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            question_models.QuestionSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            question_models.QuestionSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .QuestionSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of QuestionSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field question_ids '
                'having value 0, expected model QuestionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'question_ids having value 0, expected model '
                'QuestionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for question model '
                'version check of QuestionSnapshotContentModel\', '
                '[u\'Entity id 0-3: Question model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated QuestionSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class QuestionCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-0-1'))
        self.model_instance_1 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-1-1'))
        self.model_instance_2 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .QuestionCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of QuestionCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids field '
                'check of QuestionCommitLogEntryModel\', '
                '[u"Entity id question-0-1: based on field question_ids '
                'having value 0, expected model QuestionModel with id '
                '0 but it doesn\'t exist", u"Entity id question-0-2: '
                'based on field question_ids having value 0, expected '
                'model QuestionModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.question_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for question model '
                'version check of QuestionCommitLogEntryModel\', '
                '[u\'Entity id %s: Question model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            question_models.QuestionCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.question_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'QuestionCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'QuestionCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_private_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Post commit status private '
                'is invalid\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'update_question_property'
        }, {
            'cmd': 'create_new_fully_specified_question',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'create_new_fully_specified_question check of '
                'QuestionCommitLogEntryModel\', '
                '[u"Entity id question-0-1: Commit command domain '
                'validation for command: {u\'cmd\': '
                'u\'create_new_fully_specified_question\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with '
                'error: The following required attributes are '
                'missing: question_dict, skill_id, The following '
                'extra attributes are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'update_question_property check of '
                'QuestionCommitLogEntryModel\', [u"Entity id '
                'question-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'update_question_property\'} '
                'failed with error: The following required attributes '
                'are missing: new_value, old_value, property_name"]]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class QuestionSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question.question_state_data.content.html = '<p>Test</p>'
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = question_models.QuestionSummaryModel.get_by_id(
            '0')
        self.model_instance_1 = question_models.QuestionSummaryModel.get_by_id(
            '1')
        self.model_instance_2 = question_models.QuestionSummaryModel.get_by_id(
            '2')

        self.job_class = (
            prod_validation_jobs_one_off.QuestionSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionSummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of QuestionSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        question_services.delete_question(self.owner_id, '1')
        question_services.delete_question(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_model = question_models.QuestionModel.get_by_id('0')
        question_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.question_model_last_updated = (
            question_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSummaryModel\', '
                '[u"Entity id 0: based on field question_ids having '
                'value 0, expected model QuestionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_content(self):
        self.model_instance_0.question_content = '<p>invalid</p>'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question content check '
                'of QuestionSummaryModel\', [u\'Entity id 0: Question '
                'content: <p>invalid</p> does not match content html '
                'in question state data in question model: <p>Test</p>\']]'
            ), u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_related_property(self):
        mock_time = datetime.datetime.utcnow() - datetime.timedelta(
            days=2)
        actual_time = self.model_instance_0.question_model_created_on
        self.model_instance_0.question_model_created_on = mock_time
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question_model_created_on '
                'field check of QuestionSummaryModel\', '
                '[u\'Entity id %s: question_model_created_on field in '
                'entity: %s does not match corresponding question '
                'created_on field: %s\']]'
            ) % (self.model_instance_0.id, mock_time, actual_time),
            u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


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
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
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


class GeneralSuggestionModelValidatorTests(test_utils.AuditJobsTestBase):
    def setUp(self):
        super(GeneralSuggestionModelValidatorTests, self).setUp()

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

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': 'new suggestion content'
        }

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'description',
            'suggestion', has_suggestion=True)

        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER + exp.category)

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, '0',
            1, suggestion_models.STATUS_ACCEPTED, self.owner_id,
            self.admin_id, change, score_category, self.thread_id, None)
        self.model_instance = (
            suggestion_models.GeneralSuggestionModel.get_by_id(self.thread_id))

        self.job_class = (
            prod_validation_jobs_one_off.GeneralSuggestionModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralSuggestionModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralSuggestionModel\', '
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
            'GeneralSuggestionModel\', '
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
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_feedback_thread_model_failure(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for feedback_thread_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field feedback_thread_ids having '
                'value %s, expected model GeneralFeedbackThreadModel with id '
                '%s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_reviewer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for reviewer_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field reviewer_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.admin_id, self.admin_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_target_version(self):
        self.model_instance.target_version_at_submission = 5
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for target version at submission'
                ' check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'target version 5 in entity is greater than the '
                'version 1 of exploration corresponding to id 0\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_empty_final_reviewer_id(self):
        self.model_instance.final_reviewer_id = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final reviewer '
                'check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'Final reviewer id is empty but suggestion is accepted\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_final_reviewer_id_format(self):
        self.model_instance.final_reviewer_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                '[u\'failed validation check for domain object check of '
                'GeneralSuggestionModel\', [u\'Entity id %s: '
                'Entity fails domain validation with the error Expected '
                'final_reviewer_id to be in a valid user ID format, '
                'received %s\']]'
            ) % (self.model_instance.id, self.model_instance.final_reviewer_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_non_empty_final_reviewer_id(self):
        self.model_instance.status = suggestion_models.STATUS_IN_REVIEW
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final reviewer '
                'check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'Final reviewer id %s is not empty but '
                'suggestion is in review\']]'
            ) % (self.model_instance.id, self.admin_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_author_id_format(self):
        self.model_instance.author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                '[u\'failed validation check for domain object check of '
                'GeneralSuggestionModel\', [u\'Entity id %s: '
                'Entity fails domain validation with the error Expected '
                'author_id to be in a valid user ID format, received %s\']]'
            ) % (self.model_instance.id, self.model_instance.author_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_schema(self):
        self.model_instance.score_category = 'invalid.Art'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check '
                'of GeneralSuggestionModel\', [u\'Entity id %s: Entity '
                'fails domain validation with the error Expected the first '
                'part of score_category to be among allowed choices, '
                'received invalid\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_target_type(self):
        expected_output = [
            (
                u'[u\'failed validation check for target type check '
                'of GeneralSuggestionModel\', [u\'Entity id %s: Target '
                'type exploration is not allowed\']]'
            ) % self.model_instance.id]
        with self.swap(
            prod_validators, 'TARGET_TYPE_TO_TARGET_MODEL', {}):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_validate_score_category_for_content_suggestion(self):
        self.model_instance.score_category = 'content.invalid'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for score category subtype check of '
            'GeneralSuggestionModel\', [u\'Entity id %s: score category sub in'
            'valid does not match target exploration category Art\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_validate_score_category_for_transalation_suggestion(self):
        change = {
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '<p>This is a content.</p>',
            'translation_html': '<p>This is translated html.</p>'
        }
        score_category = (
            suggestion_models.SCORE_TYPE_TRANSLATION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + 'invalid')

        thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'description',
            'suggestion', has_suggestion=True)

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, '0',
            1, suggestion_models.STATUS_ACCEPTED, self.owner_id,
            self.admin_id, change, score_category, thread_id, 'hi')
        model_instance = (
            suggestion_models.GeneralSuggestionModel.get_by_id(thread_id))
        expected_output = [((
            u'[u\'failed validation check for score category subtype check of '
            'GeneralSuggestionModel\', [u\'Entity id %s: score category sub in'
            'valid does not match target exploration category Art\']]') % (
                model_instance.id)),
                           u'[u\'fully-validated GeneralSuggestionModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_validate_score_category_for_question_suggestion(self):
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            '0', 'skill_description', rubrics)
        skill_services.save_new_skill(self.owner_id, skill)

        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['0'],
                'inapplicable_skill_misconception_ids': ['skillid12345-0']
            },
            'skill_id': '0',
            'skill_difficulty': 0.3,
        }

        score_category = (
            suggestion_models.SCORE_TYPE_QUESTION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + 'invalid_sub_category')

        thread_id = feedback_services.create_thread(
            'skill', '0', self.owner_id, 'description',
            'suggestion', has_suggestion=True)

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            suggestion_models.TARGET_TYPE_SKILL, '0',
            1, suggestion_models.STATUS_ACCEPTED, self.owner_id,
            self.admin_id, change, score_category, thread_id, 'en')
        model_instance = (
            suggestion_models.GeneralSuggestionModel.get_by_id(thread_id))
        expected_output = [(
            u'[u\'failed validation check for score category check of '
            'GeneralSuggestionModel\', [u\'Entity id %s: Score category'
            ' question.invalid_sub_category is invalid\']]') % (
                model_instance.id),
                           u'[u\'fully-validated GeneralSuggestionModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class GeneralVoiceoverApplicationModelValidatorTests(
        test_utils.AuditJobsTestBase):
    def setUp(self):
        super(GeneralVoiceoverApplicationModelValidatorTests, self).setUp()
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

        suggestion_models.GeneralVoiceoverApplicationModel(
            id='valid_id',
            target_type=suggestion_models.TARGET_TYPE_EXPLORATION,
            target_id='0',
            status=suggestion_models.STATUS_ACCEPTED,
            author_id=self.owner_id,
            final_reviewer_id=self.admin_id,
            language_code='en',
            filename='audio.mp3',
            content='<p>Text to voiceover</p>',
            rejection_message=None).put()
        self.model_instance = (
            suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
                'valid_id'))

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralVoiceoverApplicationModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralVoiceoverApplicationModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralVoiceoverApplicationModel\', '
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
            'GeneralVoiceoverApplicationModel\', '
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
                'check of GeneralVoiceoverApplicationModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralVoiceoverApplicationModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_final_reviewer_id_format(self):
        self.model_instance.final_reviewer_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                '[u\'failed validation check for final reviewer check of '
                'GeneralVoiceoverApplicationModel\', [u\'Entity id %s: '
                'Final reviewer ID %s is in a wrong format. It should be '
                'either pid_<32 chars> or uid_<32 chars>.\']]'
            ) % (self.model_instance.id, self.model_instance.final_reviewer_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_author_id_format(self):
        self.model_instance.author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                '[u\'failed validation check for final author check of '
                'GeneralVoiceoverApplicationModel\', [u\'Entity id %s: '
                'Author ID %s is in a wrong format. It should be either '
                'pid_<32 chars> or uid_<32 chars>.\']]'
            ) % (self.model_instance.id, self.model_instance.author_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_reviewer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for final_reviewer_ids field '
                'check of GeneralVoiceoverApplicationModel\', '
                '[u"Entity id %s: based on field final_reviewer_ids having '
                'value %s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.admin_id, self.admin_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_object_validation_failure(self):
        expected_output = [
            u'[u\'failed validation check for domain object check of '
            'GeneralVoiceoverApplicationModel\', '
            '[u\'Entity id valid_id: Entity fails domain validation with '
            'the error Invalid language_code: en\']]']
        mock_supported_audio_languages = [{
            'id': 'ar',
            'description': 'Arabic',
            'relatedLanguages': ['ar']
            }]
        with self.swap(
            constants, 'SUPPORTED_AUDIO_LANGUAGES',
            mock_supported_audio_languages):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)


class CommunityContributionStatsModelValidatorTests(
        test_utils.AuditJobsTestBase):

    target_id = 'exp1'
    skill_id = 'skill1'
    target_version_at_submission = 1
    exploration_category = 'Algebra'
    AUTHOR_EMAIL = 'author@example.com'
    AUTHOR_USERNAME = 'author'
    REVIEWER_EMAIL = 'reviewer@community.org'
    REVIEWER_USERNAME = 'reviewer'
    EXPLORATION_THREAD_ID = 'exploration.exp1.thread_1'
    SKILL_THREAD_ID = 'skill1.thread1'
    change_cmd = {}

    negative_count = -1
    non_integer_count = 'non_integer_count'
    sample_language_code = 'hi'
    invalid_language_code = 'invalid'

    def _create_model_for_translation_suggestion_with_language_code(
            self, language_code):
        """Creates a GeneralSuggestionModel for a translation suggestion in the
        given language_code.
        """
        score_category = '%s%s%s' % (
            suggestion_models.SCORE_TYPE_TRANSLATION,
            suggestion_models.SCORE_CATEGORY_DELIMITER,
            self.exploration_category
        )

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, self.author_id,
            self.reviewer_id, self.change_cmd, score_category,
            self.EXPLORATION_THREAD_ID, language_code)

    def _create_model_for_question_suggestion(self):
        """Creates a GeneralSuggestionModel for a question suggestion."""
        score_category = '%s%s%s' % (
            suggestion_models.SCORE_TYPE_QUESTION,
            suggestion_models.SCORE_CATEGORY_DELIMITER,
            self.target_id
        )

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            suggestion_models.TARGET_TYPE_SKILL,
            self.skill_id, self.target_version_at_submission,
            suggestion_models.STATUS_IN_REVIEW, self.author_id,
            self.reviewer_id, self.change_cmd, score_category,
            self.SKILL_THREAD_ID, 'en')

    def setUp(self):
        super(CommunityContributionStatsModelValidatorTests, self).setUp()

        self.signup(
            self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(
            self.REVIEWER_EMAIL, self.REVIEWER_USERNAME)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

        self.job_class = (
            prod_validation_jobs_one_off
            .CommunityContributionStatsModelAuditOneOffJob
        )

    def test_model_validation_success_when_no_model_has_been_created(self):
        expected_output = []

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_validation_success_when_model_has_non_zero_counts(self):
        user_models.UserContributionRightsModel(
            id=self.reviewer_id,
            can_review_translation_for_language_codes=['hi'],
            can_review_voiceover_for_language_codes=[],
            can_review_questions=True).put()
        self._create_model_for_translation_suggestion_with_language_code('hi')
        self._create_model_for_question_suggestion()
        translation_reviewer_counts_by_lang_code = {
            'hi': 1
        }
        translation_suggestion_counts_by_lang_code = {
            'hi': 1
        }
        question_reviewer_count = 1
        question_suggestion_count = 1

        suggestion_models.CommunityContributionStatsModel(
            id=suggestion_models.COMMUNITY_CONTRIBUTION_STATS_MODEL_ID,
            translation_reviewer_counts_by_lang_code=(
                translation_reviewer_counts_by_lang_code),
            translation_suggestion_counts_by_lang_code=(
                translation_suggestion_counts_by_lang_code),
            question_reviewer_count=question_reviewer_count,
            question_suggestion_count=question_suggestion_count
        ).put()
        expected_output = [(
            u'[u\'fully-validated CommunityContributionStatsModel\', 1]')]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_validation_success_when_model_has_default_values(self):
        suggestion_models.CommunityContributionStatsModel(
            id=suggestion_models.COMMUNITY_CONTRIBUTION_STATS_MODEL_ID,
            translation_reviewer_counts_by_lang_code={},
            translation_suggestion_counts_by_lang_code={},
            question_reviewer_count=0,
            question_suggestion_count=0
        ).put()
        expected_output = [
            u'[u\'fully-validated CommunityContributionStatsModel\', 1]'
        ]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_validation_fails_with_invalid_model_id(self):
        suggestion_models.CommunityContributionStatsModel(
            id='invalid_id',
            translation_reviewer_counts_by_lang_code={},
            translation_suggestion_counts_by_lang_code={},
            question_reviewer_count=0,
            question_suggestion_count=0
        ).put()

        expected_output = [
            u'[u\'failed validation check for model id check of '
            'CommunityContributionStatsModel\', '
            '[u\'Entity id invalid_id: Entity id does not match regex '
            'pattern\']]'
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_for_negative_translation_reviewer_counts(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_reviewer_counts_by_lang_code = {
            self.sample_language_code: self.negative_count}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for translation reviewer count check '
            'of CommunityContributionStatsModel\', [u\'Entity id %s: '
            'Translation reviewer count for language code %s: %s does not '
            'match the expected translation reviewer count for language code '
            '%s: 0\']]' % (
                stats_model.id, self.sample_language_code,
                stats_model.translation_reviewer_counts_by_lang_code[
                    self.sample_language_code], self.sample_language_code),

            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Expected the translation '
            'reviewer count to be non-negative for %s language code, '
            'received: %s.\']]' % (
                stats_model.id,
                self.sample_language_code,
                stats_model.translation_reviewer_counts_by_lang_code[
                    self.sample_language_code])
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_for_negative_translation_suggestion_counts(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_suggestion_counts_by_lang_code = {
            self.sample_language_code: self.negative_count}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for translation suggestion count '
            'check of CommunityContributionStatsModel\', [u\'Entity id %s: '
            'Translation suggestion count for language code %s: %s does not '
            'match the expected translation suggestion count for language code '
            '%s: 0\']]' % (
                stats_model.id, self.sample_language_code,
                stats_model.translation_suggestion_counts_by_lang_code[
                    self.sample_language_code], self.sample_language_code),

            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Expected the translation '
            'suggestion count to be non-negative for %s language code, '
            'received: %s.\']]' % (
                stats_model.id,
                self.sample_language_code,
                stats_model.translation_suggestion_counts_by_lang_code[
                    self.sample_language_code])
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_for_negative_question_reviewer_count(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.question_reviewer_count = self.negative_count
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for question reviewer count check '
            'of CommunityContributionStatsModel\', [u\'Entity id %s: Question '
            'reviewer count: %s does not match the expected question '
            'reviewer count: 0.\']]' % (
                stats_model.id, stats_model.question_reviewer_count),

            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Expected the '
            'question reviewer count to be non-negative, received: %s.\']]' % (
                stats_model.id, stats_model.question_reviewer_count)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_for_negative_question_suggestion_count(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.question_suggestion_count = self.negative_count
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for question suggestion count check '
            'of CommunityContributionStatsModel\', [u\'Entity id %s: Question '
            'suggestion count: %s does not match the expected question '
            'suggestion count: 0.\']]' % (
                stats_model.id, stats_model.question_suggestion_count),

            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Expected the '
            'question suggestion count to be non-negative, received: '
            '%s.\']]' % (
                stats_model.id, stats_model.question_suggestion_count)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_for_non_integer_translation_reviewer_counts(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_reviewer_counts_by_lang_code = {
            self.sample_language_code: self.non_integer_count}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for translation reviewer count check '
            'of CommunityContributionStatsModel\', [u\'Entity id %s: '
            'Translation reviewer count for language code %s: %s does not '
            'match the expected translation reviewer count for language code '
            '%s: 0\']]' % (
                stats_model.id, self.sample_language_code,
                stats_model.translation_reviewer_counts_by_lang_code[
                    self.sample_language_code], self.sample_language_code),

            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Expected the translation '
            'reviewer count to be an integer for %s language code, '
            'received: %s.\']]' % (
                stats_model.id,
                self.sample_language_code,
                stats_model.translation_reviewer_counts_by_lang_code[
                    self.sample_language_code])
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_if_non_integer_translation_suggestion_count(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_suggestion_counts_by_lang_code = {
            self.sample_language_code: self.non_integer_count}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for translation suggestion count '
            'check of CommunityContributionStatsModel\', [u\'Entity id %s: '
            'Translation suggestion count for language code %s: %s does not '
            'match the expected translation suggestion count for language code '
            '%s: 0\']]' % (
                stats_model.id, self.sample_language_code,
                stats_model.translation_suggestion_counts_by_lang_code[
                    self.sample_language_code], self.sample_language_code),

            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Expected the translation '
            'suggestion count to be an integer for %s language code, '
            'received: %s.\']]' % (
                stats_model.id,
                self.sample_language_code,
                stats_model.translation_suggestion_counts_by_lang_code[
                    self.sample_language_code])
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_if_translation_suggestion_counts_dont_match(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_suggestion_counts_by_lang_code = {
            self.sample_language_code: 1}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for translation suggestion count '
            'check of CommunityContributionStatsModel\', [u\'Entity id %s: '
            'Translation suggestion count for language code %s: %s does not '
            'match the expected translation suggestion count for language code '
            '%s: 0\']]' % (
                stats_model.id, self.sample_language_code,
                stats_model.translation_suggestion_counts_by_lang_code[
                    self.sample_language_code], self.sample_language_code)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_if_translation_reviewer_counts_dont_match(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_reviewer_counts_by_lang_code = {
            self.sample_language_code: 1}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for translation reviewer count '
            'check of CommunityContributionStatsModel\', [u\'Entity id %s: '
            'Translation reviewer count for language code %s: %s does not '
            'match the expected translation reviewer count for language code '
            '%s: 0\']]' % (
                stats_model.id, self.sample_language_code,
                stats_model.translation_reviewer_counts_by_lang_code[
                    self.sample_language_code], self.sample_language_code)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_if_question_reviewer_count_does_not_match(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.question_reviewer_count = 1
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for question reviewer count check '
            'of CommunityContributionStatsModel\', [u\'Entity id %s: Question '
            'reviewer count: %s does not match the expected question '
            'reviewer count: 0.\']]' % (
                stats_model.id, stats_model.question_reviewer_count)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_if_question_suggestion_count_does_not_match(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.question_suggestion_count = 1
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for question suggestion count check '
            'of CommunityContributionStatsModel\', [u\'Entity id %s: Question '
            'suggestion count: %s does not match the expected question '
            'suggestion count: 0.\']]' % (
                stats_model.id, stats_model.question_suggestion_count)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_if_translation_suggestion_lang_not_in_dict(
            self):
        missing_language_code = 'hi'
        self._create_model_for_translation_suggestion_with_language_code(
            missing_language_code)
        stats_model = suggestion_models.CommunityContributionStatsModel.get()

        expected_output = [
            u'[u\'failed validation check for translation suggestion count '
            'field check of CommunityContributionStatsModel\', [u"Entity id '
            '%s: The translation suggestion count for language code %s is 1, '
            'expected model CommunityContributionStatsModel to have the '
            'language code %s in its translation suggestion counts but it '
            'doesn\'t exist."]]' % (
                stats_model.id, missing_language_code, missing_language_code)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_if_translation_reviewer_lang_not_in_dict(
            self):
        missing_language_code = 'hi'
        user_models.UserContributionRightsModel(
            id=self.reviewer_id,
            can_review_translation_for_language_codes=[missing_language_code],
            can_review_voiceover_for_language_codes=[],
            can_review_questions=False).put()
        stats_model = suggestion_models.CommunityContributionStatsModel.get()

        expected_output = [
            u'[u\'failed validation check for translation reviewer count '
            'field check of CommunityContributionStatsModel\', [u"Entity id '
            '%s: The translation reviewer count for language code %s is 1, '
            'expected model CommunityContributionStatsModel to have the '
            'language code %s in its translation reviewer counts but it '
            'doesn\'t exist."]]' % (
                stats_model.id, missing_language_code, missing_language_code)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_for_invalid_lang_code_in_reviewer_counts(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_reviewer_counts_by_lang_code = {
            self.invalid_language_code: 1}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Invalid language code for '
            'the translation reviewer counts: %s.\']]' % (
                stats_model.id, self.invalid_language_code)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_fails_for_invalid_lang_code_in_suggestion_counts(
            self):
        stats_model = suggestion_models.CommunityContributionStatsModel.get()
        stats_model.translation_suggestion_counts_by_lang_code = {
            self.invalid_language_code: 1}
        stats_model.update_timestamps()
        stats_model.put()
        expected_output = [
            u'[u\'failed validation check for domain object check of '
            'CommunityContributionStatsModel\', [u\'Entity id %s: Entity '
            'fails domain validation with the error Invalid language code for '
            'the translation suggestion counts: %s.\']]' % (
                stats_model.id, self.invalid_language_code)
        ]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'Topic%s' % i,
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
                '%s' % i,
                'skill%s' % i, rubrics)
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

        self.model_instance_0 = topic_models.TopicModel.get_by_id('0')
        self.model_instance_1 = topic_models.TopicModel.get_by_id('1')
        self.model_instance_2 = topic_models.TopicModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.TopicModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')

        expected_output = [
            u'[u\'fully-validated TopicModel\', 3]']
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
                'of TopicModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_topic_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'TopicModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated TopicModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_private_topic_with_missing_thumbnail_filename(self):
        expected_output = [
            u'[u\'fully-validated TopicModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_topic_with_missing_thumbnail_filename(self):
        topic_rights = topic_fetchers.get_topic_rights('0', strict=False)
        topic_rights.topic_is_published = True
        commit_cmds = [topic_domain.TopicRightsChange({
            'cmd': topic_domain.CMD_PUBLISH_TOPIC
        })]
        topic_services.save_topic_rights(
            topic_rights, self.owner_id, 'Published the topic', commit_cmds)

        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'TopicModel\', [u\'Entity id 0: Entity fails '
                'domain validation with the error Expected thumbnail filename '
                'to be a string, received None.\']]'
            ),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for story_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field story_ids having value '
                '1, expected model StoryModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field skill_ids having value '
                '1, expected model SkillModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field subtopic_page_ids having value '
                '0-1, expected model SubtopicPageModel with id 0-1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_topic_commit_log_entry_model_failure(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        topic_models.TopicCommitLogEntryModel.get_by_id(
            'topic-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'topic_commit_log_entry_ids field check of '
                'TopicModel\', '
                '[u"Entity id 0: based on field '
                'topic_commit_log_entry_ids having value '
                'topic-0-1, expected model TopicCommitLogEntryModel '
                'with id topic-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        topic_models.TopicSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for topic_summary_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field topic_summary_ids having '
                'value 0, expected model TopicSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field topic_rights_ids having '
                'value 0, expected model TopicRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        topic_models.TopicSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model TopicSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        topic_models.TopicSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model TopicSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_repeated_name(self):
        self.model_instance_0.name = 'Topic1'
        self.model_instance_0.canonical_name = 'topic1'
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for unique name check '
                'of TopicModel\', [u"Entity id 0: canonical name topic1 '
                'matches with canonical name of topic models with ids '
                '[\'1\']", u"Entity id 1: canonical name topic1 matches '
                'with canonical name of topic models with ids [\'0\']"]]'
            ), u'[u\'fully-validated TopicModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_model_with_canonical_name_not_matching_name_in_lowercase(self):
        self.model_instance_0.name = 'invalid'
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for canonical name check '
                'of TopicModel\', '
                '[u\'Entity id 0: Entity name invalid in lowercase does '
                'not match canonical name topic0\']]'
            ), u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_uncategorized_skill_id_in_subtopic(self):
        self.model_instance_0.uncategorized_skill_ids = ['0', '6']
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for uncategorized skill '
                'id check of TopicModel\', '
                '[u\'Entity id 0: uncategorized skill id 0 is present '
                'in subtopic for entity with id 1\']]'
            ), u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicSnapshotMetadataModelValidatorTests, self).setUp()
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
                '%s' % i,
                'skill%s' % i, rubrics)
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
            if index == 0:
                topic_services.save_new_topic(self.user_id, topic)
            else:
                topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field topic_ids '
                'having value 0, expected model TopicModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_ids having value 0, expected model '
                'TopicModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic model '
                'version check of TopicSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Topic model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated TopicSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_subtopic'
        }, {
            'cmd': 'delete_subtopic',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_subtopic check of '
                'TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_subtopic\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'subtopic_id, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd add_subtopic '
                'check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_subtopic\'} '
                'failed with error: The following required attributes '
                'are missing: subtopic_id, title"]]'
            ), u'[u\'fully-validated TopicSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicSnapshotContentModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicSnapshotContentModelValidatorTests, self).setUp()

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

        self.model_instance_0 = (
            topic_models.TopicSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field topic_ids '
                'having value 0, expected model TopicModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_ids having value 0, expected model '
                'TopicModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic model '
                'version check of TopicSnapshotContentModel\', '
                '[u\'Entity id 0-3: Topic model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated TopicSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicRightsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        manager1_email = 'user@manager1.com'
        manager2_email = 'user@manager2.com'

        self.signup(manager1_email, 'manager1')
        self.signup(manager2_email, 'manager2')

        self.set_topic_managers(['manager1', 'manager2'])

        self.manager1_id = self.get_user_id_from_email(manager1_email)
        self.manager2_id = self.get_user_id_from_email(manager2_email)

        self.manager1 = user_services.UserActionsInfo(self.manager1_id)
        self.manager2 = user_services.UserActionsInfo(self.manager2_id)

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

        topic_services.assign_role(
            self.admin, self.manager1, topic_domain.ROLE_MANAGER, '0')
        topic_services.assign_role(
            self.admin, self.manager2, topic_domain.ROLE_MANAGER, '1')

        self.model_instance_0 = topic_models.TopicRightsModel.get_by_id('0')
        self.model_instance_1 = topic_models.TopicRightsModel.get_by_id('1')
        self.model_instance_2 = topic_models.TopicRightsModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.TopicRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TopicRightsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field topic_ids having '
                'value 0, expected model TopicModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_manager_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.manager1_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for manager_user_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field manager_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.manager1_id, self.manager1_id),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model '
                'TopicRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        topic_models.TopicRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model TopicRightsSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicRightsSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicRightsSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

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
            if index == 0:
                topic_services.save_new_topic(self.user_id, topic)
            else:
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
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicRightsSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TopicRightsSnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field topic_rights_ids '
                'having value 0, expected model TopicRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_rights_ids having value 0, expected model '
                'TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic rights model '
                'version check of TopicRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: TopicRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_role',
            'assignee_id': 'id',
            'new_role': 'manager'
        }, {
            'cmd': 'publish_topic',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_role check of '
                'TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'assignee_id\': u\'id\', '
                'u\'cmd\': u\'change_role\', u\'new_role\': u\'manager\'} '
                'failed with error: The following required attributes '
                'are missing: old_role"]]'
            ), (
                u'[u\'failed validation check for commit cmd publish_topic '
                'check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'publish_topic\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), u'[u\'fully-validated TopicRightsSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicRightsSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicRightsSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

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
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicRightsSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TopicRightsSnapshotContentModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field topic_rights_ids '
                'having value 0, expected model TopicRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_rights_ids having value 0, expected model '
                'TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic rights model '
                'version check of TopicRightsSnapshotContentModel\', '
                '[u\'Entity id 0-3: TopicRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated TopicRightsSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

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
            if index == 0:
                topic_services.save_new_topic(self.user_id, topic)
            else:
                topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-0-1'))
        self.model_instance_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-1-1'))
        self.model_instance_2 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-2-1'))
        self.rights_model_instance_0 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-0-1'))
        self.rights_model_instance_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-1-1'))
        self.rights_model_instance_2 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicCommitLogEntryModel\', 7]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        self.rights_model_instance_0.delete()
        self.rights_model_instance_1.delete()
        self.rights_model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field check '
                'of TopicCommitLogEntryModel\', '
                '[u"Entity id rights-0-1: based on field topic_ids '
                'having value 0, expected model TopicModel with id 0 '
                'but it doesn\'t exist", u"Entity id topic-0-1: '
                'based on field topic_ids having value 0, expected model '
                'TopicModel with id 0 but it doesn\'t exist", '
                'u"Entity id topic-0-2: based on field topic_ids having '
                'value 0, expected model TopicModel with id 0 but '
                'it doesn\'t exist"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids field '
                'check of TopicCommitLogEntryModel\', '
                '[u"Entity id rights-0-1: based on field topic_rights_ids '
                'having value 0, expected model TopicRightsModel with id 0 '
                'but it doesn\'t exist", u"Entity id rights-0-2: based '
                'on field topic_rights_ids having value 0, expected '
                'model TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.topic_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic model '
                'version check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Topic model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated TopicCommitLogEntryModel\', 6]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            topic_models.TopicCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.topic_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'TopicCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated TopicCommitLogEntryModel\', 6]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'TopicCommitLogEntryModel\', '
                '[u\'Entity id topic-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of TopicCommitLogEntryModel\', '
                '[u\'Entity id topic-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
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
                'check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
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
                'check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_subtopic'
        }, {
            'cmd': 'delete_subtopic',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_subtopic check of '
                'TopicCommitLogEntryModel\', '
                '[u"Entity id topic-0-1: Commit command domain '
                'validation for command: {u\'cmd\': u\'delete_subtopic\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: subtopic_id, '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_subtopic check of TopicCommitLogEntryModel\', '
                '[u"Entity id topic-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_subtopic\'} '
                'failed with error: The following required attributes '
                'are missing: subtopic_id, title"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicSummaryModelValidatorTests, self).setUp()

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
            topic_services.publish_story(
                topic.id, '%s' % (index * 2 + 1), self.admin_id)
            topic_services.publish_story(
                topic.id, '%s' % (index * 2), self.admin_id)
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

        self.model_instance_0 = topic_models.TopicSummaryModel.get_by_id('0')
        self.model_instance_1 = topic_models.TopicSummaryModel.get_by_id('1')
        self.model_instance_2 = topic_models.TopicSummaryModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.TopicSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicSummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        topic_services.delete_topic(self.owner_id, '1')
        topic_services.delete_topic(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_model = topic_models.TopicModel.get_by_id('0')
        topic_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.topic_model_last_updated = (
            topic_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSummaryModel\', '
                '[u"Entity id 0: based on field topic_ids having '
                'value 0, expected model TopicModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_canonical_story_count(self):
        self.model_instance_0.canonical_story_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for canonical story '
                'count check of TopicSummaryModel\', '
                '[u"Entity id 0: Canonical story count: 10 does not '
                'match the number of story ids in canonical_story_ids '
                'in topic model: [u\'1\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_additional_story_count(self):
        self.model_instance_0.additional_story_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for additional story '
                'count check of TopicSummaryModel\', '
                '[u"Entity id 0: Additional story count: 10 does not '
                'match the number of story ids in '
                'additional_story_ids in topic model: [u\'0\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_uncategorized_skill_count(self):
        self.model_instance_0.uncategorized_skill_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for uncategorized skill '
                'count check of TopicSummaryModel\', [u"Entity id 0: '
                'Uncategorized skill count: 10 does not match the '
                'number of skill ids in uncategorized_skill_ids '
                'in topic model: [u\'2\']"]]'
            ), (
                u'[u\'failed validation check for domain object '
                'check of TopicSummaryModel\', [u"Entity id 0: '
                'Entity fails domain validation with the error Expected '
                'total_skill_count to be greater than or equal to '
                'uncategorized_skill_count 10, received \'3\'"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_total_skill_count(self):
        self.model_instance_0.total_skill_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for total skill count '
                'check of TopicSummaryModel\', '
                '[u"Entity id 0: Total skill count: 10 does not match '
                'the total number of skill ids in uncategorized_skill_ids '
                'in topic model: [u\'2\'] and skill_ids in subtopics '
                'of topic model: [u\'0\', u\'1\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_subtopic_count(self):
        self.model_instance_0.subtopic_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic count check of '
                'TopicSummaryModel\', [u"Entity id 0: Subtopic count: 10 '
                'does not match the total number of subtopics in topic model: '
                '[{u\'thumbnail_bg_color\': None, u\'skill_ids\': [u\'0\', '
                'u\'1\'], u\'title\': u\'subtopic1\', u\'url_fragment\': u\'\','
                ' u\'thumbnail_filename\': None, u\'id\': 1}] "]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_topic_related_property(self):
        self.model_instance_0.name = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for name field check of '
                'TopicSummaryModel\', '
                '[u\'Entity id %s: name field in entity: invalid does not '
                'match corresponding topic name field: topic0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicSummaryModel\', 2]']
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
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

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


class UserSettingsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSettingsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        # Note: There will a total of 3 UserSettingsModel even though
        # only two users signup in the test since superadmin signup
        # is also done in test_utils.AuditJobsTestBase.
        self.model_instance_0 = user_models.UserSettingsModel.get_by_id(
            self.user_id)
        self.model_instance_1 = user_models.UserSettingsModel.get_by_id(
            self.admin_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSettingsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSettingsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSettingsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        user_models.UserSettingsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        mock_time = (
            datetime.datetime.utcnow() - datetime.timedelta(days=1))
        self.model_instance_0.last_logged_in = mock_time
        self.model_instance_0.last_agreed_to_terms = mock_time
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSettingsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_schema(self):
        self.model_instance_1.email = 'invalid'
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'UserSettingsModel\', '
                '[u\'Entity id %s: Entity fails domain validation '
                'with the error Invalid email address: invalid\']]'
            ) % self.admin_id,
            u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_field(self):
        self.model_instance_0.last_created_an_exploration = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for last created an exploration '
                'check of UserSettingsModel\', '
                '[u\'Entity id %s: Value for last created an exploration: %s '
                'is greater than the time when job was run\']]'
            ) % (
                self.user_id,
                self.model_instance_0.last_created_an_exploration),
            u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_first_contribution_msec(self):
        self.model_instance_0.first_contribution_msec = (
            utils.get_current_time_in_millisecs() * 10)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for first contribution '
                'check of UserSettingsModel\', '
                '[u\'Entity id %s: Value for first contribution msec: %s '
                'is greater than the time when job was run\']]'
            ) % (
                self.user_id,
                self.model_instance_0.first_contribution_msec),
            u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserNormalizedNameAuditOneOffJobTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserNormalizedNameAuditOneOffJobTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        # Note: There will a total of 3 UserSettingsModel even though
        # only two users signup in the test since superadmin signup
        # is also done in test_utils.AuditJobsTestBase.
        self.model_instance_0 = user_models.UserSettingsModel.get_by_id(
            self.user_id)
        self.model_instance_1 = user_models.UserSettingsModel.get_by_id(
            self.admin_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserNormalizedNameAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = []
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_repeated_normalized_username(self):
        self.model_instance_1.normalized_username = USER_NAME
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        sorted_user_ids = sorted([self.user_id, self.admin_id])
        expected_output = [(
            u'[u\'failed validation check for normalized username '
            'check of UserSettingsModel\', '
            'u"Users with ids [\'%s\', \'%s\'] have the same normalized '
            'username username"]') % (
                sorted_user_ids[0], sorted_user_ids[1])]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_normalized_username_not_set(self):
        self.model_instance_0.normalized_username = None
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        self.model_instance_1.normalized_username = None
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()

        expected_output = []
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)


class CompletedActivitiesModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CompletedActivitiesModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        exploration = explorations[0]
        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        self.set_interaction_for_state(intro_state, 'TextInput')
        self.set_interaction_for_state(end_state, 'EndExploration')

        default_outcome = state_domain.Outcome(
            'End', state_domain.SubtitledHtml(
                'default_outcome', '<p>Introduction</p>'),
            False, [], None, None
        )
        intro_state.update_interaction_default_outcome(default_outcome)
        end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for col in collections:
            collection_services.save_new_collection(self.owner_id, col)
            rights_manager.publish_collection(self.owner, col.id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, '0', 'Introduction', 1)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, '3')
        for i in python_utils.RANGE(1, 3):
            learner_progress_services.mark_exploration_as_completed(
                self.user_id, '%s' % i)
            learner_progress_services.mark_collection_as_completed(
                self.user_id, '%s' % (i + 3))

        self.model_instance = user_models.CompletedActivitiesModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off
            .CompletedActivitiesModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CompletedActivitiesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CompletedActivitiesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CompletedActivitiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expected model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '4, expected model CollectionModel with id 4 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in IncompleteActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_collection(self):
        self.model_instance.collection_ids.append('3')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in IncompleteActivitiesModel: [u\'3\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of CompletedActivitiesModel\', '
                '[u"Entity id %s: Explorations with ids [\'exp\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of CompletedActivitiesModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class IncompleteActivitiesModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(IncompleteActivitiesModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for i in python_utils.RANGE(1, 3):
            exploration = explorations[i]
            exploration.add_states(['End'])
            intro_state = exploration.states['Introduction']
            end_state = exploration.states['End']

            self.set_interaction_for_state(intro_state, 'TextInput')
            self.set_interaction_for_state(end_state, 'EndExploration')

            default_outcome = state_domain.Outcome(
                'End', state_domain.SubtitledHtml(
                    'default_outcome', '<p>Introduction</p>'),
                False, [], None, None
            )
            intro_state.update_interaction_default_outcome(default_outcome)
            end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for col in collections:
            collection_services.save_new_collection(self.owner_id, col)
            rights_manager.publish_collection(self.owner, col.id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')
        learner_progress_services.mark_collection_as_completed(
            self.user_id, '3')
        for i in python_utils.RANGE(1, 3):
            learner_progress_services.mark_exploration_as_incomplete(
                self.user_id, '%s' % i, 'Introduction', 1)
            learner_progress_services.mark_collection_as_incomplete(
                self.user_id, '%s' % (i + 3))

        self.model_instance = user_models.IncompleteActivitiesModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off
            .IncompleteActivitiesModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated IncompleteActivitiesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of IncompleteActivitiesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'IncompleteActivitiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expected model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '4, expected model CollectionModel with id 4 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in CompletedActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_collection(self):
        self.model_instance.collection_ids.append('3')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in CompletedActivitiesModel: [u\'3\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of IncompleteActivitiesModel\', '
                '[u"Entity id %s: Explorations with ids [\'exp\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of IncompleteActivitiesModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class ExpUserLastPlaythroughModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExpUserLastPlaythroughModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(2)]

        exploration = explorations[0]
        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        self.set_interaction_for_state(intro_state, 'TextInput')
        self.set_interaction_for_state(end_state, 'EndExploration')

        default_outcome = state_domain.Outcome(
            'End', state_domain.SubtitledHtml(
                'default_outcome', '<p>Introduction</p>'),
            False, [], None, None
        )
        intro_state.update_interaction_default_outcome(default_outcome)
        end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '1')
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, '0', 'Introduction', 1)

        self.model_instance = (
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                '%s.0' % self.user_id))
        self.job_class = (
            prod_validation_jobs_one_off
            .ExpUserLastPlaythroughModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExpUserLastPlaythroughModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExpUserLastPlaythroughModel\', '
            '[u\'Entity id %s.0: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExpUserLastPlaythroughModel\', '
            '[u\'Entity id %s.0: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: based on field exploration_ids having '
                'value 0, expected model ExplorationModel with id 0 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_complete_exploration_in_exploration_id(self):
        self.model_instance.exploration_id = '1'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for incomplete exp id '
                'check of ExpUserLastPlaythroughModel\', [u\'Entity id %s.0: '
                'Exploration id 1 for entity is not marked as incomplete\']]'
            ) % self.user_id, (
                u'[u\'failed validation check for model id check of '
                'ExpUserLastPlaythroughModel\', [u\'Entity id %s.0: Entity id '
                'does not match regex pattern\']]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_exploration(self):
        rights_manager.unpublish_exploration(self.owner, '0')
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: Explorations with ids [\'0\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_version(self):
        self.model_instance.last_played_exp_version = 10
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for version check '
                'of ExpUserLastPlaythroughModel\', '
                '[u\'Entity id %s.0: last played exp version 10 is greater '
                'than current version 1 of exploration with id 0\']]') % (
                    self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_state_name(self):
        self.model_instance.last_played_state_name = 'invalidθ'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for state name check '
                'of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: last played state name invalid\\u03b8 is '
                'not present in exploration states [u\'Introduction\', '
                'u\'End\'] for exploration id 0"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class LearnerPlaylistModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(LearnerPlaylistModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(4)]

        exploration = explorations[1]
        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        self.set_interaction_for_state(intro_state, 'TextInput')
        self.set_interaction_for_state(end_state, 'EndExploration')

        default_outcome = state_domain.Outcome(
            'End', state_domain.SubtitledHtml(
                'default_outcome', '<p>Introduction</p>'),
            False, [], None, None
        )
        intro_state.update_interaction_default_outcome(default_outcome)
        end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(4, 8)]

        for col in collections:
            collection_services.save_new_collection(self.owner_id, col)
            rights_manager.publish_collection(self.owner, col.id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, '1', 'Introduction', 1)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, '4')
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, '5')

        for i in python_utils.RANGE(2, 4):
            learner_playlist_services.mark_exploration_to_be_played_later(
                self.user_id, '%s' % i)
            learner_playlist_services.mark_collection_to_be_played_later(
                self.user_id, '%s' % (i + 4))

        self.model_instance = user_models.LearnerPlaylistModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.LearnerPlaylistModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated LearnerPlaylistModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of LearnerPlaylistModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'LearnerPlaylistModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expected model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('6').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('6').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '6, expected model CollectionModel with id 6 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_completed_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in CompletedActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_incomplete_exploration(self):
        self.model_instance.exploration_ids.append('1')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in IncompleteActivitiesModel: [u\'1\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_completed_collection(self):
        self.model_instance.collection_ids.append('4')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in CompletedActivitiesModel: [u\'4\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_incomplete_collection(self):
        self.model_instance.collection_ids.append('5')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in IncompleteActivitiesModel: [u\'5\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of LearnerPlaylistModel\', '
                '[u"Entity id %s: Explorations with ids [\'exp\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of LearnerPlaylistModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserContributionsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserContributionsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.user = user_services.UserActionsInfo(self.user_id)

        self.save_new_valid_exploration(
            'exp0', self.owner_id, end_state_name='End')
        self.save_new_valid_exploration(
            'exp1', self.owner_id, end_state_name='End')
        exp_services.update_exploration(
            self.user_id, 'exp0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        exp_services.update_exploration(
            self.owner_id, 'exp0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'The objective'
            })], 'Test edit 2')
        rights_manager.publish_exploration(self.owner, 'exp0')
        rights_manager.publish_exploration(self.owner, 'exp1')

        # We will have three UserContributionsModel here since a model
        # since this model is created when UserSettingsModel is created
        # and we have also signed up super admin user in test_utils.
        self.model_instance_0 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserContributionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserContributionsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.owner_id, self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated UserContributionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        user_models.UserContributionsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserContributionsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.owner_id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserContributionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_created_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for created_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field created_exploration_ids '
                'having value exp1, expected model ExplorationModel with id '
                'exp1 but it doesn\'t exist"]]' % self.owner_id
            ), (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp1, expected model ExplorationModel with '
                'id exp1 but it doesn\'t exist"]]' % self.owner_id
            ), u'[u\'fully-validated UserContributionsModel\', 2]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_edited_exploration_model_failure(self):
        self.model_instance_0.delete()
        exp_models.ExplorationModel.get_by_id('exp0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp0, expected model ExplorationModel with '
                'id exp0 but it doesn\'t exist"]]' % self.user_id
            ), u'[u\'fully-validated UserContributionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserAuthDetailsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserAuthDetailsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.gae_id = self.get_gae_id_from_email(USER_EMAIL)

        # Note: There will be a total of 2 UserSettingsModels (hence 2
        # UserAuthDetailsModels too) even though only one user signs up in the
        # test since superadmin signup is also done in
        # test_utils.AuditJobsTestBase.
        self.model_instance = user_models.UserAuthDetailsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserAuthDetailsModelAuditOneOffJob)

    def test_audit_standard_operation_passes(self):
        expected_output = [
            u'[u\'fully-validated UserAuthDetailsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_audit_with_created_on_greater_than_last_updated_fails(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserAuthDetailsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserAuthDetailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_audit_with_last_updated_greater_than_current_time_fails(self):
        user_models.UserAuthDetailsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserAuthDetailsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_audit_with_missing_user_settings_model_fails(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserAuthDetailsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserAuthDetailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserEmailPreferencesModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserEmailPreferencesModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        user_services.update_email_preferences(
            self.user_id, True, True, False, True)

        self.model_instance = user_models.UserEmailPreferencesModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off
            .UserEmailPreferencesModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserEmailPreferencesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserEmailPreferencesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserEmailPreferencesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserEmailPreferencesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserSubscriptionsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSubscriptionsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for collection in collections:
            collection_services.save_new_collection(self.owner_id, collection)
            rights_manager.publish_collection(self.owner, collection.id)

        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', None, 'a subject', 'some text')

        subscription_services.subscribe_to_thread(
            self.user_id, thread_id)
        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)
        for exp in explorations:
            subscription_services.subscribe_to_exploration(
                self.user_id, exp.id)
        for collection in collections:
            subscription_services.subscribe_to_collection(
                self.user_id, collection.id)
        self.process_and_flush_pending_mapreduce_tasks()

        self.model_instance = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSubscriptionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscriptionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSubscriptionsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserSubscriptionsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscriptionsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_last_checked(self):
        self.model_instance.last_checked = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last checked check of '
                'UserSubscriptionsModel\', '
                '[u\'Entity id %s: last checked %s is greater than the time '
                'when job was run\']]' % (
                    self.user_id, self.model_instance.last_checked)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_user_id_in_subscriber_ids(self):
        subscriber_model = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        subscriber_model.subscriber_ids.remove(self.user_id)
        subscriber_model.update_timestamps()
        subscriber_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscriptionsModel\', [u\'Entity id %s: '
                'User id is not present in subscriber ids of creator '
                'with id %s to whom the user has subscribed\']]' % (
                    self.user_id, self.owner_id)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_subscriber_model_failure(self):
        user_models.UserSubscribersModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id %s: based on '
                'field subscriber_ids having value '
                '%s, expected model UserSubscribersModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.owner_id, self.owner_id),
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_get_external_id_relationship_failure(self):
        nonexist_thread_id = 'nonexist_thread_id'
        subscription_services.subscribe_to_thread(
            self.user_id, nonexist_thread_id)

        expected_output = [
            (
                u'[u\'failed validation check for general_feedback_thread_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id %s: based on '
                'field general_feedback_thread_ids having value '
                'nonexist_thread_id, expected model GeneralFeedbackThreadModel '
                'with id nonexist_thread_id but it doesn\'t '
                'exist"]]') % self.user_id,
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserSubscribersModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSubscribersModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)
        subscription_services.subscribe_to_creator(
            self.admin_id, self.owner_id)

        self.model_instance = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSubscribersModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscribersModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSubscribersModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.owner_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscribersModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.owner_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_user_id_in_subscriber_ids(self):
        self.model_instance.subscriber_ids.append(self.owner_id)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscribersModel\', [u\'Entity id %s: User id is '
                'present in subscriber ids for user\']]' % self.owner_id
            ), (
                u'[u\'failed validation check for subscription_ids field '
                'check of UserSubscribersModel\', [u"Entity id %s: '
                'based on field subscription_ids having value %s, expected '
                'model UserSubscriptionsModel with id %s but it doesn\'t '
                'exist"]]'
            ) % (self.owner_id, self.owner_id, self.owner_id)]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_user_id_in_creator_ids(self):
        subscription_model = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        subscription_model.creator_ids.remove(self.owner_id)
        subscription_model.update_timestamps()
        subscription_model.put()
        expected_output = [(
            u'[u\'failed validation check for subscription creator id '
            'check of UserSubscribersModel\', [u\'Entity id %s: User id '
            'is not present in creator ids to which the subscriber of user '
            'with id %s has subscribed\']]') % (self.owner_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_subscriptions_model_failure(self):
        user_models.UserSubscriptionsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscription_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field subscription_ids having value '
                '%s, expected model UserSubscriptionsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserRecentChangesBatchModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserRecentChangesBatchModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = user_models.UserRecentChangesBatchModel(
            id=self.user_id, job_queued_msec=10)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off
            .UserRecentChangesBatchModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserRecentChangesBatchModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_job_queued_msec(self):
        self.model_instance.job_queued_msec = (
            utils.get_current_time_in_millisecs() * 10)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for job queued msec check of '
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: job queued msec %s is greater than the time '
            'when job was run\']]'
        ) % (self.user_id, self.model_instance.job_queued_msec)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserRecentChangesBatchModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserStatsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserStatsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.datetime_key = datetime.datetime.utcnow().strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        weekly_creator_stats_list = [{
            self.datetime_key: {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance = user_models.UserStatsModel(
            id=self.user_id, impact_score=10, total_plays=5, average_ratings=4,
            weekly_creator_stats_list=weekly_creator_stats_list)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off.UserStatsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserStatsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserStatsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        time_str = (
            datetime.datetime.utcnow() - datetime.timedelta(days=1)).strftime(
                feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        self.model_instance.weekly_creator_stats_list = [{
            time_str: {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserStatsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_schema_version(self):
        self.model_instance.schema_version = (
            feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION + 10)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for schema version check of '
            'UserStatsModel\', '
            '[u\'Entity id %s: schema version %s is greater than current '
            'version %s\']]'
        ) % (
            self.user_id, self.model_instance.schema_version,
            feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_key_type_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            'invalid': {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats list '
            'of UserStatsModel\', [u"Entity id %s: Invalid stats dict: '
            '{u\'invalid\': {u\'num_ratings\': 5, u\'average_ratings\': 4, '
            'u\'total_plays\': 5}}"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_key_value_in_stats(self):
        time_str = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1)).strftime(
                feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        self.model_instance.weekly_creator_stats_list = [{
            time_str: {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'num_ratings\': 5, '
            'u\'average_ratings\': 4, u\'total_plays\': 5}}"]]') % (
                self.user_id, time_str)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_value_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats list '
            'of UserStatsModel\', [u"Entity id %s: Invalid stats dict: '
            '{u\'%s\': u\'invalid\'}"]]') % (self.user_id, self.datetime_key)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_properties_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: {
                'invalid': 2
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'invalid\': 2}}"]]') % (
                self.user_id, self.datetime_key)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_property_values_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: {
                'num_ratings': 2,
                'average_ratings': 'invalid',
                'total_plays': 4
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'num_ratings\': 2, '
            'u\'average_ratings\': u\'invalid\', u\'total_plays\': 4}}"]]'
        ) % (self.user_id, self.datetime_key)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserStatsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class ExplorationUserDataModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationUserDataModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.user = user_services.UserActionsInfo(self.user_id)

        self.save_new_valid_exploration(
            'exp0', self.user_id, end_state_name='End')

        self.model_instance = user_models.ExplorationUserDataModel.create(
            self.user_id, 'exp0')
        self.model_instance.draft_change_list = [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }]
        self.model_instance.draft_change_list_exp_version = 1
        self.model_instance.draft_change_list_last_updated = (
            datetime.datetime.utcnow())
        self.model_instance.rating = 4
        self.model_instance.rated_on = datetime.datetime.utcnow()
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off.ExplorationUserDataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationUserDataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationUserDataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        mock_time = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        self.model_instance.draft_change_list_last_updated = mock_time
        self.model_instance.rated_on = mock_time
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationUserDataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of ExplorationUserDataModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationUserDataModel\', '
                '[u"Entity id %s: based on field exploration_ids '
                'having value exp0, expected model ExplorationModel with id '
                'exp0 but it doesn\'t exist"]]' % self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_null_draft_change_list(self):
        self.model_instance.draft_change_list = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            u'[u\'fully-validated ExplorationUserDataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_draft_change_list(self):
        self.model_instance.draft_change_list = [{
            'cmd': 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list check '
            'of ExplorationUserDataModel\', [u"Entity id %s: Invalid '
            'change dict {u\'cmd\': u\'invalid\'} due to error '
            'Command invalid is not allowed"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_exp_version(self):
        self.model_instance.draft_change_list_exp_version = 2
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exp version check '
            'of ExplorationUserDataModel\', [u\'Entity id %s: '
            'draft change list exp version 2 is greater than '
            'version 1 of corresponding exploration with id exp0\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_draft_change_list_last_updated(self):
        self.model_instance.draft_change_list_last_updated = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list last '
            'updated check of ExplorationUserDataModel\', [u\'Entity id %s: '
            'draft change list last updated %s is greater than the '
            'time when job was run\']]') % (
                self.model_instance.id,
                self.model_instance.draft_change_list_last_updated)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_draft_change_list_last_updated_as_none(self):
        self.model_instance.draft_change_list_last_updated = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list last '
            'updated check of ExplorationUserDataModel\', [u"Entity id %s: '
            'draft change list [{u\'new_value\': u\'the objective\', '
            'u\'cmd\': u\'edit_exploration_property\', '
            'u\'property_name\': u\'objective\'}] exists but draft '
            'change list last updated is None"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_rating(self):
        self.model_instance.rating = -1
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for ratings check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: Expected '
            'rating to be in range [1, 5], received -1\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_rated_on(self):
        self.model_instance.rated_on = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for rated on check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: rated on '
            '%s is greater than the time when job was run\']]') % (
                self.model_instance.id, self.model_instance.rated_on)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_rated_on_as_none(self):
        self.model_instance.rated_on = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for rated on check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: rating 4 '
            'exists but rated on is None\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class CollectionProgressModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionProgressModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(4)]

        collection = collection_domain.Collection.create_default_collection(
            'col')

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)
            if exp.id != '3':
                collection.add_node(exp.id)

        collection_services.save_new_collection(self.owner_id, collection)
        rights_manager.publish_collection(self.owner, 'col')

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')
        collection_services.record_played_exploration_in_collection_context(
            self.user_id, 'col', '0')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '1')
        collection_services.record_played_exploration_in_collection_context(
            self.user_id, 'col', '1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '3')

        self.model_instance = user_models.CollectionProgressModel.get_by_id(
            '%s.col' % self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.CollectionProgressModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionProgressModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionProgressModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionProgressModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '1, expected model ExplorationModel with id 1 but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('col').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('col').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                'col, expected model CollectionModel with id col but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_completed_activities_model_failure(self):
        user_models.CompletedActivitiesModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for completed_activities_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field completed_activities_ids '
                'having value %s, expected model CompletedActivitiesModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        rights_manager.unpublish_exploration(self.owner, '0')
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of CollectionProgressModel\', '
                '[u"Entity id %s: Explorations with ids [\'0\'] are '
                'private"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        rights_manager.unpublish_collection(self.owner, 'col')
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of CollectionProgressModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_completed_exploration_missing_in_completed_activities(self):
        self.model_instance.completed_explorations.append('2')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed exploration check of '
            'CollectionProgressModel\', [u"Entity id %s: Following completed '
            'exploration ids [u\'2\'] are not present in '
            'CompletedActivitiesModel for the user"]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_completed_exploration_missing_in_collection(self):
        self.model_instance.completed_explorations.append('3')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed exploration check '
            'of CollectionProgressModel\', [u"Entity id %s: Following '
            'completed exploration ids [u\'3\'] do not belong to the '
            'collection with id col corresponding to the entity"]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class StoryProgressModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StoryProgressModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            end_state_name='End State',
            correctness_feedback_enabled=True
        ) for i in python_utils.RANGE(4)]

        for exp in explorations:
            rights_manager.publish_exploration(self.owner, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        story = story_domain.Story.create_default_story(
            'story',
            'title %d',
            'description %d',
            '0',
            'title-z'
        )

        story.add_node('node_1', 'Node1')
        story.add_node('node_2', 'Node2')
        story.add_node('node_3', 'Node3')
        story.update_node_destination_node_ids('node_1', ['node_2'])
        story.update_node_destination_node_ids('node_2', ['node_3'])
        story.update_node_exploration_id('node_1', '1')
        story.update_node_exploration_id('node_2', '2')
        story.update_node_exploration_id('node_3', '3')
        topic.add_canonical_story(story.id)
        story_services.save_new_story(self.owner_id, story)
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_story(topic.id, story.id, self.owner_id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '1')
        story_services.record_completed_node_in_story_context(
            self.user_id, 'story', 'node_1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '2')
        story_services.record_completed_node_in_story_context(
            self.user_id, 'story', 'node_2')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')

        self.model_instance = user_models.StoryProgressModel.get_by_id(
            '%s.story' % self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.StoryProgressModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated StoryProgressModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StoryProgressModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryProgressModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of StoryProgressModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('story').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StoryProgressModel\', '
                '[u"Entity id %s: based on field story_ids having value '
                'story, expected model StoryModel with id story but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_story(self):
        topic_id = (
            story_models.StoryModel.get_by_id('story').corresponding_topic_id)
        topic_services.unpublish_story(topic_id, 'story', self.owner_id)
        expected_output = [
            (
                u'[u\'failed validation check for public story check '
                'of StoryProgressModel\', '
                '[u\'Entity id %s: Story with id story corresponding '
                'to entity is private\']]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_completed_node_missing_in_story_node_ids(self):
        self.model_instance.completed_node_ids.append('invalid')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed node check of '
            'StoryProgressModel\', [u"Entity id %s: Following completed '
            'node ids [u\'invalid\'] do not belong to the story with '
            'id story corresponding to the entity"]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        rights_manager.unpublish_exploration(self.owner, '1')
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are private [u\'1\']. "]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are missing [u\'1\']. "]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_exploration_not_marked_as_completed(self):
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        completed_activities_model.exploration_ids.remove('1')
        completed_activities_model.update_timestamps()
        completed_activities_model.put()
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are not marked in '
            'CompletedActivitiesModel [u\'1\']."]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserQueryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserQueryModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.query_id = user_query_services.save_new_query_model(
            self.admin_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        self.model_instance = user_models.UserQueryModel.get_by_id(
            self.query_id)
        self.model_instance.user_ids = [self.owner_id, self.user_id]
        self.model_instance.update_timestamps()
        self.model_instance.put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            user_query_services.send_email_to_qualified_users(
                self.query_id, 'subject', 'body',
                feconf.BULK_EMAIL_INTENT_MARKETING, 5)
        self.sent_mail_id = self.model_instance.sent_email_model_id
        self.job_class = (
            prod_validation_jobs_one_off.UserQueryModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserQueryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserQueryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.query_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserQueryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.query_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.query_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for sent_email_model_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field sent_email_model_ids having value '
                '%s, expected model BulkEmailModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.query_id, self.sent_mail_id, self.sent_mail_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_extra_recipients(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.append('invalid')
        bulk_email_model.update_timestamps()
        bulk_email_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient check of '
            'UserQueryModel\', [u"Entity id %s: Email model %s '
            'for query has following extra recipients [u\'invalid\'] '
            'which are not qualified as per the query"]]') % (
                self.query_id, self.sent_mail_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_sender_id(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.sender_id = 'invalid'
        bulk_email_model.update_timestamps()
        bulk_email_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender check of '
            'UserQueryModel\', [u\'Entity id %s: Sender id invalid in '
            'email model with id %s does not match submitter id '
            '%s of query\']]') % (
                self.query_id, self.sent_mail_id, self.admin_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_bulk_email_model(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for user bulk email check of '
            'UserQueryModel\', [u\'Entity id %s: UserBulkEmails model '
            'is missing for recipient with id %s\']]') % (
                self.query_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserBulkEmailsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserBulkEmailsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.query_id = user_query_services.save_new_query_model(
            self.admin_id, inactive_in_last_n_days=10,
            created_at_least_n_exps=5,
            has_not_logged_in_for_n_days=30)

        query_model = user_models.UserQueryModel.get_by_id(
            self.query_id)
        query_model.user_ids = [self.owner_id, self.user_id]
        query_model.update_timestamps()
        query_model.put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            user_query_services.send_email_to_qualified_users(
                self.query_id, 'subject', 'body',
                feconf.BULK_EMAIL_INTENT_MARKETING, 5)
        self.model_instance = user_models.UserBulkEmailsModel.get_by_id(
            self.user_id)
        self.sent_mail_id = query_model.sent_email_model_id
        self.job_class = (
            prod_validation_jobs_one_off.UserBulkEmailsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserBulkEmailsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserBulkEmailsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserBulkEmailsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserBulkEmailsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]' % (
                    self.user_id, self.user_id, self.user_id)
            ), u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [(
            u'[u\'failed validation check for sent_email_model_ids field '
            'check of UserBulkEmailsModel\', [u"Entity id %s: based on '
            'field sent_email_model_ids having value %s, expected model '
            'BulkEmailModel with id %s but it doesn\'t exist", '
            'u"Entity id %s: based on field sent_email_model_ids having '
            'value %s, expected model BulkEmailModel with id %s but it '
            'doesn\'t exist"]]') % (
                self.user_id, self.sent_mail_id, self.sent_mail_id,
                self.owner_id, self.sent_mail_id, self.sent_mail_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_user_id_not_in_recipient_ids(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.remove(self.user_id)
        bulk_email_model.update_timestamps()
        bulk_email_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for recipient check of '
                'UserBulkEmailsModel\', [u\'Entity id %s: user id is '
                'not present in recipient ids of BulkEmailModel with id %s\']]'
            ) % (self.user_id, self.sent_mail_id),
            u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserSkillMasteryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSkillMasteryModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            'skill', 'description', rubrics)
        skill_services.save_new_skill(self.owner_id, skill)
        skill_services.create_user_skill_mastery(
            self.user_id, 'skill', 0.8)

        self.model_instance = user_models.UserSkillMasteryModel.get_by_id(
            id='%s.skill' % self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSkillMasteryModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSkillMasteryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSkillMasteryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSkillMasteryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserSkillMasteryModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('skill').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of UserSkillMasteryModel\', '
                '[u"Entity id %s: based on '
                'field skill_ids having value '
                'skill, expected model SkillModel '
                'with id skill but it doesn\'t exist"]]') % (
                    self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_skill_mastery(self):
        self.model_instance.degree_of_mastery = 10
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for skill mastery check '
            'of UserSkillMasteryModel\', [u\'Entity id %s: Expected degree '
            'of mastery to be in range [0.0, 1.0], received '
            '10.0\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserContributionProficiencyModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserContributionProficiencyModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        score_category = 'content.Art'
        self.model_instance = (
            user_models.UserContributionProficiencyModel.create(
                self.user_id, score_category, 10
            )
        )
        self.job_class = (
            prod_validation_jobs_one_off
            .UserContributionProficiencyModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionProficiencyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserContributionProficiencyModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserContributionProficiencyModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserContributionProficiencyModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_score(self):
        self.model_instance.score = -1
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for score check of '
            'UserContributionProficiencyModel\', [u\'Entity id %s: '
            'Expected score to be non-negative, received -1.0\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserContributionRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    TRANSLATOR_EMAIL = 'translator@community.org'
    TRANSLATOR_USERNAME = 'translator'

    VOICE_ARTIST_EMAIL = 'voiceartist@community.org'
    VOICE_ARTIST_USERNAME = 'voiceartist'

    def setUp(self):
        super(UserContributionRightsModelValidatorTests, self).setUp()

        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)

        user_services.allow_user_to_review_voiceover_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')

        self.translator_model_instance = (
            user_models.UserContributionRightsModel.get_by_id(
                self.translator_id))
        self.voice_artist_model_instance = (
            user_models.UserContributionRightsModel.get_by_id(
                self.voice_artist_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .UserContributionRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_get_external_id_relationship_failure(self):
        user_models.UserSettingsModel.get_by_id(self.translator_id).delete()

        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids field '
                'check of UserContributionRightsModel\', [u"Entity id %s: '
                'based on field user_settings_ids having value %s, expected '
                'model UserSettingsModel with id %s but it doesn\'t exist"]]'
            ) % (self.translator_id, self.translator_id, self.translator_id),
            u'[u\'fully-validated UserContributionRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_object_validation_failure(self):
        (
            self.translator_model_instance
            .can_review_voiceover_for_language_codes.append('invalid_lang_code')
        )
        self.translator_model_instance.update_timestamps()
        self.translator_model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'UserContributionRightsModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Invalid language_code: '
                'invalid_lang_code\']]'
            ) % self.translator_id,
            u'[u\'fully-validated UserContributionRightsModel\', 1]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class PendingDeletionRequestModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(PendingDeletionRequestModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        user_services.update_user_role(
            self.user_id, feconf.ROLE_ID_TOPIC_MANAGER)
        self.user_actions = user_services.UserActionsInfo(self.user_id)

        wipeout_service.pre_delete_user(self.user_id)
        self.process_and_flush_pending_mapreduce_tasks()

        self.model_instance = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .PendingDeletionRequestModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PendingDeletionRequestModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of PendingDeletionRequestModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PendingDeletionRequestModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for deleted '
                'user settings of PendingDeletionRequestModel\', '
                '[u\'Entity id %s: User settings model '
                'is not marked as deleted\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_user_settings_model_not_marked_deleted_failure(self):
        user_model = user_models.UserSettingsModel.get_by_id(self.user_id)
        user_model.deleted = False
        user_model.update_timestamps()
        user_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for deleted '
                'user settings of PendingDeletionRequestModel\', '
                '[u\'Entity id %s: User settings model '
                'is not marked as deleted\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_incorrect_keys_in_activity_mappings(self):
        self.model_instance.pseudonymizable_entity_mappings = {
            models.NAMES.audit: {'some_id': 'id'}
        }
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for correct '
                'pseudonymizable_entity_mappings check of '
                'PendingDeletionRequestModel\', [u"Entity id %s: '
                'pseudonymizable_entity_mappings contains keys '
                '[u\'audit\'] that are not allowed"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class DeletedUserModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(DeletedUserModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        # Run the full user deletion process as it works when the user
        # pre-deletes itself via frontend and then is fully deleted via
        # subsequent cron jobs.
        wipeout_service.pre_delete_user(self.user_id)
        wipeout_service.run_user_deletion(
            wipeout_service.get_pending_deletion_request(self.user_id))
        wipeout_service.run_user_deletion_completion(
            wipeout_service.get_pending_deletion_request(self.user_id))

        user_models.DeletedUserModel(id=self.user_id).put()

        self.model_instance = (
            user_models.DeletedUserModel.get_by_id(self.user_id))

        self.job_class = (
            prod_validation_jobs_one_off.DeletedUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated DeletedUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of DeletedUserModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'DeletedUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_existing_user_settings_model_failure(self):
        user_models.UserSettingsModel(
            id=self.user_id, email='email@email.com').put()
        expected_output = [
            (
                '[u\'failed validation check for '
                'user properly deleted of DeletedUserModel\', '
                '[u\'Entity id %s: The deletion verification fails\']]'
            ) % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_existing_feedback_email_reply_to_id_model_failure(self):
        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='id', user_id=self.user_id, reply_to_id='id').put()
        expected_output = [
            (
                '[u\'failed validation check for '
                'user properly deleted of DeletedUserModel\', '
                '[u\'Entity id %s: The deletion verification fails\']]'
            ) % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class PseudonymizedUserModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(PseudonymizedUserModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = (
            user_models.PseudonymizedUserModel(
                id=user_models.PseudonymizedUserModel.get_new_id('')))
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.PseudonymizedUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PseudonymizedUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of PseudonymizedUserModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PseudonymizedUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_not_same_id_as_user(self):
        user_models.UserSettingsModel(
            id=self.model_instance.id,
            email='email@email.com',
            username='username').put()

        expected_output = [(
            '[u\'failed validation check for deleted user settings of '
            'PseudonymizedUserModel\', '
            '[u\'Entity id %s: User settings model exists\']]'
        ) % self.model_instance.id]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class PlatformParameterModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(PlatformParameterModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.parameter_model = config_models.PlatformParameterModel.create(
            param_name='parameter_model_1',
            rule_dicts=[
                {'filters': [], 'value_when_matched': True}
            ],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION))
        self.parameter_model.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        self.job_class = (
            prod_validation_jobs_one_off.PlatformParameterModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PlatformParameterModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.parameter_model.created_on = (
            self.parameter_model.last_updated + datetime.timedelta(days=1))
        self.parameter_model.commit(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of PlatformParameterModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.parameter_model.id,
                    self.parameter_model.created_on,
                    self.parameter_model.last_updated
                )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PlatformParameterModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.parameter_model.id, self.parameter_model.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        config_models.PlatformParameterSnapshotMetadataModel.get_by_id(
            '%s-1' % self.parameter_model.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids field'
                ' check of PlatformParameterModel\', [u"Entity id %s: based on '
                'field snapshot_metadata_ids having value %s-1, expected model '
                'PlatformParameterSnapshotMetadataModel '
                'with id %s-1 but it doesn\'t exist"]]' % (
                    (self.parameter_model.id,) * 3))
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        config_models.PlatformParameterSnapshotContentModel.get_by_id(
            '%s-1' % self.parameter_model.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids field'
                ' check of PlatformParameterModel\', [u"Entity id %s: based on '
                'field snapshot_content_ids having value %s-1, expected model '
                'PlatformParameterSnapshotContentModel '
                'with id %s-1 but it doesn\'t exist"]]' % (
                    (self.parameter_model.id,) * 3))
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class PlatformParameterSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(
            PlatformParameterSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.parameter_model = config_models.PlatformParameterModel.create(
            param_name='parameter_model_1',
            rule_dicts=[
                {'filters': [], 'value_when_matched': True}
            ],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION))
        self.parameter_model.commit(self.admin_id, '', [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.PlatformParameterSnapshotMetadataModel.get_by_id(
                '%s-1' % self.parameter_model.id))

        self.job_class = (
            prod_validation_jobs_one_off
            .PlatformParameterSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        self.parameter_model.commit(self.admin_id, '', [])
        expected_output = [
            u'[u\'fully-validated PlatformParameterSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of PlatformParameterSnapshotMetadataModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated)
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PlatformParameterSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_parameter_model_model_failure(self):
        self.parameter_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for platform_parameter_ids '
                'field check of PlatformParameterSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field '
                'platform_parameter_ids having value %s, '
                'expected model PlatformParameterModel with '
                'id %s but it doesn\'t exist", '
                'u"Entity id %s-2: based on field '
                'platform_parameter_ids having value %s, expected model '
                'PlatformParameterModel with id %s but it doesn\'t '
                'exist"]]' % ((self.parameter_model.id,) * 6)
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of PlatformParameterSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field committer_ids '
                'having value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.parameter_model.id, self.admin_id, self.admin_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_parameter_model_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.PlatformParameterSnapshotMetadataModel(
                id='%s-3' % self.parameter_model.id, committer_id=self.admin_id,
                commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for platform parameter model '
                'version check of PlatformParameterSnapshotMetadataModel\', '
                '[u\'Entity id %s-3: PlatformParameter model corresponding to '
                'id %s has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]' % (
                    self.parameter_model.id, self.parameter_model.id)
            ),
            u'[u\'fully-validated PlatformParameterSnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance.commit_cmds = [{
            'cmd': 'edit_rules',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd edit_rules check '
                'of PlatformParameterSnapshotMetadataModel\', [u"Entity id '
                '%s-1: Commit command domain validation for command: {u\'cmd\''
                ': u\'edit_rules\', u\'invalid_attribute\': u\''
                'invalid\'} failed with error: The following required '
                'attributes are missing: new_rules, The following extra '
                'attributes are present: invalid_attribute"]]' % (
                    self.parameter_model.id)
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class PlatformParameterSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(
            PlatformParameterSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.parameter_model = config_models.PlatformParameterModel.create(
            param_name='parameter_model_1',
            rule_dicts=[
                {'filters': [], 'value_when_matched': True}
            ],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION))
        self.parameter_model.commit(self.admin_id, '', [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.PlatformParameterSnapshotContentModel.get_by_id(
                '%s-1' % self.parameter_model.id))

        self.job_class = (
            prod_validation_jobs_one_off
            .PlatformParameterSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        self.parameter_model.commit(self.admin_id, '', [])
        expected_output = [
            u'[u\'fully-validated PlatformParameterSnapshotContentModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of PlatformParameterSnapshotContentModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated
                )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PlatformParameterSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_platform_parameter_model_failure(self):
        self.parameter_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for platform_parameter_ids '
                'field check of PlatformParameterSnapshotContentModel\', '
                '[u"Entity id %s-1: based on field platform_parameter_ids '
                'having value %s, expected model PlatformParameterModel with '
                'id %s but it doesn\'t exist", u"Entity id %s-2: based on '
                'field platform_parameter_ids having value %s, expected model '
                'PlatformParameterModel with id %s but it doesn\'t exist"]]' % (
                    (self.parameter_model.id,) * 6)
            ),
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_platform_parameter_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.PlatformParameterSnapshotContentModel(
                id='%s-3' % (self.parameter_model.id)))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for platform parameter model '
                'version check of PlatformParameterSnapshotContentModel\', '
                '[u\'Entity id %s-3: PlatformParameter model corresponding '
                'to id %s has a version 1 which is less than the version 3 '
                'in snapshot content model id\']]' % (
                    (self.parameter_model.id,) * 2)
            ),
            u'[u\'fully-validated PlatformParameterSnapshotContentModel\', 1]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
