# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the contributor dashboard page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import email_manager
from core.domain import user_services
import feconf
import utils


class ContributorDashboardAdminPage(base.BaseHandler):
    """Handler for the contributor dashboard admin page."""

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self):
        self.render_template('contributor-dashboard-admin-page.mainpage.html')


class AddContributionRightsHandler(base.BaseHandler):
    """Handles adding contribution rights for contributor dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def post(self):
        username = self.payload.get('username')
        user_id = user_services.get_user_id_from_username(username)

        if user_id is None:
            raise self.InvalidInputException('Invalid username: %s' % username)

        category = self.payload.get('category')
        language_code = self.payload.get('language_code', None)

        if category == constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION:
            if not utils.is_supported_audio_language_code(language_code):
                raise self.InvalidInputException(
                    'Invalid language_code: %s' % language_code)
            if user_services.can_review_translation_suggestions(
                    user_id, language_code=language_code):
                raise self.InvalidInputException(
                    'User %s already has rights to review translation in '
                    'language code %s' % (username, language_code))
            user_services.allow_user_to_review_translation_in_language(
                user_id, language_code)
        elif category == constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER:
            if not utils.is_supported_audio_language_code(language_code):
                raise self.InvalidInputException(
                    'Invalid language_code: %s' % language_code)
            if user_services.can_review_voiceover_applications(
                    user_id, language_code=language_code):
                raise self.InvalidInputException(
                    'User %s already has rights to review voiceover in '
                    'language code %s' % (username, language_code))
            user_services.allow_user_to_review_voiceover_in_language(
                user_id, language_code)
        elif category == constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION:
            if user_services.can_review_question_suggestions(user_id):
                raise self.InvalidInputException(
                    'User %s already has rights to review question.' % (
                        username))
            user_services.allow_user_to_review_question(user_id)
        elif category == constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION:
            if user_services.can_submit_question_suggestions(user_id):
                raise self.InvalidInputException(
                    'User %s already has rights to submit question.' % (
                        username))
            user_services.allow_user_to_submit_question(user_id)
        else:
            raise self.InvalidInputException(
                'Invalid category: %s' % category)

        if category in [
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION
        ]:
            email_manager.send_email_to_new_contribution_reviewer(
                user_id, category, language_code=language_code)
        self.render_json({})


class RemoveContributionRightsHandler(base.BaseHandler):
    """Handles removing contribution rights for contributor dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def put(self):
        username = self.payload.get('username', None)
        if username is None:
            raise self.InvalidInputException('Missing username param')
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)

        language_code = self.payload.get('language_code', None)
        if language_code is not None and not (
                utils.is_supported_audio_language_code(language_code)):
            raise self.InvalidInputException(
                'Invalid language_code: %s' % language_code)

        removal_type = self.payload.get('removal_type')
        if removal_type == constants.ACTION_REMOVE_ALL_REVIEW_RIGHTS:
            user_services.remove_contribution_reviewer(user_id)
        elif (removal_type ==
              constants.ACTION_REMOVE_SPECIFIC_CONTRIBUTION_RIGHTS):
            category = self.payload.get('category')
            if (category ==
                    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION):
                if not user_services.can_review_translation_suggestions(
                        user_id, language_code=language_code):
                    raise self.InvalidInputException(
                        '%s does not have rights to review translation in '
                        'language %s.' % (username, language_code))
                user_services.remove_translation_review_rights_in_language(
                    user_id, language_code)
            elif (category ==
                  constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER):
                if not user_services.can_review_voiceover_applications(
                        user_id, language_code=language_code):
                    raise self.InvalidInputException(
                        '%s does not have rights to review voiceover in '
                        'language %s.' % (username, language_code))
                user_services.remove_voiceover_review_rights_in_language(
                    user_id, language_code)
            elif (category ==
                  constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION):
                if not user_services.can_review_question_suggestions(user_id):
                    raise self.InvalidInputException(
                        '%s does not have rights to review question.' % (
                            username))
                user_services.remove_question_review_rights(user_id)
            elif (category ==
                  constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION):
                if not user_services.can_submit_question_suggestions(user_id):
                    raise self.InvalidInputException(
                        '%s does not have rights to submit question.' % (
                            username))
                user_services.remove_question_submit_rights(user_id)
            else:
                raise self.InvalidInputException(
                    'Invalid category: %s' % category)

            if category in [
                    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
                    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
                    constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION
            ]:
                email_manager.send_email_to_removed_contribution_reviewer(
                    user_id, category, language_code=language_code)
        else:
            raise self.InvalidInputException(
                'Invalid removal_type: %s' % removal_type)

        self.render_json({})


class ContributorUsersListHandler(base.BaseHandler):
    """Handler to show users with contribution rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self):
        category = self.request.get('category')
        language_code = self.request.get('language_code', None)
        if language_code is not None and not (
                utils.is_supported_audio_language_code(language_code)):
            raise self.InvalidInputException(
                'Invalid language_code: %s' % language_code)
        if category not in [
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
                constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION]:
            raise self.InvalidInputException('Invalid category: %s' % category)
        usernames = user_services.get_contributor_usernames(
            category, language_code=language_code)
        self.render_json({'usernames': usernames})


class ContributionRightsDataHandler(base.BaseHandler):
    """Handler to show the contribution rights of a user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self):
        username = self.request.get('username', None)
        if username is None:
            raise self.InvalidInputException('Missing username param')
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)
        user_rights = (
            user_services.get_user_contribution_rights(user_id))
        self.render_json({
            'can_review_translation_for_language_codes': (
                user_rights.can_review_translation_for_language_codes),
            'can_review_voiceover_for_language_codes': (
                user_rights.can_review_voiceover_for_language_codes),
            'can_review_questions': user_rights.can_review_questions,
            'can_submit_questions': user_rights.can_submit_questions
        })
