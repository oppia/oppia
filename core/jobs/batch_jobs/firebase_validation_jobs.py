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

TAG_ERROR = 'ERROR'
TAG_WARNING = 'WARNING'
TAG_OK = 'OK'

KEY_WITH_EMAIL_FN = lambda record: (record.email, record)


class FirebaseAuditRecordsJob(base_jobs.JobBase):
    """Audit Firebase records against the records that Oppia claims to exist."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        from_oppia = (
            self.pipeline
            | 'Get Oppia Users' >> firebase_io.GetWeakRecords()
            | 'Key Oppia Users by Email' >> beam.Map(KEY_WITH_EMAIL_FN)
        )

        from_firebase = (
            self.pipeline
            | 'Get Firebase Records' >> firebase_io.GetStrongRecords()
            | 'Key Firebase Records by Email' >> beam.Map(KEY_WITH_EMAIL_FN)
        )

        return (
            {'from_oppia': from_oppia, 'from_firebase': from_firebase}
            | 'Group Records by Email' >> beam.CoGroupByKey()
            | 'Drop Email Key' >> beam.Map(lambda key_value: key_value[1])
            | 'Audit Records'
            >> beam.ParDo(_AuditRecords()).with_outputs(
                TAG_OK, TAG_WARNING, TAG_ERROR
            )
            | 'Summarize Audit Results'
            >> job_result_transforms.FromTaggedOutputs(
                TAG_OK, TAG_WARNING, TAG_ERROR
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
            firebase_dict = dataclasses.asdict(firebase_record)
            inconsistent_fields = ', '.join(
                f'the field {k!r} is {oppia!r} in Oppia but {firebase!r} in '
                'Firebase'
                for k in sorted(firebase_dict.keys() & oppia_dict.keys())
                if (firebase := firebase_dict[k]) != (oppia := oppia_dict[k])
            )

            user_id = oppia_dict['user_id']
            firebase_id = firebase_dict['auth_id']
            yield beam.TaggedOutput(
                TAG_WARNING,
                f'Oppia user ({user_id=!r}) is inconsistent with its '
                f'Firebase record ({firebase_id=!r}): {inconsistent_fields}',
            )

        else:
            yield beam.TaggedOutput(TAG_OK, 1)
