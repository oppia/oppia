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

"""Controllers for the topics viewer page."""

from core.controllers import base
from core.domain import story_services
from core.domain import topic_services
import feconf


class TopicPageDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the topic
    viewer page.
    """

    def get(self, topic_id):
        """Handles GET requests."""

        topic = topic_services.get_topic_by_id(topic_id)
        canonical_stories = [
            story_services.get_story_by_id(
                canonical_story_id) for canonical_story_id
            in topic.canonical_story_ids]
        additional_stories = [
            story_services.get_story_by_id(
                additional_story_id) for additional_story_id
            in topic.additional_story_ids]

        canonical_story_dicts = [
            story.to_dict() for story in canonical_stories]
        additional_story_dicts = [
            story.to_dict() for story in additional_stories]

        self.values.update({
            'topic_name': topic.name,
            'canonical_story_dicts': canonical_story_dicts,
            'additional_story_dicts': additional_story_dicts
        })
        self.render_json(self.values)


class TopicViewerPage(base.BaseHandler):
    """Manages to render topic viewer page."""

    def get(self, topic_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException
        topic = topic_services.get_topic_by_id(topic_id)

        self.values.update({
            'topic_name': topic.name
        })
        self.render_template('/pages/topic_viewer/topic_viewer.html')
