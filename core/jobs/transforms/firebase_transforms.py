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

import abc as abstract_base_classes
import itertools
from collections import abc

from core.jobs.transforms import job_result_transforms
from core.jobs.types import firebase_domain, job_run_result
from core.platform.auth import firebase_auth_services

import apache_beam as beam
import firebase_admin.auth as firebase_auth
import firebase_admin.exceptions as firebase_exceptions
from apache_beam import pvalue
from typing import Generic, TypeVar

InputT = TypeVar('InputT', bound=str | firebase_auth.ImportUserRecord)
OutputT = TypeVar(
    'OutputT',
    bound=firebase_auth.DeleteUsersResult | firebase_auth.UserImportResult,
)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class DiffFirebaseRecords(beam.PTransform):  # type: ignore[misc]
    """Returns the diff between two PCollections of FirebaseRecord objects.

    This transform expects a tuple of PCollection[FirebaseRecord] with exactly 2
    elements. The first PCollection is considered the "expected records" (i.e.
    the ones built from Oppia's user models), and the second PCollection is
    considered to be the "actual records" (i.e. the ones exported directly from
    Firebase).

    Attributes:
        TAG_OK: str. Tag to PCollection[int] that can be summed to find the
            number of records present in both PCollections.
        TAG_ADD: str. Tag to PCollection[FirebaseRecord] with the records that
            are present in the expected records but absent from the actual ones.
        TAG_DEL: str. Tag to PCollection[FirebaseRecord] with the records that
            are absent from the expected records but present in the actual ones.
        TAG_EMAIL_CONFLICT: str. Tag to PCollection[str] describing the Oppia
            users that are sharing an email address; this violates the
            assumption that each email should map to exactly one user.
        TAG_AUTH_ID_CONFLICT: str. Tag to PCollection[str] describing the Oppia
            users that are sharing a Firebase account ID; this violates the
            assumption that each Firebase account maps to exactly one user.
    """

    TAG_OK = 'OK'
    TAG_ADD = 'ADD'
    TAG_DEL = 'DEL'
    TAG_EMAIL_CONFLICT = 'EMAIL_CONFLICT'
    TAG_AUTH_ID_CONFLICT = 'AUTH_ID_CONFLICT'

    def __init__(
        self,
        auth_pairs: beam.PCollection[tuple[str, str]],
        label: str | None = None,
    ) -> None:
        """Initializes the DiffFirebaseRecords PTransform.

        This transform expects a tuple of PCollection[FirebaseRecord] with
        exactly 2 elements. The first PCollection is considered the "expected
        records" (i.e. the ones built from Oppia's user models), and the second
        PCollection is considered to be the "actual records" (i.e. the ones
        exported directly from Firebase).

        Args:
            auth_pairs: PCollection. Collection of (firebase id, oppia user id)
                pairs for every Firebase-linked Oppia user. Used to detect auth
                ID conflicts and to annotate email conflicts.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self._auth_pairs = auth_pairs

    def expand(
        self,
        records: tuple[
            beam.PCollection[firebase_domain.FirebaseRecord],
            beam.PCollection[firebase_domain.FirebaseRecord],
        ],
    ) -> dict[str, beam.PCollection]:
        """Computes the diff between the input pair of Firebase records.

        Args:
            records: tuple. The pair of FirebaseRecord collections to be diffed.
                The first PCollection is considered the "expected records" (i.e.
                the ones built from Oppia's user models), and the second
                PCollection is considered the "actual records" (i.e. the ones
                exported directly from Firebase).

        Returns:
            dict. A dict mapping each tag (TAG_OK, TAG_ADD, TAG_DEL,
            TAG_EMAIL_CONFLICT, TAG_AUTH_ID_CONFLICT) to its PCollection. The
            tags encode the actions needed to bring the actual records in-sync
            with the expected records, and all data-integrity conflicts found
            which aren't actionable (by this job).
        """

        expected_records, actual_records = records

        keyed_expected_records = (
            expected_records
            | 'Get expected records with email keys'
            >> beam.Map(lambda r: (r.email, r))
        )

        keyed_actual_records = (
            actual_records
            | 'Get actual records with email keys'
            >> beam.Map(lambda r: (r.email, r))
        )

        diff_outputs = (
            (keyed_expected_records, keyed_actual_records)
            | 'Group records by email' >> beam.CoGroupByKey()
            | 'Drop email keys' >> beam.MapTuple(lambda _, grouped: grouped)
            | 'Compute diff'
            >> beam.FlatMapTuple(
                self._yield_diffs,
                beam.pvalue.AsMultiMap(self._auth_pairs),
            ).with_outputs(
                self.TAG_OK,
                self.TAG_ADD,
                self.TAG_DEL,
                self.TAG_EMAIL_CONFLICT,
            )
        )

        auth_id_conflicts = (
            self._auth_pairs
            | 'Group Oppia user ids by Firebase account id' >> beam.GroupByKey()
            | 'Only keep Firebase account ids associated with more than 1 user'
            >> beam.Filter(lambda keyed_user_id: len(set(keyed_user_id[1])) > 1)
            | 'Format Firebase account id conflicts'
            >> beam.MapTuple(self._format_auth_id_conflict)
        )

        return {
            self.TAG_OK: diff_outputs[self.TAG_OK],
            self.TAG_ADD: diff_outputs[self.TAG_ADD],
            self.TAG_DEL: diff_outputs[self.TAG_DEL],
            self.TAG_EMAIL_CONFLICT: diff_outputs[self.TAG_EMAIL_CONFLICT],
            self.TAG_AUTH_ID_CONFLICT: auth_id_conflicts,
        }

    @classmethod
    def _yield_diffs(
        cls,
        expected_iter: abc.Iterable[firebase_domain.FirebaseRecord],
        actual_iter: abc.Iterable[firebase_domain.FirebaseRecord],
        user_ids_by_auth_id: abc.Mapping[str, abc.Iterable[str]] | None = None,
    ) -> abc.Iterator[beam.TaggedOutput]:
        """Yields diffs between the given records using tagged outputs."""
        user_ids_by_auth_id = user_ids_by_auth_id or {}

        if len(expected_set := set(expected_iter)) > 1:
            user_ids = sorted(
                {
                    user_id
                    for record in expected_set
                    for user_id in user_ids_by_auth_id[record.auth_id]
                }
            )
            yield beam.TaggedOutput(
                cls.TAG_EMAIL_CONFLICT,
                f'Oppia users ({user_ids=!r}) are sharing the same email',
            )

        if len(actual_set := set(actual_iter)) > 1:
            auth_ids = sorted(record.auth_id for record in actual_set)
            yield beam.TaggedOutput(
                cls.TAG_EMAIL_CONFLICT,
                f'Firebase accounts ({auth_ids=!r}) are sharing the same email',
            )

        if ok_records := expected_set & actual_set:
            yield beam.TaggedOutput(cls.TAG_OK, len(ok_records))

        for record_to_add in expected_set - actual_set:
            yield beam.TaggedOutput(cls.TAG_ADD, record_to_add)

        for record_to_del in actual_set - expected_set:
            yield beam.TaggedOutput(cls.TAG_DEL, record_to_del)

    @classmethod
    def _format_auth_id_conflict(
        cls, auth_id: str, user_id_iter: abc.Iterable[str]
    ) -> str:
        """Formats the conflict message for an auth ID with multiple users."""

        user_ids = sorted(set(user_id_iter))
        return (
            f'Oppia users ({user_ids=!r}) are sharing the same Firebase '
            f'account ({auth_id=!r})'
        )


class FirebaseBatchOperation(
    # TODO(#15613): Here we use MyPy ignore because Apache Beam lacks types.
    beam.PTransform,  # type: ignore[misc]
    Generic[InputT, OutputT],
    abstract_base_classes.ABC,
):
    """Executes a batch operation against Firebase and returns the results."""

    BATCH_LIMIT = 1000
    OK_TAG = 'OK'
    ERR_TAG = 'ERROR'

    def setup(self) -> None:
        """Establishes a Firebase connection just before running expand()."""
        firebase_auth_services.establish_firebase_connection()

    def expand(
        self, records: beam.PCollection[firebase_domain.FirebaseRecord]
    ) -> beam.PCollection[job_run_result.JobRunResult]:

        return (
            records
            | beam.Map(self.get_batch_input)
            | beam.combiners.ToList()
            | beam.ParDo(self._yield_run_batch_operation_output).with_outputs(
                self.OK_TAG,
                self.ERR_TAG,
            )
            | job_result_transforms.FromTaggedOutputs(
                self.OK_TAG,
                self.ERR_TAG,
            )
        )

    @abstract_base_classes.abstractmethod
    def get_batch_input(self, record: firebase_domain.FirebaseRecord) -> InputT:
        """Virtual function to extract the relevant FirebaseRecord fields."""

        del record
        raise NotImplementedError('Subclasses must implement get_batch_input()')

    @abstract_base_classes.abstractmethod
    def run_batch_operation(self, input_batch: list[InputT]) -> OutputT:
        """Virtual function to call a specific Firebase Admin SDK operation."""

        del input_batch
        raise NotImplementedError(
            'Subclasses must implement run_batch_operation()'
        )

    def _yield_run_batch_operation_output(
        self, inputs: list[InputT]
    ) -> abc.Iterator[pvalue.TaggedOutput]:
        """Common batch processing logic for Firebase Admin SDK operations."""

        input_iter = iter(inputs)
        input_offset = 0
        failure_count = 0

        while batch := list(itertools.islice(input_iter, self.BATCH_LIMIT)):
            try:
                output = self.run_batch_operation(batch)

            except (ValueError, firebase_exceptions.FirebaseError) as e:
                failure_count += len(batch)
                yield beam.TaggedOutput(
                    self.ERR_TAG,
                    f'at slice=[{input_offset}:{input_offset + len(batch)}]: {e}',
                )

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
