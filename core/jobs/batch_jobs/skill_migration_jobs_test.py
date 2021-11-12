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

from core import feconf
from core.constants import constants
from core.domain import skill_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import skill_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict, List, Tuple, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class MigrateSkillJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = skill_migration_jobs.MigrateSkillJob

    SKILL_1_ID = 'skill_1'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_one_unmigrated_skill(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=[{
                'difficulty': 'Easy',
                'explanations': 'a'
            }, {
                'difficulty': 'Medium',
                'explanations': 'a'
            }, {
                'difficulty': 'Hard',
                'explanations': 'a'
            }],
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents={
                'explanation': {
                    'content_id': 'content_id',
                    'html': '<b>bold</b>'
                },
                'worked_examples': [],
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'content_id': {}
                    }
                },
                'written_translations': {
                    'translations_mapping': {
                        'content_id': {}
                    }
                }
            },
            next_misconception_id=2,
            all_questions_merged=False,
            version=1
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        skill_summary_model = self.create_model(
            skill_models.SkillSummaryModel,
            id=self.SKILL_1_ID,
            description='description',
            misconception_count=0,
            worked_examples_count=0,
            language_code='cs',
            skill_model_last_updated=skill_model.last_updated,
            skill_model_created_on=skill_model.created_on,
            version=1
        )
        skill_summary_model.update_timestamps()
        skill_summary_model.put()

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='CACHE DELETION SUCCESS: 1')
        ])
