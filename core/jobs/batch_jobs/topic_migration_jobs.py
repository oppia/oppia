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

"""Jobs used for migrating the topic models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import caching_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import story_models
    from mypy_imports import topic_models

(base_models, story_models, topic_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.story, models.NAMES.topic])
datastore_services = models.Registry.import_datastore_services()


class MigrateTopicJob(base_jobs.JobBase):
    """Job that migrates topic models."""

    @staticmethod
    def _migrate_topic(
        topic_id:str,
        topic_model: topic_models.TopicModel
    ) -> result.Result[Tuple[str, topic_domain.Topic], Tuple[str, Exception]]:
        """Migrates topic and transform topic model into topic object.

        Args:
            topic_id: str. The id of the topic.
            topic_model: TopicModel. The topic model to migrate.

        Returns:
            Result((str, Topic), (str, Exception)). Result containing tuple that
            consist of topic ID and either topic object or Exception. Topic
            object is returned when the migration was successful and Exception
            is returned otherwise.
        """
    try:
        topic = topic_fetchers.get_topic_from_model(topic_model)
        topic.validate()
    except Exception as e:
        logging.exception(e)
        return result.Err((topic_id, e))

    return resutlt.Ok((topic_id, topic))

    @staticmethod
    def _generate_topic_changes(
        topic_id:str,
        topic_model: topic_models.TopicModel
    ) -> Iterable[Tuple[str, topic_domain.TopicChange]]:
        """Generates topic change objects. Topic change object is generated when
        schema version for some field is lower than the latest schema version.

        Args:
            topic_id: str. The ID of the topic.
            topic_model: TopicModel. The topic for which to generate the change
                objects.

        Yeilds:
            (str, TopicChange). Tuple containing Topic ID and topic change
            object.
        """
        subtopic_version = topic_model.subtopic_schema_version
        if subtopic_version < feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION:
            topic_change = topic_domain.TopicChange({
                'cmd': (
                    topic_domain.CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION),
                'from_version': subtopic_version,
                'to_version': feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION
            })
            yield (topic_id, topic_change)

    @staticmethod
    def _delete_topic_from_cache(
        topic: topic_domain.Topic
    ) -> result.Result[str, Exception]:
        """Deletes topic from cache.

        Args:
            topic: Topic. The topic which should be deleted from cache.

        Returns:
            Result(str, Exception). The id of the story when the deletion was
            successful or Exception when the deletion failed.
        """
        try:
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_TOPIC, None, [topic.id])
            return result.Ok(topic_id)
        except Exception as e:
            return result.Err(e)

    @staticmethod
    def _update_topic(
        topic_model:topic_models.TopicModel,
        migrated_topic: topic_domain.Topic,
        topic_change: topic_domain.TopicChange
    ) -> Sequence[base_models.BaseModel]:
        """Generates newly updated topic models.

        Args:
            topic_model: TopicModel. The topic which should be updated.
            migrated_topic: Topic. The migrated topic domain object.
            topic_change: TopicChange. The topic change to apply.

        Returns:
            sequence(BaseModel). Sequence of models which should be put into
            the datastore.
        """
        updated_topic_model = topic_services.populate_topic_model_fields(
            topic_model, migrated_topic)
        change_dicts = [topic_change.to_dict()]
        with datastore_services.get_ndb_context():
            models_to_put = updated_topic_model.compute_models_to_commit(
                feconf.MIGRATION_BOT_USER_ID,
                feconf.COMMIT_TYPE_EDIT,
                'Update subtopic contents schema version to %d.' %(
                    feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION),
                change_dicts,
                additional_models={}
            ).values()
        datastore_services.update_timestamps_multi(list(models_to_put))
        return models_to_put

    @staticmethod
    def _update_topic_summary(
        migrated_topic: topic_domain.Topic,
        topic_summary_model: topic_models.TopicSummaryModel
    ) -> topic_models.TopicSummaryModel:
        """Generates newly updated topic summary model.

        Args:
            migrated_topic: Topic. The migrated topic domain object.
            topic_summary_model: TopicSummaryModel. The topic summary model to
                update.

        Returns:
            TopicSummaryModel. The updated topic summary model to put into the
            datastore.
        """
        topic_summary = topic_services.compute_summary_of_topic(migrated_topic)
        topic_summary.version += 1
        updated_topic_summary_model = (
            topic_services.populate_topic_summary_model_fields(
                topic_summary_model, topic_summary
            )
        )
        return updated_topic_summary_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
