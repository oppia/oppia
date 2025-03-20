# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for skill_inspections_jobs.py"""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import skill_inspection_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.domain import skill_domain

import datetime
from typing import Final

MYPY = False
if MYPY:
   from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.Names.SKILL])


class CountHangingPrerequisiteSkillsJobTests(job_test_utils.JobTestBase):
    JOB_CLASS = skill_inspection_jobs.CountHangingPrerequisiteSkillsJob

    skill_id_1: Final = 'skill_id_1'
    skill_id_2: Final = 'skill_id_2'
    skill_id_3: Final = 'skill_id_3'

    def setUp(self) -> None:
        super().setUp()
        self.description = 'skill_description'
        self.misconceptions_schema_version = 1
        self.rubric_schema_version = 1