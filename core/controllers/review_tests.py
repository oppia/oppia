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

"""Controllers for the review tests page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_services
from core.domain import story_fetchers
import feconf


class ReviewTestsPage(base.BaseHandler):
    """Renders the review tests page."""

    @acl_decorators.can_access_story_viewer_page
    def get(self, _):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        self.render_template('review-test-page.mainpage.html')


class ReviewTestsPageDataHandler(base.BaseHandler):
    """Fetches relevant data for the review tests page. This handler should
    be called only if the user has completed at least one exploration in
    the story.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_story_viewer_page
    def get(self, story_id):
        """Handles GET requests."""
        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        story = story_fetchers.get_story_by_id(story_id)
        latest_completed_node_ids = (
            story_fetchers.get_latest_completed_node_ids(self.user_id, story_id)
        )

        if len(latest_completed_node_ids) == 0:
            raise self.PageNotFoundException

        try:
            skills = skill_services.get_multi_skills(
                story.get_acquired_skill_ids_for_node_ids(
                    latest_completed_node_ids
                ))
        except Exception as e:
            raise self.PageNotFoundException(e)
        skill_descriptions = {}
        for skill in skills:
            skill_descriptions[skill.id] = skill.description


        self.values.update({
            'skill_descriptions': skill_descriptions,
            'story_name': story.title
        })
        self.render_json(self.values)
