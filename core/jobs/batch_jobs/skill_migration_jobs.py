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

"""Jobs used for migrating the skill models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

from typing import Iterable, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import skill_models

(base_models, skill_models,) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.SKILL
])

datastore_services = models.Registry.import_datastore_services()


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class MigrateSkillModels(beam.PTransform):# type: ignore[misc]
    """Transform that gets all Skill models, performs migration and filters
    any error results.
    """

    @staticmethod
    def _migrate_skill(
        skill_id: str, skill_model: skill_models.SkillModel
    ) -> result.Result[Tuple[str, skill_domain.Skill], Tuple[str, Exception]]:
        """Migrates skill and transform skill model into skill object.

        Args:
            skill_id: str. The id of the skill.
            skill_model: SkillModel. The skill model to migrate.

        Returns:
            Result((str, Skill), (str, Exception)). Result containing tuple that
            consists of skill ID and either skill object or Exception. Skill
            object is returned when the migration was successful and Exception
            is returned otherwise.
        """
        try:
            skill = skill_fetchers.get_skill_from_model(skill_model)
            skill.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((skill_id, e))

        return result.Ok((skill_id, skill))

    @staticmethod
    def _generate_skill_changes(
        skill_id: str, skill_model: skill_models.SkillModel
    ) -> Iterable[Tuple[str, skill_domain.SkillChange]]:
        """Generates skill change objects. Skill change object is generated when
        schema version for some field is lower than the latest schema version.

        Args:
            skill_id: str. The id of the skill.
            skill_model: SkillModel. The skill for which to generate the change
                objects.

        Yields:
            (str, SkillChange). Tuple containing skill ID and skill change
            object.
        """
        contents_version = skill_model.skill_contents_schema_version
        if contents_version < feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION:
            skill_change = skill_domain.SkillChange({
                'cmd': (
                    skill_domain.CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION),
                'from_version': skill_model.skill_contents_schema_version,
                'to_version': feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION
            })
            yield (skill_id, skill_change)

        misconceptions_version = skill_model.misconceptions_schema_version
        if misconceptions_version < feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION:  # pylint: disable=line-too-long
            skill_change = skill_domain.SkillChange({
                'cmd': (
                    skill_domain
                    .CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION
                ),
                'from_version': skill_model.misconceptions_schema_version,
                'to_version': feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION
            })
            yield (skill_id, skill_change)

        rubric_schema_version = skill_model.rubric_schema_version
        if rubric_schema_version < feconf.CURRENT_RUBRIC_SCHEMA_VERSION:
            skill_change = skill_domain.SkillChange({
                'cmd': (
                    skill_domain.CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION),
                'from_version': skill_model.rubric_schema_version,
                'to_version': feconf.CURRENT_RUBRIC_SCHEMA_VERSION
            })
            yield (skill_id, skill_change)

    def expand(
        self, pipeline: beam.Pipeline
    ) -> Tuple[
        beam.PCollection[base_models.BaseModel],
        beam.PCollection[job_run_result.JobRunResult]
    ]:
        """Migrate skill objects and flush the input in case of errors.

        Args:
            pipeline: Pipeline. Input beam pipeline.

        Returns:
            (PCollection, PCollection). Tuple containing
            PCollection of models which should be put into the datastore and
            a PCollection of results from the skill migration.
        """
        unmigrated_skill_models = (
            pipeline
            | 'Get all non-deleted skill models' >> (
                ndb_io.GetModels(skill_models.SkillModel.get_all()))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add skill model ID' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda skill_model: skill_model.id)
        )
        skill_summary_models = (
            pipeline
            | 'Get all non-deleted skill summary models' >> (
                ndb_io.GetModels(skill_models.SkillSummaryModel.get_all()))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add skill summary ID' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda skill_summary_model: skill_summary_model.id)
        )

        all_migrated_skill_results = (
            unmigrated_skill_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_skill)
        )

        migrated_skill_job_run_results = (
            all_migrated_skill_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('SKILL PROCESSED'))
        )

        filtered_migrated_skills = (
            all_migrated_skill_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )

        migrated_skills = (
            filtered_migrated_skills
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        skill_changes = (
            unmigrated_skill_models
            | 'Generate skill changes' >> beam.FlatMapTuple(
                self._generate_skill_changes)
        )

        skill_objects_list = (
            {
                'skill_model': unmigrated_skill_models,
                'skill_summary_model': skill_summary_models,
                'skill': migrated_skills,
                'skill_changes': skill_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        transformed_skill_objects_list = (
            skill_objects_list
            | 'Remove unmigrated skills' >> beam.Filter(
                lambda x: len(x['skill_changes']) > 0 and len(x['skill']) > 0)
            | 'Reorganize the skill objects' >> beam.Map(lambda objects: {
                    'skill_model': objects['skill_model'][0],
                    'skill_summary_model': objects['skill_summary_model'][0],
                    'skill': objects['skill'][0],
                    'skill_changes': objects['skill_changes']
                })

        )

        already_migrated_job_run_results = (
            skill_objects_list
            | 'Remove migrated skills' >> beam.Filter(
                lambda x: (
                        len(x['skill_changes']) == 0 and len(x['skill']) > 0
                ))
            | 'Transform previously migrated skills into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SKILL PREVIOUSLY MIGRATED'))
        )

        skill_objects_list_job_run_results = (
            transformed_skill_objects_list
            | 'Transform skill objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SKILL MIGRATED'))
        )

        job_run_results = (
            migrated_skill_job_run_results,
            already_migrated_job_run_results,
            skill_objects_list_job_run_results
        ) | 'Flatten job run results' >> beam.Flatten()

        return transformed_skill_objects_list, job_run_results


class MigrateSkillJob(base_jobs.JobBase):
    """Job that migrates skill models."""

    @staticmethod
    def _update_skill(
        skill_model: skill_models.SkillModel,
        migrated_skill: skill_domain.Skill,
        skill_changes: Sequence[skill_domain.SkillChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated skill models.

        Args:
            skill_model: SkillModel. The skill which should be updated.
            migrated_skill: Skill. The migrated skill domain object.
            skill_changes: sequence(SkillChange). The skill changes to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_skill_model = (
            skill_services.populate_skill_model_fields(
                skill_model, migrated_skill))
        commit_message = (
            'Update skill content schema version to %d and '
            'skill misconceptions schema version to %d and '
            'skill rubrics schema version to %d.'
        ) % (
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION
        )
        change_dicts = [change.to_dict() for change in skill_changes]
        with datastore_services.get_ndb_context():
            models_to_put = updated_skill_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USERNAME,
                feconf.COMMIT_TYPE_EDIT,
                commit_message,
                change_dicts,
                additional_models={}
            )
        models_to_put_values = []
        for model in models_to_put.values():
            # Here, we are narrowing down the type from object to BaseModel.
            assert isinstance(model, base_models.BaseModel)
            models_to_put_values.append(model)
        datastore_services.update_timestamps_multi(models_to_put_values)
        return models_to_put_values

    @staticmethod
    def _update_skill_summary(
        migrated_skill: skill_domain.Skill,
        skill_summary_model: skill_models.SkillSummaryModel
    ) -> skill_models.SkillSummaryModel:
        """Generates newly updated skill summary model.

        Args:
            migrated_skill: Skill. The migrated skill domain object.
            skill_summary_model: SkillSummaryModel. The skill summary model to
                update.

        Returns:
            SkillSummaryModel. The updated skill summary model to put into
            the datastore.
        """
        skill_summary = skill_services.compute_summary_of_skill(migrated_skill)
        skill_summary.version += 1
        updated_skill_summary_model = (
            skill_services.populate_skill_summary_model_fields(
                skill_summary_model, skill_summary
            )
        )
        return updated_skill_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the skill migration.

        Returns:
            PCollection. A PCollection of results from the skill migration.
        """
        transformed_skill_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateSkillModels()
            )
        )

        skill_models_to_put = (
            transformed_skill_objects_list
            | 'Generate skill models to put' >> beam.FlatMap(
                lambda skill_objects: self._update_skill(
                    skill_objects['skill_model'],
                    skill_objects['skill'],
                    skill_objects['skill_changes'],
                ))
        )

        skill_summary_models_to_put = (
            transformed_skill_objects_list
            | 'Generate skill summary models to put' >> beam.Map(
                lambda skill_objects: self._update_skill_summary(
                    skill_objects['skill'],
                    skill_objects['skill_summary_model']
                ))
        )

        unused_put_results = (
            (skill_models_to_put, skill_summary_models_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return job_run_results


class AuditSkillMigrationJob(base_jobs.JobBase):
    """Job that audits migrated Skill models."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of skill migration.

        Returns:
            PCollection. A PCollection of results from the skill migration.
        """

        unused_transformed_skill_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateSkillModels()
            )
        )

        return job_run_results
