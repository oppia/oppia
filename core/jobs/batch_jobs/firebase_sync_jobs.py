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

"""Job for bringing Firebase records in sync with Oppia's user & auth models."""

from __future__ import annotations

from core.domain import feature_flag_domain
from core.jobs import base_jobs
from core.jobs.io import firebase_io
from core.jobs.transforms import firebase_transforms, job_result_transforms
from core.jobs.types import firebase_adapters, job_run_result

import apache_beam as beam
from typing import Iterable, TypedDict

CORRECT_TAG = 'CORRECT'
DELETED_TAG = 'DELETED'
IMPORTED_TAG = 'IMPORTED'

KEY_WITH_EMAIL_FN = lambda record: (record.email, record)


class FirebaseSyncRecordsJob(base_jobs.JobBase):
    """Sync Firebase records to match with Oppia's user & auth models."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        if (
            feature_flag_domain.get_server_mode()
            == feature_flag_domain.ServerMode.PROD
        ):
            job_name = self.__class__.__name__
            raise PermissionError(f'{job_name} must never be run in production')

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

        group_outputs = (
            {'from_oppia': from_oppia, 'from_firebase': from_firebase}
            | 'Group Records by Email' >> beam.CoGroupByKey()
            | 'Drop Email Key' >> beam.Map(lambda key_value: key_value[1])
            | 'Partition Records'
            >> beam.ParDo(_PartitionRecords()).with_outputs(
                CORRECT_TAG, DELETED_TAG, IMPORTED_TAG
            )
        )

        correct_results = (
            group_outputs
            | 'Summarize Correct Records'
            >> job_result_transforms.FromTaggedOutputs(CORRECT_TAG)
        )

        delete_fn = firebase_transforms.DeleteRecords()
        delete_results = (
            group_outputs[DELETED_TAG]
            | 'Gather All Firebase UIDs into One Worker'
            >> beam.combiners.ToList()
            | 'Delete Records from Firebase'
            >> beam.ParDo(firebase_transforms.DeleteRecords()).with_outputs(
                delete_fn.SUCCESS_TAG,
                delete_fn.ERROR_TAG,
            )
            | 'Summarize Delete Results'
            >> job_result_transforms.FromTaggedOutputs(
                delete_fn.SUCCESS_TAG,
                delete_fn.ERROR_TAG,
                prefix='Delete Records',
            )
        )

        import_fn = firebase_transforms.ImportRecords()
        import_results = (
            group_outputs[IMPORTED_TAG]
            | 'Gather All Import Records into One Worker'
            >> beam.combiners.ToList()
            | 'Wait for Delete Records to complete'
            >> beam.WaitOn(delete_results)
            | 'Import Records into Firebase'
            >> beam.ParDo(firebase_transforms.ImportRecords()).with_outputs(
                import_fn.SUCCESS_TAG,
                import_fn.ERROR_TAG,
            )
            | 'Summarize Import Results'
            >> job_result_transforms.FromTaggedOutputs(
                import_fn.SUCCESS_TAG,
                import_fn.ERROR_TAG,
                prefix='Import Records',
            )
        )

        return (
            correct_results,
            delete_results,
            import_results,
        ) | 'Flatten Results' >> beam.Flatten()


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class _PartitionRecords(beam.DoFn):  # type: ignore[misc]
    """Partitions records into groups for follow-up syncing actions."""

    class GroupedByUserId(TypedDict):
        """Typings for the CoGroupByKey() output joined by email."""

        from_oppia: Iterable[firebase_adapters.WeakRecord]
        from_firebase: Iterable[firebase_adapters.StrongRecord]

    def process(self, grouped: GroupedByUserId) -> Iterable[beam.TaggedOutput]:
        """Categorizes records by yielding tagged outputs."""
        from_oppia = frozenset(grouped['from_oppia'])
        from_firebase = frozenset(grouped['from_firebase'])

        if ok_count := len(from_oppia.intersection(from_firebase)):
            yield beam.TaggedOutput(CORRECT_TAG, ok_count)

        for record in from_firebase.difference(from_oppia):
            yield beam.TaggedOutput(DELETED_TAG, record.auth_id)

        for record in from_oppia.difference(from_firebase):
            yield beam.TaggedOutput(IMPORTED_TAG, record.into_import())
