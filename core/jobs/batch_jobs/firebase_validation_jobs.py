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

"""Job for auditing Firebase records against Oppia's user & auth models."""

from __future__ import annotations

import dataclasses

from core.jobs import base_jobs
from core.jobs.io import firebase_io
from core.jobs.types import firebase_adapters, job_run_result

import apache_beam as beam
from apache_beam import pvalue
from typing import Iterable, TypedDict


class FirebaseAuditRecordsJob(base_jobs.JobBase):
    """Audit Firebase records against the records that Oppia claims to exist."""

    TAG_OK = 'OK'
    TAG_ERR = 'ERR'

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        weak_entries = (
            self.pipeline
            | 'Build weak records from Oppia' >> firebase_io.GetWeakRecords()
            | 'Build weak record entries' >> beam.Map(lambda r: (r.email, r))
        )

        strong_entries = (
            self.pipeline
            | 'Get strong records in Firebase' >> firebase_io.GetStrongRecords()
            | 'Build strong record entries' >> beam.Map(lambda r: (r.email, r))
        )

        outputs = (
            {'weak_entries': weak_entries, 'strong_entries': strong_entries}
            | 'Group record entries by email' >> beam.CoGroupByKey()
            | 'Audit grouped records'
            >> beam.FlatMapTuple(self._audit_grouped_records).with_outputs(
                self.TAG_ERR, self.TAG_OK
            )
        )

        ok_results = (
            outputs[self.TAG_OK]
            | 'Count OK records' >> beam.CombineGlobally(sum)
            | 'Omit OK count if zero' >> beam.Filter(lambda count: count > 0)
            | 'Format OK count' >> beam.Map(lambda count: f'OK: {count}')
            | 'Build stdout' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        err_results = (
            outputs[self.TAG_ERR]
            | 'Format errors' >> beam.Map(lambda error: f'ERROR: {error}')
            | 'Build stderr' >> beam.Map(job_run_result.JobRunResult.as_stderr)
        )

        return (ok_results, err_results) | beam.Flatten()

    class _GroupedRecords(TypedDict):
        """Typings for the grouped records that are audited together."""

        weak_entries: Iterable[firebase_adapters.WeakRecord]
        strong_entries: Iterable[firebase_adapters.StrongRecord]

    def _audit_grouped_records(
        self, email: str, grouped: _GroupedRecords
    ) -> Iterable[pvalue.TaggedOutput]:
        """Yields tagged details about the records grouped with the given email.

        Args:
            email: str. The email shared by all records in the group.
            grouped: _GroupedRecords. The records that share the same email.

        Yields:
            pvalue.TaggedOutput. An OK tag with ok count or ERR tag with reason.
        """
        collisions_found = False

        if len(oppia_records := set(grouped['weak_entries'])) > 1:
            collisions_found = True
            ids = sorted(record.user_id for record in oppia_records)
            yield pvalue.TaggedOutput(
                self.TAG_ERR, f'Oppia User IDs have same {email=}: {ids!r}'
            )

        if len(firebase_records := set(grouped['strong_entries'])) > 1:
            collisions_found = True
            ids = sorted(record.auth_id for record in firebase_records)
            yield pvalue.TaggedOutput(
                self.TAG_ERR, f'Firebase Auth IDs have same {email=}: {ids!r}'
            )

        if collisions_found:
            return

        if oppia_records and not firebase_records:
            yield pvalue.TaggedOutput(
                self.TAG_ERR, f'Oppia user with {email=} has no Firebase record'
            )
            return

        if firebase_records and not oppia_records:
            yield pvalue.TaggedOutput(
                self.TAG_ERR, f'Firebase record with {email=} has no Oppia user'
            )
            return

        if oppia_records == firebase_records:
            yield pvalue.TaggedOutput(self.TAG_OK, 1)
            return

        oppia_dict = dataclasses.asdict(oppia_records.pop())
        firebase_dict = dataclasses.asdict(firebase_records.pop())
        user_id: str = oppia_dict.pop('user_id')

        in_oppia_not_in_firebase = sorted(
            f'{prop}: {value!r}'
            for prop, value in oppia_dict.items()
            if firebase_dict[prop] != value
        )

        in_firebase_not_in_oppia = sorted(
            f'{prop}: {value!r}'
            for prop, value in firebase_dict.items()
            if oppia_dict[prop] != value
        )

        yield pvalue.TaggedOutput(
            self.TAG_ERR,
            f'Oppia {user_id=} does not match with its Firebase record! '
            f'Oppia is using ({", ".join(in_oppia_not_in_firebase)}) but '
            f'Firebase is using ({", ".join(in_firebase_not_in_oppia)})',
        )
