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
from core.jobs.transforms import job_result_transforms
from core.jobs.types import firebase_adapters, job_run_result

import apache_beam as beam
from typing import Iterable, TypedDict

# CORRUPT outputs are **unexpected**, and require a SERVER ADMIN to investigate!
TAG_CORRUPT = 'CORRUPT'

# FIXABLE outputs are _expected_, and can be fixed by running `FirebaseSyncJob`.
TAG_FIXABLE = 'FIXABLE'

# CORRECT outputs are _expected_, and can be used to confirm that things are OK.
TAG_CORRECT = 'CORRECT'


class FirebaseAuditRecordsJob(base_jobs.JobBase):
    """Audit Firebase records against the records that Oppia claims to exist."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        key_by_email = lambda record: (record.email, record)
        weak_records = (
            self.pipeline
            | 'Get Weak Records' >> firebase_io.GetWeakRecords()
            | 'Key Weak Records by Email' >> beam.Map(key_by_email)
        )
        strong_records = (
            self.pipeline
            | 'Get Strong Records' >> firebase_io.GetStrongRecords()
            | 'Key Strong Records by Email' >> beam.Map(key_by_email)
        )
        return (
            {'from_oppia': weak_records, 'from_firebase': strong_records}
            | 'Group Records by Email Key' >> beam.CoGroupByKey()
            | 'Drop Email Key' >> beam.Map(lambda key_value: key_value[1])
            | 'Audit Records'
            >> beam.ParDo(_AuditRecords()).with_outputs(
                TAG_CORRECT, TAG_FIXABLE, TAG_CORRUPT
            )
            | 'Summarize Audited Records'
            >> job_result_transforms.FromTaggedOutputs(
                TAG_CORRECT, TAG_FIXABLE, TAG_CORRUPT
            )
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class _AuditRecords(beam.DoFn):  # type: ignore[misc]
    """Audits records using tagged outputs to group findings by severity."""

    class GroupedByEmail(TypedDict):
        """Typings for the CoGroupByKey() output joined by email."""

        from_oppia: Iterable[firebase_adapters.WeakRecord]
        from_firebase: Iterable[firebase_adapters.StrongRecord]

    def process(self, grouped: GroupedByEmail) -> Iterable[beam.TaggedOutput]:
        """Yields tagged outputs which will group audit findings by severity."""

        from_oppia = frozenset(grouped['from_oppia'])
        from_firebase = frozenset(grouped['from_firebase'])
        email_is_reused = False

        if len(user_ids := sorted({r.user_id for r in from_oppia})) > 1:
            email_is_reused = True
            yield beam.TaggedOutput(
                TAG_CORRUPT,
                f'OPPIA USERS ({user_ids=!r}) ARE USING THE SAME EMAIL! '
                'A server admin must manually resolve these collisions by '
                'giving each user a UNIQUE email.',
            )

        if len(firebase_ids := sorted({r.auth_id for r in from_firebase})) > 1:
            email_is_reused = True
            yield beam.TaggedOutput(
                TAG_FIXABLE,
                f'Firebase records share email: {firebase_ids=!r}',
            )

        if email_is_reused:
            return

        [oppia_record] = from_oppia or [None]
        [firebase_record] = from_firebase or [None]

        if oppia_record and not firebase_record:
            user_id = oppia_record.user_id
            firebase_id = oppia_record.auth_id

            yield beam.TaggedOutput(
                TAG_FIXABLE,
                f'Oppia user ({user_id=!r}) linked to non-existent '
                f'Firebase record ({firebase_id=!r})',
            )
        elif not oppia_record and firebase_record:
            firebase_id = firebase_record.auth_id

            yield beam.TaggedOutput(
                TAG_FIXABLE,
                f'Firebase record ({firebase_id=!r}) linked to non-existent '
                'Oppia user',
            )
        elif oppia_record != firebase_record:
            oppia_dict = dataclasses.asdict(oppia_record)
            firebase_dict = dataclasses.asdict(firebase_record)

            user_id = oppia_dict['user_id']
            firebase_id = firebase_dict['auth_id']
            inconsistent_props = ', '.join(
                f'{prop!r} is {o!r} in Oppia but {f!r} in Firebase'
                for prop in sorted(oppia_dict.keys() & firebase_dict.keys())
                if (o := oppia_dict[prop]) != (f := firebase_dict[prop])
            )

            yield beam.TaggedOutput(
                TAG_FIXABLE,
                f'Oppia user ({user_id=!r}) is inconsistent with its '
                f'Firebase record ({firebase_id=!r}): {inconsistent_props}',
            )
        else:
            yield beam.TaggedOutput(TAG_CORRECT, 1)
