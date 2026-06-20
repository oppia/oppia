# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Provides PTransforms for operating on Firebase records."""

from __future__ import annotations

import hashlib
from collections import abc

from core.constants import constants
from core.jobs.io import ndb_io
from core.jobs.transforms import firebase_transforms
from core.jobs.types import firebase_domain
from core.platform import models
from core.platform.auth import firebase_auth_services

import apache_beam as beam
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions
from apache_beam import pvalue

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class GetRecordsDirectlyFromFirebase(beam.PTransform):  # type: ignore[misc]
    """Gets the collection of records directly from the Firebase server."""

    def expand(
        self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[firebase_domain.FirebaseRecord]:
        """Returns all of the records directly from Firebase."""

        return (
            pbegin
            | 'Allocate exactly one worker' >> beam.Create([None])
            | 'Get Firebase records' >> beam.ParDo(_ExportFirebaseRecords())
            | 'Reshuffle records to improve parallelization' >> beam.Reshuffle()
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class RecreateRecordsFromOppiaModels(beam.PTransform):  # type: ignore[misc]
    """Re-creates the collection of records from Oppia's user & auth models.

    Attributes:
        TAG_RECORDS: str. Tag for the PCollection of recreated records.
        TAG_AUTH_PAIRS: str. Tag for the PCollection of (Firebase ID, User ID)
            pairs.
    """

    TAG_RECORDS = 'records'
    TAG_AUTH_PAIRS = 'auth_pairs'

    def expand(self, pbegin: pvalue.PBegin) -> dict[str, beam.PCollection]:
        """Returns all of the records known by Oppia's user & auth models.

        Returns:
            dict. A dict with two PCollections:
                TAG_RECORDS: PCollection[FirebaseRecord]. The recreated records.
                TAG_AUTH_PAIRS: PCollection[tuple[str, str]]. The collection of
                    (Firebase ID, User ID) pairs from each Firebase-linked user.
        """
        user_auth_details_models = (
            pbegin
            | 'Get UserAuthDetailsModels'
            >> ndb_io.GetModels(
                auth_models.UserAuthDetailsModel.get_all(include_deleted=True)
            )
        )

        user_settings_models = (
            pbegin
            | 'Get UserSettingsModels'
            >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=True)
            )
        )

        keyed_user_auth_details_models = (
            user_auth_details_models
            | 'Get UserAuthDetailsModels keyed with id'
            >> beam.Map(lambda m: (m.id, m))
        )

        keyed_user_settings_models = (
            user_settings_models
            | 'Get UserSettingsModels keyed with id'
            >> beam.Map(lambda m: (m.id, m))
        )

        return {
            self.TAG_RECORDS: (
                (keyed_user_auth_details_models, keyed_user_settings_models)
                | beam.CoGroupByKey()
                | beam.FlatMapTuple(
                    self._yield_recreated_records_from_oppia_models
                )
            ),
            self.TAG_AUTH_PAIRS: (
                user_auth_details_models
                | 'Omit models without a corresponding Firebase Auth ID'
                >> beam.Filter(lambda m: bool(m.firebase_auth_id))
                | 'Create (Firebase Auth ID, User ID) pairs'
                >> beam.Map(lambda m: (m.firebase_auth_id, m.id))
            ),
        }

    @staticmethod
    def _yield_recreated_records_from_oppia_models(
        user_id: str,
        grouped_models: tuple[
            abc.Iterable[auth_models.UserAuthDetailsModel],
            abc.Iterable[user_models.UserSettingsModel],
        ],
    ) -> abc.Iterable[firebase_domain.FirebaseRecord]:
        """Yields a FirebaseRecord for the given user_id if possible."""

        user_auth_details_model_iter, user_settings_model_iter = grouped_models
        user_auth_details_models = tuple(user_auth_details_model_iter)
        user_settings_models = tuple(user_settings_model_iter)
        try:
            [(user_auth_details_model, user_settings_model)] = zip(
                user_auth_details_models,
                user_settings_models,
                strict=True,
            )
        except ValueError as e:
            raise ValueError(
                f'{user_id=!r} needs exactly one UserAuthDetailsModel '
                f'(found {len(user_auth_details_models)}) and exactly one '
                f'UserSettingsModel (found {len(user_settings_models)})'
            ) from e

        try:
            record = firebase_domain.FirebaseRecord.from_oppia_models(
                user_auth_details_model, user_settings_model
            )
        except ValueError as e:
            raise ValueError(f'Failed to rebuild record for {user_id=}') from e

        if record:
            yield record


class CreateFirebaseRecords(
    firebase_transforms.FirebaseBatchOperation[
        firebase_auth.ImportUserRecord, firebase_auth.UserImportResult
    ]
):
    """Creates accounts in Firebase in batches and reports the results."""

    OK_TAG = f'CREATE {firebase_transforms.FirebaseBatchOperation.OK_TAG}'
    ERR_TAG = f'CREATE {firebase_transforms.FirebaseBatchOperation.ERR_TAG}'

    def get_batch_input(
        self, record: firebase_domain.FirebaseRecord
    ) -> firebase_auth.ImportUserRecord:
        """Returns an ImportUserRecord with fields copied from the record."""

        return record.to_import()

    def run_batch_operation(
        self, users: list[firebase_auth.ImportUserRecord]
    ) -> firebase_auth.UserImportResult:
        """Imports the given users into Firebase."""

        if constants.EMULATOR_MODE:
            return self._handle_batched_items_within_emulator(users)
        return firebase_auth.import_users(users)

    def _handle_batched_items_within_emulator(
        self, records: list[firebase_auth.ImportUserRecord]
    ) -> firebase_auth.UserImportResult:
        """Creating users needs to be handled differently within EMULATOR_MODE.

        When we migrated to Firebase Authentication we decided that, while Oppia
        is running locally against the Firebase Authentication Emulator, users
        should be created using email & password for authentication. This is
        intentionally inconsistent with production, where we use Single Sign-On
        (i.e. Google Sign-In) instead. This was done so that developers wouldn't
        need to keep sensitive auth credentials on their local file system.

        NOTE: Since the `import_users` API doesn't accept a raw password field,
        we need to call the `create_user` API, which DOES accept one, instead.

        Args:
            records: list[ImportUserRecord]. The batch of records to create.

        Returns:
            UserImportResult. The result of the create operation.
        """

        errors = []
        for i, record in enumerate(records):
            user_email = record.email or ''
            # HINT: `md5(email)` used for consistency with the frontend.
            # See: core/templates/services/auth.service.ts.
            user_password = hashlib.md5(user_email.encode()).hexdigest()
            try:
                firebase_auth.create_user(
                    uid=record.uid,
                    disabled=record.disabled,
                    email=user_email,
                    password=user_password,
                )
            except (ValueError, firebase_exceptions.FirebaseError) as e:
                errors.append({'index': i, 'message': str(e)})

        return firebase_auth.UserImportResult({'error': errors}, len(records))


class DeleteFirebaseRecords(
    firebase_transforms.FirebaseBatchOperation[
        str, firebase_auth.DeleteUsersResult
    ]
):
    """Deletes accounts from Firebase in batches and reports the results."""

    OK_TAG = f'DELETE {firebase_transforms.FirebaseBatchOperation.OK_TAG}'
    ERR_TAG = f'DELETE {firebase_transforms.FirebaseBatchOperation.ERR_TAG}'

    def get_batch_input(self, record: firebase_domain.FirebaseRecord) -> str:
        """Returns the Firebase auth ID of the given record."""

        return record.auth_id

    def run_batch_operation(
        self, uids: list[str]
    ) -> firebase_auth.DeleteUsersResult:
        """Deletes the given users from Firebase by their UIDs."""

        return firebase_auth.delete_users(uids)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class _ExportFirebaseRecords(beam.DoFn):  # type: ignore[misc]
    """Exports all Firebase records directly from the Firebase server."""

    def process(self, _: None) -> abc.Iterable[firebase_domain.FirebaseRecord]:
        """Yields all of the records directly from Firebase."""

        firebase_auth_services.establish_firebase_connection()
        yield from (
            firebase_domain.FirebaseRecord.from_export(user)
            for user in firebase_auth.list_users().iterate_all()
        )
