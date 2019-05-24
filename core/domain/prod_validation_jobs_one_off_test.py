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

import datetime

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import prod_validation_jobs_one_off
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils

from google.appengine.ext import ndb

gae_search_services = models.Registry.import_search_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(activity_models, base_models, user_models, exp_models) = (
    models.Registry.import_models([
        models.NAMES.activity, models.NAMES.base_model, models.NAMES.user,
        models.NAMES.exploration]))


def run_job_and_check_output(
        self, expected_output, sort=False):
    """Helper function to run job and compare output."""
    job_class = prod_validation_jobs_one_off.ProdValidationAuditOneOffJob
    job_id = job_class.create_new()
    self.assertEqual(
        self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
    job_class.enqueue(job_id)
    self.assertEqual(
        self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
    self.process_and_flush_pending_tasks()
    actual_output = job_class.get_output(job_id)
    if sort:
        self.assertEqual(sorted(actual_output), sorted(expected_output))
    else:
        self.assertEqual(actual_output, expected_output)


class MockModelValidator(prod_validation_jobs_one_off.BaseModelValidator):
    """Class for validating mock models. The mock models are used to validate
    invalid model ids and last_updated properties since these properties
    cannot be altered in other models.
    """

    MOCK_MODEL_ID_REGEX_STRING = '.'

    @classmethod
    def _get_model_id_regex(cls, item):
        return cls.MOCK_MODEL_ID_REGEX_STRING

    @classmethod
    def _get_json_properties_schema(cls):
        return {}

    @classmethod
    def _get_model_domain_object_instances(cls, item):
        return []

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _get_validation_functions(cls):
        return []


class MockModel(base_models.BaseModel):
    """Mock model to validate cases where last_updated >= current time."""

    last_updated = ndb.DateTimeProperty(auto_now_add=True, indexed=True)


class MockModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(MockModelValidatorTests, self).setUp()

        self.model_instance = MockModel(id='mock')
        self.model_instance.put()
        prod_validation_jobs_one_off.MODEL_TO_VALIDATOR_MAPPING = {
            MockModel: MockModelValidator,
        }

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated MockModel\', 1]']
        run_job_and_check_output(self, expected_output)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance.last_updated = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'MockModel\', '
            '[u\'Model id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]
        run_job_and_check_output(self, expected_output)


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

        prod_validation_jobs_one_off.MODEL_TO_VALIDATOR_MAPPING = {
            activity_models.ActivityReferencesModel:
                prod_validation_jobs_one_off.ActivityReferencesModelValidator,
        }

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

        run_job_and_check_output(self, expected_output)

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

        prod_validation_jobs_one_off.MODEL_TO_VALIDATOR_MAPPING = {
            user_models.UserSubscriptionsModel:
                prod_validation_jobs_one_off.UserSubscriptionsModelValidator,
        }

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


class ExplorationModelValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ExplorationModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in xrange(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        prod_validation_jobs_one_off.MODEL_TO_VALIDATOR_MAPPING = {
            exp_models.ExplorationModel:
                prod_validation_jobs_one_off.ExplorationModelValidator,
        }

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
