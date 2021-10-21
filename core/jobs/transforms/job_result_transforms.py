# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Provides an Apache Beam API for operating on NDB models."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core import feconf
from core.jobs import job_utils
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from apache_beam import pvalue
from apache_beam.io.gcp.datastore.v1new import datastoreio

import result
from typing import Optional, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class ResultsToJobRunResults(beam.PTransform): # type: ignore[misc]
    """Transforms result.Result into job_run_result.JobRunResult."""

    def __init__(
        self, prefix: Optional[str] = None, label: Optional[str] = None
    ) -> None:
        """Initializes the GetModels PTransform.

        Args:
            prefix: str. The prefix for the result string.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self.prefix = '%s ' % prefix if prefix else ''

    def _transform_result_to_job_run_result(
        self, result: result.Result
    ) -> job_run_result.JobRunResult:
        if result.is_ok():
            return job_run_result.JobRunResult.as_stdout(
                '%sSUCCESS:' % self.prefix
            )
        else:
            return job_run_result.JobRunResult.as_stderr(
                '%sERROR: "%s":' % (self.prefix, result.value)
            )

    def _add_count_to_job_run_result(
         self, job_result_and_count: Tuple[job_run_result.JobRunResult, int]
    ) -> job_run_result.JobRunResult:
        job_result, count = job_result_and_count
        if job_result.stdout:
            job_result.stdout += ' %s' % str(count)
        if job_result.stderr:
            job_result.stderr += ' %s' % str(count)
        return job_result

    def expand(
        self, results: beam.PCollection[result.Result]
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """"""
        return (
            results
            | 'Transform result to job run result' >> beam.Map(
                self._transform_result_to_job_run_result)
            | 'Count all new models' >> beam.combiners.Count.PerElement()
            | 'Add count to job run result' >> beam.Map(
                self._add_count_to_job_run_result)
        )
