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

"""Provides generic transforms for working with the Firebase Admin SDK."""

from __future__ import annotations

import itertools

from core.jobs.types import job_run_result

import apache_beam as beam
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions
from typing import Generic, Iterator, TypeVar

FIREBASE_BATCH_LIMIT = 1000

FirebaseBatchInputType = TypeVar(
    'FirebaseBatchInputType',
    bound=(str | firebase_auth.ImportUserRecord),
)

FirebaseBatchOutputType = TypeVar(
    'FirebaseBatchOutputType',
    bound=(firebase_auth.DeleteUsersResult | firebase_auth.UserImportResult),
)

OK_TAG = 'OK'
ERROR_TAG = 'ERROR'


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class FirebaseBatchOperation(
    beam.PTransform,  # type: ignore[misc]
    Generic[FirebaseBatchInputType, FirebaseBatchOutputType],
):
    """Executes a batch operation against Firebase and returns the results."""

    def __init__(self, operation_name: str, label: str | None = None) -> None:
        super().__init__(label)
        self.operation_name = operation_name

    def expand(
        self,
        inputs: beam.PCollection[FirebaseBatchInputType],
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        batch_operation_results = (
            inputs
            | 'Load all inputs into one worker' >> beam.combiners.ToList()
            | f'Handle inputs in batches with {self.operation_name}'
            >> beam.FlatMap(self._handle_inputs).with_outputs(OK_TAG, ERROR_TAG)
        )

        ok_results = (
            batch_operation_results[OK_TAG]
            | 'Count OKs' >> beam.CombineGlobally(sum)
            | 'Omit OKs when zero' >> beam.Filter(lambda oks: oks > 0)
            | 'Format OKs'
            >> beam.Map(lambda oks: f'{self.operation_name} success: {oks}')
            | 'Dump OKs into stdout'
            >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        error_results = (
            batch_operation_results[ERROR_TAG]
            | 'Format errors'
            >> beam.Map(lambda msg: f'ERROR: {self.operation_name} at {msg}')
            | 'Dump errors into stderr'
            >> beam.Map(job_run_result.JobRunResult.as_stderr)
        )

        return (ok_results, error_results) | beam.Flatten()

    def handle_input_batch(
        self,
        batch: list[FirebaseBatchInputType],
    ) -> FirebaseBatchOutputType:
        """Calls the batch operation. Subclasses must override this method.

        Args:
            batch: list[FirebaseBatchInputType]. The batch to process.

        Raises:
            NotImplementedError. Unless overridden by a subclass.
        """
        raise NotImplementedError('Subclasses must override handle_input_batch')

    def _handle_inputs(
        self,
        inputs: list[FirebaseBatchInputType],
    ) -> Iterator[beam.TaggedOutput]:
        """Processes inputs in batches and yields tagged success/error outputs.

        Args:
            inputs: list[FirebaseBatchInputType]. All items to process.

        Yields:
            TaggedOutput. Tagged outputs for success counts and errors.
        """
        input_iter = iter(inputs)
        handled_count = 0
        failure_count = 0
        failure_messages = []

        while batch := list(itertools.islice(input_iter, FIREBASE_BATCH_LIMIT)):
            try:
                output = self.handle_input_batch(batch)
            except (ValueError, firebase_exceptions.FirebaseError) as e:
                failure_count += len(batch)
                failure_messages.append(
                    f'slice=[{handled_count}:{handled_count + len(batch)}]: {e}'
                )
            else:
                failure_count += output.failure_count
                failure_messages.extend(
                    f'index=[{handled_count + e.index}]: {e.reason}'
                    for e in output.errors
                )
            finally:
                handled_count += len(batch)

        if ok_count := handled_count - failure_count:
            yield beam.TaggedOutput(OK_TAG, ok_count)

        for message in failure_messages:
            yield beam.TaggedOutput(ERROR_TAG, message)
