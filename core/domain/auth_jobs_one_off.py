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

from core import jobs
from core.platform import models
import feconf

from firebase_admin import auth as firebase_auth

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))

ID_HASHING_FUNCTION = hash


class SyncFirebaseAccountsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to sync Firebase accounts with Oppia's user accounts.

    This job does not print aggregated success output, because the reduce phase
    is sharded by auth_id and could potentially generate tens of 1000s of
    privacy-sensitive outputs. Instead, success is interpreted as an output
    without any ERRORs.

    This job is idempotent.

    Pre-conditions:
        - The models on Oppia reflect the most up-to-date values. Specifically,
          a user is considered to "exist" IF AND ONLY IF a UserSettingsModel
          exists.
        - Exactly 1 FirebaseSeedModel exists.
        - SeedFirebaseOneOffJob has succeeded AT LEAST ONCE in the history of
          the database. This includes backups of the database created _after_
          the job is run.
        - PopulateFirebaseAccountsOneOffJob has succeeded AT LEAST ONCE in the
          history of the database, WITHOUT creating any new accounts, AFTER
          BOTH:
              1. SeedFirebaseOneOffJob has succeeded.
              2. Firebase user authentication has been deployed to the server.

    Post-conditions:
        - There is a 1-to-1-to-1 mapping between UserAuthDetailsModel,
          UserIdByFirebaseAuthIdModel, and individual Firebase accounts; using
          firebase_auth_id as the key. The sole exception is:
              UserAuthDetailsModel(gae_id=feconf.SYSTEM_COMMITTER_ID)
        - UserAuthDetailsModel.deleted, UserIdByFirebaseAuthIdModel.deleted, and
          FirebaseAccount.disabled each have the same respective boolean value.
      """

    SYSTEM_COMMITTER_ACK = 'INFO: SYSTEM_COMMITTER_ID skipped'

    EMPTY_AUTH_ID_KEY = '<EMPTY_AUTH_ID_KEY>'
    ASSOC_BY_AUTH_ID_KEY = 'assoc_info_by_auth_id'
    ASSOC_BY_USER_ID_KEY = 'assoc_info_by_user_id'
    FIREBASE_ACCOUNT_KEY = 'firebase_account_info'

    ERROR_ASSOC_INCONSISTENCIES = (
        'ERROR: Found inconsistency in models and/or Firebase account')

    @classmethod
    def entity_classes_to_map_over(cls):
        return [auth_models.UserIdByFirebaseAuthIdModel,
                auth_models.UserAuthDetailsModel,
                auth_models.FirebaseSeedModel]

    @staticmethod
    def map(item):
        # The map() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = SyncFirebaseAccountsOneOffJob

        if isinstance(item, auth_models.UserIdByFirebaseAuthIdModel):
            auth_id, assoc_info = (
                item.id,
                (cls.ASSOC_BY_AUTH_ID_KEY, (item.user_id, item.deleted)))
            yield (auth_id, assoc_info)

        elif isinstance(item, auth_models.UserAuthDetailsModel):
            if item.gae_id == feconf.SYSTEM_COMMITTER_ID:
                yield (cls.SYSTEM_COMMITTER_ACK, item.id)
                return
            auth_id, assoc_info = (
                item.firebase_auth_id or cls.EMPTY_AUTH_ID_KEY,
                (cls.ASSOC_BY_USER_ID_KEY, (item.id, item.deleted)))
            yield (auth_id, assoc_info)

        # The item must be an instance of auth_models.FirebaseSeedModel.
        elif item.id == auth_models.ONLY_FIREBASE_SEED_MODEL_ID:
            page = firebase_auth.list_users(max_results=1000)
            user_batch = []
            while page is not None:
                user_batch[:] = page.users # NOTE: Avoids allocating a new list.
                if not user_batch:
                    break
                for user in user_batch:
                    auth_id, assoc_info = (
                        user.uid,
                        (cls.FIREBASE_ACCOUNT_KEY, (None, user.disabled)))
                    yield (auth_id, assoc_info)
                page = page.get_next_page()

    @staticmethod
    def reduce(key, values):
        # The reduce() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = SyncFirebaseAccountsOneOffJob

        if key == cls.SYSTEM_COMMITTER_ACK:
            yield (key, values)
            return

        assoc_info_pairs = [ast.literal_eval(v) for v in values]

        if key == cls.EMPTY_AUTH_ID_KEY:
            for report in cls.report_assocs_missing(assoc_info_pairs):
                yield (cls.ERROR_ASSOC_INCONSISTENCIES, report)
            return
        # Else: key is a non-empty auth_id.

        auth_id = key

        reports = list(cls.report_assoc_collisions(auth_id, assoc_info_pairs))
        if reports:
            for report in reports:
                yield (cls.ERROR_ASSOC_INCONSISTENCIES, report)
            return
        # Else: 1 <= len(assoc_info_pairs) <= 3.

        assoc_info = dict(assoc_info_pairs)

        reports = list(cls.report_assoc_inconsistencies(auth_id, **assoc_info))
        if reports:
            for report in reports:
                yield (cls.ERROR_ASSOC_INCONSISTENCIES, report)
            return
        # Else: assoc_info_by_auth_id and assoc_info_by_user_id are either:
        #   1. Both deleted.
        #   2. Both present and contain consistent values.

        # NOTE: This is an arbitrary choice, could use ASSOC_BY_USER_ID_KEY too.
        assoc_key = cls.ASSOC_BY_AUTH_ID_KEY

        user_is_permanently_deleted, firebase_account_exists = (
            assoc_key not in assoc_info, cls.FIREBASE_ACCOUNT_KEY in assoc_info)

        if user_is_permanently_deleted:
            if firebase_account_exists:
                firebase_auth.update_user(auth_id, disabled=True)
                firebase_auth.delete_user(auth_id)
            return
        # Else: assoc_info_by_auth_id and assoc_info_by_user_id are both present
        # and have consistent values.

        user_id, marked_as_deleted = assoc_info[assoc_key]

        if not firebase_account_exists:
            user_settings = user_models.UserSettingsModel.get(user_id)
            firebase_auth.create_user(
                uid=auth_id, email=user_settings.email,
                # NOTE: Even though the user might be marked for deletion, it's
                # important to create a disabled Firebase account anyway so that
                # the same email cannot be claimed while the deletion request is
                # pending.
                disabled=marked_as_deleted)
            return

        _, firebase_account_is_disabled = assoc_info[cls.FIREBASE_ACCOUNT_KEY]
        if marked_as_deleted != firebase_account_is_disabled:
            firebase_auth.update_user(auth_id, disabled=marked_as_deleted)

    @classmethod
    def report_assocs_missing(cls, assoc_info_pairs):
        """Yields debug information for each of the given associations.

        NOTE: Since assoc_info_by_auth_id and Firebase accounts are keyed by
        auth_id, the only kinds of associations that could ever hit this
        function are UserAuthDetailsModel.

        Args:
            assoc_info_pairs: list(tuple(str, (str, bool))). The list of
                associations that do not correspond to any auth_id.

        Yields:
            str. A debug string for each association.
        """
        for _, (user_id, _) in assoc_info_pairs:
            yield (
                'UserAuthDetailsModel(id="%s", firebase_auth_id=None) does not '
                'correspond to a firebase_auth_id' % user_id)

    @classmethod
    def report_assoc_collisions(cls, auth_id, assoc_info_pairs):
        """Yields debug information for associations mapped to the same auth_id.

        Args:
            auth_id: str. The auth_id to check.
            assoc_info_pairs: list(tuple(str, (str, bool))). The list of
                associations that do not correspond to any auth_id.

        Yields:
            str. A debug string for the associations with collisions.
        """
        user_id_collisions = sorted(
            '"%s"' % user_id for assoc_key, (user_id, _) in assoc_info_pairs
            if assoc_key == cls.ASSOC_BY_USER_ID_KEY)

        if len(user_id_collisions) > 1:
            yield '%d UserAuthDetailsModels have auth_id="%s": %s' % (
                len(user_id_collisions), auth_id, ', '.join(user_id_collisions))

    @classmethod
    def report_assoc_inconsistencies(
            cls, auth_id, assoc_info_by_auth_id=None,
            assoc_info_by_user_id=None, firebase_account_info=None):
        """Reports inconsistencies between the given values.

        IMPORTANT: The names of the keyword arguments MUST match the values of
        their corresponding class keys: ASSOC_BY_AUTH_ID_KEY,
        ASSOC_BY_USER_ID_KEY, FIREBASE_ACCOUNT_KEY.

        Args:
            auth_id: str. The auth_id of the user.
            assoc_info_by_auth_id: tuple. The (user_id, deleted) properties from
                the UserIdByFirebaseAuthIdModel corresponding to auth_id.
                NOTE: UserIdByFirebaseAuthIdModel is keyed by auth_id, so this
                argument will never use the default value of None.
            assoc_info_by_user_id: tuple|None. The (user_id, deleted) properties
                from the UserAuthDetailsModel corresponding to auth_id, or None
                if one does not exist.
            firebase_account_info: tuple|None. The (user_id, disabled)
                properties from the Firebase account corresponding to auth_id,
                or None if an account does not exist.
                NOTE: The user_id is always None.

        Yields:
            str. Debug information about a discovered inconsistency.
        """
        if assoc_info_by_auth_id is None and assoc_info_by_user_id is None:
            # User is deleted and will be managed by the reduce() logic.
            return

        # NOTE: assoc_info_by_auth_id is never None because such values are
        # caught by report_assocs_missing(), which is called before this
        # function.
        user_id_of_assoc_by_auth_id, deleted_bool_of_assoc_by_auth_id = (
            assoc_info_by_auth_id)

        if assoc_info_by_user_id is None:
            yield (
                'UserIdByFirebaseAuthIdModel(id="%s") does not correspond to a '
                'unique UserAuthDetailsModel' % auth_id)
            user_id_of_assoc_by_user_id = deleted_bool_of_assoc_by_user_id = (
                None)
        else:
            user_id_of_assoc_by_user_id, deleted_bool_of_assoc_by_user_id = (
                assoc_info_by_user_id)

        if (user_id_of_assoc_by_user_id is not None and
                user_id_of_assoc_by_user_id != user_id_of_assoc_by_auth_id):
            yield (
                'auth_id="%s" has inconsistent `user_id` assignments: '
                'UserIdByFirebaseAuthIdModel(user_id="%s") does not match '
                'UserAuthDetailsModel(id="%s")' % (
                    auth_id,
                    user_id_of_assoc_by_auth_id,
                    user_id_of_assoc_by_user_id))

        if (deleted_bool_of_assoc_by_user_id is not None and
                deleted_bool_of_assoc_by_user_id !=
                deleted_bool_of_assoc_by_auth_id):
            yield (
                'auth_id="%s" has inconsistent `deleted` assignments: '
                'UserIdByFirebaseAuthIdModel(user_id="%s", deleted=%r) does '
                'not match UserAuthDetailsModel(id="%s", deleted=%r)' % (
                    auth_id,
                    user_id_of_assoc_by_auth_id,
                    deleted_bool_of_assoc_by_auth_id,
                    user_id_of_assoc_by_user_id,
                    deleted_bool_of_assoc_by_user_id))
            return

        if firebase_account_info is not None:
            _, firebase_account_is_disabled = firebase_account_info
            if (firebase_account_is_disabled
                    # NOTE: Important that deleted_bool_of_assoc_by_auth_id is
                    # checked first because its value will never be None (hence,
                    # it's always meaningful).
                    and not deleted_bool_of_assoc_by_auth_id
                    and not deleted_bool_of_assoc_by_user_id):
                yield (
                    'Firebase account with auth_id="%s" is disabled, but the '
                    'user is not marked for deletion on Oppia' % auth_id)
            # Else: Firebase account needs to be updated and will be resolved by
            # the reduce() logic.
