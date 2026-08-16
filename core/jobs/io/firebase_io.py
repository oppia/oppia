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
from collections import abc

from core.constants import constants
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import firebase_domain, job_run_result
from core.platform import models
from core.platform.auth import firebase_auth_services

import apache_beam as beam
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions
import result
from apache_beam import pvalue
from typing import Callable, Generic, TypeVar

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class RecreateRecordsFromOppiaModels(beam.PTransform):  # type: ignore[misc]
    """Re-creates the collection of records from Oppia's user & auth models.

    Attributes:
        TAG_RECORDS: str. Tag for the PCollection of recreated records.
        TAG_PROBLEMS: str. Tag for the PCollection of problems encountered
            with Oppia's models (e.g. missing or inconsistent models).
        TAG_AUTH_PAIRS: str. Tag for the PCollection of (Firebase ID, User ID)
            pairs.
    """

    TAG_RECORDS = 'records'
    TAG_PROBLEMS = 'problems'
    TAG_AUTH_PAIRS = 'auth_pairs'

    def expand(self, pbegin: pvalue.PBegin) -> dict[str, beam.PCollection]:
        """Returns all of the records known by Oppia's user & auth models.

        Returns:
            dict. A dict with two PCollections:
                TAG_RECORDS: PCollection[FirebaseRecord]. The recreated records.
                TAG_PROBLEMS: PCollection[JobRunResult]. The problems
                    encountered with the Oppia models (e.g. missing or
                    inconsistent models).
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

        [oks, errs] = (
            (keyed_user_auth_details_models, keyed_user_settings_models)
            | beam.CoGroupByKey()
            | beam.FlatMapTuple(self._yield_recreated_records_from_oppia_models)
            | beam.Partition(lambda res, _: int(res.is_err()), 2)
        )

        return {
            self.TAG_RECORDS: oks | beam.Map(lambda res: res.unwrap()),
            self.TAG_PROBLEMS: errs
            | beam.Map(
                lambda res: job_run_result.JobRunResult.as_stderr(
                    res.unwrap_err()
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
    ) -> abc.Iterable[result.Result[firebase_domain.FirebaseRecord, str]]:
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
            yield result.Err(
                f'{user_id=!r} needs exactly one UserAuthDetailsModel '
                f'(found {len(user_auth_details_models)}) and exactly one '
                f'UserSettingsModel (found {len(user_settings_models)}) '
                f'(surfaced by: {e})'
            )
            return

        try:
            record = firebase_domain.FirebaseRecord.from_oppia_models(
                user_auth_details_model, user_settings_model
            )
        except ValueError as e:
            yield result.Err(
                f'Failed to rebuild record for {user_id=} because: {e}'
            )
            return

        if record:
            yield result.Ok(record)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class GetRecordsDirectlyFromFirebase(beam.PTransform):  # type: ignore[misc]
    """Gets the collection of records directly from the Firebase server."""

    def __init__(self, project_id: str, label: str | None = None) -> None:
        super().__init__(label=label)
        self.project_id = project_id

    def expand(
        self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[firebase_domain.FirebaseRecord]:
        """Returns all of the records directly from Firebase."""

        do_fn = _FetchFirebaseRecords(self.project_id)

        return (
            pbegin
            | 'Allocate exactly one worker' >> beam.Create([None])
            | 'Get Firebase records' >> beam.ParDo(do_fn)
            | 'Reshuffle records to improve parallelization' >> beam.Reshuffle()
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class CreateFirebaseRecords(beam.PTransform):  # type: ignore[misc]
    """Creates accounts in Firebase in batches and reports the results."""

    def __init__(self, project_id: str, label: str | None = None) -> None:
        super().__init__(label=label)
        self.project_id = project_id

    def expand(
        self,
        records: beam.PCollection[firebase_domain.FirebaseRecord],
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Creates accounts in Firebase in batches and reports the results."""

        do_fn = _BatchedDoFn(self.project_id)

        return (
            records
            | beam.Map(lambda record: record.to_import())
            | beam.combiners.ToList()
            | beam.ParDo(do_fn, _import_users).with_outputs(
                do_fn.OK_TAG, do_fn.ERR_TAG
            )
            | job_result_transforms.FromTaggedOutputs(
                do_fn.OK_TAG, do_fn.ERR_TAG, prefix='CREATE'
            )
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class DeleteFirebaseRecords(beam.PTransform):  # type: ignore[misc]
    """Deletes accounts from Firebase in batches and reports the results."""

    def __init__(self, project_id: str, label: str | None = None) -> None:
        super().__init__(label=label)
        self.project_id = project_id

    def expand(
        self,
        records: beam.PCollection[firebase_domain.FirebaseRecord],
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Creates accounts in Firebase in batches and reports the results."""

        do_fn = _BatchedDoFn(self.project_id)

        return (
            records
            | beam.Map(lambda record: record.auth_id)
            | beam.combiners.ToList()
            | beam.ParDo(do_fn, _delete_users).with_outputs(
                do_fn.OK_TAG, do_fn.ERR_TAG
            )
            | job_result_transforms.FromTaggedOutputs(
                do_fn.OK_TAG, do_fn.ERR_TAG, prefix='DELETE'
            )
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class _DoFnWithConnection(beam.DoFn):  # type: ignore[misc]
    """Establishes a connection to Firebase before process begins."""

    def __init__(self, project_id: str) -> None:
        super().__init__()
        self.project_id = project_id

    def setup(self) -> None:
        super().setup()
        firebase_auth_services.establish_firebase_connection(self.project_id)


class _FetchFirebaseRecords(_DoFnWithConnection):
    """Exports all Firebase records directly from the Firebase server."""

    def process(self, _: None) -> abc.Iterable[firebase_domain.FirebaseRecord]:
        """Yields all of the records directly from Firebase."""

        yield from (
            firebase_domain.FirebaseRecord.from_export(user)
            for user in firebase_auth.list_users().iterate_all()
        )


_InputT = TypeVar(
    '_InputT',
    bound=firebase_auth.ImportUserRecord | str,
)
_OutputT = TypeVar(
    '_OutputT',
    bound=firebase_auth.UserImportResult | firebase_auth.DeleteUsersResult,
)


class _BatchedDoFn(_DoFnWithConnection, Generic[_InputT, _OutputT]):
    """Executes a batch operation against Firebase and returns the results."""

    OK_TAG = 'OK'
    ERR_TAG = 'ERROR'
    BATCH_LIMIT = 1000

    def process(
        self,
        inputs: list[_InputT],
        batch_processing_fn: Callable[[list[_InputT]], _OutputT],
    ) -> abc.Iterator[pvalue.TaggedOutput]:
        """Common batch processing logic for Firebase Admin SDK operations."""
        if not inputs:
            return

        input_iter = iter(inputs)
        input_offset = 0
        failure_count = 0

        while batch := list(itertools.islice(input_iter, self.BATCH_LIMIT)):
            try:
                output = batch_processing_fn(batch)

            except (ValueError, firebase_exceptions.FirebaseError) as e:
                failure_count += len(batch)
                yield beam.TaggedOutput(
                    self.ERR_TAG,
                    f'at slice=[{input_offset}:{input_offset + len(batch)}]: {e}',
                )

            except Exception as e:
                raise RuntimeError(
                    f'{batch_processing_fn.__name__}() unexpectedly raised!'
                ) from e

            else:
                failure_count += output.failure_count
                yield from (
                    beam.TaggedOutput(
                        self.ERR_TAG,
                        f'at index=[{input_offset + e.index}]: {e.reason}',
                    )
                    for e in output.errors
                )

            finally:
                input_offset += len(batch)

        if input_offset > failure_count:
            yield beam.TaggedOutput(self.OK_TAG, input_offset - failure_count)


def _import_users(
    record_batch: list[firebase_auth.ImportUserRecord],
) -> firebase_auth.UserImportResult:
    """Delegates to the Firebase Admin SDK to import the given batch of users.

    Apache Beam cannot pickle global imported functions, but we want to pass
    functions as arguments to the `_BatchedDoFn` so that we can re-use the
    scaffolding for the batching logic. We work around this by wrapping the call
    to import_users() in this top-level function which _can_ be pickled.

    https://beam.apache.org/documentation/sdks/python-pipeline-dependencies/#pickling-and-managing-the-main-session

    Args:
        record_batch: list[ImportUserRecord]. The batch of records to create.

    Returns:
        UserImportResult. The result of the create operation.
    """

    if not constants.EMULATOR_MODE:
        return firebase_auth.import_users(record_batch)

    # NOTE: Since the `import_users` API doesn't accept a raw password field, we
    # need to call the `create_user` API, which DOES accept one, instead.
    #
    # When we migrated to Firebase Authentication we decided that, while Oppia
    # is running locally against the Firebase Authentication Emulator, users
    # should be created using email & password for authentication. This is
    # intentionally inconsistent with production, where we use Single Sign-On
    # (i.e. Google Sign-In) instead. This was done so that developers wouldn't
    # need to keep sensitive auth credentials on their local file system.

    errors = []
    for i, record in enumerate(record_batch):
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

    return firebase_auth.UserImportResult({'error': errors}, len(record_batch))


def _delete_users(
    id_batch: list[str],
) -> firebase_auth.DeleteUsersResult:
    """Delegates to the Firebase Admin SDK to delete the given batch of users.

    Apache Beam cannot pickle global imported functions, but we want to pass
    functions as arguments to the `_BatchedDoFn` so that we can re-use the
    scaffolding for the batching logic. We work around this by wrapping the call
    to delete_users() in this top-level function which _can_ be pickled.

    https://beam.apache.org/documentation/sdks/python-pipeline-dependencies/#pickling-and-managing-the-main-session

    Args:
        id_batch: list[str]. The batch of user IDs to delete.

    Returns:
        firebase_auth.DeleteUsersResult. The result of the delete operation.
    """
    return firebase_auth.delete_users(id_batch)
