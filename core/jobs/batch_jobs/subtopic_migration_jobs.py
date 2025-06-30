# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for migrating the SubtopicPage models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import study_guide_domain
from core.domain import study_guide_services
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
    from mypy_imports import subtopic_models

(base_models, subtopic_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.SUBTOPIC])
datastore_services = models.Registry.import_datastore_services()


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class MigrateStudyGuideModels(beam.PTransform):# type: ignore[misc]
    """Transform that gets all Study Guide models, performs migration
      and filters any error results.
    """

    @staticmethod
    def _migrate_study_guide(
        study_guide_id: str,
        study_guide_model: subtopic_models.StudyGuideModel
    ) -> result.Result[Tuple[str, study_guide_domain.StudyGuide],
     Tuple[str, Exception]
    ]:
        """Migrates study guide and transform study guide model into
            study guide object.

        Args:
            study_guide_id: str. The id of the study guide.
            study_guide_model: StudyGuideModel. The study guide model to
                migrate.

        Returns:
            Result((str, StudyGuide), (str, Exception)). Result containing
            tuple that consist of study guide ID and either StudyGuide object or
            Exception. StudyGuide object is returned when the migration was
            successful and Exception is returned otherwise.
        """
        try:
            study_guide = study_guide_services.get_study_guide_from_model(
                study_guide_model)
            study_guide.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((study_guide_id, e))

        return result.Ok((study_guide_id, study_guide))

    # Remove no cover comment once migrations for study guides are available.
    @staticmethod
    def _generate_study_guide_changes(
        study_guide_id: str,
        study_guide_model: subtopic_models.StudyGuideModel
    ) -> Iterable[Tuple[str, study_guide_domain.StudyGuideChange]]: # pragma: no cover pylint: disable=line-too-long
        """Generates Study Guide change objects. Study Guide change object is
        generated when schema version for some field is lower than the latest
        schema version.

        Args:
            study_guide_id: str. The ID of the study guide.
            study_guide_model: StudyGuideModel. The study guide for which to
                generate the change objects.

        Yields:
            (str, StudyGuideChange). Tuple containing study guide ID and
            study guide change object.
        """
        study_guide_version = (
            study_guide_model.sections_schema_version)
        if study_guide_version < feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION: # pylint: disable=line-too-long
            study_guide_change = study_guide_domain.StudyGuideChange({
                'cmd': (
                    study_guide_domain.CMD_MIGRATE_STUDY_GUIDE_SECTIONS_SCHEMA_TO_LATEST_VERSION), # pylint: disable=line-too-long
                'from_version': study_guide_version,
                'to_version': (
                    feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION)
            })
            yield (study_guide_id, study_guide_change)

    def expand(
        self, pipeline: beam.Pipeline
    ) -> Tuple[
        beam.PCollection[base_models.BaseModel],
        beam.PCollection[job_run_result.JobRunResult]
    ]:
        """Migrate study guide objects and flush the input
            in case of errors.

        Args:
            pipeline: Pipeline. Input beam pipeline.

        Returns:
            (PCollection, PCollection). Tuple containing
            PCollection of models which should be put into the datastore and
            a PCollection of results from the subtopic migration.
        """

        unmigrated_study_guide_models = (
            pipeline
            | 'Get all non-deleted study guide models' >> (
                ndb_io.GetModels(subtopic_models.StudyGuideModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add study guide keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda study_guide_model: study_guide_model.id)
        )

        all_migrated_study_guide_results = (
            unmigrated_study_guide_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_study_guide)
        )

        migrated_study_guide_job_run_results = (
            all_migrated_study_guide_results
            | 'Generates results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'STUDY GUIDE PROCESSED'))
        )

        filtered_migrated_study_guides = (
            all_migrated_study_guide_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )

        migrated_study_guides = (
            filtered_migrated_study_guides
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        study_guide_changes = (
            unmigrated_study_guide_models
            | 'Generates study guide changes' >> beam.FlatMapTuple(
                self._generate_study_guide_changes)
        )

        study_guide_objects_list = (
            {
                'study_guide_model': unmigrated_study_guide_models,
                'study_guide': migrated_study_guides,
                'study_guide_changes': study_guide_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        transformed_study_guide_objects_list = (
            study_guide_objects_list
            | 'Remove unmigrated study guides' >> beam.Filter(
                lambda x: len(x['study_guide_changes']) > 0
                    and len(x['study_guide']) > 0)
            | 'Reorganize the study_guide objects' >> beam.Map(lambda objects: {
                    'study_guide_model': objects['study_guide_model'][0],
                    'study_guide': objects['study_guide'][0],
                    'study_guide_changes': objects['study_guide_changes']
                })

        )

        already_migrated_job_run_results = (
            study_guide_objects_list
            | 'Remove migrated models' >> beam.Filter(
                lambda x: (
                    len(
                        x['study_guide_changes']
                    ) == 0 and len(x['study_guide']) > 0
                ))
            | 'Transform previously migrated studyguide to job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'STUDY GUIDE PREVIOUSLY MIGRATED'))
        )

        study_guide_objects_list_job_run_results = (
            transformed_study_guide_objects_list
            | 'Transform study guide objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'STUDY GUIDE MIGRATED'))
        )

        job_run_results = (
            migrated_study_guide_job_run_results,
            already_migrated_job_run_results,
            study_guide_objects_list_job_run_results
        ) | 'Flatten job run results' >> beam.Flatten()

        return (
            transformed_study_guide_objects_list,
            job_run_results
        )


class MigrateStudyGuideJob(base_jobs.JobBase):
    """Job that migrates StudyGuide models."""

    # Remove no cover comment once migrations for study guides are available.
    @staticmethod
    def _update_study_guide(
        study_guide_model: subtopic_models.StudyGuideModel,
        migrated_study_guide: study_guide_domain.StudyGuide,
        study_guide_change: Sequence[study_guide_domain.StudyGuideChange]
    ) -> Sequence[base_models.BaseModel]: # pragma: no cover
        """Generates newly updated study guide models.

        Args:
            study_guide_model: StudyGuideModel. The study guide which should
                be updated.
            migrated_study_guide: StudyGuide. The migrated study guide domain
                object.
            study_guide_change: StudyGuideChange. The study guide changes
                to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_study_guide_model = (
            study_guide_services.populate_study_guide_model_fields(
            study_guide_model, migrated_study_guide)
        )

        change_dicts = [change.to_dict() for change in study_guide_change]
        with datastore_services.get_ndb_context():
            models_to_put = updated_study_guide_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USER_ID,
                feconf.COMMIT_TYPE_EDIT,
                'Update study guide sections schema version to %d.' % (
                    feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION),
                change_dicts,
                additional_models={}
            )
        models_to_put_values = []
        for model in models_to_put.values():
            # Here, we are narrowing down the type from object to BaseModel.
            assert isinstance(model, base_models.BaseModel)
            models_to_put_values.append(model)
        datastore_services.update_timestamps_multi(list(models_to_put_values))
        return models_to_put_values

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]: # pragma: no cover pylint: disable=line-too-long
        """Returns a PCollection of results from the study guide migration.

        Returns:
            PCollection. A PCollection of results from the study guide
            migration.
        """

        transformed_study_guide_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateStudyGuideModels())
        )

        study_guide_models_to_put = (
            transformed_study_guide_objects_list
            | 'Generate study guide models to put' >> beam.FlatMap(
                lambda study_guide_objects: self._update_study_guide(
                    study_guide_objects['study_guide_model'],
                    study_guide_objects['study_guide'],
                    study_guide_objects['study_guide_changes'],
                ))
        )

        unused_put_results = (
            study_guide_models_to_put
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return job_run_results


class AuditStudyGuideMigrationJob(base_jobs.JobBase):
    """Audit job for StudyGuide migration job."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of study
        guide migration.

        Returns:
            PCollection. A PCollection of results from the study
            guide migration.
        """

        unused_transformed_study_guide_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateStudyGuideModels())
        )

        return job_run_results
