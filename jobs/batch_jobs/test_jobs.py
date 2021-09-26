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

"""Simple jobs designed to be easy to read and test."""

from __future__ import absolute_import
from __future__ import annotations
from __future__ import unicode_literals

from core.platform import models
from jobs import base_jobs
from jobs import job_utils
from jobs.io import ndb_io
from jobs.types import job_run_result

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class CountAllModelsJob(base_jobs.JobBase):
    """Counts all of the models in the datastore."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return (
            self.pipeline
            | ndb_io.GetModels(datastore_services.query_everything())
            | beam.Map(job_utils.get_model_kind)
            | beam.combiners.Count.PerElement()
            | beam.Map(lambda kind_count_pair: (
                job_run_result.JobRunResult(stdout='%s: %d' % kind_count_pair)))
        )
