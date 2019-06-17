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

"""Unit tests for core.domain.prod_validation_jobs_one_off."""

import ast
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
from core.domain import prod_validation_jobs_one_off
from core.domain import rating_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_services
from core.domain import subscription_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

from google.appengine.api import datastore_types
from google.appengine.ext import db

gae_search_services = models.Registry.import_search_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'
CURRENT_DATETIME = datetime.datetime.utcnow()

(
    activity_models, audit_models, base_models,
    collection_models, config_models, email_models,
    exp_models, feedback_models, file_models,
    recommendations_models, story_models,
    user_models,) = (
        models.Registry.import_models([
            models.NAMES.activity, models.NAMES.audit, models.NAMES.base_model,
            models.NAMES.collection, models.NAMES.config, models.NAMES.email,
            models.NAMES.exploration, models.NAMES.feedback, models.NAMES.file,
            models.NAMES.recommendations, models.NAMES.story,
            models.NAMES.user]))

OriginalDatetimeType = datetime.datetime


class PatchedDatetimeType(type):
    """Validates the datetime instances."""
    def __instancecheck__(cls, other):
        """Validates whether the given instance is a datatime
        instance.
        """
        return isinstance(other, OriginalDatetimeType)


class MockDatetime13Hours(datetime.datetime):
    __metaclass__ = PatchedDatetimeType

    @classmethod
    def utcnow(cls):
        """Returns the current date and time 13 hours behind UTC."""
        return CURRENT_DATETIME - datetime.timedelta(hours=13)


def run_job_and_check_output(
        self, expected_output, sort=False, literal_eval=False):
    """Helper function to run job and compare output."""
    job_id = self.job_class.create_new()
    self.assertEqual(
        self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
    self.job_class.enqueue(job_id)
    self.assertEqual(
        self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
    self.process_and_flush_pending_tasks()
    actual_output = self.job_class.get_output(job_id)
    if literal_eval:
        actual_output_dict = {}
        expected_output_dict = {}

        for item in [ast.literal_eval(value) for value in actual_output]:
            value = item[1]
            if isinstance(value, list):
                value = sorted(value)
            actual_output_dict[item[0]] = value

        for item in [ast.literal_eval(value) for value in expected_output]:
            value = item[1]
            if isinstance(value, list):
                value = sorted(value)
            expected_output_dict[item[0]] = value
        self.assertEqual(
            sorted(actual_output_dict.keys()),
            sorted(expected_output_dict.keys()))
        for key in actual_output_dict:
            self.assertEqual(actual_output_dict[key], expected_output_dict[key])
    elif sort:
        self.assertEqual(sorted(actual_output), sorted(expected_output))
    else:
        self.assertEqual(actual_output, expected_output)


def update_datastore_types_for_mock_datetime():
    """Updates datastore types for MockDatetime13Hours to ensure that validation
    of ndb datetime properties does not fail.
    """

    # pylint: disable=protected-access
    datastore_types._VALIDATE_PROPERTY_VALUES[MockDatetime13Hours] = (
        datastore_types.ValidatePropertyNothing)
    datastore_types._PACK_PROPERTY_VALUES[MockDatetime13Hours] = (
        datastore_types.PackDatetime)
    datastore_types._PROPERTY_MEANINGS[MockDatetime13Hours] = (
        datastore_types.entity_pb.Property.GD_WHEN)
    # pylint: enable=protected-access


class ActivityReferencesModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ActivityReferencesModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        exploration = exp_domain.Exploration.create_default_exploration(
            '1exp', title='title', category='category')

        exp_services.save_new_exploration(self.owner_id, exploration)

        collection = collection_domain.Collection.create_default_collection(
            '1col', title='title', category='category')

        collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance = (
            activity_models.ActivityReferencesModel.get_or_create('featured'))
        self.model_instance.activity_references = [{
            'type': constants.ACTIVITY_TYPE_EXPLORATION,
            'id': '1exp',
        }, {
            'type': constants.ACTIVITY_TYPE_COLLECTION,
            'id': '1col',
        }]
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.ActivityReferencesModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated ActivityReferencesModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ActivityReferencesModel\', '
            '[u\'Entity id featured: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.created_on, self.model_instance.last_updated
            )]
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ActivityReferencesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_missing_id_in_activity_references(self):
        self.model_instance.activity_references = [{
            'type': 'exploration',
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for fetch properties of '
            'ActivityReferencesModel\', '
            '[u"Entity id featured: Entity properties cannot be fetched '
            'completely with the error \'id\'"]]')]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_type_in_activity_references(self):
        self.model_instance.activity_references = [{
            'type': 'invalid_type',
            'id': '0'
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for domain object check of '
            'ActivityReferencesModel\', '
            '[u\'Entity id featured: Entity fails domain validation with the '
            'error Invalid activity type: invalid_type\']]')]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id_in_activity_references(self):
        self.model_instance.activity_references = [{
            'type': 'exploration',
            'id': '1col'
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids field check of '
            'ActivityReferencesModel\', '
            '[u"Entity id featured: based on field exploration_ids having '
            'value 1col, expect model ExplorationModel with id 1col but '
            'it doesn\'t exist"]]')]
        run_job_and_check_output(self, expected_output)

    def test_mock_model_with_invalid_id(self):
        model_instance_with_invalid_id = (
            activity_models.ActivityReferencesModel(id='invalid'))
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated ActivityReferencesModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'ActivityReferencesModel\', '
            '[u\'Entity id invalid: Entity id does not match regex pattern\']]'
        )]
        run_job_and_check_output(self, expected_output, sort=True)


class RoleQueryAuditModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(RoleQueryAuditModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        admin_model = user_models.UserSettingsModel.get_by_id(self.admin_id)
        admin_model.role = feconf.ROLE_ID_ADMIN
        admin_model.put()

        model_id = '%s.%s.%s.%s' % (
            self.admin_id, int(math.floor(time.time())),
            feconf.ROLE_ACTION_UPDATE, random.randint(0, 1000))
        self.model_instance = audit_models.RoleQueryAuditModel(
            id=model_id, user_id=self.admin_id,
            intent=feconf.ROLE_ACTION_UPDATE, role='c', username='d')
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.RoleQueryAuditModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated RoleQueryAuditModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'RoleQueryAuditModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get(self.admin_id).delete()
        expected_output = [(
            u'[u\'failed validation check for user_ids field check of '
            'RoleQueryAuditModel\', '
            '[u"Entity id %s: based on field user_ids having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.admin_id, self.admin_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_invalid_id = '%s.%s.%s.%s' % (
            'a', int(math.floor(time.time())), feconf.ROLE_ACTION_UPDATE,
            random.randint(0, 1000))
        model_instance_with_invalid_id = audit_models.RoleQueryAuditModel(
            id=model_invalid_id, user_id=self.admin_id,
            intent=feconf.ROLE_ACTION_UPDATE, role='c', username='d')
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated RoleQueryAuditModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'RoleQueryAuditModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_invalid_id]
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CollectionModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        language_codes = ['ar', 'en', 'en']

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
            language_code=language_codes[i]
        ) for i in xrange(3)]

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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

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
            constants, 'ALL_LANGUAGE_CODES', [{
                'code': 'en', 'description': 'English'}]):
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'exploration_ids field check of CollectionModel\', '
                '[u"Entity id 0: based on field exploration_ids having value '
                '1, expect model ExplorationModel '
                'with id 1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

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
                'collection-0-1, expect model CollectionCommitLogEntryModel '
                'with id collection-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        collection_models.CollectionSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for collection_summary_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field collection_summary_ids '
                'having value 0, expect model CollectionSummaryModel with '
                'id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field collection_rights_ids having '
                'value 0, expect model CollectionRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        collection_models.CollectionSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model CollectionSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        collection_models.CollectionSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model CollectionSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.CollectionSnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSnapshotMetadataModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field collection_ids '
                'having value 0, expect model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_ids having value 0, expect model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_collection_node',
        }, {
            'cmd': 'delete_collection_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node '
                'check of CollectionSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'exploration_id, '
                'The following extra attributes are present: '
                'invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node '
                'check of CollectionSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'exploration_id\']]'
            ),
            u'[u\'fully-validated CollectionSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionSnapshotContentModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CollectionSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.CollectionSnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSnapshotContentModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field collection_ids '
                'having value 0, expect model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_ids having value 0, expect model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionRightsModelValidatorTests(test_utils.GenericTestBase):

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
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in xrange(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        rights_manager.assign_role_for_collection(
            self.owner, '0', self.editor_id, rights_manager.ROLE_EDITOR)

        rights_manager.assign_role_for_collection(
            self.owner, '2', self.viewer_id, rights_manager.ROLE_VIEWER)

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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_first_published_datetime_than_current_time(self):
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field collection_ids having '
                'value 0, expect model CollectionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_collection(
            self.owner, '0', self.user_id, rights_manager.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model '
                'CollectionRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        collection_models.CollectionRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model CollectionRightsSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionRightsSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.CollectionRightsSnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotMetadataModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field collection_rights_ids '
                'having value 0, expect model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_rights_ids having value 0, expect model '
                'CollectionRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_collection_status',
            'old_status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, {
            'cmd': 'release_ownership',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd release_ownership '
                'check of CollectionRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following extra attributes are present: '
                'invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'change_collection_status '
                'check of CollectionRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'new_status\']]'
            ),
            u'[u\'fully-validated CollectionRightsSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionRightsSnapshotContentModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(CollectionRightsSnapshotContentModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.CollectionRightsSnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotContentModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field collection_rights_ids '
                'having value 0, expect model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_rights_ids having value 0, expect model '
                'CollectionRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CollectionCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in xrange(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-0-1'))
        self.model_instance_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-1-1'))
        self.model_instance_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-2-1'))

        self.job_class = prod_validation_jobs_one_off.CollectionCommitLogEntryModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionCommitLogEntryModel\', '
                '[u"Entity id collection-0-1: based on field collection_ids '
                'having value 0, expect model CollectionModel with id 0 '
                'but it doesn\'t exist", u"Entity id collection-0-2: based '
                'on field collection_ids having value 0, expect model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionCommitLogEntryModel.create(
                '0', 3, self.owner_id, self.OWNER_USERNAME, 'edit',
                'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.collection_id = '0'
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection model '
                'version check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Collection model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            collection_models.CollectionCommitLogEntryModel(
                id='invalid-0-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, commit_type='edit',
                commit_message='msg', commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.collection_id = '0'
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = (
            feconf.POST_COMMIT_STATUS_PUBLIC)
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                '%s but post_commit_is_private is True\']]'
            ) % (self.model_instance_0.id, feconf.POST_COMMIT_STATUS_PUBLIC),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = (
            feconf.POST_COMMIT_STATUS_PRIVATE)
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                '%s but post_commit_is_private is False\']]'
            ) % (self.model_instance_0.id, feconf.POST_COMMIT_STATUS_PRIVATE),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_collection_node'
        }, {
            'cmd': 'delete_collection_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Commit command domain '
                'validation failed with error: The following required '
                'attributes are missing: exploration_id, The following '
                'extra attributes are present: invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Commit command domain '
                'validation failed with error: The following required '
                'attributes are missing: exploration_id\']]'
            ),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class CollectionSummaryModelValidatorTests(test_utils.GenericTestBase):

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
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        language_codes = ['ar', 'en', 'en']
        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
            language_code=language_codes[i]
        ) for i in xrange(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection.tags = ['math', 'art']
            collection_services.save_new_collection(self.owner_id, collection)

        rights_manager.assign_role_for_collection(
            self.owner, '0', self.editor_id, rights_manager.ROLE_EDITOR)
        collection_services.update_collection(
            self.contributor_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')

        rights_manager.assign_role_for_collection(
            self.owner, '2', self.viewer_id, rights_manager.ROLE_VIEWER)

        self.model_instance_0 = (
            collection_models.CollectionSummaryModel.get_by_id('0'))
        self.model_instance_0.ratings = {'1': 2, '2': 0, '3': 4, '4': 0, '5': 0}
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        collection_services.delete_collection(self.owner_id, '1')
        collection_services.delete_collection(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field collection_ids having '
                'value 0, expect model CollectionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_collection(
            self.owner, '0', self.user_id, rights_manager.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_contributor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.contributor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for contributor_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field contributor_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.contributor_id, self.contributor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_contributors_summary(self):
        self.model_instance_0.contributors_summary = {'invalid': 1}
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for contributors summary check '
                'of CollectionSummaryModel\', '
                '[u\'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s'
                '\']]'
            ) % (
                self.model_instance_0.id,
                (',').join(sorted(self.model_instance_0.contributor_ids)),
                (',').join(
                    sorted(self.model_instance_0.contributors_summary.keys()))),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_node_count(self):
        self.model_instance_0.node_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for node count check '
                'of CollectionSummaryModel\', '
                '[u\'Entity id 0: Node count: 10 does not match the '
                'number of nodes in collection_contents dict: 2'
                '\']]'
            ),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_collection_related_property(self):
        self.model_instance_0.title = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for title field check of '
                'CollectionSummaryModel\', '
                '[u\'Entity id %s: title field in entity: invalid does not '
                'match corresponding collection title field: New title\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_collection_rights_related_property(self):
        self.model_instance_0.status = 'public'
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
        run_job_and_check_output(self, expected_output, sort=True)


class ConfigPropertyModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete(self.admin_id, '', [{}])
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertyModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
            'config_model-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of ConfigPropertyModel\', '
                '[u"Entity id config_model: based on field '
                'snapshot_metadata_ids having '
                'value config_model-1, expect model '
                'ConfigPropertySnapshotMetadataModel '
                'with id config_model-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        config_models.ConfigPropertySnapshotContentModel.get_by_id(
            'config_model-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of ConfigPropertyModel\', '
                '[u"Entity id config_model: based on field '
                'snapshot_content_ids having '
                'value config_model-1, expect model '
                'ConfigPropertySnapshotContentModel '
                'with id config_model-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class ConfigPropertySnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(ConfigPropertySnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.config_model = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.config_model.commit(self.admin_id, [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID, email='system@committer.com').put()
        self.model_instance = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                'config_model-1'))
        self.csrf_model_instance = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                'oppia_csrf_secret-1'))

        self.job_class = prod_validation_jobs_one_off.ConfigPropertySnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        self.config_model.commit(self.admin_id, [])
        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertySnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_config_property_model_failure(self):
        self.config_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for config_property_ids '
                'field check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: based on field '
                'config_property_ids having value config_model, '
                'expect model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Entity id config_model-2: based on field '
                'config_property_ids having value config_model, expect model '
                'ConfigPropertyModel with id config_model but it doesn\'t '
                'exist"]]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: based on field committer_ids '
                'having value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.admin_id, self.admin_id),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_config_property_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='config_model-3', committer_id=self.admin_id,
                commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance.commit_cmds = [{
            'cmd': 'change_property_value',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_property_value '
                'check of ConfigPropertySnapshotMetadataModel\', '
                '[u\'Entity id config_model-1: Commit command domain '
                'validation failed with error: The following required '
                'attributes are missing: new_value, The following extra '
                'attributes are present: invalid_attribute\']]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class ConfigPropertySnapshotContentModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(ConfigPropertySnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.config_model = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.config_model.commit(self.admin_id, [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID, email='system@committer.com').put()
        self.model_instance = (
            config_models.ConfigPropertySnapshotContentModel.get_by_id(
                'config_model-1'))
        self.csrf_model_instance = (
            config_models.ConfigPropertySnapshotContentModel.get_by_id(
                'oppia_csrf_secret-1'))

        self.job_class = prod_validation_jobs_one_off.ConfigPropertySnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        self.config_model.commit(self.admin_id, [])
        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertySnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_config_property_model_failure(self):
        self.config_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for config_property_ids '
                'field check of ConfigPropertySnapshotContentModel\', '
                '[u"Entity id config_model-1: based on field '
                'config_property_ids having value config_model, '
                'expect model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Entity id config_model-2: based on field '
                'config_property_ids having value config_model, expect model '
                'ConfigPropertyModel with id config_model but it '
                'doesn\'t exist"]]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 1]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_config_property_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.ConfigPropertySnapshotContentModel(
                id='config_model-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class SentEmailModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(SentEmailModelValidatorTests, self).setUp()

        def mock_generate_hash(
                unused_cls, unused_recipient_id, unused_email_subject,
                unused_email_body):
            return 'Email Hash'

        self.sender_email = 'sender@email.com'
        self.sender_id = 'sender'
        self.sender_model = user_models.UserSettingsModel(
            id=self.sender_id, email=self.sender_email)
        self.sender_model.put()

        self.recipient_email = 'recipient@email.com'
        self.recipient_id = 'recipient'
        self.recipient_model = user_models.UserSettingsModel(
            id=self.recipient_id, email=self.recipient_email)
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=20))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'SentEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'SentEmailModel\', '
            '[u"Entity id %s: based on field recipient_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_id, self.recipient_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_sender_email(self):
        self.sender_model.email = 'invalid@email.com'
        self.sender_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender email check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Sender email %s in entity does not match with '
            'email %s of user obtained through sender id\']]') % (
                self.model_instance.id, self.model_instance.sender_email,
                self.sender_model.email)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_recipient_email(self):
        self.recipient_model.email = 'invalid@email.com'
        self.recipient_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient email check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Recipient email %s in entity does not match '
            'with email %s of user obtained through recipient id\']]') % (
                self.model_instance.id, self.model_instance.recipient_email,
                self.recipient_model.email)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_sent_datetime_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for sent datetime check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.SentEmailModel(
            id='invalid', recipient_id=self.recipient_id,
            recipient_email=self.recipient_email, sender_id=self.sender_id,
            sender_email=self.sender_email, intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='Email Subject', html_body='Email Body',
            sent_datetime=datetime.datetime.utcnow())
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated SentEmailModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % 'invalid']
        run_job_and_check_output(self, expected_output, sort=True)


class BulkEmailModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(BulkEmailModelValidatorTests, self).setUp()

        self.sender_email = 'sender@email.com'
        self.sender_id = 'sender'
        self.sender_model = user_models.UserSettingsModel(
            id=self.sender_id, email=self.sender_email)
        self.sender_model.put()

        self.recipient_ids = ['recipient1', 'recipient2']
        self.recipient_model_1 = user_models.UserSettingsModel(
            id=self.recipient_ids[0], email='recipient1@email.com')
        self.recipient_model_1.put()
        self.recipient_model_2 = user_models.UserSettingsModel(
            id=self.recipient_ids[1], email='recipient2@email.com')
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=20))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_sender_id(self):
        self.sender_model.delete()
        expected_output = [(
            u'[u\'failed validation check for sender_id field check of '
            'BulkEmailModel\', '
            '[u"Entity id %s: based on field sender_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model_1.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'BulkEmailModel\', '
            '[u"Entity id %s: based on field recipient_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_ids[0],
                self.recipient_ids[0])]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_sender_email(self):
        self.sender_model.email = 'invalid@email.com'
        self.sender_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender email check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: Sender email %s in entity does not match with '
            'email %s of user obtained through sender id\']]') % (
                self.model_instance.id, self.model_instance.sender_email,
                self.sender_model.email)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_sent_datetime_greater_than_current_time(self):
        self.model_instance.sent_datetime = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for sent datetime check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.BulkEmailModel(
            id='invalid-id', recipient_ids=self.recipient_ids,
            sender_id=self.sender_id, sender_email=self.sender_email,
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='Email Subject', html_body='Email Body',
            sent_datetime=datetime.datetime.utcnow())
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated BulkEmailModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'BulkEmailModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_instance_with_invalid_id.id]
        run_job_and_check_output(self, expected_output, sort=True)


class GeneralFeedbackEmailReplyToIdModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(GeneralFeedbackEmailReplyToIdModelValidatorTests, self).setUp()

        self.thread_id = feedback_services.create_thread(
            'exploration', 'expid', None, 'a subject', 'some text')

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = (
            email_models.GeneralFeedbackEmailReplyToIdModel.create(
                self.user_id, self.thread_id))
        self.model_instance.put()

        self.job_class = prod_validation_jobs_one_off.GeneralFeedbackEmailReplyToIdModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_model(self):
        expected_output = [(
            u'[u\'fully-validated GeneralFeedbackEmailReplyToIdModel\', 1]')]
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_user_id(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [(
            u'[u\'failed validation check for item.id.user_id field check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u"Entity id %s: based on field item.id.user_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.user_id, self.user_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_thread_id(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [(
            u'[u\'failed validation check for item.id.thread_id field check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u"Entity id %s: based on field item.id.thread_id having value '
            '%s, expect model GeneralFeedbackThreadModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.thread_id, self.thread_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_reply_to_id(self):
        while len(
                self.model_instance.reply_to_id) <= (
                    email_models.REPLY_TO_ID_LENGTH):
            self.model_instance.reply_to_id = (
                self.model_instance.reply_to_id + 'invalid')
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
        run_job_and_check_output(self, expected_output)


class ExplorationModelValidatorTests(test_utils.GenericTestBase):

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
        ) for i in xrange(3)]

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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

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
            constants, 'ALL_LANGUAGE_CODES', [{
                'code': 'en', 'description': 'English'}]):
            run_job_and_check_output(self, expected_output, sort=True)

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
                'exploration-0-1, expect model ExplorationCommitLogEntryModel '
                'with id exploration-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        exp_models.ExpSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for exp_summary_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field exp_summary_ids having '
                'value 0, expect model ExpSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_rights_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field exploration_rights_ids '
                'having value 0, expect model ExplorationRightsModel '
                'with id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        exp_models.ExplorationSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model ExplorationSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        exp_models.ExplorationSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model ExplorationSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.ExplorationSnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated ExplorationSnapshotMetadataModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field exploration_ids '
                'having value 0, expect model ExplorationModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_ids having value 0, expect model '
                'ExplorationModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of ExplorationSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'ExplorationSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_state'
        }, {
            'cmd': 'delete_state',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd delete_state '
                'check of ExplorationSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'state_name, The following extra attributes are present: '
                'invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd add_state '
                'check of ExplorationSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'state_name\']]'
            ),
            u'[u\'fully-validated ExplorationSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationSnapshotContentModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.ExplorationSnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated ExplorationSnapshotContentModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field exploration_ids '
                'having value 0, expect model ExplorationModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_ids having value 0, expect model '
                'ExplorationModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationRightsModelValidatorTests(test_utils.GenericTestBase):

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
        ) for i in xrange(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.editor_id, rights_manager.ROLE_EDITOR)

        rights_manager.assign_role_for_exploration(
            self.owner, '2', self.viewer_id, rights_manager.ROLE_VIEWER)

        self.model_instance_0 = exp_models.ExplorationRightsModel.get_by_id('0')
        self.model_instance_1 = exp_models.ExplorationRightsModel.get_by_id('1')
        self.model_instance_2 = exp_models.ExplorationRightsModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.ExplorationRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        rights_manager.publish_exploration(self.owner, '0')
        expected_output = [
            u'[u\'fully-validated ExplorationRightsModel\', 3]']
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRightsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_first_published_datetime_than_current_time(self):
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field exploration_ids having '
                'value 0, expect model ExplorationModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_cloned_from_exploration_model_failure(self):
        self.model_instance_0.cloned_from = 'invalid'
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'cloned_from_exploration_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field cloned_from_exploration_ids '
                'having value invalid, expect model ExplorationModel with id '
                'invalid but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.user_id, rights_manager.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model '
                'ExplorationRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of ExplorationRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model ExplorationRightsSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationRightsSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.ExplorationRightsSnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationRightsSnapshotMetadataModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_rights_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field exploration_rights_ids '
                'having value 0, expect model ExplorationRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_rights_ids having value 0, expect model '
                'ExplorationRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of ExplorationRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_exploration_status',
            'old_status': rights_manager.ACTIVITY_STATUS_PUBLIC,
        }, {
            'cmd': 'release_ownership',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd release_ownership '
                'check of ExplorationRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following extra attributes are present: '
                'invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'change_exploration_status '
                'check of ExplorationRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'new_status\']]'
            ),
            u'[u\'fully-validated ExplorationRightsSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationRightsSnapshotContentModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationRightsSnapshotContentModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.ExplorationRightsSnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationRightsSnapshotContentModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field exploration_rights_ids '
                'having value 0, expect model ExplorationRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'exploration_rights_ids having value 0, expect model '
                'ExplorationRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance_0 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-0-1'))
        self.model_instance_1 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-1-1'))
        self.model_instance_2 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-2-1'))

        self.job_class = prod_validation_jobs_one_off.ExplorationCommitLogEntryModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationCommitLogEntryModel\', '
                '[u"Entity id exploration-0-1: based on field '
                'exploration_ids having value 0, expect model '
                'ExplorationModel with id 0 '
                'but it doesn\'t exist", u"Entity id exploration-0-2: based '
                'on field exploration_ids having value 0, expect model '
                'ExplorationModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_exploration_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            exp_models.ExplorationCommitLogEntryModel.create(
                '0', 3, self.owner_id, self.OWNER_USERNAME, 'edit',
                'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.exploration_id = '0'
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for exploration model '
                'version check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Exploration model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            exp_models.ExplorationCommitLogEntryModel(
                id='invalid-0-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, commit_type='edit',
                commit_message='msg', commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.exploration_id = '0'
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'ExplorationCommitLogEntryModel\', '
                '[u\'Entity id exploration-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id exploration-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'public'
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_state'
        }, {
            'cmd': 'delete_state',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd delete_state '
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id exploration-0-1: Commit command domain '
                'validation failed with error: The following required '
                'attributes are missing: state_name, The following extra '
                'attributes are present: invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd add_state '
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Entity id exploration-0-1: Commit command domain '
                'validation failed with error: The following required '
                'attributes are missing: state_name\']]'
            ),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class ExpSummaryModelValidatorTests(test_utils.GenericTestBase):

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
        ) for i in xrange(3)]

        for exp in explorations:
            exp.tags = ['math', 'art']
            exp_services.save_new_exploration(self.owner_id, exp)

        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.editor_id, rights_manager.ROLE_EDITOR)
        exp_services.update_exploration(
            self.contributor_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')

        rights_manager.assign_role_for_exploration(
            self.owner, '2', self.viewer_id, rights_manager.ROLE_VIEWER)

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

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

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_first_published_datetime_than_current_time(self):
        rights_manager.publish_exploration(self.owner, '0')
        rights_manager.publish_exploration(self.owner, '1')
        self.model_instance_0 = exp_models.ExpSummaryModel.get_by_id('0')
        self.model_instance_0.first_published_msec = (
            self.model_instance_0.first_published_msec * 1000000.0)
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field exploration_ids having '
                'value 0, expect model ExplorationModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.user_id, rights_manager.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_contributor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.contributor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for contributor_user_ids '
                'field check of ExpSummaryModel\', '
                '[u"Entity id 0: based on field contributor_user_ids having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.contributor_id, self.contributor_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_exploration_model_last_updated(self):
        last_human_update_time = (
            self.model_instance_0.exploration_model_last_updated)
        self.model_instance_0.exploration_model_last_updated = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_schema(self):
        self.model_instance_0.ratings = {'10': 4, '5': 15}
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'ExpSummaryModel\', '
                '[u\'Entity id 0: Entity fails domain validation with '
                'the error Expected ratings to have keys: 1,2,3,4,5, '
                'received: 10,5\']]'
            ), u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_contributors_summary(self):
        self.model_instance_0.contributors_summary = {'invalid': 1}
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for contributors summary check '
                'of ExpSummaryModel\', '
                '[u\'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s'
                '\']]'
            ) % (
                self.model_instance_0.id,
                (',').join(sorted(self.model_instance_0.contributor_ids)),
                (',').join(
                    sorted(self.model_instance_0.contributors_summary.keys()))),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_exploration_related_property(self):
        self.model_instance_0.title = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for title field check of '
                'ExpSummaryModel\', '
                '[u\'Entity id %s: title field in entity: invalid does not '
                'match corresponding exploration title field: New title\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_exploration_rights_related_property(self):
        self.model_instance_0.status = 'public'
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
        run_job_and_check_output(self, expected_output, sort=True)


class FileMetadataModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FileMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            'exp%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance_0 = file_models.FileMetadataModel.create(
            'exploration/exp0', 'assets/image/img0.png')
        self.model_instance_0.commit(self.owner_id, [])

        self.model_instance_1 = file_models.FileMetadataModel.create(
            'exploration/exp1', '/exploration/exp1/assets/audio/aud1.mp3')
        self.model_instance_1.commit(self.owner_id, [])

        self.job_class = (
            prod_validation_jobs_one_off.FileMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FileMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of FileMetadataModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated FileMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FileMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of FileMetadataModel\', '
                '[u"Entity id %s: based on field exploration_ids having '
                'value exp1, expect model ExplorationModel with id exp1 but it '
                'doesn\'t exist"]]') % self.model_instance_1.id,
            u'[u\'fully-validated FileMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        file_models.FileMetadataSnapshotMetadataModel.get_by_id(
            '%s-1' % self.model_instance_0.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of FileMetadataModel\', '
                '[u"Entity id %s: based on field snapshot_metadata_ids '
                'having value %s-1, expect model '
                'FileMetadataSnapshotMetadataModel '
                'with id %s-1 but it doesn\'t exist"]]') % (
                    self.model_instance_0.id, self.model_instance_0.id,
                    self.model_instance_0.id),
            u'[u\'fully-validated FileMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        file_models.FileMetadataSnapshotContentModel.get_by_id(
            '%s-1' % self.model_instance_0.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of FileMetadataModel\', '
                '[u"Entity id %s: based on field snapshot_content_ids having '
                'value %s-1, expect model FileMetadataSnapshotContentModel '
                'with id %s-1 but it doesn\'t exist"]]') % (
                    self.model_instance_0.id, self.model_instance_0.id,
                    self.model_instance_0.id),
            u'[u\'fully-validated FileMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class FileMetadataSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(FileMetadataSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            'exp%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        file_metadata_model_0 = file_models.FileMetadataModel.create(
            'exploration/exp0', 'assets/image/img0.png')
        file_metadata_model_0.commit(self.owner_id, [])

        file_metadata_model_1 = file_models.FileMetadataModel.create(
            'exploration/exp1', '/exploration/exp1/assets/audio/aud1.mp3')
        file_metadata_model_1.commit(self.user_id, [])

        self.id_0 = file_metadata_model_0.id
        self.id_1 = file_metadata_model_1.id

        self.model_instance_0 = (
            file_models.FileMetadataSnapshotMetadataModel.get_by_id(
                '%s-1' % self.id_0))
        self.model_instance_1 = (
            file_models.FileMetadataSnapshotMetadataModel.get_by_id(
                '%s-1' % self.id_1))

        self.job_class = prod_validation_jobs_one_off.FileMetadataSnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FileMetadataSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of FileMetadataSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'FileMetadataSnapshotMetadataModel\', 1]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FileMetadataSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_file_metadata_model_failure(self):
        file_models.FileMetadataModel.get_by_id(self.id_0).delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for file_metadata_ids '
                'field check of FileMetadataSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field file_metadata_ids '
                'having value %s, expect model FileMetadataModel with '
                'id %s but it doesn\'t exist", u"Entity id %s-2: based on '
                'field file_metadata_ids having value %s, expect model '
                'FileMetadataModel with id %s but it doesn\'t exist"]]'
            ) % (
                self.id_0, self.id_0, self.id_0, self.id_0,
                self.id_0, self.id_0
            ),
            u'[u\'fully-validated FileMetadataSnapshotMetadataModel\', 1]']
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of FileMetadataSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.id_1, self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'FileMetadataSnapshotMetadataModel\', 1]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_file_metadata_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            file_models.FileMetadataSnapshotMetadataModel(
                id='%s-3' % self.id_0, committer_id=self.owner_id,
                commit_type='edit', commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for file metadata model '
                'version check of FileMetadataSnapshotMetadataModel\', '
                '[u\'Entity id %s-3: FileMetadata model corresponding to '
                'id %s has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ) % (self.id_0, self.id_0), (
                u'[u\'fully-validated FileMetadataSnapshotMetadataModel\', '
                '2]')]
        run_job_and_check_output(self, expected_output, sort=True)


class FileMetadataSnapshotContentModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(FileMetadataSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            'exp%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        file_metadata_model_0 = file_models.FileMetadataModel.create(
            'exploration/exp0', 'assets/image/img0.png')
        file_metadata_model_0.commit(self.owner_id, [])

        file_metadata_model_1 = file_models.FileMetadataModel.create(
            'exploration/exp1', '/exploration/exp1/assets/audio/aud1.mp3')
        file_metadata_model_1.commit(self.owner_id, [])

        self.id_0 = file_metadata_model_0.id
        self.id_1 = file_metadata_model_1.id

        self.model_instance_0 = (
            file_models.FileMetadataSnapshotContentModel.get_by_id(
                '%s-1' % self.id_0))
        self.model_instance_1 = (
            file_models.FileMetadataSnapshotContentModel.get_by_id(
                '%s-1' % self.id_1))

        self.job_class = prod_validation_jobs_one_off.FileMetadataSnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FileMetadataSnapshotContentModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of FileMetadataSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'FileMetadataSnapshotContentModel\', 1]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FileMetadataSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_file_metadata_model_failure(self):
        file_models.FileMetadataModel.get_by_id(
            self.id_0).delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for file_metadata_ids '
                'field check of FileMetadataSnapshotContentModel\', '
                '[u"Entity id %s-1: based on field file_metadata_ids '
                'having value %s, expect model FileMetadataModel with '
                'id %s but it doesn\'t exist", u"Entity id %s-2: based on '
                'field file_metadata_ids having value %s, expect model '
                'FileMetadataModel with id %s but it doesn\'t exist"]]'
            ) % (
                self.id_0, self.id_0, self.id_0, self.id_0, self.id_0,
                self.id_0),
            u'[u\'fully-validated FileMetadataSnapshotContentModel\', 1]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_file_metadata_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            file_models.FileMetadataSnapshotContentModel(
                id='%s-3' % self.id_0))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for file metadata model '
                'version check of FileMetadataSnapshotContentModel\', '
                '[u\'Entity id %s-3: FileMetadata model corresponding to '
                'id %s has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ) % (self.id_0, self.id_0), (
                u'[u\'fully-validated FileMetadataSnapshotContentModel\', '
                '2]')]
        run_job_and_check_output(self, expected_output, sort=True)


class FileModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FileModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            'exp%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.model_instance_0 = file_models.FileModel.create(
            'exploration/exp0', 'assets/image/img0.png')
        self.model_instance_0.commit(self.owner_id, [])

        self.model_instance_1 = file_models.FileModel.create(
            'exploration/exp1', '/exploration/exp1/assets/audio/aud1.mp3')
        self.model_instance_1.commit(self.owner_id, [])

        self.job_class = (
            prod_validation_jobs_one_off.FileModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FileModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of FileModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated FileModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FileModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of FileModel\', '
                '[u"Entity id %s: based on field exploration_ids having '
                'value exp1, expect model ExplorationModel with id exp1 '
                'but it doesn\'t exist"]]') % self.model_instance_1.id,
            u'[u\'fully-validated FileModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        file_models.FileSnapshotMetadataModel.get_by_id(
            '%s-1' % self.model_instance_0.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of FileModel\', '
                '[u"Entity id %s: based on field snapshot_metadata_ids '
                'having value %s-1, expect model FileSnapshotMetadataModel '
                'with id %s-1 but it doesn\'t exist"]]') % (
                    self.model_instance_0.id, self.model_instance_0.id,
                    self.model_instance_0.id),
            u'[u\'fully-validated FileModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        file_models.FileSnapshotContentModel.get_by_id(
            '%s-1' % self.model_instance_0.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of FileModel\', '
                '[u"Entity id %s: based on field snapshot_content_ids having '
                'value %s-1, expect model FileSnapshotContentModel '
                'with id %s-1 but it doesn\'t exist"]]') % (
                    self.model_instance_0.id, self.model_instance_0.id,
                    self.model_instance_0.id),
            u'[u\'fully-validated FileModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class FileSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(FileSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            'exp%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        file_model_0 = file_models.FileModel.create(
            'exploration/exp0', 'assets/image/img0.png')
        file_model_0.commit(self.owner_id, [])

        file_model_1 = file_models.FileModel.create(
            'exploration/exp1', '/exploration/exp1/assets/audio/aud1.mp3')
        file_model_1.commit(self.user_id, [])

        self.id_0 = file_model_0.id
        self.id_1 = file_model_1.id

        self.model_instance_0 = (
            file_models.FileSnapshotMetadataModel.get_by_id(
                '%s-1' % self.id_0))
        self.model_instance_1 = (
            file_models.FileSnapshotMetadataModel.get_by_id(
                '%s-1' % self.id_1))

        self.job_class = prod_validation_jobs_one_off.FileSnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FileSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of FileSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'FileSnapshotMetadataModel\', 1]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FileSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_file_model_failure(self):
        file_models.FileModel.get_by_id(self.id_0).delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for file_ids '
                'field check of FileSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field file_ids '
                'having value %s, expect model FileModel with '
                'id %s but it doesn\'t exist", u"Entity id %s-2: based on '
                'field file_ids having value %s, expect model '
                'FileModel with id %s but it doesn\'t exist"]]'
            ) % (
                self.id_0, self.id_0, self.id_0, self.id_0,
                self.id_0, self.id_0),
            u'[u\'fully-validated FileSnapshotMetadataModel\', 1]']
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of FileSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.id_1, self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'FileSnapshotMetadataModel\', 1]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_file_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            file_models.FileSnapshotMetadataModel(
                id='%s-3' % self.id_0, committer_id=self.owner_id,
                commit_type='edit', commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for file model '
                'version check of FileSnapshotMetadataModel\', '
                '[u\'Entity id %s-3: File model corresponding to '
                'id %s has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ) % (self.id_0, self.id_0), (
                u'[u\'fully-validated FileSnapshotMetadataModel\', '
                '2]')]
        run_job_and_check_output(self, expected_output, sort=True)


class FileSnapshotContentModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FileSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            'exp%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        file_model_0 = file_models.FileModel.create(
            'exploration/exp0', 'assets/image/img0.png')
        file_model_0.commit(self.owner_id, [])

        file_model_1 = file_models.FileModel.create(
            'exploration/exp1', '/exploration/exp1/assets/audio/aud1.mp3')
        file_model_1.commit(self.owner_id, [])

        self.id_0 = file_model_0.id
        self.id_1 = file_model_1.id

        self.model_instance_0 = (
            file_models.FileSnapshotContentModel.get_by_id(
                '%s-1' % self.id_0))
        self.model_instance_1 = (
            file_models.FileSnapshotContentModel.get_by_id(
                '%s-1' % self.id_1))

        self.job_class = prod_validation_jobs_one_off.FileSnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FileSnapshotContentModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of FileSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'FileSnapshotContentModel\', 1]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FileSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_file_model_failure(self):
        file_models.FileModel.get_by_id(
            self.id_0).delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for file_ids '
                'field check of FileSnapshotContentModel\', '
                '[u"Entity id %s-1: based on field file_ids '
                'having value %s, expect model FileModel with '
                'id %s but it doesn\'t exist", u"Entity id %s-2: based on '
                'field file_ids having value %s, expect model '
                'FileModel with id %s but it doesn\'t exist"]]'
            ) % (
                self.id_0, self.id_0, self.id_0, self.id_0, self.id_0,
                self.id_0),
            u'[u\'fully-validated FileSnapshotContentModel\', 1]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_file_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            file_models.FileSnapshotContentModel(
                id='%s-3' % self.id_0))
        model_with_invalid_version_in_id.content = 'content'
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for file model '
                'version check of FileSnapshotContentModel\', '
                '[u\'Entity id %s-3: File model corresponding to '
                'id %s has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ) % (self.id_0, self.id_0), (
                u'[u\'fully-validated FileSnapshotContentModel\', '
                '2]')]
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationRecommendationsModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationRecommendationsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.user_id, exp)

        recommendations_services.set_recommendations('0', ['3', '4'])
        recommendations_services.set_recommendations('1', ['5'])

        self.model_instance_0 = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))
        self.model_instance_1 = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '1'))

        self.job_class = prod_validation_jobs_one_off.ExplorationRecommendationsModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_model(self):
        expected_output = [(
            u'[u\'fully-validated ExplorationRecommendationsModel\', 2]')]
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ExplorationRecommendationsModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id, self.model_instance_0.created_on,
                    self.model_instance_0.last_updated),
            u'[u\'fully-validated ExplorationRecommendationsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRecommendationsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_missing_recommended_exploration(self):
        exp_models.ExplorationModel.get_by_id('3').delete(
            self.user_id, '', [{}])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of ExplorationRecommendationsModel\', '
                '[u"Entity id 0: based on field exploration_ids having value '
                '3, expect model ExplorationModel with '
                'id 3 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated ExplorationRecommendationsModel\', 1]']

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_id_in_recommended_ids(self):
        self.model_instance_0.recommended_exploration_ids = ['0', '4']
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for item exploration id check '
                'of ExplorationRecommendationsModel\', '
                '[u\'Entity id 0: The exploration id: 0 for which the '
                'entity is created is also present in the recommended '
                'exploration ids for entity\']]'
            ),
            u'[u\'fully-validated ExplorationRecommendationsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class TopicSimilaritiesModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TopicSimilaritiesModelValidatorTests, self).setUp()

        self.model_instance = recommendations_models.TopicSimilaritiesModel(
            id=recommendations_models.TOPIC_SIMILARITIES_ID)

        self.content = {
            'Art': {'Art': '1.0', 'Biology': '0.8', 'Chemistry': '0.1'},
            'Biology': {'Art': '0.8', 'Biology': '1.0', 'Chemistry': '0.5'},
            'Chemistry': {'Art': '0.1', 'Biology': '0.5', 'Chemistry': '1.0'},
        }

        self.model_instance.content = self.content
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.TopicSimilaritiesModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [(
            u'[u\'fully-validated TopicSimilaritiesModel\', 1]')]
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of TopicSimilaritiesModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id, self.model_instance.created_on,
                    self.model_instance.last_updated)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSimilaritiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = recommendations_models.TopicSimilaritiesModel(
            id='invalid', content=self.content)
        model_with_invalid_id.put()

        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'TopicSimilaritiesModel\', '
                '[u\'Entity id invalid: Entity id does not match regex '
                'pattern\']]'
            ),
            u'[u\'fully-validated TopicSimilaritiesModel\', 1]']

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_topic_similarities_columns(self):
        content = {
            'Art': {'Art': '1.0', 'Biology': '0.5'},
            'Biology': {}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarities column '
            'check of TopicSimilaritiesModel\', '
            '[u\'Entity id %s: Length of topic similarities columns: 1 '
            'does not match length of topic list: 2\']]') % (
                self.model_instance.id)]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_topic(self):
        content = {
            'Art': {'Art': '1.0', 'invalid': '0.5'},
            'invalid': {'Art': '0.5', 'invalid': '1.0'}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic check of '
            'TopicSimilaritiesModel\', '
            '[u\'Entity id %s: Topic invalid not in list of known topics\']]'
        ) % self.model_instance.id]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_topic_similarities_rows(self):
        content = {
            'Art': {'Art': '1.0', 'Biology': '0.5'}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarities row 0 '
            'check of TopicSimilaritiesModel\', '
            '[u\'Entity id %s: Length of topic similarities rows: 2 '
            'does not match length of topic list: 1\']]') % (
                self.model_instance.id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_similarity_type(self):
        content = {
            'Art': {'Art': 'one', 'Biology': 0.5},
            'Biology': {'Art': 0.5, 'Biology': 1.0}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [
            (
                u'[u\'failed validation check for similarity type check of '
                'TopicSimilaritiesModel\', '
                '[u\'Entity id %s: Expected similarity to be a float, '
                'received one\']]'
            ) % self.model_instance.id, (
                u'[u\'failed validation check for similarity value check of '
                'TopicSimilaritiesModel\', '
                '[u\'Entity id %s: Expected similarity to be between 0.0 '
                'and 1.0, received one\']]') % self.model_instance.id]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_similarity_value(self):
        content = {
            'Art': {'Art': 10.0, 'Biology': 0.5},
            'Biology': {'Art': 0.5, 'Biology': 1.0}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for similarity value check '
            'of TopicSimilaritiesModel\', '
            '[u\'Entity id %s: Expected similarity to be between '
            '0.0 and 1.0, received 10.0\']]') % self.model_instance.id]

        run_job_and_check_output(self, expected_output)

    def test_model_with_assymetric_content(self):
        content = {
            'Art': {'Art': 1.0, 'Biology': 0.5},
            'Biology': {'Art': 0.6, 'Biology': 1.0}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for symmetry check of '
            'TopicSimilaritiesModel\', '
            '[u\'Entity id %s: Expected topic similarities '
            'to be symmetric\']]') % self.model_instance.id]

        run_job_and_check_output(self, expected_output)


class StoryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StoryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        language_codes = ['ar', 'en', 'en']
        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='0'
        ) for i in xrange(3)]

        for index, story in enumerate(stories):
            story.language_code = language_codes[index]
            story.add_node('node_1', 'Node1')
            story.add_node('node_2', 'Node2')
            story.update_node_destination_node_ids('node_1', ['node_2'])
            story.update_node_exploration_id(
                'node_1', explorations[index * 2].id)
            story.update_node_exploration_id(
                'node_2', explorations[index * 2 + 1].id)
            topic.add_canonical_story(story.id)
            story_services.save_new_story(self.owner_id, story)

        topic_services.save_new_topic(self.owner_id, topic)

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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

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
            constants, 'ALL_LANGUAGE_CODES', [{
                'code': 'en', 'description': 'English'}]):
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of StoryModel\', '
                '[u"Entity id 0: based on field exploration_ids having value '
                '1, expect model ExplorationModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

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
                'story-0-1, expect model StoryCommitLogEntryModel '
                'with id story-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        story_models.StorySummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for story_summary_ids '
                'field check of StoryModel\', '
                '[u"Entity id 0: based on field story_summary_ids having '
                'value 0, expect model StorySummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_rights_model_failure(self):
        story_models.StoryRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for story_rights_ids '
                'field check of StoryModel\', '
                '[u"Entity id 0: based on field story_rights_ids having '
                'value 0, expect model StoryRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        story_models.StorySnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of StoryModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model StorySnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        story_models.StorySnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of StoryModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model StorySnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class StorySnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(StorySnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.StorySnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StorySnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StorySnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field story_ids '
                'having value 0, expect model StoryModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'story_ids having value 0, expect model '
                'StoryModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'StorySnapshotMetadataModel\', 2]')]
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of StorySnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'StorySnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StorySnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_story_node'
        }, {
            'cmd': 'delete_story_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd delete_story_node '
                'check of StorySnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'node_id, The following extra attributes are present: '
                'invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd add_story_node '
                'check of StorySnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'node_id, title\']]'
            ),
            u'[u\'fully-validated StorySnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class StorySnapshotContentModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StorySnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.StorySnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StorySnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StorySnapshotContentModel\', '
                '[u"Entity id 0-1: based on field story_ids '
                'having value 0, expect model StoryModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'story_ids having value 0, expect model '
                'StoryModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'StorySnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StorySnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class StoryRightsModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StoryRightsModelValidatorTests, self).setUp()

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

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(3)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)
            topic.add_canonical_story(story.id)

        topic_services.save_new_topic(self.owner_id, topic)

        story_services.assign_role(
            self.admin, self.manager1, story_domain.ROLE_MANAGER, stories[0].id)
        story_services.assign_role(
            self.admin, self.manager2, story_domain.ROLE_MANAGER, stories[0].id)
        story_services.assign_role(
            self.admin, self.manager2, story_domain.ROLE_MANAGER, stories[1].id)

        self.model_instance_0 = story_models.StoryRightsModel.get_by_id('0')
        self.model_instance_1 = story_models.StoryRightsModel.get_by_id('1')
        self.model_instance_2 = story_models.StoryRightsModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.StoryRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated StoryRightsModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StoryRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated StoryRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryRightsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StoryRightsModel\', '
                '[u"Entity id 0: based on field story_ids having '
                'value 0, expect model StoryModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_manager_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.manager1_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for manager_user_ids '
                'field check of StoryRightsModel\', '
                '[u"Entity id 0: based on field manager_user_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.manager1_id, self.manager1_id),
            u'[u\'fully-validated StoryRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        story_models.StoryRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of StoryRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model '
                'StoryRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated StoryRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        story_models.StoryRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of StoryRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model StoryRightsSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated StoryRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class StoryRightsSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(StoryRightsSnapshotMetadataModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(3)]

        for story in stories:
            if story.id != '0':
                story_services.save_new_story(self.owner_id, story)
            else:
                story_services.save_new_story(self.user_id, story)
            topic.add_canonical_story(story.id)

        topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            story_models.StoryRightsSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            story_models.StoryRightsSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            story_models.StoryRightsSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = prod_validation_jobs_one_off.StoryRightsSnapshotMetadataModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated StoryRightsSnapshotMetadataModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StoryRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'StoryRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_rights_model_failure(self):
        story_models.StoryRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_rights_ids '
                'field check of StoryRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field story_rights_ids '
                'having value 0, expect model StoryRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'story_rights_ids having value 0, expect model '
                'StoryRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'StoryRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of StoryRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'StoryRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StoryRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for story rights model '
                'version check of StoryRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: StoryRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'StoryRightsSnapshotMetadataModel\', 3]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_role',
            'assignee_id': 'id',
            'new_role': 'manager'
        }, {
            'cmd': 'publish_story',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd publish_story '
                'check of StoryRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following extra attributes are present: '
                'invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd change_role '
                'check of StoryRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-1: Commit command domain validation failed '
                'with error: The following required attributes are missing: '
                'old_role\']]'
            ),
            u'[u\'fully-validated StoryRightsSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class StoryRightsSnapshotContentModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(StoryRightsSnapshotContentModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(3)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)
            topic.add_canonical_story(story.id)

        topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            story_models.StoryRightsSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            story_models.StoryRightsSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            story_models.StoryRightsSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = prod_validation_jobs_one_off.StoryRightsSnapshotContentModelAuditOneOffJob # pylint: disable=line-too-long

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated StoryRightsSnapshotContentModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StoryRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'StoryRightsSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_rights_ids '
                'field check of StoryRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field story_rights_ids '
                'having value 0, expect model StoryRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'story_rights_ids having value 0, expect model '
                'StoryRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'StoryRightsSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StoryRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for story rights model '
                'version check of StoryRightsSnapshotContentModel\', '
                '[u\'Entity id 0-3: StoryRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated StoryRightsSnapshotContentModel\', '
                '3]')]
        run_job_and_check_output(self, expected_output, sort=True)


class StoryCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StoryCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(3)]

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

        self.job_class = prod_validation_jobs_one_off.StoryCommitLogEntryModelAuditOneOffJob # pylint: disable=line-too-long

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StoryCommitLogEntryModel\', '
                '[u"Entity id story-0-1: based on field story_ids '
                'having value 0, expect model StoryModel with id 0 '
                'but it doesn\'t exist", u"Entity id story-0-2: based '
                'on field story_ids having value 0, expect model '
                'StoryModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_story_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            story_models.StoryCommitLogEntryModel.create(
                '0', 3, self.owner_id, self.OWNER_USERNAME, 'edit',
                'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.story_id = '0'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            story_models.StoryCommitLogEntryModel(
                id='invalid-0-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, commit_type='edit',
                commit_message='msg', commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.story_id = '0'
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'StoryCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id),
            u'[u\'fully-validated StoryCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'StoryCommitLogEntryModel\', '
                '[u\'Entity id story-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of StoryCommitLogEntryModel\', '
                '[u\'Entity id story-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'public'
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of StoryCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of StoryCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_story_node'
        }, {
            'cmd': 'delete_story_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd delete_story_node '
                'check of StoryCommitLogEntryModel\', '
                '[u\'Entity id story-0-1: Commit command domain validation '
                'failed with error: The following required attributes are '
                'missing: node_id, The following extra attributes are present: '
                'invalid_attribute\']]'
            ), (
                u'[u\'failed validation check for commit cmd add_story_node '
                'check of StoryCommitLogEntryModel\', '
                '[u\'Entity id story-0-1: Commit command domain validation '
                'failed with error: The following required attributes are '
                'missing: node_id, title\']]'
            ),
            u'[u\'fully-validated StoryCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class StorySummaryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StorySummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        language_codes = ['ar', 'en', 'en']

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(3)]

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        story_services.delete_story(self.owner_id, '1')
        story_services.delete_story(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StorySummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StorySummaryModel\', '
                '[u"Entity id 0: based on field story_ids having '
                'value 0, expect model StoryModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated StorySummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_node_count(self):
        self.model_instance_0.node_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for node count check '
                'of StorySummaryModel\', '
                '[u\'Entity id 0: Node count: 10 does not match the '
                'number of nodes in story_contents dict: 0'
                '\']]'
            ),
            u'[u\'fully-validated StorySummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_story_related_property(self):
        self.model_instance_0.title = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for title field check of '
                'StorySummaryModel\', '
                '[u\'Entity id %s: title field in entity: invalid does not '
                'match corresponding story title field: title 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated StorySummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class UserSubscriptionsModelValidatorTests(test_utils.GenericTestBase):

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
        ) for i in xrange(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in xrange(3, 6)]

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
        self.process_and_flush_pending_tasks()

        self.job_class = (
            prod_validation_jobs_one_off.UserSubscriptionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscriptionsModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_get_external_id_relationship_failure(self):
        nonexist_thread_id = 'nonexist_thread_id'
        subscription_services.subscribe_to_thread(
            self.user_id, nonexist_thread_id)

        expected_output = [
            (
                u'[u\'failed validation check for general_feedback_thread_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id 110211048197157141232: based on '
                'field general_feedback_thread_ids having value '
                'nonexist_thread_id, expect model GeneralFeedbackThreadModel '
                'with id nonexist_thread_id but it doesn\'t exist"]]'),
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)
