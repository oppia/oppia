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

from collections import abc

from core.jobs.types import firebase_domain

import apache_beam as beam
from typing import TypedDict


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class DiffFirebaseRecords(beam.PTransform):  # type: ignore[misc]
    """Returns the diff between two PCollections of FirebaseRecord objects.

    This transform expects a tuple of PCollection[FirebaseRecord] with exactly 2
    elements. The first PCollection is considered the "expected records" (i.e.
    the ones built from Oppia's user models), and the second PCollection is
    considered to be the "actual records" (i.e. the ones exported directly from
    Firebase).

    Attributes:
        TAG_OK: PCollection[int] that can be summed to find the number of
            records present in both PCollections.
        TAG_ADD: PCollection[FirebaseRecord] with the records that are present
            in the expected records but absent from the actual ones.
        TAG_DEL: PCollection[FirebaseRecord] with the records that are absent
            from the expected records but present in the actual ones.
        TAG_OPPIA_USER_COLLISION: PCollection[str] describing Oppia-side
            data-integrity collisions: multiple Oppia users sharing one email
            address, or multiple Oppia users sharing one Firebase account ID.
            These are NOT actionable by this job because Oppia is the source of
            truth and is itself inconsistent.
        TAG_FIREBASE_ACCOUNT_COLLISION: PCollection[str] describing multiple
            Firebase accounts sharing one email address. This IS actionable: the
            diff resolves it by deleting the extra Firebase accounts.
    """

    class OutputDict(TypedDict):
        """Mapping from each output tag to its PCollection."""

        OK: beam.PCollection[int]
        ADD: beam.PCollection[firebase_domain.FirebaseRecord]
        DEL: beam.PCollection[firebase_domain.FirebaseRecord]
        OPPIA_USER_COLLISION: beam.PCollection[str]
        FIREBASE_ACCOUNT_COLLISION: beam.PCollection[str]

    # NOTE: Tag values are taken from the runtime keys of OutputDict to keep
    # them DRY. These MUST be kept in the same order to keep the mapping correct
    # (verified with tests).
    (
        TAG_OK,
        TAG_ADD,
        TAG_DEL,
        TAG_OPPIA_USER_COLLISION,
        TAG_FIREBASE_ACCOUNT_COLLISION,
    ) = OutputDict.__annotations__.keys()

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
    ) -> DiffFirebaseRecords.OutputDict:
        """Computes the diff between the input pair of Firebase records.

        Args:
            records: tuple. The pair of FirebaseRecord collections to be diffed.
                The first PCollection is considered the "expected records" (i.e.
                the ones built from Oppia's user models), and the second
                PCollection is considered the "actual records" (i.e. the ones
                exported directly from Firebase).

        Returns:
            OutputDict. A mapping from each tag to its PCollection. The tags
            encode the actions needed to bring the actual records in-sync with
            the expected records, and all data-integrity conflicts found which
            aren't actionable (by this job).
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
                self.TAG_OPPIA_USER_COLLISION,
                self.TAG_FIREBASE_ACCOUNT_COLLISION,
            )
        )

        auth_id_collisions = (
            self._auth_pairs
            | 'Group Oppia user ids by Firebase account id' >> beam.GroupByKey()
            | 'Only keep Firebase account ids associated with more than 1 user'
            >> beam.Filter(lambda keyed_user_id: len(set(keyed_user_id[1])) > 1)
            | 'Format Firebase account id collisions'
            >> beam.MapTuple(self._format_auth_id_collision)
        )

        # Both "multiple Oppia users share an email" (from the diff) and
        # "multiple Oppia users share a Firebase account id" (from the auth
        # pairs) are Oppia-side collisions, so they share one output.
        oppia_user_collisions = (
            diff_outputs[self.TAG_OPPIA_USER_COLLISION],
            auth_id_collisions,
        ) | 'Merge Oppia user collisions' >> beam.Flatten()

        return DiffFirebaseRecords.OutputDict(
            OK=diff_outputs[self.TAG_OK],
            ADD=diff_outputs[self.TAG_ADD],
            DEL=diff_outputs[self.TAG_DEL],
            OPPIA_USER_COLLISION=oppia_user_collisions,
            FIREBASE_ACCOUNT_COLLISION=diff_outputs[
                self.TAG_FIREBASE_ACCOUNT_COLLISION
            ],
        )

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
                cls.TAG_OPPIA_USER_COLLISION,
                f'Oppia users ({user_ids=!r}) are sharing the same email',
            )

        if len(actual_set := set(actual_iter)) > 1:
            auth_ids = sorted(record.auth_id for record in actual_set)
            yield beam.TaggedOutput(
                cls.TAG_FIREBASE_ACCOUNT_COLLISION,
                f'Firebase accounts ({auth_ids=!r}) are sharing the same email',
            )

        if ok_records := expected_set & actual_set:
            yield beam.TaggedOutput(cls.TAG_OK, len(ok_records))

        for record_to_add in expected_set - actual_set:
            yield beam.TaggedOutput(cls.TAG_ADD, record_to_add)

        for record_to_del in actual_set - expected_set:
            yield beam.TaggedOutput(cls.TAG_DEL, record_to_del)

    @classmethod
    def _format_auth_id_collision(
        cls, auth_id: str, user_id_iter: abc.Iterable[str]
    ) -> str:
        """Formats the collision message for an auth ID with multiple users."""

        user_ids = sorted(set(user_id_iter))
        return (
            f'Oppia users ({user_ids=!r}) are sharing the same Firebase '
            f'account ({auth_id=!r})'
        )
