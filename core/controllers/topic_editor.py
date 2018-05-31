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

"""Controllers for the topics editor, from where topics are edited and stories
are created.
"""
from core.controllers import base
from core.domain import acl_decorators
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
import feconf
import utils

STORY_ID_KEY = 'storyId'


class NewStory(base.BaseHandler):
    """Creates a new story."""

    @acl_decorators.can_access_admin_page
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title', feconf.DEFAULT_STORY_TITLE)

        new_story_id = story_services.get_new_story_id()
        story = story_domain.Story.create_default_story(
            new_story_id, title=title)
        story_services.save_new_story(self.user_id, story)

        self.render_json({
            STORY_ID_KEY: new_story_id
        })


class TopicEditorPage(base.BaseHandler):
    """The editor page for a single topic."""

    @acl_decorators.can_edit_topic
    def get(self, topic_id):
        """Handles GET requests."""

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        self.values.update({
            'topic_id': topic.id,
            'is_logged_in': bool(self.user_id),
            'nav_mode': feconf.NAV_MODE_CREATE,
            'TAG_REGEX': feconf.TAG_REGEX
        })

        # Render template will be written after the frontend is done.
        self.render_template('pages/collection_player/collection_player.html')


class EditableTopicDataHandler(base.BaseHandler):
    """A data handler for topics which supports writing."""

    def _require_valid_version(self, version_from_payload, topic_version):
        """Check that the payload version matches the given topic
        version.
        """
        if version_from_payload is None:
            raise base.BaseHandler.InvalidInputException(
                'Invalid POST request: a version must be specified.')

        if version_from_payload != topic_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (topic_version, version_from_payload))

    @acl_decorators.can_edit_topic
    def get(self, topic_id):
        """Populates the data on the individual topic page."""

        try:
            topic_dict = topic_services.get_topic_by_id(
                topic_id, strict=False).to_dict()
        except Exception as e:
            raise self.PageNotFoundException(e)

        self.values.update({
            'topic': topic_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_topic
    def put(self, topic_id):
        """Updates properties of the given topic."""

        topic = topic_services.get_topic_by_id(topic_id)
        version = self.payload.get('version')
        self._require_valid_version(version, topic.version)

        commit_message = self.payload.get('commit_message')
        change_dict_list = self.payload.get('change_list')
        change_list = [
            topic_domain.TopicChange(change_dict)
            for change_dict in change_dict_list
        ]
        try:
            topic_services.update_topic(
                self.user_id, topic_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        topic_dict = topic_services.get_topic_by_id(topic_id).to_dict()

        self.values.update({
            'topic': topic_dict
        })

        self.render_json(self.values)

    def delete(self, topic_id):
        """Handles Delete requests."""
        if not topic_id:
            raise self.PageNotFoundException
        topic_services.delete_topic(self.user_id, topic_id)


class TopicManagerHandler(base.BaseHandler):
    """A handler for assigning topic manager rights."""

    @acl_decorators.can_access_admin_page
    def put(self, topic_id, assignee_id):
        """Assign topic manager role to a user for a particular topic, if the
        user has general topic manager rights.
        """
        assignee_actions_info = user_services.UserActionsInfo(assignee_id)
        user_actions_info = user_services.UserActionsInfo(self.user_id)
        try:
            topic_services.assign_role(
                user_actions_info, assignee_actions_info,
                topic_domain.ROLE_MANAGER, topic_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        self.values.update({
            'role_updated': True
        })

        self.render_json(self.values)
