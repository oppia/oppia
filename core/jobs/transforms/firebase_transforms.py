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

from core.platform.auth import firebase_auth_services

import apache_beam as beam
import firebase_admin
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions
from apache_beam import pvalue
from apache_beam.utils import shared
from typing import Generic, Iterator, TypeVar

InputType = TypeVar(
    'InputType',
    bound=(str | firebase_auth.ImportUserRecord),
)

OutputType = TypeVar(
    'OutputType',
    bound=(firebase_auth.DeleteUsersResult | firebase_auth.UserImportResult),
)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class FirebaseBatchOperation(beam.DoFn, Generic[InputType, OutputType]):  # type: ignore[misc]
    """Executes a batch operation against Firebase and returns the results."""

    BATCH_LIMIT = 1000

    SUCCESS_TAG = 'SUCCESS'
    ERROR_TAG = 'ERROR'

    def __init__(self) -> None:
        super().__init__()
        self.app: firebase_admin.App | None = None
        self.process_state = shared.Shared()

    def handle_batched_items(self, _: list[InputType]) -> OutputType:
        """Virtual function to call a specific Firebase Admin SDK operation."""
        raise NotImplementedError('Subclasses must override this function')

    def setup(self) -> None:
        """Establishes Firebase Admin SDK connection within a worker process."""
        firebase_auth_services.establish_firebase_connection()

    def process(
        self,
        inputs: list[InputType],
    ) -> Iterator[pvalue.TaggedOutput]:
        """Common batch processing logic for Firebase Admin SDK operations."""
        input_iter = iter(inputs)
        used_count = 0
        fail_count = 0
        error_messages = []

        while batch := list(itertools.islice(input_iter, self.BATCH_LIMIT)):
            try:
                output: OutputType = self.handle_batched_items(batch)
            except (ValueError, firebase_exceptions.FirebaseError) as e:
                fail_count += len(batch)
                error_messages.append(
                    f'with slice=[{used_count}:{used_count + len(batch)}]: {e}'
                )
            else:
                fail_count += output.failure_count
                error_messages.extend(
                    f'with index=[{used_count + e.index}]: {e.reason}'
                    for e in output.errors
                )
            finally:
                used_count += len(batch)

        if success_count := used_count - fail_count:
            yield beam.TaggedOutput(self.SUCCESS_TAG, success_count)

        for error_message in error_messages:
            yield beam.TaggedOutput(self.ERROR_TAG, error_message)


class DeleteRecords(
    FirebaseBatchOperation[str, firebase_auth.DeleteUsersResult]
):
    """Deletes users from Firebase by their UIDs in batches."""

    def handle_batched_items(
        self, uids: list[str]
    ) -> firebase_auth.DeleteUsersResult:
        return firebase_auth.delete_users(uids)


class ImportRecords(
    FirebaseBatchOperation[
        firebase_auth.ImportUserRecord, firebase_auth.UserImportResult
    ]
):
    """Imports users into Firebase in batches."""

    def handle_batched_items(
        self, users: list[firebase_auth.ImportUserRecord]
    ) -> firebase_auth.UserImportResult:
        return firebase_auth.import_users(users)
