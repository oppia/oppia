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

import hashlib
import itertools

from core.constants import constants
from core.platform.auth import firebase_auth_services

import apache_beam as beam
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions
from apache_beam import pvalue
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

    PASS_TAG = 'SUCCESS'
    FAIL_TAG = 'FAILURE'

    def handle_batched_items(self, _: list[InputType]) -> OutputType:
        """Virtual function to call a specific Firebase Admin SDK operation."""

        raise NotImplementedError('Subclasses must override this function')

    def setup(self) -> None:
        """Establishes a Firebase connection just before running `process`."""

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
                    f'at slice=[{used_count}:{used_count + len(batch)}]: {e}'
                )
            else:
                fail_count += output.failure_count
                error_messages.extend(
                    f'at index=[{used_count + e.index}]: {e.reason}'
                    for e in output.errors
                )
            finally:
                used_count += len(batch)

        if success_count := max(used_count - fail_count, 0):
            yield beam.TaggedOutput(self.PASS_TAG, success_count)

        for error_message in error_messages:
            yield beam.TaggedOutput(self.FAIL_TAG, error_message)


class DeleteRecords(
    FirebaseBatchOperation[str, firebase_auth.DeleteUsersResult]
):
    """Deletes users from Firebase by their UIDs in batches."""

    def handle_batched_items(
        self, uids: list[str]
    ) -> firebase_auth.DeleteUsersResult:
        return firebase_auth.delete_users(uids)


class CreateRecords(
    FirebaseBatchOperation[
        firebase_auth.ImportUserRecord, firebase_auth.UserImportResult
    ]
):
    """Imports users into Firebase in batches."""

    def handle_batched_items(
        self, users: list[firebase_auth.ImportUserRecord]
    ) -> firebase_auth.UserImportResult:
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

        Raises:
            AssertionError. Email is required within EMULATOR_MODE.
        """

        errors = []
        for i, record in enumerate(records):
            try:
                user_email = record.email or ''
                # HINT: `md5(email)` used for consistency with the frontend.
                # See: core/templates/services/auth.service.ts.
                user_password = hashlib.md5(user_email.encode()).hexdigest()
                firebase_auth.create_user(
                    uid=record.uid,
                    email=user_email,
                    disabled=record.disabled,
                    password=user_password,
                )
            except (ValueError, firebase_exceptions.FirebaseError) as e:
                errors.append({'index': i, 'message': str(e)})

        return firebase_auth.UserImportResult({'error': errors}, len(records))
