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

from __future__ import annotations

import datetime

from core import feconf
from core.domain import skill_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import skill_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.Names.SKILL])


class MigrateSkillJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        skill_migration_jobs.MigrateSkillJob
    ] = skill_migration_jobs.MigrateSkillJob

    SKILL_1_ID: Final = 'skill_1'
    SKILL_2_ID: Final = 'skill_2'

    def setUp(self) -> None:
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
        self.latest_skill_contents = {
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
        self.latest_rubrics = [{
            'difficulty': 'Easy',
            'explanations': ['ab']
        }, {
            'difficulty': 'Medium',
            'explanations': ['a b']
        }, {
            'difficulty': 'Hard',
            'explanations': ['a b']
        }]
        self.latest_misconceptions = [{
            'id': 1,
            'name': 'misconception_name',
            'notes': 'notenote ',
            'feedback': 'feedbackfeedback ',
            'must_be_addressed': False
        }]

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_skill_with_unmigrated_rubric_is_migrated(self) -> None:
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
                'difficulty': 'Medium',
                'explanations': ['a&nbsp;b']
            }, {
                'difficulty': 'Hard',
                'explanations': ['a&nbsp;b']
            }],
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.latest_skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 2)
        self.assertEqual(
            migrated_skill_model.rubric_schema_version,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION)
        self.assertEqual(migrated_skill_model.rubrics, self.latest_rubrics)

    def test_unmigrated_skill_with_unmigrated_misconceptions_is_migrated(
        self
    ) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=4,
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.latest_skill_contents,
            misconceptions=[{
                'id': 1,
                'name': 'misconception_name',
                'notes': 'note\nnote&nbsp;',
                'feedback': 'feedback\nfeedback&nbsp;',
                'must_be_addressed': False
            }],
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 2)
        self.assertEqual(
            migrated_skill_model.misconceptions_schema_version,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)
        self.assertEqual(
            migrated_skill_model.misconceptions,
            self.latest_misconceptions
        )

    def test_unmigrated_skill_with_unmigrated_skill_contents_is_migrated(
        self
    ) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=3,
            skill_contents={
                'explanation': {
                    'content_id': 'content_id',
                    'html': '<b>bo&nbsp;ld\n</b>'
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
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 2)
        self.assertEqual(
            migrated_skill_model.skill_contents_schema_version,
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)
        self.assertEqual(
            migrated_skill_model.skill_contents,
            self.latest_skill_contents
        )

    def test_skill_summary_of_unmigrated_skill_is_updated(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=3,
            skill_contents={
                'explanation': {
                    'content_id': 'content_id',
                    'html': '<b>bo&nbsp;ld\n</b>'
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
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_summary_model = skill_models.SkillSummaryModel.get(
            self.SKILL_1_ID)
        self.assertEqual(migrated_skill_summary_model.version, 2)

    def test_broken_skill_is_not_migrated(self) -> None:
        skill_model_one = self.create_model(
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
            skill_contents=self.latest_skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model_one.update_timestamps()
        skill_model_one.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        skill_model_two = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_2_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=4,
            rubrics=[{
                'difficulty': 'Easy',
                'explanations': ['a\nb']
            }, {
                'difficulty': 'Medium',
                'explanations': ['a&nbsp;b']
            }, {
                'difficulty': 'Hard',
                'explanations': ['a&nbsp;b']
            }],
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.latest_skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model_two.update_timestamps()
        skill_model_two.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'SKILL PROCESSED ERROR: "(\'skill_1\', ''ValidationError('
                    '\'Invalid difficulty received for rubric: aaa\'))": 1'
                )
            ),
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
        ])

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 1)
        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_2_ID)
        self.assertEqual(migrated_skill_model.version, 1)

    def test_migrated_skill_is_not_migrated(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.latest_skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='SKILL PREVIOUSLY MIGRATED SUCCESS: 1')
        ])

        unmigrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(unmigrated_skill_model.version, 1)


class AuditSkillMigrationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        skill_migration_jobs.AuditSkillMigrationJob
    ] = skill_migration_jobs.AuditSkillMigrationJob

    SKILL_1_ID: Final = 'skill_1'

    def setUp(self) -> None:
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
        self.latest_skill_contents = {
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
        self.latest_rubrics = [{
            'difficulty': 'Easy',
            'explanations': ['ab']
        }, {
            'difficulty': 'Medium',
            'explanations': ['a b']
        }, {
            'difficulty': 'Hard',
            'explanations': ['a b']
        }]
        self.latest_misconceptions = [{
            'id': 1,
            'name': 'misconception_name',
            'notes': 'notenote ',
            'feedback': 'feedbackfeedback ',
            'must_be_addressed': False
        }]

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_skill_with_unmigrated_rubric_is_migrated(self) -> None:
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
                'difficulty': 'Medium',
                'explanations': ['a&nbsp;b']
            }, {
                'difficulty': 'Hard',
                'explanations': ['a&nbsp;b']
            }],
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.latest_skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 1)

    def test_unmigrated_skill_with_unmigrated_misconceptions_is_migrated(
        self
    ) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=4,
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.latest_skill_contents,
            misconceptions=[{
                'id': 1,
                'name': 'misconception_name',
                'notes': 'note\nnote&nbsp;',
                'feedback': 'feedback\nfeedback&nbsp;',
                'must_be_addressed': False
            }],
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 1)

    def test_unmigrated_skill_with_unmigrated_skill_contents_is_migrated(
        self
    ) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=3,
            skill_contents={
                'explanation': {
                    'content_id': 'content_id',
                    'html': '<b>bo&nbsp;ld\n</b>'
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
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 1)

    def test_skill_summary_of_unmigrated_skill_is_updated(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=3,
            skill_contents={
                'explanation': {
                    'content_id': 'content_id',
                    'html': '<b>bo&nbsp;ld\n</b>'
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
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='SKILL MIGRATED SUCCESS: 1'),
        ])

        migrated_skill_summary_model = skill_models.SkillSummaryModel.get(
            self.SKILL_1_ID)
        self.assertEqual(migrated_skill_summary_model.version, 1)

    def test_broken_skill_is_not_migrated(self) -> None:
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
            skill_contents=self.latest_skill_contents,
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

        migrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(migrated_skill_model.version, 1)

    def test_migrated_skill_is_not_migrated(self) -> None:
        skill_model = self.create_model(
            skill_models.SkillModel,
            id=self.SKILL_1_ID,
            description='description',
            misconceptions_schema_version=(
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION),
            rubric_schema_version=feconf.CURRENT_RUBRIC_SCHEMA_VERSION,
            rubrics=self.latest_rubrics,
            language_code='cs',
            skill_contents_schema_version=(
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION),
            skill_contents=self.latest_skill_contents,
            next_misconception_id=2,
            all_questions_merged=False
        )
        skill_model.update_timestamps()
        skill_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create skill', [{
            'cmd': skill_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SKILL PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='SKILL PREVIOUSLY MIGRATED SUCCESS: 1')
        ])

        unmigrated_skill_model = skill_models.SkillModel.get(self.SKILL_1_ID)
        self.assertEqual(unmigrated_skill_model.version, 1)
