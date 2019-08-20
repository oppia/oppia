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

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_fetchers
from core.domain import topic_services
import feconf
import utils


class StoryEditorPage(base.BaseHandler):
    """The editor page for a single story."""

    @acl_decorators.can_edit_story
    def get(self, _):
        """Handles GET requests."""

        self.render_template('dist/story-editor-page.mainpage.html')


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
    def get(self, story_id):
        """Populates the data on the individual story page."""
        story = story_fetchers.get_story_by_id(story_id, strict=False)
        topic_id = story.corresponding_topic_id
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        for story_reference in topic.canonical_story_references:
            if story_reference.story_id == story_id:
                story_is_published = story_reference.story_is_published

        self.values.update({
            'story': story.to_dict(),
            'topic_name': topic.name,
            'story_is_published': story_is_published
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_story
    def put(self, story_id):
        """Updates properties of the given story."""
        story = story_fetchers.get_story_by_id(story_id, strict=False)

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

        story_dict = story_fetchers.get_story_by_id(story_id).to_dict()

        self.values.update({
            'story': story_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_story
    def delete(self, story_id):
        """Handles Delete requests."""
        story_services.delete_story(self.user_id, story_id)
        self.render_json(self.values)


class StoryPublishHandler(base.BaseHandler):
    """A data handler for publishing and unpublishing stories."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_story
    def put(self, story_id):
        """Published/unpublished given story."""
        story = story_fetchers.get_story_by_id(story_id, strict=False)
        topic_id = story.corresponding_topic_id

        new_story_status_is_public = self.payload.get(
            'new_story_status_is_public')
        if not isinstance(new_story_status_is_public, bool):
            raise self.InvalidInputException

        if new_story_status_is_public:
            topic_services.publish_story(topic_id, story_id, self.user_id)
        else:
            topic_services.unpublish_story(topic_id, story_id, self.user_id)

        self.render_json(self.values)
