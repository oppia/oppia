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

"""Controllers for the questions editor, from where questions are edited
and are created.
"""
import datetime
import logging

from core.controllers import base
from core.domain import acl_decorators
from core.domain import interaction_registry
from core.domain import obj_services
from core.domain import question_domain
from core.domain import question_services
from core.platform import models

import jinja2
import feconf
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


def _require_valid_version(version_from_payload, question_version):
    """Check that the payload version matches the given question
    version.
    """
    if version_from_payload is None:
        raise base.BaseHandler.InvalidInputException(
            'Invalid POST request: a version must be specified.')

    if version_from_payload != question_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of question from version %s, '
            'which is too old. Please reload the page and try again.'
            % (question_version, version_from_payload))


class QuestionEditorHandler(base.BaseHandler):
    """Base class for all handlers for the question editor page."""

    def _get_logout_url(self, redirect_url_on_logout):
        """This overrides the method in base.BaseHandler.
        Returns logout url which will be handled by
        QuestionEditorLogoutHandler.

        Args:
            redirect_url_on_logout: str. URL to redirect to on logout.

        Returns:
            str. logout url.
        """
        logout_url = utils.set_url_query_parameter(
            '/question_editor_logout', 'return_url', redirect_url_on_logout)
        return logout_url


class QuestionEditorPage(base.BaseHandler):
    """The editor page for a single question."""

    @acl_decorators.can_view_any_question_editor
    def get(self, question_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(question_id)

        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        interaction_ids = (
            interaction_registry.Registry.get_all_question_specific_interaction_ids())

        interaction_templates = (
            interaction_registry.Registry.get_interaction_html(
                interaction_ids))

        self.values.update({
            'INTERACTION_SPECS': (
                interaction_registry.Registry.get_all_question_editor_specs()),
            'question_id': question.to_dict(),
            'can_edit': question_services.check_can_edit_question(
                self.user.user_id, question.question_id),
            'ALLOWED_QUESTION_INTERACTION_CATEGORIES': (
                feconf.ALLOWED_QUESTION_INTERACTION_CATEGORIES),
            'nav_mode': feconf.NAV_MODE_QUESTION_EDITOR,
            'DEFAULT_OBJECT_VALUES': obj_services.get_default_object_values(),
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates)
        })

        self.render_template(
            'pages/question_editor/question_editor.html',
            redirect_url_on_logout='/')


class EditableQuestionDataHandler(base.BaseHandler):
    """A data handler for questions which supports writing."""

    @acl_decorators.can_view_any_question_editor
    def get(self, question_id):
        """Gets the data for the question overview page."""
        # 'apply_draft' and 'v'(version) are optional parameters because the
        # question history tab also uses this handler, and these parameters
        # are not used by that tab.
        version = self.request.get('v', default_value=None)
        apply_draft = self.request.get('apply_draft', default_value=False)

        question_data = question_services.get_user_question_data(
            self.user_id, question_id, apply_draft=apply_draft,
            version=version)

        self.values.update(question_data)
        self.render_json(self.values)

    @acl_decorators.can_edit_question
    def put(self, question_id):
        """Updates properties of the given question."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(question_id)
        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        version = self.payload.get('version')
        self._require_valid_version(version, question.version)

        commit_message = self.payload.get('commit_message')
        change_dicts = self.payload.get('change_dicts')
        change_list = []
        for change in change_dicts:
            change_list.append(
                question_domain.QuestionChange(change))
        try:
            question_services.update_question_pages(
                self.user_id, question_id, change_list,
                commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        question_dict = question_services.get_question_by_id(
            question_id).to_dict()

        self.values.update({
            'question': question_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_question
    def delete(self, question_id):
        """Handles Delete requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        log_debug_string = '(%s) %s tried to delete question %s' % (
            self.role, self.user_id, question_id)
        logging.debug(log_debug_string)

        question = question_services.get_question_by_id(question_id)
        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')
        question_services.delete_question(self.user_id, question_id)

        log_info_string = '(%s) %s deleted question %s' % (
            self.role, self.user_id, question_id)
        logging.info(log_info_string)


class QuestionPublishHandler(base.BaseHandler):
    """A handler for publishing and unpublishing questions."""

    @acl_decorators.can_change_question_publication_status
    def put(self, question_id):
        """Publishes or unpublishes a question."""
        question_domain.Question.require_valid_question_id(question_id)

        publish_status = self.payload.get('publish_status')

        if not isinstance(publish_status, bool):
            raise self.InvalidInputException(
                'Publish status should only be true or false.')

        try:
            if publish_status:
                question_services.publish_question(question_id, self.user_id)
            else:
                question_services.unpublish_question(question_id, self.user_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        self.render_json(self.values)


class QuestionAutosaveHandler(QuestionEditorPage):
    """Handles requests from the editor for draft autosave."""

    @acl_decorators.can_edit_question
    def put(self, question_id):
        """Handles PUT requests for draft updation."""
        # Raise an Exception if the draft change list fails non-strict
        # validation.
        try:
            change_list_dict = self.payload.get('change_list')
            change_list = [
                question_domain.QuestionChange(change)
                for change in change_list_dict]
            version = self.payload.get('version')
            question_services.create_or_update_draft(
                question_id, self.user_id, change_list, version,
                datetime.datetime.utcnow())
        except utils.ValidationError as e:
            # We leave any pre-existing draft changes in the datastore.
            raise self.InvalidInputException(e)
        question_user_data = user_models.QuestionUserDataModel.get(
            self.user_id, question_id)
        draft_change_list_id = question_user_data.draft_change_list_id
        # If the draft_change_list_id is False, have the user discard the draft
        # changes. We save the draft to the datastore even if the version is
        # invalid, so that it is available for recovery later.
        self.render_json({
            'draft_change_list_id': draft_change_list_id,
            'is_version_of_draft_valid': question_services.is_version_of_draft_valid(
                question_id, version)})

    @acl_decorators.can_edit_question
    def post(self, question_id):
        """Handles POST request for discarding draft changes."""
        question_services.discard_draft(question_id, self.user_id)
        self.render_json({})
