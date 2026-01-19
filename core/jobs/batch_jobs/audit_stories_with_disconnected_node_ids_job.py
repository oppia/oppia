# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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


"""Audit job that checks for stories with disconnected node ids.
A story is considered to have "disconnected node ids" if it contains
nodes which should have had "destination_node_ids" but do not
have them.
"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Iterable, List, Optional, Tuple, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import story_models

(topic_models, story_models) = models.Registry.import_models(
    [models.Names.TOPIC, models.Names.STORY]
)


class StoryNodeDict(TypedDict):
    """Class defining the node object."""

    id: str
    title: str
    description: str
    thumbnail_filename: str
    thumbnail_bg_color: str
    thumbnail_size_in_bytes: int
    destination_node_ids: List[str]
    acquired_skill_ids: List[str]
    prerequisite_skill_ids: List[str]
    outline: str
    outline_is_finalized: bool
    exploration_id: str
    status: str
    planned_publication_date_msecs: Optional[float]
    last_modified_msecs: Optional[float]
    first_publication_date_msecs: Optional[float]
    unpublishing_reason: Optional[str]


class StoryContentsDict(TypedDict):
    """Class defining the StoryContent Dict."""

    nodes: List[StoryNodeDict]
    initial_node_id: str
    next_node_id: str


class AuditStoriesWithDisconnectedNodeIdsJob(base_jobs.JobBase):
    """Class to audit stories with disconnected node ids."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        all_stories_info_pcoll = (
            self.pipeline
            | 'Get all StoryModels'
            >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False)
            )
            | 'Extract Id and Story contents'
            >> beam.Map(lambda story: (story.id, story.story_contents))
        )

        stories_with_disconnected_node = (
            all_stories_info_pcoll
            | 'Find story ids with disconnected nodes'
            >> beam.ParDo(CheckDisconnectedNodeIds())
        )

        return stories_with_disconnected_node


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class CheckDisconnectedNodeIds(beam.DoFn):  # type: ignore[misc]
    """DoFn to check for disconnected node_ids in stories."""

    def process(
        self, element: Tuple[str, StoryContentsDict]
    ) -> Iterable[job_run_result.JobRunResult]:
        story_id, story_contents = element

        nodes = story_contents['nodes']
        num_nodes = len(nodes)
        if num_nodes == 0:
            yield job_run_result.JobRunResult.as_stdout(
                f'Story ID: {story_id} has no nodes.'
            )
            return
        all_destination_ids = set()
        for node in nodes:
            for dest_id in node['destination_node_ids']:
                if dest_id is not None:
                    all_destination_ids.add(dest_id)

        if (num_nodes - 1) > len(all_destination_ids):
            yield job_run_result.JobRunResult.as_stdout(
                f'Story ID: {story_id} has disconnected nodes.'
            )
        else:
            yield job_run_result.JobRunResult.as_stdout(
                f'SUCCESS: {story_id} has no disconnected nodes.'
            )
