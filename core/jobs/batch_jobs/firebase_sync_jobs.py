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
from core.jobs.types import firebase_adapters, job_run_result

import apache_beam as beam
from apache_beam import pvalue
from typing import Iterable, TypedDict

DELETE_TAG = 'DELETE'
IMPORT_TAG = 'IMPORT'
REPORT_TAG = 'REPORT'


class FirebaseSyncRecordsJob(base_jobs.JobBase):
    """Regenerate all Firebase records based on Oppia's user & auth models.

    This job runs in two phases:
    1. Delete ALL records that exist on the Firebase server.
    2. Import NEW records from the identifiers in Oppia's user & auth models.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        if (
            feature_flag_domain.get_server_mode()
            == feature_flag_domain.ServerMode.PROD
        ):
            job_name = self.__class__.__name__
            raise PermissionError(f'{job_name} must never be run in production')

        from_oppia = (
            self.pipeline
            | 'Get records from Oppia' >> firebase_io.GetWeakRecords()
            | 'Key weak records by email' >> beam.Map(lambda r: (r.email, r))
        )

        from_firebase = (
            self.pipeline
            | 'Get records from Firebase' >> firebase_io.GetStrongRecords()
            | 'Key strong records by email' >> beam.Map(lambda r: (r.email, r))
        )

        tagged_outputs: pvalue.DoOutputsTuple = (
            {'from_oppia': from_oppia, 'from_firebase': from_firebase}
            | beam.CoGroupByKey()
            | beam.FlatMapTuple(self._split_into_tags).with_outputs(
                IMPORT_TAG, DELETE_TAG, REPORT_TAG
            )
        )

        delete_results = (
            tagged_outputs[DELETE_TAG]
            | 'Delete records from Firebase' >> firebase_io.DeleteRecords()
        )

        import_results = (
            tagged_outputs[IMPORT_TAG]
            | 'Wait for records to be deleted' >> beam.WaitOn(delete_results)
            | 'Import records into Firebase' >> firebase_io.ImportRecords()
        )

        report_results = (
            tagged_outputs[REPORT_TAG]
            | 'Count OK records' >> beam.CombineGlobally(sum)
            | 'Omit zero count' >> beam.Filter(lambda n: n > 0)
            | 'Format count' >> beam.Map(lambda n: (f'OK: {n}'))
            | 'Report count' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        return (delete_results, import_results, report_results) | beam.Flatten()

    class _GroupedOutput(TypedDict):
        """Typings for the CoGroupByKey() output of grouped records."""

        from_oppia: Iterable[firebase_adapters.WeakRecord]
        from_firebase: Iterable[firebase_adapters.StrongRecord]

    def _split_into_tags(
        self,
        _: str,
        grouped: _GroupedOutput,
    ) -> Iterable[beam.TaggedOutput]:
        """Splits the grouped records into tagged outputs by use case."""

        from_oppia = set(grouped['from_oppia'])
        from_firebase = set(grouped['from_firebase'])

        for record in from_oppia.intersection(from_firebase):
            yield beam.TaggedOutput(REPORT_TAG, 1)

        for record in from_oppia.difference(from_firebase):
            yield beam.TaggedOutput(IMPORT_TAG, record.into_import())

        # Here we use MyPy ignore because records are designed to be compatible.
        for record in from_firebase.difference(from_oppia):  # type: ignore[assignment]
            yield beam.TaggedOutput(DELETE_TAG, record.auth_id)
