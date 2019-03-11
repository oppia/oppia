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

"""Controllers for the story editor."""

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
import feconf
import utils


class StoryEditorPage(base.BaseHandler):
    """The editor page for a single story."""

    @acl_decorators.can_edit_story
    def get(self, topic_id, story_id):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        story_domain.Story.require_valid_story_id(story_id)
        topic_domain.Topic.require_valid_topic_id(topic_id)

        story = story_services.get_story_by_id(story_id, strict=False)
        if story is None:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None or story_id not in topic.canonical_story_ids:
            raise self.PageNotFoundException

        self.values.update({
            'story_id': story.id,
            'story_title': story.title,
        })

        self.render_template('pages/story_editor/story_editor.html')


class EditableStoryDataHandler(base.BaseHandler):
    """A data handler for stories which support writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def _require_valid_version(self, version_from_payload, story_version):
        """Check that the payload version matches the given story
        version.
        """
        if version_from_payload is None:
            raise base.BaseHandler.InvalidInputException(
                'Invalid POST request: a version must be specified.')

        if version_from_payload != story_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of story from version %s, '
                'which is too old. Please reload the page and try again.'
                % (story_version, version_from_payload))

    @acl_decorators.can_edit_story
    def get(self, topic_id, story_id):
        """Populates the data on the individual story page."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        story_domain.Story.require_valid_story_id(story_id)
        topic_domain.Topic.require_valid_topic_id(topic_id)

        story = story_services.get_story_by_id(story_id, strict=False)
        if story is None:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None or story_id not in topic.canonical_story_ids:
            raise self.PageNotFoundException

        self.values.update({
            'story': story.to_dict(),
            'topic_name': topic.name
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_story
    def put(self, topic_id, story_id):
        """Updates properties of the given story."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        story_domain.Story.require_valid_story_id(story_id)
        topic_domain.Topic.require_valid_topic_id(topic_id)
        story = story_services.get_story_by_id(story_id, strict=False)
        if story is None:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None or story_id not in topic.canonical_story_ids:
            raise self.PageNotFoundException

        version = self.payload.get('version')
        self._require_valid_version(version, story.version)

        commit_message = self.payload.get('commit_message')
        change_dicts = self.payload.get('change_dicts')
        change_list = [
            story_domain.StoryChange(change_dict)
            for change_dict in change_dicts
        ]
        try:
            story_services.update_story(
                self.user_id, story_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        story_dict = story_services.get_story_by_id(story_id).to_dict()

        self.values.update({
            'story': story_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_story
    def delete(self, topic_id, story_id):
        """Handles Delete requests."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        story_domain.Story.require_valid_story_id(story_id)
        topic_domain.Topic.require_valid_topic_id(topic_id)

        story = story_services.get_story_by_id(story_id, strict=False)
        if story is None:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        story_services.delete_story(self.user_id, story_id)

        self.render_json(self.values)
