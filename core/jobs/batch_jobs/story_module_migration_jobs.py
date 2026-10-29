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

import copy
import logging

from core import feature_flag_list, feconf
from core.domain import story_domain, story_fetchers
from core.jobs import base_jobs, job_utils
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Any, Dict, Final, List, NamedTuple, Optional, Tuple

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


class _MigrationPlan(NamedTuple):
    """The datastore changes and reported result for a single model.

    Attributes:
        model_to_put: BaseModel|None. The updated model to write, or None if
            the model does not need to be written.
        key_to_delete: Key|None. The key of a model to delete, or None if no
            model needs to be deleted.
        result: Result. The result to report for this model.
    """

    model_to_put: Optional[datastore_services.Model]
    key_to_delete: Optional[datastore_services.Key]
    result: result.Result[Tuple[str, str], Tuple[str, Exception]]


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


class StoryModulesMigrationJobBase(base_jobs.JobBase):
    """Shared implementation for the story module related migration jobs.

    The job is read-only by default. Subclasses can opt into writing their
    migration plans to the datastore by setting DATASTORE_UPDATES_ALLOWED to
    True.

    The job performs three kinds of migration:
    1. Renames the FeatureFlagConfigModel id for the story editor modules
       feature flag from the deprecated 'story_editor_arcs' value to
       'story_editor_modules'.
    2. Migrates StorySnapshotContentModel objects to the latest story
       contents schema version.
    3. Rewrites the deprecated arc-named commit commands stored in
       StoryCommitLogEntryModel objects to their module-named equivalents.
    """

    DATASTORE_UPDATES_ALLOWED = False

    RESULT_PREFIX = 'STORY MODULE MIGRATED'

    @staticmethod
    def _plan_feature_flag_config_migration(
        feature_flag_config_model: config_models.FeatureFlagConfigModel,
        new_feature_flag_exists: bool,
    ) -> _MigrationPlan:
        """Plans the migration of a deprecated feature flag config model.

        Args:
            feature_flag_config_model: FeatureFlagConfigModel. The feature
                flag config model using the deprecated name.
            new_feature_flag_exists: bool. Whether a feature flag config
                model already exists under the new name.

        Returns:
            _MigrationPlan. The plan for migrating the feature flag.
        """
        new_feature_flag_name = (
            feature_flag_list.FeatureNames.STORY_EDITOR_MODULES.value
        )
        new_feature_flag_config_model = None
        if not new_feature_flag_exists:
            new_feature_flag_config_model = job_utils.clone_model(
                feature_flag_config_model,
                id=new_feature_flag_name,
                created_on=None,
                last_updated=None,
            )
            new_feature_flag_config_model.update_timestamps()

        return _MigrationPlan(
            model_to_put=new_feature_flag_config_model,
            key_to_delete=feature_flag_config_model.key,
            result=result.Ok((new_feature_flag_name, 'SUCCESS')),
        )

    @staticmethod
    def _plan_story_snapshot_migration(
        story_id: str,
        story_model: Optional[story_models.StoryModel],
        story_snapshot_model: story_models.StorySnapshotContentModel,
    ) -> _MigrationPlan:
        """Plans the migration of a story snapshot content model.

        Args:
            story_id: str. The ID of the story.
            story_model: StoryModel|None. The story model that the snapshot
                belongs to, or None if the story does not exist.
            story_snapshot_model: StorySnapshotContentModel. The snapshot
                content model to migrate.

        Returns:
            _MigrationPlan. The plan for migrating the snapshot.
        """
        if story_model is None:
            return _MigrationPlan(
                model_to_put=None,
                key_to_delete=None,
                result=result.Err(
                    (story_id, Exception('Story does not exist.'))
                ),
            )

        if (
            story_model.story_contents_schema_version
            != feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
        ):
            return _MigrationPlan(
                model_to_put=None,
                key_to_delete=None,
                result=result.Err(
                    (
                        story_id,
                        Exception('Story is not at latest schema version'),
                    )
                ),
            )

        latest_story = story_fetchers.get_story_from_model(story_model)
        try:
            latest_story.validate()
        except Exception:
            return _MigrationPlan(
                model_to_put=None,
                key_to_delete=None,
                result=result.Err(
                    (
                        story_id,
                        Exception(
                            'Story %s failed non-strict validation' % story_id
                        ),
                    )
                ),
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
            return _MigrationPlan(
                model_to_put=None,
                key_to_delete=None,
                result=result.Err(
                    (
                        story_id,
                        Exception(
                            'Snapshot is already at latest schema version'
                        ),
                    )
                ),
            )

        versioned_story_contents: story_domain.VersionedStoryContentsDict = {
            'schema_version': current_story_contents_schema_version,
            'story_contents': copy.deepcopy(
                story_snapshot_model.content['story_contents']
            ),
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
                return _MigrationPlan(
                    model_to_put=None,
                    key_to_delete=None,
                    result=result.Err((story_id, Exception(error_message))),
                )

        updated_story_snapshot_model = job_utils.clone_model(
            story_snapshot_model,
            content={
                'story_contents_schema_version': (
                    current_story_contents_schema_version
                ),
                'story_contents': versioned_story_contents['story_contents'],
            },
        )
        updated_story_snapshot_model.update_timestamps(
            update_last_updated_time=False
        )

        return _MigrationPlan(
            model_to_put=updated_story_snapshot_model,
            key_to_delete=None,
            result=result.Ok((story_id, 'SUCCESS')),
        )

    @staticmethod
    def _plan_story_commit_log_migration(
        story_commit_log_entry_model: story_models.StoryCommitLogEntryModel,
    ) -> _MigrationPlan:
        """Plans the migration of a story commit log entry.

        Args:
            story_commit_log_entry_model: StoryCommitLogEntryModel. The
                commit log entry to migrate.

        Returns:
            _MigrationPlan. The plan for migrating the commit log entry.
        """
        new_commit_cmds = [
            _rewrite_commit_cmd(commit_cmd)
            for commit_cmd in story_commit_log_entry_model.commit_cmds
        ]
        updated_story_commit_log_entry_model = None
        if new_commit_cmds != story_commit_log_entry_model.commit_cmds:
            updated_story_commit_log_entry_model = job_utils.clone_model(
                story_commit_log_entry_model, commit_cmds=new_commit_cmds
            )
            updated_story_commit_log_entry_model.update_timestamps(
                update_last_updated_time=False
            )

        return _MigrationPlan(
            model_to_put=updated_story_commit_log_entry_model,
            key_to_delete=None,
            result=result.Ok((story_commit_log_entry_model.id, 'SUCCESS')),
        )

    @staticmethod
    def _build_story_snapshot_migration_plans(
        story_and_snapshot_models: Tuple[
            List[story_models.StoryModel],
            List[story_models.StorySnapshotContentModel],
        ],
    ) -> List[_MigrationPlan]:
        """Builds migration plans for every snapshot in a story group.

        Args:
            story_and_snapshot_models: tuple(list(StoryModel),
                list(StorySnapshotContentModel)). The story models and
                snapshot content models that share a story ID.

        Returns:
            list(_MigrationPlan). The migration plans for the snapshots.
        """
        story_model_list, story_snapshot_model_list = story_and_snapshot_models
        story_model = story_model_list[0] if story_model_list else None
        return [
            StoryModulesMigrationJobBase._plan_story_snapshot_migration(
                story_snapshot_model.get_unversioned_instance_id(),
                story_model,
                story_snapshot_model,
            )
            for story_snapshot_model in story_snapshot_model_list
        ]

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the migration.

        Returns:
            PCollection. A PCollection of results from the migration.
        """
        all_feature_flag_config_models = (
            self.pipeline
            | 'Get all feature flag config models'
            >> ndb_io.GetModels(
                config_models.FeatureFlagConfigModel.get_all(
                    include_deleted=False
                )
            )
        )

        outdated_feature_flag_config_models = (
            all_feature_flag_config_models
            | 'Filter outdated feature flag config models'
            >> beam.Filter(
                lambda model: model.id == OLD_STORY_EDITOR_MODULES_FLAG_NAME
            )
            | 'Add feature flag group key'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: 'story_editor_modules'
            )
        )

        existing_new_feature_flag_config_models = (
            all_feature_flag_config_models
            | 'Filter existing new feature flag config models'
            >> beam.Filter(
                lambda model: (
                    model.id
                    == feature_flag_list.FeatureNames.STORY_EDITOR_MODULES.value
                )
            )
            | 'Add existing new feature flag group key'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: 'story_editor_modules'
            )
        )

        plan_feature_flag_config_migration = (
            StoryModulesMigrationJobBase._plan_feature_flag_config_migration
        )
        feature_flag_config_migration_plans = (
            (
                outdated_feature_flag_config_models,
                existing_new_feature_flag_config_models,
            )
            | 'Group feature flag config models' >> beam.CoGroupByKey()
            | 'Get grouped feature flag config models'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Build feature flag config migration plans'
            >> beam.FlatMap(
                lambda old_and_new_models: [
                    plan_feature_flag_config_migration(
                        old_feature_flag_config_model,
                        bool(old_and_new_models[1]),
                    )
                    for old_feature_flag_config_model in old_and_new_models[0]
                ]
            )
        )

        story_models_by_id = (
            self.pipeline
            | 'Get all story models'
            >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False)
            )
            | 'Add story keys'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id
            )
        )

        story_snapshot_models_by_story_id = (
            self.pipeline
            | 'Get all story snapshot content models'
            >> ndb_io.GetModels(
                story_models.StorySnapshotContentModel.get_all(
                    include_deleted=False
                )
            )
            | 'Add story snapshot keys'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.get_unversioned_instance_id()
            )
        )

        build_story_snapshot_migration_plans = (
            StoryModulesMigrationJobBase._build_story_snapshot_migration_plans
        )
        story_snapshot_migration_plans = (
            (story_models_by_id, story_snapshot_models_by_story_id)
            | 'Group story models with their snapshots' >> beam.CoGroupByKey()
            | 'Get grouped story models with their snapshots'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Build story snapshot migration plans'
            >> beam.FlatMap(build_story_snapshot_migration_plans)
        )

        story_commit_log_models = (
            self.pipeline
            | 'Get all story commit log entries'
            >> ndb_io.GetModels(
                story_models.StoryCommitLogEntryModel.get_all(
                    include_deleted=False
                )
            )
        )

        story_commit_log_migration_plans = (
            story_commit_log_models
            | 'Build story commit log migration plans'
            >> beam.Map(
                StoryModulesMigrationJobBase._plan_story_commit_log_migration
            )
        )

        all_migration_plans = (
            feature_flag_config_migration_plans,
            story_snapshot_migration_plans,
            story_commit_log_migration_plans,
        ) | 'Flatten migration plans' >> beam.Flatten()

        successful_migration_plans = (
            all_migration_plans
            | 'Filter successful migration plans'
            >> beam.Filter(lambda plan: plan.result.is_ok())
        )

        models_to_put = (
            successful_migration_plans
            | 'Get models to put'
            >> beam.FlatMap(
                lambda plan: (
                    [plan.model_to_put] if plan.model_to_put is not None else []
                )
            )
        )

        keys_to_delete = (
            successful_migration_plans
            | 'Get keys to delete'
            >> beam.FlatMap(
                lambda plan: (
                    [plan.key_to_delete]
                    if plan.key_to_delete is not None
                    else []
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                models_to_put
                | 'Put migrated models into the datastore' >> ndb_io.PutModels()
            )
            unused_delete_results = (
                keys_to_delete
                | 'Delete migrated models from the datastore'
                >> ndb_io.DeleteModels()
            )

        return (
            all_migration_plans
            | 'Get migration results' >> beam.Map(lambda plan: plan.result)
            | 'Generate results for migration'
            >> job_result_transforms.ResultsToJobRunResults(self.RESULT_PREFIX)
        )


class AuditStoryModulesMigrationJob(StoryModulesMigrationJobBase):
    """Job that audits the migration of the story module related models.

    This job runs every check of MigrateStoryModulesJob without writing to the
    datastore, so that its success guarantees that the migration job will
    succeed without errors.
    """

    RESULT_PREFIX = 'STORY MODULE AUDIT'


class MigrateStoryModulesJob(StoryModulesMigrationJobBase):
    """Job that migrates the story module related models."""

    DATASTORE_UPDATES_ALLOWED = True
