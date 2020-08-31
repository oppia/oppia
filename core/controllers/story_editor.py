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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_services
from core.domain import skill_services
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

        self.render_template('story-editor-page.mainpage.html')


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
        skill_ids = topic.get_all_skill_ids()
        for node in story.story_contents.nodes:
            for skill_id in node.prerequisite_skill_ids:
                if skill_id not in skill_ids:
                    skill_ids.append(skill_id)

        skill_summaries = skill_services.get_multi_skill_summaries(skill_ids)
        skill_summary_dicts = [summary.to_dict() for summary in skill_summaries]
        classroom_url_fragment = (
            classroom_services.get_classroom_url_fragment_for_topic_id(
                topic.id))

        for story_reference in topic.canonical_story_references:
            if story_reference.story_id == story_id:
                story_is_published = story_reference.story_is_published

        self.values.update({
            'story': story.to_dict(),
            'topic_name': topic.name,
            'story_is_published': story_is_published,
            'skill_summaries': skill_summary_dicts,
            'topic_url_fragment': topic.url_fragment,
            'classroom_url_fragment': classroom_url_fragment
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_story
    def put(self, story_id):
        """Updates properties of the given story."""
        story = story_fetchers.get_story_by_id(story_id, strict=False)

        version = self.payload.get('version')
        self._require_valid_version(version, story.version)

        commit_message = self.payload.get('commit_message')

        if commit_message is None:
            raise self.InvalidInputException(
                'Expected a commit message but received none.')

        if len(commit_message) > feconf.MAX_COMMIT_MESSAGE_LENGTH:
            raise self.InvalidInputException(
                'Commit messages must be at most %s characters long.'
                % feconf.MAX_COMMIT_MESSAGE_LENGTH)

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


class ValidateExplorationsHandler(base.BaseHandler):
    """A data handler for validating the explorations in a story."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_story
    def get(self, _):
        """Handler that receives a list of exploration IDs, checks whether the
        corresponding explorations are supported on mobile and returns the
        validation error messages (if any).
        """
        comma_separated_exp_ids = self.request.get('comma_separated_exp_ids')
        if not comma_separated_exp_ids:
            raise self.InvalidInputException(
                'Expected comma_separated_exp_ids parameter to be present.')
        exp_ids = comma_separated_exp_ids.split(',')
        validation_error_messages = (
            story_services.validate_explorations_for_story(exp_ids, False))
        self.values.update({
            'validation_error_messages': validation_error_messages
        })
        self.render_json(self.values)


class StoryUrlFragmentHandler(base.BaseHandler):
    """A data handler for checking if a story with given url fragment exists.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, story_url_fragment):
        """Handler that receives a story url fragment and checks whether
        a story with the same url fragment exists or not.
        """
        self.values.update({
            'story_url_fragment_exists': (
                story_services.does_story_exist_with_url_fragment(
                    story_url_fragment))
        })
        self.render_json(self.values)
