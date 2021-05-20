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

"""Unit tests for auth-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from core.domain import auth_jobs_one_off as auth_jobs
from core.domain import taskqueue_services
from core.platform import models
from core.platform.auth import firebase_auth_services_test
from core.tests import test_utils
import feconf
import python_utils

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))

datastore_services = models.Registry.import_datastore_services()


class SyncFirebaseAccountsOneOffJobTests(test_utils.AppEngineTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    JOB_CLASS = auth_jobs.SyncFirebaseAccountsOneOffJob

    USER_ID = 'uid_foo'
    AUTH_ID = 'foo'
    EMAIL = 'test@example.com'

    def setUp(self):
        super(SyncFirebaseAccountsOneOffJobTests, self).setUp()
        self.exit_stack = python_utils.ExitStack()
        self.firebase_sdk_stub = (
            firebase_auth_services_test.FirebaseAdminSdkStub())

        self.firebase_sdk_stub.install(self)
        self.exit_stack.callback(self.firebase_sdk_stub.uninstall)

    def tearDown(self):
        self.exit_stack.close()
        super(SyncFirebaseAccountsOneOffJobTests, self).tearDown()

    def count_one_off_jobs_in_queue(self):
        """Returns the number of one off jobs in the taskqueue."""
        return self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def run_one_off_job(self):
        """Begins the one off job and asserts it completes as expected.

        Returns:
            *. The output of the one off job.
        """
        job_id = self.JOB_CLASS.create_new()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        self.JOB_CLASS.enqueue(job_id)
        self.assertEqual(self.count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        return sorted(
            ast.literal_eval(o) for o in self.JOB_CLASS.get_output(job_id))

    def set_up_entities(
            self, user_id=USER_ID, firebase_auth_id=AUTH_ID, gae_id=None,
            create_assoc_by_auth_id=False,
            create_assoc_by_user_id=False,
            create_firebase_account=False,
            mark_assoc_by_auth_id_as_deleted=False,
            mark_assoc_by_user_id_as_deleted=False,
            disable_firebase_account=False):
        """Helps create the entities used to sync Firebase accounts.

        Args:
            user_id: str|None. The ID of the user. If None, entities keyed by
                user ID will not be created.
            firebase_auth_id: str|None. The Firebase account ID of the user. If
                None, entities keyed by Firebase account ID will not be created.
            gae_id: str|None. The GAE ID of the user, or None if empty.
            create_assoc_by_auth_id: bool. Whether to create a
                UserIdByFirebaseAuthIdModel.
            create_assoc_by_user_id: bool. Whether to create a
                UserAuthDetailsModel.
            create_firebase_account: bool. Whether to create a Firebase account.
            mark_assoc_by_auth_id_as_deleted: bool. Whether to mark the created
                UserIdByFirebaseAuthIdModel as deleted.
            mark_assoc_by_user_id_as_deleted: bool. Whether to mark the created
                UserAuthDetailsModel as deleted.
            disable_firebase_account: bool. Whether to disable the created
                Firebase account.
        """
        models_to_put = [
            auth_models.FirebaseSeedModel(
                id=auth_models.ONLY_FIREBASE_SEED_MODEL_ID),
        ]

        if user_id is not None:
            models_to_put.append(user_models.UserSettingsModel(
                id=user_id, email=self.EMAIL,
                deleted=mark_assoc_by_user_id_as_deleted))

        if create_assoc_by_user_id and user_id is not None:
            models_to_put.append(auth_models.UserAuthDetailsModel(
                id=user_id, firebase_auth_id=firebase_auth_id, gae_id=gae_id,
                deleted=mark_assoc_by_user_id_as_deleted))

        if create_assoc_by_auth_id and firebase_auth_id is not None:
            models_to_put.append(auth_models.UserIdByFirebaseAuthIdModel(
                id=firebase_auth_id, user_id=user_id,
                deleted=mark_assoc_by_auth_id_as_deleted))

        if create_firebase_account and firebase_auth_id is not None:
            self.firebase_sdk_stub.create_user(
                firebase_auth_id, email=self.EMAIL,
                disabled=disable_firebase_account)

        datastore_services.put_multi(models_to_put)

    def test_empty_database(self):
        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_acknowledges_system_committer_id(self):
        self.set_up_entities(
            create_assoc_by_user_id=True, gae_id=feconf.SYSTEM_COMMITTER_ID)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: SYSTEM_COMMITTER_ID skipped', [self.USER_ID]],
        ])

    def test_idempotency(self):
        self.set_up_entities(
            create_assoc_by_auth_id=True, create_assoc_by_user_id=True,
            create_firebase_account=True)

        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_creates_firebase_account_when_it_should_exist(self):
        self.set_up_entities(
            create_assoc_by_auth_id=True, create_assoc_by_user_id=True)

        self.firebase_sdk_stub.assert_is_not_user(self.AUTH_ID)

        self.assertItemsEqual(self.run_one_off_job(), [])

        self.firebase_sdk_stub.assert_is_user(self.AUTH_ID)

    def test_deletes_firebase_account_when_it_should_not_exist(self):
        self.set_up_entities(create_firebase_account=True)

        self.firebase_sdk_stub.assert_is_user(self.AUTH_ID)

        self.assertItemsEqual(self.run_one_off_job(), [])

        self.firebase_sdk_stub.assert_is_not_user(self.AUTH_ID)

    def test_disables_firebase_account_if_user_is_marked_as_deleted(self):
        self.set_up_entities(
            create_assoc_by_auth_id=True,
            create_assoc_by_user_id=True,
            create_firebase_account=True,
            mark_assoc_by_auth_id_as_deleted=True,
            mark_assoc_by_user_id_as_deleted=True)

        self.firebase_sdk_stub.assert_is_not_disabled(self.AUTH_ID)

        self.assertItemsEqual(self.run_one_off_job(), [])

        self.firebase_sdk_stub.assert_is_disabled(self.AUTH_ID)

    def test_reports_duplicate_auth_id_associations(self):
        self.set_up_entities(user_id='123', create_assoc_by_user_id=True)
        self.set_up_entities(
            user_id='987',
            create_assoc_by_auth_id=True, create_assoc_by_user_id=True)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Found inconsistency in models and/or Firebase account',
             '2 UserAuthDetailsModels have auth_id="%s": "123", "987"' % (
                 self.AUTH_ID)],
        ])

    def test_reports_duplicate_user_id_associations_as_inconsistency(self):
        self.set_up_entities(
            firebase_auth_id='123', create_assoc_by_auth_id=True)
        self.set_up_entities(
            firebase_auth_id='987',
            create_assoc_by_auth_id=True, create_assoc_by_user_id=True)

        self.firebase_sdk_stub.assert_is_not_user_multi(['123', '987'])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Found inconsistency in models and/or Firebase account',
             'UserIdByFirebaseAuthIdModel(id="123") does not correspond to a '
             'unique UserAuthDetailsModel'],
        ])

        self.firebase_sdk_stub.assert_is_not_user('123')
        self.firebase_sdk_stub.assert_is_user('987')

    def test_reports_model_without_firebase_auth_id(self):
        self.set_up_entities(
            firebase_auth_id=None, create_assoc_by_user_id=True)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Found inconsistency in models and/or Firebase account',
             'UserAuthDetailsModel(id="%s", firebase_auth_id=None) does not '
             'correspond to a firebase_auth_id' % self.USER_ID],
        ])

    def test_reports_mismatched_user_ids(self):
        self.set_up_entities(user_id='123', create_assoc_by_auth_id=True)
        self.set_up_entities(user_id='987', create_assoc_by_user_id=True)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Found inconsistency in models and/or Firebase account',
             'auth_id="%s" has inconsistent `user_id` assignments: '
             'UserIdByFirebaseAuthIdModel(user_id="123") does not match '
             'UserAuthDetailsModel(id="987")' % (self.AUTH_ID)]
        ])

    def test_reports_mismatched_deleted_values(self):
        self.set_up_entities(create_assoc_by_user_id=True)
        self.set_up_entities(
            create_assoc_by_auth_id=True, mark_assoc_by_auth_id_as_deleted=True)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Found inconsistency in models and/or Firebase account',
             'auth_id="%s" has inconsistent `deleted` assignments: '
             'UserIdByFirebaseAuthIdModel(user_id="%s", deleted=True) '
             'does not match UserAuthDetailsModel(id="%s", deleted=False)' % (
                 self.AUTH_ID, self.USER_ID, self.USER_ID)]
        ])

    def test_reports_uninitiated_disabled_firebase_account(self):
        self.set_up_entities(
            create_assoc_by_auth_id=True, create_assoc_by_user_id=True,
            create_firebase_account=True, disable_firebase_account=True)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Found inconsistency in models and/or Firebase account',
             'Firebase account with auth_id="%s" is disabled, but the user '
             'is not marked for deletion on Oppia' % self.AUTH_ID],
        ])
