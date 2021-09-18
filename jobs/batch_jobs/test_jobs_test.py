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

"""Unit tests for jobs.batch_jobs.test_jobs."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core.platform import models
from jobs import job_test_utils
from jobs.batch_jobs import test_jobs
from jobs.types import job_run_result

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class CountAllModelsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = test_jobs.CountAllModelsJob

    def test_output_is_empty_when_datastore_is_empty(self) -> None:
        self.assert_job_output_is_empty()

    def test_output_returns_models_discovered(self) -> None:
        self.put_multi([
            self.create_model(base_models.BaseModel),
            self.create_model(base_models.BaseModel),
            self.create_model(base_models.BaseModel),
        ])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='BaseModel: 3'),
        ])
