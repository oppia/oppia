# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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
            self, user_id, email=None, username=None,
            last_agreed_to_terms=None):
        self.user_id = user_id
        self.email = email
        self.username = username
        self.last_agreed_to_terms = last_agreed_to_terms

    @property
    def truncated_email(self):
        if not self.email:
            raise Exception('Expected a user email, found none.')
        if '@' not in self.email:
            raise Exception('Invalid email address: %s' % self.email)
        first_part = self.email[: self.email.find('@')]
        last_part = self.email[self.email.find('@'):]
        if len(first_part) <= 3:
            first_part = '%s...' % first_part[0]
        else:
            first_part = first_part[:-3] + '...'
        return '%s@%s' % (first_part, last_part)

    @property
    def is_known_user(self):
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
        elif 'admin' in username.lower().strip():
            # Admin usernames are reserved for admins. Note that 'admin'
            # itself is already in use for the demo exploration.
            raise utils.ValidationError('This username is already taken.')


def is_username_taken(username):
    """Checks if the given username is taken."""
    return user_models.UserSettingsModel.is_normalized_username_taken(
        UserSettings.normalize_username(username))


def get_users_settings(user_ids):
    """Gets domain objects representing the settings for the given user ids."""
    user_settings_models = user_models.UserSettingsModel.get_multi(user_ids)
    result = []
    for ind, model in enumerate(user_settings_models):
        if model is None:
            result.append(UserSettings(user_ids[ind]))
        else:
            result.append(UserSettings(
                model.id, email=model.email, username=model.username,
                last_agreed_to_terms=model.last_agreed_to_terms
            ))
    return result


def get_user_settings(user_id):
    """Return the user settings for a single user."""
    return get_users_settings([user_id])[0]


def _save_user_settings(user_settings):
    """Commits a user settings object to the datastore."""
    user_models.UserSettingsModel(
        id=user_settings.user_id,
        email=user_settings.email,
        username=user_settings.username,
        normalized_username=user_settings.normalized_username,
        last_agreed_to_terms=user_settings.last_agreed_to_terms
    ).put()


def has_user_registered_as_editor(user_id):
    user_settings = get_user_settings(user_id)
    return user_settings.username and user_settings.last_agreed_to_terms


def create_user(user_id, email):
    """Creates a new user. Returns the user_settings object."""
    user_settings = get_user_settings(user_id)
    if user_settings.is_known_user:
        raise Exception('User %s already exists.' % user_id)
    user_settings.email = email
    _save_user_settings(user_settings)
    return user_settings


def get_username(user_id):
    return get_user_settings(user_id).username


def set_username(user_id, new_username):
    user_settings = get_user_settings(user_id)
    if not user_settings.is_known_user:
        raise Exception(
            'Trying to set username %s for user_id %s, which is not known to '
            'the system.' % (new_username, user_id))

    UserSettings.require_valid_username(new_username)
    if is_username_taken(new_username):
        raise utils.ValidationError(
            'Sorry, the username \"%s\" is already taken! Please pick '
            'a different one.' % new_username)
    user_settings.username = new_username
    _save_user_settings(user_settings)


def record_agreement_to_terms(user_id):
    """Records that the user has agreed to the license terms."""
    user_settings = get_user_settings(user_id)
    user_settings.last_agreed_to_terms = datetime.datetime.utcnow()
    _save_user_settings(user_settings)


def get_human_readable_user_ids(user_ids):
    """Converts the given ids to usernames, or truncated email addresses.

    Requires all users to be known.
    """
    users_settings = get_users_settings(user_ids)
    usernames = []
    for user_settings in users_settings:
        if user_settings.user_id == feconf.ADMIN_COMMITTER_ID:
            usernames.append('admin')
        elif not user_settings.is_known_user:
            logging.error('User id %s not known in list of user_ids %s' % (
                user_settings.user_id, user_ids))
            raise Exception('User not found.')
        elif user_settings.username:
            usernames.append(user_settings.username)
        else:
            usernames.append(
                '[Awaiting user registration: %s]' %
                user_settings.truncated_email)


def get_user_id_from_email(email):
    return current_user_services.get_user_id_from_email(email)


def is_current_user_admin(request):
    return current_user_services.is_current_user_admin(request)
