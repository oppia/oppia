# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.subtopic_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import study_guide_domain
from core.domain import topic_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import subtopic_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = True
if MYPY:
    from mypy_imports import subtopic_models

(topic_model,) = models.Registry.import_models([models.Names.SUBTOPIC])


class MigrateStudyGuideJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        subtopic_migration_jobs.MigrateStudyGuideJob
    ] = subtopic_migration_jobs.MigrateStudyGuideJob

    TOPIC_1_ID: Final = 'topic_1_id'
    STUDY_GUIDE_1_ID: Final = 'study_guide_1_id'
    STUDY_GUIDE_2_ID: Final = 'study_guide_2_id'
    subtopic_id = 1

    def setUp(self) -> None:
        super().setUp()
        self.study_guide = (
            study_guide_domain.StudyGuide.create_study_guide(
                self.subtopic_id, self.TOPIC_1_ID,
                'Heading 1', '<p>Content 1</p>'))

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_study_guide_with_unmigrated_prop_is_migrated(
        self
    ) -> None:
        unmigrated_study_guide_model = self.create_model(
            subtopic_models.StudyGuideModel,
            id=self.STUDY_GUIDE_1_ID,
            topic_id=self.TOPIC_1_ID,
            sections=[self.study_guide.sections[0].to_dict()],
            sections_schema_version=1,
            language_code='cs',
            version=1
        )
        unmigrated_study_guide_model.update_timestamps()
        unmigrated_study_guide_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create study guide',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PROCESSED SUCCESS: 1'),
            # Remove 'PREVIOUSLY' from the string once
            # sections_schema_versions v2 and further are available.
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PREVIOUSLY MIGRATED SUCCESS: 1')
        ])

        migrated_study_guide_model = subtopic_models.StudyGuideModel.get(
            self.STUDY_GUIDE_1_ID
        )
        self.assertEqual(
            migrated_study_guide_model.sections_schema_version,
            feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION)

    def test_broken_study_guide_leads_to_no_migration(self) -> None:
        first_unmigrated_study_guide_model = self.create_model(
            subtopic_models.StudyGuideModel,
            id=self.STUDY_GUIDE_1_ID,
            topic_id=self.TOPIC_1_ID,
            sections=[self.study_guide.sections[0].to_dict()],
            sections_schema_version=1,
            language_code='abc',
        )
        first_unmigrated_study_guide_model.update_timestamps()
        first_unmigrated_study_guide_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_study_guide_model = self.create_model(
            subtopic_models.StudyGuideModel,
            id=self.STUDY_GUIDE_2_ID,
            topic_id=self.TOPIC_1_ID,
            sections=[self.study_guide.sections[0].to_dict()],
            sections_schema_version=1,
            language_code='en',
        )
        second_unmigrated_study_guide_model.update_timestamps()
        second_unmigrated_study_guide_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'STUDY GUIDE PROCESSED ERROR: "(\'study_guide_1_id\', '
                    'ValidationError(\'Invalid language code: abc\''
                    '))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_model = subtopic_models.StudyGuideModel.get(
            self.STUDY_GUIDE_1_ID)
        self.assertEqual(first_migrated_model.version, 1)

        second_migrated_model = subtopic_models.StudyGuideModel.get(
            self.STUDY_GUIDE_2_ID)
        self.assertEqual(second_migrated_model.version, 1)

    def test_migrated_study_guide_is_not_migrated(self) -> None:
        unmigrated_study_guide_model = self.create_model(
            subtopic_models.StudyGuideModel,
            id=self.STUDY_GUIDE_1_ID,
            topic_id=self.TOPIC_1_ID,
            sections=[self.study_guide.sections[0].to_dict()],
            sections_schema_version=(
                feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION
            ),
            language_code='en',
        )
        unmigrated_study_guide_model.update_timestamps()
        unmigrated_study_guide_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PROCESSED SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PREVIOUSLY MIGRATED SUCCESS: 1'
            ),
        ])

        migrated_study_guide_model = subtopic_models.StudyGuideModel.get(
            self.STUDY_GUIDE_1_ID)
        self.assertEqual(migrated_study_guide_model.version, 1)


class AuditStudyGuideMigrationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        subtopic_migration_jobs.AuditStudyGuideMigrationJob
    ] = subtopic_migration_jobs.AuditStudyGuideMigrationJob

    TOPIC_1_ID: Final = 'topic_1_id'
    STUDY_GUIDE_2_ID: Final = 'study_guide_2_id'
    STUDY_GUIDE_1_ID: Final = 'study_guide_1_id'
    subtopic_id = 1

    def setUp(self) -> None:
        super().setUp()
        self.study_guide = (
            study_guide_domain.StudyGuide.create_study_guide(
                self.subtopic_id, self.TOPIC_1_ID,
                'Heading 1', '<p>Content 1</p>'))

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_broken_study_guide_leads_to_no_migration(self) -> None:
        first_unmigrated_study_guide_model = self.create_model(
            subtopic_models.StudyGuideModel,
            id=self.STUDY_GUIDE_1_ID,
            topic_id=self.TOPIC_1_ID,
            sections=[self.study_guide.sections[0].to_dict()],
            sections_schema_version=1,
            language_code='abc',
        )
        first_unmigrated_study_guide_model.update_timestamps()
        first_unmigrated_study_guide_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_study_guide_model = self.create_model(
            subtopic_models.StudyGuideModel,
            id=self.STUDY_GUIDE_2_ID,
            topic_id=self.TOPIC_1_ID,
            sections=[self.study_guide.sections[0].to_dict()],
            sections_schema_version=1,
            language_code='en',
        )
        second_unmigrated_study_guide_model.update_timestamps()
        second_unmigrated_study_guide_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'STUDY GUIDE PROCESSED ERROR: "(\'study_guide_1_id\', '
                    'ValidationError(\'Invalid language code: abc\''
                    '))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_model = subtopic_models.StudyGuideModel.get(
            self.STUDY_GUIDE_1_ID)
        self.assertEqual(first_migrated_model.version, 1)

        second_migrated_model = subtopic_models.StudyGuideModel.get(
            self.STUDY_GUIDE_2_ID)
        self.assertEqual(second_migrated_model.version, 1)

    def test_migrated_study_guide_is_not_migrated(self) -> None:
        unmigrated_study_guide_model = self.create_model(
            subtopic_models.StudyGuideModel,
            id=self.STUDY_GUIDE_1_ID,
            topic_id=self.TOPIC_1_ID,
            sections=[self.study_guide.sections[0].to_dict()],
            sections_schema_version=(
                feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION
            ),
            language_code='en',
        )
        unmigrated_study_guide_model.update_timestamps()
        unmigrated_study_guide_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PROCESSED SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='STUDY GUIDE PREVIOUSLY MIGRATED SUCCESS: 1'
            ),
        ])

        migrated_study_guide_model = subtopic_models.StudyGuideModel.get(
            self.STUDY_GUIDE_1_ID)
        self.assertEqual(migrated_study_guide_model.version, 1)
