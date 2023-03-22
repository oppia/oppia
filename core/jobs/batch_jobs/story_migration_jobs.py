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

"""Jobs used for migrating the story models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

from typing import Dict, Iterable, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import story_models
    from mypy_imports import topic_models

(base_models, story_models, topic_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.STORY, models.Names.TOPIC
])

datastore_services = models.Registry.import_datastore_services()


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class MigrateStoryModels(beam.PTransform):# type: ignore[misc]
    """Transform that gets all Story models, performs migration and filters any
    error results.
    """

    @staticmethod
    def _migrate_story(
        story_id: str,
        story_model: story_models.StoryModel,
        # This must have a default value of None. Otherwise, Beam won't
        # execute this code.
        topic_id_to_topic: Optional[Dict[str, topic_domain.Topic]] = None
    ) -> result.Result[Tuple[str, story_domain.Story], Tuple[str, Exception]]:
        """Migrates story and transform story model into story object.

        Args:
            story_id: str. The id of the story.
            story_model: StoryModel. The story model to migrate.
            topic_id_to_topic: dict(str, Topic). The mapping from topic ID to
                topic.

        Returns:
            Result((str, Story), (str, Exception)). Result containing tuple that
            consists of story ID and either story object or Exception. Story
            object is returned when the migration was successful and Exception
            is returned otherwise.
        """
        try:
            story = story_fetchers.get_story_from_model(story_model)
            story.validate()
            assert topic_id_to_topic is not None
            corresponding_topic = (
                topic_id_to_topic[story.corresponding_topic_id])
            story_services.validate_prerequisite_skills_in_story_contents(
                corresponding_topic.get_all_skill_ids(),
                story.story_contents
            )
        except Exception as e:
            logging.exception(e)
            return result.Err((story_id, e))

        return result.Ok((story_id, story))

    @staticmethod
    def _generate_story_changes(
        story_id: str, story_model: story_models.StoryModel
    ) -> Iterable[Tuple[str, story_domain.StoryChange]]:
        """Generates story change objects. Story change object is generated when
        schema version for some field is lower than the latest schema version.

        Args:
            story_id: str. The id of the story.
            story_model: StoryModel. The story for which to generate the change
                objects.

        Yields:
            (str, StoryChange). Tuple containing story ID and story change
            object.
        """
        schema_version = story_model.story_contents_schema_version
        if schema_version < feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION:
            story_change = story_domain.StoryChange({
                'cmd': story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
                'from_version': story_model.story_contents_schema_version,
                'to_version': feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
            })
            yield (story_id, story_change)

    def expand(
        self, pipeline: beam.Pipeline
    ) -> Tuple[
        beam.PCollection[base_models.BaseModel],
        beam.PCollection[job_run_result.JobRunResult]
    ]:
        """Migrate story objects and flush the input in case of errors.

        Args:
            pipeline: Pipeline. Input beam pipeline.

        Returns:
            (PCollection, PCollection). Tuple containing
            PCollection of models which should be put into the datastore and
            a PCollection of results from the story migration.
        """
        unmigrated_story_models = (
            pipeline
            | 'Get all non-deleted story models' >> (
                ndb_io.GetModels(story_models.StoryModel.get_all()))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add story keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda story_model: story_model.id)
        )
        story_summary_models = (
            pipeline
            | 'Get all non-deleted story summary models' >> (
                ndb_io.GetModels(story_models.StorySummaryModel.get_all()))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add story summary keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda story_summary_model: story_summary_model.id)
        )
        topics = (
            self.pipeline
            | 'Get all non-deleted topic models' >> (
                ndb_io.GetModels(topic_models.TopicModel.get_all()))
            | 'Transform model into domain object' >> beam.Map(
                topic_fetchers.get_topic_from_model)
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add topic keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda topic: topic.id)
        )
        topic_id_to_topic = beam.pvalue.AsDict(topics)

        all_migrated_story_results = (
            unmigrated_story_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_story, topic_id_to_topic=topic_id_to_topic)
        )
        migrated_story_job_run_results = (
            all_migrated_story_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('STORY PROCESSED'))
        )
        filtered_migrated_stories = (
            all_migrated_story_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )

        migrated_stories = (
            filtered_migrated_stories
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        story_changes = (
            unmigrated_story_models
            | 'Generate story changes' >> beam.FlatMapTuple(
                self._generate_story_changes)
        )

        story_objects_list = (
            {
                'story_model': unmigrated_story_models,
                'story_summary_model': story_summary_models,
                'story': migrated_stories,
                'story_change': story_changes
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        transformed_story_objects_list = (
            story_objects_list
            | 'Remove unmigrated stories' >> beam.Filter(
                lambda x: len(x['story_change']) > 0 and len(x['story']) > 0)
            | 'Reorganize the story objects' >> beam.Map(lambda objects: {
                    'story_model': objects['story_model'][0],
                    'story_summary_model': objects['story_summary_model'][0],
                    'story': objects['story'][0],
                    'story_change': objects['story_change'][0]
                })
        )

        already_migrated_job_run_results = (
            story_objects_list
            | 'Remove migrated stories' >> beam.Filter(
                lambda x: (
                    len(x['story_change']) == 0 and len(x['story']) > 0
                ))
            | 'Transform previously migrated stories into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'STORY PREVIOUSLY MIGRATED'))
        )

        story_objects_list_job_run_results = (
            transformed_story_objects_list
            | 'Transform story objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'STORY MIGRATED'))
        )

        job_run_results = (
            migrated_story_job_run_results,
            already_migrated_job_run_results,
            story_objects_list_job_run_results
        ) | 'Flatten job run results' >> beam.Flatten()

        return transformed_story_objects_list, job_run_results


# TODO(#15927): This job needs to be kept in sync with AuditStoryMigrationJob
# and later we will unify these jobs together.
class MigrateStoryJob(base_jobs.JobBase):
    """Job that migrates story models."""

    @staticmethod
    def _update_story(
        story_model: story_models.StoryModel,
        migrated_story: story_domain.Story,
        story_change: story_domain.StoryChange
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated story models.

        Args:
            story_model: StoryModel. The story which should be updated.
            migrated_story: Story. The migrated story domain object.
            story_change: StoryChange. The story change to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_story_model = story_services.populate_story_model_fields(
            story_model, migrated_story)
        change_dicts = [story_change.to_dict()]
        with datastore_services.get_ndb_context():
            models_to_put = updated_story_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USERNAME,
                feconf.COMMIT_TYPE_EDIT,
                'Update story contents schema version to %d.' % (
                    feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
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
    def _update_story_summary(
        migrated_story: story_domain.Story,
        story_summary_model: story_models.StorySummaryModel
    ) -> story_models.StorySummaryModel:
        """Generates newly updated story summary model.

        Args:
            migrated_story: Story. The migrated story domain object.
            story_summary_model: StorySummaryModel. The story summary model to
                update.

        Returns:
            StorySummaryModel. The updated story summary model to put into the
            datastore.
        """
        story_summary = story_services.compute_summary_of_story(migrated_story)
        story_summary.version += 1
        updated_story_summary_model = (
            story_services.populate_story_summary_model_fields(
                story_summary_model, story_summary
            )
        )
        return updated_story_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the story migration.

        Returns:
            PCollection. A PCollection of results from the story migration.
        """
        transformed_story_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateStoryModels()
            )
        )

        story_models_to_put = (
            transformed_story_objects_list
            | 'Generate story models to put' >> beam.FlatMap(
                lambda story_objects: self._update_story(
                    story_objects['story_model'],
                    story_objects['story'],
                    story_objects['story_change'],
                ))
        )

        story_summary_models_to_put = (
            transformed_story_objects_list
            | 'Generate story summary models to put' >> beam.Map(
                lambda story_objects: self._update_story_summary(
                    story_objects['story'],
                    story_objects['story_summary_model']
                ))
        )

        unused_put_results = (
            (story_models_to_put, story_summary_models_to_put)
            | 'Merge models' >> beam.Flatten()
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return job_run_results


class AuditStoryMigrationJob(base_jobs.JobBase):
    """Job that audits migrated Story models."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the audit of story migration.

        Returns:
            PCollection. A PCollection of results from the story migration.
        """

        unused_transformed_story_objects_list, job_run_results = (
            self.pipeline
            | 'Perform migration and filter migration results' >> (
                MigrateStoryModels()
            )
        )

        return job_run_results
