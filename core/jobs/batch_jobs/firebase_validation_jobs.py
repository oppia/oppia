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

TAG_OK = 'OK'
TAG_ERR = 'ERR'


class FirebaseAuditRecordsJob(base_jobs.JobBase):
    """Audit Firebase records against the records that Oppia claims to exist."""

    class RecordsGroupedByEmail(TypedDict):
        """Typings for the CoGroupByKey() output of joined records."""

        weak_entries: Iterable[firebase_adapters.WeakRecord]
        strong_entries: Iterable[firebase_adapters.StrongRecord]

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        weak_entries = (
            self.pipeline
            | 'Build weak records from Oppia' >> firebase_io.GetWeakRecords()
            | 'Map to weak email entries' >> beam.Map(lambda r: (r.email, r))
        )

        strong_entries = (
            self.pipeline
            | 'Get strong records in Firebase' >> firebase_io.GetStrongRecords()
            | 'Map to strong email entries' >> beam.Map(lambda r: (r.email, r))
        )

        outputs = (
            {'weak_entries': weak_entries, 'strong_entries': strong_entries}
            | 'Group record entries by email' >> beam.CoGroupByKey()
            | 'Drop email key' >> beam.Map(lambda key_value: key_value[1])
            | 'Audit grouped records'
            >> beam.FlatMap(self.audit_grouped_records).with_outputs(
                TAG_ERR, TAG_OK
            )
        )

        ok_results = (
            outputs[TAG_OK]
            | 'Count OK records' >> beam.CombineGlobally(sum)
            | 'Omit OK count if zero' >> beam.Filter(lambda count: count > 0)
            | 'Format OK count' >> beam.Map(lambda count: f'OK: {count}')
            | 'Build stdout' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        err_results = outputs[TAG_ERR] | 'Build stderr' >> beam.Map(
            job_run_result.JobRunResult.as_stderr
        )

        return (ok_results, err_results) | 'Combine outputs' >> beam.Flatten()

    def audit_grouped_records(
        self, grouped: RecordsGroupedByEmail
    ) -> Iterable[pvalue.TaggedOutput]:
        """Yields tagged details about the records grouped with the given email.

        Args:
            grouped: RecordsGroupedByEmail. The grouped records.

        Yields:
            pvalue.TaggedOutput. An OK tag with ok count or ERR tag with reason.
        """
        oppia_records = list(grouped['weak_entries'])
        firebase_records = list(grouped['strong_entries'])
        collisions_found = False

        if len(ids := sorted({r.auth_id for r in firebase_records})) > 1:
            yield pvalue.TaggedOutput(
                TAG_ERR, f'Found Firebase Records with same email: {ids=!r}'
            )
            collisions_found = True

        if len(ids := sorted({r.user_id for r in oppia_records})) > 1:
            yield pvalue.TaggedOutput(
                TAG_ERR, f'Found Oppia Users with same email: {ids=!r}'
            )
            collisions_found = True

        if collisions_found:
            return

        oppia_record = oppia_records.pop() if oppia_records else None
        firebase_record = firebase_records.pop() if firebase_records else None

        if firebase_record and not oppia_record:
            auth_id = firebase_record.auth_id
            yield pvalue.TaggedOutput(
                TAG_ERR,
                f'Firebase Record (uid={auth_id!r}) unlinked to Oppia User',
            )
            return

        if oppia_record and not firebase_record:
            user_id = oppia_record.user_id
            yield pvalue.TaggedOutput(
                TAG_ERR,
                f'Oppia User (user_id={user_id!r}) unlinked to Firebase Record',
            )
            return

        if firebase_record == oppia_record:
            yield pvalue.TaggedOutput(TAG_OK, 1)
            return

        firebases = dataclasses.asdict(firebase_record)
        oppias = dataclasses.asdict(oppia_record)
        # Pop user_id from Oppia dict since Firebase won't have it (by design).
        user_id = oppias.pop('user_id')

        diffs = ', '.join(
            f'the field {k!r} in {firebase=!r} but in {oppia=!r}'
            for k in sorted(firebases.keys() | oppias.keys())
            if (firebase := firebases.get(k)) != (oppia := oppias.get(k))
        )

        yield pvalue.TaggedOutput(
            TAG_ERR,
            f'Oppia User (id={user_id!r}) inconsistent with Firebase: {diffs}',
        )
