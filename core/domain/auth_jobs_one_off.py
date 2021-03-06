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

"""Auth-related one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import itertools

from core import jobs
from core.domain import auth_domain
from core.platform import models
from core.platform.auth import firebase_auth_services
from core.platform.auth import gae_auth_services
import feconf
import python_utils

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions

ID_HASHING_FUNCTION = hash

MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL = 1000

AUDIT_KEY = 'INFO: Pre-existing Firebase accounts'
FAILURE_KEY = 'FAILURE: Failed to create Firebase accounts'
SUCCESS_KEY = 'SUCCESS: Created Firebase accounts'
WARNING_KEY = 'WARNING: No action needed'

SYSTEM_COMMITTER_ACK = 'INFO: SYSTEM_COMMITTER_ID skipped'

POPULATED_KEY = 'ALREADY_DONE'
NOT_POPULATED_KEY = 'NEEDS_WORK'

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))


class AuditFirebaseImportReadinessOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to confirm whether users are ready for Firebase import."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user):
        gae_auth_id = gae_auth_services.get_auth_id_from_user_id(user.id)
        # NOTE: This committer ID is a legacy ACL-bypass that we no longer
        # depend on. Because it is obsolete, we do not want it to have a
        # Firebase account associated with it, or even consider it for import.
        if gae_auth_id == feconf.SYSTEM_COMMITTER_ID:
            yield (SYSTEM_COMMITTER_ACK, user.id)
            return

        if user.deleted:
            yield ('[DELETED]', user.id)
        else:
            yield (user.email, user.id)

    @staticmethod
    def reduce(key, values):
        # NOTE: These are only sorted to make unit tests simpler.
        if key == SYSTEM_COMMITTER_ACK:
            yield (SYSTEM_COMMITTER_ACK, values)
            return

        joined_user_ids = ', '.join(sorted(values))

        if key == '[DELETED]':
            yield ('ERROR: Found deleted users', joined_user_ids)
        else:
            email = key
            if len(values) > 1:
                yield ('ERROR: %s is a shared email' % email, joined_user_ids)


class PopulateFirebaseAccountsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that maps over UserSettingsModels and imports them to Oppia's
    Firebase server. The latter requires that we "specify [an ID] at a minimum",
    so we use Oppia's user_id as the value (with the uid_ prefix stripped).

    NOTE: **DO NOT** ASSUME THAT FIREBASE IDS AND OPPIA USER IDS WILL BE THE
    SAME! We are only doing this for users that already exist; future users that
    sign up with Firebase will have an entirely different ID.
    """

    NUM_SHARDS = 50 # Arbitrary value.

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user):
        if user.deleted:
            return

        gae_auth_id = gae_auth_services.get_auth_id_from_user_id(user.id)
        # NOTE: This committer ID is a legacy ACL-bypass that we no longer
        # depend on. Because it is obsolete, we do not want it to have a
        # Firebase account associated with it.
        if gae_auth_id == feconf.SYSTEM_COMMITTER_ID:
            yield (SYSTEM_COMMITTER_ACK, user.id)
            return

        auth_id = firebase_auth_services.get_auth_id_from_user_id(user.id)
        if auth_id is not None:
            yield (POPULATED_KEY, 1)
        else:
            # Split up users into different shards to help speed up the job.
            sharding_key = (
                ID_HASHING_FUNCTION(user.id) %
                PopulateFirebaseAccountsOneOffJob.NUM_SHARDS)
            yield (
                sharding_key, (_strip_uid_prefix(user.id), user.id, user.email))

    @staticmethod
    def reduce(key, values):
        if key == POPULATED_KEY:
            yield (AUDIT_KEY, len(values))
            return
        elif key == SYSTEM_COMMITTER_ACK:
            yield (SYSTEM_COMMITTER_ACK, values)
            return

        try:
            # NOTE: "app" is the term Firebase uses for the "entry point" to the
            # Firebase SDK. Oppia only has one server, so it only needs to
            # instantiate one app.
            firebase_connection = firebase_admin.initialize_app()
        except Exception as exception:
            yield (WARNING_KEY, repr(exception))
            return

        # NOTE: This is only sorted to make unit testing easier.
        user_fields = sorted(ast.literal_eval(v) for v in values)
        user_records = [
            firebase_auth.ImportUserRecord(
                uid=auth_id, email=email, email_verified=True)
            for auth_id, _, email in user_fields
        ]

        # The Firebase Admin SDK places a hard-limit on the number of users that
        # can be "imported" in a single call. To compensate, we break up the
        # users into chunks.
        offsets = python_utils.RANGE(
            0, len(user_records), MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL)
        results = (
            _populate_firebase([record for record in record_group if record])
            for record_group in _grouper(
                user_records, MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL))

        assocs_to_create = []
        for offset, (result, exception) in python_utils.ZIP(offsets, results):
            if exception is not None:
                yield (FAILURE_KEY, repr(exception))
            else:
                successful_indices = set(python_utils.RANGE(
                    result.success_count + result.failure_count))
                for error in result.errors:
                    successful_indices.remove(error.index)
                    debug_info = (
                        'Import user_id=%r failed: %s' % (
                            user_fields[offset + error.index][1], error.reason))
                    yield (FAILURE_KEY, debug_info)
                assocs_to_create.extend(
                    auth_domain.AuthIdUserIdPair(*user_fields[offset + i][:2])
                    for i in successful_indices)

        if assocs_to_create:
            firebase_auth_services.associate_multi_auth_ids_with_user_ids(
                assocs_to_create)
            yield (SUCCESS_KEY, len(assocs_to_create))

        try:
            # NOTE: This is not dangerous. We are just deleting the resources
            # used to form a connection to Firebase servers.
            firebase_admin.delete_app(firebase_connection)
        except Exception as exception:
            yield (WARNING_KEY, repr(exception))


def _grouper(iterable, chunk_len, fillvalue=None):
    """Collect data into fixed-length chunks.

    Source: https://docs.python.org/3/library/itertools.html#itertools-recipes.

    Example:
        grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx"

    Args:
        iterable: iterable. Any kind of iterable object.
        chunk_len: int. The chunk size to group values.
        fillvalue: *. The value used to fill out the last chunk when the
            iterable is exhausted.

    Returns:
        iterable(iterable). A sequence of chunks over the input data.
    """
    # To understand how/why this works, please refer to the following
    # stackoverflow post: https://stackoverflow.com/a/49181132/4859885.
    args = [iter(iterable)] * chunk_len
    return itertools.izip_longest(*args, fillvalue=fillvalue) # pylint: disable=deprecated-itertools-function


def _populate_firebase(user_records):
    """Populates the Firebase server with the given user records.

    Args:
        user_records: list(firebase_admin.auth.ImportUserRecord). Users to store
            in Firebase.

    Returns:
        tuple(UserImportResult|None, Exception|None). The result of the
        operation, or an exception if the operation failed. Exactly one of the
        values will be non-None.
    """
    try:
        return (firebase_auth.import_users(user_records), None)
    except firebase_exceptions.FirebaseError as exception:
        return (None, exception)


def _strip_uid_prefix(user_id):
    """Removes the 'uid_' prefix from a user_id and returns the result."""
    return user_id[4:] if user_id.startswith('uid_') else user_id
