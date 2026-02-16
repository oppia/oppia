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
import itertools

from core.constants import constants
from core.jobs.io import ndb_io
from core.jobs.types import firebase_adapters, job_run_result
from core.platform import models

import apache_beam as beam
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions
from apache_beam import pvalue
from typing import Generic, Iterable, Iterator, TypedDict, TypeVar

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
            >> beam.Create(firebase_auth.list_users().iterate_all())
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

    class UserModelGroup(TypedDict):
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
        self, grouped_models: UserModelGroup
    ) -> Iterable[firebase_adapters.WeakRecord]:
        """Builds a WeakRecord from the models in the given group.

        Sub-users (`UserAuthDetailsModel.parent_user_id` != None) rely on their
        "parent" user for signing in, so they are skipped by this function.

        Args:
            grouped_models: UserModelGroup. Must hold EXACTLY ONE of each model.

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


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class ImportRecords(beam.PTransform):  # type: ignore[misc]
    """Imports records into Firebase WITHOUT protecting against duplicates."""

    def expand(
        self, weak_records: beam.PCollection[firebase_adapters.WeakRecord]
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Imports records into Firebase WITHOUT safety checks.

        WARNING: This operation DOES NOT protect against duplicate records!
        The ONLY way to guarantee this function is used safely is by running it
        on an empty server, where collisions are impossible.

        Args:
            weak_records: PCollection[WeakRecord]. The records Oppia depends on.

        Returns:
            PCollection[JobRunResult]. Details about the import operation.
        """
        import_result = (
            weak_records
            | beam.Map(lambda record: record.into_import())
            | beam.combiners.ToList()
            | beam.ParDo(ImportBatchFn()).with_outputs(
                ImportBatchFn.OK_TAG, ImportBatchFn.ERR_TAG
            )
        )
        stdout = (
            import_result[ImportBatchFn.OK_TAG]
            | beam.CombineGlobally(sum)
            | beam.Filter(lambda count: count > 0)
            | beam.Map(lambda count: f'IMPORT OK: {count}')
            | beam.Map(job_run_result.JobRunResult.as_stdout)
        )
        stderr = (
            import_result[ImportBatchFn.ERR_TAG]
            | beam.Map(lambda error: f'IMPORT ERROR: {error}')
            | beam.Map(job_run_result.JobRunResult.as_stderr)
        )
        return [stdout, stderr] | 'Flatten results' >> beam.Flatten()


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class DeleteRecords(beam.PTransform):  # type: ignore[misc]
    """Deletes records from Firebase."""

    def expand(
        self, auth_ids: beam.PCollection[firebase_adapters.StrongRecord]
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Deletes records from Firebase.

        Args:
            auth_ids: PCollection[str]. The Firebase account IDs to delete.

        Returns:
            PCollection[JobRunResult]. Details about the import operation.
        """
        delete_result = (
            auth_ids
            | beam.Map(lambda record: record.auth_id)
            | beam.combiners.ToList()
            | beam.ParDo(DeleteBatchFn()).with_outputs(
                DeleteBatchFn.OK_TAG, DeleteBatchFn.ERR_TAG
            )
        )
        stdout = (
            delete_result[DeleteBatchFn.OK_TAG]
            | beam.CombineGlobally(sum)
            | beam.Filter(lambda count: count > 0)
            | beam.Map(lambda count: f'DELETE OK: {count}')
            | beam.Map(job_run_result.JobRunResult.as_stdout)
        )
        stderr = (
            delete_result[DeleteBatchFn.ERR_TAG]
            | beam.Map(lambda error: f'DELETE ERROR: {error}')
            | beam.Map(job_run_result.JobRunResult.as_stderr)
        )
        return [stdout, stderr] | 'Flatten results' >> beam.Flatten()


FnIn = TypeVar('FnIn', str, firebase_auth.ImportUserRecord)
FnOut = TypeVar(
    'FnOut', firebase_auth.DeleteUsersResult, firebase_auth.UserImportResult
)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class BatchFn(beam.DoFn, Generic[FnIn, FnOut]):  # type: ignore[misc]
    """Generic DoFn for applying Firebase batch operations."""

    BATCH_LIMIT = 1000
    OK_TAG = 'success'
    ERR_TAG = 'failure'

    def call_batch_fn(self, batch: list[FnIn]) -> FnOut:
        """Calls the batch operation on the given batch.

        Subclasses must override this method.

        Args:
            batch: list[FnIn]. The batch of items to process.

        Raises:
            NotImplementedError. Always, unless overridden.
        """
        raise NotImplementedError('Subclasses must override call_batch_fn')

    def process(self, items: list[FnIn]) -> Iterator[pvalue.TaggedOutput]:
        """Processes items in batches using the subclass's batch function.

        Args:
            items: list[FnIn]. The items to process in batches.

        Yields:
            pvalue.TaggedOutput. Tagged outputs for success counts and errors.
        """
        item_iter = iter(items)
        items_failed = 0
        items_consumed = 0
        errors = []

        while batch := list(itertools.islice(item_iter, self.BATCH_LIMIT)):
            try:
                output = self.call_batch_fn(batch)
            except (ValueError, firebase_exceptions.FirebaseError) as e:
                items_failed += len(batch)
                errors.append(
                    f'slice={items_consumed}:{items_consumed + len(batch)}: {e}'
                )
            else:
                items_failed += output.failure_count
                errors.extend(
                    f'index={items_consumed + e.index}: {e.reason}'
                    for e in output.errors
                )
            finally:
                items_consumed += len(batch)

        yield pvalue.TaggedOutput(self.OK_TAG, items_consumed - items_failed)
        yield from (pvalue.TaggedOutput(self.ERR_TAG, err) for err in errors)


class ImportBatchFn(
    BatchFn[firebase_auth.ImportUserRecord, firebase_auth.UserImportResult]
):
    """DoFn that imports Firebase user records in batches."""

    def call_batch_fn(
        self, batch: list[firebase_auth.ImportUserRecord]
    ) -> firebase_auth.UserImportResult:
        """Calls firebase_auth.import_users on the given batch.

        Args:
            batch: list[firebase_auth.ImportUserRecord]. The batch to import.

        Returns:
            firebase_auth.UserImportResult. The result of the import operation.
        """
        if constants.EMULATOR_MODE:
            # When in EMULATOR_MODE, we need to create users with a password
            # to stay consistent with our front-end EMULATOR_MODE behavior.
            # See: `core/templates/services/auth.service.ts`.
            #
            # Since `import_users` DOES NOT allow us to supply a password, we
            # are left with no choice but to run `create_user`, which DOES allow
            # us to supply a password, sequentially on each record instead.
            for record in batch:
                assert record.email
                firebase_auth.create_user(
                    uid=record.uid,
                    email=record.email,
                    disabled=record.disabled,
                    password=hashlib.md5(record.email.encode()).hexdigest(),
                )
            # We pass an "OK" result to keep this DoFn's API consistent.
            return firebase_auth.UserImportResult({}, len(batch))
        return firebase_auth.import_users(batch)


class DeleteBatchFn(BatchFn[str, firebase_auth.DeleteUsersResult]):
    """DoFn that deletes Firebase user records in batches."""

    def call_batch_fn(
        self, batch: list[str]
    ) -> firebase_auth.DeleteUsersResult:
        """Calls firebase_auth.delete_users on the given batch.

        Args:
            batch: list[str]. The batch of user IDs to delete.

        Returns:
            firebase_auth.DeleteUsersResult. The result of the delete operation.
        """
        return firebase_auth.delete_users(batch)
