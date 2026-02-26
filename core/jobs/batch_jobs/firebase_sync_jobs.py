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
from typing import Iterable, TypedDict

REPORT_ACTION = 'REPORT'
DELETE_ACTION = 'DELETE'
IMPORT_ACTION = 'IMPORT'


class FirebaseSyncRecordsJob(base_jobs.JobBase):
    """Regenerate all Firebase records based on Oppia's user & auth models."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        if (
            feature_flag_domain.get_server_mode()
            == feature_flag_domain.ServerMode.PROD
        ):
            job_name = self.__class__.__name__
            raise PermissionError(f'{job_name} must never be run in production')

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

        categorized_groups = (
            {'from_oppia': from_oppia, 'from_firebase': from_firebase}
            | 'Group by email' >> beam.CoGroupByKey()
            | 'Drop email key' >> beam.Map(lambda key_value: key_value[1])
            | 'Categorize grouped records'
            >> beam.FlatMap(self._categorize_grouped_records).with_outputs(
                REPORT_ACTION, DELETE_ACTION, IMPORT_ACTION
            )
        )

        report_results = (
            categorized_groups[REPORT_ACTION]
            | 'Count OKs' >> beam.CombineGlobally(sum)
            | 'Omit OKs when zero' >> beam.Filter(lambda oks: oks > 0)
            | 'Format OKs' >> beam.Map(lambda oks: f'OK: {oks}')
            | 'Dump OKs into stdout'
            >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        delete_results = (
            categorized_groups[DELETE_ACTION]
            | 'Delete records from Firebase' >> firebase_io.DeleteRecords()
        )

        import_results = (
            categorized_groups[IMPORT_ACTION]
            | 'Wait for delete to finish' >> beam.WaitOn(delete_results)
            | 'Import records into Firebase' >> firebase_io.ImportRecords()
        )

        return (report_results, delete_results, import_results) | beam.Flatten()

    class _RecordsGroupedByEmail(TypedDict):
        """Typings for the CoGroupByKey() output of joined records."""

        from_oppia: Iterable[firebase_adapters.WeakRecord]
        from_firebase: Iterable[firebase_adapters.StrongRecord]

    def _categorize_grouped_records(
        self, groups: _RecordsGroupedByEmail
    ) -> Iterable[beam.TaggedOutput]:
        """Splits records into tagged outputs based on which action to take."""

        from_oppia = frozenset(groups['from_oppia'])
        from_firebase = frozenset(groups['from_firebase'])

        if ok_count := len(from_firebase.intersection(from_oppia)):
            yield beam.TaggedOutput(REPORT_ACTION, ok_count)

        for record in from_firebase.difference(from_oppia):
            yield beam.TaggedOutput(DELETE_ACTION, record.auth_id)

        for record in from_oppia.difference(from_firebase):
            yield beam.TaggedOutput(IMPORT_ACTION, record.into_import())
