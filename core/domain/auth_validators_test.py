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

"""Unit tests for core.domain.auth_validators_test."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime

from core.domain import prod_validation_jobs_one_off
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()


class AuthValidatorTestBase(test_utils.AuditJobsTestBase):
    """Base class with helper methods for testing the auth_validators jobs."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def create_user_auth_models(
            self, auth_provider_id, auth_id=None, full_user=True):
        """Creates auth_models for a user and sets up their relationships.

        Args:
            auth_provider_id: str. The auth ID provider of the user. The only
                values respected are feconf.GAE_AUTH_PROVIDER_ID and
                feconf.FIREBASE_AUTH_PROVIDER_ID.
            auth_id: str|None. The auth ID to assign to the user. If None, then
                a generated ID will be used instead.
            full_user: bool. Whether the model will represent a full user. If
                False, then a parent user will be created for the model and it
                will become a profile user.

        Returns:
            UserAuthDetailsModel. The new model.
        """
        user_email = 'test@test.com'
        user_id = user_models.UserSettingsModel.get_new_id()
        if auth_id is None:
            auth_id = self.get_auth_id_from_email(user_email)

        user_models.UserSettingsModel(
            id=user_id, email=user_email,
            role=feconf.ROLE_ID_EXPLORATION_EDITOR).put()

        if full_user:
            parent_user_id = None
        else:
            parent_user_id = user_models.UserSettingsModel.get_new_id()
            user_models.UserSettingsModel(
                id=parent_user_id, email='parent@test.com',
                role=feconf.ROLE_ID_EXPLORATION_EDITOR).put()

        if auth_provider_id == feconf.GAE_AUTH_PROVIDER_ID:
            auth_models.UserIdentifiersModel(
                id=auth_id, user_id=user_id).put()
            user_auth_details_model = auth_models.UserAuthDetailsModel(
                id=user_id, gae_id=auth_id,
                parent_user_id=parent_user_id)
        else:
            auth_models.UserIdByFirebaseAuthIdModel(
                id=auth_id, user_id=user_id).put()
            user_auth_details_model = auth_models.UserAuthDetailsModel(
                id=user_id, firebase_auth_id=auth_id,
                parent_user_id=parent_user_id)

        user_auth_details_model.put()
        return user_auth_details_model

    def run_job_and_get_output(self, entity_id_order=None):
        """Runs the validation jobs and returns its output.

        Args:
            entity_id_order: list(str)|None. The ordering of IDs to be returned
                from the validation outputs. If None, then the output is not
                changed.

        Returns:
            list(*). The validation job output.
        """
        job_id = self.JOB_CLASS.create_new()
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        self.JOB_CLASS.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        output = [
            ast.literal_eval(o) for o in self.JOB_CLASS.get_output(job_id)
        ]

        if entity_id_order is not None:
            by_entity_id_order = lambda output_str: python_utils.NEXT(
                (
                    i for i, entity_id in enumerate(entity_id_order)
                    if output_str.startswith('Entity id %s' % entity_id)),
                len(entity_id_order))

            for _, sub_output in output:
                if isinstance(sub_output, list):
                    sub_output.sort(key=by_entity_id_order)

        return output


class UserAuthDetailsModelValidatorTests(AuthValidatorTestBase):

    JOB_CLASS = prod_validation_jobs_one_off.UserAuthDetailsModelAuditOneOffJob

    def test_audit_standard_operation_passes(self):
        self.create_user_auth_models(feconf.GAE_AUTH_PROVIDER_ID)
        self.create_user_auth_models(feconf.FIREBASE_AUTH_PROVIDER_ID)

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['fully-validated UserAuthDetailsModel', 2],
        ])

    def test_audit_with_created_on_greater_than_last_updated_fails(self):
        gae_auth_model = (
            self.create_user_auth_models(feconf.GAE_AUTH_PROVIDER_ID))
        gae_auth_model.created_on = (
            gae_auth_model.last_updated + datetime.timedelta(days=1))
        gae_auth_model.update_timestamps()
        gae_auth_model.put()

        firebase_auth_model = (
            self.create_user_auth_models(feconf.FIREBASE_AUTH_PROVIDER_ID))
        firebase_auth_model.created_on = (
            firebase_auth_model.last_updated + datetime.timedelta(days=1))
        firebase_auth_model.update_timestamps()
        firebase_auth_model.put()

        output = self.run_job_and_get_output(
            entity_id_order=[gae_auth_model.id, firebase_auth_model.id])

        self.assertItemsEqual(output, [
            ['failed validation check for time field relation check of '
             'UserAuthDetailsModel',
             ['Entity id %s: The created_on field has a value %s which is '
              'greater than the value %s of last_updated field' % (
                  gae_auth_model.id,
                  gae_auth_model.created_on,
                  gae_auth_model.last_updated),
              'Entity id %s: The created_on field has a value %s which is '
              'greater than the value %s of last_updated field' % (
                  firebase_auth_model.id,
                  firebase_auth_model.created_on,
                  firebase_auth_model.last_updated)],
            ],
        ])

    def test_audit_with_last_updated_greater_than_current_time_fails(self):
        gae_auth_model, firebase_auth_model = (
            self.create_user_auth_models(feconf.GAE_AUTH_PROVIDER_ID),
            self.create_user_auth_models(feconf.FIREBASE_AUTH_PROVIDER_ID))
        mock_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=13))

        with datastore_services.mock_datetime_for_datastore(mock_datetime):
            output = self.run_job_and_get_output(
                entity_id_order=[gae_auth_model.id, firebase_auth_model.id])

        self.assertItemsEqual(output, [
            ['failed validation check for current time check of '
             'UserAuthDetailsModel',
             ['Entity id %s: The last_updated field has a value %s which is '
              'greater than the time when the job was run' % (
                  gae_auth_model.id, gae_auth_model.last_updated),
              'Entity id %s: The last_updated field has a value %s which is '
              'greater than the time when the job was run' % (
                  firebase_auth_model.id, firebase_auth_model.last_updated)],
            ],
        ])

    def test_audit_with_missing_user_settings_model_fails(self):
        gae_user_id = (
            self.create_user_auth_models(feconf.GAE_AUTH_PROVIDER_ID).id)
        user_models.UserSettingsModel.get(gae_user_id).delete()

        firebase_user_id = (
            self.create_user_auth_models(feconf.FIREBASE_AUTH_PROVIDER_ID)).id
        user_models.UserSettingsModel.get(firebase_user_id).delete()

        output = self.run_job_and_get_output(
            entity_id_order=[gae_user_id, firebase_user_id])

        self.assertItemsEqual(output, [
            ['failed validation check for user_settings_ids field check of '
             'UserAuthDetailsModel',
             ['Entity id %s: based on field user_settings_ids having value %s, '
              'expected model UserSettingsModel with id %s but it doesn\'t '
              'exist' % (
                  gae_user_id, gae_user_id, gae_user_id),
              'Entity id %s: based on field user_settings_ids having value %s, '
              'expected model UserSettingsModel with id %s but it doesn\'t '
              'exist' % (
                  firebase_user_id, firebase_user_id, firebase_user_id)],
            ],
        ])

    def test_audit_with_missing_user_identifiers_model_fails(self):
        gae_auth_model = (
            self.create_user_auth_models(feconf.GAE_AUTH_PROVIDER_ID))
        gae_user_id, gae_id = gae_auth_model.id, gae_auth_model.gae_id
        auth_models.UserIdentifiersModel.get_by_user_id(gae_user_id).delete()

        firebase_auth_model = (
            self.create_user_auth_models(feconf.FIREBASE_AUTH_PROVIDER_ID))
        firebase_user_id, firebase_auth_id = (
            firebase_auth_model.id, firebase_auth_model.firebase_auth_id)
        auth_models.UserIdByFirebaseAuthIdModel.get_by_user_id(
            firebase_user_id).delete()

        output = self.run_job_and_get_output(
            entity_id_order=[gae_user_id, firebase_user_id])

        self.assertItemsEqual(output, [
            ['failed validation check for auth_ids field check of '
             'UserAuthDetailsModel',
             ['Entity id %s: based on field auth_ids having value %s, expected '
              'model UserIdentifiersModel with id %s but it doesn\'t exist' % (
                  gae_user_id, gae_id, gae_id),
              'Entity id %s: based on field auth_ids having value %s, expected '
              'model UserIdByFirebaseAuthIdModel with id %s but it doesn\'t '
              'exist' % (
                  firebase_user_id, firebase_auth_id, firebase_auth_id)],
            ],
        ])

    def test_audit_with_missing_parent_user_settings_model_fails(self):
        gae_auth_model = self.create_user_auth_models(
            feconf.GAE_AUTH_PROVIDER_ID, full_user=False)
        gae_profile_user_id = gae_auth_model.id
        gae_parent_user_id = gae_auth_model.parent_user_id
        user_models.UserSettingsModel.get(gae_parent_user_id).delete()

        firebase_auth_model = self.create_user_auth_models(
            feconf.FIREBASE_AUTH_PROVIDER_ID, full_user=False)
        firebase_profile_user_id = firebase_auth_model.id
        firebase_parent_user_id = firebase_auth_model.parent_user_id
        user_models.UserSettingsModel.get(firebase_parent_user_id).delete()

        output = self.run_job_and_get_output(
            entity_id_order=[gae_profile_user_id, firebase_profile_user_id])

        self.assertItemsEqual(output, [
            ['failed validation check for parent_user_settings_ids field check '
             'of UserAuthDetailsModel',
             ['Entity id %s: based on field parent_user_settings_ids having '
              'value %s, expected model UserSettingsModel with id %s but it '
              'doesn\'t exist' % (
                  gae_profile_user_id,
                  gae_parent_user_id,
                  gae_parent_user_id),
              'Entity id %s: based on field parent_user_settings_ids having '
              'value %s, expected model UserSettingsModel with id %s but it '
              'doesn\'t exist' % (
                  firebase_profile_user_id,
                  firebase_parent_user_id,
                  firebase_parent_user_id)],
            ],
        ])


class UserIdentifiersModelValidatorTests(AuthValidatorTestBase):

    JOB_CLASS = prod_validation_jobs_one_off.UserIdentifiersModelAuditOneOffJob

    def setUp(self):
        super(UserIdentifiersModelValidatorTests, self).setUp()

        user_auth_details_model = (
            self.create_user_auth_models(feconf.GAE_AUTH_PROVIDER_ID))
        self.user_id = user_auth_details_model.id
        self.auth_id = user_auth_details_model.gae_id
        self.model_instance = auth_models.UserIdentifiersModel.get(self.auth_id)

    def test_audit_standard_operation_passes(self):
        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['fully-validated UserIdentifiersModel', 1],
        ])

    def test_audit_with_created_on_greater_than_last_updated_fails(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for time field relation check of '
             'UserIdentifiersModel',
             ['Entity id %s: The created_on field has a value %s which is '
              'greater than the value %s of last_updated field' % (
                  self.auth_id, self.model_instance.created_on,
                  self.model_instance.last_updated)],
            ],
        ])

    def test_audit_with_last_updated_greater_than_current_time_fails(self):
        mocked_datetime = (
            datetime.datetime.utcnow() - datetime.timedelta(hours=13))

        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.assertItemsEqual(self.run_job_and_get_output(), [
                ['failed validation check for current time check of '
                 'UserIdentifiersModel',
                 ['Entity id %s: The last_updated field has a value %s which '
                  'is greater than the time when the job was run' % (
                      self.auth_id, self.model_instance.last_updated)],
                ],
            ])

    def test_audit_with_missing_user_settings_model_fails(self):
        user_models.UserSettingsModel.get(self.user_id).delete()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for user_settings_ids field check of '
             'UserIdentifiersModel',
             ['Entity id %s: based on field user_settings_ids having value %s, '
              'expected model UserSettingsModel with id %s but it doesn\'t '
              'exist' % (self.auth_id, self.user_id, self.user_id)],
            ],
        ])

    def test_audit_with_missing_user_auth_details_model_fails(self):
        auth_models.UserAuthDetailsModel.get(self.user_id).delete()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for user_auth_details_ids field check '
             'of UserIdentifiersModel',
             ['Entity id %s: based on field user_auth_details_ids having value '
              '%s, expected model UserAuthDetailsModel with id %s but it '
              'doesn\'t exist' % (self.auth_id, self.user_id, self.user_id)],
            ],
        ])


class UserIdByFirebaseAuthIdModelValidatorTests(AuthValidatorTestBase):

    JOB_CLASS = (
        prod_validation_jobs_one_off.UserIdByFirebaseAuthIdModelAuditOneOffJob)

    def setUp(self):
        super(UserIdByFirebaseAuthIdModelValidatorTests, self).setUp()

        user_auth_details_model = (
            self.create_user_auth_models(feconf.FIREBASE_AUTH_PROVIDER_ID))
        self.user_id = user_auth_details_model.id
        self.auth_id = user_auth_details_model.firebase_auth_id

        self.model_instance = (
            auth_models.UserIdByFirebaseAuthIdModel.get(self.auth_id))

    def test_audit_standard_operation_passes(self):
        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['fully-validated UserIdByFirebaseAuthIdModel', 1],
        ])

    def test_audit_with_valid_id_passes(self):
        valid_auth_id = 'i' * 128
        self.create_user_auth_models(
            feconf.FIREBASE_AUTH_PROVIDER_ID, auth_id=valid_auth_id)

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['fully-validated UserIdByFirebaseAuthIdModel', 2],
        ])

    def test_audit_with_id_that_is_too_long_fails(self):
        auth_id_that_is_too_long = 'i' * 129
        self.create_user_auth_models(
            feconf.FIREBASE_AUTH_PROVIDER_ID, auth_id=auth_id_that_is_too_long)

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for model id check of '
             'UserIdByFirebaseAuthIdModel',
             ['Entity id %s: Entity id does not match regex pattern' % (
                 auth_id_that_is_too_long,)],
            ],
            ['fully-validated UserIdByFirebaseAuthIdModel', 1],
        ])

    def test_audit_with_created_on_greater_than_last_updated_fails(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for time field relation check of '
             'UserIdByFirebaseAuthIdModel',
             ['Entity id %s: The created_on field has a value %s which is '
              'greater than the value %s of last_updated field' % (
                  self.auth_id, self.model_instance.created_on,
                  self.model_instance.last_updated)],
            ],
        ])

    def test_audit_with_last_updated_greater_than_current_time_fails(self):
        utcnow = datetime.datetime.utcnow()
        self.model_instance.last_updated = utcnow
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()
        mocked_datetime = utcnow - datetime.timedelta(hours=13)

        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.assertItemsEqual(self.run_job_and_get_output(), [
                ['failed validation check for current time check of '
                 'UserIdByFirebaseAuthIdModel',
                 ['Entity id %s: The last_updated field has a value %s which '
                  'is greater than the time when the job was run' % (
                      self.auth_id, self.model_instance.last_updated)],
                ],
            ])

    def test_audit_with_missing_user_settings_model_fails(self):
        user_models.UserSettingsModel.get(self.user_id).delete()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for user_settings_ids field check of '
             'UserIdByFirebaseAuthIdModel',
             ['Entity id %s: based on field user_settings_ids having value %s, '
              'expected model UserSettingsModel with id %s but it doesn\'t '
              'exist' % (self.auth_id, self.user_id, self.user_id)],
            ],
        ])

    def test_audit_with_missing_user_auth_details_model_fails(self):
        auth_models.UserAuthDetailsModel.get(self.user_id).delete()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for user_auth_details_ids field check '
             'of UserIdByFirebaseAuthIdModel',
             ['Entity id %s: based on field user_auth_details_ids having value '
              '%s, expected model UserAuthDetailsModel with id %s but it '
              'doesn\'t exist' % (self.auth_id, self.user_id, self.user_id)],
            ],
        ])


class FirebaseSeedModelValidatorTests(AuthValidatorTestBase):

    JOB_CLASS = prod_validation_jobs_one_off.FirebaseSeedModelAuditOneOffJob

    def test_audit_with_valid_id_reports_success(self):
        auth_models.FirebaseSeedModel(
            id=auth_models.ONLY_FIREBASE_SEED_MODEL_ID).put()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['fully-validated FirebaseSeedModel', 1],
        ])

    def test_audit_with_invalid_id_reports_an_error(self):
        invalid_id = 'abc'
        auth_models.FirebaseSeedModel(id=invalid_id).put()

        self.assertItemsEqual(self.run_job_and_get_output(), [
            ['failed validation check for model id check of FirebaseSeedModel',
             ['Entity id %s: Entity id must be 1' % (invalid_id,)],
            ],
        ])
