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


class ContributorDashboardAdminPage(base.BaseHandler):
    """Handler for the contributor dashboard admin page."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self):
        self.render_template('contributor-dashboard-admin-page.mainpage.html')


class AddContributionRightsHandler(base.BaseHandler):
    """Handles adding contribution rights for contributor dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'category': {
            'schema': {
                'type': 'basestring',
                'choices': constants.CONTRIBUTION_RIGHT_CATEGORIES
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_manage_contributors_role
    def post(self, category):
        username = self.normalized_payload.get('username')
        user_id = user_services.get_user_id_from_username(username)

        if user_id is None:
            raise self.InvalidInputException('Invalid username: %s' % username)

        language_code = self.normalized_payload.get('language_code', None)

        if category == constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION:
            if user_services.can_review_translation_suggestions(
                    user_id, language_code=language_code):
                raise self.InvalidInputException(
                    'User %s already has rights to review translation in '
                    'language code %s' % (username, language_code))
            user_services.allow_user_to_review_translation_in_language(
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
    URL_PATH_ARGS_SCHEMAS = {
        'category': {
            'schema': {
                'type': 'basestring',
                'choices': constants.CONTRIBUTION_RIGHT_CATEGORIES
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_manage_contributors_role
    def put(self, category):
        username = self.normalized_payload.get('username', None)
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)

        language_code = self.normalized_payload.get('language_code', None)

        if (category ==
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION):
            if not user_services.can_review_translation_suggestions(
                    user_id, language_code=language_code):
                raise self.InvalidInputException(
                    '%s does not have rights to review translation in '
                    'language %s.' % (username, language_code))
            user_services.remove_translation_review_rights_in_language(
                user_id, language_code)
        elif category == (
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION):
            if not user_services.can_review_question_suggestions(user_id):
                raise self.InvalidInputException(
                    '%s does not have rights to review question.' % (
                        username))
            user_services.remove_question_review_rights(user_id)
        elif category == (
                constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION):
            if not user_services.can_submit_question_suggestions(user_id):
                raise self.InvalidInputException(
                    '%s does not have rights to submit question.' % (
                        username))
            user_services.remove_question_submit_rights(user_id)

        if category in [
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION
        ]:
            email_manager.send_email_to_removed_contribution_reviewer(
                user_id, category, language_code=language_code)

        self.render_json({})


class ContributorUsersListHandler(base.BaseHandler):
    """Handler to show users with contribution rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'category': {
            'schema': {
                'type': 'basestring',
                'choices': constants.CONTRIBUTION_RIGHT_CATEGORIES
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'language_code': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_supported_audio_language_code'
                    }]
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_manage_contributors_role
    def get(self, category):
        language_code = self.normalized_request.get('language_code')
        usernames = user_services.get_contributor_usernames(
            category, language_code=language_code)
        self.render_json({'usernames': usernames})


class ContributionRightsDataHandler(base.BaseHandler):
    """Handler to show the contribution rights of a user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self):
        username = self.normalized_request.get('username', None)
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)
        user_rights = (
            user_services.get_user_contribution_rights(user_id))
        response = {}
        if self.role == feconf.ROLE_ID_TRANSLATION_ADMIN:
            response = {
                'can_review_translation_for_language_codes': (
                    user_rights.can_review_translation_for_language_codes)
            }
        if self.role == feconf.ROLE_ID_QUESTION_ADMIN:
            response.update({
                'can_review_questions': user_rights.can_review_questions,
                'can_submit_questions': user_rights.can_submit_questions
            })
        self.render_json(response)
