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

"""Jobs used for migrating the story module related models."""

from __future__ import annotations

import logging

from core import feature_flag_list, feconf
from core.domain import story_domain, story_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Any, Dict, Final, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models, datastore_services, story_models

(config_models, story_models) = models.Registry.import_models(
    [models.Names.CONFIG, models.Names.STORY]
)

datastore_services = models.Registry.import_datastore_services()

# The name under which the story editor modules feature flag was stored
# before the arc-to-module rename.
OLD_STORY_EDITOR_MODULES_FLAG_NAME: Final = 'story_editor_arcs'

# Maps the deprecated arc-named story commands to their module-named
# equivalents, so that legacy commit log entries can be rewritten.
LEGACY_ARC_COMMANDS_TO_MODULE_COMMANDS: Dict[str, str] = {
    'create_arc': story_domain.CMD_CREATE_MODULE,
    'delete_arc': story_domain.CMD_DELETE_MODULE,
    'rename_arc': story_domain.CMD_RENAME_MODULE,
    'rearrange_arcs': story_domain.CMD_REARRANGE_MODULES,
    'move_node_to_arc': story_domain.CMD_MOVE_NODE_TO_MODULE,
    'update_arc_property': story_domain.CMD_UPDATE_MODULE_PROPERTY,
}

# Maps the deprecated arc-named attributes of story commit commands to their
# module-named equivalents.
LEGACY_ARC_ATTRIBUTES_TO_MODULE_ATTRIBUTES: Dict[str, str] = {
    'arc_id': 'module_id',
    'to_arc_id': 'to_module_id',
    'arc_ids_order': 'module_ids_order',
}


# Here we use type Any because the commit command dicts may contain
# arbitrary attribute values that are not declared as a TypedDict.
def _rewrite_commit_cmd(commit_cmd: Dict[str, Any]) -> Dict[str, Any]:
    """Rewrites a single commit command dict to use module-named commands
    and attributes instead of the deprecated arc-named ones.

    Args:
        commit_cmd: dict. The commit command dict to rewrite.

    Returns:
        dict. The rewritten commit command dict.
    """
    # Here we use type Any because the rewritten command dict keeps the
    # arbitrary attribute values of the original command.
    new_commit_cmd: Dict[str, Any] = {}
    for attribute_name, attribute_value in commit_cmd.items():
        new_attribute_name = LEGACY_ARC_ATTRIBUTES_TO_MODULE_ATTRIBUTES.get(
            attribute_name, attribute_name
        )
        new_commit_cmd[new_attribute_name] = attribute_value

    cmd_name = commit_cmd.get('cmd')
    if cmd_name in LEGACY_ARC_COMMANDS_TO_MODULE_COMMANDS:
        new_commit_cmd['cmd'] = LEGACY_ARC_COMMANDS_TO_MODULE_COMMANDS[cmd_name]
    return new_commit_cmd


class MigrateStoryModulesJob(base_jobs.JobBase):
    """Job that migrates the story module related models.

    This job performs three kinds of migration:
    1. Renames the FeatureFlagConfigModel id for the story editor modules
       feature flag from the deprecated 'story_editor_arcs' value to
       'story_editor_modules'.
    2. Migrates StorySnapshotContentModel objects to the latest story
       contents schema version.
    3. Rewrites the deprecated arc-named commit commands stored in
       StoryCommitLogEntryModel objects to their module-named equivalents.
    """

    @staticmethod
    def _migrate_feature_flag_config_model(
        feature_flag_config_model: config_models.FeatureFlagConfigModel,
    ) -> result.Result[Tuple[str, str], Tuple[str, Exception]]:
        """Migrates the id of a FeatureFlagConfigModel for the story editor
        modules feature flag.

        Args:
            feature_flag_config_model: FeatureFlagConfigModel. The feature
                flag config model to migrate.

        Returns:
            Result((str, str), (str, Exception)). Result containing tuple that
            consists of the feature flag name and 'SUCCESS' if the migration
            succeeded, or an Exception otherwise.
        """
        new_feature_flag_name = (
            feature_flag_list.FeatureNames.STORY_EDITOR_MODULES.value
        )
        with datastore_services.get_ndb_context():
            new_feature_flag_config_model = (
                config_models.FeatureFlagConfigModel.get(
                    new_feature_flag_name, strict=False
                )
            )
            if new_feature_flag_config_model is None:
                config_models.FeatureFlagConfigModel.create(
                    new_feature_flag_name,
                    feature_flag_config_model.force_enable_for_all_users,
                    feature_flag_config_model.rollout_percentage,
                    feature_flag_config_model.user_group_ids,
                )
            feature_flag_config_model.key.delete()

        return result.Ok((new_feature_flag_name, 'SUCCESS'))

    @staticmethod
    def _migrate_story_snapshot_content_model(
        story_id: str,
        story_snapshot_model: story_models.StorySnapshotContentModel,
    ) -> result.Result[Tuple[str, str], Tuple[str, Exception]]:
        """Migrates the story contents of a snapshot content model to the
        latest schema version and saves it in the datastore.

        Args:
            story_id: str. The ID of the story.
            story_snapshot_model: StorySnapshotContentModel. The snapshot
                content model to migrate.

        Returns:
            Result((str, str), (str, Exception)). Result containing tuple that
            consists of the story ID and 'SUCCESS' if the migration succeeded,
            or an Exception otherwise.
        """
        with datastore_services.get_ndb_context():
            latest_story = story_fetchers.get_story_by_id(
                story_id, strict=False
            )
            if latest_story is None:
                return result.Err(
                    (story_id, Exception('Story does not exist.'))
                )

            story_model = story_models.StoryModel.get(story_id)
            if (
                story_model.story_contents_schema_version
                != feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
            ):
                return result.Err(
                    (
                        story_id,
                        Exception('Story is not at latest schema version'),
                    )
                )

        try:
            latest_story.validate()
        except Exception:
            return result.Err(
                (
                    story_id,
                    Exception(
                        'Story %s failed non-strict validation' % story_id
                    ),
                )
            )

        target_story_contents_schema_version = (
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
        )
        current_story_contents_schema_version = story_snapshot_model.content[
            'story_contents_schema_version'
        ]
        if (
            current_story_contents_schema_version
            == target_story_contents_schema_version
        ):
            return result.Err(
                (
                    story_id,
                    Exception('Snapshot is already at latest schema version'),
                )
            )

        versioned_story_contents: story_domain.VersionedStoryContentsDict = {
            'schema_version': current_story_contents_schema_version,
            'story_contents': story_snapshot_model.content['story_contents'],
        }
        while (
            current_story_contents_schema_version
            < target_story_contents_schema_version
        ):
            try:
                with datastore_services.get_ndb_context():
                    story_domain.Story.update_story_contents_from_model(
                        versioned_story_contents,
                        current_story_contents_schema_version,
                        story_id,
                    )
                current_story_contents_schema_version += 1
            except Exception as e:
                error_message = (
                    'Story snapshot %s failed migration to story contents '
                    'v%s: %s'
                    % (story_id, current_story_contents_schema_version + 1, e)
                )
                logging.exception(error_message)
                return result.Err((story_id, Exception(error_message)))

        story_snapshot_model.content['story_contents'] = (
            versioned_story_contents['story_contents']
        )
        story_snapshot_model.content['story_contents_schema_version'] = (
            current_story_contents_schema_version
        )
        with datastore_services.get_ndb_context():
            story_snapshot_model.update_timestamps(
                update_last_updated_time=False
            )
            story_snapshot_model.put()

        return result.Ok((story_id, 'SUCCESS'))

    @staticmethod
    def _migrate_story_commit_log_entry(
        story_commit_log_entry_model: story_models.StoryCommitLogEntryModel,
    ) -> result.Result[Tuple[str, str], Tuple[str, Exception]]:
        """Migrates the commit commands of a story commit log entry.

        Rewrites any deprecated arc-named commit commands to their
        module-named equivalents and saves the entry in the datastore if it
        was changed.

        Args:
            story_commit_log_entry_model: StoryCommitLogEntryModel. The
                commit log entry to migrate.

        Returns:
            Result((str, str), (str, Exception)). Result containing tuple that
            consists of the commit log entry id and 'SUCCESS'.
        """
        new_commit_cmds = [
            _rewrite_commit_cmd(commit_cmd)
            for commit_cmd in story_commit_log_entry_model.commit_cmds
        ]
        if new_commit_cmds != story_commit_log_entry_model.commit_cmds:
            story_commit_log_entry_model.commit_cmds = new_commit_cmds
            with datastore_services.get_ndb_context():
                story_commit_log_entry_model.update_timestamps(
                    update_last_updated_time=False
                )
                story_commit_log_entry_model.put()

        return result.Ok((story_commit_log_entry_model.id, 'SUCCESS'))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the migration of the story
        module related models.

        Returns:
            PCollection. A PCollection of results from the migration.
        """
        outdated_feature_flag_config_models = (
            self.pipeline
            | 'Get all feature flag config models'
            >> ndb_io.GetModels(
                config_models.FeatureFlagConfigModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter outdated feature flag config models'
            >> beam.Filter(
                lambda model: model.id == OLD_STORY_EDITOR_MODULES_FLAG_NAME
            )
        )

        migrated_feature_flag_config_results = (
            outdated_feature_flag_config_models
            | 'Migrate feature flag config models'
            >> beam.Map(self._migrate_feature_flag_config_model)
        )

        unmigrated_story_snapshot_models = (
            self.pipeline
            | 'Get all story snapshot content models'
            >> ndb_io.GetModels(
                story_models.StorySnapshotContentModel.get_all(
                    include_deleted=False
                )
            )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add story keys'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.get_unversioned_instance_id()
            )
        )

        migrated_story_snapshot_results = (
            unmigrated_story_snapshot_models
            | 'Migrate story snapshot content models'
            >> beam.MapTuple(  # pylint: disable=no-value-for-parameter
                self._migrate_story_snapshot_content_model
            )
        )

        unmigrated_story_commit_log_models = (
            self.pipeline
            | 'Get all story commit log entries'
            >> ndb_io.GetModels(
                story_models.StoryCommitLogEntryModel.get_all(
                    include_deleted=False
                )
            )
        )

        migrated_story_commit_log_results = (
            unmigrated_story_commit_log_models
            | 'Migrate story commit log entries'
            >> beam.Map(self._migrate_story_commit_log_entry)
        )

        all_migration_results = (
            migrated_feature_flag_config_results,
            migrated_story_snapshot_results,
            migrated_story_commit_log_results,
        ) | 'Flatten migration results' >> beam.Flatten()

        migrated_job_run_results = (
            all_migration_results
            | 'Generate results for migration'
            >> job_result_transforms.ResultsToJobRunResults(
                'STORY MODULE MIGRATED'
            )
        )

        return migrated_job_run_results


class AuditStoryModulesMigrationJob(base_jobs.JobBase):
    """Job that audits the migration of the story module related models.

    This job runs every check of MigrateStoryModulesJob without writing to the
    datastore, so that its success guarantees that the migration job will
    succeed without errors.
    """

    @staticmethod
    def _audit_feature_flag_config_model(
        feature_flag_config_model: config_models.FeatureFlagConfigModel,
    ) -> result.Result[Tuple[str, str], Tuple[str, Exception]]:
        """Audits a feature flag config model that uses the deprecated name.

        Args:
            feature_flag_config_model: FeatureFlagConfigModel. The feature
                flag config model to audit.

        Returns:
            Result((str, str), (str, Exception)). Result containing a tuple
            that consists of the deprecated flag name and 'COUNTED' if the
            model needs to be renamed, or an Exception otherwise.
        """
        return result.Ok((feature_flag_config_model.id, 'COUNTED'))

    @staticmethod
    def _audit_story_snapshot_content_model(
        story_id: str,
        story_snapshot_model: story_models.StorySnapshotContentModel,
    ) -> result.Result[Tuple[str, str], Tuple[str, Exception]]:
        """Audits the migration of the story contents of a snapshot content
        model, without saving the result to the datastore.

        Args:
            story_id: str. The ID of the story.
            story_snapshot_model: StorySnapshotContentModel. The snapshot
                content model to audit.

        Returns:
            Result((str, str), (str, Exception)). Result containing tuple that
            consists of the story ID and 'SUCCESS' if the migration succeeded,
            or an Exception otherwise.
        """
        with datastore_services.get_ndb_context():
            latest_story = story_fetchers.get_story_by_id(
                story_id, strict=False
            )
            if latest_story is None:
                return result.Err(
                    (story_id, Exception('Story does not exist.'))
                )

            story_model = story_models.StoryModel.get(story_id)
            if (
                story_model.story_contents_schema_version
                != feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
            ):
                return result.Err(
                    (
                        story_id,
                        Exception('Story is not at latest schema version'),
                    )
                )

        try:
            latest_story.validate()
        except Exception:
            return result.Err(
                (
                    story_id,
                    Exception(
                        'Story %s failed non-strict validation' % story_id
                    ),
                )
            )

        target_story_contents_schema_version = (
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
        )
        current_story_contents_schema_version = story_snapshot_model.content[
            'story_contents_schema_version'
        ]
        if (
            current_story_contents_schema_version
            == target_story_contents_schema_version
        ):
            return result.Err(
                (
                    story_id,
                    Exception('Snapshot is already at latest schema version'),
                )
            )

        versioned_story_contents: story_domain.VersionedStoryContentsDict = {
            'schema_version': current_story_contents_schema_version,
            'story_contents': story_snapshot_model.content['story_contents'],
        }
        while (
            current_story_contents_schema_version
            < target_story_contents_schema_version
        ):
            try:
                with datastore_services.get_ndb_context():
                    story_domain.Story.update_story_contents_from_model(
                        versioned_story_contents,
                        current_story_contents_schema_version,
                        story_id,
                    )
                current_story_contents_schema_version += 1
            except Exception as e:
                error_message = (
                    'Story snapshot %s failed migration to story contents '
                    'v%s: %s'
                    % (story_id, current_story_contents_schema_version + 1, e)
                )
                logging.exception(error_message)
                return result.Err((story_id, Exception(error_message)))

        story_snapshot_model.content['story_contents'] = (
            versioned_story_contents['story_contents']
        )
        story_snapshot_model.content['story_contents_schema_version'] = (
            current_story_contents_schema_version
        )

        return result.Ok((story_id, 'SUCCESS'))

    @staticmethod
    def _audit_story_commit_log_entry(
        story_commit_log_entry_model: story_models.StoryCommitLogEntryModel,
    ) -> result.Result[Tuple[str, str], Tuple[str, Exception]]:
        """Audits a story commit log entry without saving it to the datastore.

        Rewrites the deprecated arc-named commit commands and reports success,
        mirroring the migration job: unlike the snapshot migration, the commit
        command rewrite never produces an error, so the audit only verifies
        that the entry can be read and rewritten.

        Args:
            story_commit_log_entry_model: StoryCommitLogEntryModel. The
                commit log entry to audit.

        Returns:
            Result((str, str), (str, Exception)). Result containing tuple that
            consists of the commit log entry id and 'SUCCESS'.
        """
        for commit_cmd in story_commit_log_entry_model.commit_cmds:
            _rewrite_commit_cmd(commit_cmd)

        return result.Ok((story_commit_log_entry_model.id, 'SUCCESS'))

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of the story module
        related models.

        Returns:
            PCollection. A PCollection of results from the audit.
        """
        outdated_feature_flag_config_models = (
            self.pipeline
            | 'Get all feature flag config models for audit'
            >> ndb_io.GetModels(
                config_models.FeatureFlagConfigModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter outdated feature flag config models for audit'
            >> beam.Filter(
                lambda model: model.id == OLD_STORY_EDITOR_MODULES_FLAG_NAME
            )
        )

        audited_feature_flag_config_results = (
            outdated_feature_flag_config_models
            | 'Audit feature flag config models'
            >> beam.Map(self._audit_feature_flag_config_model)
        )

        unmigrated_story_snapshot_models = (
            self.pipeline
            | 'Get all story snapshot content models for audit'
            >> ndb_io.GetModels(
                story_models.StorySnapshotContentModel.get_all(
                    include_deleted=False
                )
            )
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add story keys for audit'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.get_unversioned_instance_id()
            )
        )

        audited_story_snapshot_results = (
            unmigrated_story_snapshot_models
            | 'Audit story snapshot content models'
            >> beam.MapTuple(  # pylint: disable=no-value-for-parameter
                self._audit_story_snapshot_content_model
            )
        )

        unmigrated_story_commit_log_models = (
            self.pipeline
            | 'Get all story commit log entries for audit'
            >> ndb_io.GetModels(
                story_models.StoryCommitLogEntryModel.get_all(
                    include_deleted=False
                )
            )
        )

        audited_story_commit_log_results = (
            unmigrated_story_commit_log_models
            | 'Audit story commit log entries'
            >> beam.Map(self._audit_story_commit_log_entry)
        )

        all_audit_results = (
            audited_feature_flag_config_results,
            audited_story_snapshot_results,
            audited_story_commit_log_results,
        ) | 'Flatten audit results' >> beam.Flatten()

        audited_job_run_results = (
            all_audit_results
            | 'Generate results for audit'
            >> job_result_transforms.ResultsToJobRunResults(
                'STORY MODULE AUDIT'
            )
        )

        return audited_job_run_results
