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
from apache_beam import pvalue
from typing import Generic, Iterable, Iterator, TypeVar

FIREBASE_BATCH_LIMIT = 1000

FirebaseBatchInputType = TypeVar(
    'FirebaseBatchInputType',
    bound=(str | firebase_auth.ImportUserRecord),
)

FirebaseBatchOutputType = TypeVar(
    'FirebaseBatchOutputType',
    bound=(firebase_auth.DeleteUsersResult | firebase_auth.UserImportResult),
)

SUCCESS_TAG = 'success'
ERROR_TAG = 'error'


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
        result = (
            inputs
            | 'Gather all inputs into a single worker'
            >> beam.combiners.ToList()
            | f'Handle inputs in batches using {self.operation_name}'
            >> beam.FlatMap(self._handle_inputs).with_outputs(
                SUCCESS_TAG, ERROR_TAG
            )
        )

        stdout = (
            result[SUCCESS_TAG]
            | 'Count the inputs successfully handled'
            >> beam.CombineGlobally(sum)
            | 'Apply a standard format to success count'
            >> beam.FlatMap(self._format_success_count)
            | 'Build stdout from the formatted success count'
            >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        stderr = (
            result[ERROR_TAG]
            | 'Apply a standard format to error details'
            >> beam.Map(self._format_error_details)
            | 'Build stderr from the formatted error messages'
            >> beam.Map(job_run_result.JobRunResult.as_stderr)
        )

        return (stdout, stderr) | beam.Flatten()

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
            beam.TaggedOutput. Tagged outputs for success counts and errors.
        """
        input_iter = iter(inputs)
        handled_count = 0
        failure_count = 0
        failure_details = []

        while batch := list(itertools.islice(input_iter, FIREBASE_BATCH_LIMIT)):
            try:
                output = self.handle_input_batch(batch)
            except (ValueError, firebase_exceptions.FirebaseError) as e:
                failure_count += len(batch)
                failure_details.append(
                    f'slice=[{handled_count}:{handled_count + len(batch)}]: {e}'
                )
            else:
                failure_count += output.failure_count
                failure_details.extend(
                    f'index=[{handled_count + e.index}]: {e.reason}'
                    for e in output.errors
                )
            finally:
                handled_count += len(batch)

        if (success_count := handled_count - failure_count) > 0:
            yield pvalue.TaggedOutput(SUCCESS_TAG, success_count)

        for reason in failure_details:
            yield pvalue.TaggedOutput(ERROR_TAG, reason)

    def _format_success_count(self, count: int) -> Iterable[str]:
        """Yields positive counts with a standard format."""
        if count > 0:
            yield f'{self.operation_name} success: {count}'

    def _format_error_details(self, details: str) -> str:
        """Returns the error message with a standard format."""
        return f'{self.operation_name} error at {details}'
