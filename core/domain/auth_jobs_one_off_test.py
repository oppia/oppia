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
import itertools

from constants import constants
from core.domain import auth_domain
from core.domain import auth_jobs_one_off as auth_jobs
from core.domain import taskqueue_services
from core.platform import models
from core.platform.auth import firebase_auth_services
from core.platform.auth import firebase_auth_services_test
from core.tests import test_utils
import feconf
import python_utils

import contextlib2

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))


class AuditFirebaseImportReadinessOneOffJobTests(test_utils.GenericTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False
    ENABLE_AUTH_SERVICES_STUB = False

    def count_one_off_jobs_in_queue(self):
        """Returns the number of one off jobs in the taskqueue."""
        return self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def run_one_off_job(self):
        """Begins the one off job and asserts it completes as expected.

        Returns:
            *. The output of the one off job.
        """
        job_id = auth_jobs.AuditFirebaseImportReadinessOneOffJob.create_new()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        auth_jobs.AuditFirebaseImportReadinessOneOffJob.enqueue(job_id)
        self.assertEqual(self.count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        return sorted(
            ast.literal_eval(o) for o in
            auth_jobs.AuditFirebaseImportReadinessOneOffJob.get_output(job_id))

    def create_user(self, user_id, email, deleted=False):
        """Creates a new user with the provided ID and email address.

        Args:
            user_id: str. The user's ID.
            email: str. The user's email address.
            deleted: bool. Value for the user's deleted property.
        """
        user_models.UserSettingsModel(
            id=user_id, email=email, deleted=deleted,
            role=feconf.ROLE_ID_EXPLORATION_EDITOR,
            preferred_language_codes=[constants.DEFAULT_LANGUAGE_CODE]
        ).put()

    def test_users_with_distinct_emails_returns_empty_output(self):
        self.create_user('u1', 'u1@test.com')
        self.create_user('u2', 'u2@test.com')

        self.assertEqual(self.run_one_off_job(), [])

    def test_users_with_same_email_are_reported(self):
        self.create_user('u1', 'a@test.com')
        self.create_user('u2', 'a@test.com')

        self.assertEqual(self.run_one_off_job(), [
            ['ERROR: a@test.com is a shared email', 'u1, u2'],
        ])

    def test_deleted_users_are_reported(self):
        self.create_user('u1', 'u1@test.com', deleted=True)
        self.create_user('u2', 'u2@test.com', deleted=True)
        self.create_user('u3', 'u3@test.com', deleted=False)

        self.assertEqual(self.run_one_off_job(), [
            ['ERROR: Found deleted users', 'u1, u2'],
        ])

    def test_system_committer_is_ignored_by_duplicate_email_check(self):
        self.create_user('xx', 'admin@test.com')
        self.create_user('yy', 'admin@test.com')
        auth_models.UserAuthDetailsModel(
            id='xx', gae_id=feconf.SYSTEM_COMMITTER_ID
        ).put()
        auth_models.UserIdentifiersModel(
            id=feconf.SYSTEM_COMMITTER_ID, user_id='xx'
        ).put()

        self.assertEqual(self.run_one_off_job(), [
            ['INFO: SYSTEM_COMMITTER_ID skipped', ['xx']],
        ])

    def test_system_committer_is_ignored_by_deleted_check(self):
        self.create_user('u1', 'admin@test.com', deleted=True)
        auth_models.UserAuthDetailsModel(
            id='u1', gae_id=feconf.SYSTEM_COMMITTER_ID
        ).put()
        auth_models.UserIdentifiersModel(
            id=feconf.SYSTEM_COMMITTER_ID, user_id='u1'
        ).put()

        self.assertEqual(self.run_one_off_job(), [
            ['INFO: SYSTEM_COMMITTER_ID skipped', ['u1']],
        ])


class PopulateFirebaseAccountsOneOffJobTests(test_utils.GenericTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False
    ENABLE_AUTH_SERVICES_STUB = False

    def setUp(self):
        super(PopulateFirebaseAccountsOneOffJobTests, self).setUp()
        self._auth_id_generator = itertools.count()
        self.exit_stack = contextlib2.ExitStack()
        self.sdk_stub = firebase_auth_services_test.FirebaseAdminSdkStub()

        self.sdk_stub.install(self)
        self.exit_stack.callback(self.sdk_stub.uninstall)

        # Forces all users to produce the same hash value during unit tests to
        # prevent them from being sharded and complicating the testing logic.
        self.exit_stack.enter_context(self.swap_to_always_return(
            auth_jobs, 'ID_HASHING_FUNCTION', value=1))

    def tearDown(self):
        self.exit_stack.close()
        super(PopulateFirebaseAccountsOneOffJobTests, self).tearDown()

    def count_one_off_jobs_in_queue(self):
        """Returns the number of one off jobs in the taskqueue."""
        return self.count_jobs_in_mapreduce_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def run_one_off_job(self):
        """Begins the one off job and asserts it completes as expected.

        Returns:
            *. The output of the one off job.
        """
        job_id = auth_jobs.PopulateFirebaseAccountsOneOffJob.create_new()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        auth_jobs.PopulateFirebaseAccountsOneOffJob.enqueue(job_id)
        self.assertEqual(self.count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        return sorted(
            ast.literal_eval(o) for o in
            auth_jobs.PopulateFirebaseAccountsOneOffJob.get_output(job_id))

    def create_oppia_user(self, deleted=False):
        """Returns an (auth_id, user_id) pair for a new user.

        Args:
            deleted: bool. Value for the user's deleted property.

        Returns:
            AuthIdUserIdPair. The association the user should create.
        """
        auth_id = 'aid%d' % python_utils.NEXT(self._auth_id_generator)
        user_id = 'uid_%s' % auth_id
        user_models.UserSettingsModel(
            id=user_id, email=('email_%s@test.com' % auth_id), deleted=deleted,
            role=feconf.ROLE_ID_EXPLORATION_EDITOR,
            preferred_language_codes=[constants.DEFAULT_LANGUAGE_CODE]
        ).put()
        return auth_domain.AuthIdUserIdPair(auth_id, user_id)

    def create_multi_oppia_users(self, count):
        """Returns specified number of (auth_id, user_id) pairs for new users.

        Args:
            count: int. The number of users to create.

        Returns:
            list(auth_domain.AuthIdUserIdPair). The auth associations of the
            users.
        """
        return [self.create_oppia_user() for _ in python_utils.RANGE(count)]

    def assert_auth_mapping_exists(self, auth_assoc):
        """Asserts that the given auth association exists.

        Args:
            auth_assoc: AuthIdUserIdPair. The association to check.
        """
        auth_id, user_id = auth_assoc
        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id(user_id), auth_id)
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id(auth_id), user_id)

    def assert_auth_mapping_does_not_exist(self, auth_assoc):
        """Asserts that the given auth association does not exist.

        Args:
            auth_assoc: AuthIdUserIdPair. The association to check.
        """
        auth_id, user_id = auth_assoc
        self.assertIsNone(
            firebase_auth_services.get_auth_id_from_user_id(user_id))
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id(auth_id))

    def assert_multi_auth_mappings_exist(self, auth_assocs):
        """Asserts that the given auth associations exist.

        Args:
            auth_assocs: list(AuthIdUserIdPair). The association to check.
        """
        auth_ids, user_ids = (list(a) for a in python_utils.ZIP(*auth_assocs))
        self.assertEqual(
            firebase_auth_services.get_multi_auth_ids_from_user_ids(user_ids),
            auth_ids)
        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(auth_ids),
            user_ids)

    def assert_multi_auth_mappings_do_not_exist(self, auth_assocs):
        """Asserts that the given auth associations exist.

        Args:
            auth_assocs: list(AuthIdUserIdPair). The association to check.
        """
        auth_ids, user_ids = (list(a) for a in python_utils.ZIP(*auth_assocs))
        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(auth_ids),
            [None] * len(auth_ids))
        self.assertEqual(
            firebase_auth_services.get_multi_auth_ids_from_user_ids(user_ids),
            [None] * len(user_ids))

    def test_successfully_imports_one_user(self):
        auth_assoc = self.create_oppia_user()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 1],
        ])

        self.assert_auth_mapping_exists(auth_assoc)
        self.sdk_stub.assert_firebase_user_exists(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 1],
        ])

    def test_successfully_imports_users_in_bulk(self):
        self.exit_stack.enter_context(
            self.swap(auth_jobs, 'MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL', 3))

        auth_assocs = self.create_multi_oppia_users(11)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 11],
        ])

        self.assert_multi_auth_mappings_exist(auth_assocs)
        self.sdk_stub.assert_multi_firebase_users_exist(
            [a.auth_id for a in auth_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 11],
        ])

    def test_skips_deleted_users(self):
        self.create_oppia_user(deleted=True)

        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_initialize_app_error_is_reported(self):
        self.exit_stack.enter_context(self.sdk_stub.mock_initialize_app_error())

        auth_assoc = self.create_oppia_user()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['WARNING: No action needed',
             'UnknownError(u\'could not init\',)'],
        ])

        self.assert_auth_mapping_does_not_exist(auth_assoc)
        self.sdk_stub.assert_firebase_user_does_not_exist(auth_assoc.auth_id)

    def test_delete_app_error_is_reported(self):
        self.exit_stack.enter_context(self.sdk_stub.mock_delete_app_error())

        auth_assoc = self.create_oppia_user()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 1],
            ['WARNING: No action needed',
             'UnknownError(u\'could not delete app\',)'],
        ])

        # Deleting the app should not be a fatal error, so we should still
        # create a firebase account and an association.
        self.assert_auth_mapping_exists(auth_assoc)
        self.sdk_stub.assert_firebase_user_exists(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 1],
        ])

    def test_import_user_error_is_reported(self):
        mock_import_users_error = self.sdk_stub.mock_import_users_error(
            call_error_sequence=(True,)) # Always raise an exception.

        auth_assoc = self.create_oppia_user()

        with mock_import_users_error:
            self.assertItemsEqual(self.run_one_off_job(), [
                ['FAILURE: Failed to create Firebase accounts',
                 'DataLossError(u\'Failed to connect\',)'],
            ])

        self.assert_auth_mapping_does_not_exist(auth_assoc)
        self.sdk_stub.assert_firebase_user_does_not_exist(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 1],
        ])

        self.assert_auth_mapping_exists(auth_assoc)
        self.sdk_stub.assert_firebase_user_exists(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 1],
        ])

    def test_single_import_batch_error_is_reported(self):
        self.exit_stack.enter_context(
            self.swap(auth_jobs, 'MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL', 3))
        mock_import_users_error = self.sdk_stub.mock_import_users_error(
            call_error_sequence=(False, True, False))

        auth_assocs = self.create_multi_oppia_users(9)

        with mock_import_users_error:
            self.assertItemsEqual(self.run_one_off_job(), [
                ['FAILURE: Failed to create Firebase accounts',
                 'DataLossError(u\'Failed to connect\',)'],
                ['SUCCESS: Created Firebase accounts', 6],
            ])

        successful_assocs = auth_assocs[:3] + auth_assocs[6:]
        self.assert_multi_auth_mappings_exist(successful_assocs)
        self.sdk_stub.assert_multi_firebase_users_exist(
            [a.auth_id for a in successful_assocs])
        failed_assocs = auth_assocs[3:6]
        self.assert_multi_auth_mappings_do_not_exist(failed_assocs)
        self.sdk_stub.assert_multi_firebase_users_do_not_exist(
            [a.auth_id for a in failed_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 6],
            ['SUCCESS: Created Firebase accounts', 3],
        ])

        self.assert_multi_auth_mappings_exist(auth_assocs)
        self.sdk_stub.assert_multi_firebase_users_exist(
            [a.auth_id for a in auth_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 9],
        ])

    def test_individual_user_import_errors_are_reported(self):
        self.exit_stack.enter_context(
            self.swap(auth_jobs, 'MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL', 3))
        mock_import_users_error = self.sdk_stub.mock_import_users_error(
            user_error_sequence=(False, True, False, False))

        auth_assocs = self.create_multi_oppia_users(10)

        with mock_import_users_error:
            self.assertItemsEqual(self.run_one_off_job(), [
                ['FAILURE: Failed to create Firebase accounts',
                 'Import user_id=\'uid_aid1\' failed: FirebaseError'],
                ['FAILURE: Failed to create Firebase accounts',
                 'Import user_id=\'uid_aid5\' failed: FirebaseError'],
                ['FAILURE: Failed to create Firebase accounts',
                 'Import user_id=\'uid_aid9\' failed: FirebaseError'],
                ['SUCCESS: Created Firebase accounts', 7],
            ])

        successful_assocs = (
            auth_assocs[:1] + auth_assocs[2:5] + auth_assocs[6:9])
        self.assert_multi_auth_mappings_exist(successful_assocs)
        self.sdk_stub.assert_multi_firebase_users_exist(
            [a.auth_id for a in successful_assocs])
        failed_assocs = [auth_assocs[1], auth_assocs[5], auth_assocs[9]]
        self.assert_multi_auth_mappings_do_not_exist(failed_assocs)
        self.sdk_stub.assert_multi_firebase_users_do_not_exist(
            [a.auth_id for a in failed_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 7],
            ['SUCCESS: Created Firebase accounts', 3],
        ])

        self.assert_multi_auth_mappings_exist(auth_assocs)
        self.sdk_stub.assert_multi_firebase_users_exist(
            [a.auth_id for a in auth_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 10],
        ])

    def test_system_comitter_is_ignored(self):
        auth_assoc = self.create_oppia_user()
        auth_models.UserAuthDetailsModel(
            id=auth_assoc.user_id, gae_id=feconf.SYSTEM_COMMITTER_ID
        ).put()
        auth_models.UserIdentifiersModel(
            id=feconf.SYSTEM_COMMITTER_ID, user_id=auth_assoc.user_id
        ).put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: SYSTEM_COMMITTER_ID skipped', [auth_assoc.user_id]],
        ])

        self.assert_auth_mapping_does_not_exist(auth_assoc)
        self.sdk_stub.assert_firebase_user_does_not_exist(auth_assoc.auth_id)
