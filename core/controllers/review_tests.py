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
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import dependency_registry
from core.domain import interaction_registry
from core.domain import skill_services
from core.domain import story_services
import feconf

import jinja2  # pylint: disable=wrong-import-order

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class ReviewTestsPage(base.BaseHandler):
    """Renders the review tests page."""

    @acl_decorators.can_access_story_viewer_page
    def get(self, _):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        interaction_ids = feconf.ALLOWED_QUESTION_INTERACTION_IDS

        interaction_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                interaction_dependency_ids))

        interaction_templates = (
            interaction_registry.Registry.get_interaction_html(
                interaction_ids))

        self.values.update({
            'additional_angular_modules': additional_angular_modules,
            'INTERACTION_SPECS': interaction_registry.Registry.get_all_specs(),
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates),
            'dependencies_html': jinja2.utils.Markup(dependencies_html),
        })
        self.render_template('dist/review-test-page.mainpage.html')


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

        story = story_services.get_story_by_id(story_id)
        latest_completed_node_ids = (
            story_services.get_latest_completed_node_ids(self.user_id, story_id)
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
