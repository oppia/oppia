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
from core.domain import subtopic_page_domain
from core.domain import topic_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import subtopic_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type
from typing_extensions import Final

MYPY = True
if MYPY:
    from mypy_imports import subtopic_models

(topic_model,) = models.Registry.import_models([models.Names.SUBTOPIC])


class MigrateSubtopicPageJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        subtopic_migration_jobs.MigrateSubtopicPageJob
    ] = subtopic_migration_jobs.MigrateSubtopicPageJob

    TOPIC_1_ID: Final = 'topic_1_id'
    SUBTOPIC_1_ID: Final = 'subtopic_1_id'
    SUBTOPIC_2_ID: Final = 'subtopic_2_id'
    subtopic_id = 1

    def setUp(self) -> None:
        super().setUp()
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.TOPIC_1_ID))

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_subtopic_with_unmigrated_prop_is_migrated(
        self
    ) -> None:
        unmigrated_subtopic_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_1_ID,
            topic_id=self.TOPIC_1_ID,
            page_contents=self.subtopic_page.page_contents.to_dict(),
            page_contents_schema_version=3,
            language_code='cs',
            version=1
        )
        unmigrated_subtopic_model.update_timestamps()
        unmigrated_subtopic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUBTOPIC PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='SUBTOPIC MIGRATED SUCCESS: 1')
        ])

        migrated_subtopic_model = subtopic_models.SubtopicPageModel.get(
            self.SUBTOPIC_1_ID
        )
        self.assertEqual(
            migrated_subtopic_model.page_contents_schema_version,
            feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION)

    def test_broken_subtopic_leads_to_no_migration(self) -> None:
        first_unmigrated_subtopic_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_1_ID,
            topic_id=self.TOPIC_1_ID,
            page_contents=self.subtopic_page.page_contents.to_dict(),
            page_contents_schema_version=4,
            language_code='abc',
        )
        first_unmigrated_subtopic_model.update_timestamps()
        first_unmigrated_subtopic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_subtopic_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_2_ID,
            topic_id=self.TOPIC_1_ID,
            page_contents=self.subtopic_page.page_contents.to_dict(),
            page_contents_schema_version=3,
            language_code='en',
        )
        second_unmigrated_subtopic_model.update_timestamps()
        second_unmigrated_subtopic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'SUBTOPIC PROCESSED ERROR: "(\'subtopic_1_id\', '
                    'ValidationError(\'Invalid language code: abc\''
                    '))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='SUBTOPIC PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_model = subtopic_models.SubtopicPageModel.get(
            self.SUBTOPIC_1_ID)
        self.assertEqual(first_migrated_model.version, 1)

        second_migrated_model = subtopic_models.SubtopicPageModel.get(
            self.SUBTOPIC_2_ID)
        self.assertEqual(second_migrated_model.version, 1)

    def test_migrated_subtopic_is_not_migrated(self) -> None:
        unmigrated_subtopic_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_1_ID,
            topic_id=self.TOPIC_1_ID,
            page_contents=self.subtopic_page.page_contents.to_dict(),
            page_contents_schema_version=(
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION
            ),
            language_code='en',
        )
        unmigrated_subtopic_model.update_timestamps()
        unmigrated_subtopic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUBTOPIC PROCESSED SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='SUBTOPIC PREVIOUSLY MIGRATED SUCCESS: 1'
            ),
        ])

        migrated_subtopic_model = subtopic_models.SubtopicPageModel.get(
            self.SUBTOPIC_1_ID)
        self.assertEqual(migrated_subtopic_model.version, 1)


class AuditSubtopicMigrationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        subtopic_migration_jobs.AuditSubtopicMigrationJob
    ] = subtopic_migration_jobs.AuditSubtopicMigrationJob

    TOPIC_1_ID: Final = 'topic_1_id'
    SUBTOPIC_1_ID: Final = 'subtopic_1_id'
    SUBTOPIC_2_ID: Final = 'subtopic_2_id'
    subtopic_id = 1

    def setUp(self) -> None:
        super().setUp()
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.TOPIC_1_ID))

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_broken_subtopic_leads_to_no_migration(self) -> None:
        first_unmigrated_subtopic_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_1_ID,
            topic_id=self.TOPIC_1_ID,
            page_contents=self.subtopic_page.page_contents.to_dict(),
            page_contents_schema_version=4,
            language_code='abc',
        )
        first_unmigrated_subtopic_model.update_timestamps()
        first_unmigrated_subtopic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_subtopic_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_2_ID,
            topic_id=self.TOPIC_1_ID,
            page_contents=self.subtopic_page.page_contents.to_dict(),
            page_contents_schema_version=3,
            language_code='en',
        )
        second_unmigrated_subtopic_model.update_timestamps()
        second_unmigrated_subtopic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'SUBTOPIC PROCESSED ERROR: "(\'subtopic_1_id\', '
                    'ValidationError(\'Invalid language code: abc\''
                    '))": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='SUBTOPIC PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_model = subtopic_models.SubtopicPageModel.get(
            self.SUBTOPIC_1_ID)
        self.assertEqual(first_migrated_model.version, 1)

        second_migrated_model = subtopic_models.SubtopicPageModel.get(
            self.SUBTOPIC_2_ID)
        self.assertEqual(second_migrated_model.version, 1)

    def test_migrated_subtopic_is_not_migrated(self) -> None:
        unmigrated_subtopic_model = self.create_model(
            subtopic_models.SubtopicPageModel,
            id=self.SUBTOPIC_1_ID,
            topic_id=self.TOPIC_1_ID,
            page_contents=self.subtopic_page.page_contents.to_dict(),
            page_contents_schema_version=(
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION
            ),
            language_code='en',
        )
        unmigrated_subtopic_model.update_timestamps()
        unmigrated_subtopic_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create subtopic',
            [{'cmd': topic_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUBTOPIC PROCESSED SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='SUBTOPIC PREVIOUSLY MIGRATED SUCCESS: 1'
            ),
        ])

        migrated_subtopic_model = subtopic_models.SubtopicPageModel.get(
            self.SUBTOPIC_1_ID)
        self.assertEqual(migrated_subtopic_model.version, 1)
