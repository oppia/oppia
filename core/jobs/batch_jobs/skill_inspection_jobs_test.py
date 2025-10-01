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
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import skill_inspection_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.Names.SKILL])

datastore_services = models.Registry.import_datastore_services()


class CountHangingPrerequisiteSkillsJobTests(job_test_utils.JobTestBase):
    JOB_CLASS: Type[
        skill_inspection_jobs.CountHangingPrerequisiteSkillsJob
    ] = skill_inspection_jobs.CountHangingPrerequisiteSkillsJob

    SKILL_1_ID: Final = 'skill_id_1'
    SKILL_1_DESC: Final = 'skill_description_1'
    SKILL_2_ID: Final = 'skill_id_2'
    SKILL_2_DESC: Final = 'skill_description_2'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_skill_with_no_prerequisites(self) -> None:
        skill = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description=self.SKILL_1_DESC,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                }
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf
                .CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf
                .CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf
                .CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            all_questions_merged=False,
            prerequisite_skill_ids=[]
        )
        skill.update_timestamps()
        self.put_multi([skill])

        self.assert_job_output_is_empty()

    def test_skill_with_no_hanging_prerequisites(self) -> None:
        prerequisite_skill = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description=self.SKILL_1_DESC,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                }
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf
                .CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf
                .CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf
                .CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            all_questions_merged=False,
            prerequisite_skill_ids=[]
        )
        skill = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_2_ID,
            description=self.SKILL_2_DESC,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                }
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf
                .CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf
                .CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf
                .CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            all_questions_merged=False,
            prerequisite_skill_ids=[self.SKILL_1_ID]
        )
        prerequisite_skill.update_timestamps()
        skill.update_timestamps()
        self.put_multi([prerequisite_skill, skill])

        self.assert_job_output_is_empty()

    def test_skill_with_hanging_prerequisite(self) -> None:
        superseded_skill = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_2_ID,
            description=self.SKILL_2_DESC,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                }
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf
                .CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf
                .CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf
                .CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            all_questions_merged=False,
            superseding_skill_id='superseding-skill'
        )
        skill = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description=self.SKILL_1_DESC,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            misconceptions=[],
            rubrics=[],
            skill_contents={
                'explanation': {
                    'html': 'test explanation',
                    'content_id': 'explanation',
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {}
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {}
                    }
                }
            },
            next_misconception_id=0,
            misconceptions_schema_version=feconf
                .CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            rubric_schema_version=feconf
                .CURRENT_RUBRIC_SCHEMA_VERSION,
            skill_contents_schema_version=feconf
                .CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            all_questions_merged=False,
            prerequisite_skill_ids=['nonexistent_skill', self.SKILL_2_ID]
        )
        superseded_skill.update_timestamps()
        skill.update_timestamps()
        self.put_multi([superseded_skill, skill])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='Skill with ID: nonexistent_skill is referenced as a prerequisite but does not exist' # pylint: disable = line-too-long
            ),
            job_run_result.JobRunResult(
                stdout='Skill with ID: skill_id_2 (Description: skill_description_2) is referenced as a prerequisite but is superseded by skill with ID: superseding-skill' # pylint: disable = line-too-long
            )
        ])
