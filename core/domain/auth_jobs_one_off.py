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
import python_utils

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions

FIREBASE_IMPORT_USERS_MAX_LEN = 1000

AUDIT_KEY = 'INFO: Pre-existing Firebase accounts'
FAILURE_KEY = 'FAILURE: Failed to create Firebase accounts'
SUCCESS_KEY = 'SUCCESS: Created Firebase accounts'
WARNING_KEY = 'WARNING: No action needed'

POPULATED_KEY = 'ALREADY_DONE'
NOT_POPULATED_KEY = 'NEEDS_WORK'

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))


class AuditUserEmailsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to confirm whether every user has a unique email address."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user):
        yield (user.email, user.id)

    @staticmethod
    def reduce(email, user_ids):
        if len(user_ids) > 1:
            yield (
                'ERROR: %s is a shared email' % email,
                # NOTE: These are only sorted to make unit tests simpler.
                ', '.join(sorted(user_ids)))


class PopulateFirebaseAccountsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that maps over UserSettingsModels and imports them to Oppia's
    Firebase server. The latter requires that we "specify [an ID] at a minimum",
    so we use Oppia's user_id as the value (with the uid_ prefix stripped).

    NOTE: **DO NOT** ASSUME THAT FIREBASE IDS AND OPPIA USER IDS WILL BE THE
    SAME! We are only doing this for users that already exist; future users that
    sign up with Firebase will have an entirely different ID.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user):
        auth_id = firebase_auth_services.get_auth_id_from_user_id(user.id)
        if auth_id is not None:
            yield (POPULATED_KEY, 1)
        else:
            yield (
                NOT_POPULATED_KEY,
                (_strip_uid_prefix(user.id), user.id, user.email, user.deleted))

    @staticmethod
    def reduce(key, values):
        if key == POPULATED_KEY:
            yield (AUDIT_KEY, len(values))
            return

        try:
            app = firebase_admin.initialize_app()
        except Exception as exception:
            yield (WARNING_KEY, repr(exception))
            return

        # NOTE: This is only sorted to make unit testing easier.
        user_fields = sorted(ast.literal_eval(v) for v in values)
        user_records = [
            firebase_auth.ImportUserRecord(
                uid=auth_id, email=email, disabled=disabled,
                email_verified=True)
            for auth_id, _, email, disabled in user_fields
        ]

        # The Firebase Admin SDK places a hard-limit on the number of users that
        # can be "imported" in a single call. To compensate, we break up the
        # users into chunks.
        offsets = python_utils.RANGE(
            0, len(user_records), FIREBASE_IMPORT_USERS_MAX_LEN)
        results = (
            _populate_firebase([record for record in record_group if record])
            for record_group in _grouper(
                user_records, FIREBASE_IMPORT_USERS_MAX_LEN))

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
            firebase_admin.delete_app(app)
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
    return user_id[4:]
