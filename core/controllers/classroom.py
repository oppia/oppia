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

"""Controllers for the classroom page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
from core.domain import topic_services
import feconf


class ClassroomPage(base.BaseHandler):
    """Renders the classroom page."""

    @acl_decorators.open_access
    def get(self, classroom_name):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        classroom_name_is_valid = False
        for classroom_dict in config_domain.TOPIC_IDS_FOR_CLASSROOM_PAGES.value:
            if classroom_dict['name'] == classroom_name:
                classroom_name_is_valid = True
                break

        if not classroom_name_is_valid:
            raise self.PageNotFoundException

        self.render_template('classroom-page.mainpage.html')


class ClassroomDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the classroom
    page.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, classroom_name):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        classroom_name_is_valid = False
        for classroom_dict in config_domain.TOPIC_IDS_FOR_CLASSROOM_PAGES.value:
            if classroom_dict['name'] == classroom_name:
                classroom_name_is_valid = True
                topic_ids = classroom_dict['topic_ids']
                break

        if not classroom_name_is_valid:
            raise self.PageNotFoundException

        topic_summaries = topic_services.get_multi_topic_summaries(topic_ids)
        topic_rights = topic_services.get_multi_topic_rights(topic_ids)
        topic_summary_dicts = [
            summary.to_dict() for ind, summary in enumerate(topic_summaries)
            if summary is not None and topic_rights[ind].topic_is_published
        ]

        self.values.update({
            'topic_summary_dicts': topic_summary_dicts
        })
        self.render_json(self.values)
