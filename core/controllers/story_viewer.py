# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the story viewer page"""

from __future__ import annotations

import logging

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import learner_progress_services
from core.domain import question_services
from core.domain import skill_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import summary_services
from core.domain import topic_fetchers

from typing import Dict, List, Optional, Tuple


class FrontendStoryNodeDict(story_domain.StoryNodeDict):
    """Dictionary representing the StoryNode domain object for frontend."""

    completed: bool
    exp_summary_dict: summary_services.DisplayableExplorationSummaryDict


class StoryPageDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Manages the data that needs to be displayed to a learner on the
    story viewer page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'story_url_fragment': constants.SCHEMA_FOR_STORY_URL_FRAGMENTS,
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_story_viewer_page
    def get(self, story_id: str) -> None:
        """Retrieves and organizes the data needed to display a story.

        Args:
            story_id: str. The story ID.
        """
        story = story_fetchers.get_story_by_id(story_id)
        topic_id = story.corresponding_topic_id
        topic_name = topic_fetchers.get_topic_by_id(topic_id).name

        completed_nodes = (
            story_fetchers.get_completed_nodes_in_story(self.user_id, story_id)
            if self.user_id else []
        )
        completed_node_ids = [
            completed_node.id for completed_node in completed_nodes
        ]
        # Here we use MyPy ignore because we are explicitly changing
        # the type from the list of 'StoryNodeDict' to the list of
        # 'FrontendStoryNodeDict', and this is done because below we
        # are adding new keys that are not defined on the 'StoryNodeDict'.
        ordered_node_dicts: List[FrontendStoryNodeDict] = [
            node.to_dict() for node in story.story_contents.get_ordered_nodes()  # type: ignore[misc]
        ]
        for node in ordered_node_dicts:
            node['completed'] = False
            if node['id'] in completed_node_ids:
                node['completed'] = True

        exp_ids = [
            node['exploration_id'] for node in ordered_node_dicts
            if node['exploration_id'] is not None
        ]
        exp_summary_dicts = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                exp_ids, user=self.user))

        for ind, node in enumerate(ordered_node_dicts):
            node['exp_summary_dict'] = exp_summary_dicts[ind]

        self.values.update({
            'story_id': story.id,
            'story_title': story.title,
            'story_description': story.description,
            'story_nodes': ordered_node_dicts,
            'topic_name': topic_name,
            'meta_tag_content': story.meta_tag_content
        })
        self.render_json(self.values)


class StoryProgressHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Marks a story node as completed after completing and returns exp ID of
    next chapter (if applicable).
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'story_url_fragment': constants.SCHEMA_FOR_STORY_URL_FRAGMENTS,
        'node_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': ('%s[0-9]+' % story_domain.NODE_ID_PREFIX)
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {},
        'POST': {}
    }

    def _record_node_completion(
        self,
        story_id: str,
        node_id: str,
        completed_node_ids: List[str],
        ordered_nodes: List[story_domain.StoryNode]
    ) -> Tuple[List[str], Optional[str], List[str]]:
        """Records node completion.

        Args:
            story_id: str. The story ID.
            node_id: str. The node ID.
            completed_node_ids: List[str]. A list of IDS of completed nodes.
            ordered_nodes: List[story_domain.StoryNode]. A list of story
                nodes in order.

        Returns:
            3-Tuple(next_exp_ids, next_node_id, completed_node_ids). Where:
                next_exp_ids: List[str]. The next_exp_ids list contains
                    the exploration IDs of the next node(s) to be explored
                next_node_id: str. The ID of the next node to be explored.
                completed_node_ids: List[str]. An updated list of IDS that
                    represents all the nodes the user has completed.

        Raises:
            NotFoundException. The new structure viewer updates are
                not enabled, or the provided story_id or node_id is invalid.
        """
        assert self.user_id is not None

        try:
            story_fetchers.get_node_index_by_story_id_and_node_id(
                story_id, node_id)
        except Exception as e:
            raise self.NotFoundException(e)

        next_exp_ids = []
        next_node_id = None
        if node_id not in completed_node_ids:
            story_services.record_completed_node_in_story_context(
                self.user_id, story_id, node_id)

            completed_nodes = story_fetchers.get_completed_nodes_in_story(
                self.user_id, story_id
            ) if self.user_id else []
            completed_node_ids = [
                completed_node.id for completed_node in completed_nodes]

            for node in ordered_nodes:
                if node.id not in completed_node_ids:
                    next_exp_ids = (
                        [node.exploration_id] if node.exploration_id else []
                    )
                    next_node_id = node.id
                    break
        return (next_exp_ids, next_node_id, completed_node_ids)

    @acl_decorators.can_access_story_viewer_page_as_logged_in_user
    def get(self, story_id: str, node_id: str) -> None:
        """Redirects the user to the next appropriate node or the story page.

        Args:
            story_id: str. The story ID.
            node_id: str. The node ID.
        """
        (
            _, _, classroom_url_fragment, topic_url_fragment,
            story_url_fragment, node_id) = self.request.path.split('/')
        story = story_fetchers.get_story_by_id(story_id)
        completed_nodes = story_fetchers.get_completed_nodes_in_story(
            self.user_id, story_id
        ) if self.user_id else []
        ordered_nodes = story.story_contents.get_ordered_nodes()

        # In case the user is a returning user and has completed nodes in the
        # past, redirect to the story page so that the user can continue from
        # where they had left off.
        # If the node id is not the first node in the story, redirect to
        # the story page.
        if completed_nodes or node_id != ordered_nodes[0].id:
            self.redirect(
                '/learn/%s/%s/story/%s' % (
                    classroom_url_fragment, topic_url_fragment,
                    story_url_fragment))
            return

        (next_exp_ids, next_node_id, _) = (
            self._record_node_completion(story_id, node_id, [], ordered_nodes))
        if next_node_id is None:
            self.redirect(
                '/learn/%s/%s/story/%s' % (
                    classroom_url_fragment, topic_url_fragment,
                    story_url_fragment))
            return

        redirect_url = '%s/%s' % (
            feconf.EXPLORATION_URL_PREFIX, next_exp_ids[0])
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'classroom_url_fragment', classroom_url_fragment)
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'topic_url_fragment', topic_url_fragment)
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'story_url_fragment', story_url_fragment)
        redirect_url = utils.set_url_query_parameter(
            redirect_url, 'node_id', next_node_id)

        self.redirect(redirect_url)

    @acl_decorators.can_access_story_viewer_page_as_logged_in_user
    def post(self, story_id: str, node_id: str) -> None:
        """Records the completion of a specific node within a story.

        Args:
            story_id: str. The story ID.
            node_id: str. The node ID.
        """
        assert self.user_id is not None
        story = story_fetchers.get_story_by_id(story_id)
        if story is None:
            logging.error(
                'Could not find a story corresponding to '
                '%s id.' % story_id)
            self.render_json({})
            return
        topic = topic_fetchers.get_topic_by_id(story.corresponding_topic_id)
        completed_nodes = story_fetchers.get_completed_nodes_in_story(
            self.user_id, story_id)
        completed_node_ids = [
            completed_node.id for completed_node in completed_nodes]
        ordered_nodes = story.story_contents.get_ordered_nodes()

        (next_exp_ids, next_node_id, completed_node_ids) = (
            self._record_node_completion(
                story_id, node_id, completed_node_ids, ordered_nodes))

        ready_for_review_test = False
        exp_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                next_exp_ids))

        # If there are no questions for any of the acquired skills that the
        # learner has completed, do not show review tests.
        acquired_skills = skill_fetchers.get_multi_skills(
            story.get_acquired_skill_ids_for_node_ids(
                completed_node_ids
            ))

        acquired_skill_ids = [skill.id for skill in acquired_skills]
        questions_available = len(
            question_services.get_questions_by_skill_ids(
                1, acquired_skill_ids, False)) > 0

        learner_completed_story = len(completed_node_ids) == len(ordered_nodes)
        learner_at_review_point_in_story = (
            len(exp_summaries) != 0 and (
                len(completed_node_ids) &
                constants.NUM_EXPLORATIONS_PER_REVIEW_TEST == 0)
        )
        if questions_available and (
                learner_at_review_point_in_story or learner_completed_story):
            ready_for_review_test = True

        # If there is no next_node_id, the story is marked as completed else
        # mark the story as incomplete.
        if next_node_id is None:
            learner_progress_services.mark_story_as_completed(
                self.user_id, story_id)
        else:
            learner_progress_services.record_story_started(
                self.user_id, story.id)

        completed_story_ids = (
            learner_progress_services.get_all_completed_story_ids(
                self.user_id))
        story_ids_in_topic = []
        for story_reference in topic.canonical_story_references:
            story_ids_in_topic.append(story_reference.story_id)

        is_topic_completed = set(story_ids_in_topic).intersection(
            set(completed_story_ids))

        # If at least one story in the topic is completed,
        # mark the topic as learnt else mark it as partially learnt.
        if not is_topic_completed:
            learner_progress_services.record_topic_started(
                self.user_id, topic.id)
        else:
            learner_progress_services.mark_topic_as_learnt(
                self.user_id, topic.id)

        self.render_json({
            'summaries': exp_summaries,
            'ready_for_review_test': ready_for_review_test,
            'next_node_id': next_node_id
        })
