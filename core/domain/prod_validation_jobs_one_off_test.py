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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import math
import random
import time
import types

from constants import constants
from core import jobs_registry
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import fs_services
from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.domain import prod_validation_jobs_one_off
from core.domain import question_domain
from core.domain import question_services
from core.domain import rating_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subscription_services
from core.domain import subtopic_page_domain
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_id_migration
from core.domain import user_query_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import python_utils
import utils

from google.appengine.api import datastore_types
from google.appengine.ext import db

gae_search_services = models.Registry.import_search_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'
CURRENT_DATETIME = datetime.datetime.utcnow()

(
    activity_models, audit_models, base_models,
    classifier_models, collection_models,
    config_models, email_models, exp_models,
    feedback_models, improvements_models, job_models,
    opportunity_models, question_models,
    recommendations_models, skill_models,
    story_models, suggestion_models, topic_models,
    user_models,) = (
        models.Registry.import_models([
            models.NAMES.activity, models.NAMES.audit, models.NAMES.base_model,
            models.NAMES.classifier, models.NAMES.collection,
            models.NAMES.config, models.NAMES.email, models.NAMES.exploration,
            models.NAMES.feedback, models.NAMES.improvements, models.NAMES.job,
            models.NAMES.opportunity, models.NAMES.question,
            models.NAMES.recommendations, models.NAMES.skill,
            models.NAMES.story, models.NAMES.suggestion, models.NAMES.topic,
            models.NAMES.user]))

OriginalDatetimeType = datetime.datetime


class PatchedDatetimeType(type):
    """Validates the datetime instances."""
    def __instancecheck__(cls, other):
        """Validates whether the given instance is a datatime instance.

        Args:
            other: *. The instance to check.

        Returns:
            bool. Whether or not the instance is an OriginalDateTimeType.
        """
        return isinstance(other, OriginalDatetimeType)


class MockDatetime13Hours( # pylint: disable=inherit-non-class
        python_utils.with_metaclass(PatchedDatetimeType, datetime.datetime)):
    @classmethod
    def utcnow(cls):
        """Returns the current date and time 13 hours behind UTC.

        Returns:
            datetime. A datetime that is 13 hours behind the current time.
        """
        return CURRENT_DATETIME - datetime.timedelta(hours=13)


def run_job_and_check_output(
        self, expected_output, sort=False, literal_eval=False):
    """Helper function to run job and compare output.

    Args:
        expected_output: list(*). The expected result of the job.
        sort: bool. Whether to sort the outputs before comparison.
        literal_eval: bool. Whether to use ast.literal_eval before comparison.
    """
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


class MockModel(base_models.BaseModel):
    pass


class MockSnapshotModel(base_models.BaseModel):
    commit_type = 'edit'
    commit_cmds = []


class MockBaseModelValidator(prod_validation_jobs_one_off.BaseModelValidator):
    pass


class MockSummaryModelValidator(
        prod_validation_jobs_one_off.BaseSummaryModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}


class MockSnapshotContentModelValidator(
        prod_validation_jobs_one_off.BaseSnapshotContentModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}


class MockSnapshotMetadataModelValidator(
        prod_validation_jobs_one_off.BaseSnapshotMetadataModelValidator):

    EXTERNAL_MODEL_NAME = 'external model'
    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'external_model_ids': (MockModel, [])
        }


class MockBaseUserModelValidator(
        prod_validation_jobs_one_off.BaseUserModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_common_properties_do_not_match,
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public]


class BaseValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(BaseValidatorTests, self).setUp()
        self.item = MockModel(id='mockmodel')
        self.item.put()

    def test_error_is_raised_if_fetch_external_properties_is_undefined(self):
        with self.assertRaises(NotImplementedError):
            MockBaseModelValidator().validate(self.item)

    def test_error_is_get_external_model_properties_is_undefined(self):
        with self.assertRaises(NotImplementedError):
            MockSummaryModelValidator().validate(self.item)

    def test_error_is_raised_if_external_model_name_is_undefined(self):
        with self.assertRaisesRegexp(
            Exception, 'External model name should be specified'):
            MockSnapshotContentModelValidator().validate(self.item)

    def test_error_is_raised_if_get_change_domain_class_is_undefined(self):
        with self.assertRaises(NotImplementedError):
            snapshot_model = MockSnapshotModel(id='mockmodel')
            snapshot_model.put()
            MockSnapshotMetadataModelValidator().validate(snapshot_model)

    def test_error_is_raised_if_entity_classes_to_map_over_is_undefined(self):
        job_class = prod_validation_jobs_one_off.ProdValidationAuditOneOffJob
        with self.assertRaises(NotImplementedError), self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS', [job_class]):
            job_id = job_class.create_new()
            job_class.enqueue(job_id)

    def test_no_error_is_raised_for_base_user_model(self):
        user = MockModel(id='12345')
        user.put()
        MockBaseUserModelValidator().validate(user)


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
            'completely with the error u\'id\'"]]')]

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


class UsernameChangeAuditModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UsernameChangeAuditModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        admin_model = user_models.UserSettingsModel.get_by_id(self.admin_id)
        admin_model.role = feconf.ROLE_ID_ADMIN
        admin_model.put()

        model_id = (
            '%s.%d' % (self.admin_id, utils.get_current_time_in_millisecs()))
        self.model_instance = audit_models.UsernameChangeAuditModel(
            id=model_id, committer_id=self.admin_id,
            old_username=USER_NAME, new_username='new')
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.UsernameChangeAuditModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [
            u'[u\'fully-validated UsernameChangeAuditModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UsernameChangeAuditModel\', '
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
            u'[u\'failed validation check for committer_ids field check of '
            'UsernameChangeAuditModel\', '
            '[u"Entity id %s: based on field committer_ids having value '
            '%s, expect model UserSettingsModel with '
            'id %s but it doesn\'t exist"]]') % (
                self.model_instance.id, self.admin_id, self.admin_id)]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_invalid_id = (
            '%d.%s' % (utils.get_current_time_in_millisecs(), self.admin_id))
        model_instance_with_invalid_id = audit_models.UsernameChangeAuditModel(
            id=model_invalid_id, committer_id=self.admin_id,
            old_username=USER_NAME, new_username='new')
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated UsernameChangeAuditModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'UsernameChangeAuditModel\', '
            '[u\'Entity id %s: Entity id does not match regex pattern\']]'
        ) % model_invalid_id]
        run_job_and_check_output(self, expected_output, sort=True)


class ClassifierTrainingJobModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ClassifierTrainingJobModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            exp.add_states(['StateTest%s' % exp.id])
            exp_services.save_new_exploration(self.owner_id, exp)

        next_scheduled_check_time = datetime.datetime.utcnow()
        classifier_data = {'classifier_data': 'data'}
        id0 = classifier_models.ClassifierTrainingJobModel.create(
            'TextClassifier', 'TextInput', '0', 1,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'StateTest0', feconf.TRAINING_JOB_STATUS_NEW, 1)
        fs_services.save_classifier_data(
            'TextClassifier', id0, classifier_data)
        self.model_instance_0 = (
            classifier_models.ClassifierTrainingJobModel.get_by_id(id0))
        id1 = classifier_models.ClassifierTrainingJobModel.create(
            'CodeClassifier', 'CodeRepl', '1', 1,
            next_scheduled_check_time,
            [{'answer_group_index': 1, 'answers': ['a1', 'a2']}],
            'StateTest1', feconf.TRAINING_JOB_STATUS_NEW, 1)
        fs_services.save_classifier_data(
            'CodeClassifier', id1, classifier_data)
        self.model_instance_1 = (
            classifier_models.ClassifierTrainingJobModel.get_by_id(id1))

        self.job_class = (
            prod_validation_jobs_one_off
            .ClassifierTrainingJobModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ClassifierTrainingJobModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ClassifierTrainingJobModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ClassifierTrainingJobModel\', '
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
                u'[u\'failed validation check for exploration_ids field '
                'check of ClassifierTrainingJobModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expect model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_exp_version(self):
        self.model_instance_0.exp_version = 5
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for exp version check '
                'of ClassifierTrainingJobModel\', [u\'Entity id %s: '
                'Exploration version 5 in entity is greater than the '
                'version 1 of exploration corresponding to exp_id 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_state_name(self):
        self.model_instance_0.state_name = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for state name check '
                'of ClassifierTrainingJobModel\', [u\'Entity id %s: '
                'State name invalid in entity is not present in '
                'states of exploration corresponding to exp_id 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_schema(self):
        self.model_instance_0.interaction_id = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check '
                'of ClassifierTrainingJobModel\', [u\'Entity id %s: Entity '
                'fails domain validation with the error Invalid '
                'interaction id: invalid\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated ClassifierTrainingJobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class TrainingJobExplorationMappingModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(TrainingJobExplorationMappingModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            exp.add_states(['StateTest%s' % exp.id])
            exp_services.save_new_exploration(self.owner_id, exp)

        id0 = classifier_models.TrainingJobExplorationMappingModel.create(
            '0', 1, 'StateTest0', 'job0')
        self.model_instance_0 = (
            classifier_models.TrainingJobExplorationMappingModel.get_by_id(id0))
        id1 = classifier_models.TrainingJobExplorationMappingModel.create(
            '1', 1, 'StateTest1', 'job1')
        self.model_instance_1 = (
            classifier_models.TrainingJobExplorationMappingModel.get_by_id(id1))

        self.job_class = (
            prod_validation_jobs_one_off
            .TrainingJobExplorationMappingModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TrainingJobExplorationMappingModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TrainingJobExplorationMappingModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated TrainingJobExplorationMappingModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TrainingJobExplorationMappingModel\', '
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
                u'[u\'failed validation check for exploration_ids field '
                'check of TrainingJobExplorationMappingModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expect model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance_0.id,
            u'[u\'fully-validated TrainingJobExplorationMappingModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_exp_version(self):
        model_instance_with_invalid_exp_version = (
            classifier_models.TrainingJobExplorationMappingModel(
                id='0.5.StateTest0', exp_id='0', exp_version=5,
                state_name='StateTest0', job_id='job_id'))
        model_instance_with_invalid_exp_version.put()
        expected_output = [
            (
                u'[u\'failed validation check for exp version check '
                'of TrainingJobExplorationMappingModel\', [u\'Entity id %s: '
                'Exploration version 5 in entity is greater than the '
                'version 1 of exploration corresponding to exp_id 0\']]'
            ) % model_instance_with_invalid_exp_version.id,
            u'[u\'fully-validated TrainingJobExplorationMappingModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_state_name(self):
        model_instance_with_invalid_state_name = (
            classifier_models.TrainingJobExplorationMappingModel(
                id='0.1.invalid', exp_id='0', exp_version=1,
                state_name='invalid', job_id='job_id'))
        model_instance_with_invalid_state_name.put()
        expected_output = [
            (
                u'[u\'failed validation check for state name check '
                'of TrainingJobExplorationMappingModel\', [u\'Entity id %s: '
                'State name invalid in entity is not present in '
                'states of exploration corresponding to exp_id 0\']]'
            ) % model_instance_with_invalid_state_name.id,
            u'[u\'fully-validated TrainingJobExplorationMappingModel\', 2]']
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
            collection_models.CollectionRightsAllUsersModel(
                id='%s' % index, all_user_ids=[self.owner_id]).put()

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
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
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

    def test_missing_rights_all_users_failure(self):
        collection_models.CollectionRightsAllUsersModel.get_by_id(
            '0').delete()
        expected_output = [
            (
                u'[u\'failed validation check for all_users_model_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field all_users_model_ids having '
                'value 0, expect model CollectionRightsAllUsersModel '
                'with id 0 but it doesn\'t exist"]]'),
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


class CollectionRightsAllUsersModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CollectionRightsAllUsersModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        editor_email = 'user@editor.com'
        self.signup(editor_email, 'editor')
        self.editor_id = self.get_user_id_from_email(editor_email)
        self.owner = user_services.UserActionsInfo(self.owner_id)

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
            self.owner, '0', self.editor_id, rights_manager.ROLE_EDITOR)

        user_id_migration.AddAllUserIdsSnapshotContentVerificationJob.enqueue(
            user_id_migration.AddAllUserIdsSnapshotContentVerificationJob
            .create_new()
        )
        self.process_and_flush_pending_tasks()

        self.model_instance_0 = (
            collection_models.CollectionRightsAllUsersModel.get_by_id('0'))
        self.model_instance_1 = (
            collection_models.CollectionRightsAllUsersModel.get_by_id('1'))
        self.model_instance_2 = (
            collection_models.CollectionRightsAllUsersModel.get_by_id('2'))

        self.job_class = (
            prod_validation_jobs_one_off.
            CollectionRightsAllUsersModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionRightsAllUsersModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionRightsAllUsersModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionRightsAllUsersModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsAllUsersModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionRightsAllUsersModel\', '
                '[u"Entity id 0: based on field collection_rights_ids '
                'having value 0, expect model CollectionRightsModel with '
                'id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated CollectionRightsAllUsersModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for all_user_ids '
                'field check of CollectionRightsAllUsersModel\', '
                '[u"Entity id 0: based on field all_user_ids '
                'having value %s, expect model UserSettingsModel with '
                'id %s but it doesn\'t exist"]]'
            ) % (self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionRightsAllUsersModel\', 2]']
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
                id='rights-1-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, collection_id='1',
                commit_type='edit', commit_message='', commit_cmds=[],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_community_owned=False,
                post_commit_is_private=False))
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
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

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
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionCommitLogEntryModel\', '
                '[u"Entity id rights-1-1: based on field '
                'collection_rights_ids having value 1, expect model '
                'CollectionRightsModel with id 1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        run_job_and_check_output(
            self, expected_output, sort=True)

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
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]']
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
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'CollectionCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]']
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
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
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
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
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
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
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
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
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
        collection_model = collection_models.CollectionModel.get_by_id('0')
        collection_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.collection_model_last_updated = (
            collection_model.last_updated)
        self.model_instance_0.put()
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
        sorted_contributor_ids = sorted(
            self.model_instance_0.contributors_summary.keys())
        self.model_instance_0.contributors_summary = {'invalid': 1}
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_node_count(self):
        self.model_instance_0.node_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for node count check '
                'of CollectionSummaryModel\', '
                '[u"Entity id 0: Node count: 10 does not match the number '
                'of nodes in collection_contents dict: [{u\'exploration_id\': '
                'u\'0\'}, {u\'exploration_id\': u\'1\'}]"]]'
            ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_ratings(self):
        self.model_instance_0.ratings = {'1': 0, '2': 1}
        self.model_instance_0.put()
        self.model_instance_1.ratings = {}
        self.model_instance_1.put()
        expected_output = [(
            u'[u\'failed validation check for ratings check of '
            'CollectionSummaryModel\', '
            '[u"Entity id 0: Expected ratings for the entity to be empty '
            'but received {u\'1\': 0, u\'2\': 1}"]]'
        ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
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


class ExplorationOpportunitySummaryModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationOpportunitySummaryModelValidatorTests, self).setUp()

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationOpportunitySummaryModelAuditOneOffJob)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.TOPIC_ID = 'topic'
        self.STORY_ID = 'story'
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category',
        ) for i in python_utils.RANGE(5)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID, 'topic', 'abbrev', 'description')
        topic_services.save_new_topic(self.owner_id, topic)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, title='A story',
            corresponding_topic_id=self.TOPIC_ID)
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID, self.STORY_ID)

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_1.created_on = (
            self.model_instance_1.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

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

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(
                self, expected_output, sort=True, literal_eval=True)

    def test_missing_story_model_failure(self):
        story_model = story_models.StoryModel.get_by_id(self.STORY_ID)
        story_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for story_ids field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: based on field story_ids having value story, '
                'expect model StoryModel with id story but it doesn\'t exist", '
                'u"Entity id 2: based on field story_ids having value story, '
                'expect model StoryModel with id story but it doesn\'t exist", '
                'u"Entity id 3: based on field story_ids having value story, '
                'expect model StoryModel with id story but it doesn\'t exist"]]'
            )]
        run_job_and_check_output(
            self, expected_output, sort=True, literal_eval=True)

    def test_missing_topic_model_failure(self):
        topic_model = topic_models.TopicModel.get_by_id(self.TOPIC_ID)
        topic_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: based on field topic_ids having value topic, '
                'expect model TopicModel with id topic but it doesn\'t exist", '
                'u"Entity id 2: based on field topic_ids having value topic, '
                'expect model TopicModel with id topic but it doesn\'t exist", '
                'u"Entity id 3: based on field topic_ids having value topic, '
                'expect model TopicModel with id topic but it doesn\'t exist"]]'
            )]
        run_job_and_check_output(
            self, expected_output, sort=True, literal_eval=True)

    def test_missing_exp_model_failure(self):
        exp_model = exp_models.ExplorationModel.get_by_id('1')
        exp_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [(
            u'[u\'failed validation check for exploration_ids field check '
            'of ExplorationOpportunitySummaryModel\', '
            '[u"Entity id 1: based on field exploration_ids having '
            'value 1, expect model ExplorationModel with id 1 but it '
            'doesn\'t exist"]]'), (
                u'[u\'fully-validated ExplorationOpportunitySummaryModel\','
                ' 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_content_count(self):
        self.model_instance_1.content_count = 10
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for content count check '
                'of ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: Content count: 10 does not match the '
                'content count of external exploration model: 2"]]'
            ), u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        run_job_and_check_output(
            self, expected_output, sort=True, literal_eval=True)

    def test_model_with_invalid_translation_counts(self):
        self.model_instance_1.translation_counts = {'hi': 2}
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for translation counts check '
                'of ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: Translation counts: {u\'hi\': 2} does not '
                'match the translation counts of external exploration model: '
                '{}"]]'
            ), u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        run_job_and_check_output(
            self, expected_output, sort=True, literal_eval=True)

    def test_model_with_invalid_chapter_title(self):
        self.model_instance_1.chapter_title = 'Invalid title'
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for chapter title check '
                'of ExplorationOpportunitySummaryModel\', '
                '[u"Entity id 1: Chapter title: Invalid title does not match '
                'the chapter title of external story model: Node 1"]]'
            ), u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        run_job_and_check_output(
            self, expected_output, sort=True, literal_eval=True)

    def test_model_with_invalid_topic_related_property(self):
        self.model_instance_1.topic_name = 'invalid'
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic_name field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u\'Entity id %s: topic_name field in entity: invalid does '
                'not match corresponding topic name field: topic\']]'
            ) % self.model_instance_1.id,
            u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_story_related_property(self):
        self.model_instance_1.story_title = 'invalid'
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for story_title field check of '
                'ExplorationOpportunitySummaryModel\', '
                '[u\'Entity id %s: story_title field in entity: invalid does '
                'not match corresponding story title field: A story\']]'
            ) % self.model_instance_1.id,
            u'[u\'fully-validated ExplorationOpportunitySummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class SkillOpportunityModelValidatorTests(test_utils.GenericTestBase):

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
        self.admin = user_services.UserActionsInfo(self.admin_id)

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
        run_job_and_check_output(self, expected_output)

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

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(
                self, expected_output, sort=True, literal_eval=True)

    def test_missing_skill_model_failure(self):
        skill_model = skill_models.SkillModel.get_by_id('0')
        skill_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of SkillOpportunityModel\', '
                '[u"Entity id 0: based on field skill_ids having '
                'value 0, expect model SkillModel with id 0 but it '
                'doesn\'t exist"]]'
            ),
            u'[u\'fully-validated SkillOpportunityModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_skill_description(self):
        self.model_instance_0.skill_description = 'invalid'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_question_count(self):
        self.model_instance_0.question_count = 10
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for question_count check of '
                'SkillOpportunityModel\', '
                '[u\'Entity id %s: question_count: 10 does not match the '
                'question_count of external skill model: 1\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SkillOpportunityModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_question_count_schema(self):
        self.model_instance_0.question_count = -1
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
            id=feconf.SYSTEM_COMMITTER_ID,
            gae_id='gae_' + feconf.SYSTEM_COMMITTER_ID,
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
            id=feconf.SYSTEM_COMMITTER_ID,
            gae_id='gae_' + feconf.SYSTEM_COMMITTER_ID,
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
            id=self.sender_id,
            gae_id='gae_' + self.sender_id,
            email=self.sender_email)
        self.sender_model.put()

        self.recipient_email = 'recipient@email.com'
        self.recipient_id = 'recipient'
        self.recipient_model = user_models.UserSettingsModel(
            id=self.recipient_id,
            gae_id='gae_' + self.recipient_id,
            email=self.recipient_email)
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
            'email %s of user obtained through sender id %s\']]') % (
                self.model_instance.id, self.model_instance.sender_email,
                self.sender_model.email, self.model_instance.sender_id)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_recipient_email(self):
        self.recipient_model.email = 'invalid@email.com'
        self.recipient_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient email check of '
            'SentEmailModel\', '
            '[u\'Entity id %s: Recipient email %s in entity does not match '
            'with email %s of user obtained through recipient id %s\']]') % (
                self.model_instance.id, self.model_instance.recipient_email,
                self.recipient_model.email, self.model_instance.recipient_id)]
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
            id=self.sender_id,
            gae_id='gae_' + self.sender_id,
            email=self.sender_email)
        self.sender_model.put()

        self.recipient_ids = ['recipient1', 'recipient2']
        self.recipient_model_1 = user_models.UserSettingsModel(
            id=self.recipient_ids[0],
            gae_id='gae_' + self.recipient_ids[0],
            email='recipient1@email.com')
        self.recipient_model_1.put()
        self.recipient_model_2 = user_models.UserSettingsModel(
            id=self.recipient_ids[1],
            gae_id='gae_' + self.recipient_ids[1],
            email='recipient2@email.com')
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
            'email %s of user obtained through sender id %s\']]') % (
                self.model_instance.id, self.model_instance.sender_email,
                self.sender_model.email, self.model_instance.sender_id)]
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
            id='invalid:id', recipient_ids=self.recipient_ids,
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

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackEmailReplyToIdModelAuditOneOffJob)

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
        ) for i in python_utils.RANGE(3)]

        for index, exp in enumerate(explorations):
            exp_services.save_new_exploration(self.owner_id, exp)
            exp_models.ExplorationRightsAllUsersModel(
                id='%s' % index, all_user_ids=[self.owner_id]).put()

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
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
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

    def test_missing_rights_all_users_failure(self):
        exp_models.ExplorationRightsAllUsersModel.get_by_id('0').delete()
        expected_output = [
            (
                u'[u\'failed validation check for all_users_model_ids '
                'field check of ExplorationModel\', '
                '[u"Entity id 0: based on field all_users_model_ids having '
                'value 0, expect model ExplorationRightsAllUsersModel '
                'with id 0 but it doesn\'t exist"]]'),
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
        ) for i in python_utils.RANGE(3)]

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


class ExplorationRightsAllUsersModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationRightsAllUsersModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        editor_email = 'user@editor.com'
        self.signup(editor_email, 'editor')
        self.editor_id = self.get_user_id_from_email(editor_email)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(3)]
        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        rights_manager.assign_role_for_exploration(
            self.owner, '0', self.editor_id, rights_manager.ROLE_EDITOR)

        user_id_migration.AddAllUserIdsSnapshotContentVerificationJob.enqueue(
            user_id_migration.AddAllUserIdsSnapshotContentVerificationJob
            .create_new()
        )
        self.process_and_flush_pending_tasks()

        self.model_instance_0 = (
            exp_models.ExplorationRightsAllUsersModel.get_by_id('0'))
        self.model_instance_1 = (
            exp_models.ExplorationRightsAllUsersModel.get_by_id('1'))
        self.model_instance_2 = (
            exp_models.ExplorationRightsAllUsersModel.get_by_id('2'))

        self.job_class = (
            prod_validation_jobs_one_off.
            ExplorationRightsAllUsersModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationRightsAllUsersModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationRightsAllUsersModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'ExplorationRightsAllUsersModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRightsAllUsersModel\', '
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
                'field check of ExplorationRightsAllUsersModel\', '
                '[u"Entity id 0: based on field exploration_rights_ids '
                'having value 0, expect model ExplorationRightsModel with '
                'id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated ExplorationRightsAllUsersModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for all_user_ids '
                'field check of ExplorationRightsAllUsersModel\', '
                '[u"Entity id 0: based on field all_user_ids '
                'having value %s, expect model UserSettingsModel with '
                'id %s but it doesn\'t exist"]]'
            ) % (self.editor_id, self.editor_id),
            u'[u\'fully-validated ExplorationRightsAllUsersModel\', 2]']
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
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        self.rights_model_instance = (
            exp_models.ExplorationCommitLogEntryModel(
                id='rights-1-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, exploration_id='1',
                commit_type='edit', commit_message='', commit_cmds=[],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_community_owned=False,
                post_commit_is_private=False))
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
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

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
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_rights_model_failure(self):
        exp_models.ExplorationRightsModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_rights_ids '
                'field check of ExplorationCommitLogEntryModel\', '
                '[u"Entity id rights-1-1: based on field '
                'exploration_rights_ids having value 1, expect model '
                'ExplorationRightsModel with id 1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
        run_job_and_check_output(
            self, expected_output, sort=True)

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
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 4]']
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
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'ExplorationCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 4]']
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
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
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
            ), u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
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
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
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
            u'[u\'fully-validated ExplorationCommitLogEntryModel\', 3]']
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
        ) for i in python_utils.RANGE(3)]

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

    def test_model_with_first_published_datetime_greater_than_current_time(
            self):
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
                'the error Expected ratings to have keys: 1, 2, 3, 4, 5, '
                'received 10, 5\']]'
            ), u'[u\'fully-validated ExpSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_contributors_summary(self):
        sorted_contributor_ids = sorted(
            self.model_instance_0.contributors_summary.keys())
        self.model_instance_0.contributors_summary = {'invalid': 1}
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


class GeneralFeedbackThreadModelValidatorTests(test_utils.GenericTestBase):

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
            self.admin_id, change, score_category, self.thread_id)

        self.model_instance = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.thread_id))
        self.model_instance.has_suggestion = True
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .GeneralFeedbackThreadModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralFeedbackThreadModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackThreadModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]
        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expect model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_suggestion_model_failure(self):
        suggestion_models.GeneralSuggestionModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for suggestion_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field suggestion_ids having '
                'value %s, expect model GeneralSuggestionModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expect model UserSettingsModel with id %s but it doesn\'t '
                'exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of GeneralFeedbackThreadModel\', '
                '[u"Entity id %s: based on field message_ids having value '
                '%s.0, expect model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_has_suggestion(self):
        self.model_instance.has_suggestion = False
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for has suggestion '
                'check of GeneralFeedbackThreadModel\', [u\'Entity id %s: '
                'has suggestion for entity is false but a suggestion exists '
                'with id same as entity id\']]'
            ) % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_entity_type(self):
        expected_output = [
            (
                u'[u\'failed validation check for entity type check '
                'of GeneralFeedbackThreadModel\', [u\'Entity id %s: Entity '
                'type exploration is not allowed\']]'
            ) % self.model_instance.id]
        with self.swap(
            prod_validation_jobs_one_off, 'TARGET_TYPE_TO_TARGET_MODEL', {}):
            run_job_and_check_output(self, expected_output, sort=True)


class GeneralFeedbackMessageModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackMessageModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralFeedbackMessageModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expect model UserSettingsModel with id %s but it doesn\'t '
                'exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_feedback_thread_model_failure(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for feedback_thread_ids field '
                'check of GeneralFeedbackMessageModel\', '
                '[u"Entity id %s: based on field feedback_thread_ids having '
                'value %s, expect model GeneralFeedbackThreadModel with '
                'id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_message_id(self):
        self.model_instance.message_id = 2
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
        run_job_and_check_output(self, expected_output, sort=True)


class GeneralFeedbackThreadUserModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralFeedbackThreadUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_ids field '
                'check of GeneralFeedbackThreadUserModel\', '
                '[u"Entity id %s: based on field user_ids having value '
                '%s, expect model UserSettingsModel with id %s but it doesn\'t '
                'exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of GeneralFeedbackThreadUserModel\', '
                '[u"Entity id %s: based on field message_ids having '
                'value %s.0, expect model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)


class FeedbackAnalyticsModelValidatorTests(test_utils.GenericTestBase):

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
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.FeedbackAnalyticsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated FeedbackAnalyticsModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'FeedbackAnalyticsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of FeedbackAnalyticsModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expect model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)


class UnsentFeedbackEmailModelValidatorTests(test_utils.GenericTestBase):

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
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.UnsentFeedbackEmailModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UnsentFeedbackEmailModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UnsentFeedbackEmailModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_ids field '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: based on field user_ids having value '
                '%s, expect model UserSettingsModel with id %s but it doesn\'t '
                'exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_message_model_failure(self):
        feedback_models.GeneralFeedbackMessageModel.get_by_id(
            '%s.0' % self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for message_ids field '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: based on field message_ids having value '
                '%s.0, expect model GeneralFeedbackMessageModel with '
                'id %s.0 but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_message_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('message_id')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'thread_id\': u\'%s\', u\'entity_id\': u\'0\', '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_thread_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('thread_id')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'entity_id\': u\'0\', u\'message_id\': 0, '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_entity_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('entity_id')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'message_id\': 0, u\'entity_type\': '
                'u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_entity_type_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0].pop('entity_type')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message '
                'reference check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: '
                '{u\'thread_id\': u\'%s\', u\'entity_id\': u\'0\', '
                'u\'message_id\': 0}"]]'
            ) % (self.model_instance.id, self.thread_id)]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_entity_type_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0]['entity_type'] = (
            'invalid')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'entity_id\': u\'0\', u\'message_id\': 0, '
                'u\'entity_type\': u\'invalid\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_entity_id_in_feedback_reference(self):
        self.model_instance.feedback_message_references[0]['entity_id'] = (
            'invalid')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for feedback message reference '
                'check of UnsentFeedbackEmailModel\', '
                '[u"Entity id %s: Invalid feedback reference: {u\'thread_id\': '
                'u\'%s\', u\'entity_id\': u\'invalid\', u\'message_id\': 0, '
                'u\'entity_type\': u\'exploration\'}"]]'
            ) % (self.model_instance.id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)


class JobModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(JobModelValidatorTests, self).setUp()

        current_time_str = python_utils.UNICODE(
            int(utils.get_current_time_in_millisecs()))
        random_int = random.randint(0, 1000)
        self.model_instance = job_models.JobModel(
            id='test-%s-%s' % (current_time_str, random_int),
            status_code=job_models.STATUS_CODE_NEW, job_type='test',
            time_queued_msec=1, time_started_msec=10, time_finished_msec=20)
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.JobModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated JobModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

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

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_empty_error(self):
        self.model_instance.status_code = job_models.STATUS_CODE_FAILED
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for error check '
                'of JobModel\', [u\'Entity id %s: '
                'error for job is empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_non_empty_error(self):
        self.model_instance.error = 'invalid'
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for error check '
                'of JobModel\', [u\'Entity id %s: '
                'error: invalid for job is not empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_empty_output(self):
        self.model_instance.status_code = job_models.STATUS_CODE_COMPLETED
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for output check '
                'of JobModel\', [u\'Entity id %s: '
                'output for job is empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_non_empty_output(self):
        self.model_instance.output = 'invalid'
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for output check '
                'of JobModel\', [u\'Entity id %s: '
                'output: invalid for job is not empty but job status is %s\']]'
            ) % (self.model_instance.id, self.model_instance.status_code),
            u'[u\'fully-validated JobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_time_queued_msec(self):
        self.model_instance.time_queued_msec = 15
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time queued check '
                'of JobModel\', [u\'Entity id %s: '
                'time queued 15.0 is greater than time started 10.0\']]'
            ) % self.model_instance.id,
            u'[u\'fully-validated JobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_time_started_msec(self):
        self.model_instance.time_started_msec = 25
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time started check '
                'of JobModel\', [u\'Entity id %s: '
                'time started 25.0 is greater than time finished 20.0\']]'
            ) % self.model_instance.id,
            u'[u\'fully-validated JobModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_time_finished_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.time_finished_msec = current_time_msec * 10.0
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
        run_job_and_check_output(self, expected_output, sort=True)


class ContinuousComputationModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ContinuousComputationModelValidatorTests, self).setUp()

        self.model_instance = job_models.ContinuousComputationModel(
            id='FeedbackAnalyticsAggregator',
            status_code=job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING,
            last_started_msec=1, last_stopped_msec=10, last_finished_msec=20)
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .ContinuousComputationModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ContinuousComputationModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ContinuousComputationModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_invalid_last_started_msec(self):
        self.model_instance.last_started_msec = 25
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last started check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last started 25.0 is greater than both last finished 20.0 '
                'and last stopped 10.0\']]'
            ) % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

    def test_invalid_last_stopped_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.last_stopped_msec = current_time_msec * 10.0
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last stopped check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last stopped %s is greater than the current time\']]'
            ) % (self.model_instance.id, self.model_instance.last_stopped_msec)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_last_finished_msec(self):
        current_time_msec = utils.get_current_time_in_millisecs()
        self.model_instance.last_finished_msec = current_time_msec * 10.0
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last finished check '
                'of ContinuousComputationModel\', [u\'Entity id %s: '
                'last finished %s is greater than the current time\']]'
            ) % (
                self.model_instance.id,
                self.model_instance.last_finished_msec)]
        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = job_models.ContinuousComputationModel(
            id='invalid',
            status_code=job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING,
            last_started_msec=1, last_stopped_msec=10, last_finished_msec=20)
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'ContinuousComputationModel\', '
                '[u\'Entity id invalid: Entity id does not match '
                'regex pattern\']]'
            ), u'[u\'fully-validated ContinuousComputationModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class QuestionModelValidatorTests(test_utils.GenericTestBase):

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
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            skill_ids=['%s' % (i * 2), '%s' % (i * 2 + 1)]
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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

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
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_linked_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for linked_skill_ids field '
                'check of QuestionModel\', '
                '[u"Entity id 0: based on field linked_skill_ids '
                'having value 1, expect model SkillModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

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
                'question-0-1, expect model QuestionCommitLogEntryModel '
                'with id question-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        question_models.QuestionSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for question_summary_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field question_summary_ids having '
                'value 0, expect model QuestionSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        question_models.QuestionSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model QuestionSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        question_models.QuestionSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model QuestionSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class QuestionSkillLinkModelValidatorTests(test_utils.GenericTestBase):

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
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(3)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            skill_ids=['%s' % (2 - i)]
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
        self.model_instance_0.put()
        self.model_instance_1 = (
            question_models.QuestionSkillLinkModel(
                id='1:1', question_id='1', skill_id='1', skill_difficulty=0.5))
        self.model_instance_1.put()
        self.model_instance_2 = (
            question_models.QuestionSkillLinkModel(
                id='2:0', question_id='2', skill_id='0', skill_difficulty=0.5))
        self.model_instance_2.put()

        self.job_class = (
            prod_validation_jobs_one_off.QuestionSkillLinkModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated QuestionSkillLinkModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSkillLinkModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of QuestionSkillLinkModel\', '
                '[u"Entity id 0:2: based on field skill_ids '
                'having value 2, expect model SkillModel with id 2 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'question_ids field check of QuestionSkillLinkModel\', '
                '[u"Entity id 0:2: based on field '
                'question_ids having value 0, expect model QuestionModel '
                'with id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id_failure(self):
        model_with_invalid_id = question_models.QuestionSkillLinkModel(
            id='0:1', question_id='1', skill_id='2', skill_difficulty=0.5)
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'QuestionSkillLinkModel\', [u\'Entity id 0:1: Entity id '
                'does not match regex pattern\']]'
            ), u'[u\'fully-validated QuestionSkillLinkModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)


class ExplorationContextModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationContextModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
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
        self.model_instance_0.put()
        self.model_instance_1 = (
            exp_models.ExplorationContextModel(id='1', story_id='0'))
        self.model_instance_1.put()
        self.model_instance_2 = (
            exp_models.ExplorationContextModel(id='2', story_id='1'))
        self.model_instance_2.put()

        self.job_class = (
            prod_validation_jobs_one_off.ExplorationContextModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationContextModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationContextModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids field '
                'check of ExplorationContextModel\', '
                '[u"Entity id 2: based on field story_ids '
                'having value 1, expect model StoryModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationContextModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exp_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'exp_ids field check of ExplorationContextModel\', '
                '[u"Entity id 2: based on field '
                'exp_ids having value 2, expect model ExplorationModel '
                'with id 2 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ExplorationContextModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class QuestionSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            skill_ids=['%s' % (i * 2), '%s' % (i * 2 + 1)]
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field question_ids '
                'having value 0, expect model QuestionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'question_ids having value 0, expect model '
                'QuestionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'update_question_property'
        }, {
            'cmd': 'create_new_fully_specified_question',
            'invalid_attribute': 'invalid'
        }]
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
        run_job_and_check_output(self, expected_output, sort=True)


class QuestionSnapshotContentModelValidatorTests(test_utils.GenericTestBase):

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
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            skill_ids=['%s' % (i * 2), '%s' % (i * 2 + 1)]
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field question_ids '
                'having value 0, expect model QuestionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'question_ids having value 0, expect model '
                'QuestionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class QuestionCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

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
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            skill_ids=['%s' % (i * 2), '%s' % (i * 2 + 1)]
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids field '
                'check of QuestionCommitLogEntryModel\', '
                '[u"Entity id question-0-1: based on field question_ids '
                'having value 0, expect model QuestionModel with id '
                '0 but it doesn\'t exist", u"Entity id question-0-2: '
                'based on field question_ids having value 0, expect '
                'model QuestionModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionCommitLogEntryModel.create(
                '0', 3, self.owner_id, self.OWNER_USERNAME, 'edit',
                'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.question_id = '0'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            question_models.QuestionCommitLogEntryModel(
                id='invalid-0-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, commit_type='edit',
                commit_message='msg', commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.question_id = '0'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_private_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Post commit status private '
                'is invalid\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'update_question_property'
        }, {
            'cmd': 'create_new_fully_specified_question',
            'invalid_attribute': 'invalid'
        }]
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

        run_job_and_check_output(self, expected_output, sort=True)


class QuestionSummaryModelValidatorTests(test_utils.GenericTestBase):

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
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            skill_ids=['%s' % (i * 2), '%s' % (i * 2 + 1)]
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        question_services.delete_question(self.owner_id, '1')
        question_services.delete_question(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_question_model_failure(self):
        question_model = question_models.QuestionModel.get_by_id('0')
        question_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.question_model_last_updated = (
            question_model.last_updated)
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSummaryModel\', '
                '[u"Entity id 0: based on field question_ids having '
                'value 0, expect model QuestionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_question_content(self):
        self.model_instance_0.question_content = '<p>invalid</p>'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question content check '
                'of QuestionSummaryModel\', [u\'Entity id 0: Question '
                'content: <p>invalid</p> does not match content html '
                'in question state data in question model: <p>Test</p>\']]'
            ), u'[u\'fully-validated QuestionSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_question_related_property(self):
        mock_time = datetime.datetime.utcnow() - datetime.timedelta(
            days=2)
        actual_time = self.model_instance_0.question_model_created_on
        self.model_instance_0.question_model_created_on = mock_time
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
        ) for i in python_utils.RANGE(6)]

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

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationRecommendationsModelAuditOneOffJob)

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
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {}, u\'Art\': {u\'Biology\': u\'0.5\', '
            'u\'Art\': u\'1.0\'}} fails with error: Length of topic '
            'similarities columns: 1 does not match length of '
            'topic list: 2."]]')]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_topic(self):
        content = {
            'Art': {'Art': '1.0', 'invalid': '0.5'},
            'invalid': {'Art': '0.5', 'invalid': '1.0'}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Art\': {u\'Art\': u\'1.0\', u\'invalid\': u\'0.5\'}, '
            'u\'invalid\': {u\'Art\': u\'0.5\', u\'invalid\': u\'1.0\'}} '
            'fails with error: Topic invalid not in list of known topics."]]')]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_topic_similarities_rows(self):
        content = {
            'Art': {'Art': '1.0', 'Biology': '0.5'}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', [u"Entity id topics: '
            'Topic similarity validation for content: {u\'Art\': '
            '{u\'Biology\': u\'0.5\', u\'Art\': u\'1.0\'}} fails with '
            'error: Length of topic similarities rows: 2 does not match '
            'length of topic list: 1."]]')]

        run_job_and_check_output(self, expected_output)

    def test_model_with_invalid_similarity_type(self):
        content = {
            'Art': {'Art': 'one', 'Biology': 0.5},
            'Biology': {'Art': 0.5, 'Biology': 1.0}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity '
            'check of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {u\'Biology\': 1.0, u\'Art\': 0.5}, '
            'u\'Art\': {u\'Biology\': 0.5, u\'Art\': u\'one\'}} '
            'fails with error: Expected similarity to be a float, '
            'received one"]]')]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_similarity_value(self):
        content = {
            'Art': {'Art': 10.0, 'Biology': 0.5},
            'Biology': {'Art': 0.5, 'Biology': 1.0}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {u\'Biology\': 1.0, u\'Art\': 0.5}, '
            'u\'Art\': {u\'Biology\': 0.5, u\'Art\': 10.0}} '
            'fails with error: Expected similarity to be between '
            '0.0 and 1.0, received 10.0"]]')]

        run_job_and_check_output(self, expected_output)

    def test_model_with_assymetric_content(self):
        content = {
            'Art': {'Art': 1.0, 'Biology': 0.5},
            'Biology': {'Art': 0.6, 'Biology': 1.0}
        }
        self.model_instance.content = content
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity '
            'check of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {u\'Biology\': 1.0, u\'Art\': 0.6}, '
            'u\'Art\': {u\'Biology\': 0.5, u\'Art\': 1.0}} fails with error: '
            'Expected topic similarities to be symmetric."]]')]

        run_job_and_check_output(self, expected_output)


class SkillModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(SkillModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        self.set_admins([self.ADMIN_USERNAME])

        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(3)]

        for i in python_utils.RANGE(2):
            skill = skill_domain.Skill.create_default_skill(
                '%s' % (i + 3),
                description='description %d' % (i + 3),
                rubrics=rubrics)
            skill_services.save_new_skill(self.owner_id, skill)

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )
        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            if index < 2:
                skill.superseding_skill_id = '%s' % (index + 3)
                skill.all_questions_merged = True
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = skill_models.SkillModel.get_by_id('0')
        self.model_instance_1 = skill_models.SkillModel.get_by_id('1')
        self.model_instance_2 = skill_models.SkillModel.get_by_id('2')
        self.superseding_skill_0 = skill_models.SkillModel.get_by_id('3')
        self.superseding_skill_1 = skill_models.SkillModel.get_by_id('4')

        self.job_class = (
            prod_validation_jobs_one_off.SkillModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')

        expected_output = [
            u'[u\'fully-validated SkillModel\', 5]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of SkillModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated SkillModel\', 4]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_0.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.superseding_skill_0.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.superseding_skill_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_2.id, self.model_instance_2.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_skill_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'SkillModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated SkillModel\', 4]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_all_questions_merged(self):
        question_models.QuestionSkillLinkModel(
            id='question1-0', question_id='question1', skill_id='0',
            skill_difficulty=0.5).put()
        expected_output = [
            (
                u'[u\'failed validation check for all questions merged '
                'check of SkillModel\', '
                '[u"Entity id 0: all_questions_merged is True but the '
                'following question ids are still linked to the skill: '
                '[u\'question1\']"]]'
            ), u'[u\'fully-validated SkillModel\', 4]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_superseding_skill_model_failure(self):
        self.superseding_skill_0.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for superseding_skill_ids field '
                'check of SkillModel\', '
                '[u"Entity id 0: based on field superseding_skill_ids '
                'having value 3, expect model SkillModel with id 3 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_skill_commit_log_entry_model_failure(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'skill_commit_log_entry_ids field check of '
                'SkillModel\', '
                '[u"Entity id 0: based on field '
                'skill_commit_log_entry_ids having value '
                'skill-0-1, expect model SkillCommitLogEntryModel '
                'with id skill-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        skill_models.SkillSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for skill_summary_ids '
                'field check of SkillModel\', '
                '[u"Entity id 0: based on field skill_summary_ids having '
                'value 0, expect model SkillSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        skill_models.SkillSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of SkillModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model SkillSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        skill_models.SkillSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of SkillModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model SkillSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        run_job_and_check_output(self, expected_output, sort=True)


class SkillSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

    def setUp(self):
        super(SkillSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )

        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            if index == 0:
                skill_services.save_new_skill(self.user_id, skill)
            else:
                skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SkillSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillSnapshotMetadataModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field skill_ids '
                'having value 0, expect model SkillModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'skill_ids having value 0, expect model '
                'SkillModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'SkillSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_skill_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            skill_models.SkillSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill model '
                'version check of SkillSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Skill model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated SkillSnapshotMetadataModel\', '
                '3]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_skill_misconception'
        }, {
            'cmd': 'delete_skill_misconception',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_skill_misconception check of '
                'SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_skill_misconception\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'misconception_id, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_skill_misconception check of '
                'SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_skill_misconception\'} '
                'failed with error: The following required attributes '
                'are missing: new_misconception_dict"]]'
            ), u'[u\'fully-validated SkillSnapshotMetadataModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class SkillSnapshotContentModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(SkillSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )
        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SkillSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillSnapshotContentModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of SkillSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field skill_ids '
                'having value 0, expect model SkillModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'skill_ids having value 0, expect model '
                'SkillModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_skill_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            skill_models.SkillSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill model '
                'version check of SkillSnapshotContentModel\', '
                '[u\'Entity id 0-3: Skill model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated SkillSnapshotContentModel\', '
                '3]')]
        run_job_and_check_output(self, expected_output, sort=True)


class SkillCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(SkillCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )
        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-0-1'))
        self.model_instance_1 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-1-1'))
        self.model_instance_2 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SkillCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillCommitLogEntryModel\', 4]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()

        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of SkillCommitLogEntryModel\', '
                '[u"Entity id skill-0-1: based on field skill_ids '
                'having value 0, expect model SkillModel with id '
                '0 but it doesn\'t exist", u"Entity id skill-0-2: '
                'based on field skill_ids having value 0, expect '
                'model SkillModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_skill_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            skill_models.SkillCommitLogEntryModel.create(
                '0', 3, self.owner_id, self.OWNER_USERNAME, 'edit',
                'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.skill_id = '0'
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill model '
                'version check of SkillCommitLogEntryModel\', '
                '[u\'Entity id %s: Skill model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated SkillCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            skill_models.SkillCommitLogEntryModel(
                id='invalid-0-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, commit_type='edit',
                commit_message='msg', commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.skill_id = '0'
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'SkillCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'SkillCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated SkillCommitLogEntryModel\', 3]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'SkillCommitLogEntryModel\', '
                '[u\'Entity id skill-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of SkillCommitLogEntryModel\', '
                '[u\'Entity id skill-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_private_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of SkillCommitLogEntryModel\', '
                '[u\'Entity id skill-0-1: Post commit status private '
                'is invalid\']]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_skill_misconception'
        }, {
            'cmd': 'delete_skill_misconception',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'add_skill_misconception check of SkillCommitLogEntryModel\', '
                '[u"Entity id skill-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_skill_misconception\'} '
                'failed with error: The following required attributes are '
                'missing: new_misconception_dict"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'delete_skill_misconception check of '
                'SkillCommitLogEntryModel\', '
                '[u"Entity id skill-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_skill_misconception\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'misconception_id, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']

        run_job_and_check_output(self, expected_output, sort=True)


class SkillSummaryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(SkillSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            description='description %d' % i,
            rubrics=rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )

        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = skill_models.SkillSummaryModel.get_by_id('0')
        self.model_instance_1 = skill_models.SkillSummaryModel.get_by_id('1')
        self.model_instance_2 = skill_models.SkillSummaryModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.SkillSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillSummaryModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated SkillSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        skill_services.delete_skill(self.owner_id, '1')
        skill_services.delete_skill(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_skill_model_failure(self):
        skill_model = skill_models.SkillModel.get_by_id('0')
        skill_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.skill_model_last_updated = (
            skill_model.last_updated)
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of SkillSummaryModel\', '
                '[u"Entity id 0: based on field skill_ids having '
                'value 0, expect model SkillModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_misconception_count(self):
        self.model_instance_0.misconception_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for misconception count '
                'check of SkillSummaryModel\', '
                '[u"Entity id 0: Misconception count: 10 does not match '
                'the number of misconceptions in skill model: '
                '[{u\'id\': 0, u\'must_be_addressed\': True, '
                'u\'notes\': u\'<p>notes</p>\', u\'name\': u\'name\', '
                'u\'feedback\': u\'<p>default_feedback</p>\'}]"]]'
            ), u'[u\'fully-validated SkillSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_worked_examples_count(self):
        self.model_instance_0.worked_examples_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for worked examples '
                'count check of SkillSummaryModel\', '
                '[u"Entity id 0: Worked examples count: 10 does not '
                'match the number of worked examples in skill_contents '
                'in skill model: [{u\'explanation\': {u\'content_id\': u\'3\', '
                'u\'html\': u\'<p>Example Explanation 1</p>\'}, u\'question\': '
                '{u\'content_id\': u\'2\', u\'html\': u\'<p>Example Question '
                '1</p>\'}}]"]]'
            ), u'[u\'fully-validated SkillSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_skill_related_property(self):
        self.model_instance_0.description = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for description field check of '
                'SkillSummaryModel\', '
                '[u\'Entity id %s: description field in entity: invalid does '
                'not match corresponding skill description field: '
                'description 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SkillSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class StoryModelValidatorTests(test_utils.GenericTestBase):

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
            title='title %d' % i,
            corresponding_topic_id='0'
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
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
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
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
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
        run_job_and_check_output(self, expected_output, sort=True)


class StorySnapshotContentModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StorySnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
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


class StoryCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StoryCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
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
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'StoryCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
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

        run_job_and_check_output(self, expected_output, sort=True)


class StorySummaryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StorySummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        language_codes = ['ar', 'en', 'en']

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
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
        story_model = story_models.StoryModel.get_by_id('0')
        story_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.story_model_last_updated = (
            story_model.last_updated)
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StorySummaryModel\', '
                '[u"Entity id 0: based on field story_ids having '
                'value 0, expect model StoryModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated StorySummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_node_titles(self):
        self.model_instance_0.node_titles = ['Title 1']
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for node titles check of '
                'StorySummaryModel\', [u"Entity id 0: Node titles: '
                '[u\'Title 1\'] does not match the nodes in story_contents '
                'dict: []"]]'
            ), u'[u\'fully-validated StorySummaryModel\', 2]']
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


class GeneralSuggestionModelValidatorTests(test_utils.GenericTestBase):

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
            self.admin_id, change, score_category, self.thread_id)
        self.model_instance = (
            suggestion_models.GeneralSuggestionModel.get_by_id(self.thread_id))

        self.job_class = (
            prod_validation_jobs_one_off.GeneralSuggestionModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralSuggestionModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralSuggestionModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]
        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expect model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_feedback_thread_model_failure(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for feedback_thread_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field feedback_thread_ids having '
                'value %s, expect model GeneralFeedbackThreadModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expect model UserSettingsModel with id %s but it doesn\'t '
                'exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_reviewer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for reviewer_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field reviewer_ids having value '
                '%s, expect model UserSettingsModel with id %s but it doesn\'t '
                'exist"]]') % (
                    self.model_instance.id, self.admin_id, self.admin_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_target_version(self):
        self.model_instance.target_version_at_submission = 5
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for target version at submission'
                ' check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'target version 5 in entity is greater than the '
                'version 1 of exploration corresponding to id 0\']]'
            ) % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_empty_final_reviewer_id(self):
        self.model_instance.final_reviewer_id = None
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final reviewer '
                'check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'Final reviewer id is empty but suggestion is accepted\']]'
            ) % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_non_empty_final_reviewer_id(self):
        self.model_instance.status = suggestion_models.STATUS_IN_REVIEW
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final reviewer '
                'check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'Final reviewer id %s is not empty but '
                'suggestion is in review\']]'
            ) % (self.model_instance.id, self.admin_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_schema(self):
        self.model_instance.score_category = 'invalid.invalid'
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check '
                'of GeneralSuggestionModel\', [u\'Entity id %s: Entity '
                'fails domain validation with the error Expected the first '
                'part of score_category to be among allowed choices, '
                'received invalid\']]'
            ) % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_target_type(self):
        expected_output = [
            (
                u'[u\'failed validation check for target type check '
                'of GeneralSuggestionModel\', [u\'Entity id %s: Target '
                'type exploration is not allowed\']]'
            ) % self.model_instance.id]
        with self.swap(
            prod_validation_jobs_one_off, 'TARGET_TYPE_TO_TARGET_MODEL', {}):
            run_job_and_check_output(self, expected_output, sort=True)


class GeneralVoiceoverApplicationModelValidatorTests(
        test_utils.GenericTestBase):
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralVoiceoverApplicationModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]
        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of GeneralVoiceoverApplicationModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expect model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralVoiceoverApplicationModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expect model UserSettingsModel with id %s but it doesn\'t '
                'exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_reviewer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for final_reviewer_ids field '
                'check of GeneralVoiceoverApplicationModel\', '
                '[u"Entity id %s: based on field final_reviewer_ids having '
                'value %s, expect model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.admin_id, self.admin_id)]
        run_job_and_check_output(self, expected_output, sort=True)

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
            run_job_and_check_output(self, expected_output, sort=True)


class TopicModelValidatorTests(test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i,
                description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
            topic_models.TopicRightsAllUsersModel(
                id='%s' % index, all_user_ids=[self.owner_id]).put()

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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

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
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for story_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field story_ids having value '
                '1, expect model StoryModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field skill_ids having value '
                '1, expect model SkillModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_subtopic_page_model_failure(self):
        topic_models.SubtopicPageModel.get_by_id('0-1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field subtopic_page_ids having value '
                '0-1, expect model SubtopicPageModel with id 0-1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

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
                'topic-0-1, expect model TopicCommitLogEntryModel '
                'with id topic-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_summary_model_failure(self):
        topic_models.TopicSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for topic_summary_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field topic_summary_ids having '
                'value 0, expect model TopicSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field topic_rights_ids having '
                'value 0, expect model TopicRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        topic_models.TopicSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model TopicSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        topic_models.TopicSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model TopicSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_rights_all_users_failure(self):
        topic_models.TopicRightsAllUsersModel.get_by_id('0').delete()
        expected_output = [
            (
                u'[u\'failed validation check for all_users_model_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field all_users_model_ids having '
                'value 0, expect model TopicRightsAllUsersModel '
                'with id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

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
        run_job_and_check_output(self, expected_output, literal_eval=True)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_uncategorized_skill_id_in_subtopic(self):
        self.model_instance_0.uncategorized_skill_ids = ['0', '6']
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for uncategorized skill '
                'ids check of TopicModel\', '
                '[u\'Entity id 0: uncategorized skill id 0 is present '
                'in subtopic for entity with id 1\']]'
            ), u'[u\'fully-validated TopicModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class TopicSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i,
                description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field topic_ids '
                'having value 0, expect model TopicModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_ids having value 0, expect model '
                'TopicModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_subtopic'
        }, {
            'cmd': 'delete_subtopic',
            'invalid_attribute': 'invalid'
        }]
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
        run_job_and_check_output(self, expected_output, sort=True)


class TopicSnapshotContentModelValidatorTests(test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field topic_ids '
                'having value 0, expect model TopicModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_ids having value 0, expect model '
                'TopicModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class TopicRightsModelValidatorTests(test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field topic_ids having '
                'value 0, expect model TopicModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_manager_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.manager1_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for manager_user_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field manager_user_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.manager1_id, self.manager1_id),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expect model '
                'TopicRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        topic_models.TopicRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expect model TopicRightsSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class TopicRightsSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field topic_rights_ids '
                'having value 0, expect model TopicRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_rights_ids having value 0, expect model '
                'TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_role',
            'assignee_id': 'id',
            'new_role': 'manager'
        }, {
            'cmd': 'publish_topic',
            'invalid_attribute': 'invalid'
        }]
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
        run_job_and_check_output(self, expected_output, sort=True)


class TopicRightsSnapshotContentModelValidatorTests(
        test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field topic_rights_ids '
                'having value 0, expect model TopicRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_rights_ids having value 0, expect model '
                'TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotContentModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
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
        run_job_and_check_output(self, expected_output, sort=True)


class TopicRightsAllUsersModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TopicRightsAllUsersModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        manager1_email = 'user@manager1.com'
        self.signup(manager1_email, 'manager1')
        self.set_topic_managers(['manager1'])
        self.manager1_id = self.get_user_id_from_email(manager1_email)
        self.manager1 = user_services.UserActionsInfo(self.manager1_id)

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev%s' % i,
            'description%s' % i) for i in python_utils.RANGE(3)]

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic_services.save_new_topic(self.owner_id, topic)

        topic_services.assign_role(
            self.admin, self.manager1, topic_domain.ROLE_MANAGER, '0')

        user_id_migration.AddAllUserIdsSnapshotContentVerificationJob.enqueue(
            user_id_migration.AddAllUserIdsSnapshotContentVerificationJob
            .create_new()
        )
        self.process_and_flush_pending_tasks()

        self.model_instance_0 = (
            topic_models.TopicRightsAllUsersModel.get_by_id('0'))
        self.model_instance_1 = (
            topic_models.TopicRightsAllUsersModel.get_by_id('1'))
        self.model_instance_2 = (
            topic_models.TopicRightsAllUsersModel.get_by_id('2'))

        self.job_class = (
            prod_validation_jobs_one_off.TopicRightsAllUsersModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TopicRightsAllUsersModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicRightsAllUsersModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicRightsAllUsersModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsAllUsersModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicRightsAllUsersModel\', '
                '[u"Entity id 0: based on field topic_rights_ids '
                'having value 0, expect model TopicRightsModel with '
                'id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated TopicRightsAllUsersModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.manager1_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for all_user_ids '
                'field check of TopicRightsAllUsersModel\', '
                '[u"Entity id 0: based on field all_user_ids '
                'having value %s, expect model UserSettingsModel with '
                'id %s but it doesn\'t exist"]]'
            ) % (self.manager1_id, self.manager1_id),
            u'[u\'fully-validated TopicRightsAllUsersModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class TopicCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

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

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field check '
                'of TopicCommitLogEntryModel\', '
                '[u"Entity id rights-0-1: based on field topic_ids '
                'having value 0, expect model TopicModel with id 0 '
                'but it doesn\'t exist", u"Entity id topic-0-1: '
                'based on field topic_ids having value 0, expect model '
                'TopicModel with id 0 but it doesn\'t exist", '
                'u"Entity id topic-0-2: based on field topic_ids having '
                'value 0, expect model TopicModel with id 0 but '
                'it doesn\'t exist"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 4]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids field '
                'check of TopicCommitLogEntryModel\', '
                '[u"Entity id rights-0-1: based on field topic_rights_ids '
                'having value 0, expect model TopicRightsModel with id 0 '
                'but it doesn\'t exist", u"Entity id rights-0-2: based '
                'on field topic_rights_ids having value 0, expect '
                'model TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicCommitLogEntryModel.create(
                '0', 3, self.owner_id, self.OWNER_USERNAME, 'edit',
                'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.topic_id = '0'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            topic_models.TopicCommitLogEntryModel(
                id='invalid-0-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, commit_type='edit',
                commit_message='msg', commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.topic_id = '0'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'TopicCommitLogEntryModel\', '
                '[u\'Entity id topic-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of TopicCommitLogEntryModel\', '
                '[u\'Entity id topic-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'public'
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_subtopic'
        }, {
            'cmd': 'delete_subtopic',
            'invalid_attribute': 'invalid'
        }]
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

        run_job_and_check_output(self, expected_output, sort=True)


class TopicSummaryModelValidatorTests(test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        topic_services.delete_topic(self.owner_id, '1')
        topic_services.delete_topic(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_model = topic_models.TopicModel.get_by_id('0')
        topic_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.topic_model_last_updated = (
            topic_model.last_updated)
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSummaryModel\', '
                '[u"Entity id 0: based on field topic_ids having '
                'value 0, expect model TopicModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_canonical_story_count(self):
        self.model_instance_0.canonical_story_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for canonical story '
                'count check of TopicSummaryModel\', '
                '[u"Entity id 0: Canonical story count: 10 does not '
                'match the number of story ids in canonical_story_ids '
                'in topic model: [u\'1\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_additional_story_count(self):
        self.model_instance_0.additional_story_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for additional story '
                'count check of TopicSummaryModel\', '
                '[u"Entity id 0: Additional story count: 10 does not '
                'match the number of story ids in '
                'additional_story_ids in topic model: [u\'0\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_uncategorized_skill_count(self):
        self.model_instance_0.uncategorized_skill_count = 10
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_total_skill_count(self):
        self.model_instance_0.total_skill_count = 10
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_subtopic_count(self):
        self.model_instance_0.subtopic_count = 10
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic count check of Topi'
                'cSummaryModel\', [u"Entity id 0: Subtopic count: 10 does not '
                'match the total number of subtopics in topic model: [{u\'thum'
                'bnail_bg_color\': None, u\'skill_ids\': [u\'0\', '
                'u\'1\'], u\'id\': 1, u\'thumbnail_filename\': None, u\'title'
                '\': u\'subtopic1\'}] "]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_topic_related_property(self):
        self.model_instance_0.name = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for name field check of '
                'TopicSummaryModel\', '
                '[u\'Entity id %s: name field in entity: invalid does not '
                'match corresponding topic name field: topic0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicSummaryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class SubtopicPageModelValidatorTests(test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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

        self.model_instance_0 = topic_models.SubtopicPageModel.get_by_id('0-1')
        self.model_instance_1 = topic_models.SubtopicPageModel.get_by_id('1-1')
        self.model_instance_2 = topic_models.SubtopicPageModel.get_by_id('2-1')

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
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

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
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field '
                'check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field topic_ids having value '
                '0, expect model TopicModel with id 0 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

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
        topic_models.SubtopicPageCommitLogEntryModel.get_by_id(
            'subtopicpage-0-1-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'subtopic_page_commit_log_entry_ids field check of '
                'SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field '
                'subtopic_page_commit_log_entry_ids having value '
                'subtopicpage-0-1-1, expect model '
                'SubtopicPageCommitLogEntryModel '
                'with id subtopicpage-0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_metadata_model_failure(self):
        topic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
            '0-1-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field snapshot_metadata_ids having '
                'value 0-1-1, expect model SubtopicPageSnapshotMetadataModel '
                'with id 0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_snapshot_content_model_failure(self):
        topic_models.SubtopicPageSnapshotContentModel.get_by_id(
            '0-1-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field snapshot_content_ids having '
                'value 0-1-1, expect model SubtopicPageSnapshotContentModel '
                'with id 0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)


class SubtopicPageSnapshotMetadataModelValidatorTests(
        test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
            topic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '0-1-1'))
        self.model_instance_1 = (
            topic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '1-1-1'))
        self.model_instance_2 = (
            topic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_subtopic_page_model_failure(self):
        topic_models.SubtopicPageModel.get_by_id('0-1').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: based on field subtopic_page_ids '
                'having value 0-1, expect model SubtopicPageModel with '
                'id 0-1 but it doesn\'t exist", u"Entity id 0-1-2: based '
                'on field subtopic_page_ids having value 0-1, expect model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: based on field committer_ids having '
                'value %s, expect model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_subtopic_page_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.SubtopicPageSnapshotMetadataModel(
                id='0-1-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'create_new',
            'invalid_attribute': 'invalid'
        }]
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
        run_job_and_check_output(self, expected_output, sort=True)


class SubtopicPageSnapshotContentModelValidatorTests(
        test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
            topic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '0-1-1'))
        self.model_instance_1 = (
            topic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '1-1-1'))
        self.model_instance_2 = (
            topic_models.SubtopicPageSnapshotContentModel.get_by_id(
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_subtopic_page_model_failure(self):
        topic_models.SubtopicPageModel.get_by_id('0-1').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageSnapshotContentModel\', '
                '[u"Entity id 0-1-1: based on field subtopic_page_ids '
                'having value 0-1, expect model SubtopicPageModel with '
                'id 0-1 but it doesn\'t exist", u"Entity id 0-1-2: based '
                'on field subtopic_page_ids having value 0-1, expect model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotContentModel\', 2]')]
        run_job_and_check_output(
            self, expected_output, literal_eval=True)

    def test_invalid_subtopic_page_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.SubtopicPageSnapshotContentModel(id='0-1-3'))
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
        run_job_and_check_output(self, expected_output, sort=True)


class SubtopicPageCommitLogEntryModelValidatorTests(test_utils.GenericTestBase):

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
            'abbrev%s' % i,
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
                skill_id='%s' % i, description='skill%s' % i, rubrics=rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d',
            corresponding_topic_id='%s' % (python_utils.divide(i, 2))
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
            topic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-0-1-1'))
        self.model_instance_1 = (
            topic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-1-1-1'))
        self.model_instance_2 = (
            topic_models.SubtopicPageCommitLogEntryModel.get_by_id(
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_subtopic_page_model_failure(self):
        topic_models.SubtopicPageModel.get_by_id('0-1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageCommitLogEntryModel\', '
                '[u"Entity id subtopicpage-0-1-1: based on field '
                'subtopic_page_ids having value 0-1, expect model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist", '
                'u"Entity id subtopicpage-0-1-2: based on field '
                'subtopic_page_ids having value 0-1, expect model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.SubtopicPageCommitLogEntryModel.create(
                '0-1', 3, self.owner_id, self.OWNER_USERNAME, 'edit',
                'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.subtopic_page_id = '0-1'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            topic_models.SubtopicPageCommitLogEntryModel(
                id='invalid-0-1-1', user_id=self.owner_id,
                username=self.OWNER_USERNAME, commit_type='edit',
                commit_message='msg', commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.subtopic_page_id = '0-1'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id subtopicpage-0-1-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id subtopicpage-0-1-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'public'
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'create_new',
            'invalid_attribute': 'invalid'
        }]
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
        run_job_and_check_output(self, expected_output, sort=True)


class UserSettingsModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserSettingsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        # Note: There will a total of 3 UserSettingsModel even though
        # only two users signup in the test since superadmin signup
        # is also done in test_utils.GenericTestBase.
        self.model_instance_0 = user_models.UserSettingsModel.get_by_id(
            self.user_id)
        self.model_instance_1 = user_models.UserSettingsModel.get_by_id(
            self.admin_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSettingsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSettingsModel\', 3]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        user_models.UserSettingsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        mock_time = (
            datetime.datetime.utcnow() - datetime.timedelta(days=1))
        self.model_instance_0.last_logged_in = mock_time
        self.model_instance_0.last_agreed_to_terms = mock_time
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSettingsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance_0.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_contributions_model_failure(self):
        user_models.UserContributionsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_contributions_ids '
                'field check of UserSettingsModel\', '
                '[u"Entity id %s: based on '
                'field user_contributions_ids having value '
                '%s, expect model UserContributionsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserSettingsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_invalid_schema(self):
        self.model_instance_1.email = 'invalid'
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'UserSettingsModel\', '
                '[u\'Entity id %s: Entity fails domain validation '
                'with the error Invalid email address: invalid\']]'
            ) % self.admin_id,
            u'[u\'fully-validated UserSettingsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_time_field(self):
        self.model_instance_0.last_created_an_exploration = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_first_contribution_msec(self):
        self.model_instance_0.first_contribution_msec = (
            utils.get_current_time_in_millisecs() * 10)
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
        run_job_and_check_output(self, expected_output, sort=True)


class UserNormalizedNameAuditOneOffJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserNormalizedNameAuditOneOffJobTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        # Note: There will a total of 3 UserSettingsModel even though
        # only two users signup in the test since superadmin signup
        # is also done in test_utils.GenericTestBase.
        self.model_instance_0 = user_models.UserSettingsModel.get_by_id(
            self.user_id)
        self.model_instance_1 = user_models.UserSettingsModel.get_by_id(
            self.admin_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserNormalizedNameAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = []
        run_job_and_check_output(self, expected_output)

    def test_repeated_normalized_username(self):
        self.model_instance_1.normalized_username = USER_NAME
        self.model_instance_1.put()
        sorted_user_ids = sorted([self.user_id, self.admin_id])
        expected_output = [(
            u'[u\'failed validation check for normalized username '
            'check of UserSettingsModel\', '
            'u"Users with ids [\'%s\', \'%s\'] have the same normalized '
            'username username"]') % (
                sorted_user_ids[0], sorted_user_ids[1])]
        run_job_and_check_output(self, expected_output, literal_eval=True)


class CompletedActivitiesModelValidatorTests(test_utils.GenericTestBase):

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

        intro_state.update_interaction_id('TextInput')
        end_state.update_interaction_id('EndExploration')

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CompletedActivitiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expect model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '4, expect model CollectionModel with id 4 but it '
                'doesn\'t exist"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_common_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in IncompleteActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_common_collection(self):
        self.model_instance.collection_ids.append('3')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in IncompleteActivitiesModel: [u\'3\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of CompletedActivitiesModel\', '
                '[u"Entity id %s: Explorations with ids [u\'exp\'] are '
                'private"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of CompletedActivitiesModel\', '
                '[u"Entity id %s: Collections with ids [u\'col\'] are '
                'private"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)


class IncompleteActivitiesModelValidatorTests(test_utils.GenericTestBase):

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

            intro_state.update_interaction_id('TextInput')
            end_state.update_interaction_id('EndExploration')

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'IncompleteActivitiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expect model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '4, expect model CollectionModel with id 4 but it '
                'doesn\'t exist"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_common_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in CompletedActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_common_collection(self):
        self.model_instance.collection_ids.append('3')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in CompletedActivitiesModel: [u\'3\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of IncompleteActivitiesModel\', '
                '[u"Entity id %s: Explorations with ids [u\'exp\'] are '
                'private"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of IncompleteActivitiesModel\', '
                '[u"Entity id %s: Collections with ids [u\'col\'] are '
                'private"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)


class ExpUserLastPlaythroughModelValidatorTests(
        test_utils.GenericTestBase):

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

        intro_state.update_interaction_id('TextInput')
        end_state.update_interaction_id('EndExploration')

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExpUserLastPlaythroughModel\', '
            '[u\'Entity id %s.0: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: based on field exploration_ids having '
                'value 0, expect model ExplorationModel with id 0 but it '
                'doesn\'t exist"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_complete_exploration_in_exploration_id(self):
        self.model_instance.exploration_id = '1'
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_private_exploration(self):
        rights_manager.unpublish_exploration(self.owner, '0')
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: Explorations with ids [u\'0\'] are '
                'private"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_invalid_version(self):
        self.model_instance.last_played_exp_version = 10
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for version check '
                'of ExpUserLastPlaythroughModel\', '
                '[u\'Entity id %s.0: last played exp version 10 is greater '
                'than current version 1 of exploration with id 0\']]') % (
                    self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_state_name(self):
        self.model_instance.last_played_state_name = 'invalid'
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for state name check '
                'of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: last played state name invalid is not '
                'present in exploration states [u\'Introduction\', u\'End\'] '
                'for exploration id 0"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)


class LearnerPlaylistModelValidatorTests(test_utils.GenericTestBase):

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

        intro_state.update_interaction_id('TextInput')
        end_state.update_interaction_id('EndExploration')

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'LearnerPlaylistModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expect model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('6').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '6, expect model CollectionModel with id 6 but it '
                'doesn\'t exist"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_common_completed_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in CompletedActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_common_incomplete_exploration(self):
        self.model_instance.exploration_ids.append('1')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in IncompleteActivitiesModel: [u\'1\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_common_completed_collection(self):
        self.model_instance.collection_ids.append('4')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in CompletedActivitiesModel: [u\'4\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_common_incomplete_collection(self):
        self.model_instance.collection_ids.append('5')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in IncompleteActivitiesModel: [u\'5\']"]]') % (
                self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of LearnerPlaylistModel\', '
                '[u"Entity id %s: Explorations with ids [u\'exp\'] are '
                'private"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of LearnerPlaylistModel\', '
                '[u"Entity id %s: Collections with ids [u\'col\'] are '
                'private"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)


class UserContributionsModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

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

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserContributionsModel\', 2]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_created_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for created_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field created_exploration_ids '
                'having value exp1, expect model ExplorationModel with id '
                'exp1 but it doesn\'t exist"]]' % self.owner_id
            ), (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp1, expect model ExplorationModel with '
                'id exp1 but it doesn\'t exist"]]' % self.owner_id
            ), u'[u\'fully-validated UserContributionsModel\', 2]']

        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_edited_exploration_model_failure(self):
        self.model_instance_0.delete()
        exp_models.ExplorationModel.get_by_id('exp0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp0, expect model ExplorationModel with '
                'id exp0 but it doesn\'t exist"]]' % self.user_id
            ), u'[u\'fully-validated UserContributionsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class UserEmailPreferencesModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserEmailPreferencesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserEmailPreferencesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)


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
        self.process_and_flush_pending_tasks()

        self.model_instance = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSubscriptionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscriptionsModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserSubscriptionsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscriptionsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_invalid_last_checked(self):
        self.model_instance.last_checked = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last checked check of '
                'UserSubscriptionsModel\', '
                '[u\'Entity id %s: last checked %s is greater than the time '
                'when job was run\']]' % (
                    self.user_id, self.model_instance.last_checked)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_user_id_in_subscriber_ids(self):
        subscriber_model = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        subscriber_model.subscriber_ids.remove(self.user_id)
        subscriber_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscriptionsModel\', [u\'Entity id %s: '
                'User id is not present in subscriber ids of creator '
                'with id %s to whom the user has subscribed\']]' % (
                    self.user_id, self.owner_id)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_subscriber_model_failure(self):
        user_models.UserSubscribersModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id %s: based on '
                'field subscriber_ids having value '
                '%s, expect model UserSubscribersModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.owner_id, self.owner_id),
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

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
                'nonexist_thread_id, expect model GeneralFeedbackThreadModel '
                'with id nonexist_thread_id but it doesn\'t '
                'exist"]]') % self.user_id,
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class UserSubscribersModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscribersModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.owner_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_user_id_in_subscriber_ids(self):
        self.model_instance.subscriber_ids.append(self.owner_id)
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscribersModel\', [u\'Entity id %s: User id is '
                'present in subscriber ids for user\']]' % self.owner_id
            ), (
                u'[u\'failed validation check for subscription_ids field '
                'check of UserSubscribersModel\', [u"Entity id %s: '
                'based on field subscription_ids having value %s, expect model '
                'UserSubscriptionsModel with id %s but it doesn\'t exist"]]'
            ) % (self.owner_id, self.owner_id, self.owner_id)]

        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_user_id_in_creator_ids(self):
        subscription_model = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        subscription_model.creator_ids.remove(self.owner_id)
        subscription_model.put()
        expected_output = [(
            u'[u\'failed validation check for subscription creator id '
            'check of UserSubscribersModel\', [u\'Entity id %s: User id '
            'is not present in creator ids to which the subscriber of user '
            'with id %s has subscribed\']]') % (self.owner_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.owner_id, self.owner_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_user_subscriptions_model_failure(self):
        user_models.UserSubscriptionsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscription_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field subscription_ids having value '
                '%s, expect model UserSubscriptionsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)


class UserRecentChangesBatchModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserRecentChangesBatchModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = user_models.UserRecentChangesBatchModel(
            id=self.user_id, job_queued_msec=10)
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off
            .UserRecentChangesBatchModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserRecentChangesBatchModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_invalid_job_queued_msec(self):
        self.model_instance.job_queued_msec = (
            utils.get_current_time_in_millisecs() * 10)
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for job queued msec check of '
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: job queued msec %s is greater than the time '
            'when job was run\']]'
        ) % (self.user_id, self.model_instance.job_queued_msec)]
        run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserRecentChangesBatchModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)


class UserStatsModelValidatorTests(test_utils.GenericTestBase):

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
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off.UserStatsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserStatsModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

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
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserStatsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_invalid_schema_version(self):
        self.model_instance.schema_version = (
            feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION + 10)
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for schema version check of '
            'UserStatsModel\', '
            '[u\'Entity id %s: schema version %s is greater than current '
            'version %s\']]'
        ) % (
            self.user_id, self.model_instance.schema_version,
            feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_key_type_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            'invalid': {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats list '
            'of UserStatsModel\', [u"Entity id %s: Invalid stats dict: '
            '{u\'invalid\': {u\'num_ratings\': 5, u\'average_ratings\': 4, '
            'u\'total_plays\': 5}}"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

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
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'num_ratings\': 5, '
            'u\'average_ratings\': 4, u\'total_plays\': 5}}"]]') % (
                self.user_id, time_str)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_value_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: 'invalid'
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats list '
            'of UserStatsModel\', [u"Entity id %s: Invalid stats dict: '
            '{u\'%s\': u\'invalid\'}"]]') % (self.user_id, self.datetime_key)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_properties_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: {
                'invalid': 2
            }
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'invalid\': 2}}"]]') % (
                self.user_id, self.datetime_key)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_property_values_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: {
                'num_ratings': 2,
                'average_ratings': 'invalid',
                'total_plays': 4
            }
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'num_ratings\': 2, '
            'u\'average_ratings\': u\'invalid\', u\'total_plays\': 4}}"]]'
        ) % (self.user_id, self.datetime_key)]
        run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserStatsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)


class ExplorationUserDataModelValidatorTests(test_utils.GenericTestBase):

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
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off.ExplorationUserDataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationUserDataModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        mock_time = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        self.model_instance.draft_change_list_last_updated = mock_time
        self.model_instance.rated_on = mock_time
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationUserDataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of ExplorationUserDataModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationUserDataModel\', '
                '[u"Entity id %s: based on field exploration_ids '
                'having value exp0, expect model ExplorationModel with id '
                'exp0 but it doesn\'t exist"]]' % self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_draft_change_list(self):
        self.model_instance.draft_change_list = [{
            'cmd': 'invalid'
        }]
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list check '
            'of ExplorationUserDataModel\', [u"Entity id %s: Invalid '
            'change dict {u\'cmd\': u\'invalid\'} due to error '
            'Command invalid is not allowed"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

    def test_invalid_exp_version(self):
        self.model_instance.draft_change_list_exp_version = 2
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exp version check '
            'of ExplorationUserDataModel\', [u\'Entity id %s: '
            'draft change list exp version 2 is greater than '
            'version 1 of corresponding exploration with id exp0\']]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_draft_change_list_last_updated(self):
        self.model_instance.draft_change_list_last_updated = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list last '
            'updated check of ExplorationUserDataModel\', [u\'Entity id %s: '
            'draft change list last updated %s is greater than the '
            'time when job was run\']]') % (
                self.model_instance.id,
                self.model_instance.draft_change_list_last_updated)]
        run_job_and_check_output(self, expected_output)

    def test_draft_change_list_last_updated_as_none(self):
        self.model_instance.draft_change_list_last_updated = None
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list last '
            'updated check of ExplorationUserDataModel\', [u"Entity id %s: '
            'draft change list [{u\'new_value\': u\'the objective\', '
            'u\'cmd\': u\'edit_exploration_property\', '
            'u\'property_name\': u\'objective\'}] exists but draft '
            'change list last updated is None"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

    def test_invalid_rating(self):
        self.model_instance.rating = -1
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for rating check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: Expected '
            'rating to be in range [1, 5], received -1\']]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_rated_on(self):
        self.model_instance.rated_on = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for rated on check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: rated on '
            '%s is greater than the time when job was run\']]') % (
                self.model_instance.id, self.model_instance.rated_on)]
        run_job_and_check_output(self, expected_output)

    def test_rated_on_as_none(self):
        self.model_instance.rated_on = None
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for rated on check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: rating 4 '
            'exists but rated on is None\']]') % (self.model_instance.id)]
        run_job_and_check_output(self, expected_output)


class CollectionProgressModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionProgressModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '1, expect model ExplorationModel with id 1 but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('col').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                'col, expect model CollectionModel with id col but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

    def test_missing_completed_activities_model_failure(self):
        user_models.CompletedActivitiesModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for completed_activities_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field completed_activities_ids '
                'having value %s, expect model CompletedActivitiesModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_private_exploration(self):
        rights_manager.unpublish_exploration(self.owner, '0')
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of CollectionProgressModel\', '
                '[u"Entity id %s: Explorations with ids [u\'0\'] are '
                'private"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

    def test_private_collection(self):
        rights_manager.unpublish_collection(self.owner, 'col')
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of CollectionProgressModel\', '
                '[u"Entity id %s: Collections with ids [u\'col\'] are '
                'private"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

    def test_completed_exploration_missing_in_completed_activities(self):
        self.model_instance.completed_explorations.append('2')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed exploration check of '
            'CollectionProgressModel\', [u"Entity id %s: Following completed '
            'exploration ids [u\'2\'] are not present in '
            'CompletedActivitiesModel for the user"]]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_completed_exploration_missing_in_collection(self):
        self.model_instance.completed_explorations.append('3')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed exploration check '
            'of CollectionProgressModel\', [u"Entity id %s: Following '
            'completed exploration ids [u\'3\'] do not belong to the '
            'collection with id col corresponding to the entity"]]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)


class StoryProgressModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StoryProgressModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.UserActionsInfo(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(0, 4)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        story = story_domain.Story.create_default_story(
            'story',
            title='title %d',
            corresponding_topic_id='0'
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryProgressModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of StoryProgressModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('story').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StoryProgressModel\', '
                '[u"Entity id %s: based on field story_ids having value '
                'story, expect model StoryModel with id story but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        run_job_and_check_output(self, expected_output)

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
        run_job_and_check_output(self, expected_output)

    def test_completed_node_missing_in_story_node_ids(self):
        self.model_instance.completed_node_ids.append('invalid')
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed node check of '
            'StoryProgressModel\', [u"Entity id %s: Following completed '
            'node ids [u\'invalid\'] do not belong to the story with '
            'id story corresponding to the entity"]]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_private_exploration(self):
        rights_manager.unpublish_exploration(self.owner, '1')
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are private [u\'1\']. "]]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_exploration(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are missing [u\'1\']. "]]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_exploration_not_marked_as_completed(self):
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        completed_activities_model.exploration_ids.remove('1')
        completed_activities_model.put()
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are not marked in '
            'CompletedActivitiesModel [u\'1\']."]]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)


class UserQueryModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserQueryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.query_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.query_id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for sent_email_model_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field sent_email_model_ids having value '
                '%s, expect model BulkEmailModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.query_id, self.sent_mail_id, self.sent_mail_id)]
        run_job_and_check_output(self, expected_output)

    def test_extra_recipients(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.append('invalid')
        bulk_email_model.put()
        expected_output = [(
            u'[u\'failed validation check for recipient check of '
            'UserQueryModel\', [u"Entity id %s: Email model %s '
            'for query has following extra recipients [u\'invalid\'] '
            'which are not qualified as per the query"]]') % (
                self.query_id, self.sent_mail_id)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_sender_id(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.sender_id = 'invalid'
        bulk_email_model.put()
        expected_output = [(
            u'[u\'failed validation check for sender check of '
            'UserQueryModel\', [u\'Entity id %s: Sender id invalid in '
            'email model with id %s does not match submitter id '
            '%s of query\']]') % (
                self.query_id, self.sent_mail_id, self.admin_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_user_bulk_email_model(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for user bulk email check of '
            'UserQueryModel\', [u\'Entity id %s: UserBulkEmails model '
            'is missing for recipient with id %s\']]') % (
                self.query_id, self.owner_id)]
        run_job_and_check_output(self, expected_output)


class UserBulkEmailsModelValidatorTests(test_utils.GenericTestBase):

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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output, sort=True)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserBulkEmailsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserBulkEmailsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]' % (
                    self.user_id, self.user_id, self.user_id)
            ), u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [(
            u'[u\'failed validation check for sent_email_model_ids field '
            'check of UserBulkEmailsModel\', [u"Entity id %s: based on '
            'field sent_email_model_ids having value %s, expect model '
            'BulkEmailModel with id %s but it doesn\'t exist", '
            'u"Entity id %s: based on field sent_email_model_ids having '
            'value %s, expect model BulkEmailModel with id %s but it '
            'doesn\'t exist"]]') % (
                self.user_id, self.sent_mail_id, self.sent_mail_id,
                self.owner_id, self.sent_mail_id, self.sent_mail_id)]
        run_job_and_check_output(self, expected_output, literal_eval=True)

    def test_user_id_not_in_recipient_ids(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.remove(self.user_id)
        bulk_email_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for recipient check of '
                'UserBulkEmailsModel\', [u\'Entity id %s: user id is '
                'not present in recipient ids of BulkEmailModel with id %s\']]'
            ) % (self.user_id, self.sent_mail_id),
            u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)


class UserSkillMasteryModelValidatorTests(test_utils.GenericTestBase):

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
            'skill', description='description', rubrics=rubrics)
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSkillMasteryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserSkillMasteryModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('skill').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of UserSkillMasteryModel\', '
                '[u"Entity id %s: based on '
                'field skill_ids having value '
                'skill, expect model SkillModel '
                'with id skill but it doesn\'t exist"]]') % (
                    self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_skill_mastery(self):
        self.model_instance.degree_of_mastery = 10
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for skill mastery check '
            'of UserSkillMasteryModel\', [u\'Entity id %s: Expected degree '
            'of mastery to be in range [0.0, 1.0], received '
            '10.0\']]') % (self.model_instance.id)]
        run_job_and_check_output(self, expected_output)


class UserContributionScoringModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserContributionScoringModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        score_category = 'content.Art'
        suggestion_services.create_new_user_contribution_scoring_model(
            self.user_id, score_category, 10)
        self.model_instance = (
            user_models.UserContributionScoringModel.get_by_id(
                id='%s.%s' % (score_category, self.user_id)))
        self.job_class = (
            prod_validation_jobs_one_off
            .UserContributionScoringModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionScoringModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserContributionScoringModel\', '
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
            'UserContributionScoringModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserContributionScoringModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expect model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        run_job_and_check_output(self, expected_output)

    def test_invalid_score_category(self):
        suggestion_services.create_new_user_contribution_scoring_model(
            self.user_id, 'invalid', 10)
        expected_output = [
            (
                u'[u\'failed validation check for score category check '
                'of UserContributionScoringModel\', [u\'Entity id invalid.%s: '
                'Score category invalid is invalid\']]'
            ) % self.user_id,
            u'[u\'fully-validated UserContributionScoringModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_invalid_score(self):
        self.model_instance.score = -1
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for score check of '
            'UserContributionScoringModel\', [u\'Entity id %s: '
            'Expected score to be non-negative, received -1.0\']]') % (
                self.model_instance.id)]
        run_job_and_check_output(self, expected_output)


class UserCommunityRightsModelValidatorTests(test_utils.GenericTestBase):

    TRANSLATOR_EMAIL = 'translator@community.org'
    TRANSLATOR_USERNAME = 'translator'

    VOICE_ARTIST_EMAIL = 'voiceartist@community.org'
    VOICE_ARTIST_USERNAME = 'voiceartist'

    def setUp(self):
        super(UserCommunityRightsModelValidatorTests, self).setUp()

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
            user_models.UserCommunityRightsModel.get_by_id(self.translator_id))
        self.voice_artist_model_instance = (
            user_models.UserCommunityRightsModel.get_by_id(
                self.voice_artist_id))

        self.job_class = (
            prod_validation_jobs_one_off.UserCommunityRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserCommunityRightsModel\', 2]']
        run_job_and_check_output(self, expected_output)

    def test_get_external_id_relationship_failure(self):
        user_models.UserSettingsModel.get_by_id(self.translator_id).delete()

        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids field '
                'check of UserCommunityRightsModel\', [u"Entity id %s: based '
                'on field user_settings_ids having value %s, expect model '
                'UserSettingsModel with id %s but it doesn\'t exist"]]'
            ) % (self.translator_id, self.translator_id, self.translator_id),
            u'[u\'fully-validated UserCommunityRightsModel\', 1]']
        run_job_and_check_output(self, expected_output, sort=True)

    def test_object_validation_failure(self):
        (
            self.translator_model_instance
            .can_review_voiceover_for_language_codes.append('invalid_lang_code')
        )
        self.translator_model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'UserCommunityRightsModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Invalid language_code: '
                'invalid_lang_code\']]'
            ) % self.translator_id,
            u'[u\'fully-validated UserCommunityRightsModel\', 1]']

        run_job_and_check_output(self, expected_output, sort=True)


class PendingDeletionRequestModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(PendingDeletionRequestModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.save_new_valid_exploration('exp_id', self.user_id)
        self.save_new_valid_collection(
            'col_id', self.user_id, exploration_id='exp_id')

        user_services.update_user_role(
            self.user_id, feconf.ROLE_ID_TOPIC_MANAGER)
        self.user_actions = user_services.UserActionsInfo(self.user_id)

        wipeout_service.pre_delete_user(self.user_id)
        self.process_and_flush_pending_tasks()

        self.model_instance = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .PendingDeletionRequestModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PendingDeletionRequestModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
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
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PendingDeletionRequestModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        with self.swap(datetime, 'datetime', MockDatetime13Hours), self.swap(
            db.DateTimeProperty, 'data_type', MockDatetime13Hours):
            update_datastore_types_for_mock_datetime()
            run_job_and_check_output(self, expected_output)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for deleted '
                'user settings of PendingDeletionRequestModel\', '
                '[u\'Entity id %s: User settings model '
                'is not marked as deleted\']]') % (self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_user_settings_model_not_marked_deleted_failure(self):
        user_model = user_models.UserSettingsModel.get_by_id(self.user_id)
        user_model.deleted = False
        user_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for deleted '
                'user settings of PendingDeletionRequestModel\', '
                '[u\'Entity id %s: User settings model '
                'is not marked as deleted\']]') % (self.model_instance.id)]
        run_job_and_check_output(self, expected_output)

    def test_exploration_not_marked_deleted_failure(self):
        exp = exp_models.ExplorationModel.get_by_id('exp_id')
        exp.deleted = False
        exp_models.ExplorationModel.put_multi([exp])
        expected_output = [
            (
                u'[u\'failed validation check for deleted exploration check '
                'of PendingDeletionRequestModel\', '
                '[u"Entity id %s: Explorations with ids [u\'exp_id\'] are '
                'not marked as deleted"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_collection_not_marked_deleted_failure(self):
        col = collection_models.CollectionModel.get_by_id('col_id')
        col.deleted = False
        collection_models.CollectionModel.put_multi([col])
        expected_output = [
            (
                u'[u\'failed validation check for deleted collection check '
                'of PendingDeletionRequestModel\', '
                '[u"Entity id %s: Collections with ids [u\'col_id\'] are '
                'not marked as deleted"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_exploration_deleted_failure(self):
        exp = exp_models.ExplorationModel.get_by_id('exp_id')
        exp.delete(self.user_id, '', force_deletion=True)
        expected_output = [
            (
                u'[u\'failed validation check for deleted exploration check '
                'of PendingDeletionRequestModel\', '
                '[u"Entity id %s: Explorations with ids [u\'exp_id\'] are '
                'not marked as deleted"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)

    def test_collection_deleted_failure(self):
        col = collection_models.CollectionModel.get_by_id('col_id')
        col.delete(self.user_id, '', force_deletion=True)
        expected_output = [
            (
                u'[u\'failed validation check for deleted collection check '
                'of PendingDeletionRequestModel\', '
                '[u"Entity id %s: Collections with ids [u\'col_id\'] are '
                'not marked as deleted"]]') % self.user_id]
        run_job_and_check_output(self, expected_output)


class TaskEntryModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TaskEntryModelValidatorTests, self).setUp()
        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.save_new_valid_exploration('exp_id', self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.TaskEntryModelAuditOneOffJob)

    def run_job_and_get_output(self):
        """Helper method to run job and fetch the output.

        Returns:
            list([str, *]).
        """
        job_id = self.job_class.create_new()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        self.job_class.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        return [ast.literal_eval(o) for o in self.job_class.get_output(job_id)]

    def run_job_and_check_output(self, *expected_outputs):
        """Helper method to run job and check for the expected output.

        Args:
            *expected_outputs: list(*). The items expected to be found in the
                job's output.
        """
        self.assertItemsEqual(
            self.run_job_and_get_output(), list(expected_outputs))

    def test_no_models(self):
        self.run_job_and_check_output()

    def test_valid_model_check(self):
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME)
        self.run_job_and_check_output(['fully-validated TaskEntryModel', 1])

    def test_invalid_entity_id(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'invalid_exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME)
        self.run_job_and_check_output(
            ['failed validation check for entity_ids field check of '
             'TaskEntryModel',
             ['Entity id %s: based on field entity_ids having value '
              'invalid_exp_id, expect model ExplorationModel with id '
              'invalid_exp_id but it doesn\'t exist' % (task_id,)]],
            ['failed validation check for target_id field check of '
             'TaskEntryModel',
             ['Entity id %s: exploration with id "invalid_exp_id" does not '
              'exist at version 1' % (task_id,)]])

    def test_invalid_entity_version(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            2,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME)
        self.run_job_and_check_output(
            ['failed validation check for target_id field check of '
             'TaskEntryModel',
             ['Entity id %s: exploration with id "exp_id" does not exist at '
              'version 2' % (task_id,)]])

    def test_invalid_resolver_ids(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_RESOLVED,
            resolver_id='invalid_user_id',
            resolved_on=CURRENT_DATETIME)
        self.run_job_and_check_output(
            ['failed validation check for resolver_ids field check of '
             'TaskEntryModel',
             ['Entity id %s: based on field resolver_ids having value '
              'invalid_user_id, expect model UserSettingsModel with id '
              'invalid_user_id but it doesn\'t exist' % (task_id,)]])

    def test_invalid_id(self):
        improvements_models.TaskEntryModel(
            id='bad_id',
            composite_entity_id='exploration.exp_id.1',
            entity_type=improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id='exp_id',
            entity_version=1,
            task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=improvements_models.TASK_TARGET_TYPE_STATE,
            target_id=feconf.DEFAULT_INIT_STATE_NAME,
            status=improvements_models.TASK_STATUS_OPEN).put()
        self.run_job_and_check_output(
            ['failed validation check for model id check of TaskEntryModel',
             ['Entity id bad_id: Entity id does not match regex pattern']])

    def test_invalid_composite_entity_id(self):
        task_id = improvements_models.TaskEntryModel.generate_task_id(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME)
        improvements_models.TaskEntryModel(
            id=task_id,
            composite_entity_id='bad_composite_id',
            entity_type=improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id='exp_id',
            entity_version=1,
            task_type=improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=improvements_models.TASK_TARGET_TYPE_STATE,
            target_id=feconf.DEFAULT_INIT_STATE_NAME,
            status=improvements_models.TASK_STATUS_OPEN).put()
        self.run_job_and_check_output(
            ['failed validation check for composite_entity_id field check of '
             'TaskEntryModel',
             ['Entity id %s: composite_entity_id "bad_composite_id" should be '
              '"exploration.exp_id.1"' % (
                  task_id,)]])

    def test_status_open_but_resolver_id_is_set(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_OPEN,
            resolver_id=self.user_id)
        self.run_job_and_check_output(
            ['failed validation check for status field check of TaskEntryModel',
             ['Entity id %s: status is open but resolver_id is "%s", should be '
              'empty.' % (task_id, self.user_id)]])

    def test_status_open_but_resolved_on_is_set(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_OPEN,
            resolved_on=CURRENT_DATETIME)
        self.run_job_and_check_output(
            ['failed validation check for status field check of TaskEntryModel',
             ['Entity id %s: status is open but resolved_on is "%s", should be '
              'empty.' % (task_id, CURRENT_DATETIME)]])

    def test_status_resolved_but_resolver_id_is_not_set(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_RESOLVED,
            resolver_id=None,
            resolved_on=CURRENT_DATETIME)
        self.run_job_and_check_output(
            ['failed validation check for status field check of TaskEntryModel',
             ['Entity id %s: status is resolved but resolver_id is not set' % (
                 task_id,)]])

    def test_status_resolved_but_resolved_on_is_not_set(self):
        task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            issue_description='issue description',
            status=improvements_models.TASK_STATUS_RESOLVED,
            resolver_id=self.user_id,
            resolved_on=None)
        self.run_job_and_check_output(
            ['failed validation check for status field check of TaskEntryModel',
             ['Entity id %s: status is resolved but resolved_on is not set' % (
                 task_id,)]])

    def test_missing_state_name_for_exploration_task_types(self):
        hbr_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'invalid_state_name')
        ifl_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'invalid_state_name')
        ngr_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'invalid_state_name')
        sia_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            improvements_models.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'invalid_state_name')
        output = self.run_job_and_get_output()
        self.assertEqual(len(output), 1)
        error_key, error_messages = output[0]

        self.assertEqual(
            error_key,
            'failed validation check for target_id field check of '
            'TaskEntryModel')
        self.assertItemsEqual(
            error_messages, [
                'Entity id %s: exploration with id "exp_id" does not have a '
                'state named "invalid_state_name" at version 1' % (
                    hbr_task_id,),
                'Entity id %s: exploration with id "exp_id" does not have a '
                'state named "invalid_state_name" at version 1' % (
                    ifl_task_id,),
                'Entity id %s: exploration with id "exp_id" does not have a '
                'state named "invalid_state_name" at version 1' % (
                    ngr_task_id,),
                'Entity id %s: exploration with id "exp_id" does not have a '
                'state named "invalid_state_name" at version 1' % (
                    sia_task_id,)
            ])

    def test_deleted_state_name_for_exploration_task_types(self):
        self.save_new_linear_exp_with_state_names_and_interactions(
            'linear_exp_id', 'owner_id',
            ['State 1', 'State 2', 'State 3'],
            ['TextInput', 'TextInput', 'EndExploration'])
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            1,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            1,
            improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            1,
            improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')
        improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            1,
            improvements_models.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')

        exp_services.update_exploration( # v2
            'owner_id', 'linear_exp_id', [
                exp_domain.ExplorationChange(
                    {'cmd': 'delete_state', 'state_name': 'State 2'})
            ], 'Delete State 2')
        new_hbr_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            2,
            improvements_models.TASK_TYPE_HIGH_BOUNCE_RATE,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')
        new_ifl_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            2,
            improvements_models.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')
        new_ngr_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            2,
            improvements_models.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')
        new_sia_task_id = improvements_models.TaskEntryModel.create(
            improvements_models.TASK_ENTITY_TYPE_EXPLORATION,
            'linear_exp_id',
            2,
            improvements_models.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
            improvements_models.TASK_TARGET_TYPE_STATE,
            'State 2')

        output = self.run_job_and_get_output()
        self.assertEqual(len(output), 2)
        self.assertEqual(output[0], ['fully-validated TaskEntryModel', 4])
        error_key, error_messages = output[1]
        self.assertEqual(
            error_key,
            'failed validation check for target_id field check of '
            'TaskEntryModel')
        self.assertItemsEqual(
            error_messages, [
                'Entity id %s: exploration with id "linear_exp_id" does not '
                'have a state named "State 2" at version 2' % (
                    new_ifl_task_id,),
                'Entity id %s: exploration with id "linear_exp_id" does not '
                'have a state named "State 2" at version 2' % (
                    new_hbr_task_id,),
                'Entity id %s: exploration with id "linear_exp_id" does not '
                'have a state named "State 2" at version 2' % (
                    new_ngr_task_id,),
                'Entity id %s: exploration with id "linear_exp_id" does not '
                'have a state named "State 2" at version 2' % (
                    new_sia_task_id,)
            ])
