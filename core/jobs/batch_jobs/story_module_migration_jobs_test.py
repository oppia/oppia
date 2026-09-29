# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for jobs used for migrating the story module related models."""

from __future__ import annotations

import copy
from unittest import mock

from core import feconf
from core.domain import caching_services, story_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import story_module_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Any, Dict, Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models, datastore_services, story_models

(config_models, story_models) = models.Registry.import_models(
    [models.Names.CONFIG, models.Names.STORY]
)

datastore_services = models.Registry.import_datastore_services()


class MigrateStoryModulesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[story_module_migration_jobs.MigrateStoryModulesJob] = (
        story_module_migration_jobs.MigrateStoryModulesJob
    )

    STORY_1_ID: Final = 'story_1_id'
    STORY_2_ID: Final = 'story_2_id'
    STORY_3_ID: Final = 'story_3_id'
    STORY_4_ID: Final = 'story_4_id'
    OLD_FLAG_NAME: Final = 'story_editor_arcs'
    NEW_FLAG_NAME: Final = 'story_editor_modules'

    def setUp(self) -> None:
        super().setUp()
        self.latest_contents: story_domain.StoryContentsDict = {
            'nodes': [
                {
                    'id': 'node_1111',
                    'title': 'title',
                    'description': 'description',
                    'thumbnail_filename': 'thumbnail_filename.svg',
                    'thumbnail_bg_color': '#F8BF74',
                    'thumbnail_size_in_bytes': None,
                    'destination_node_ids': [],
                    'acquired_skill_ids': [],
                    'prerequisite_skill_ids': [],
                    'outline': 'outline',
                    'outline_is_finalized': True,
                    'exploration_id': 'exp_id',
                    'status': None,
                    'planned_publication_date_msecs': None,
                    'last_modified_msecs': None,
                    'first_publication_date_msecs': None,
                    'unpublishing_reason': None,
                }
            ],
            'initial_node_id': 'node_1111',
            'next_node_id': 'node_2222',
            'modules': [
                {
                    # The ID stays 'arc_default': the frozen v6 -> v7
                    # converter mints it, and the v7 -> v8 converter only
                    # renames the container key.
                    'id': 'arc_default',
                    'title': 'All Chapters',
                    'description': '',
                    'node_ids': ['node_1111'],
                }
            ],
        }
        # Here we use type Any because v7 story contents store the chapter
        # groupings under the 'arcs' key, which the v8 StoryContentsDict does
        # not declare, so the dict cannot be typed more precisely.
        self.v7_contents: Dict[str, Any] = {
            'nodes': self.latest_contents['nodes'],
            'initial_node_id': self.latest_contents['initial_node_id'],
            'next_node_id': self.latest_contents['next_node_id'],
            'arcs': self.latest_contents['modules'],
        }

        self.broken_contents = copy.deepcopy(self.latest_contents)
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally
        # test wrong inputs that we can normally catch by typing.
        self.broken_contents['nodes'][0]['description'] = 123  # type: ignore[typeddict-item]

    # Here we use type Any because the story contents can be either v7 or
    # v8, whose keys differ, so the parameter cannot be typed precisely.
    def _put_story_storage_model(
        self, story_id: str, story_contents: Any, schema_version: int
    ) -> None:
        """Puts a StoryModel with the given contents and schema version.

        Args:
            story_id: str. The ID of the story.
            story_contents: dict. The story contents stored on the model.
            schema_version: int. The story contents schema version.
        """
        story_model = self.create_model(
            story_models.StoryModel,
            id=story_id,
            title='title',
            language_code='en',
            notes='notes',
            description='description',
            story_contents_schema_version=schema_version,
            story_contents=story_contents,
            corresponding_topic_id='topic_1_id',
            url_fragment='urlfragment',
        )
        datastore_services.update_timestamps_multi([story_model])
        datastore_services.put_multi([story_model])

    # Here we use type Any because the story contents can be either v7 or
    # v8, whose keys differ, so the parameter cannot be typed precisely.
    def _put_story_snapshot_model(
        self, story_id: str, story_contents: Any, schema_version: int
    ) -> None:
        """Puts a StorySnapshotContentModel with the given contents.

        Args:
            story_id: str. The ID of the story.
            story_contents: dict. The story contents stored on the snapshot.
            schema_version: int. The story contents schema version.
        """
        story_snapshot_model = self.create_model(
            story_models.StorySnapshotContentModel,
            id='%s-1' % story_id,
            content={
                'story_contents_schema_version': schema_version,
                'story_contents': story_contents,
            },
        )
        datastore_services.update_timestamps_multi([story_snapshot_model])
        datastore_services.put_multi([story_snapshot_model])

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_outdated_feature_flag_config_is_migrated(self) -> None:
        config_models.FeatureFlagConfigModel.create(
            self.OLD_FLAG_NAME, True, 50, ['user_group_1']
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE MIGRATED SUCCESS: 1'
                )
            ]
        )

        self.assertIsNone(
            config_models.FeatureFlagConfigModel.get(
                self.OLD_FLAG_NAME, strict=False
            )
        )
        migrated_flag_config = config_models.FeatureFlagConfigModel.get(
            self.NEW_FLAG_NAME, strict=False
        )
        self.assertIsNotNone(migrated_flag_config)
        assert migrated_flag_config is not None
        self.assertTrue(migrated_flag_config.force_enable_for_all_users)
        self.assertEqual(migrated_flag_config.rollout_percentage, 50)
        self.assertEqual(migrated_flag_config.user_group_ids, ['user_group_1'])

    def test_feature_flag_config_with_existing_new_name_is_not_overwritten(
        self,
    ) -> None:
        config_models.FeatureFlagConfigModel.create(
            self.OLD_FLAG_NAME, True, 50, ['user_group_1']
        )
        config_models.FeatureFlagConfigModel.create(
            self.NEW_FLAG_NAME, False, 20, ['user_group_2']
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE MIGRATED SUCCESS: 1'
                )
            ]
        )

        self.assertIsNone(
            config_models.FeatureFlagConfigModel.get(
                self.OLD_FLAG_NAME, strict=False
            )
        )
        # The existing new-name row must keep its own values, since a
        # concurrent flag setup may have rendered it already.
        migrated_flag_config = config_models.FeatureFlagConfigModel.get(
            self.NEW_FLAG_NAME, strict=False
        )
        self.assertIsNotNone(migrated_flag_config)
        assert migrated_flag_config is not None
        self.assertFalse(migrated_flag_config.force_enable_for_all_users)
        self.assertEqual(migrated_flag_config.rollout_percentage, 20)
        self.assertEqual(migrated_flag_config.user_group_ids, ['user_group_2'])

    def test_outdated_story_snapshot_is_migrated(self) -> None:
        self._put_story_storage_model(
            self.STORY_1_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(self.STORY_1_ID, self.v7_contents, 7)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE MIGRATED SUCCESS: 1'
                )
            ]
        )

        migrated_snapshot_model = (
            story_models.StorySnapshotContentModel.get_by_id(
                '%s-1' % self.STORY_1_ID
            )
        )
        assert migrated_snapshot_model is not None
        self.assertEqual(
            migrated_snapshot_model.content['story_contents_schema_version'],
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self.assertIn(
            'modules', migrated_snapshot_model.content['story_contents']
        )
        self.assertNotIn(
            'arcs', migrated_snapshot_model.content['story_contents']
        )
        self.assertEqual(
            migrated_snapshot_model.content['story_contents']['modules'],
            self.v7_contents['arcs'],
        )

    def test_snapshot_is_not_migrated_when_story_is_missing(self) -> None:
        self._put_story_snapshot_model(self.STORY_1_ID, self.v7_contents, 7)
        # Clear the story cache: an earlier test may have cached this story
        # id, which would make get_story_by_id return a stale story.
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE MIGRATED ERROR: "(\'story_1_id\', '
                        'Exception(\'Story does not exist.\'))": 1'
                    )
                )
            ]
        )

    def test_snapshot_is_not_migrated_when_story_is_not_at_latest_schema(
        self,
    ) -> None:
        self._put_story_storage_model(self.STORY_1_ID, self.v7_contents, 7)
        self._put_story_snapshot_model(self.STORY_1_ID, self.v7_contents, 7)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE MIGRATED ERROR: "(\'story_1_id\', '
                        'Exception(\'Story is not at latest schema '
                        'version\'))": 1'
                    )
                )
            ]
        )

    def test_snapshot_at_latest_schema_is_not_migrated(self) -> None:
        self._put_story_storage_model(
            self.STORY_1_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(
            self.STORY_1_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE MIGRATED ERROR: "(\'story_1_id\', '
                        'Exception(\'Snapshot is already at latest schema '
                        'version\'))": 1'
                    )
                )
            ]
        )

    def test_snapshot_is_not_migrated_when_story_fails_validation(self) -> None:
        self._put_story_storage_model(
            self.STORY_1_ID,
            self.broken_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(self.STORY_1_ID, self.v7_contents, 7)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE MIGRATED ERROR: "(\'story_1_id\', '
                        'Exception(\'Story story_1_id failed non-strict '
                        'validation\'))": 1'
                    )
                )
            ]
        )

    def test_snapshot_migration_failure_is_reported(self) -> None:
        self._put_story_storage_model(
            self.STORY_1_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(self.STORY_1_ID, self.v7_contents, 7)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        with mock.patch.object(
            story_domain.Story,
            'update_story_contents_from_model',
            side_effect=Exception('migration failed'),
        ):
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(
                        stderr=(
                            'STORY MODULE MIGRATED ERROR: "(\'story_1_id\', '
                            'Exception(\'Story snapshot story_1_id failed '
                            'migration to story contents v8: migration '
                            'failed\'))": 1'
                        )
                    )
                ]
            )

    def test_commit_log_entry_with_deprecated_arc_cmds_is_rewritten(
        self,
    ) -> None:
        commit_log_model = self.create_model(
            story_models.StoryCommitLogEntryModel,
            id='story-%s-1' % self.STORY_1_ID,
            story_id=self.STORY_1_ID,
            user_id=feconf.SYSTEM_COMMITTER_ID,
            commit_type=feconf.COMMIT_TYPE_CREATE,
            post_commit_status='private',
            commit_cmds=[
                {
                    'cmd': 'create_arc',
                    'title': 'title',
                    'arc_id': 'arc_default',
                },
                {
                    'cmd': 'move_node_to_arc',
                    'node_id': 'node_1111',
                    'from_arc_id': 'arc_1',
                    'to_arc_id': 'arc_default',
                },
            ],
        )
        datastore_services.update_timestamps_multi([commit_log_model])
        datastore_services.put_multi([commit_log_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE MIGRATED SUCCESS: 1'
                )
            ]
        )

        migrated_commit_log_model = (
            story_models.StoryCommitLogEntryModel.get_by_id(
                'story-%s-1' % self.STORY_1_ID
            )
        )
        assert migrated_commit_log_model is not None
        self.assertEqual(
            migrated_commit_log_model.commit_cmds,
            [
                {
                    'cmd': 'create_module',
                    'title': 'title',
                    'module_id': 'arc_default',
                },
                {
                    'cmd': 'move_node_to_module',
                    'node_id': 'node_1111',
                    'from_arc_id': 'arc_1',
                    'to_module_id': 'arc_default',
                },
            ],
        )

    def test_commit_log_entry_with_module_cmds_is_left_unchanged(self) -> None:
        commit_log_model = self.create_model(
            story_models.StoryCommitLogEntryModel,
            id='story-%s-1' % self.STORY_1_ID,
            story_id=self.STORY_1_ID,
            user_id=feconf.SYSTEM_COMMITTER_ID,
            commit_type=feconf.COMMIT_TYPE_CREATE,
            post_commit_status='private',
            commit_cmds=[
                {
                    'cmd': 'create_module',
                    'title': 'title',
                    'module_id': 'arc_default',
                }
            ],
        )
        datastore_services.update_timestamps_multi([commit_log_model])
        datastore_services.put_multi([commit_log_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE MIGRATED SUCCESS: 1'
                )
            ]
        )

        unchanged_commit_log_model = (
            story_models.StoryCommitLogEntryModel.get_by_id(
                'story-%s-1' % self.STORY_1_ID
            )
        )
        assert unchanged_commit_log_model is not None
        self.assertEqual(
            unchanged_commit_log_model.commit_cmds,
            [
                {
                    'cmd': 'create_module',
                    'title': 'title',
                    'module_id': 'arc_default',
                }
            ],
        )


class AuditStoryModulesMigrationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        story_module_migration_jobs.AuditStoryModulesMigrationJob
    ] = story_module_migration_jobs.AuditStoryModulesMigrationJob

    STORY_1_ID: Final = 'story_1_id'
    STORY_2_ID: Final = 'story_2_id'
    STORY_3_ID: Final = 'story_3_id'
    STORY_4_ID: Final = 'story_4_id'
    MISSING_STORY_ID: Final = 'missing_story_id'
    OLD_FLAG_NAME: Final = 'story_editor_arcs'
    NEW_FLAG_NAME: Final = 'story_editor_modules'

    def setUp(self) -> None:
        super().setUp()
        self.latest_contents: story_domain.StoryContentsDict = {
            'nodes': [
                {
                    'id': 'node_1111',
                    'title': 'title',
                    'description': 'description',
                    'thumbnail_filename': 'thumbnail_filename.svg',
                    'thumbnail_bg_color': '#F8BF74',
                    'thumbnail_size_in_bytes': None,
                    'destination_node_ids': [],
                    'acquired_skill_ids': [],
                    'prerequisite_skill_ids': [],
                    'outline': 'outline',
                    'outline_is_finalized': True,
                    'exploration_id': 'exp_id',
                    'status': None,
                    'planned_publication_date_msecs': None,
                    'last_modified_msecs': None,
                    'first_publication_date_msecs': None,
                    'unpublishing_reason': None,
                }
            ],
            'initial_node_id': 'node_1111',
            'next_node_id': 'node_2222',
            'modules': [
                {
                    'id': 'arc_default',
                    'title': 'All Chapters',
                    'description': '',
                    'node_ids': ['node_1111'],
                }
            ],
        }
        # Here we use type Any because v7 story contents store the chapter
        # groupings under the 'arcs' key, which the v8 StoryContentsDict does
        # not declare, so the dict cannot be typed more precisely.
        self.v7_contents: Dict[str, Any] = {
            'nodes': self.latest_contents['nodes'],
            'initial_node_id': self.latest_contents['initial_node_id'],
            'next_node_id': self.latest_contents['next_node_id'],
            'arcs': self.latest_contents['modules'],
        }

        self.broken_contents = copy.deepcopy(self.latest_contents)
        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally
        # test wrong inputs that we can normally catch by typing.
        self.broken_contents['nodes'][0]['description'] = 123  # type: ignore[typeddict-item]

    # Here we use type Any because the story contents can be either v7 or
    # v8, whose keys differ, so the parameter cannot be typed precisely.
    def _put_story_storage_model(
        self, story_id: str, story_contents: Any, schema_version: int
    ) -> None:
        """Puts a StoryModel with the given contents and schema version.

        Args:
            story_id: str. The ID of the story.
            story_contents: dict. The story contents stored on the model.
            schema_version: int. The story contents schema version.
        """
        story_model = self.create_model(
            story_models.StoryModel,
            id=story_id,
            title='title',
            language_code='en',
            notes='notes',
            description='description',
            story_contents_schema_version=schema_version,
            story_contents=story_contents,
            corresponding_topic_id='topic_1_id',
            url_fragment='urlfragment',
        )
        datastore_services.update_timestamps_multi([story_model])
        datastore_services.put_multi([story_model])

    # Here we use type Any because the story contents can be either v7 or
    # v8, whose keys differ, so the parameter cannot be typed precisely.
    def _put_story_snapshot_model(
        self, story_id: str, story_contents: Any, schema_version: int
    ) -> None:
        """Puts a StorySnapshotContentModel with the given contents.

        Args:
            story_id: str. The ID of the story.
            story_contents: dict. The story contents stored on the snapshot.
            schema_version: int. The story contents schema version.
        """
        story_snapshot_model = self.create_model(
            story_models.StorySnapshotContentModel,
            id='%s-1' % story_id,
            content={
                'story_contents_schema_version': schema_version,
                'story_contents': story_contents,
            },
        )
        datastore_services.update_timestamps_multi([story_snapshot_model])
        datastore_services.put_multi([story_snapshot_model])

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_audit_counts_outdated_feature_flag_config(self) -> None:
        config_models.FeatureFlagConfigModel.create(
            self.OLD_FLAG_NAME, True, 50, ['user_group_1']
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE AUDIT SUCCESS: 1'
                )
            ]
        )

        # The audit job must not write to the datastore.
        self.assertIsNotNone(
            config_models.FeatureFlagConfigModel.get(
                self.OLD_FLAG_NAME, strict=False
            )
        )

    def test_audit_migrates_snapshot_in_memory_without_saving(self) -> None:
        self._put_story_storage_model(
            self.STORY_1_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(self.STORY_1_ID, self.v7_contents, 7)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE AUDIT SUCCESS: 1'
                )
            ]
        )

        # The datastore must be untouched by the audit job.
        unchanged_snapshot_model = (
            story_models.StorySnapshotContentModel.get_by_id(
                '%s-1' % self.STORY_1_ID
            )
        )
        assert unchanged_snapshot_model is not None
        self.assertEqual(
            unchanged_snapshot_model.content['story_contents_schema_version'],
            7,
        )
        self.assertIn(
            'arcs', unchanged_snapshot_model.content['story_contents']
        )

    def test_audit_reports_snapshot_migration_errors(self) -> None:
        # A snapshot without a corresponding story.
        self._put_story_snapshot_model(
            self.MISSING_STORY_ID, self.v7_contents, 7
        )
        # A story that is not at the latest schema version.
        self._put_story_storage_model(self.STORY_2_ID, self.v7_contents, 7)
        self._put_story_snapshot_model(self.STORY_2_ID, self.v7_contents, 7)
        # A snapshot that is already at the latest schema version.
        self._put_story_storage_model(
            self.STORY_3_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(
            self.STORY_3_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        # A story that fails validation.
        self._put_story_storage_model(
            self.STORY_4_ID,
            self.broken_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(self.STORY_4_ID, self.v7_contents, 7)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY,
            None,
            [
                self.MISSING_STORY_ID,
                self.STORY_2_ID,
                self.STORY_3_ID,
                self.STORY_4_ID,
            ],
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE AUDIT ERROR: "(\'missing_story_id\', '
                        'Exception(\'Story does not exist.\'))": 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE AUDIT ERROR: "(\'story_2_id\', '
                        'Exception(\'Story is not at latest schema '
                        'version\'))": 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE AUDIT ERROR: "(\'story_3_id\', '
                        'Exception(\'Snapshot is already at latest schema '
                        'version\'))": 1'
                    )
                ),
                job_run_result.JobRunResult(
                    stderr=(
                        'STORY MODULE AUDIT ERROR: "(\'story_4_id\', '
                        'Exception(\'Story story_4_id failed non-strict '
                        'validation\'))": 1'
                    )
                ),
            ]
        )

    def test_audit_reports_snapshot_migration_failure(self) -> None:
        self._put_story_storage_model(
            self.STORY_1_ID,
            self.latest_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )
        self._put_story_snapshot_model(self.STORY_1_ID, self.v7_contents, 7)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_STORY, None, [self.STORY_1_ID]
        )

        with mock.patch.object(
            story_domain.Story,
            'update_story_contents_from_model',
            side_effect=Exception('migration failed'),
        ):
            self.assert_job_output_is(
                [
                    job_run_result.JobRunResult(
                        stderr=(
                            'STORY MODULE AUDIT ERROR: "(\'story_1_id\', '
                            'Exception(\'Story snapshot story_1_id failed '
                            'migration to story contents v8: migration '
                            'failed\'))": 1'
                        )
                    )
                ]
            )

    def test_audit_counts_commit_log_entries_without_modifying_them(
        self,
    ) -> None:
        legacy_commit_log_model = self.create_model(
            story_models.StoryCommitLogEntryModel,
            id='story-%s-1' % self.STORY_1_ID,
            story_id=self.STORY_1_ID,
            user_id=feconf.SYSTEM_COMMITTER_ID,
            commit_type=feconf.COMMIT_TYPE_CREATE,
            post_commit_status='private',
            commit_cmds=[
                {
                    'cmd': 'create_arc',
                    'title': 'title',
                    'arc_id': 'arc_default',
                }
            ],
        )
        module_commit_log_model = self.create_model(
            story_models.StoryCommitLogEntryModel,
            id='story-%s-1' % self.STORY_2_ID,
            story_id=self.STORY_2_ID,
            user_id=feconf.SYSTEM_COMMITTER_ID,
            commit_type=feconf.COMMIT_TYPE_CREATE,
            post_commit_status='private',
            commit_cmds=[
                {
                    'cmd': 'create_module',
                    'title': 'title',
                    'module_id': 'arc_default',
                }
            ],
        )
        datastore_services.update_timestamps_multi(
            [legacy_commit_log_model, module_commit_log_model]
        )
        datastore_services.put_multi(
            [legacy_commit_log_model, module_commit_log_model]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='STORY MODULE AUDIT SUCCESS: 2'
                )
            ]
        )

        # The audit job must not rewrite the deprecated commands.
        unchanged_legacy_model = (
            story_models.StoryCommitLogEntryModel.get_by_id(
                'story-%s-1' % self.STORY_1_ID
            )
        )
        assert unchanged_legacy_model is not None
        self.assertEqual(
            unchanged_legacy_model.commit_cmds,
            [
                {
                    'cmd': 'create_arc',
                    'title': 'title',
                    'arc_id': 'arc_default',
                }
            ],
        )
