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

"""Domain objects for user."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from constants import constants
from core.domain import role_services

from core.platform import models
import feconf
import python_utils
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


class UserSettings(python_utils.OBJECT):
    """Value object representing a user's settings.

    Attributes:
        user_id: str. The unique ID of the user.
        email: str. The user email.
        role: str. Role of the user.
        username: str or None. Identifiable username to display in the UI.
        last_agreed_to_terms: datetime.datetime or None. When the user last
            agreed to the terms of the site.
        last_started_state_editor_tutorial: datetime.datetime or None. When
            the user last started the state editor tutorial.
        last_started_state_translation_tutorial: datetime.datetime or None. When
            the user last started the state translation tutorial.
        last_logged_in: datetime.datetime or None. When the user last logged in.
        last_created_an_exploration: datetime.datetime or None. When the user
            last created an exploration.
        last_edited_an_exploration: datetime.datetime or None. When the user
            last edited an exploration.
        profile_picture_data_url: str or None. User uploaded profile picture as
            a dataURI string.
        default_dashboard: str or None. The default dashboard of the user.
        user_bio: str. User-specified biography.
        subject_interests: list(str) or None. Subject interests specified by
            the user.
        first_contribution_msec: float or None. The time in milliseconds when
            the user first contributed to Oppia.
        preferred_language_codes: list(str) or None. Exploration language
            preferences specified by the user.
        preferred_site_language_code: str or None. System language preference.
        preferred_audio_language_code: str or None. Audio language preference.
        pin: str or None. The PIN of the user's profile for android.
        display_alias: str or None. Display name of a user who is logged
            into the Android app. None when the request is coming from web
            because we don't use it there.
    """

    def __init__(
            self, user_id, email, role, username=None,
            last_agreed_to_terms=None, last_started_state_editor_tutorial=None,
            last_started_state_translation_tutorial=None, last_logged_in=None,
            last_created_an_exploration=None, last_edited_an_exploration=None,
            profile_picture_data_url=None, default_dashboard=None,
            creator_dashboard_display_pref=(
                constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS['CARD']),
            user_bio='', subject_interests=None, first_contribution_msec=None,
            preferred_language_codes=None, preferred_site_language_code=None,
            preferred_audio_language_code=None, pin=None, display_alias=None,
            deleted=False, created_on=None):
        """Constructs a UserSettings domain object.

        Args:
            user_id: str. The unique ID of the user.
            email: str. The user email.
            role: str. Role of the user.
            username: str or None. Identifiable username to display in the UI.
            last_agreed_to_terms: datetime.datetime or None. When the user
                last agreed to the terms of the site.
            last_started_state_editor_tutorial: datetime.datetime or None. When
                the user last started the state editor tutorial.
            last_started_state_translation_tutorial: datetime.datetime or None.
                When the user last started the state translation tutorial.
            last_logged_in: datetime.datetime or None. When the user last
                logged in.
            last_created_an_exploration: datetime.datetime or None. When the
                user last created an exploration.
            last_edited_an_exploration: datetime.datetime or None. When the
                user last edited an exploration.
            profile_picture_data_url: str or None. User uploaded profile
                picture as a dataURI string.
            default_dashboard: str|None. The default dashboard of the user.
            creator_dashboard_display_pref: str. The creator dashboard of the
                user.
            user_bio: str. User-specified biography.
            subject_interests: list(str) or None. Subject interests specified by
                the user.
            first_contribution_msec: float or None. The time in milliseconds
                when the user first contributed to Oppia.
            preferred_language_codes: list(str) or None. Exploration language
                preferences specified by the user.
            preferred_site_language_code: str or None. System language
                preference.
            preferred_audio_language_code: str or None. Default language used
                for audio translations preference.
            pin: str or None. The PIN of the user's profile for android.
            display_alias: str or None. Display name of a user who is logged
                into the Android app. None when the request is coming from
                web because we don't use it there.
            deleted: bool. Whether the user has requested removal of their
                account.
            created_on: datetime.datetime. When the user was created on.
        """
        self.user_id = user_id
        self.email = email
        self.role = role
        self.username = username
        self.last_agreed_to_terms = last_agreed_to_terms
        self.last_started_state_editor_tutorial = (
            last_started_state_editor_tutorial)
        self.last_started_state_translation_tutorial = (
            last_started_state_translation_tutorial)
        self.last_logged_in = last_logged_in
        self.last_edited_an_exploration = last_edited_an_exploration
        self.last_created_an_exploration = last_created_an_exploration
        self.profile_picture_data_url = profile_picture_data_url
        self.default_dashboard = default_dashboard
        self.creator_dashboard_display_pref = creator_dashboard_display_pref
        self.user_bio = user_bio
        self.subject_interests = (
            subject_interests if subject_interests else [])
        self.first_contribution_msec = first_contribution_msec
        self.preferred_language_codes = (
            preferred_language_codes if preferred_language_codes else [])
        self.preferred_site_language_code = preferred_site_language_code
        self.preferred_audio_language_code = preferred_audio_language_code
        self.pin = pin
        self.display_alias = display_alias
        self.deleted = deleted
        self.created_on = created_on

    def validate(self):
        """Checks that the user_id, email, role, pin and display_alias
        fields of this UserSettings domain object are valid.

        Raises:
            ValidationError. The user_id is not str.
            ValidationError. The email is not str.
            ValidationError. The email is invalid.
            ValidationError. The role is not str.
            ValidationError. Given role does not exist.
            ValidationError. The pin is not str.
            ValidationError. The display alias is not str.
        """
        if not isinstance(self.user_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected user_id to be a string, received %s' % self.user_id)
        if not self.user_id:
            raise utils.ValidationError('No user id specified.')
        if not utils.is_user_id_valid(
                self.user_id,
                allow_system_user_id=True,
                allow_pseudonymous_id=True
        ):
            raise utils.ValidationError('The user ID is in a wrong format.')

        if not isinstance(self.role, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected role to be a string, received %s' % self.role)
        if not role_services.is_valid_role(self.role):
            raise utils.ValidationError('Role %s does not exist.' % self.role)

        if self.pin is not None:
            if not isinstance(self.pin, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected PIN to be a string, received %s' %
                    self.pin
                )
            elif (len(self.pin) != feconf.FULL_USER_PIN_LENGTH and
                  len(self.pin) != feconf.PROFILE_USER_PIN_LENGTH):
                raise utils.ValidationError(
                    'User PIN can only be of length %s or %s' %
                    (
                        feconf.FULL_USER_PIN_LENGTH,
                        feconf.PROFILE_USER_PIN_LENGTH
                    )
                )
            else:
                for character in self.pin:
                    if character < '0' or character > '9':
                        raise utils.ValidationError(
                            'Only numeric characters are allowed in PIN.'
                        )

        if (self.display_alias is not None and
                not isinstance(self.display_alias, python_utils.BASESTRING)):
            raise utils.ValidationError(
                'Expected display_alias to be a string, received %s' %
                self.display_alias
            )

        if not isinstance(self.email, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected email to be a string, received %s' % self.email)
        if not self.email:
            raise utils.ValidationError('No user email specified.')
        if ('@' not in self.email or self.email.startswith('@')
                or self.email.endswith('@')):
            raise utils.ValidationError(
                'Invalid email address: %s' % self.email)

        if not isinstance(
                self.creator_dashboard_display_pref, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected dashboard display preference to be a string, '
                'received %s' % self.creator_dashboard_display_pref)
        if (self.creator_dashboard_display_pref not in
                list(constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.values(
                    ))):
            raise utils.ValidationError(
                '%s is not a valid value for the dashboard display '
                'preferences.' % (self.creator_dashboard_display_pref))

    def populate_from_modifiable_user_data(self, modifiable_user_data):
        """Populate the UserSettings domain object using the user data in
            modifiable_user_data.

        Args:
            modifiable_user_data: ModifiableUserData. The modifiable user
                data object with the information to be updated.

        Raises:
            ValidationError. None or empty value is provided for display alias
                attribute.
        """
        if (not modifiable_user_data.display_alias or
                not isinstance(
                    modifiable_user_data.display_alias,
                    python_utils.BASESTRING
                )
           ):
            raise utils.ValidationError(
                'Expected display_alias to be a string, received %s.' %
                modifiable_user_data.display_alias
            )
        self.display_alias = modifiable_user_data.display_alias
        self.preferred_language_codes = (
            modifiable_user_data.preferred_language_codes)
        self.preferred_site_language_code = (
            modifiable_user_data.preferred_site_language_code)
        self.preferred_audio_language_code = (
            modifiable_user_data.preferred_audio_language_code)
        self.pin = modifiable_user_data.pin

    def to_dict(self):
        """Convert the UserSettings domain instance into a dictionary form
        with its keys as the attributes of this class.

        Rerurns:
            dict. A dictionary containing the UserSettings class information
            in a dictionary form.
        """
        return {
            'email': self.email,
            'role': self.role,
            'username': self.username,
            'normalized_username': self.normalized_username,
            'last_agreed_to_terms': self.last_agreed_to_terms,
            'last_started_state_editor_tutorial': (
                self.last_started_state_editor_tutorial),
            'last_started_state_translation_tutorial': (
                self.last_started_state_translation_tutorial),
            'last_logged_in': self.last_logged_in,
            'last_edited_an_exploration': (
                self.last_edited_an_exploration),
            'last_created_an_exploration': (
                self.last_created_an_exploration),
            'profile_picture_data_url': self.profile_picture_data_url,
            'default_dashboard': self.default_dashboard,
            'creator_dashboard_display_pref': (
                self.creator_dashboard_display_pref),
            'user_bio': self.user_bio,
            'subject_interests': self.subject_interests,
            'first_contribution_msec': self.first_contribution_msec,
            'preferred_language_codes': self.preferred_language_codes,
            'preferred_site_language_code': (
                self.preferred_site_language_code),
            'preferred_audio_language_code': (
                self.preferred_audio_language_code),
            'pin': self.pin,
            'display_alias': self.display_alias,
            'deleted': self.deleted,
            'created_on': self.created_on
        }

    @property
    def truncated_email(self):
        """Returns truncated email by replacing last two characters before @
        with period.

        Returns:
            str. The truncated email address of this UserSettings
            domain object.
        """

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
    def normalized_username(self):
        """Returns username in lowercase or None if it does not exist.

        Returns:
            str or None. If this object has a 'username' property, returns
            the normalized version of the username. Otherwise, returns None.
        """

        return self.normalize_username(self.username)

    @classmethod
    def normalize_username(cls, username):
        """Returns the normalized version of the given username,
        or None if the passed-in 'username' is None.

        Args:
            username: str. Identifiable username to display in the UI.

        Returns:
            str or None. The normalized version of the given username,
            or None if the passed-in username is None.
        """

        return username.lower() if username else None

    @classmethod
    def require_valid_username(cls, username):
        """Checks if the given username is valid or not.

        Args:
            username: str. The username to validate.

        Raises:
            ValidationError. An empty username is supplied.
            ValidationError. The given username exceeds the maximum allowed
                number of characters.
            ValidationError. The given username contains non-alphanumeric
                characters.
            ValidationError. The given username contains reserved substrings.
        """
        if not username:
            raise utils.ValidationError('Empty username supplied.')
        elif len(username) > constants.MAX_USERNAME_LENGTH:
            raise utils.ValidationError(
                'A username can have at most %s characters.'
                % constants.MAX_USERNAME_LENGTH)
        elif not re.match(feconf.ALPHANUMERIC_REGEX, username):
            raise utils.ValidationError(
                'Usernames can only have alphanumeric characters.')
        else:
            # Disallow usernames that contain the system usernames or the
            # strings "admin" or "oppia".
            reserved_usernames = set(feconf.SYSTEM_USERS.values()) | set([
                'admin', 'oppia'])
            for reserved_username in reserved_usernames:
                if reserved_username in username.lower().strip():
                    raise utils.ValidationError(
                        'This username is not available.')


class UserActionsInfo(python_utils.OBJECT):
    """A class representing information of user actions.

    Attributes:
        user_id: str. The unique ID of the user.
        role: str. The role ID of the user.
        actions: list(str). A list of actions accessible to the role.
    """

    def __init__(self, user_id, role, actions):
        self._user_id = user_id
        self._role = role
        self._actions = actions

    @property
    def user_id(self):
        """Returns the unique ID of the user.

        Returns:
            user_id: str. The unique ID of the user.
        """
        return self._user_id

    @property
    def role(self):
        """Returns the role ID of user.

        Returns:
            role: str. The role ID of the user.
        """
        return self._role

    @property
    def actions(self):
        """Returns list of actions accessible to a user.

        Returns:
            actions: list(str). List of actions accessible to a user ID.
        """
        return self._actions


class UserContributions(python_utils.OBJECT):
    """Value object representing a user's contributions.

    Attributes:
        user_id: str. The unique ID of the user.
        created_exploration_ids: list(str). IDs of explorations that this
            user has created.
        edited_exploration_ids: list(str). IDs of explorations that this
            user has edited.
    """

    def __init__(
            self, user_id, created_exploration_ids, edited_exploration_ids):
        """Constructs a UserContributions domain object.

        Args:
            user_id: str. The unique ID of the user.
            created_exploration_ids: list(str). IDs of explorations that this
                user has created.
            edited_exploration_ids: list(str). IDs of explorations that this
                user has edited.
        """
        self.user_id = user_id
        self.created_exploration_ids = created_exploration_ids
        self.edited_exploration_ids = edited_exploration_ids

    def validate(self):
        """Checks that user_id, created_exploration_ids and
        edited_exploration_ids fields of this UserContributions
        domain object are valid.

        Raises:
            ValidationError. The user_id is not str.
            ValidationError. The created_exploration_ids is not a list.
            ValidationError. The exploration_id in created_exploration_ids
                is not str.
            ValidationError. The edited_exploration_ids is not a list.
            ValidationError. The exploration_id in edited_exploration_ids
                is not str.
        """
        if not isinstance(self.user_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected user_id to be a string, received %s' % self.user_id)
        if not self.user_id:
            raise utils.ValidationError('No user id specified.')

        if not isinstance(self.created_exploration_ids, list):
            raise utils.ValidationError(
                'Expected created_exploration_ids to be a list, received %s'
                % self.created_exploration_ids)
        for exploration_id in self.created_exploration_ids:
            if not isinstance(exploration_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected exploration_id in created_exploration_ids '
                    'to be a string, received %s' % (
                        exploration_id))

        if not isinstance(self.edited_exploration_ids, list):
            raise utils.ValidationError(
                'Expected edited_exploration_ids to be a list, received %s'
                % self.edited_exploration_ids)
        for exploration_id in self.edited_exploration_ids:
            if not isinstance(exploration_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected exploration_id in edited_exploration_ids '
                    'to be a string, received %s' % (
                        exploration_id))


class UserGlobalPrefs(python_utils.OBJECT):
    """Domain object for user global email preferences.

    Attributes:
        can_receive_email_updates: bool. Whether the user can receive
            email updates.
        can_receive_editor_role_email: bool. Whether the user can receive
            emails notifying them of role changes.
        can_receive_feedback_message_email: bool. Whether the user can
            receive emails when users submit feedback to their explorations.
        can_receive_subscription_email: bool. Whether the user can receive
             subscription emails notifying them about new explorations.
    """

    def __init__(
            self, can_receive_email_updates, can_receive_editor_role_email,
            can_receive_feedback_message_email,
            can_receive_subscription_email):
        """Constructs a UserGlobalPrefs domain object.

        Args:
            can_receive_email_updates: bool. Whether the user can receive
                email updates.
            can_receive_editor_role_email: bool. Whether the user can receive
                emails notifying them of role changes.
            can_receive_feedback_message_email: bool. Whether the user can
                receive emails when users submit feedback to their explorations.
            can_receive_subscription_email: bool. Whether the user can receive
                subscription emails notifying them about new explorations.
        """
        self.can_receive_email_updates = can_receive_email_updates
        self.can_receive_editor_role_email = can_receive_editor_role_email
        self.can_receive_feedback_message_email = ( # pylint: disable=invalid-name
            can_receive_feedback_message_email)
        self.can_receive_subscription_email = can_receive_subscription_email

    @classmethod
    def create_default_prefs(cls):
        """Returns UserGlobalPrefs with default attributes."""
        return cls(
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)


class UserExplorationPrefs(python_utils.OBJECT):
    """Domain object for user exploration email preferences.

    Attributes:
        mute_feedback_notifications: bool. Whether the given user has muted
            feedback emails.
        mute_suggestion_notifications: bool. Whether the given user has
            muted suggestion emails.
    """

    def __init__(
            self, mute_feedback_notifications, mute_suggestion_notifications):
        """Constructs a UserExplorationPrefs domain object.

        Args:
            mute_feedback_notifications: bool. Whether the given user has muted
                feedback emails.
            mute_suggestion_notifications: bool. Whether the given user has
                muted suggestion emails.
        """
        self.mute_feedback_notifications = mute_feedback_notifications
        self.mute_suggestion_notifications = mute_suggestion_notifications

    @classmethod
    def create_default_prefs(cls):
        """Returns UserExplorationPrefs with default attributes."""
        return cls(
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE,
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

    def to_dict(self):
        """Return dictionary representation of UserExplorationPrefs.

        Returns:
            dict. The keys of the dict are:
                'mute_feedback_notifications': bool. Whether the given user has
                    muted feedback emails.
                'mute_suggestion_notifications': bool. Whether the given user
                    has muted suggestion emails.
        """
        return {
            'mute_feedback_notifications': self.mute_feedback_notifications,
            'mute_suggestion_notifications': self.mute_suggestion_notifications
        }


class ExpUserLastPlaythrough(python_utils.OBJECT):
    """Domain object for an exploration last playthrough model."""

    def __init__(
            self, user_id, exploration_id, last_played_exp_version,
            last_updated, last_played_state_name):
        self.id = '%s.%s' % (user_id, exploration_id)
        self.user_id = user_id
        self.exploration_id = exploration_id
        self.last_played_exp_version = last_played_exp_version
        self.last_updated = last_updated
        self.last_played_state_name = last_played_state_name

    def update_last_played_information(
            self, last_played_exp_version, last_played_state_name):
        """Updates the last playthrough information of the user.

        Args:
            last_played_exp_version: int. The version of the exploration that
                was played by the user.
            last_played_state_name: str. The name of the state at which the
                learner left the exploration.
        """
        self.last_played_exp_version = last_played_exp_version
        self.last_played_state_name = last_played_state_name


class IncompleteActivities(python_utils.OBJECT):
    """Domain object for the incomplete activities model."""

    def __init__(
            self, user_id, exploration_ids, collection_ids, story_ids,
            partially_learnt_topic_ids, partially_mastered_topic_id=None):
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids
        self.story_ids = story_ids
        self.partially_learnt_topic_ids = partially_learnt_topic_ids
        self.partially_mastered_topic_id = partially_mastered_topic_id

    def add_exploration_id(self, exploration_id):
        """Adds the exploration id to the list of incomplete exploration ids.

        Args:
            exploration_id: str. The exploration id to be inserted into the
                incomplete list.
        """
        self.exploration_ids.append(exploration_id)

    def remove_exploration_id(self, exploration_id):
        """Removes the exploration id from the list of incomplete exploration
        ids.

        Args:
            exploration_id: str. The exploration id to be removed from the
                incomplete list.
        """
        self.exploration_ids.remove(exploration_id)

    def add_collection_id(self, collection_id):
        """Adds the collection id to the list of incomplete collection ids.

        Args:
            collection_id: str. The collection id to be inserted into the
                incomplete list.
        """
        self.collection_ids.append(collection_id)

    def remove_collection_id(self, collection_id):
        """Removes the collection id from the list of incomplete collection
        ids.

        Args:
            collection_id: str. The collection id to be removed from the
                incomplete list.
        """
        self.collection_ids.remove(collection_id)

    def add_story_id(self, story_id):
        """Adds the story id to the list of incomplete story ids.

        Args:
            story_id: str. The story id to be inserted into the
                incomplete list.
        """
        self.story_ids.append(story_id)

    def remove_story_id(self, story_id):
        """Removes the story id from the list of incomplete story
        ids.

        Args:
            story_id: str. The story id to be removed from the
                incomplete list.
        """
        self.story_ids.remove(story_id)

    def add_partially_learnt_topic_id(self, partially_learnt_topic_id):
        """Adds the topic id to the list of partially learnt topic ids.

        Args:
            partially_learnt_topic_id: str. The topic id to be inserted in the
                partially learnt list.
        """
        self.partially_learnt_topic_ids.append(partially_learnt_topic_id)

    def remove_partially_learnt_topic_id(self, partially_learnt_topic_id):
        """Removes the topic id from the list of partially learnt topic
        ids.

        Args:
            partially_learnt_topic_id: str. The topic id to be removed from the
                partially learnt list.
        """
        self.partially_learnt_topic_ids.remove(partially_learnt_topic_id)


class CompletedActivities(python_utils.OBJECT):
    """Domain object for the activities completed by learner model."""

    def __init__(
            self, user_id, exploration_ids, collection_ids, story_ids,
            learnt_topic_ids, mastered_topic_ids=None):
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids
        self.story_ids = story_ids
        self.learnt_topic_ids = learnt_topic_ids
        self.mastered_topic_ids = mastered_topic_ids

    def add_exploration_id(self, exploration_id):
        """Adds the exploration id to the list of completed exploration ids.

        Args:
            exploration_id: str. The exploration id to be inserted into the
                completed list.
        """
        self.exploration_ids.append(exploration_id)

    def remove_exploration_id(self, exploration_id):
        """Removes the exploration id from the list of completed exploration
        ids.

        Args:
            exploration_id: str. The exploration id to be removed from the
                completed list.
        """
        self.exploration_ids.remove(exploration_id)

    def add_collection_id(self, collection_id):
        """Adds the collection id to the list of completed collection ids.

        Args:
            collection_id: str. The collection id to be inserted into the
                completed list.
        """
        self.collection_ids.append(collection_id)

    def remove_collection_id(self, collection_id):
        """Removes the collection id from the list of completed collection
        ids.

        Args:
            collection_id: str. The collection id to be removed from the
                completed list.
        """
        self.collection_ids.remove(collection_id)

    def add_story_id(self, story_id):
        """Adds the story id to the list of completed story ids.

        Args:
            story_id: str. The story id to be inserted in the
                completed list.
        """
        self.story_ids.append(story_id)

    def remove_story_id(self, story_id):
        """Removes the story id from the list of completed story
        ids.

        Args:
            story_id: str. The story id to be removed from the
                completed list.
        """
        self.story_ids.remove(story_id)

    def add_learnt_topic_id(self, learnt_topic_id):
        """Adds the topic id to the list of learnt topic ids.

        Args:
            learnt_topic_id: str. The topic id to be inserted in the
                learnt list.
        """
        self.learnt_topic_ids.append(learnt_topic_id)

    def remove_learnt_topic_id(self, learnt_topic_id):
        """Removes the topic id from the list of learnt topic
        ids.

        Args:
            learnt_topic_id: str. The topic id to be removed from the
                learnt list.
        """
        self.learnt_topic_ids.remove(learnt_topic_id)


class LearnerPlaylist(python_utils.OBJECT):
    """Domain object for the learner playlist model."""

    def __init__(
            self, user_id, exploration_ids, collection_ids):
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids

    def insert_exploration_id_at_given_position(
            self, exploration_id, position_to_be_inserted):
        """Inserts the given exploration id at the given position.

        Args:
            exploration_id: str. The exploration id to be inserted into the
                play later list.
            position_to_be_inserted: int. The position at which it
                is to be inserted.
        """
        self.exploration_ids.insert(
            position_to_be_inserted, exploration_id)

    def add_exploration_id_to_list(self, exploration_id):
        """Inserts the exploration id at the end of the list.

        Args:
            exploration_id: str. The exploration id to be appended to the end
                of the list.
        """
        self.exploration_ids.append(exploration_id)

    def insert_collection_id_at_given_position(
            self, collection_id, position_to_be_inserted):
        """Inserts the given collection id at the given position.

        Args:
            collection_id: str. The collection id to be inserted into the
                play later list.
            position_to_be_inserted: int. The position at which it
                is to be inserted.
        """
        self.collection_ids.insert(position_to_be_inserted, collection_id)

    def add_collection_id_to_list(self, collection_id):
        """Inserts the collection id at the end of the list.

        Args:
            collection_id: str. The collection id to be appended to the end
                of the list.
        """
        self.collection_ids.append(collection_id)

    def remove_exploration_id(self, exploration_id):
        """Removes the exploration id from the learner playlist.

        exploration_id: str. The id of the exploration to be removed.
        """
        self.exploration_ids.remove(exploration_id)

    def remove_collection_id(self, collection_id):
        """Removes the collection id from the learner playlist.

        collection_id: str. The id of the collection to be removed.
        """
        self.collection_ids.remove(collection_id)


class UserContributionProficiency(python_utils.OBJECT):
    """Domain object for UserContributionProficiencyModel."""

    def __init__(self, user_id, score_category, score, onboarding_email_sent):
        self.user_id = user_id
        self.score_category = score_category
        self.score = score
        self.onboarding_email_sent = onboarding_email_sent

    def increment_score(self, increment_by):
        """Increments the score of the user in the category by the given amount.

        In the first version of the scoring system, the increment_by quantity
        will be +1, i.e, each user gains a point for a successful contribution
        and doesn't lose score in any way.

        Args:
            increment_by: float. The amount to increase the score of the user
                by.
        """
        self.score += increment_by

    def can_user_review_category(self):
        """Checks if user can review suggestions in category score_category.
        If the user has score above the minimum required score, then the user
        is allowed to review.

        Returns:
            bool. Whether the user can review suggestions under category
            score_category.
        """
        return self.score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW

    def mark_onboarding_email_as_sent(self):
        """Marks the email as sent."""
        self.onboarding_email_sent = True


class UserContributionRights(python_utils.OBJECT):
    """Domain object for the UserContributionRightsModel."""

    def __init__(
            self, user_id, can_review_translation_for_language_codes,
            can_review_voiceover_for_language_codes, can_review_questions,
            can_submit_questions):
        self.id = user_id
        self.can_review_translation_for_language_codes = (
            can_review_translation_for_language_codes)
        self.can_review_voiceover_for_language_codes = (
            can_review_voiceover_for_language_codes)
        self.can_review_questions = can_review_questions
        self.can_submit_questions = can_submit_questions

    def can_review_at_least_one_item(self):
        """Checks whether user has rights to review at least one item.

        Returns:
            boolean. Whether user has rights to review at east one item.
        """
        return (
            self.can_review_translation_for_language_codes or
            self.can_review_voiceover_for_language_codes or
            self.can_review_questions)

    def validate(self):
        """Validates different attributes of the class."""
        if not isinstance(self.can_review_translation_for_language_codes, list):
            raise utils.ValidationError(
                'Expected can_review_translation_for_language_codes to be a '
                'list, found: %s' % type(
                    self.can_review_translation_for_language_codes))
        for language_code in self.can_review_translation_for_language_codes:
            if not utils.is_supported_audio_language_code(language_code):
                raise utils.ValidationError('Invalid language_code: %s' % (
                    language_code))
        if len(self.can_review_translation_for_language_codes) != len(set(
                self.can_review_translation_for_language_codes)):
            raise utils.ValidationError(
                'Expected can_review_translation_for_language_codes list not '
                'to have duplicate values, found: %s' % (
                    self.can_review_translation_for_language_codes))

        if not isinstance(self.can_review_voiceover_for_language_codes, list):
            raise utils.ValidationError(
                'Expected can_review_voiceover_for_language_codes to be a '
                'list, found: %s' % type(
                    self.can_review_voiceover_for_language_codes))
        for language_code in self.can_review_voiceover_for_language_codes:
            if not utils.is_supported_audio_language_code(language_code):
                raise utils.ValidationError('Invalid language_code: %s' % (
                    language_code))
        if len(self.can_review_voiceover_for_language_codes) != len(set(
                self.can_review_voiceover_for_language_codes)):
            raise utils.ValidationError(
                'Expected can_review_voiceover_for_language_codes list not to '
                'have duplicate values, found: %s' % (
                    self.can_review_voiceover_for_language_codes))

        if not isinstance(self.can_review_questions, bool):
            raise utils.ValidationError(
                'Expected can_review_questions to be a boolean value, '
                'found: %s' % type(self.can_review_questions))

        if not isinstance(self.can_submit_questions, bool):
            raise utils.ValidationError(
                'Expected can_submit_questions to be a boolean value, '
                'found: %s' % type(self.can_submit_questions))


class ModifiableUserData(python_utils.OBJECT):
    """Domain object to represent the new values in a UserSettingsModel change
    submitted by the Android client.
    """

    def __init__(
            self, display_alias, pin, preferred_language_codes,
            preferred_site_language_code, preferred_audio_language_code,
            user_id=None):
        """Constructs a ModifiableUserData domain object.

        Args:
            display_alias: str. Display alias of the user shown on Android.
            pin: str or None. PIN of the user used for PIN based authentication
                on Android. None if it hasn't been set till now.
            preferred_language_codes: list(str) or None. Exploration language
                preferences specified by the user.
            preferred_site_language_code: str or None. System language
                preference.
            preferred_audio_language_code: str or None. Audio language
                preference.
            user_id: str or None. User ID of the user whose data is being
                updated. None if request did not have a user_id for the user
                yet and expects the backend to create a new user entry for it.
        """
        self.display_alias = display_alias
        self.pin = pin
        self.preferred_language_codes = preferred_language_codes
        self.preferred_site_language_code = preferred_site_language_code
        self.preferred_audio_language_code = preferred_audio_language_code
        # The user_id is not intended to be a modifiable attribute, it is just
        # needed to identify the object.
        self.user_id = user_id

    @classmethod
    def from_dict(cls, modifiable_user_data_dict):
        """Return a ModifiableUserData domain object from a dict.

        Args:
            modifiable_user_data_dict: dict. The dict representation of
                ModifiableUserData object.

        Returns:
            ModifiableUserData. The corresponding ModifiableUserData domain
            object.
        """
        return ModifiableUserData(
            modifiable_user_data_dict['display_alias'],
            modifiable_user_data_dict['pin'],
            modifiable_user_data_dict['preferred_language_codes'],
            modifiable_user_data_dict['preferred_site_language_code'],
            modifiable_user_data_dict['preferred_audio_language_code'],
            modifiable_user_data_dict['user_id'],
        )

    CURRENT_SCHEMA_VERSION = 1

    @classmethod
    def from_raw_dict(cls, raw_user_data_dict):
        """Converts the raw_user_data_dict into a ModifiableUserData domain
        object by converting it according to the latest schema format.

        Args:
            raw_user_data_dict: dict. The input raw form of user_data dict
                coming from the controller layer, which has to be converted.

        Returns:
            ModifiableUserData. The domain object representing the user data
            dict transformed according to the latest schema version.
        """
        data_schema_version = raw_user_data_dict.get('schema_version')

        if data_schema_version is None:
            raise Exception(
                'Invalid modifiable user data: no schema version specified.')
        if (data_schema_version < 1) or (
                data_schema_version > cls.CURRENT_SCHEMA_VERSION):
            raise Exception(
                'Invalid version %s received. At present we can only process v1'
                ' to v%s modifiable user data.' % (
                    data_schema_version, cls.CURRENT_SCHEMA_VERSION)
            )

        return cls.from_dict(raw_user_data_dict)
