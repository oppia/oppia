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

"""Jobs used for populating story node."""

from __future__ import annotations

import logging

from core import utils
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import story_models
    from mypy_imports import topic_models

(story_models, topic_models) = models.Registry.import_models([
    models.Names.STORY, models.Names.TOPIC])
datastore_services = models.Registry.import_datastore_services()


class PopulateStoryNodeJob(base_jobs.JobBase):
    """Job that populates the story nodes with 5 new fields, namely: status,
    planned_publication_date_msecs, last_modified_msecs,
    first_publication_date_msecs and unpublishing_reason for serial chapter
    launch feature.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def _update_story_node(self, topic_story_list: Tuple[
        List[topic_models.TopicModel],
        List[story_models.StoryModel]]) -> result.Result[
            List[story_models.StoryModel],
            Tuple[str, Exception]
        ]:
        """Populate the 5 new fields in each story node of the StoryModel
        instance, namely: status, planned_publication_date_msecs,
        last_modified_msecs, first_publication_date_msecs, unpublishing_reason.

        Args:
            topic_story_list: Tuple[List[TopicModel], List[StoryModel]]. The
                list of stories whose nodes have to be populated, grouped by
                their topics.

        Returns:
            Result(List[StoryModel], (str, Exception)). Result containing the
            list of updated StoryModel instances to be put.
        """

        updated_story_model_list = []
        with datastore_services.get_ndb_context():
            try:
                topic_model = topic_story_list[0][0]
                story_model_list = topic_story_list[1]
                for story_model in story_model_list:
                    nodes = story_model.story_contents['nodes']
                    story_reference = next(
                        story_ref for story_ref in (
                            topic_model.canonical_story_references)
                            if story_ref['story_id'] == story_model.id)
                    for node in nodes:
                        node['unpublishing_reason'] = None
                        node['status'] = 'Draft'
                        if story_reference['story_is_published']:
                            node['status'] = 'Published'

                        current_topic_version = topic_model.version
                        story_published_on = None
                        for version in range(current_topic_version, 0, -1):
                            snapshot_id = topic_model.get_snapshot_id(
                                topic_model.id, version)
                            topic_metadata = (
                                topic_models.TopicSnapshotMetadataModel.get(
                                    snapshot_id))
                            for cmd in topic_metadata.commit_cmds:
                                if (cmd['cmd'] == 'publish_story' and
                                    cmd['story_id'] == story_model.id):
                                    story_published_on = (
                                        utils.get_time_in_millisecs(
                                        topic_metadata.created_on))
                                    break
                            if story_published_on is not None:
                                break

                        current_story_version = story_model.version
                        node_created_on = None
                        for version in range(current_story_version, 0, -1):
                            snapshot_id = story_model.get_snapshot_id(
                                    story_model.id, version)
                            story_metadata = (
                                story_models.StorySnapshotMetadataModel.get(
                                    snapshot_id))
                            for cmd in story_metadata.commit_cmds:
                                if (cmd['cmd'] == 'update_story_node_property'
                                    and cmd['node_id'] == node['id'] and
                                    node.get('last_modified_msecs') is None):
                                    node['last_modified_msecs'] = (
                                        utils.get_time_in_millisecs(
                                        story_metadata.created_on))

                                if (cmd['cmd'] == 'add_story_node' and
                                    cmd['node_id'] == node['id']):
                                    node_created_on = (
                                        utils.get_time_in_millisecs(
                                        story_metadata.created_on))
                                    break
                            if node_created_on is not None:
                                break

                        if node_created_on is None:
                            raise Exception(
                                'Node was not created.'
                            )

                        node_published_on = story_published_on if (
                            story_published_on is not None and
                            node_created_on is not None and
                            story_published_on > node_created_on) else (
                                node_created_on)
                        node['first_publication_date_msecs'] = (
                            node_published_on if node['status'] == 'Published'
                            else None)
                        node['planned_publication_date_msecs'] = (
                            node['first_publication_date_msecs'])
                        if node.get('last_modified_msecs') is None:
                            node['last_modified_msecs'] = node_published_on

                    updated_story_model_list.append(story_model)

            except Exception as e:
                logging.exception(e)
                return result.Err((story_model.id, e))
        return result.Ok(updated_story_model_list)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:

        fetched_story_models = (
            self.pipeline
            | 'Get story models' >> ndb_io.GetModels(
                story_models.StoryModel.get_all())
            | 'Add corresponding topic Ids as keys' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda story_model: story_model.corresponding_topic_id)
        )

        fetched_topic_models = (
            self.pipeline
            | 'Get topic models' >> ndb_io.GetModels(
                topic_models.TopicModel.get_all())
            | 'Add topic Ids as keys' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda topic_model: topic_model.id)
        )

        topic_story_pairs = (
            (fetched_topic_models, fetched_story_models)
            | 'Merge topic and story models' >> beam.CoGroupByKey()
            | 'Get rid of topic ID' >> beam.Values() # pylint: disable=no-value-for-parameter
        )

        updated_story_models_results = (
            topic_story_pairs
            | 'Update story node fields' >> beam.Map(self._update_story_node)
        )

        updated_story_models_job_results = (
            updated_story_models_results
            | job_result_transforms.ResultsToJobRunResults(
                    'TOPIC MODELS WHOSE STORIES ARE UPDATED')
        )

        filtered_migrated_stories = (
            updated_story_models_results
            | 'Filter migration results' >> (
                results_transforms.DrainResultsOnError())
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                filtered_migrated_stories
                | 'Unwrap story models lists' >> beam.Map(
                    lambda result_item: result_item.unwrap())
                | 'Flatten story models lists' >> beam.FlatMap(lambda x: x)
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return updated_story_models_job_results


class AuditPopulateStoryNodeJob(PopulateStoryNodeJob):
    """Job that audits PopulateStoryNodeJob."""

    DATASTORE_UPDATES_ALLOWED = False
