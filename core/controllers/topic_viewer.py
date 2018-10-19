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

"""Controllers for the topic viewer page."""

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import story_services
from core.domain import topic_services


class TopicViewerPage(base.BaseHandler):
    """Renders the topic viewer page."""

    @acl_decorators.can_access_topic_viewer_page
    def get(self, topic_name):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_name(topic_name)

        self.values.update({
            'topic_name': topic.name
        })
        self.render_template('/pages/topic_viewer/topic_viewer.html')


class TopicPageDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the topic
    viewer page.
    """

    @acl_decorators.can_access_topic_viewer_page
    def get(self, topic_name):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_name(topic_name)

        canonical_story_summaries = [
            story_services.get_story_summary_by_id(
                canonical_story_id) for canonical_story_id
            in topic.canonical_story_ids]

        additional_story_summaries = [
            story_services.get_story_summary_by_id(
                additional_story_id) for additional_story_id
            in topic.additional_story_ids]

        canonical_story_dicts = [
            summary.to_human_readable_dict() for summary
            in canonical_story_summaries]

        additional_story_dicts = [
            summary.to_human_readable_dict() for summary
            in additional_story_summaries]

        self.values.update({
            'topic_name': topic.name,
            'canonical_story_dicts': canonical_story_dicts,
            'additional_story_dicts': additional_story_dicts
        })
        self.render_json(self.values)
