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

"""Validation Jobs for blog models"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import email_models
    from mypy_imports import feedback_models
    from mypy_imports import user_models

(email_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.email, models.NAMES.feedback, models.NAMES.user
])


class DeleteUnneededEmailRelatedModelsJob(base_jobs.JobBase):
    """Job that deletes emails models that belonged to users that were deleted
    as part of the wipeout process.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return self.pipeline
