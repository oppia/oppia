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

"""Unit tests for core.domain.activity_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import prod_validation_jobs_one_off
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(activity_models,) = models.Registry.import_models([models.NAMES.activity])
datastore_services = models.Registry.import_datastore_services()


class ActivityReferencesModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ActivityReferencesModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        exploration = exp_domain.Exploration.create_default_exploration(
            '1exp', title='title', category='category')

        exp_services.save_new_exploration(self.owner_id, exploration)

        collection = collection_domain.Collection.create_default_collection(
            '1col', title='title', category='category')

        collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance = (
            activity_models.ActivityReferencesModel.get_or_create(
                feconf.ACTIVITY_REFERENCE_LIST_FEATURED))
        self.model_instance.activity_references = [{
            'type': constants.ACTIVITY_TYPE_EXPLORATION,
            'id': '1exp',
        }, {
            'type': constants.ACTIVITY_TYPE_COLLECTION,
            'id': '1col',
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.ActivityReferencesModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [u'[u\'fully-validated ActivityReferencesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ActivityReferencesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                feconf.ACTIVITY_REFERENCE_LIST_FEATURED,
                self.model_instance.created_on, self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ActivityReferencesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_missing_id_in_activity_references(self):
        self.model_instance.activity_references = [{
            'type': 'exploration',
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for fetch properties of '
            'ActivityReferencesModel\', '
            '[u"Entity id %s: Entity properties cannot be fetched '
            'completely with the error u\'id\'"]]' % (
                feconf.ACTIVITY_REFERENCE_LIST_FEATURED))]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_type_in_activity_references(self):
        self.model_instance.activity_references = [{
            'type': 'invalid_type',
            'id': '0'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for domain object check of '
            'ActivityReferencesModel\', '
            '[u\'Entity id %s: Entity fails domain validation with the '
            'error Invalid activity type: invalid_type\']]' % (
                feconf.ACTIVITY_REFERENCE_LIST_FEATURED))]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id_in_activity_references(self):
        self.model_instance.activity_references = [{
            'type': 'exploration',
            'id': '1col'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids field check of '
            'ActivityReferencesModel\', '
            '[u"Entity id %s: based on field exploration_ids having '
            'value 1col, expected model ExplorationModel with id 1col but '
            'it doesn\'t exist"]]' % feconf.ACTIVITY_REFERENCE_LIST_FEATURED)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_mock_model_with_invalid_id(self):
        model_instance_with_invalid_id = (
            activity_models.ActivityReferencesModel(id='invalid'))
        model_instance_with_invalid_id.update_timestamps()
        model_instance_with_invalid_id.put()
        expected_output = [(
            u'[u\'fully-validated ActivityReferencesModel\', 1]'
        ), (
            u'[u\'failed validation check for model id check of '
            'ActivityReferencesModel\', '
            '[u\'Entity id invalid: Entity id does not match regex pattern\']]'
        )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
