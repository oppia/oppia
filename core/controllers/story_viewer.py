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

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
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

        self.render_template('dist/story-viewer-page.mainpage.html')


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

        story = story_services.get_story_by_id(story_id)

        completed_node_ids = [
            completed_node.id for completed_node in
            story_services.get_completed_nodes_in_story(self.user_id, story_id)]

        ordered_nodes_dict = [
            node.to_dict() for node in story.story_contents.get_ordered_nodes()
        # TODO(aks681): Once the story publication is done, add a check so that
        # only if all explorations in the story are published, can the story
        # itself be published. After which, remove the following condition.
            if node.exploration_id]
        for node in ordered_nodes_dict:
            node['completed'] = False
            if node['id'] in completed_node_ids:
                node['completed'] = True

        exp_ids = [
            node['exploration_id'] for node in ordered_nodes_dict]
        exp_summary_dicts = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                exp_ids, user=self.user))
        exp_summaries_dict_map = {
            exp_summary_dict['id']: exp_summary_dict
            for exp_summary_dict in exp_summary_dicts
        }

        for node in ordered_nodes_dict:
            node['exp_summary_dict'] = exp_summaries_dict_map[
                node['exploration_id']]

        self.values.update({
            'story_title': story.title,
            'story_description': story.description,
            'story_nodes': ordered_nodes_dict
        })
        self.render_json(self.values)
