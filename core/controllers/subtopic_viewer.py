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

"""Controllers for the subtopic viewer page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import subtopic_page_services
from core.domain import topic_fetchers
import feconf


class SubtopicViewerPage(base.BaseHandler):
    """Renders the subtopic viewer page."""

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, *args):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        self.render_template('subtopic-viewer-page.mainpage.html')


class SubtopicPageDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the
    subtopic page.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, topic_name, subtopic_id):
        """Handles GET requests.

        Args:
            topic_name: str. The name of the topic that the subtopic is present
                in.
            subtopic_id: str. The id of the subtopic, which is an integer in
                string form.
        """
        if not constants.ENABLE_NEW_STRUCTURE_PLAYERS:
            raise self.PageNotFoundException

        subtopic_id = int(subtopic_id)
        topic = topic_fetchers.get_topic_by_name(topic_name)
        for subtopic in topic.subtopics:
            if subtopic.id == subtopic_id:
                subtopic_title = subtopic.title
                break
        subtopic_page_contents = (
            subtopic_page_services.get_subtopic_page_contents_by_id(
                topic.id, subtopic_id))
        subtopic_page_contents_dict = subtopic_page_contents.to_dict()

        self.values.update({
            'page_contents': subtopic_page_contents_dict,
            'subtopic_title': subtopic_title
        })
        self.render_json(self.values)
