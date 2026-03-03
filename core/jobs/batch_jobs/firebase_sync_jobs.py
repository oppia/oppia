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

SKIPPED_TAG = 'SKIPPED'
DELETED_TAG = 'DELETED'
CREATED_TAG = 'CREATED'


class FirebaseSyncRecordsJob(base_jobs.JobBase):
    """Sync Firebase records to match with Oppia's user & auth models."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        if (
            feature_flag_domain.get_server_mode()
            == feature_flag_domain.ServerMode.PROD
        ):
            job_name = self.__class__.__name__
            raise PermissionError(f'{job_name} must never be run in production')

        key_with_email_fn = lambda record: (record.email, record)

        weak_records = (
            self.pipeline
            | 'Get Weak Records in Oppia' >> firebase_io.GetWeakRecords()
            | 'Key Weak Records by Email' >> beam.Map(key_with_email_fn)
        )

        strong_records = (
            self.pipeline
            | 'Get Strong Records in Firebase' >> firebase_io.GetStrongRecords()
            | 'Key Strong Records by Email' >> beam.Map(key_with_email_fn)
        )

        partitioned_outputs = (
            {'from_oppia': weak_records, 'from_firebase': strong_records}
            | 'Group Records by Email Key' >> beam.CoGroupByKey()
            | 'Drop Email Key' >> beam.Map(lambda key_value: key_value[1])
            | 'Partition Records'
            >> beam.ParDo(_PartitionRecords()).with_outputs(
                SKIPPED_TAG, DELETED_TAG, CREATED_TAG
            )
        )

        skipped_results = (
            partitioned_outputs
            | 'Summarize Skipped Records'
            >> job_result_transforms.FromTaggedOutputs(SKIPPED_TAG)
        )

        delete_fn = firebase_transforms.DeleteRecords()
        deleted_results = (
            partitioned_outputs[DELETED_TAG]
            | 'Gather All Firebase IDs into a Single Worker'
            >> beam.combiners.ToList()
            | 'Delete Records from Firebase'
            >> beam.ParDo(firebase_transforms.DeleteRecords()).with_outputs(
                delete_fn.PASS_TAG,
                delete_fn.FAIL_TAG,
            )
            | 'Summarize Deleted Records'
            >> job_result_transforms.FromTaggedOutputs(
                delete_fn.PASS_TAG,
                delete_fn.FAIL_TAG,
                prefix='Delete Records',
            )
        )

        create_fn = firebase_transforms.CreateRecords()
        created_results = (
            partitioned_outputs[CREATED_TAG]
            | 'Gather All Import User Records into a Single Worker'
            >> beam.combiners.ToList()
            | 'Wait for Firebase IDs to be Deleted'
            >> beam.WaitOn(deleted_results)
            | 'Create Records in Firebase'
            >> beam.ParDo(firebase_transforms.CreateRecords()).with_outputs(
                create_fn.PASS_TAG,
                create_fn.FAIL_TAG,
            )
            | 'Summarize Created Records'
            >> job_result_transforms.FromTaggedOutputs(
                create_fn.PASS_TAG,
                create_fn.FAIL_TAG,
                prefix='Create Records',
            )
        )

        return (
            skipped_results,
            deleted_results,
            created_results,
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
            yield beam.TaggedOutput(SKIPPED_TAG, ok_count)

        for record in from_firebase.difference(from_oppia):
            yield beam.TaggedOutput(DELETED_TAG, record.auth_id)

        for record in from_oppia.difference(from_firebase):
            yield beam.TaggedOutput(CREATED_TAG, record.into_import())
