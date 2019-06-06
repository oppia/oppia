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
from core.domain import rights_manager
from core.domain import subscription_services
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
    activity_models, audit_models, base_models, collection_models,
    config_models, email_models, exp_models, feedback_models, user_models,) = (
        models.Registry.import_models([
            models.NAMES.activity, models.NAMES.audit, models.NAMES.base_model,
            models.NAMES.collection, models.NAMES.config, models.NAMES.email,
            models.NAMES.exploration, models.NAMES.feedback,
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
        """Returns the current date and time 13 hours behind of UTC."""
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
    if sort:
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
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
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
            '[u\'Model id featured: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.created_on, self.model_instance.last_updated
            )]
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ActivityReferencesModel\', '
            '[u\'Model id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_activity_references_schema(self):
        self.model_instance.activity_references = [{
            'type': 'exploration',
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for activity_references schema check '
            'of ActivityReferencesModel\', '
            '[u"Model id featured: Property does not match the schema with the '
            'error Missing keys: [\'id\'], Extra keys: []"]]'
        ), (
            u'[u\'failed validation check for fetch properties of '
            'ActivityReferencesModel\', '
            '[u"Model id featured: Model properties cannot be fetched '
            'completely with the error \'id\'"]]')]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_type_in_activity_references(self):
        self.model_instance.activity_references = [{
            'type': 'random_type',
            'id': '0'
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for domain object check of '
            'ActivityReferencesModel\', '
            '[u\'Model id featured: Model fails domain validation with the '
            'error Invalid activity type: random_type\']]')]
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
            '[u"Model id featured: based on field exploration_ids having '
            'value 1col, expect model ExplorationModel with id 1col but '
            'it doesn\'t exist"]]')]
        run_job_and_check_output(self, expected_output)

    def test_mock_model_with_invalid_id(self):
        model_instance_with_invalid_id = (
            activity_models.ActivityReferencesModel(id='random'))
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated ActivityReferencesModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'ActivityReferencesModel\', '
            '[u\'Model id random: Model id does not match regex pattern\']]'
        )]
        run_job_and_check_output(self, expected_output, sort=True)


class RoleQueryAuditModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(RoleQueryAuditModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_admin_id(self):
        user_models.UserSettingsModel.get(self.admin_id).delete()
        expected_output = [(
            u'[u\'failed validation check for user_id field check of '
            'RoleQueryAuditModel\', '
            '[u"Model id %s: based on field user_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.admin_id, self.admin_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_non_admin_user_id(self):
        model_id_with_non_admin_user_id = '%s.%s.%s.%s' % (
            self.user_id, int(math.floor(time.time())),
            feconf.ROLE_ACTION_UPDATE, random.randint(0, 1000))
        model_instance_with_non_admin_user_id = (
            audit_models.RoleQueryAuditModel(
                id=model_id_with_non_admin_user_id, user_id=self.user_id,
                intent=feconf.ROLE_ACTION_UPDATE, role='c', username='d'))
        model_instance_with_non_admin_user_id.put()
        expected_output = [(
            u'[u\'fully-validated RoleQueryAuditModel\', 1]'
        ), (
            u'[u\'failed validation check for admin check of '
            'RoleQueryAuditModel\', '
            '[u\'Model id %s: User id %s in model does not belong to an '
            'admin\']]') % (model_id_with_non_admin_user_id, self.user_id)]
        run_job_and_check_output(self, expected_output, sort=True)

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
            '[u\'Model id %s: Model id does not match regex pattern\']]'
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
                '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                '[u\'Model id %s: Model fails domain validation with the error '
                'Invalid language code: %s\']]'
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
                'exploration_model field check of CollectionModel\', '
                '[u"Model id 0: based on field exploration_model having value '
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
                'collection_commit_log_entry_model field check of '
                'CollectionModel\', '
                '[u"Model id 0: based on field '
                'collection_commit_log_entry_model having value '
                'collection-0-1, expect model CollectionCommitLogEntryModel '
                'with id collection-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        collection_models.CollectionSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for collection_summary_model '
                'field check of CollectionModel\', '
                '[u"Model id 0: based on field collection_summary_model having '
                'value 0, expect model CollectionSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_model '
                'field check of CollectionModel\', '
                '[u"Model id 0: based on field collection_rights_model having '
                'value 0, expect model CollectionRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        collection_models.CollectionSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_model '
                'field check of CollectionModel\', '
                '[u"Model id 0: based on field snapshot_metadata_model having '
                'value 0-1, expect model CollectionSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        collection_models.CollectionSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_model '
                'field check of CollectionModel\', '
                '[u"Model id 0: based on field snapshot_content_model having '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for collection_model '
                'field check of CollectionSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field collection_model '
                'having value 0, expect model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'collection_model having value 0, expect model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_model field '
                'check of CollectionSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field committer_model having '
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
                '[u\'Model id 0-3: Collection model corresponding to '
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
            'random_key': 'random'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node '
                'check of CollectionSnapshotMetadataModel\', '
                '[u\'Model id 0-1: Commit command domain validation failed '
                'with error: Following required keys are missing: '
                'exploration_id, '
                'Following extra keys are present: random_key\']]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node '
                'check of CollectionSnapshotMetadataModel\', '
                '[u\'Model id 0-1: Commit command domain validation failed '
                'with error: Following required keys are missing: '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for collection_model '
                'field check of CollectionSnapshotContentModel\', '
                '[u"Model id 0-1: based on field collection_model '
                'having value 0, expect model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'collection_model having value 0, expect model '
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
                '[u\'Model id 0-3: Collection model corresponding to '
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
        translator_email = 'user@translator.com'
        viewer_email = 'user@viewer.com'

        self.signup(editor_email, 'editor')
        self.signup(translator_email, 'translator')
        self.signup(viewer_email, 'viewer')

        self.editor_id = self.get_user_id_from_email(editor_email)
        self.translator_id = self.get_user_id_from_email(translator_email)
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
            self.owner, '1', self.translator_id, rights_manager.ROLE_TRANSLATOR)

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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                '[u\'Model id 0: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run\']]'
            ) % (self.model_instance_0.first_published_msec),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_model '
                'field check of CollectionRightsModel\', '
                '[u"Model id 0: based on field collection_model having '
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
                u'[u\'failed validation check for owner_user_model '
                'field check of CollectionRightsModel\', '
                '[u"Model id 0: based on field owner_user_model having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_model '
                'field check of CollectionRightsModel\', '
                '[u"Model id 0: based on field editor_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_translator_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.translator_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for translator_user_model '
                'field check of CollectionRightsModel\', '
                '[u"Model id 1: based on field translator_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.translator_id, self.translator_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_model '
                'field check of CollectionRightsModel\', '
                '[u"Model id 2: based on field viewer_user_model having '
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
                u'[u\'failed validation check for snapshot_metadata_model '
                'field check of CollectionRightsModel\', '
                '[u"Model id 0: based on field snapshot_metadata_model having '
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
                u'[u\'failed validation check for snapshot_content_model '
                'field check of CollectionRightsModel\', '
                '[u"Model id 0: based on field snapshot_content_model having '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for collection_rights_model '
                'field check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field collection_rights_model '
                'having value 0, expect model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'collection_rights_model having value 0, expect model '
                'CollectionRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_model field '
                'check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field committer_model having '
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
                '[u\'Model id 0-3: Collection Rights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 3]')]
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for collection_rights_model '
                'field check of CollectionRightsSnapshotContentModel\', '
                '[u"Model id 0-1: based on field collection_rights_model '
                'having value 0, expect model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'collection_rights_model having value 0, expect model '
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
                '[u\'Model id 0-3: Collection Rights model corresponding to '
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
        self.signup(USER_EMAIL, USER_NAME)

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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for collection_model '
                'field check of CollectionCommitLogEntryModel\', '
                '[u"Model id collection-0-1: based on field collection_model '
                'having value 0, expect model CollectionModel with id 0 '
                'but it doesn\'t exist", u"Model id collection-0-2: based '
                'on field collection_model having value 0, expect model '
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
                '[u\'Model id %s: Collection model corresponding '
                'to collection id 0 has a version 1 which is less than '
                'the version 3 in commit log model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            collection_models.CollectionCommitLogEntryModel(
                id='random-0-1', user_id=self.owner_id,
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
                '[u\'Model id %s: Model id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'random'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'CollectionCommitLogEntryModel\', '
                '[u\'Model id collection-0-1: Commit type random is '
                'not allowed\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'random'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of CollectionCommitLogEntryModel\', '
                '[u\'Model id collection-0-1: Post commit status random '
                'is invalid\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'public'
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Model id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Model id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_collection_node'
        }, {
            'cmd': 'delete_collection_node',
            'random_key': 'random'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Model id collection-0-1: Commit command domain '
                'validation failed with error: Following required keys '
                'are missing: exploration_id, Following extra keys are '
                'present: random_key\']]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Model id collection-0-1: Commit command domain '
                'validation failed with error: Following required '
                'keys are missing: exploration_id\']]'
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for collection_model '
                'field check of CollectionSummaryModel\', '
                '[u"Model id 0: based on field collection_model having '
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
                u'[u\'failed validation check for owner_user_model '
                'field check of CollectionSummaryModel\', '
                '[u"Model id 0: based on field owner_user_model having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_model '
                'field check of CollectionSummaryModel\', '
                '[u"Model id 0: based on field editor_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_model '
                'field check of CollectionSummaryModel\', '
                '[u"Model id 2: based on field viewer_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_contributor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.contributor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for contributor_user_model '
                'field check of CollectionSummaryModel\', '
                '[u"Model id 0: based on field contributor_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.contributor_id, self.contributor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_ratings(self):
        self.model_instance_0.ratings = {'10': 4, '5': 15}
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for ratings schema check of '
                'CollectionSummaryModel\', '
                '[u"Model id 0: Property does not match the schema with '
                'the error Missing keys: [\'1\', \'3\', \'2\', \'4\'], '
                'Extra keys: [u\'10\']"]]'
            ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_language_code(self):
        expected_output = [
            (
                u'[u\'failed validation check for language code check of '
                'CollectionSummaryModel\', '
                '[u\'Model id %s: Language code %s for model is unsupported'
                '\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        with self.swap(
            constants, 'ALL_LANGUAGE_CODES', [{
                'code': 'en', 'description': 'English'}]):
            run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_contributors_summary(self):
        self.model_instance_0.contributors_summary = {'random': 1}
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for contributors summary check '
                'of CollectionSummaryModel\', '
                '[u\'Model id %s: Contributor ids: %s do not match the '
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
                '[u\'Model id 0: Node count: 10 does not match the '
                'number of nodes in collection_contents dict: 2'
                '\']]'
            ),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_collection_model_related_properties(self):
        mock_created_on_time = datetime.datetime.utcnow()
        properties_dict = {
            'title': 'random',
            'category': 'random',
            'objective': 'random',
            'language_code': 'en',
            'tags': ['random1', 'random2'],
            'collection_model_created_on': mock_created_on_time
        }

        output_dict = {
            'title': 'random',
            'category': 'random',
            'objective': 'random',
            'language_code': 'en',
            'tags': 'random1,random2',
            'collection_model_created_on': mock_created_on_time
        }

        for property_name in properties_dict:
            actual_value = getattr(self.model_instance_0, property_name)
            setattr(
                self.model_instance_0, property_name,
                properties_dict[property_name])
            self.model_instance_0.put()
            corresponding_property_name = property_name
            if property_name == 'collection_model_created_on':
                corresponding_property_name = 'created_on'
            output_actual_value = actual_value
            if isinstance(actual_value, list):
                output_actual_value = (',').join(actual_value)
            expected_output = [
                (
                    u'[u\'failed validation check for %s field check of '
                    'CollectionSummaryModel\', '
                    '[u\'Model id %s: %s field in model: %s does not match '
                    'corresponding collection %s field: %s\']]'
                ) % (
                    property_name, self.model_instance_0.id, property_name,
                    output_dict[property_name], corresponding_property_name,
                    output_actual_value),
                u'[u\'fully-validated CollectionSummaryModel\', 2]']
            run_job_and_check_output(self, expected_output, sort=True)
            setattr(self.model_instance_0, property_name, actual_value)
            self.model_instance_0.put()

    def test_model_with_invalid_collection_rights_model_related_properties(
            self):
        user_models.UserSettingsModel(
            id='random1', email='random1@email.com').put()
        user_models.UserSettingsModel(
            id='random2', email='random2@email.com').put()
        properties_dict = {
            'status': 'public',
            'community_owned': True,
            'owner_ids': ['random1', 'random2'],
            'editor_ids': ['random1', 'random2'],
            'viewer_ids': ['random1', 'random2']
        }

        output_dict = {
            'status': 'public',
            'community_owned': True,
            'owner_ids': 'random1,random2',
            'editor_ids': 'random1,random2',
            'viewer_ids': 'random1,random2'
        }

        for property_name in properties_dict:
            actual_value = getattr(self.model_instance_0, property_name)
            setattr(
                self.model_instance_0, property_name,
                properties_dict[property_name])
            self.model_instance_0.put()
            corresponding_property_name = property_name
            output_actual_value = actual_value
            if isinstance(actual_value, list):
                output_actual_value = (',').join(actual_value)
            expected_output = [
                (
                    u'[u\'failed validation check for %s field check of '
                    'CollectionSummaryModel\', '
                    '[u\'Model id %s: %s field in model: %s does not match '
                    'corresponding collection rights %s field: %s\']]'
                ) % (
                    property_name, self.model_instance_0.id, property_name,
                    output_dict[property_name], corresponding_property_name,
                    output_actual_value
                ),
                u'[u\'fully-validated CollectionSummaryModel\', 2]']
            run_job_and_check_output(self, expected_output, sort=True)
            setattr(self.model_instance_0, property_name, actual_value)
            self.model_instance_0.put()


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
                '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for snapshot_metadata_model '
                'field check of ConfigPropertyModel\', '
                '[u"Model id config_model: based on field '
                'snapshot_metadata_model having '
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
                u'[u\'failed validation check for snapshot_content_model '
                'field check of ConfigPropertyModel\', '
                '[u"Model id config_model: based on field '
                'snapshot_content_model having '
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
                '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for config_property_model '
                'field check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Model id config_model-1: based on field '
                'config_property_model having value config_model, '
                'expect model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Model id config_model-2: based on field '
                'config_property_model having value config_model, expect model '
                'ConfigPropertyModel with id config_model but it doesn\'t '
                'exist"]]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_model field '
                'check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Model id config_model-1: based on field committer_model '
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
                '[u\'Model id config_model-3: ConfigProperty model '
                'corresponding to id config_model has a version 1 '
                'which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance.commit_cmds = [{
            'cmd': 'change_property_value',
            'random_key': 'random'
        }]
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_property_value '
                'check of ConfigPropertySnapshotMetadataModel\', '
                '[u\'Model id config_model-1: Commit command domain '
                'validation failed with error: Following required keys '
                'are missing: new_value, Following extra keys are '
                'present: random_key\']]'
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
                '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for config_property_model '
                'field check of ConfigPropertySnapshotContentModel\', '
                '[u"Model id config_model-1: based on field '
                'config_property_model having value config_model, '
                'expect model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Model id config_model-2: based on field '
                'config_property_model having value config_model, expect model '
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
                '[u\'Model id config_model-3: ConfigProperty model '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
            '[u"Model id %s: based on field sender_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'SentEmailModel\', '
            '[u"Model id %s: based on field recipient_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_id, self.recipient_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_sender_email(self):
        self.sender_model.email = 'random@email.com'
        self.sender_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender email check of '
            'SentEmailModel\', '
            '[u\'Model id %s: Sender email %s in model does not match with '
            'email %s of user obtained through sender id\']]') % (
                self.model_instance.id, self.model_instance.sender_email,
                self.sender_model.email)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_recipient_email(self):
        self.recipient_model.email = 'random@email.com'
        self.recipient_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient email check of '
            'SentEmailModel\', '
            '[u\'Model id %s: Recipient email %s in model does not match with '
            'email %s of user obtained through recipient id\']]') % (
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
            '[u\'Model id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.SentEmailModel(
            id='random', recipient_id=self.recipient_id,
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
            '[u\'Model id %s: Model id does not match regex pattern\']]'
        ) % 'random']
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
            '[u"Model id %s: based on field sender_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.sender_id, self.sender_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_non_existent_recipient_id(self):
        self.recipient_model_1.delete()
        expected_output = [(
            u'[u\'failed validation check for recipient_id field check of '
            'BulkEmailModel\', '
            '[u"Model id %s: based on field recipient_id having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.recipient_ids[0],
                self.recipient_ids[0])]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_sender_email(self):
        self.sender_model.email = 'random@email.com'
        self.sender_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender email check of '
            'BulkEmailModel\', '
            '[u\'Model id %s: Sender email %s in model does not match with '
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
            '[u\'Model id %s: The sent_datetime field has a value %s '
            'which is greater than the time when the job was run\']]') % (
                self.model_instance.id, self.model_instance.sent_datetime)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_instance_with_invalid_id = email_models.BulkEmailModel(
            id='random', recipient_ids=self.recipient_ids,
            sender_id=self.sender_id, sender_email=self.sender_email,
            intent=feconf.BULK_EMAIL_INTENT_MARKETING,
            subject='Email Subject', html_body='Email Body',
            sent_datetime=datetime.datetime.utcnow())
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated BulkEmailModel\', 1]'
        ), (
            u'[u\'failed validation check for model id length check of '
            'BulkEmailModel\', '
            '[u\'Model id %s: Model id should be of length 12 but instead has '
            'length 6\']]'
        ) % 'random']
        run_job_and_check_output(self, expected_output, sort=True)


class GeneralFeedbackEmailReplyToIdModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(GeneralFeedbackEmailReplyToIdModelValidatorTests, self).setUp()

        self.thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', None, 'a subject', 'some text')

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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
            '[u"Model id %s: based on field item.id.user_id having value '
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
            '[u"Model id %s: based on field item.id.thread_id having value '
            '%s, expect model GeneralFeedbackThreadModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.thread_id, self.thread_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_reply_to_id(self):
        while len(
                self.model_instance.reply_to_id) < (
                    email_models.REPLY_TO_ID_LENGTH):
            self.model_instance.reply_to_id = (
                self.model_instance.reply_to_id + 'random')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for reply_to_id length check of '
            'GeneralFeedbackEmailReplyToIdModel\', '
            '[u\'Model id %s: reply_to_id %s should have length less than or '
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
            '[u\'Model id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'failed validation check for state_id_mapping_model field '
                'check of ExplorationModel\', [u"Model id 0: based on field '
                'state_id_mapping_model having value 0.2, expect model '
                'StateIdMappingModel with id 0.2 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationModel\', '
            '[u\'Model id %s: The last_updated field has a '
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
                '[u\'Model id %s: Model fails domain validation with the error '
                'Invalid language_code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated ExplorationModel\', 2]']
        with self.swap(
            constants, 'ALL_LANGUAGE_CODES', [{
                'code': 'en', 'description': 'English'}]):
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_state_id_mapping_model_failure(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changes.')
        exp_services.delete_state_id_mapping_model_for_exploration('0', 1)

        expected_output = [
            (
                u'[u\'failed validation check for state_id_mapping_model '
                'field check of ExplorationModel\', '
                '[u"Model id 0: based on field state_id_mapping_model having '
                'value 0.1, expect model StateIdMappingModel with id 0.1 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
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
                'exploration_commit_log_entry_model field check of '
                'ExplorationModel\', '
                '[u"Model id 0: based on field '
                'exploration_commit_log_entry_model having value '
                'exploration-0-1, expect model ExplorationCommitLogEntryModel '
                'with id exploration-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        exp_models.ExpSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for exp_summary_model '
                'field check of ExplorationModel\', '
                '[u"Model id 0: based on field exp_summary_model having '
                'value 0, expect model ExpSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_rights_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_model '
                'field check of ExplorationModel\', '
                '[u"Model id 0: based on field exploration_rights_model having '
                'value 0, expect model ExplorationRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        exp_models.ExplorationSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_model '
                'field check of ExplorationModel\', '
                '[u"Model id 0: based on field snapshot_metadata_model having '
                'value 0-1, expect model ExplorationSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        exp_models.ExplorationSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_model '
                'field check of ExplorationModel\', '
                '[u"Model id 0: based on field snapshot_content_model having '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for exploration_model '
                'field check of ExplorationSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field exploration_model '
                'having value 0, expect model ExplorationModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'exploration_model having value 0, expect model '
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
                u'[u\'failed validation check for committer_model field '
                'check of ExplorationSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field committer_model having '
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
                '[u\'Model id 0-3: Exploration model corresponding to '
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
            'random_key': 'random'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd delete_state '
                'check of ExplorationSnapshotMetadataModel\', '
                '[u\'Model id 0-1: Commit command domain validation failed '
                'with error: Following required keys are missing: state_name, '
                'Following extra keys are present: random_key\']]'
            ), (
                u'[u\'failed validation check for commit cmd add_state '
                'check of ExplorationSnapshotMetadataModel\', '
                '[u\'Model id 0-1: Commit command domain validation failed '
                'with error: Following required keys are missing: '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for exploration_model '
                'field check of ExplorationSnapshotContentModel\', '
                '[u"Model id 0-1: based on field exploration_model '
                'having value 0, expect model ExplorationModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'exploration_model having value 0, expect model '
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
                '[u\'Model id 0-3: Exploration model corresponding to '
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
        translator_email = 'user@translator.com'
        viewer_email = 'user@viewer.com'

        self.signup(editor_email, 'editor')
        self.signup(translator_email, 'translator')
        self.signup(viewer_email, 'viewer')

        self.editor_id = self.get_user_id_from_email(editor_email)
        self.translator_id = self.get_user_id_from_email(translator_email)
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
            self.owner, '1', self.translator_id, rights_manager.ROLE_TRANSLATOR)

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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                '[u\'Model id 0: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run\']]'
            ) % (self.model_instance_0.first_published_msec),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 0: based on field exploration_model having '
                'value 0, expect model ExplorationModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_cloned_from_exploration_model_failure(self):
        self.model_instance_0.cloned_from = 'random'
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'cloned_from_exploration_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 0: based on field cloned_from_exploration_model '
                'having value random, expect model ExplorationModel with id '
                'random but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.user_id, rights_manager.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 0: based on field owner_user_model having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 0: based on field editor_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_translator_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.translator_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for translator_user_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 1: based on field translator_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.translator_id, self.translator_id),
            u'[u\'fully-validated ExplorationRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 2: based on field viewer_user_model having '
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
                u'[u\'failed validation check for snapshot_metadata_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 0: based on field snapshot_metadata_model having '
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
                u'[u\'failed validation check for snapshot_content_model '
                'field check of ExplorationRightsModel\', '
                '[u"Model id 0: based on field snapshot_content_model having '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for exploration_rights_model '
                'field check of ExplorationRightsSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field exploration_rights_model '
                'having value 0, expect model ExplorationRightsModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'exploration_rights_model having value 0, expect model '
                'ExplorationRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_model field '
                'check of ExplorationRightsSnapshotMetadataModel\', '
                '[u"Model id 0-1: based on field committer_model having '
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
                '[u\'Model id 0-3: Exploration Rights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsSnapshotMetadataModel\', 3]')]
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for exploration_rights_model '
                'field check of ExplorationRightsSnapshotContentModel\', '
                '[u"Model id 0-1: based on field exploration_rights_model '
                'having value 0, expect model ExplorationRightsModel with '
                'id 0 but it doesn\'t exist", u"Model id 0-2: based on field '
                'exploration_rights_model having value 0, expect model '
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
                '[u\'Model id 0-3: Exploration Rights model corresponding to '
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
            '[u\'Model id %s: The created_on field has a value '
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
            '[u\'Model id %s: The last_updated field has a '
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
                u'[u\'failed validation check for exploration_model '
                'field check of ExplorationCommitLogEntryModel\', '
                '[u"Model id exploration-0-1: based on field exploration_model '
                'having value 0, expect model ExplorationModel with id 0 '
                'but it doesn\'t exist", u"Model id exploration-0-2: based '
                'on field exploration_model having value 0, expect model '
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
                '[u\'Model id %s: Exploration model corresponding '
                'to exploration id 0 has a version 1 which is less than '
                'the version 3 in commit log model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            exp_models.ExplorationCommitLogEntryModel(
                id='random-0-1', user_id=self.owner_id,
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
                '[u\'Model id %s: Model id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'random'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'ExplorationCommitLogEntryModel\', '
                '[u\'Model id exploration-0-1: Commit type random is '
                'not allowed\']]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'random'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of ExplorationCommitLogEntryModel\', '
                '[u\'Model id exploration-0-1: Post commit status random '
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
                '[u\'Model id %s: Post commit status is '
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
                '[u\'Model id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_state'
        }, {
            'cmd': 'delete_state',
            'random_key': 'random'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd delete_state '
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Model id exploration-0-1: Commit command domain '
                'validation failed with error: Following required keys '
                'are missing: state_name, Following extra keys are '
                'present: random_key\']]'
            ), (
                u'[u\'failed validation check for commit cmd add_state '
                'check of ExplorationCommitLogEntryModel\', '
                '[u\'Model id exploration-0-1: Commit command domain '
                'validation failed with error: Following required '
                'keys are missing: state_name\']]'
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
        translator_email = 'user@translator.com'
        viewer_email = 'user@viewer.com'
        contributor_email = 'user@contributor.com'

        self.signup(editor_email, 'editor')
        self.signup(translator_email, 'translator')
        self.signup(viewer_email, 'viewer')
        self.signup(contributor_email, 'contributor')

        self.editor_id = self.get_user_id_from_email(editor_email)
        self.translator_id = self.get_user_id_from_email(translator_email)
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
            self.owner, '1', self.translator_id, rights_manager.ROLE_TRANSLATOR)

        rights_manager.assign_role_for_exploration(
            self.owner, '2', self.viewer_id, rights_manager.ROLE_VIEWER)

        rating_services.assign_rating_to_exploration(self.user_id, '0', 3)
        rating_services.assign_rating_to_exploration(self.translator_id, '0', 4)

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
            '[u\'Model id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        exp_services.delete_exploration(self.owner_id, '1')
        exp_services.delete_exploration(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExpSummaryModel\', '
            '[u\'Model id %s: The last_updated field has a '
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
                '[u\'Model id 0: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run\']]'
            ) % (self.model_instance_0.first_published_msec),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_model '
                'field check of ExpSummaryModel\', '
                '[u"Model id 0: based on field exploration_model having '
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
                u'[u\'failed validation check for owner_user_model '
                'field check of ExpSummaryModel\', '
                '[u"Model id 0: based on field owner_user_model having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_model '
                'field check of ExpSummaryModel\', '
                '[u"Model id 0: based on field editor_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_translator_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.translator_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for translator_user_model '
                'field check of ExpSummaryModel\', '
                '[u"Model id 1: based on field translator_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.translator_id, self.translator_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_model '
                'field check of ExpSummaryModel\', '
                '[u"Model id 2: based on field viewer_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_contributor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.contributor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for contributor_user_model '
                'field check of ExpSummaryModel\', '
                '[u"Model id 0: based on field contributor_user_model having '
                'value %s, expect model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.contributor_id, self.contributor_id),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_ratings(self):
        self.model_instance_0.ratings = {'10': 4, '5': 15}
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for ratings schema check of '
                'ExpSummaryModel\', '
                '[u"Model id 0: Property does not match the schema with '
                'the error Missing keys: [\'1\', \'3\', \'2\', \'4\'], '
                'Extra keys: [u\'10\']"]]'
            ), u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_language_code(self):
        expected_output = [
            (
                u'[u\'failed validation check for language code check of '
                'ExpSummaryModel\', '
                '[u\'Model id %s: Language code %s for model is unsupported'
                '\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        with self.swap(
            constants, 'ALL_LANGUAGE_CODES', [{
                'code': 'en', 'description': 'English'}]):
            run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_contributors_summary(self):
        self.model_instance_0.contributors_summary = {'random': 1}
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for contributors summary check '
                'of ExpSummaryModel\', '
                '[u\'Model id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s'
                '\']]'
            ) % (
                self.model_instance_0.id,
                (',').join(sorted(self.model_instance_0.contributor_ids)),
                (',').join(
                    sorted(self.model_instance_0.contributors_summary.keys()))),
            u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_exploration_model_related_properties(self):
        mock_created_on_time = datetime.datetime.utcnow()
        properties_dict = {
            'title': 'random',
            'category': 'random',
            'objective': 'random',
            'language_code': 'en',
            'tags': ['random1', 'random2'],
            'exploration_model_created_on': mock_created_on_time
        }

        output_dict = {
            'title': 'random',
            'category': 'random',
            'objective': 'random',
            'language_code': 'en',
            'tags': 'random1,random2',
            'exploration_model_created_on': mock_created_on_time
        }

        for property_name in properties_dict:
            actual_value = getattr(self.model_instance_0, property_name)
            setattr(
                self.model_instance_0, property_name,
                properties_dict[property_name])
            self.model_instance_0.put()
            corresponding_property_name = property_name
            if property_name == 'exploration_model_created_on':
                corresponding_property_name = 'created_on'
            output_actual_value = actual_value
            if isinstance(actual_value, list):
                output_actual_value = (',').join(actual_value)
            expected_output = [
                (
                    u'[u\'failed validation check for %s field check of '
                    'ExpSummaryModel\', '
                    '[u\'Model id %s: %s field in model: %s does not match '
                    'corresponding exploration %s field: %s\']]'
                ) % (
                    property_name, self.model_instance_0.id, property_name,
                    output_dict[property_name], corresponding_property_name,
                    output_actual_value),
                u'[u\'fully-validated ExpSummaryModel\', 2]']
            run_job_and_check_output(self, expected_output, sort=True)
            setattr(self.model_instance_0, property_name, actual_value)
            self.model_instance_0.put()

    def test_model_with_invalid_exploration_rights_model_related_properties(
            self):
        user_models.UserSettingsModel(
            id='random1', email='random1@email.com').put()
        user_models.UserSettingsModel(
            id='random2', email='random2@email.com').put()
        rights_manager.publish_exploration(self.owner, '0')
        rights_manager.publish_exploration(self.owner, '1')
        self.model_instance_0 = exp_models.ExpSummaryModel.get_by_id('0')
        epoch = datetime.datetime.utcfromtimestamp(0)
        mock_published_time = (
            datetime.datetime.utcnow() - epoch).total_seconds() * 1000.0
        properties_dict = {
            'status': 'private',
            'community_owned': True,
            'first_published_msec': mock_published_time,
            'owner_ids': ['random1', 'random2'],
            'editor_ids': ['random1', 'random2'],
            'translator_ids': ['random1', 'random2'],
            'viewer_ids': ['random1', 'random2']
        }

        output_dict = {
            'status': 'private',
            'community_owned': True,
            'first_published_msec': mock_published_time,
            'owner_ids': 'random1,random2',
            'editor_ids': 'random1,random2',
            'translator_ids': 'random1,random2',
            'viewer_ids': 'random1,random2'
        }

        for property_name in properties_dict:
            actual_value = getattr(self.model_instance_0, property_name)
            setattr(
                self.model_instance_0, property_name,
                properties_dict[property_name])
            self.model_instance_0.put()
            corresponding_property_name = property_name
            output_actual_value = actual_value
            if isinstance(actual_value, list):
                output_actual_value = (',').join(actual_value)
            expected_output = [
                (
                    u'[u\'failed validation check for %s field check of '
                    'ExpSummaryModel\', '
                    '[u\'Model id %s: %s field in model: %s does not match '
                    'corresponding exploration rights %s field: %s\']]'
                ) % (
                    property_name, self.model_instance_0.id, property_name,
                    output_dict[property_name], corresponding_property_name,
                    output_actual_value
                ),
                u'[u\'fully-validated ExpSummaryModel\', 2]']
            run_job_and_check_output(self, expected_output, sort=True)
            setattr(self.model_instance_0, property_name, actual_value)
            self.model_instance_0.put()


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
                '[u"Model id 110211048197157141232: based on '
                'field general_feedback_thread_ids having value '
                'nonexist_thread_id, expect model GeneralFeedbackThreadModel '
                'with id nonexist_thread_id but it doesn\'t exist"]]'),
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)
