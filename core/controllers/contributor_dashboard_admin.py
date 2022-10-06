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

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import email_manager
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.domain import user_services


class ContributorDashboardAdminPage(base.BaseHandler):
    """Handler for the contributor dashboard admin page."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_access_contributor_dashboard_admin_page
    def get(self):
        self.render_template('contributor-dashboard-admin-page.mainpage.html')


class ContributionRightsHandler(base.BaseHandler):
    """Handles contribution rights of a user on contributor dashboard page."""

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
        },
        'DELETE': {
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
        # The handler schema defines the possible values of 'category'.
        # If 'category' has a value other than those defined in the schema,
        # a Bad Request error will be thrown and the else branch of the below
        # condition will never execute. Hence, we use the no branch flag.
        elif category == constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION: # pragma: no branch
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

    @acl_decorators.can_manage_contributors_role
    def delete(self, category):
        username = self.normalized_request.get('username', None)
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % username)

        language_code = self.normalized_request.get('language_code', None)

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
        # The handler schema defines the possible values of 'category'.
        # If 'category' has a value other than those defined in the schema,
        # a Bad Request error will be thrown and the else branch of the below
        # condition will never execute. Hence, we use the no branch flag.
        elif category == ( # pragma: no branch
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
        if feconf.ROLE_ID_TRANSLATION_ADMIN in self.roles:
            response = {
                'can_review_translation_for_language_codes': (
                    user_rights.can_review_translation_for_language_codes)
            }
        if feconf.ROLE_ID_QUESTION_ADMIN in self.roles:
            response.update({
                'can_review_questions': user_rights.can_review_questions,
                'can_submit_questions': user_rights.can_submit_questions
            })
        self.render_json(response)


class TranslationContributionStatsHandler(base.BaseHandler):
    """Handler to show the translation contribution stats of a user."""

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
        translation_contribution_stats = (
            suggestion_services.get_all_translation_contribution_stats(user_id)
        )
        self.render_json({
            'translation_contribution_stats': (
                self._get_complete_translation_contribution_stats(
                    translation_contribution_stats)
            )
        })

    def _get_complete_translation_contribution_stats(
            self, translation_contribution_stats):
        """Returns translation contribution stats dicts with all the necessary
        information for the frontend.

        Args:
            translation_contribution_stats: list(TranslationContributionStats).
                TranslationContributionStats domain objects.

        Returns:
            list(dict(TranslationContributionStats)). Dict representations of
            TranslationContributionStats domain objects with additional keys:
                language: str. Language description.
                topic_name: str. Topic name.
                contribution_months: str. Unique translation contribution
                    months of format: "%b %Y", e.g. "Jan 2021".
            Unnecessary keys language_code, topic_id, contribution_dates,
            contributor_user_id are consequently deleted.
        """
        translation_contribution_stats_dicts = [
            stats.to_dict() for stats in translation_contribution_stats
        ]
        topic_ids = [
            stats_dict['topic_id']
            for stats_dict in translation_contribution_stats_dicts
        ]
        topic_summaries = topic_fetchers.get_multi_topic_summaries(topic_ids)
        topic_name_by_topic_id = {}
        for topic_summary in topic_summaries:
            if topic_summary is None:
                continue
            topic_name_by_topic_id[topic_summary.id] = topic_summary.name
        for stats_dict in translation_contribution_stats_dicts:
            stats_dict['topic_name'] = topic_name_by_topic_id.get(
                stats_dict['topic_id'], 'UNKNOWN')
            stats_dict['contribution_months'] = list({
                contribution_date.strftime('%b %Y')
                for contribution_date in stats_dict['contribution_dates']
            })
            stats_dict['language'] = (
                utils.get_supported_audio_language_description(
                    stats_dict['language_code'])
            )
            del stats_dict['topic_id']
            del stats_dict['language_code']
            del stats_dict['contribution_dates']
            del stats_dict['contributor_user_id']
        return translation_contribution_stats_dicts
