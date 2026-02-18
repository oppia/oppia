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

from core.constants import constants
from core.jobs.io import ndb_io
from core.jobs.transforms import firebase_transforms
from core.jobs.types import firebase_adapters
from core.platform import models

import apache_beam as beam
import firebase_admin.auth as firebase_auth
from apache_beam import pvalue
from typing import Iterable, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class GetStrongRecords(beam.PTransform):  # type: ignore[misc]
    """Gets the collection of "strong" records directly from Firebase.

    These records are considered to be "strong" because they are based on
    Firebase's _real_ data. In other words, this collection represents the
    source of truth.
    """

    def expand(
        self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[firebase_adapters.StrongRecord]:
        """Returns all of the records directly from Firebase.

        Args:
            pbegin: PBegin. The beginning of the pipeline.

        Returns:
            PCollection[StrongRecord]. The records stored in Firebase.
        """
        return (
            pbegin
            | 'Load records from Firebase'
            >> beam.ParDo(lambda: firebase_auth.list_users().iterate_all())
            | 'Wrap records in our adapter type'
            >> beam.Map(firebase_adapters.StrongRecord.from_export)
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class GetWeakRecords(beam.PTransform):  # type: ignore[misc]
    """Gets the collection of "weak" records based on Oppia's user auth models.

    These records are considered to be "weak" because they are NOT based on real
    data. Instead, they are built from Oppia's internal association models under
    the assumption that they are consistent with the "strong" (real) records.
    """

    class OppiaModelsGroupedByUserId(TypedDict):
        """Typings for the CoGroupByKey() output of joined models."""

        settings: Iterable[user_models.UserSettingsModel]
        auth_details: Iterable[auth_models.UserAuthDetailsModel]

    def expand(
        self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[firebase_adapters.WeakRecord]:
        """Returns all of the records *assumed* to be in Firebase.

        Args:
            pbegin: PBegin. The beginning of the pipeline.

        Returns:
            PCollection[WeakRecord]. The records assumed to exist in Firebase.
        """
        id_to_settings = (
            pbegin
            | 'Get UserSettingsModels'
            >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=True)
            )
            | 'Key UserSettingsModels by User ID'
            >> beam.Map(lambda settings: (settings.id, settings))
        )
        id_to_auth_details = (
            pbegin
            | 'Get UserAuthDetailsModels'
            >> ndb_io.GetModels(
                auth_models.UserAuthDetailsModel.get_all(include_deleted=True)
            )
            | 'Key UserAuthDetailsModels by User ID'
            >> beam.Map(lambda details: (details.id, details))
        )
        return (
            {'settings': id_to_settings, 'auth_details': id_to_auth_details}
            | 'Group models by User ID' >> beam.CoGroupByKey()
            | 'Drop User ID key' >> beam.Map(lambda id_to_group: id_to_group[1])
            | 'Build WeakRecords' >> beam.FlatMap(self.build_weak_records)
        )

    def build_weak_records(
        self, grouped_models: OppiaModelsGroupedByUserId
    ) -> Iterable[firebase_adapters.WeakRecord]:
        """Builds a WeakRecord from the models in the given group.

        Sub-users (`UserAuthDetailsModel.parent_user_id` != None) rely on their
        "parent" user for signing in, so they are skipped by this function.

        Args:
            grouped_models: OppiaModelsGroupedByUserId. The grouped models.

        Yields:
            firebase_adapters.WeakRecord. A record built from the grouped models.

        Raises:
            ValueError. If the group doesn't hold EXACTLY ONE of each model.
        """
        [settings] = grouped_models['settings']
        [auth_details] = grouped_models['auth_details']
        if record := firebase_adapters.WeakRecord.from_oppia_models(
            settings, auth_details
        ):
            yield record


class DeleteRecords(
    firebase_transforms.FirebaseBatchOperation[
        str, firebase_auth.DeleteUsersResult
    ]
):
    """Deletes records from Firebase."""

    def __init__(self, label: str | None = None) -> None:
        super().__init__('delete_users', label=label)

    def handle_input_batch(
        self, batch: list[str]
    ) -> firebase_auth.DeleteUsersResult:
        return firebase_auth.delete_users(batch)


class ImportRecords(
    firebase_transforms.FirebaseBatchOperation[
        firebase_auth.ImportUserRecord, firebase_auth.UserImportResult
    ]
):
    """Imports records into Firebase WITHOUT protecting against duplicates."""

    def __init__(self, label: str | None = None) -> None:
        super().__init__('import_users', label=label)

    def handle_input_batch(
        self, batch: list[firebase_auth.ImportUserRecord]
    ) -> firebase_auth.UserImportResult:
        return (
            self.handle_input_batch_in_emulator_mode(batch)
            if constants.EMULATOR_MODE
            else firebase_auth.import_users(batch)
        )

    def handle_input_batch_in_emulator_mode(
        self, batch: list[firebase_auth.ImportUserRecord]
    ) -> firebase_auth.UserImportResult:
        """Creating users needs to be handled differently within EMULATOR_MODE.

        When we migrated to Firebase Authentication we decided that, while Oppia
        is running locally against the Firebase Authentication Emulator, users
        should be created using email & password for authentication. This is
        intentionally inconsistent with production, where we use Single Sign-On
        (i.e. Google Sign-In) instead. This was done so that developers wouldn't
        need to keep sensitive auth credentials on their local file system.

        Args:
            batch: list[ImportUserRecord]. The batch of records to import.

        Returns:
            UserImportResult. The result of the import operation.

        Raises:
            AssertionError. Email is required within EMULATOR_MODE.
        """
        # `import_users()` DOES NOT accept a raw password field, so we call
        # `create_user()`, which DOES accept one, in a loop here instead.
        for record in batch:
            assert record.email, 'Email is required within EMULATOR_MODE.'
            firebase_auth.create_user(
                uid=record.uid,
                email=record.email,
                disabled=record.disabled,
                # HINT: `md5(email)` makes this consistent with the frontend.
                # See: core/templates/services/auth.service.ts.
                password=hashlib.md5(record.email.encode()).hexdigest(),
            )
        # Manually build & return a result that's consistent with the real API.
        return firebase_auth.UserImportResult({}, len(batch))
