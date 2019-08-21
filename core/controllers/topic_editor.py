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

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import dependency_registry
from core.domain import email_manager
from core.domain import interaction_registry
from core.domain import role_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
import feconf
import utils

import jinja2


class TopicEditorStoryHandler(base.BaseHandler):
    """Manages the creation of a story and receiving of all story summaries for
    display in topic editor page.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id):
        """Handles GET requests."""
        topic = topic_fetchers.get_topic_by_id(topic_id)
        story_id_to_publication_status_map = {}
        for reference in topic.canonical_story_references:
            story_id_to_publication_status_map[reference.story_id] = (
                reference.story_is_published)
        for reference in topic.additional_story_references:
            story_id_to_publication_status_map[reference.story_id] = (
                reference.story_is_published)
        canonical_story_summaries = story_fetchers.get_story_summaries_by_ids(
            topic.get_canonical_story_ids())
        additional_story_summaries = story_fetchers.get_story_summaries_by_ids(
            topic.get_additional_story_ids())

        canonical_story_summary_dicts = [
            summary.to_dict() for summary in canonical_story_summaries]
        additional_story_summary_dicts = [
            summary.to_dict() for summary in additional_story_summaries]

        for summary in canonical_story_summary_dicts:
            summary['story_is_published'] = (
                story_id_to_publication_status_map[summary['id']])

        for summary in additional_story_summary_dicts:
            summary['story_is_published'] = (
                story_id_to_publication_status_map[summary['id']])

        self.values.update({
            'canonical_story_summary_dicts': canonical_story_summary_dicts,
            'additional_story_summary_dicts': additional_story_summary_dicts
        })
        self.render_json(self.values)

    @acl_decorators.can_add_new_story_to_topic
    def post(self, topic_id):
        """Handles POST requests.
        Currently, this only adds the story to the canonical story id list of
        the topic.
        """
        topic_domain.Topic.require_valid_topic_id(topic_id)
        title = self.payload.get('title')

        story_domain.Story.require_valid_title(title)

        new_story_id = story_services.get_new_story_id()
        story = story_domain.Story.create_default_story(
            new_story_id, title, topic_id)
        story_services.save_new_story(self.user_id, story)
        topic_services.add_canonical_story(self.user_id, topic_id, new_story_id)
        self.render_json({
            'storyId': new_story_id
        })


class TopicEditorPage(base.BaseHandler):
    """The editor page for a single topic."""

    EDITOR_PAGE_DEPENDENCY_IDS = ['codemirror']

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id):
        """Handles GET requests."""
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        interaction_ids = feconf.ALLOWED_QUESTION_INTERACTION_IDS

        interaction_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                interaction_dependency_ids + self.EDITOR_PAGE_DEPENDENCY_IDS))

        self.values.update({
            'additional_angular_modules': additional_angular_modules,
            'dependencies_html': jinja2.utils.Markup(dependencies_html)
        })

        self.render_template('dist/topic-editor-page.mainpage.html')


class EditableSubtopicPageDataHandler(base.BaseHandler):
    """The data handler for subtopic pages."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id, subtopic_id):
        """Handles GET requests."""
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            topic_id, subtopic_id, strict=False)

        if subtopic_page is None:
            raise self.PageNotFoundException(
                'The subtopic page with the given id doesn\'t exist.')

        self.values.update({
            'subtopic_page': subtopic_page.to_dict()
        })

        self.render_json(self.values)


class EditableTopicDataHandler(base.BaseHandler):
    """A data handler for topics which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

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

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id):
        """Populates the data on the individual topic page."""
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        if topic is None:
            raise self.PageNotFoundException(
                Exception('The topic with the given id doesn\'t exist.'))

        skill_ids = topic.get_all_skill_ids()

        skill_id_to_description_dict = (
            skill_services.get_skill_descriptions_by_ids(topic_id, skill_ids))

        self.values.update({
            'topic_dict': topic.to_dict(),
            'skill_id_to_description_dict': skill_id_to_description_dict
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
        topic_domain.Topic.require_valid_topic_id(topic_id)
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)

        version = self.payload.get('version')
        self._require_valid_version(version, topic.version)

        commit_message = self.payload.get('commit_message')
        topic_and_subtopic_page_change_dicts = self.payload.get(
            'topic_and_subtopic_page_change_dicts')
        topic_and_subtopic_page_change_list = []
        for change in topic_and_subtopic_page_change_dicts:
            if change['cmd'] == (
                    subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY):
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

        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        skill_ids = topic.get_all_skill_ids()

        skill_id_to_description_dict = (
            skill_services.get_skill_descriptions_by_ids(topic_id, skill_ids))

        self.values.update({
            'topic_dict': topic.to_dict(),
            'skill_id_to_description_dict': skill_id_to_description_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_topic
    def delete(self, topic_id):
        """Handles Delete requests."""
        topic_domain.Topic.require_valid_topic_id(topic_id)
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                'The topic with the given id doesn\'t exist.')
        topic_services.delete_topic(self.user_id, topic_id)

        self.render_json(self.values)


class TopicRightsHandler(base.BaseHandler):
    """A handler for returning topic rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_any_topic_editor
    def get(self, topic_id):
        """Returns the TopicRights object of a topic."""
        topic_rights = topic_services.get_topic_rights(topic_id, strict=False)
        if topic_rights is None:
            raise self.InvalidInputException(
                'Expected a valid topic id to be provided.')
        user_actions_info = user_services.UserActionsInfo(self.user_id)
        can_edit_topic = topic_services.check_can_edit_topic(
            user_actions_info, topic_rights)

        can_publish_topic = (
            role_services.ACTION_CHANGE_TOPIC_STATUS in
            user_actions_info.actions)

        self.values.update({
            'can_edit_topic': can_edit_topic,
            'published': topic_rights.topic_is_published,
            'can_publish_topic': can_publish_topic
        })

        self.render_json(self.values)


class TopicPublishSendMailHandler(base.BaseHandler):
    """A handler for sending mail to admins to review and publish topic."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_any_topic_editor
    def put(self, topic_id):
        """Returns the TopicRights object of a topic."""
        topic_url = feconf.TOPIC_EDITOR_URL_PREFIX + '/' + topic_id
        if feconf.CAN_SEND_EMAILS:
            email_manager.send_mail_to_admin(
                'Request to review and publish a topic',
                '%s wants to publish topic: %s at URL %s, please review'
                ' and publish if it looks good.'
                % (self.username, self.payload.get('topic_name'), topic_url))

        self.render_json(self.values)


class TopicPublishHandler(base.BaseHandler):
    """A handler for publishing and unpublishing topics."""

    @acl_decorators.can_change_topic_publication_status
    def put(self, topic_id):
        """Publishes or unpublishes a topic."""
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException

        topic_domain.Topic.require_valid_topic_id(topic_id)

        publish_status = self.payload.get('publish_status')

        if not isinstance(publish_status, bool):
            raise self.InvalidInputException(
                'Publish status should only be true or false.')

        try:
            if publish_status:
                topic_services.publish_topic(topic_id, self.user_id)
            else:
                topic_services.unpublish_topic(topic_id, self.user_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        self.render_json(self.values)
