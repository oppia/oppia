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
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
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
class MigrateSubtopicPageModels(beam.PTransform):# type: ignore[misc]
    """Transform that gets all Subtopic models, performs migration
      and filters any error results.
    """

    @staticmethod
    def _migrate_subtopic(
        subtopic_page_id: str,
        subtopic_page_model: subtopic_models.SubtopicPageModel
    ) -> result.Result[Tuple[str, subtopic_page_domain.SubtopicPage],
     Tuple[str, Exception]
    ]:
        """Migrates subtopic and transform subtopic model into subtopic object.

        Args:
            subtopic_page_id: str. The id of the subtopic.
            subtopic_page_model: SubtopicPageModel. The subtopic page model to
                migrate.

        Returns:
            Result((str, SubtopicPage), (str, Exception)). Result containing
            tuple that consist of subtopic ID and either SubtopicPage object or
            Exception. SubtopicPage object is returned when the migration was
            successful and Exception is returned otherwise.
        """
        try:
            subtopic = subtopic_page_services.get_subtopic_page_from_model(
                subtopic_page_model)
            subtopic.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((subtopic_page_id, e))

        return result.Ok((subtopic_page_id, subtopic))

    @staticmethod
    def _generate_subtopic_changes(
        subtopic_page_id: str,
        subtopic_page_model: subtopic_models.SubtopicPageModel
    ) -> Iterable[Tuple[str, subtopic_page_domain.SubtopicPageChange]]:
        """Generates subtopic change objects. Subtopic change object is
        generated when schema version for some field is lower than the latest
        schema version.

        Args:
            subtopic_page_id: str. The ID of the subtopic page.
            subtopic_page_model: SubtopicPageModel. The subtopic for which to
                generate the change objects.

        Yields:
            (str, SubtopicPageChange). Tuple containing subtopic page ID and
            subtopic change object.
        """
        subtopic_page_version = (
            subtopic_page_model.page_contents_schema_version)
        if subtopic_page_version < feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION: # pylint: disable=line-too-long
            subtopic_change = subtopic_page_domain.SubtopicPageChange({
                'cmd': (
                    subtopic_page_domain.CMD_MIGRATE_SUBTOPIC_PAGE_CONTENTS_SCHEMA_TO_LATEST_VERSION), # pylint: disable=line-too-long
                'from_version': subtopic_page_version,
                'to_version': (
                    feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION)
            })
            yield (subtopic_page_id, subtopic_change)

    def expand(
        self, pipeline: beam.Pipeline
    ) -> Tuple[
        beam.PCollection[base_models.BaseModel],
        beam.PCollection[job_run_result.JobRunResult]
    ]:
        """Migrate subtopic objects and flush the input
            in case of errors.

        Args:
            pipeline: Pipeline. Input beam pipeline.

        Returns:
            (PCollection, PCollection). Tuple containing
            PCollection of models which should be put into the datastore and
            a PCollection of results from the subtopic migration.
        """

        unmigrated_subtopic_models = (
            pipeline
            | 'Get all non-deleted subtopic models' >> (
                ndb_io.GetModels(subtopic_models.SubtopicPageModel.get_all()))
            # Pylint disable is needed becasue pylint is not able to correclty
            # detect that the value is passed through the pipe.
            | 'Add subtopic keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda subtopic_model: subtopic_model.id)
        )

        all_migrated_subtopic_results = (
            unmigrated_subtopic_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_subtopic)
        )

        migrated_subtopic_job_run_results = (
            all_migrated_subtopic_results
            | 'Generates results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'SUBTOPIC PROCESSED'))
        )

        filtered_migrated_exp = (
            all_migrated_subtopic_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )

        migrated_subtopics = (
            filtered_migrated_exp
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        subtopic_changes = (
            unmigrated_subtopic_models
            | 'Generates subtopic changes' >> beam.FlatMapTuple(
                self._generate_subtopic_changes)
        )

        subtopic_objects_list = (
            {
                'subtopic_model': unmigrated_subtopic_models,
                'subtopic': migrated_subtopics,
                'subtopic_changes': subtopic_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        transformed_subtopic_objects_list = (
            subtopic_objects_list
            | 'Remove unmigrated subtopics' >> beam.Filter(
                lambda x: len(x['subtopic_changes']) > 0
                    and len(x['subtopic']) > 0)
            | 'Reorganize the subtopic objects' >> beam.Map(lambda objects: {
                    'subtopic_model': objects['subtopic_model'][0],
                    'subtopic': objects['subtopic'][0],
                    'subtopic_changes': objects['subtopic_changes']
                })

        )

        already_migrated_job_run_results = (
            subtopic_objects_list
            | 'Remove migrated models' >> beam.Filter(
                lambda x: (
                    len(x['subtopic_changes']) == 0 and len(x['subtopic']) > 0
                ))
            | 'Transform previously migrated subtopics to job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SUBTOPIC PREVIOUSLY MIGRATED'))
        )

        subtopic_objects_list_job_run_results = (
            transformed_subtopic_objects_list
            | 'Transform subtopic objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SUBTOPIC MIGRATED'))
        )

        job_run_results = (
            migrated_subtopic_job_run_results,
            already_migrated_job_run_results,
            subtopic_objects_list_job_run_results
        ) | 'Flatten job run results' >> beam.Flatten()

        return (
            transformed_subtopic_objects_list,
            job_run_results
        )


class MigrateSubtopicPageJob(base_jobs.JobBase):
    """Job that migrates SubtopicPage models."""

    @staticmethod
    def _update_subtopic(
        subtopic_page_model: subtopic_models.SubtopicPageModel,
        migrated_subtopic: subtopic_page_domain.SubtopicPage,
        subtopic_page_change: Sequence[subtopic_page_domain.SubtopicPageChange]
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated subtopic page models.

        Args:
            subtopic_page_model: SubtopicPageModel. The subtopic which should
                be updated.
            migrated_subtopic: SubtopicPage. The migrated subtopic page domain
                object.
            subtopic_page_change: SubtopicPageChange. The subtopic page changes
                to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_subtopic_model = (
            subtopic_page_services.populate_subtopic_page_model_fields(
            subtopic_page_model, migrated_subtopic)
        )

        change_dicts = [change.to_dict() for change in subtopic_page_change]
        with datastore_services.get_ndb_context():
            models_to_put = updated_subtopic_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USER_ID,
                feconf.COMMIT_TYPE_EDIT,
                'Update subtopic page contents schema version to %d.' % (
                    feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
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

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the subtopic migration.

        Returns:
            PCollection. A PCollection of results from the subtopic
            migration.
        """

        transformed_subtopic_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateSubtopicPageModels())
        )

        subtopic_models_to_put = (
            transformed_subtopic_objects_list
            | 'Generate subtopic models to put' >> beam.FlatMap(
                lambda subtopic_objects: self._update_subtopic(
                    subtopic_objects['subtopic_model'],
                    subtopic_objects['subtopic'],
                    subtopic_objects['subtopic_changes'],
                ))
        )

        unused_put_results = (
            subtopic_models_to_put
            | 'Put models into datastore' >> ndb_io.PutModels()
        )

        return job_run_results


class AuditSubtopicMigrationJob(base_jobs.JobBase):
    """Audit job for SubtopicPage migration job."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of subtopic
        migration.

        Returns:
            PCollection. A PCollection of results from the subtopic
            migration.
        """

        unused_transformed_subtopic_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateSubtopicPageModels())
        )

        return job_run_results
