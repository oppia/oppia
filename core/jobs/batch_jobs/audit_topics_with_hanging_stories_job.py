# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""Audit jobs that check for hanging story references in topics.
A story is considered "hanging" if a TopicModel references it in its
canonical_story_references list, but the corresponding StoryModel does
not exist in the datastore.
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Iterable, List, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import story_models, topic_models

(topic_models, story_models) = models.Registry.import_models(
    [models.Names.TOPIC, models.Names.STORY]
)


class AuditTopicsWithHangingStoriesJob(base_jobs.JobBase):
    """Job that finds and reports topics with hanging story references."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of topics having hanging story references.

        Returns:
            PCollection. A PCollection of JobRunResult objects, each
            representing a topic with one or more hanging story references.
        """
        topic_models_pcoll = (
            self.pipeline
            | 'Get all TopicModels'
            >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False)
            )
        )

        all_story_ids_pcoll = (
            self.pipeline
            | 'Get all StoryModels'
            >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False)
            )
            | 'Extract story IDs'
            >> beam.Map(lambda story_model: story_model.id)
        )

        hanging_stories_pcoll = (
            topic_models_pcoll
            | 'Find hanging stories in topics'
            >> beam.ParDo(
                FindHangingStoriesInTopic(),
                all_story_ids=beam.pvalue.AsList(all_story_ids_pcoll),
            )
            | 'Filter out topics with no hanging stories'
            >> beam.Filter(lambda result: len(result[1]) > 0)
            | 'Format the results'
            >> beam.Map(
                lambda result: job_run_result.JobRunResult.as_stdout(
                    f'Topic with ID: {result[0]} has hanging story references: {", ".join(result[1])}.'
                )
            )
        )

        return hanging_stories_pcoll


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class FindHangingStoriesInTopic(beam.DoFn):  # type: ignore[misc]
    """DoFn to check for hanging story references within a single TopicModel."""

    def process(
        self, topic_model: topic_models.TopicModel, all_story_ids: List[str]
    ) -> Iterable[Tuple[str, List[str]]]:
        """Checks a topic for canonical story references that don't exist.

        Args:
            topic_model: TopicModel. The TopicModel to check.
            all_story_ids: List[str]. A list containing all existing story IDs.
                This is passed as a side input.

        Yields:
            Tuple[str, List[str]]. A tuple of (topic_id, list_of_hanging_story_ids).
        """
        all_story_ids_set = set(all_story_ids)
        hanging_story_ids: List[str] = []

        for story_ref_dict in topic_model.canonical_story_references:
            # Check if the item is a dictionary and if it has a 'story_id' key.
            if (
                not isinstance(story_ref_dict, dict)
                or 'story_id' not in story_ref_dict
            ):
                hanging_story_ids.append('INVALID_REFERENCE (malformed entry)')
                continue

            story_id = story_ref_dict['story_id']

            # Check if the story_id is a string.
            if not isinstance(story_id, str):
                hanging_story_ids.append(
                    f'INVALID_REFERENCE (non-string story_id: {type(story_id).__name__})'
                )
            # Check if the story with the given ID exists.
            elif story_id not in all_story_ids_set:
                hanging_story_ids.append(story_id)

        yield (topic_model.id, hanging_story_ids)
