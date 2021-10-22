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

"""Unit tests for jobs.batch_jobs.exp_recommendation_computation_jobs."""

from __future__ import absolute_import
from __future__ import unicode_literals

import datetime

from core.constants import constants
from core.domain import recommendations_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict, List, Tuple, Union # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import exp_models
    from mypy_imports import recommendations_models

(exp_models, recommendations_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.recommendations])


class MigrateSkillJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = story_migration_jobs.MigrateStoryJob

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()
