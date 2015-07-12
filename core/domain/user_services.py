# coding: utf-8
#
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

"""Services for user data."""

__author__ = 'Stephanie Federwisch'

import datetime
import logging
import re

from core.platform import models
current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])
import feconf
import utils

MAX_USERNAME_LENGTH = 50


class UserSettings(object):
    """Value object representing a user's settings."""
    def __init__(
            self, user_id, email, username=None, last_agreed_to_terms=None,
            last_started_state_editor_tutorial=None,
            profile_picture_data_url=None, user_bio='',
            preferred_language_codes=None):
        self.user_id = user_id
        self.email = email
        self.username = username
        self.last_agreed_to_terms = last_agreed_to_terms
        self.last_started_state_editor_tutorial = (
            last_started_state_editor_tutorial)
        self.profile_picture_data_url = profile_picture_data_url
        self.user_bio = user_bio
        self.preferred_language_codes = (
            preferred_language_codes if preferred_language_codes else [])

    def validate(self):
        if not isinstance(self.user_id, basestring):
            raise utils.ValidationError(
                'Expected user_id to be a string, received %s' % self.user_id)
        if not self.user_id:
            raise utils.ValidationError('No user id specified.')

        if not isinstance(self.email, basestring):
            raise utils.ValidationError(
                'Expected email to be a string, received %s' % self.email)
        if not self.email:
            raise utils.ValidationError('No user email specified.')
        if ('@' not in self.email or self.email.startswith('@')
                or self.email.endswith('@')):
            raise utils.ValidationError(
                'Invalid email address: %s' % self.email)

    @property
    def truncated_email(self):
        first_part = self.email[: self.email.find('@')]
        last_part = self.email[self.email.find('@'):]
        if len(first_part) <= 1:
            first_part = '..'
        elif len(first_part) <= 3:
            first_part = '%s..' % first_part[0]
        else:
            first_part = first_part[:-3] + '..'
        return '%s%s' % (first_part, last_part)

    @property
    def is_known_user(self):
        # If this does not always return True, something has gone wrong.
        return bool(self.email)

    @property
    def normalized_username(self):
        return self.normalize_username(self.username)

    @classmethod
    def normalize_username(cls, username):
        return username.lower() if username else None

    @classmethod
    def require_valid_username(cls, username):
        if not username:
            raise utils.ValidationError('Empty username supplied.')
        elif len(username) > MAX_USERNAME_LENGTH:
            raise utils.ValidationError(
                'A username can have at most %s characters.'
                % MAX_USERNAME_LENGTH)
        elif not re.match(feconf.ALPHANUMERIC_REGEX, username):
            raise utils.ValidationError(
                'Usernames can only have alphanumeric characters.')
        elif ('admin' in username.lower().strip() or
              'oppia' in username.lower().strip() or
              feconf.MIGRATION_BOT_USERNAME in username.lower().strip()):
            # Admin usernames are reserved for admins. Note that 'admin'
            # itself is already in use for the demo exploration.
            raise utils.ValidationError('This username is not available.')


def is_username_taken(username):
    """Checks if the given username is taken."""
    return user_models.UserSettingsModel.is_normalized_username_taken(
        UserSettings.normalize_username(username))


def get_email_from_user_id(user_id):
    """Gets the email from a given user_id.

    Raises an Exception if the user is not found.
    """
    user_settings = get_user_settings(user_id)
    return user_settings.email


def get_email_from_username(username):
    """Gets the email for a given username.

    Returns None if the user is not found.
    """
    user_model = user_models.UserSettingsModel.get_by_normalized_username(
        UserSettings.normalize_username(username))
    if user_model is None:
        return None
    else:
        return user_model.email


def get_user_id_from_username(username):
    """Gets the user_id for a given username.

    Returns None if the user is not found.
    """
    user_model = user_models.UserSettingsModel.get_by_normalized_username(
        UserSettings.normalize_username(username))
    if user_model is None:
        return None
    else:
        return user_model.id


def get_user_settings_from_username(username):
    """Gets the user settings for a given username.

    Returns None if the user is not found.
    """
    user_model = user_models.UserSettingsModel.get_by_normalized_username(
        UserSettings.normalize_username(username))
    if user_model is None:
        return None
    else:
        return get_user_settings(user_model.id)


def get_users_settings(user_ids):
    """Gets domain objects representing the settings for the given user_ids.

    If the given user_id does not exist, the corresponding entry in the
    returned list is None.
    """
    user_settings_models = user_models.UserSettingsModel.get_multi(user_ids)
    result = []
    for ind, model in enumerate(user_settings_models):
        if user_ids[ind] == feconf.SYSTEM_COMMITTER_ID:
            result.append(UserSettings(
                feconf.SYSTEM_COMMITTER_ID,
                email=feconf.SYSTEM_EMAIL_ADDRESS,
                username='admin',
                last_agreed_to_terms=datetime.datetime.utcnow(),
                last_started_state_editor_tutorial=None,
            ))
        elif model:
            result.append(UserSettings(
                model.id, email=model.email, username=model.username,
                last_agreed_to_terms=model.last_agreed_to_terms,
                last_started_state_editor_tutorial=(
                    model.last_started_state_editor_tutorial),
                profile_picture_data_url=model.profile_picture_data_url,
                user_bio=model.user_bio,
                preferred_language_codes=model.preferred_language_codes
            ))
        else:
            result.append(None)
    return result


def get_user_settings(user_id, strict=False):
    """Return the user settings for a single user."""
    user_settings = get_users_settings([user_id])[0]
    if strict and user_settings is None:
        logging.error('Could not find user with id %s' % user_id)
        raise Exception('User not found.')
    return user_settings


def _save_user_settings(user_settings):
    """Commits a user settings object to the datastore."""
    user_settings.validate()
    user_models.UserSettingsModel(
        id=user_settings.user_id,
        email=user_settings.email,
        username=user_settings.username,
        normalized_username=user_settings.normalized_username,
        last_agreed_to_terms=user_settings.last_agreed_to_terms,
        last_started_state_editor_tutorial=(
            user_settings.last_started_state_editor_tutorial),
        profile_picture_data_url=user_settings.profile_picture_data_url,
        user_bio=user_settings.user_bio,
        preferred_language_codes=user_settings.preferred_language_codes,
    ).put()


def has_user_registered_as_editor(user_id):
    user_settings = get_user_settings(user_id, strict=True)
    return user_settings.username and user_settings.last_agreed_to_terms


def _create_user(user_id, email):
    """Creates a new user. Returns the user_settings object."""
    user_settings = get_user_settings(user_id, strict=False)
    if user_settings is not None:
        raise Exception('User %s already exists.' % user_id)

    user_settings = UserSettings(
        user_id, email,
        preferred_language_codes=[feconf.DEFAULT_LANGUAGE_CODE])
    _save_user_settings(user_settings)
    return user_settings


def get_or_create_user(user_id, email):
    """If the given User model does not exist, creates it.

    Returns the resulting UserSettings domain object.
    """
    user_settings = get_user_settings(user_id, strict=False)
    if user_settings is None:
        user_settings = _create_user(user_id, email)
    return user_settings


def get_username(user_id):
    if user_id == feconf.MIGRATION_BOT_USER_ID:
        return feconf.MIGRATION_BOT_USERNAME
    else:
        return get_user_settings(user_id, strict=True).username


def get_usernames(user_ids):
    users_settings = get_users_settings(user_ids)
    return [us.username if us else None for us in users_settings]


# NB: If we ever allow usernames to change, update the
# config_domain.BANNED_USERNAMES property.
def set_username(user_id, new_username):
    user_settings = get_user_settings(user_id, strict=True)

    UserSettings.require_valid_username(new_username)
    if is_username_taken(new_username):
        raise utils.ValidationError(
            'Sorry, the username \"%s\" is already taken! Please pick '
            'a different one.' % new_username)
    user_settings.username = new_username
    _save_user_settings(user_settings)


def record_agreement_to_terms(user_id):
    """Records that the user has agreed to the license terms."""
    user_settings = get_user_settings(user_id, strict=True)
    user_settings.last_agreed_to_terms = datetime.datetime.utcnow()
    _save_user_settings(user_settings)


def update_profile_picture_data_url(user_id, profile_picture_data_url):
    user_settings = get_user_settings(user_id, strict=True)
    user_settings.profile_picture_data_url = profile_picture_data_url
    _save_user_settings(user_settings)


def update_user_bio(user_id, user_bio):
    user_settings = get_user_settings(user_id, strict=True)
    user_settings.user_bio = user_bio
    _save_user_settings(user_settings)


def update_preferred_language_codes(user_id, preferred_language_codes):
    user_settings = get_user_settings(user_id, strict=True)
    user_settings.preferred_language_codes = preferred_language_codes
    _save_user_settings(user_settings)


def get_human_readable_user_ids(user_ids):
    """Converts the given ids to usernames, or truncated email addresses.

    Requires all users to be known.
    """
    users_settings = get_users_settings(user_ids)
    usernames = []
    for ind, user_settings in enumerate(users_settings):
        if user_settings is None:
            logging.error('User id %s not known in list of user_ids %s' % (
                user_ids[ind], user_ids))
            raise Exception('User not found.')
        elif user_settings.user_id == feconf.SYSTEM_COMMITTER_ID:
            usernames.append('admin')
        elif user_settings.username:
            usernames.append(user_settings.username)
        else:
            usernames.append(
                '[Awaiting user registration: %s]' %
                user_settings.truncated_email)
    return usernames


def get_user_id_from_email(email):
    return current_user_services.get_user_id_from_email(email)


def is_super_admin(user_id, request):
    return current_user_services.is_super_admin(user_id, request)


def record_user_started_state_editor_tutorial(user_id):
    user_settings = get_user_settings(user_id, strict=True)
    user_settings.last_started_state_editor_tutorial = (
        datetime.datetime.utcnow())
    _save_user_settings(user_settings)


def update_email_preferences(user_id, can_receive_email_updates):
    """Updates whether the user has chosen to receive email updates.

    If no UserEmailPreferencesModel exists for this user, a new one will
    be created.
    """
    email_preferences_model = user_models.UserEmailPreferencesModel.get(
        user_id, strict=False)
    if email_preferences_model is None:
        email_preferences_model = user_models.UserEmailPreferencesModel(
            id=user_id)

    email_preferences_model.site_updates = can_receive_email_updates
    email_preferences_model.put()


def get_email_preferences(user_id):
    """Returns a boolean representing whether the user has chosen to receive
    email updates.
    """
    email_preferences_model = user_models.UserEmailPreferencesModel.get(
        user_id, strict=False)
    return {
        'can_receive_email_updates': (
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
            if email_preferences_model is None
            else email_preferences_model.site_updates)
    }
