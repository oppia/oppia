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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import summary_services
import feconf


class StoryPage(base.BaseHandler):
    """Page describing a single story."""

    @acl_decorators.can_access_story_viewer_page
    def get(self, _):
        """Handles GET requests."""
        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        self.render_template('story-viewer-page.mainpage.html')


class StoryPageDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the
    story viewer page.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_story_viewer_page
    def get(self, story_id):
        """Handles GET requests."""
        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        story = story_fetchers.get_story_by_id(story_id)

        completed_node_ids = [
            completed_node.id for completed_node in
            story_fetchers.get_completed_nodes_in_story(self.user_id, story_id)]

        ordered_node_dicts = [
            node.to_dict() for node in story.story_contents.get_ordered_nodes()
        ]
        for node in ordered_node_dicts:
            node['completed'] = False
            if node['id'] in completed_node_ids:
                node['completed'] = True

        exp_ids = [
            node['exploration_id'] for node in ordered_node_dicts]
        exp_summary_dicts = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                exp_ids, user=self.user))

        for ind, node in enumerate(ordered_node_dicts):
            node['exp_summary_dict'] = exp_summary_dicts[ind]

        self.values.update({
            'story_title': story.title,
            'story_description': story.description,
            'story_nodes': ordered_node_dicts
        })
        self.render_json(self.values)


class StoryProgressHandler(base.BaseHandler):
    """Marks a story node as completed after completing and returns exp ID of
    next chapter (if applicable).
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_story_viewer_page
    def post(self, story_id, node_id):
        if not constants.ENABLE_NEW_STRUCTURE_VIEWER_UPDATES:
            raise self.PageNotFoundException

        try:
            story_fetchers.get_node_index_by_story_id_and_node_id(
                story_id, node_id)
        except Exception as e:
            raise self.PageNotFoundException(e)

        story = story_fetchers.get_story_by_id(story_id)
        completed_nodes = story_fetchers.get_completed_nodes_in_story(
            self.user_id, story_id)
        completed_node_ids = [
            completed_node.id for completed_node in completed_nodes]

        ordered_nodes = [
            node for node in story.story_contents.get_ordered_nodes()
        ]

        next_exp_ids = []
        next_node_id = None
        if not node_id in completed_node_ids:
            story_services.record_completed_node_in_story_context(
                self.user_id, story_id, node_id)

            completed_nodes = story_fetchers.get_completed_nodes_in_story(
                self.user_id, story_id)
            completed_node_ids = [
                completed_node.id for completed_node in completed_nodes]

            for node in ordered_nodes:
                if node.id not in completed_node_ids:
                    next_exp_ids = [node.exploration_id]
                    next_node_id = node.id
                    break

        ready_for_review_test = False
        exp_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                next_exp_ids))

        if (
                (len(exp_summaries) != 0 and
                 len(completed_nodes) %
                 constants.NUM_EXPLORATIONS_PER_REVIEW_TEST == 0) or
                (len(completed_nodes) == len(ordered_nodes))):
            ready_for_review_test = True

        return self.render_json({
            'summaries': exp_summaries,
            'ready_for_review_test': ready_for_review_test,
            'next_node_id': next_node_id
        })
