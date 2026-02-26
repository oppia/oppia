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
from typing import Iterable, TypedDict

TAG_ERROR = 'ERROR'
TAG_WARNING = 'WARNING'
TAG_OK = 'OK'


class FirebaseAuditRecordsJob(base_jobs.JobBase):
    """Audit Firebase records against the records that Oppia claims to exist."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        with_email_keys = lambda record: (record.email, record)

        from_oppia = (
            self.pipeline
            | 'Get Oppia users' >> firebase_io.GetWeakRecords()
            | 'Key Oppia users by email' >> beam.Map(with_email_keys)
        )

        from_firebase = (
            self.pipeline
            | 'Get Firebase records' >> firebase_io.GetStrongRecords()
            | 'Key Firebase records by email' >> beam.Map(with_email_keys)
        )

        audited_groups = (
            {'from_oppia': from_oppia, 'from_firebase': from_firebase}
            | 'Group records by email' >> beam.CoGroupByKey()
            | 'Drop email key' >> beam.Map(lambda key_value: key_value[1])
            | 'Audit grouped records'
            >> beam.FlatMap(self._audit_grouped_records).with_outputs(
                TAG_ERROR, TAG_WARNING, TAG_OK
            )
        )

        error_results = (
            audited_groups[TAG_ERROR]
            | 'Format errors' >> beam.Map(lambda msg: f'ERROR: {msg}')
            | 'Dump errors into stderr'
            >> beam.Map(job_run_result.JobRunResult.as_stderr)
        )

        warning_results = (
            audited_groups[TAG_WARNING]
            | 'Format warnings' >> beam.Map(lambda msg: f'WARNING: {msg}')
            | 'Dump warnings into stderr'
            >> beam.Map(job_run_result.JobRunResult.as_stderr)
        )

        ok_results = (
            audited_groups[TAG_OK]
            | 'Count OKs' >> beam.CombineGlobally(sum)
            | 'Omit OKs when zero' >> beam.Filter(lambda oks: oks > 0)
            | 'Format OKs' >> beam.Map(lambda oks: f'OK: {oks}')
            | 'Dump OKs into stdout'
            >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        return (ok_results, error_results, warning_results) | beam.Flatten()

    class _RecordsGroupedByEmail(TypedDict):
        """Typings for the CoGroupByKey() output of joined records."""

        from_oppia: Iterable[firebase_adapters.WeakRecord]
        from_firebase: Iterable[firebase_adapters.StrongRecord]

    def _audit_grouped_records(
        self, grouped: _RecordsGroupedByEmail
    ) -> Iterable[beam.TaggedOutput]:
        """Audits records using tagged outputs to group messages by severity."""
        from_oppia = tuple(grouped['from_oppia'])
        from_firebase = tuple(grouped['from_firebase'])
        collisions_found = False

        if len(user_ids := sorted({r.user_id for r in from_oppia})) > 1:
            yield beam.TaggedOutput(
                TAG_ERROR,
                f'OPPIA USERS ({user_ids=!r}) ARE USING THE SAME EMAIL! '
                'A server admin must manually resolve these collisions by '
                'giving each user a UNIQUE email.',
            )
            collisions_found = True

        if len(firebase_ids := sorted({r.auth_id for r in from_firebase})) > 1:
            yield beam.TaggedOutput(
                TAG_WARNING,
                f'Firebase records share email: {firebase_ids=!r}',
            )
            collisions_found = True

        if collisions_found:
            return

        oppia_record = from_oppia[0] if from_oppia else None
        firebase_record = from_firebase[0] if from_firebase else None

        if oppia_record and not firebase_record:
            user_id = oppia_record.user_id
            firebase_id = oppia_record.auth_id
            yield beam.TaggedOutput(
                TAG_WARNING,
                f'Oppia user ({user_id=!r}) linked to non-existent '
                f'Firebase record ({firebase_id=!r})',
            )

        elif not oppia_record and firebase_record:
            firebase_id = firebase_record.auth_id
            yield beam.TaggedOutput(
                TAG_WARNING,
                f'Firebase record ({firebase_id=!r}) linked to non-existent '
                'Oppia user',
            )

        elif oppia_record != firebase_record:
            oppia_dict = dataclasses.asdict(oppia_record)
            user_id = oppia_dict['user_id']

            firebase_dict = dataclasses.asdict(firebase_record)
            firebase_id = firebase_dict['auth_id']

            inconsistent_fields = ', '.join(
                f'the field {k!r} is {oppia!r} in Oppia but {firebase!r} in '
                'Firebase'
                for k in sorted(firebase_dict.keys() & oppia_dict.keys())
                if (firebase := firebase_dict[k]) != (oppia := oppia_dict[k])
            )

            yield beam.TaggedOutput(
                TAG_WARNING,
                f'Oppia user ({user_id=!r}) is inconsistent with its '
                f'Firebase record ({firebase_id=!r}): {inconsistent_fields}',
            )

        else:
            yield beam.TaggedOutput(TAG_OK, 1)
