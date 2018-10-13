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

"""Controllers for the story viewer page."""

from core.controllers import base
from core.domain import acl_decorators
from core.domain import story_services
from core.domain import summary_services
from core.domain import topic_services
import feconf


class StoryViewerPage(base.BaseHandler):
    """Renders the story viewer page."""

    @acl_decorators.can_access_story_viewer_page
    def get(self, topic_name, story_id):
        """Handles GET requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_name(topic_name)

        if topic is None:
            raise self.PageNotFoundException

        story = story_services.get_story_by_id(story_id, strict=False)
        if story is None:
            raise self.PageNotFoundException

        self.values.update({
            'story_id': story.id,
            'story_title': story.title,
            'topic_name': topic.name
        })

        self.render_template('pages/story_viewer/story_viewer.html')


class StoryPageDataHandler(base.BaseHandler):
    """Manages the data that needs to be displayed to a learner on the story
    viewer page.
    """

    @acl_decorators.can_access_story_viewer_page
    def get(self, topic_name, story_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_name(topic_name)

        if topic is None:
            raise self.PageNotFoundException

        story = story_services.get_story_by_id(story_id, strict=False)
        story_dict = (
            summary_services.get_learner_story_dict_by_id(story_id))
        if story is None:
            raise self.PageNotFoundException

        self.values.update({
            'topic_name': topic.name,
            'title': story_dict['title'],
            'id': story_dict['id'],
            'description': story_dict['description'],
            'language_code': story_dict['language_code'],
            'playthrough_dict': story_dict['playthrough_dict'],
            'story_contents': story_dict['story_contents'],
            'notes': story_dict['notes'],
            'is_logged_in': bool(self.user_id),
            'version': story_dict['version'],
            'schema_version': story_dict['schema_version'],
        })

        self.render_json(self.values)
