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
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
import feconf
import utils


class NewStoryHandler(base.BaseHandler):
    """Creates a new story."""

    @acl_decorators.can_add_new_story_to_topic
    def post(self, topic_id):
        """Handles POST requests.
        Currently, this only adds the story to the canonical story id list of
        the topic.
        """
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException
        topic_domain.Topic.require_valid_topic_id(topic_id)
        title = self.payload.get('title')

        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        story_domain.Story.require_valid_title(title)

        new_story_id = story_services.get_new_story_id()
        story = story_domain.Story.create_default_story(
            new_story_id, title=title)
        story_services.save_new_story(self.user_id, story)
        topic_services.add_canonical_story(self.user_id, topic_id, new_story_id)
        self.render_json({
            'storyId': new_story_id
        })


class TopicEditorPage(base.BaseHandler):
    """The editor page for a single topic."""

    @acl_decorators.can_edit_topic
    def get(self, topic_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic_domain.Topic.require_valid_topic_id(topic_id)

        topic = topic_services.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        self.values.update({
            'topic_id': topic.id,
            'topic_name': topic.name,
            'nav_mode': feconf.NAV_MODE_TOPIC_EDITOR
        })

        self.render_template(
            'pages/topic_editor/topic_editor.html', redirect_url_on_logout='/')


class EditableSubtopicPageDataHandler(base.BaseHandler):
    """The data handler for subtopic pages."""

    def _require_valid_version(
            self, version_from_payload, subtopic_page_version):
        """Check that the payload version matches the given subtopic page
        version.
        """
        if version_from_payload is None:
            raise base.BaseHandler.InvalidInputException(
                'Invalid POST request: a version must be specified.')

        if version_from_payload != subtopic_page_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of subtopic page from version %s, '
                'which is too old. Please reload the page and try again.'
                % (subtopic_page_version, version_from_payload))

    @acl_decorators.can_edit_subtopic_page
    def get(self, topic_id, subtopic_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic_domain.Topic.require_valid_topic_id(topic_id)

        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic_id, subtopic_id, strict=False)

        if subtopic_page is None:
            raise self.PageNotFoundException(
                Exception('The subtopic with the given id doesn\'t exist.'))

        self.values.update({
            'subtopic_page': subtopic_page.to_dict()
        })

        self.render_json(self.values)


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
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic_domain.Topic.require_valid_topic_id(topic_id)

        topic = topic_services.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        self.values.update({
            'topic': topic.to_dict()
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_topic
    def put(self, topic_id):
        """Updates properties of the given topic.
        Also, each change_dict given for editing should have an additional
        property called is_topic_change, which would be a boolean. If True, it
        means that change is for a topic (includes adding and removing
        subtopics), while False would mean it is for a Subtopic Page (this
        includes editing its html data as of now).
        """
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic_domain.Topic.require_valid_topic_id(topic_id)
        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        version = self.payload.get('version')
        self._require_valid_version(version, topic.version)

        commit_message = self.payload.get('commit_message')
        topic_and_subtopic_page_change_dicts = self.payload.get(
            'topic_and_subtopic_page_change_dicts')
        topic_and_subtopic_page_change_list = []
        for change in topic_and_subtopic_page_change_dicts:
            if change['change_affects_subtopic_page']:
                topic_and_subtopic_page_change_list.append(
                    subtopic_page_domain.SubtopicPageChange(change))
            else:
                topic_and_subtopic_page_change_list.append(
                    topic_domain.TopicChange(change))
        try:
            topic_services.update_topic_and_subtopic_pages(
                self.user_id, topic_id, topic_and_subtopic_page_change_list,
                commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        topic_dict = topic_services.get_topic_by_id(topic_id).to_dict()

        self.values.update({
            'topic': topic_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_topic
    def delete(self, topic_id):
        """Handles Delete requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        topic_domain.Topic.require_valid_topic_id(topic_id)
        topic = topic_services.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))
        topic_services.delete_topic(self.user_id, topic_id)


class TopicRightsHandler(base.BaseHandler):
    """A handler for returning topic rights."""

    @acl_decorators.can_manage_rights_for_topic
    def get(self, topic_id):
        """Returns the TopicRights object of a topic.
        """
        topic_domain.Topic.require_valid_topic_id(topic_id)

        try:
            topic_rights = topic_services.get_topic_rights(topic_id)
            user_actions_info = user_services.UserActionsInfo(self.user_id)
            can_edit_topic = False
            if topic_services.check_can_edit_topic(
                    user_actions_info, topic_rights):
                can_edit_topic = True
        except Exception as e:
            raise self.PageNotFoundException(e)

        topic_rights_to_return = {
            'topic_id': topic_id,
            'can_edit_topic': can_edit_topic,
            'is_published': topic_rights.topic_is_published
        }
        self.values.update({
            'topic_rights': topic_rights_to_return
        })

        self.render_json(self.values)


class TopicManagerRightsHandler(base.BaseHandler):
    """A handler for assigning topic manager rights."""

    @acl_decorators.can_manage_rights_for_topic
    def put(self, topic_id, assignee_id):
        """Assign topic manager role to a user for a particular topic, if the
        user has general topic manager rights.
        """
        topic_domain.Topic.require_valid_topic_id(topic_id)

        if assignee_id is None:
            raise self.InvalidInputException(
                Exception('Expected a valid assignee id to be provided.'))
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


class TopicPublishHandler(base.BaseHandler):
    """A handler for publishing and unpublishing topics."""

    @acl_decorators.can_manage_rights_for_topic
    def put(self, topic_id):
        """Publishes or unpublishes a topic.
        """
        topic_domain.Topic.require_valid_topic_id(topic_id)

        publish_status = self.payload.get('publish_status')

        if not isinstance(publish_status, bool):
            raise self.InvalidInputException(
                Exception('Publish status should only be true or false.'))

        try:
            if publish_status:
                topic_services.publish_topic(topic_id, self.user_id)
            else:
                topic_services.unpublish_topic(topic_id, self.user_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        self.values.update({
            'topic_status_updated': True
        })

        self.render_json(self.values)
