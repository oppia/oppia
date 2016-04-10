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

import datetime
import logging
import re

from core.platform import models
import feconf
import utils

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])

MAX_USERNAME_LENGTH = 50


class UserSettings(object):
    """Value object representing a user's settings."""
    def __init__(
            self, user_id, email, username=None, last_agreed_to_terms=None,
            last_started_state_editor_tutorial=None,
            profile_picture_data_url=None, user_bio='', subject_interests=None,
            first_contribution_msec=None,
            preferred_language_codes=None):
        self.user_id = user_id
        self.email = email
        self.username = username
        self.last_agreed_to_terms = last_agreed_to_terms
        self.last_started_state_editor_tutorial = (  # pylint: disable=invalid-name
            last_started_state_editor_tutorial)
        self.profile_picture_data_url = profile_picture_data_url
        self.user_bio = user_bio
        self.subject_interests = (
            subject_interests if subject_interests else [])
        self.first_contribution_msec = first_contribution_msec
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
                subject_interests=model.subject_interests,
                first_contribution_msec=model.first_contribution_msec,
                preferred_language_codes=model.preferred_language_codes
            ))
        else:
            result.append(None)
    return result


def get_profile_pictures_by_user_ids(user_ids):
    """Gets the profile_picture_data_url from the domain objects
    representing the settings for the given user_ids.

    If the given user_id does not exist, the corresponding entry in the
    returned list is None.
    """
    user_settings_models = user_models.UserSettingsModel.get_multi(user_ids)
    result = {}
    for model in user_settings_models:
        if model:
            result[model.id] = model.profile_picture_data_url
        else:
            result[model.id] = None
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
        subject_interests=user_settings.subject_interests,
        first_contribution_msec=user_settings.first_contribution_msec,
        preferred_language_codes=user_settings.preferred_language_codes,

    ).put()


def has_ever_registered(user_id):
    user_settings = get_user_settings(user_id, strict=True)
    return bool(user_settings.username and user_settings.last_agreed_to_terms)


def has_fully_registered(user_id):
    if user_id is None:
        return False

    user_settings = get_user_settings(user_id, strict=True)
    return user_settings.username and user_settings.last_agreed_to_terms and (
        user_settings.last_agreed_to_terms >=
        feconf.REGISTRATION_PAGE_LAST_UPDATED_UTC)


def _create_user(user_id, email):
    """Creates a new user. Returns the user_settings object."""
    user_settings = get_user_settings(user_id, strict=False)
    if user_settings is not None:
        raise Exception('User %s already exists.' % user_id)

    user_settings = UserSettings(
        user_id, email,
        preferred_language_codes=[feconf.DEFAULT_LANGUAGE_CODE])
    _save_user_settings(user_settings)
    create_user_contributions(user_id, [], [])
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


def update_subject_interests(user_id, subject_interests):
    if not isinstance(subject_interests, list):
        raise utils.ValidationError('Expected subject_interests to be a list.')
    else:
        for interest in subject_interests:
            if not isinstance(interest, basestring):
                raise utils.ValidationError(
                    'Expected each subject interest to be a string.')
            elif not interest:
                raise utils.ValidationError(
                    'Expected each subject interest to be non-empty.')
            elif not re.match(feconf.TAG_REGEX, interest):
                raise utils.ValidationError(
                    'Expected each subject interest to consist only of '
                    'lowercase alphabetic characters and spaces.')

    if len(set(subject_interests)) != len(subject_interests):
        raise utils.ValidationError(
            'Expected each subject interest to be distinct.')

    user_settings = get_user_settings(user_id, strict=True)
    user_settings.subject_interests = subject_interests
    _save_user_settings(user_settings)


def _update_first_contribution_msec(user_id, first_contribution_msec):
    user_settings = get_user_settings(user_id, strict=True)
    user_settings.first_contribution_msec = first_contribution_msec
    _save_user_settings(user_settings)


def update_first_contribution_msec_if_not_set(user_id, first_contribution_msec):
    user_settings = get_user_settings(user_id, strict=True)
    if user_settings.first_contribution_msec is None:
        _update_first_contribution_msec(
            user_id, first_contribution_msec)


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


def record_user_started_state_editor_tutorial(user_id):
    user_settings = get_user_settings(user_id, strict=True)
    user_settings.last_started_state_editor_tutorial = (
        datetime.datetime.utcnow())
    _save_user_settings(user_settings)


def update_email_preferences(
        user_id, can_receive_email_updates, can_receive_editor_role_email):
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
    email_preferences_model.editor_role_notifications = (
        can_receive_editor_role_email)
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
            else email_preferences_model.site_updates),
        'can_receive_editor_role_email': (
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE
            if email_preferences_model is None
            else email_preferences_model.editor_role_notifications)
    }


class UserContributions(object):
    """Value object representing a user's contributions."""
    def __init__(
            self, user_id, created_exploration_ids, edited_exploration_ids):
        self.user_id = user_id
        self.created_exploration_ids = created_exploration_ids
        self.edited_exploration_ids = edited_exploration_ids

    def validate(self):
        if not isinstance(self.user_id, basestring):
            raise utils.ValidationError(
                'Expected user_id to be a string, received %s' % self.user_id)
        if not self.user_id:
            raise utils.ValidationError('No user id specified.')

        if not isinstance(self.created_exploration_ids, list):
            raise utils.ValidationError(
                'Expected created_exploration_ids to be a list, received %s'
                % self.created_exploration_ids)
        for exploration_id in self.created_exploration_ids:
            if not isinstance(exploration_id, basestring):
                raise utils.ValidationError(
                    'Expected exploration_id in created_exploration_ids '
                    'to be a string, received %s' % (
                        exploration_id))

        if not isinstance(self.edited_exploration_ids, list):
            raise utils.ValidationError(
                'Expected edited_exploration_ids to be a list, received %s'
                % self.edited_exploration_ids)
        for exploration_id in self.edited_exploration_ids:
            if not isinstance(exploration_id, basestring):
                raise utils.ValidationError(
                    'Expected exploration_id in edited_exploration_ids '
                    'to be a string, received %s' % (
                        exploration_id))


def get_user_contributions(user_id, strict=False):
    """Gets domain object representing the contributions for the given user_id.

    If the given user_id does not exist, returns None.
    """
    model = user_models.UserContributionsModel.get(user_id, strict=strict)
    if model is not None:
        result = UserContributions(
            model.id, model.created_exploration_ids,
            model.edited_exploration_ids)
    else:
        result = None
    return result


def create_user_contributions(
        user_id, created_exploration_ids, edited_exploration_ids):
    """Creates a new UserContributionsModel and returns the domain object."""
    user_contributions = get_user_contributions(user_id, strict=False)
    if user_contributions:
        raise Exception(
            'User contributions model for user %s already exists.' % user_id)
    else:
        user_contributions = UserContributions(
            user_id, created_exploration_ids, edited_exploration_ids)
        _save_user_contributions(user_contributions)
    return user_contributions


def update_user_contributions(user_id, created_exploration_ids,
                              edited_exploration_ids):
    """Updates an existing UserContributionsModel with new calculated
    contributions"""

    user_contributions = get_user_contributions(user_id, strict=False)
    if not user_contributions:
        raise Exception(
            'User contributions model for user %s does not exist.' % user_id)

    user_contributions.created_exploration_ids = created_exploration_ids
    user_contributions.edited_exploration_ids = edited_exploration_ids

    _save_user_contributions(user_contributions)


def add_created_exploration_id(user_id, exploration_id):
    """Adds an exploration_id to a user_id's UserContributionsModel collection
    of created explorations."""

    user_contributions = get_user_contributions(user_id, strict=False)

    if not user_contributions:
        create_user_contributions(user_id, [exploration_id], [])
    elif exploration_id not in user_contributions.created_exploration_ids:
        user_contributions.created_exploration_ids.append(exploration_id)
        user_contributions.created_exploration_ids.sort()
        _save_user_contributions(user_contributions)


def add_edited_exploration_id(user_id, exploration_id):
    """Adds an exploration_id to a user_id's UserContributionsModel collection
    of edited explorations."""

    user_contributions = get_user_contributions(user_id, strict=False)

    if not user_contributions:
        create_user_contributions(user_id, [], [exploration_id])

    elif exploration_id not in user_contributions.edited_exploration_ids:
        user_contributions.edited_exploration_ids.append(exploration_id)
        user_contributions.edited_exploration_ids.sort()
        _save_user_contributions(user_contributions)


def _save_user_contributions(user_contributions):
    """Commits a user contributions object to the datastore."""

    user_contributions.validate()
    user_models.UserContributionsModel(
        id=user_contributions.user_id,
        created_exploration_ids=user_contributions.created_exploration_ids,
        edited_exploration_ids=user_contributions.edited_exploration_ids,
    ).put()


def get_user_impact_score(user_id):
    """Returns user impact score associated with user_id"""

    model = user_models.UserStatsModel.get(user_id, strict=False)

    if model:
        return model.impact_score
    else:
        return 0
