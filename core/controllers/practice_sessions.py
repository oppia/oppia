# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the practice sessions page."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators, base
from core.domain import (
    skill_fetchers,
    story_domain,
    story_fetchers,
    topic_domain,
    topic_fetchers,
)

from typing import Dict, List, Optional, TypedDict


class PracticeSessionsPageDataHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of PracticeSessionsPageDataHandler's
    normalized_request dictionary.
    """

    selected_subtopic_ids: Optional[List[int]]
    skill_ids: Optional[List[str]]


class PracticeSessionsPageDataHandler(
    base.BaseHandler[
        Dict[str, str], PracticeSessionsPageDataHandlerNormalizedRequestDict
    ]
):
    """Fetches relevant data for the practice sessions page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'node_id': {
            'schema': {'type': 'basestring'},
            'default_value': None,
        },
        'arc_id': {
            'schema': {'type': 'basestring'},
            'default_value': None,
        },
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'selected_subtopic_ids': {
                'schema': {'type': 'custom', 'obj_type': 'JsonEncodedInString'},
                'default_value': None,
            },
            'skill_ids': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString',
                },
                'default_value': None,
            },
        }
    }

    @acl_decorators.can_access_topic_viewer_page
    def get(self, topic_name: str, **kwargs: str) -> None:
        """Retrieves information about a topic.

        Args:
            topic_name: str. The topic name.
            **kwargs: str. The keyword arguments.

        Raises:
            NotFoundException. The page cannot be found.
        """
        assert self.normalized_request is not None
        # Topic cannot be None as an exception will be thrown from its decorator
        # if so.
        topic = topic_fetchers.get_topic_by_name(topic_name)
        selected_subtopic_ids = self.normalized_request.get(
            'selected_subtopic_ids'
        )
        skill_ids = self.normalized_request.get('skill_ids')
        node_id = self.request.route_kwargs.get('node_id')
        arc_id = self.request.route_kwargs.get('arc_id')

        if skill_ids is not None:
            if not isinstance(skill_ids, list) or not all(
                isinstance(s, str) for s in skill_ids
            ):
                raise self.InvalidInputException('Invalid skill_ids')
            if len(skill_ids) == 0:
                raise self.InvalidInputException('Empty skill_ids provided.')

        selected_skill_ids: List[str] = []
        if skill_ids is not None:
            selected_skill_ids = skill_ids
        elif selected_subtopic_ids is not None:
            for subtopic in topic.subtopics:
                if subtopic.id in selected_subtopic_ids:
                    selected_skill_ids.extend(subtopic.skill_ids)
        elif node_id is not None:
            selected_skill_ids = self._get_skill_ids_for_node(topic, node_id)
        elif arc_id is not None:
            selected_skill_ids = self._get_skill_ids_for_arc(topic, arc_id)
        else:
            # Mastery challenge: collect all skills from all subtopics.
            for subtopic in topic.subtopics:
                selected_skill_ids.extend(subtopic.skill_ids)

        try:
            skills = skill_fetchers.get_multi_skills(selected_skill_ids)
        except Exception as e:
            raise self.NotFoundException(e)
        skill_ids_to_descriptions_map = {}
        for skill in skills:
            skill_ids_to_descriptions_map[skill.id] = skill.description

        self.values.update(
            {
                'topic_name': topic.name,
                'skill_ids_to_descriptions_map': skill_ids_to_descriptions_map,
            }
        )
        self.render_json(self.values)

    def _get_all_nodes_for_topic(
        self, topic: topic_domain.Topic
    ) -> List[story_domain.StoryNode]:
        """Returns all nodes across all published stories in the topic.

        Args:
            topic: Topic. The topic object.

        Returns:
            list(StoryNode). All nodes in order.
        """
        story_ids = topic.get_canonical_story_ids(include_only_published=True)
        story_ids.extend(
            topic.get_additional_story_ids(include_only_published=True)
        )
        stories = story_fetchers.get_stories_by_ids(story_ids)
        all_nodes: List[story_domain.StoryNode] = []
        for story in stories:
            if story is None:
                continue
            all_nodes.extend(story.story_contents.nodes)
        return all_nodes

    def _get_all_arcs_for_topic(
        self, topic: topic_domain.Topic
    ) -> List[story_domain.Arc]:
        """Returns all arcs across all published stories in the topic.

        Args:
            topic: Topic. The topic object.

        Returns:
            list(Arc). All arcs in order.
        """
        story_ids = topic.get_canonical_story_ids(include_only_published=True)
        story_ids.extend(
            topic.get_additional_story_ids(include_only_published=True)
        )
        stories = story_fetchers.get_stories_by_ids(story_ids)
        all_arcs: List[story_domain.Arc] = []
        for story in stories:
            if story is None:
                continue
            all_arcs.extend(story.story_contents.arcs)
        return all_arcs

    def _get_skill_ids_for_node(
        self, topic: topic_domain.Topic, node_id: str
    ) -> List[str]:
        """Returns skill IDs associated with a given story node.

        The node_id parameter is a 1-based index that maps to the nth node
        across all published stories in the topic.

        Args:
            topic: Topic. The topic object.
            node_id: str. The node ID (1-based index).

        Returns:
            list(str). The skill IDs for the node.
        """
        try:
            node_index = int(node_id)
        except ValueError:
            return []

        if node_index < 1:
            return []

        all_nodes = self._get_all_nodes_for_topic(topic)
        if node_index > len(all_nodes):
            return []

        node = all_nodes[node_index - 1]
        return node.acquired_skill_ids

    def _get_skill_ids_for_arc(
        self, topic: topic_domain.Topic, arc_id: str
    ) -> List[str]:
        """Returns skill IDs associated with all nodes in a given arc.

        The arc_id parameter is a 1-based index that maps to the nth arc
        across all published stories in the topic.

        Args:
            topic: Topic. The topic object.
            arc_id: str. The arc index (e.g., '1').

        Returns:
            list(str). The skill IDs for all nodes in the arc.
        """
        try:
            arc_index = int(arc_id)
        except ValueError:
            return []

        if arc_index < 1:
            return []

        all_arcs = self._get_all_arcs_for_topic(topic)
        if arc_index > len(all_arcs):
            return []

        arc = all_arcs[arc_index - 1]

        # Find the story that contains this arc to get the node IDs.
        story_ids = topic.get_canonical_story_ids(include_only_published=True)
        story_ids.extend(
            topic.get_additional_story_ids(include_only_published=True)
        )
        stories = story_fetchers.get_stories_by_ids(story_ids)
        for story in stories:
            if story is None:
                continue
            for story_arc in story.story_contents.arcs:
                if story_arc.id == arc.id:
                    return story.get_acquired_skill_ids_for_node_ids(
                        arc.node_ids
                    )
        return []
