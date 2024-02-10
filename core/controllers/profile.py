# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the profile page."""

from __future__ import annotations

import io
import json
import logging
import re
import zipfile

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import email_manager
from core.domain import role_services
from core.domain import subscription_services
from core.domain import summary_services
from core.domain import takeout_service
from core.domain import user_services
from core.domain import wipeout_service

from typing import Any, Callable, Dict, Optional, TypedDict


class ProfileHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides data for the profile page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'username': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_valid_username_string'
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, username: str) -> None:
        """Handles GET requests."""

        user_settings = user_services.get_user_settings_from_username(username)
        if not user_settings:
            raise self.PageNotFoundException

        created_exp_summary_dicts = []
        edited_exp_summary_dicts = []

        subscriber_ids = subscription_services.get_all_subscribers_of_creator(
            user_settings.user_id)
        is_already_subscribed = self.user_id in subscriber_ids
        is_user_visiting_own_profile = self.user_id == user_settings.user_id

        user_contributions = user_services.get_user_contributions(
            user_settings.user_id)
        if user_contributions:
            created_exp_summary_dicts = (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    user_contributions.created_exploration_ids))
            edited_exp_summary_dicts = (
                summary_services.get_displayable_exp_summary_dicts_matching_ids(
                    user_contributions.edited_exploration_ids))
        profile_is_of_current_user = self.username == username

        self.values.update({
            'profile_is_of_current_user': profile_is_of_current_user,
            'username_of_viewed_profile': user_settings.username,
            'user_bio': user_settings.user_bio,
            'subject_interests': user_settings.subject_interests,
            'first_contribution_msec': (
                user_settings.first_contribution_msec
                if user_settings.first_contribution_msec else None),
            'user_impact_score': user_services.get_user_impact_score(
                user_settings.user_id),
            'created_exp_summary_dicts': created_exp_summary_dicts,
            'edited_exp_summary_dicts': edited_exp_summary_dicts,
            'is_already_subscribed': is_already_subscribed,
            'is_user_visiting_own_profile': is_user_visiting_own_profile
        })
        self.render_json(self.values)


class BulkEmailWebhookEndpoint(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """The endpoint for the webhook that is triggered when a user
    subscribes/unsubscribes to the bulk email service provider externally.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'secret': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'data[list_id]': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'data[email]': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.EMAIL_REGEX
                    }]
                }
            },
            'type': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        'subscribe', 'unsubscribe'
                    ]
                }
            }
        }
    }

    # Here, the 'secret' url_path_argument is not used in the function body
    # because the actual usage of 'secret' lies within the 'is_source_mailchimp'
    # decorator, and here we are getting 'secret' because the decorator always
    # passes every url_path_args to HTTP methods.
    @acl_decorators.is_source_mailchimp
    def get(self, unused_secret: str) -> None:
        """Handles GET requests. This is just an empty endpoint that is
        required since when the webhook is updated in the bulk email service
        provider, a GET request is sent initially to validate the endpoint.
        """
        pass

    # Here, the 'secret' url_path_argument is not used in the function body
    # because the actual usage of 'secret' lies within the 'is_source_mailchimp'
    # decorator, and here we are getting 'secret' because the decorator always
    # passes every url_path_args to HTTP methods.
    @acl_decorators.is_source_mailchimp
    def post(self, unused_secret: str) -> None:
        """Handles POST requests."""
        assert self.normalized_request is not None
        if (
            self.normalized_request['data[list_id]'] !=
            feconf.MAILCHIMP_AUDIENCE_ID
        ):
            self.render_json({})
            return

        email = self.normalized_request['data[email]']
        user_settings = user_services.get_user_settings_from_email(email)

        # Ignore the request if the user does not exist in Oppia.
        if user_settings is None:
            self.render_json({})
            return

        user_id = user_settings.user_id
        user_email_preferences = user_services.get_email_preferences(user_id)
        if self.normalized_request['type'] == 'subscribe':
            user_services.update_email_preferences(
                user_id, True,
                user_email_preferences.can_receive_editor_role_email,
                user_email_preferences.can_receive_feedback_message_email,
                user_email_preferences.can_receive_subscription_email,
                bulk_email_db_already_updated=True)
        elif self.normalized_request['type'] == 'unsubscribe':
            user_services.update_email_preferences(
                user_id, False,
                user_email_preferences.can_receive_editor_role_email,
                user_email_preferences.can_receive_feedback_message_email,
                user_email_preferences.can_receive_subscription_email,
                bulk_email_db_already_updated=True)
        self.render_json({})


class MailingListSubscriptionHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of MailingListSubscriptionHandler's
    normalized_request dictionary.
    """

    email: str
    name: str
    tag: str


class MailingListSubscriptionHandler(
    base.BaseHandler[
        MailingListSubscriptionHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Adds user to the mailing list."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'email': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': constants.EMAIL_REGEX
                    }]
                }
            },
            'name': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_nonempty'
                    }]
                },
                'default_value': None
            },
            'tag': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_nonempty'
                    }]
                }
            }
        }
    }

    @acl_decorators.open_access
    def put(self) -> None:
        """Handles PUT request."""
        assert self.normalized_payload is not None
        email = self.normalized_payload['email']
        name = self.normalized_payload.get('name')
        tag = self.normalized_payload['tag']
        status = user_services.add_user_to_mailing_list(email, tag, name=name)
        self.render_json({'status': status})


class PreferencesHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Provides data for the preferences page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    # Here we use type Any because we don't know the data type of input.
    def __validate_data_type(
        self, update_type: str, required_type: type, data: Any) -> None:
        """Validates the type of the input data.This method checks if the
        provided input data is of the required type.

        Args:
            update_type: str. The update type of data.
            required_type: type. The expected data type of the input data.
            data: Any. The input data whose type is to be validated.

        Raises:
            InvalidInputException. If the type of the data does not match the
                required type.
        """
        if not isinstance(data, required_type):
            raise self.InvalidInputException(
                'Expected %s to be a %s, received %s'
                % (update_type, required_type.__name__, type(data).__name__))

    @acl_decorators.can_manage_own_account
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        user_settings = user_services.get_user_settings(self.user_id)
        user_email_preferences = user_services.get_email_preferences(
            self.user_id)

        creators_subscribed_to = subscription_services.get_all_creators_subscribed_to( # pylint: disable=line-too-long
            self.user_id)
        creators_settings = user_services.get_users_settings(
            creators_subscribed_to, strict=True
        )
        subscription_list = []

        for index, creator_settings in enumerate(creators_settings):
            subscription_summary = {
                'creator_username': creator_settings.username,
                'creator_impact': (
                    user_services.get_user_impact_score(
                        creators_subscribed_to[index]))
            }

            subscription_list.append(subscription_summary)

        self.values.update({
            'preferred_language_codes': user_settings.preferred_language_codes,
            'preferred_site_language_code': (
                user_settings.preferred_site_language_code),
            'preferred_audio_language_code': (
                user_settings.preferred_audio_language_code),
            'preferred_translation_language_code': (
                user_settings.preferred_translation_language_code),
            'default_dashboard': user_settings.default_dashboard,
            'user_bio': user_settings.user_bio,
            'subject_interests': user_settings.subject_interests,
            'can_receive_email_updates': (
                user_email_preferences.can_receive_email_updates),
            'can_receive_editor_role_email': (
                user_email_preferences.can_receive_editor_role_email),
            'can_receive_feedback_message_email': (
                user_email_preferences.can_receive_feedback_message_email),
            'can_receive_subscription_email': (
                user_email_preferences.can_receive_subscription_email),
            'subscription_list': subscription_list
        })
        self.render_json(self.values)

    @acl_decorators.can_manage_own_account
    def put(self) -> None:
        """Handles PUT requests."""
        assert self.user_id is not None
        update_type = self.payload.get('update_type')
        data = self.payload.get('data')
        bulk_email_signup_message_should_be_shown = False
        user_settings = user_services.get_user_settings(self.user_id)

        if update_type == 'subject_interests':
            self.__validate_data_type(update_type, list, data)
            user_settings.subject_interests = data
        elif update_type == 'preferred_language_codes':
            self.__validate_data_type(update_type, list, data)
            user_settings.preferred_language_codes = data
        elif update_type == 'email_preferences':
            required_keys = [
                'can_receive_email_updates', 'can_receive_editor_role_email',
                'can_receive_feedback_message_email',
                'can_receive_subscription_email']
            # Check if all required keys are in the data dictionary.
            if not all(key in data for key in required_keys):
                raise self.InvalidInputException(
                    'Expected data to contain the fields,%s, received %s'
                    % (required_keys, data))
            if not all(isinstance(value, bool) for value in data.values()):
                raise self.InvalidInputException(
                    'Expected all values of data to be boolean,received %s'
                    % data)

            bulk_email_signup_message_should_be_shown = (
                user_services.update_email_preferences(
                    self.user_id, data['can_receive_email_updates'],
                    data['can_receive_editor_role_email'],
                    data['can_receive_feedback_message_email'],
                    data['can_receive_subscription_email']))
        elif update_type == 'user_bio':
            self.__validate_data_type(update_type, str, data)
            if len(data) > feconf.MAX_BIO_LENGTH_IN_CHARS:
                raise self.InvalidInputException(
                    'User bio exceeds maximum character limit: %s'
                    % feconf.MAX_BIO_LENGTH_IN_CHARS)
            user_settings.user_bio = data
        elif update_type == 'preferred_site_language_code':
            self.__validate_data_type(update_type, str, data)
            user_settings.preferred_site_language_code = data
        elif update_type == 'preferred_audio_language_code':
            self.__validate_data_type(update_type, str, data)
            user_settings.preferred_audio_language_code = data
        elif update_type == 'preferred_translation_language_code':
            self.__validate_data_type(update_type, str, data)
            user_settings.preferred_translation_language_code = data
        elif update_type == 'default_dashboard':
            self.__validate_data_type(update_type, str, data)
            user_settings.default_dashboard = data
        elif update_type == 'profile_picture_data_url':
            self.__validate_data_type(update_type, str, data)
            assert user_settings.username is not None
            user_services.update_profile_picture_data_url(
                user_settings.username, data)
        else:
            raise self.InvalidInputException(
                'Invalid update type: %s' % update_type)

        user_services.save_user_settings(user_settings)
        self.render_json({
            'bulk_email_signup_message_should_be_shown': (
                bulk_email_signup_message_should_be_shown)
        })


class SignupPageNormalizedRequestDict(TypedDict):
    """Dict representation of SignupPage's
    normalized_request dictionary.
    """

    return_url: Optional[str]


class SignupPage(
    base.BaseHandler[Dict[str, str], SignupPageNormalizedRequestDict]
):
    """The page which prompts for username and acceptance of terms."""

    REDIRECT_UNFINISHED_SIGNUPS = False
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'return_url': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.require_user_id_else_redirect_to_homepage
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        assert self.normalized_request is not None
        fetched_url = self.normalized_request.get('return_url')
        return_url = self.request.uri if fetched_url is None else fetched_url
        # Validating return_url for no external redirections.
        if re.match('^/[^//]', return_url) is None:
            return_url = '/'
        if user_services.has_fully_registered_account(self.user_id):
            self.redirect(return_url)
            return

        self.render_template('oppia-root.mainpage.html')


class SignupHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SignupHandler's
    normalized_payload dictionary.
    """

    username: str
    agreed_to_terms: bool
    default_dashboard: str
    can_receive_email_updates: bool


class SignupHandler(
    base.BaseHandler[
        SignupHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Provides data for the editor prerequisites page."""

    REDIRECT_UNFINISHED_SIGNUPS = False
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'username': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_valid_username_string'
                    }]
                }
            },
            'agreed_to_terms': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': False
            },
            'default_dashboard': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        constants.DASHBOARD_TYPE_LEARNER,
                        constants.DASHBOARD_TYPE_CREATOR,
                        constants.DASHBOARD_TYPE_CONTRIBUTOR
                    ]
                }
            },
            'can_receive_email_updates': {
                'schema': {
                    'type': 'bool'
                }
            }
        }
    }

    @acl_decorators.require_user_id_else_redirect_to_homepage
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        user_settings = user_services.get_user_settings(self.user_id)
        self.render_json({
            'can_send_emails': feconf.CAN_SEND_EMAILS,
            'has_agreed_to_latest_terms': bool(
                user_settings.last_agreed_to_terms and
                user_settings.last_agreed_to_terms >=
                feconf.TERMS_PAGE_LAST_UPDATED_UTC),
            'has_ever_registered': bool(
                user_settings.username and user_settings.last_agreed_to_terms),
            'username': user_settings.username,
        })

    @acl_decorators.require_user_id_else_redirect_to_homepage
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        agreed_to_terms = self.normalized_payload['agreed_to_terms']
        default_dashboard = self.normalized_payload['default_dashboard']
        can_receive_email_updates = self.normalized_payload[
            'can_receive_email_updates']
        bulk_email_signup_message_should_be_shown = False

        bulk_email_signup_message_should_be_shown = (
            user_services.update_email_preferences(
                self.user_id, can_receive_email_updates,
                feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
                feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
                feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE
            )
        )
        if bulk_email_signup_message_should_be_shown:
            self.render_json({
                'bulk_email_signup_message_should_be_shown': (
                    bulk_email_signup_message_should_be_shown
                )
            })
            return
        # Ruling out the possibility of None for mypy type checking.
        assert self.user_id is not None
        has_ever_registered = user_services.has_ever_registered(self.user_id)
        has_fully_registered_account = (
            user_services.has_fully_registered_account(self.user_id))

        if has_fully_registered_account:
            self.render_json({})
            return

        if not agreed_to_terms:
            raise self.InvalidInputException(
                'In order to edit explorations on this site, you will '
                'need to accept the license terms.')

        user_services.record_agreement_to_terms(self.user_id)

        if not user_services.get_username(self.user_id):
            user_services.set_username(self.user_id, username)

        # Note that an email is only sent when the user registers for the first
        # time.
        if feconf.CAN_SEND_EMAILS and not has_ever_registered:
            email_manager.send_post_signup_email(self.user_id)

        user_settings = user_services.get_user_settings(self.user_id)
        initial_profile_picture = user_services.fetch_gravatar(
            user_settings.email)
        assert user_settings.username is not None
        user_services.update_profile_picture_data_url(
            user_settings.username, initial_profile_picture)

        if not has_ever_registered:
            # Set the default dashboard for new users.
            user_settings.default_dashboard = default_dashboard

        user_services.save_user_settings(user_settings)

        self.render_json({
            'bulk_email_signup_message_should_be_shown': (
                bulk_email_signup_message_should_be_shown)
        })


class DeleteAccountHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Provides data for the delete account page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'DELETE': {}}

    @acl_decorators.can_manage_own_account
    def delete(self) -> None:
        """Handles DELETE requests."""
        assert self.user_id is not None
        wipeout_service.pre_delete_user(self.user_id)
        self.render_json({'success': True})


class ExportAccountHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Provides user with relevant data for Takeout."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_manage_own_account
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        # Retrieve user data.
        user_takeout_object = takeout_service.export_data_for_user(
            self.user_id
        )
        user_data = user_takeout_object.user_data
        user_images = user_takeout_object.user_images

        # Ensure that the exported data does not contain a user ID.
        user_data_json_string = json.dumps(user_data)
        if re.search(feconf.USER_ID_REGEX, user_data_json_string):
            logging.error(
                '[TAKEOUT] User ID found in the JSON generated for user %s'
                % self.user_id)
            user_data_json_string = (
                'There was an error while exporting ' +
                'data. Please contact %s to export your data.'
                % feconf.ADMIN_EMAIL_ADDRESS)
            user_images = []

        # Create zip file.
        temp_file = io.BytesIO()
        with zipfile.ZipFile(
            temp_file, mode='w', compression=zipfile.ZIP_DEFLATED
        ) as zfile:
            zfile.writestr('oppia_takeout_data.json', user_data_json_string)
            for image in user_images:
                if image.b64_image_data.startswith(utils.PNG_DATA_URL_PREFIX):
                    decoded_png = utils.convert_data_url_to_binary(
                        image.b64_image_data, 'png')
                    zfile.writestr(
                        'images/' + image.image_export_path, decoded_png)
                elif image.b64_image_data.startswith(
                    utils.DATA_URL_FORMAT_PREFIX % 'webp'
                ):
                    decoded_webp = utils.convert_data_url_to_binary(
                        image.b64_image_data, 'webp')
                    zfile.writestr(
                        'images/' + image.image_export_path, decoded_webp)

        # Render file for download.
        self.render_downloadable_file(
            temp_file, 'oppia_takeout_data.zip', 'text/plain')


class UsernameCheckHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of UsernameCheckHandler's
    normalized_payload dictionary.
    """

    username: str


class UsernameCheckHandler(
    base.BaseHandler[
        UsernameCheckHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Checks whether a username has already been taken."""

    REDIRECT_UNFINISHED_SIGNUPS = False
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'username': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_valid_username_string'
                    }]
                }
            }
        }
    }

    @acl_decorators.require_user_id_else_redirect_to_homepage
    def post(self) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']

        username_is_taken = user_services.is_username_taken(username)
        self.render_json({
            'username_is_taken': username_is_taken,
        })


class SiteLanguageHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of SiteLanguageHandler's
    normalized_payload dictionary.
    """

    site_language_code: str


class SiteLanguageHandler(
    base.BaseHandler[
        SiteLanguageHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Changes the preferred system language in the user's preferences."""

    LANGUAGE_ID_PROVIDER_FUNC: Callable[[Dict[str, str]], str] = (
        lambda language_dict: language_dict['id']
    )
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'site_language_code': {
                'schema': {
                    'type': 'basestring',
                    'choices': list(map(
                        LANGUAGE_ID_PROVIDER_FUNC,
                        constants.SUPPORTED_SITE_LANGUAGES
                    ))
                }
            }
        }
    }

    @acl_decorators.can_manage_own_account
    def put(self) -> None:
        """Handles PUT requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        site_language_code = self.normalized_payload['site_language_code']
        user_settings = user_services.get_user_settings(self.user_id)
        user_settings.preferred_site_language_code = site_language_code
        user_services.save_user_settings(user_settings)
        self.render_json({})


class UserInfoHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of UserInfoHandler's
    normalized_payload dictionary.
    """

    user_has_viewed_lesson_info_modal_once: bool


class UserInfoHandler(
    base.BaseHandler[
        UserInfoHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Provides info about user. If user is not logged in,
    return dict containing false as logged in status."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'user_has_viewed_lesson_info_modal_once': {
                'schema': {
                    'type': 'bool'
                },
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        # The following headers are added to prevent caching of this response.
        self.response.cache_control.no_store = True
        if self.username:
            assert self.user_id is not None
            user_actions = user_services.get_user_actions_info(
                self.user_id
            ).actions
            user_settings = user_services.get_user_settings(
                self.user_id, strict=True)
            self.render_json({
                'roles': self.roles,
                'is_moderator': (
                    user_services.is_moderator(self.user_id)),
                'is_curriculum_admin': user_services.is_curriculum_admin(
                    self.user_id),
                'is_super_admin': self.current_user_is_super_admin,
                'is_topic_manager': (
                    user_services.is_topic_manager(self.user_id)),
                'can_create_collections': bool(
                    role_services.ACTION_CREATE_COLLECTION in user_actions),
                'preferred_site_language_code': (
                    user_settings.preferred_site_language_code),
                'username': user_settings.username,
                'email': user_settings.email,
                'user_is_logged_in': True
            })
        else:
            self.render_json({
                'user_is_logged_in': False
            })

    @acl_decorators.open_access
    def put(self) -> None:
        """Handles PUT requests."""
        # In frontend, we are calling this put method iff the user is
        # logged-in, so here we sure that self.user_id is never going
        # to be None, but to narrow down the type and handle the None
        # case gracefully, we are returning if self.user_id is None.
        if self.user_id is None:
            return self.render_json({})
        assert self.normalized_payload is not None
        user_has_viewed_lesson_info_modal_once = self.normalized_payload[
            'user_has_viewed_lesson_info_modal_once']
        if user_has_viewed_lesson_info_modal_once:
            user_services.set_user_has_viewed_lesson_info_modal_once(
                self.user_id)
        self.render_json({'success': True})


class UrlHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of UrlHandler's
    normalized_request dictionary.
    """

    current_url: str


class UrlHandler(
    base.BaseHandler[
        Dict[str, str], UrlHandlerNormalizedRequestDict
    ]
):
    """The handler for generating login URL."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'current_url': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        assert self.normalized_request is not None
        if self.user_id:
            self.render_json({'login_url': None})
        else:
            target_url = self.normalized_request['current_url']
            login_url = user_services.create_login_url(target_url)
            self.render_json({'login_url': login_url})
