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
from core.domain import auth_domain
from core.platform import models
from core.platform.auth import firebase_auth_services
from core.platform.auth import gae_auth_services
import feconf
import python_utils
import utils

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


class SeedFirebaseOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Brings Firebase accounts and association models to a deterministic state.

    The following pre-conditions must hold for no errors to occur (accomplished
    by calling the firebase_auth_services.seed_firebase() function):
        1.  Exactly one FirebaseSeedModel must exist.
        2.  feconf.ADMIN_EMAIL_ADDRESS must correspond to a UserAuthDetailsModel
            where:
                firebase_auth_id is not None AND
                gae_id != feconf.SYSTEM_COMMITTER_ID.
        3.  feconf.ADMIN_EMAIL_ADDRESS must correspond to exactly one
            UserIdByFirebaseAuthIdModel where:
                id equals the aforementioned firebase_auth_id AND
                user_id is the ID of the aforementioned UserAuthDetailsModel.
        4.  feconf.ADMIN_EMAIL_ADDRESS must correspond to exactly one Firebase
            account where:
                uid is equal to the aforementioned firebase_auth_id AND
                custom_claims == {"role":"super_admin"}.

    The following post-conditions will hold if no errors occur:
        1.  Exactly one Firebase account will exist: feconf.ADMIN_EMAIL_ADDRESS.
        2.  Exactly one UserIdByFirebaseAuthIdModel model will exist.
        3.  Exactly one UserAuthDetailsModel will have a non-None
            firebase_auth_id value.
    """

    ASSOC_MODEL_TYPES = (
        auth_models.UserAuthDetailsModel,
        auth_models.UserIdByFirebaseAuthIdModel)

    INFO_SUPER_ADMIN_ACK = 'INFO: Found feconf.ADMIN_EMAIL_ADDRESS'
    INFO_SYSTEM_COMMITTER_ACK = 'INFO: Found feconf.SYSTEM_COMMITTER_ID'
    INFO_SEED_MODEL_ACK = 'INFO: Found FirebaseSeedModel'

    ERROR_BATCH_DELETE = 'ERROR: Failed to delete a batch of Firebase accounts'
    ERROR_INDIVIDUAL_DELETE = (
        'ERROR: Failed to delete an individual Firebase account')

    SUCCESS_DELETE_ACCOUNTS = 'SUCCESS: Firebase accounts deleted'
    SUCCESS_DELETE_ASSOC_TEMPLATE = 'SUCCESS: %s wiped'
    SUCCESS_ALREADY_DELETED_ASSOC_TEMPLATE = 'SUCCESS: %s already wiped'

    MAX_USERS_FIREBASE_CAN_DELETE_PER_CALL = 1000

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            auth_models.FirebaseSeedModel,
            auth_models.UserAuthDetailsModel,
            auth_models.UserIdByFirebaseAuthIdModel,
        ]

    @staticmethod
    def map(item):
        # The map() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = SeedFirebaseOneOffJob

        if isinstance(item, cls.ASSOC_MODEL_TYPES):
            admin_ack = cls.get_admin_ack(item)
            if admin_ack is not None:
                yield admin_ack
            else:
                yield (cls.wipe_assoc_model(item), 1)
            return

        yield (cls.INFO_SEED_MODEL_ACK, item.id)

        for user_batch in cls.yield_firebase_user_batches():
            admins_to_ack, users_to_delete = utils.partition(
                user_batch,
                predicate=lambda user: user.email == feconf.ADMIN_EMAIL_ADDRESS)

            for user in admins_to_ack:
                yield (
                    '%s in Firebase account' % cls.INFO_SUPER_ADMIN_ACK,
                    'firebase_auth_id=%s' % (user.uid))

            ids_to_delete = [user.uid for user in users_to_delete]
            try:
                result = firebase_auth.delete_users(
                    ids_to_delete, force_delete=True)
            except Exception as exception:
                yield (cls.ERROR_BATCH_DELETE, len(ids_to_delete))
                yield (cls.ERROR_BATCH_DELETE, 'reason=%r' % exception)
            else:
                for error in result.errors:
                    firebase_auth_id = ids_to_delete[error.index]
                    debug_info = 'firebase_auth_id=%s, reason=%s' % (
                        firebase_auth_id, error.reason)
                    yield (cls.ERROR_INDIVIDUAL_DELETE, debug_info)
                num_deleted = len(ids_to_delete) - len(result.errors)
                if num_deleted:
                    yield (cls.SUCCESS_DELETE_ACCOUNTS, num_deleted)

    @staticmethod
    def reduce(key, values):
        # The reduce() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = SeedFirebaseOneOffJob

        if key.startswith('SUCCESS:'):
            yield (key, sum(int(v) for v in values))
        elif key == cls.ERROR_BATCH_DELETE:
            reasons, counts = utils.partition(
                values, predicate=lambda value: value.startswith('reason='))
            debug_info = 'count=%d, reasons=[%s]' % (
                sum(int(c) for c in counts),
                ', '.join(sorted({r[7:] for r in reasons})))
            yield (key, debug_info)
        else:
            yield (key, values)

    @classmethod
    def yield_firebase_user_batches(cls):
        """Yields every single Firebase account in batches."""
        # 1000 is the maximum amount of users that can be deleted at once.
        page = firebase_auth.list_users(
            max_results=cls.MAX_USERS_FIREBASE_CAN_DELETE_PER_CALL)
        while page is not None:
            user_batch = page.users
            if not user_batch:
                break
            yield user_batch
            page = page.get_next_page()

    @classmethod
    def get_admin_ack(cls, item):
        """Returns an acknowledgement key if the item is associated to an admin.

        Args:
            item: UserAuthDetailsModel|UserIdByFirebaseAuthIdModel. The item to
                check.

        Returns:
            str|None. A key acknowledging a super admin, or None if the item
            does not correspond to a super admin.
        """
        model_name = type(item).__name__

        if isinstance(item, auth_models.UserAuthDetailsModel):
            user_id = item.id
            gae_auth_id = item.gae_id
        else:
            user_id = item.user_id
            gae_auth_id = auth_models.UserAuthDetailsModel.get(user_id).gae_id

        if gae_auth_id == feconf.SYSTEM_COMMITTER_ID:
            return (
                '%s in %s' % (cls.INFO_SYSTEM_COMMITTER_ACK, model_name),
                'user_id=%s' % user_id)

        user_settings_model = user_models.UserSettingsModel.get(user_id)
        if user_settings_model.email == feconf.ADMIN_EMAIL_ADDRESS:
            return (
                '%s in %s' % (cls.INFO_SUPER_ADMIN_ACK, model_name),
                'user_id=%s' % user_id)

        return None

    @classmethod
    def wipe_assoc_model(cls, item):
        """Wipes the given model of Firebase account associations.

        Args:
            item: UserAuthDetailsModel|UserIdByFirebaseAuthIdModel. The item to
                wipe.

        Returns:
            str. The reduce key to yield from the map() function for further
            processing.
        """
        model_name = type(item).__name__

        if isinstance(item, auth_models.UserAuthDetailsModel):
            if item.firebase_auth_id is None:
                return cls.SUCCESS_ALREADY_DELETED_ASSOC_TEMPLATE % model_name
            else:
                item.firebase_auth_id = None
                item.update_timestamps(update_last_updated_time=False)
                item.put()
        else:
            item.delete()

        return cls.SUCCESS_DELETE_ASSOC_TEMPLATE % model_name


class PopulateFirebaseAccountsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that maps over UserSettingsModels and imports them to Oppia's
    Firebase server. The latter requires that we "specify [an ID] at a minimum",
    so we use Oppia's user_id as the value (with the uid_ prefix stripped).

    NOTE: **DO NOT** ASSUME THAT FIREBASE IDS AND OPPIA USER IDS WILL BE THE
    SAME! We are only doing this for users that already exist; future users that
    sign up with Firebase will have an entirely different ID.

    DO NOT START THIS JOB UNTIL SeedFirebaseOneOffJob COMPLETES WITHOUT ANY
    ERRORS!
    """

    NUM_SHARDS = 50 # Arbitrary value.
    MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL = 1000

    AUDIT_KEY = 'INFO: Pre-existing Firebase accounts'
    ERROR_KEY = 'ERROR: Failed to create Firebase accounts'
    SUCCESS_KEY = 'SUCCESS: Created Firebase accounts'
    WARNING_KEY = 'WARNING: No action needed'

    SUPER_ADMIN_ACK = 'INFO: Super admin created'
    SYSTEM_COMMITTER_ACK = 'INFO: SYSTEM_COMMITTER_ID skipped'

    POPULATED_KEY = 'ALREADY_DONE'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user):
        # The map() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = PopulateFirebaseAccountsOneOffJob

        if user.deleted:
            return

        gae_auth_id = gae_auth_services.get_auth_id_from_user_id(user.id)
        # NOTE: This committer ID is a legacy ACL-bypass that we no longer
        # depend on. Because it is obsolete, we do not want it to have a
        # Firebase account associated with it.
        if gae_auth_id == feconf.SYSTEM_COMMITTER_ID:
            yield (cls.SYSTEM_COMMITTER_ACK, user.id)
            return

        auth_id = firebase_auth_services.get_auth_id_from_user_id(user.id)
        if auth_id is not None:
            yield (cls.POPULATED_KEY, 1)
        else:
            user_is_super_admin = (user.email == feconf.ADMIN_EMAIL_ADDRESS)
            if user_is_super_admin:
                yield (cls.SUPER_ADMIN_ACK, user.id)

            # Split up users into different shards to help speed up the job.
            sharding_key = ID_HASHING_FUNCTION(user.id) % cls.NUM_SHARDS
            yield (
                sharding_key, (
                    cls.strip_uid_prefix(user.id), user.id, user.email,
                    user_is_super_admin))

    @staticmethod
    def reduce(key, values):
        # The reduce() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = PopulateFirebaseAccountsOneOffJob

        if key == cls.POPULATED_KEY:
            yield (cls.AUDIT_KEY, len(values))
            return
        elif key in (cls.SUPER_ADMIN_ACK, cls.SYSTEM_COMMITTER_ACK):
            yield (key, values)
            return

        # NOTE: This is only sorted to make unit testing easier.
        user_fields = sorted(ast.literal_eval(v) for v in values)
        user_records = [
            firebase_auth.ImportUserRecord(
                uid=auth_id, email=email, email_verified=True, custom_claims=(
                    '{"role":"%s"}' % feconf.FIREBASE_ROLE_SUPER_ADMIN
                    if user_is_super_admin else None))
            for auth_id, _, email, user_is_super_admin in user_fields
        ]

        # The Firebase Admin SDK places a hard-limit on the number of users that
        # can be "imported" in a single call. To compensate, we break up the
        # users into chunks.
        offsets = python_utils.RANGE(
            0, len(user_records), cls.MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL)
        results = (
            cls.populate_firebase([r for r in record_group if r is not None])
            for record_group in utils.grouper(
                user_records, cls.MAX_USERS_FIREBASE_CAN_IMPORT_PER_CALL))

        assocs_to_create = []
        for offset, (result, exception) in python_utils.ZIP(offsets, results):
            if exception is not None:
                yield (cls.ERROR_KEY, repr(exception))
            else:
                successful_indices = set(python_utils.RANGE(
                    result.success_count + result.failure_count))
                for error in result.errors:
                    successful_indices.remove(error.index)
                    debug_info = 'Import user_id=%r failed: %s' % (
                        user_fields[offset + error.index][1], error.reason)
                    yield (cls.ERROR_KEY, debug_info)
                assocs_to_create.extend(
                    auth_domain.AuthIdUserIdPair(*user_fields[offset + i][:2])
                    for i in successful_indices)

        if assocs_to_create:
            firebase_auth_services.associate_multi_auth_ids_with_user_ids(
                assocs_to_create)
            yield (cls.SUCCESS_KEY, len(assocs_to_create))

    @classmethod
    def populate_firebase(cls, user_records):
        """Populates the Firebase server with the given user records.

        Args:
            user_records: list(firebase_auth.ImportUserRecord). Users to
                store in Firebase.

        Returns:
            tuple(UserImportResult|None, Exception|None). The result of the
            operation, or an exception if the operation failed. Exactly one of
            the values will be non-None.
        """
        try:
            return (firebase_auth.import_users(user_records), None)
        except Exception as exception:
            return (None, exception)

    @classmethod
    def strip_uid_prefix(cls, user_id):
        """Removes the 'uid_' prefix from a user_id and returns the result."""
        return user_id[4:] if user_id.startswith('uid_') else user_id


class AuditFirebaseImportReadinessOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to confirm whether users are ready for Firebase import."""

    SYSTEM_COMMITTER_ACK = 'INFO: SYSTEM_COMMITTER_ID skipped'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user):
        # The map() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = AuditFirebaseImportReadinessOneOffJob

        gae_auth_id = gae_auth_services.get_auth_id_from_user_id(user.id)
        # NOTE: This committer ID is a legacy ACL-bypass that we no longer
        # depend on. Because it is obsolete, we do not want it to have a
        # Firebase account associated with it, or even consider it for import.
        if gae_auth_id == feconf.SYSTEM_COMMITTER_ID:
            yield (cls.SYSTEM_COMMITTER_ACK, user.id)
        else:
            yield ('[DELETED]' if user.deleted else user.email, user.id)

    @staticmethod
    def reduce(key, values):
        # The reduce() function must be static, so we manually create a "cls"
        # variable instead of changing the function into a classmethod.
        cls = PopulateFirebaseAccountsOneOffJob

        if key == cls.SYSTEM_COMMITTER_ACK:
            yield (cls.SYSTEM_COMMITTER_ACK, values)
            return

        # NOTE: These are only sorted to make unit tests simpler.
        joined_user_ids = ', '.join(sorted(values))

        if key == '[DELETED]':
            yield ('ERROR: Found deleted users', joined_user_ids)
        else:
            email = key
            if len(values) > 1:
                yield ('ERROR: %s is a shared email' % email, joined_user_ids)
