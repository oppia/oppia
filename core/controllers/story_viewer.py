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
import feconf


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

        completed_nodes = [completed_node.to_dict()
                           for completed_node in
                           story_services.get_completed_nodes_in_story(
                               self.user_id, story_id)]

        pending_nodes = [pending_node.to_dict()
                         for pending_node in
                         story_services.get_pending_nodes_in_story(
                             self.user_id, story_id)]

        self.values.update({
            'story_title': story.title,
            'story_description': story.description,
            'completed_nodes': completed_nodes,
            'pending_nodes': pending_nodes
        })
        self.render_json(self.values)
