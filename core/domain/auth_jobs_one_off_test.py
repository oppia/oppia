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
from core.platform.auth import gae_auth_services
from core.tests import test_utils
import feconf
import python_utils

import contextlib2
import firebase_admin.auth

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))

datastore_services = models.Registry.import_datastore_services()


class FirebaseOneOffJobTestBase(test_utils.AppEngineTestBase):
    """Base class for Firebase-dependent one-off jobs."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def setUp(self):
        super(FirebaseOneOffJobTestBase, self).setUp()
        self.exit_stack = contextlib2.ExitStack()
        self.firebase_sdk_stub = (
            firebase_auth_services_test.FirebaseAdminSdkStub())

        self.firebase_sdk_stub.install(self)
        self.exit_stack.callback(self.firebase_sdk_stub.uninstall)

    def tearDown(self):
        self.exit_stack.close()
        super(FirebaseOneOffJobTestBase, self).tearDown()

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

    def create_user_auth_models(
            self, user_id, email=None, firebase_auth_id=None, gae_id=None,
            deleted=False):
        """Adds the minimum model set necessary for a user account.

        Args:
            user_id: str. The Oppia ID of the user.
            email: str|None. The email address of the user. If None, one will be
                generated.
            firebase_auth_id: str|None. The Firebase account ID of the user. If
                None, no Firebase-related models will be created.
            gae_id: str|None. The GAE ID of the user. If None, no GAE-related
                models will be created.
            deleted: bool. Value for the deleted property of the models.
        """
        if email is None:
            email = '%s@example.com' % user_id

        models_to_put = [
            user_models.UserSettingsModel(id=user_id, email=email),
            auth_models.UserAuthDetailsModel(
                id=user_id, firebase_auth_id=firebase_auth_id, gae_id=gae_id,
                deleted=deleted),
        ]
        if firebase_auth_id is not None:
            models_to_put.append(
                auth_models.UserIdByFirebaseAuthIdModel(
                    id=firebase_auth_id, user_id=user_id,
                    deleted=deleted))
        if gae_id is not None:
            models_to_put.append(
                auth_models.UserIdentifiersModel(
                    id=gae_id, user_id=user_id, deleted=deleted))

        datastore_services.put_multi(models_to_put)

    def assert_firebase_assoc_exists(self, firebase_auth_id, user_id):
        """Asserts that the given user's Firebase association exists.

        Args:
            user_id: str. The Oppia ID of the user.
            firebase_auth_id: str. The Firebase account ID of the user.
        """
        self.assertEqual(
            firebase_auth_services.get_auth_id_from_user_id(user_id),
            firebase_auth_id)
        self.assertEqual(
            firebase_auth_services.get_user_id_from_auth_id(firebase_auth_id),
            user_id)

    def assert_firebase_assoc_does_not_exist(self, firebase_auth_id, user_id):
        """Asserts that the given user's Firebase association doesn't exist.

        Args:
            firebase_auth_id: str. The Firebase account ID of the user.
            user_id: str. The Oppia ID of the user.
        """
        self.assertIsNone(
            firebase_auth_services.get_auth_id_from_user_id(user_id))
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_auth_id(firebase_auth_id))

    def assert_firebase_assoc_exists_multi(self, assocs):
        """Asserts that the given users' Firebase association exists.

        Args:
            assocs: list(AuthIdUserIdPair). The associations to check.
        """
        auth_ids, user_ids = (list(a) for a in python_utils.ZIP(*assocs))
        self.assertEqual(
            firebase_auth_services.get_multi_auth_ids_from_user_ids(user_ids),
            auth_ids)
        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(auth_ids),
            user_ids)

    def assert_firebase_assoc_does_not_exist_multi(self, assocs):
        """Asserts that the given users' Firebase association doesn't exist.

        Args:
            assocs: list(AuthIdUserIdPair). The associations to check.
        """
        auth_ids, user_ids = (list(a) for a in python_utils.ZIP(*assocs))
        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_auth_ids(auth_ids),
            [None] * len(auth_ids))
        self.assertEqual(
            firebase_auth_services.get_multi_auth_ids_from_user_ids(user_ids),
            [None] * len(user_ids))

    def assert_gae_assoc_exists(self, gae_id, user_id):
        """Asserts that the given user's GAE association exists.

        Args:
            user_id: str. The Oppia ID of the user.
            gae_id: str. The GAE ID of the user.
        """
        self.assertEqual(
            gae_auth_services.get_auth_id_from_user_id(user_id), gae_id)
        self.assertEqual(
            gae_auth_services.get_user_id_from_auth_id(gae_id), user_id)

    def assert_gae_assoc_does_not_exist(self, gae_id, user_id):
        """Asserts that the given user's GAE association doesn't exist.

        Args:
            user_id: str. The Oppia ID of the user.
            gae_id: str. The GAE ID of the user.
        """
        self.assertIsNone(gae_auth_services.get_auth_id_from_user_id(user_id))
        self.assertIsNone(gae_auth_services.get_user_id_from_auth_id(gae_id))

    def assert_gae_assoc_exists_multi(self, assocs):
        """Asserts that the given users' GAE association exists.

        Args:
            assocs: list(AuthIdUserIdPair). The associations to check.
        """
        auth_ids, user_ids = (list(a) for a in python_utils.ZIP(*assocs))
        self.assertEqual(
            gae_auth_services.get_multi_auth_ids_from_user_ids(user_ids),
            auth_ids)
        self.assertEqual(
            gae_auth_services.get_multi_user_ids_from_auth_ids(auth_ids),
            user_ids)

    def assert_gae_assoc_does_not_exist_multi(self, assocs):
        """Asserts that the given users' GAE association doesn't exist.

        Args:
            assocs: list(AuthIdUserIdPair). The associations to check.
        """
        auth_ids, user_ids = (list(a) for a in python_utils.ZIP(*assocs))
        self.assertEqual(
            gae_auth_services.get_multi_user_ids_from_auth_ids(auth_ids),
            [None] * len(auth_ids))
        self.assertEqual(
            gae_auth_services.get_multi_auth_ids_from_user_ids(user_ids),
            [None] * len(user_ids))


class SyncFirebaseAccountsOneOffJobTests(FirebaseOneOffJobTestBase):

    JOB_CLASS = auth_jobs.SyncFirebaseAccountsOneOffJob

    USER_ID = 'uid_foo'
    AUTH_ID = 'foo'
    EMAIL = 'test@example.com'

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


class PopulateFirebaseAccountsOneOffJobTests(FirebaseOneOffJobTestBase):

    JOB_CLASS = auth_jobs.PopulateFirebaseAccountsOneOffJob

    def setUp(self):
        super(PopulateFirebaseAccountsOneOffJobTests, self).setUp()
        self._auth_id_generator = itertools.count()
        # Forces all users to produce the same hash value during unit tests to
        # prevent them from being sharded and complicating the testing logic.
        self.exit_stack.enter_context(self.swap_to_always_return(
            auth_jobs, 'ID_HASHING_FUNCTION', value=1))

    def create_oppia_user(self, email=None, deleted=False):
        """Returns an (auth_id, user_id) pair for a new user.

        Args:
            email: str. The email address of the user.
            deleted: bool. Value for the user's deleted property.

        Returns:
            AuthIdUserIdPair. The association the user should create.
        """
        auth_id = 'aid_index_%d' % python_utils.NEXT(self._auth_id_generator)
        user_id = 'uid_%s' % auth_id
        if email is None:
            email = 'email_%s@test.com' % auth_id
        user_models.UserSettingsModel(
            id=user_id, email=email, deleted=deleted,
            role=feconf.ROLE_ID_FULL_USER,
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

    def test_successfully_imports_one_user(self):
        auth_assoc = self.create_oppia_user()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 1],
        ])

        self.assert_firebase_assoc_exists(*auth_assoc)
        self.firebase_sdk_stub.assert_is_user(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 1],
        ])

    def test_successfully_imports_users_in_bulk(self):
        self.exit_stack.enter_context(self.swap(
            auth_jobs.PopulateFirebaseAccountsOneOffJob,
            'MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL', 3))

        auth_assocs = self.create_multi_oppia_users(11)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 11],
        ])

        self.assert_firebase_assoc_exists_multi(auth_assocs)
        self.firebase_sdk_stub.assert_is_user_multi(
            [a.auth_id for a in auth_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 11],
        ])

    def test_skips_deleted_users(self):
        self.create_oppia_user(deleted=True)

        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_import_user_error_is_reported(self):
        mock_import_users_error = (
            self.firebase_sdk_stub.mock_import_users_error(
                batch_error_pattern=[Exception('uh-oh!')]))

        auth_assoc = self.create_oppia_user()

        with mock_import_users_error:
            self.assertItemsEqual(self.run_one_off_job(), [
                ['ERROR: Failed to create Firebase accounts',
                 'Exception(u\'uh-oh!\',)'],
            ])

        self.assert_firebase_assoc_does_not_exist(*auth_assoc)
        self.firebase_sdk_stub.assert_is_not_user(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 1],
        ])

        self.assert_firebase_assoc_exists(*auth_assoc)
        self.firebase_sdk_stub.assert_is_user(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 1],
        ])

    def test_single_import_batch_error_is_reported(self):
        self.exit_stack.enter_context(self.swap(
            auth_jobs.PopulateFirebaseAccountsOneOffJob,
            'MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL', 3))
        mock_import_users_error = (
            self.firebase_sdk_stub.mock_import_users_error(
                batch_error_pattern=[None, Exception('uh-oh!'), None]))

        auth_assocs = self.create_multi_oppia_users(9)

        with mock_import_users_error:
            self.assertItemsEqual(self.run_one_off_job(), [
                ['ERROR: Failed to create Firebase accounts',
                 'Exception(u\'uh-oh!\',)'],
                ['SUCCESS: Created Firebase accounts', 6],
            ])

        successful_assocs = auth_assocs[:3] + auth_assocs[6:]
        self.assert_firebase_assoc_exists_multi(successful_assocs)
        self.firebase_sdk_stub.assert_is_user_multi(
            [a.auth_id for a in successful_assocs])
        failed_assocs = auth_assocs[3:6]
        self.assert_firebase_assoc_does_not_exist_multi(failed_assocs)
        self.firebase_sdk_stub.assert_is_not_user_multi(
            [a.auth_id for a in failed_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 6],
            ['SUCCESS: Created Firebase accounts', 3],
        ])

        self.assert_firebase_assoc_exists_multi(auth_assocs)
        self.firebase_sdk_stub.assert_is_user_multi(
            [a.auth_id for a in auth_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 9],
        ])

    def test_individual_user_import_errors_are_reported(self):
        self.exit_stack.enter_context(self.swap(
            auth_jobs.PopulateFirebaseAccountsOneOffJob,
            'MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL', 3))
        mock_import_users_error = (
            self.firebase_sdk_stub.mock_import_users_error(
                individual_error_pattern=[None, 'uh-oh!', None, None]))

        auth_assocs = self.create_multi_oppia_users(10)

        with mock_import_users_error:
            self.assertItemsEqual(self.run_one_off_job(), [
                ['ERROR: Failed to create Firebase accounts',
                 'Import user_id=\'uid_aid_index_1\' failed: uh-oh!'],
                ['ERROR: Failed to create Firebase accounts',
                 'Import user_id=\'uid_aid_index_5\' failed: uh-oh!'],
                ['ERROR: Failed to create Firebase accounts',
                 'Import user_id=\'uid_aid_index_9\' failed: uh-oh!'],
                ['SUCCESS: Created Firebase accounts', 7],
            ])

        successful_assocs = (
            auth_assocs[0:1] + auth_assocs[2:5] + auth_assocs[6:9])
        self.assert_firebase_assoc_exists_multi(successful_assocs)
        self.firebase_sdk_stub.assert_is_user_multi(
            [a.auth_id for a in successful_assocs])
        failed_assocs = [auth_assocs[1], auth_assocs[5], auth_assocs[9]]
        self.assert_firebase_assoc_does_not_exist_multi(failed_assocs)
        self.firebase_sdk_stub.assert_is_not_user_multi(
            [a.auth_id for a in failed_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 7],
            ['SUCCESS: Created Firebase accounts', 3],
        ])

        self.assert_firebase_assoc_exists_multi(auth_assocs)
        self.firebase_sdk_stub.assert_is_user_multi(
            [a.auth_id for a in auth_assocs])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 10],
        ])

    def test_super_admin_is_created(self):
        auth_assoc = self.create_oppia_user(email=feconf.ADMIN_EMAIL_ADDRESS)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Created Firebase accounts', 1],
            ['INFO: Super admin created', [auth_assoc.user_id]],
        ])

        self.assert_firebase_assoc_exists(*auth_assoc)
        self.firebase_sdk_stub.assert_is_super_admin(auth_assoc.auth_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Pre-existing Firebase accounts', 1],
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

        self.assert_firebase_assoc_does_not_exist(*auth_assoc)
        self.firebase_sdk_stub.assert_is_not_user(auth_assoc.auth_id)


class SeedFirebaseOneOffJobTests(FirebaseOneOffJobTestBase):

    JOB_CLASS = auth_jobs.SeedFirebaseOneOffJob

    def run_one_off_job(self, include_seed_ack=False):
        output = super(SeedFirebaseOneOffJobTests, self).run_one_off_job()
        if include_seed_ack:
            return output
        return [o for o in output if o[0] != 'INFO: Found FirebaseSeedModel']

    def put_firebase_seed_model(self):
        """Creates the sole expected FirebaseSeedModel into storage."""
        auth_models.FirebaseSeedModel(
            id=auth_models.ONLY_FIREBASE_SEED_MODEL_ID).put()

    def test_with_no_models(self):
        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_wipes_firebase_auth_models_of_non_admin_user(self):
        self.create_user_auth_models('uid_abc', firebase_auth_id='123')

        self.assert_firebase_assoc_exists('123', 'uid_abc')
        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: UserAuthDetailsModel wiped', 1],
            ['SUCCESS: UserIdByFirebaseAuthIdModel wiped', 1],
        ])
        self.assert_firebase_assoc_does_not_exist('123', 'uid_abc')

    def test_ignores_users_without_firebase_auth_models(self):
        self.create_user_auth_models('uid_abc', gae_id='123')

        self.assert_gae_assoc_exists('123', 'uid_abc')
        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: UserAuthDetailsModel already wiped', 1],
        ])
        self.assert_gae_assoc_exists('123', 'uid_abc')

    def test_acknowledges_admin_email_address_without_modifying_it(self):
        self.create_user_auth_models(
            'uid_abc', email=feconf.ADMIN_EMAIL_ADDRESS, firebase_auth_id='123')
        self.firebase_sdk_stub.create_user(
            '123', email=feconf.ADMIN_EMAIL_ADDRESS)

        self.assert_firebase_assoc_exists('123', 'uid_abc')

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Found feconf.ADMIN_EMAIL_ADDRESS in UserAuthDetailsModel',
             ['user_id=uid_abc']],
            ['INFO: Found feconf.ADMIN_EMAIL_ADDRESS in '
             'UserIdByFirebaseAuthIdModel', ['user_id=uid_abc']],
        ])

        self.assert_firebase_assoc_exists('123', 'uid_abc')

    def test_acknowledges_system_comitter_id_without_modifying_it(self):
        self.create_user_auth_models(
            'uid_abc', firebase_auth_id='123',
            gae_id=feconf.SYSTEM_COMMITTER_ID, email=feconf.ADMIN_EMAIL_ADDRESS)
        self.firebase_sdk_stub.create_user(
            '123', email=feconf.ADMIN_EMAIL_ADDRESS)

        self.assert_firebase_assoc_exists('123', 'uid_abc')
        self.assert_gae_assoc_exists(feconf.SYSTEM_COMMITTER_ID, 'uid_abc')

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Found feconf.SYSTEM_COMMITTER_ID in UserAuthDetailsModel',
             ['user_id=uid_abc']],
            ['INFO: Found feconf.SYSTEM_COMMITTER_ID in '
             'UserIdByFirebaseAuthIdModel', ['user_id=uid_abc']],
        ])

        self.assert_firebase_assoc_exists('123', 'uid_abc')

    def test_acknowledges_firebase_seed_model(self):
        self.put_firebase_seed_model()

        self.assertItemsEqual(self.run_one_off_job(include_seed_ack=True), [
            ['INFO: Found FirebaseSeedModel', ['1']],
        ])

    def test_deletes_many_users(self):
        self.put_firebase_seed_model()

        self.exit_stack.enter_context(self.swap(
            self.JOB_CLASS, 'MAX_USERS_FIREBASE_CAN_DELETE_PER_CALL', 3))

        uids = ['aid_%d' % i for i in python_utils.RANGE(10)]
        self.firebase_sdk_stub.import_users(
            [firebase_admin.auth.ImportUserRecord(uid) for uid in uids])

        self.firebase_sdk_stub.assert_is_user_multi(uids)
        self.assertItemsEqual(self.run_one_off_job(), [
            ['SUCCESS: Firebase accounts deleted', 10],
        ])
        self.firebase_sdk_stub.assert_is_not_user_multi(uids)

    def test_acknowledges_firebase_super_admin(self):
        self.put_firebase_seed_model()

        self.firebase_sdk_stub.create_user(
            '123', email=feconf.ADMIN_EMAIL_ADDRESS)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['INFO: Found feconf.ADMIN_EMAIL_ADDRESS in Firebase account',
             ['firebase_auth_id=123']],
        ])

    def test_reports_error_if_user_batch_failed(self):
        self.put_firebase_seed_model()

        uh_oh = Exception('uh-oh!')
        unlucky = Exception('unlucky')
        self.exit_stack.enter_context(
            self.firebase_sdk_stub.mock_delete_users_error(
                batch_error_pattern=[None, uh_oh, None, unlucky]))
        self.exit_stack.enter_context(self.swap(
            self.JOB_CLASS, 'MAX_USERS_FIREBASE_CAN_DELETE_PER_CALL', 3))

        uids = ['aid_%d' % i for i in python_utils.RANGE(10)]
        self.firebase_sdk_stub.import_users(
            [firebase_admin.auth.ImportUserRecord(uid) for uid in uids])

        self.firebase_sdk_stub.assert_is_user_multi(uids)
        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Failed to delete a batch of Firebase accounts',
             'count=4, reasons=[%r, %r]' % (uh_oh, unlucky)],
            ['SUCCESS: Firebase accounts deleted', 6],
        ])
        self.firebase_sdk_stub.assert_is_not_user_multi(uids[:3] + uids[6:9])
        self.firebase_sdk_stub.assert_is_user_multi(uids[3:6] + uids[9:])

    def test_reports_error_if_individual_users_failed(self):
        self.put_firebase_seed_model()

        self.exit_stack.enter_context(
            self.firebase_sdk_stub.mock_delete_users_error(
                individual_error_pattern=[None, 'uh-oh!', None, None]))
        self.exit_stack.enter_context(self.swap(
            self.JOB_CLASS, 'MAX_USERS_FIREBASE_CAN_DELETE_PER_CALL', 3))

        uids = ['aid_%d' % i for i in python_utils.RANGE(10)]
        self.firebase_sdk_stub.import_users(
            [firebase_admin.auth.ImportUserRecord(uid) for uid in uids])

        self.firebase_sdk_stub.assert_is_user_multi(uids)
        self.assertItemsEqual(self.run_one_off_job(), [
            ['ERROR: Failed to delete an individual Firebase account',
             ['firebase_auth_id=aid_1, reason=uh-oh!',
              'firebase_auth_id=aid_5, reason=uh-oh!',
              'firebase_auth_id=aid_9, reason=uh-oh!']
            ],
            ['SUCCESS: Firebase accounts deleted', 7],
        ])


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
            role=feconf.ROLE_ID_FULL_USER,
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
