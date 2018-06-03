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
from core.controllers import base
from core.domain import acl_decorators
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
import feconf
import utils


def _require_valid_id(entity_id):
    """Checks whether the id received from the frontend is a valid one.
    """
    if not isinstance(entity_id, basestring):
        raise base.BaseHandler.InvalidInputException(
            Exception('All ids should be strings.'))

    if len(entity_id) != 12:
        raise base.BaseHandler.InvalidInputException(
            Exception('The id given is invalid.'))


class StoryEditorPage(base.BaseHandler):
    """The editor page for a single story."""

    @acl_decorators.can_edit_story
    def get(self, topic_id, story_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_id(story_id)
        _require_valid_id(topic_id)

        story = story_services.get_story_by_id(story_id, strict=False)

        if story is None:
            raise self.PageNotFoundException(
                Exception('The story with the given id doesn\'t exist.'))

        self.values.update({
            'story_id': story.id
        })

        self.render_template('pages/story_editor/story_editor.html')


class EditableStoryDataHandler(base.BaseHandler):
    """A data handler for stories which support writing."""

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
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_id(story_id)
        _require_valid_id(topic_id)

        story = story_services.get_story_by_id(story_id, strict=False)

        if story is None:
            raise self.PageNotFoundException(
                Exception('The story with the given id doesn\'t exist.'))

        self.values.update({
            'story': story.to_dict()
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_story
    def put(self, topic_id, story_id):
        """Updates properties of the given story."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_id(story_id)
        _require_valid_id(topic_id)
        story = story_services.get_story_by_id(story_id, strict=False)
        if story is None:
            raise self.PageNotFoundException(
                Exception('The story with the given id doesn\'t exist.'))

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
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_id(story_id)
        _require_valid_id(topic_id)
        if not story_id:
            raise self.PageNotFoundException

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        story_services.delete_story(self.user_id, story_id)
        canonical_story_ids = topic.canonical_story_ids
        canonical_story_ids.remove(story_id)
        change_list = [topic_domain.TopicChange({
            'cmd': 'update_topic_property',
            'property_name': 'canonical_story_ids',
            'old_value': topic.canonical_story_ids,
            'new_value': canonical_story_ids
        })]
        topic_services.update_topic(
            self.user_id, topic_id, change_list,
            'Removed %s from canonical story ids' % story_id)
