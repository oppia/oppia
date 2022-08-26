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
from core.domain import caching_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
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
    models.NAMES.BASE_MODEL, models.NAMES.STORY, models.NAMES.TOPIC
])

datastore_services = models.Registry.import_datastore_services()


class MigrateStoryJob(base_jobs.JobBase):
    """Job that migrates story models."""

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
            topic_id_to_topic: dict(str, Topic). The mapping from topic ID
                to topic.

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
            story_model: StoryModel. The story for which to generate
                the change objects.

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

    @staticmethod
    def _delete_story_from_cache(
        story: story_domain.Story
    ) -> result.Result[str, Exception]:
        """Deletes story from cache.

        Args:
            story: Story. The story which should be deleted from cache.

        Returns:
            Result(str,Exception). The id of the story when the deletion
            was successful or Exception when the deletion failed.
        """
        try:
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_STORY, None, [story.id])
            return result.Ok(story.id)
        except Exception as e:
            return result.Err(e)

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
            story_summary_model: StorySummaryModel. The story summary model
                to update.

        Returns:
            StorySummaryModel. The updated story summary model to put into
            the datastore.
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

        unmigrated_story_models = (
            self.pipeline
            | 'Get all non-deleted story models' >> (
                ndb_io.GetModels(story_models.StoryModel.get_all()))
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Add story keys' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda story_model: story_model.id)
        )
        story_summary_models = (
            self.pipeline
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

        migrated_story_results = (
            unmigrated_story_models
            | 'Transform and migrate model' >> beam.MapTuple(
                self._migrate_story, topic_id_to_topic=topic_id_to_topic)
        )
        migrated_stories = (
            migrated_story_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )
        migrated_story_job_run_results = (
            migrated_story_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults('STORY PROCESSED'))
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
            | 'Remove unmigrated stories' >> beam.Filter(
                lambda x: len(x['story_change']) > 0 and len(x['story']) > 0)
            | 'Reorganize the story objects' >> beam.Map(lambda objects: {
                    'story_model': objects['story_model'][0],
                    'story_summary_model': objects['story_summary_model'][0],
                    'story': objects['story'][0],
                    'story_change': objects['story_change'][0]
                })
        )

        story_objects_list_job_run_results = (
            story_objects_list
            | 'Transform story objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'STORY MIGRATED'))
        )

        cache_deletion_job_run_results = (
            story_objects_list
            | 'Delete story from cache' >> beam.Map(
                lambda story_objects: self._delete_story_from_cache(
                    story_objects['story']))
            | 'Generate results for cache deletion' >> (
                job_result_transforms.ResultsToJobRunResults('CACHE DELETION'))
        )

        story_models_to_put = (
            story_objects_list
            | 'Generate story models to put' >> beam.FlatMap(
                lambda story_objects: self._update_story(
                    story_objects['story_model'],
                    story_objects['story'],
                    story_objects['story_change'],
                ))
        )

        story_summary_models_to_put = (
            story_objects_list
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

        return (
            (
                cache_deletion_job_run_results,
                migrated_story_job_run_results,
                story_objects_list_job_run_results
            )
            | beam.Flatten()
        )
