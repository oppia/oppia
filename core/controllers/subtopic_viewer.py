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

"""Controllers for the subtopic viewer page."""

from core.controllers import base
from core.domain import acl_decorators
from core.domain import topic_services
from core.domain import subtopic_page_services
import feconf


class SubtopicPageDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to learner on the
    subtopic viewer page.
    """

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, topic_id, subtopic_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic_id, subtopic_id)

        self.values.update({
            'subtopic_html_data': subtopic_page.html_data,
            'language_code': subtopic_page.language_code
        })
        self.render_json(self.values)


class SubtopicViewerPage(base.BaseHandler):
    """Manages to render subtopic viewer page."""

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, topic_id, subtopic_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        subtopic = topic.get_subtopic_by_id(int(subtopic_id), strict=False)

        self.values.update({
            'topic_title': topic.name,
            'subtopic_title': subtopic.title
        })
        self.render_template('/pages/subtopic_viewer/subtopic_viewer.html')
