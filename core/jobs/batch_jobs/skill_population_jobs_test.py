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

"""Unit tests for jobs.batch_jobs.skill_population_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import caching_services
from core.domain import skill_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import skill_population_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class PopulateSkillWithAndroidProtoSizeInBytesJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        skill_population_jobs.PopulateSkillWithAndroidProtoSizeInBytesJob)

    SKILL_1_ID = 'skill_1'

    def setUp(self):
        super().setUp()
        skill_summary_model = self.create_model(
            skill_models.SkillSummaryModel,
            id=self.SKILL_1_ID,
            description='description',
            misconception_count=0,
            worked_examples_count=0,
            language_code='cs',
            skill_model_last_updated=datetime.datetime.utcnow(),
            skill_model_created_on=datetime.datetime.utcnow(),
            version=1
        )
        skill_summary_model.update_timestamps()
        skill_summary_model.put()

        self.rubrics = [{
            'difficulty': 'Easy',
            'explanations': ['a\nb']
        }, {
            'difficulty': 'Medium',
            'explanations': ['a&nbsp;b']
        }, {
            'difficulty': 'Hard',
            'explanations': ['a&nbsp;b']
        }]
        self.skill_contents = {
            'explanation': {
                'content_id': 'content_id',
                'html': '<b>bo ld</b>'
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
        }

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_populate_skill_with_android_proto_size_in_bytes(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=4,
            rubrics=self.rubrics,
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='SKILL POPULATED WITH android_proto_size_in_bytes'
                ' SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='CACHE DELETION SUCCESS: 1')
        ])

        populated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(populated_skill_model.version, 2)
        self.assertEqual(
            populated_skill_model.android_proto_size_in_bytes, 56)

    def test_broken_cache_is_reported(self) -> None:
        cache_swap = self.swap_to_always_raise(
            caching_services, 'delete_multi', Exception('cache deletion error'))

        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=4,
            rubrics=self.rubrics,
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        with cache_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                     stdout='SKILL POPULATED WITH android_proto_size_in_bytes'
                     ' SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='SKILL PROCESSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='CACHE DELETION ERROR: "cache deletion error": 1'
                )
            ])

        populated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(populated_skill_model.version, 2)

    def test_broken_skill_is_not_populated(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=4,
            rubrics=[{
                'difficulty': 'Easy',
                'explanations': ['a\nb']
            }, {
                'difficulty': 'aaa',
                'explanations': ['a&nbsp;b']
            }, {
                'difficulty': 'Hard',
                'explanations': ['a&nbsp;b']
            }],
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'SKILL PROCESSED ERROR: "(\'skill_1\', ''ValidationError('
                    '\'Invalid difficulty received for rubric: aaa\'))": 1'
                )
            )
        ])

        populated_skill_model_skill_model = skill_models.SkillModel.get(
            self.SKILL_1_ID)
        self.assertEqual(populated_skill_model_skill_model.version, 1)

    def test_populated_skill_is_not_populated(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.rubrics,
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.skill_contents,
            next_misconception_id=2,
            all_questions_merged=False,
            android_proto_size_in_bytes=56
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1')
        ])

        unpopulated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(unpopulated_skill_model.version, 1)
        self.assertEqual(
            unpopulated_skill_model.android_proto_size_in_bytes, 56)
