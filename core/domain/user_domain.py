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

from __future__ import annotations

import datetime
import re

from core import feconf
from core import utils
from core.constants import constants

from typing import Dict, List, Optional, TypedDict


# TODO(#15105): Refactor UserSettings to limit the number of Optional
# fields used in UserSettingsDict.
class UserSettingsDict(TypedDict):
    """Dictionary representing the UserSettings object."""

    email: str
    roles: List[str]
    banned: bool
    has_viewed_lesson_info_modal_once: bool
    username: Optional[str]
    normalized_username: Optional[str]
    last_agreed_to_terms: Optional[datetime.datetime]
    last_started_state_editor_tutorial: Optional[datetime.datetime]
    last_started_state_translation_tutorial: Optional[datetime.datetime]
    last_logged_in: Optional[datetime.datetime]
    last_created_an_exploration: Optional[datetime.datetime]
    last_edited_an_exploration: Optional[datetime.datetime]
    profile_picture_data_url: Optional[str]
    default_dashboard: str
    creator_dashboard_display_pref: str
    user_bio: str
    subject_interests: List[str]
    first_contribution_msec: Optional[float]
    preferred_language_codes: List[str]
    preferred_site_language_code: Optional[str]
    preferred_audio_language_code: Optional[str]
    preferred_translation_language_code: Optional[str]
    pin: Optional[str]
    display_alias: Optional[str]
    deleted: bool
    created_on: Optional[datetime.datetime]


class UserSettings:
    """Value object representing a user's settings.

    Attributes:
        user_id: str. The unique ID of the user.
        email: str. The user email.
        roles: list(str). Roles of the user.
        has_viewed_lesson_info_modal_once: bool. Flag to check whether
            the user has viewed lesson info modal once which shows the progress
            of the user through exploration checkpoints.
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
        default_dashboard: str. The default dashboard of the user.
        user_bio: str. User-specified biography.
        subject_interests: list(str) or None. Subject interests specified by
            the user.
        first_contribution_msec: float or None. The time in milliseconds when
            the user first contributed to Oppia.
        preferred_language_codes: list(str) or None. Exploration language
            preferences specified by the user.
        preferred_site_language_code: str or None. System language preference.
        preferred_audio_language_code: str or None. Audio language preference.
        preferred_translation_language_code: str or None. Text Translation
            language preference of the translator that persists on the
            contributor dashboard.
        pin: str or None. The PIN of the user's profile for android.
        display_alias: str or None. Display name of a user who is logged
            into the Android app. None when the request is coming from web
            because we don't use it there.
    """

    def __init__(
        self,
        user_id: str,
        email: str,
        roles: List[str],
        banned: bool,
        has_viewed_lesson_info_modal_once: bool,
        username: Optional[str] = None,
        last_agreed_to_terms: Optional[datetime.datetime] = None,
        last_started_state_editor_tutorial: (
            Optional[datetime.datetime]) = None,
        last_started_state_translation_tutorial: (
            Optional[datetime.datetime]) = None,
        last_logged_in: Optional[datetime.datetime]=None,
        last_created_an_exploration: (
            Optional[datetime.datetime]) = None,
        last_edited_an_exploration: (
            Optional[datetime.datetime]) = None,
        profile_picture_data_url: Optional[str]=None,
        default_dashboard: str = constants.DASHBOARD_TYPE_LEARNER,
        creator_dashboard_display_pref: str = (
            constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS['CARD']),
        user_bio: str = '',
        subject_interests: Optional[List[str]] = None,
        first_contribution_msec: Optional[float] = None,
        preferred_language_codes: Optional[List[str]] = None,
        preferred_site_language_code: Optional[str] = None,
        preferred_audio_language_code: Optional[str] = None,
        preferred_translation_language_code: Optional[str] = None,
        pin: Optional[str] = None,
        display_alias: Optional[str] = None,
        deleted: bool = False,
        created_on: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a UserSettings domain object.

        Args:
            user_id: str. The unique ID of the user.
            email: str. The user email.
            roles: list(str). Roles of the user.
            banned: bool. Whether the uses is banned.
            has_viewed_lesson_info_modal_once: bool. Flag to check whether
                the user has viewed lesson info modal once which shows the
                progress of the user through exploration checkpoints.
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
            default_dashboard: str. The default dashboard of the user.
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
            preferred_translation_language_code: str or None. Text Translation
                language preference of the translator that persists on the
                contributor dashboard.
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
        self.roles = roles
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
        self.preferred_translation_language_code = (
            preferred_translation_language_code)
        self.pin = pin
        self.display_alias = display_alias
        self.banned = banned
        self.deleted = deleted
        self.created_on = created_on
        self.has_viewed_lesson_info_modal_once = (
            has_viewed_lesson_info_modal_once)

    def validate(self) -> None:
        """Checks that the user_id, email, roles, banned, pin and display_alias
        fields of this UserSettings domain object are valid.

        Raises:
            ValidationError. The user_id is not str.
            ValidationError. The email is not str.
            ValidationError. The email is invalid.
            ValidationError. The roles is not a list.
            ValidationError. Given role does not exist.
            ValidationError. The pin is not str.
            ValidationError. The display alias is not str.
        """
        if not isinstance(self.user_id, str):
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

        if not isinstance(self.banned, bool):
            raise utils.ValidationError(
                'Expected banned to be a bool, received %s' % self.banned)

        if not isinstance(self.roles, list):
            raise utils.ValidationError(
                'Expected roles to be a list, received %s' % self.roles)

        if self.banned:
            if self.roles:
                raise utils.ValidationError(
                    'Expected roles for banned user to be empty, '
                    'recieved %s.' % self.roles)
        else:
            default_roles = []
            if len(self.roles) != len(set(self.roles)):
                raise utils.ValidationError(
                    'Roles contains duplicate values: %s' % self.roles)
            for role in self.roles:
                if not isinstance(role, str):
                    raise utils.ValidationError(
                        'Expected roles to be a string, received %s' % role)

                if role not in feconf.ALLOWED_USER_ROLES:
                    raise utils.ValidationError(
                        'Role %s does not exist.' % role)

                if role in feconf.ALLOWED_DEFAULT_USER_ROLES_ON_REGISTRATION:
                    default_roles.append(role)

            if len(default_roles) != 1:
                raise utils.ValidationError(
                    'Expected roles to contains one default role.')

        if self.pin is not None:
            if not isinstance(self.pin, str):
                raise utils.ValidationError(
                    'Expected PIN to be a string, received %s' %
                    self.pin
                )

            if (
                    len(self.pin) != feconf.FULL_USER_PIN_LENGTH and
                    len(self.pin) != feconf.PROFILE_USER_PIN_LENGTH
            ):
                raise utils.ValidationError(
                    'User PIN can only be of length %s or %s' %
                    (
                        feconf.FULL_USER_PIN_LENGTH,
                        feconf.PROFILE_USER_PIN_LENGTH
                    )
                )

            for character in self.pin:
                if character < '0' or character > '9':
                    raise utils.ValidationError(
                        'Only numeric characters are allowed in PIN.'
                    )

        if (self.display_alias is not None and
                not isinstance(self.display_alias, str)):
            raise utils.ValidationError(
                'Expected display_alias to be a string, received %s' %
                self.display_alias
            )

        if not isinstance(self.email, str):
            raise utils.ValidationError(
                'Expected email to be a string, received %s' % self.email)
        if not self.email:
            raise utils.ValidationError('No user email specified.')
        if ('@' not in self.email or self.email.startswith('@')
                or self.email.endswith('@')):
            raise utils.ValidationError(
                'Invalid email address: %s' % self.email)

        if not isinstance(self.creator_dashboard_display_pref, str):
            raise utils.ValidationError(
                'Expected dashboard display preference to be a string, '
                'received %s' % self.creator_dashboard_display_pref)
        if (self.creator_dashboard_display_pref not in
                list(constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.values(
                    ))):
            raise utils.ValidationError(
                '%s is not a valid value for the dashboard display '
                'preferences.' % (self.creator_dashboard_display_pref))

    def populate_from_modifiable_user_data(
        self, modifiable_user_data: ModifiableUserData
    ) -> None:
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
                not isinstance(modifiable_user_data.display_alias, str)):
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
        self.preferred_translation_language_code = (
            modifiable_user_data.preferred_translation_language_code)
        self.pin = modifiable_user_data.pin

    def to_dict(self) -> UserSettingsDict:
        """Convert the UserSettings domain instance into a dictionary form
        with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the UserSettings class information
            in a dictionary form.
        """
        return {
            'email': self.email,
            'roles': self.roles,
            'banned': self.banned,
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
            'preferred_translation_language_code': (
                self.preferred_translation_language_code),
            'pin': self.pin,
            'display_alias': self.display_alias,
            'deleted': self.deleted,
            'created_on': self.created_on,
            'has_viewed_lesson_info_modal_once': (
                self.has_viewed_lesson_info_modal_once)
        }

    @property
    def truncated_email(self) -> str:
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
    def normalized_username(self) -> Optional[str]:
        """Returns username in lowercase or None if it does not exist.

        Returns:
            str or None. If this object has a 'username' property, returns
            the normalized version of the username. Otherwise, returns None.
        """

        if self.username:
            return self.normalize_username(self.username)
        else:
            return None

    @classmethod
    def normalize_username(cls, username: str) -> str:
        """Returns the normalized version of the given username,
        or None if the passed-in 'username' is None.

        Args:
            username: str. Identifiable username to display in the UI.

        Returns:
            str. The normalized version of the given username.
        """

        return username.lower()

    @classmethod
    def require_valid_username(cls, username: str) -> None:
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
        if len(username) > constants.MAX_USERNAME_LENGTH:
            raise utils.ValidationError(
                'A username can have at most %s characters.'
                % constants.MAX_USERNAME_LENGTH)
        if not re.match(feconf.ALPHANUMERIC_REGEX, username):
            raise utils.ValidationError(
                'Usernames can only have alphanumeric characters.')

        # Disallow usernames that contain the system usernames or the
        # strings "admin" or "oppia".
        reserved_usernames = (
            set(feconf.SYSTEM_USERS.values()) | {'admin', 'oppia'}
        )
        for reserved_username in reserved_usernames:
            if reserved_username in username.lower().strip():
                raise utils.ValidationError('This username is not available.')

    def mark_banned(self) -> None:
        """Marks a user banned."""
        self.banned = True
        self.roles = []

    def unmark_banned(self, default_role: str) -> None:
        """Unmarks ban for a banned user.

        Args:
            default_role: str. The role assigned to the user after marking
                unbanned.
        """
        self.banned = False
        self.roles = [default_role]

    def mark_lesson_info_modal_viewed(self) -> None:
        """Sets has_viewed_lesson_info_modal_once to true which shows
        the user has viewed their progress through exploration in the lesson
        info modal at least once in their lifetime journey.
        """
        self.has_viewed_lesson_info_modal_once = True


class UserActionsInfo:
    """A class representing information of user actions.
    Attributes:
        user_id: str. The unique ID of the user.
        roles: list(str). The roles of the user.
        actions: list(str). A list of actions accessible to the role.
    """

    def __init__(
        self,
        user_id: str,
        roles: List[str],
        actions: List[str]
    ) -> None:
        self._user_id = user_id
        self._roles = roles
        self._actions = actions

    @property
    def user_id(self) -> str:
        """Returns the unique ID of the user.

        Returns:
            user_id: str. The unique ID of the user.
        """
        return self._user_id

    @property
    def roles(self) -> List[str]:
        """Returns the roles of user.

        Returns:
            role: list(str). The roles of the user.
        """
        return self._roles

    @property
    def actions(self) -> List[str]:
        """Returns list of actions accessible to a user.

        Returns:
            actions: list(str). List of actions accessible to a user ID.
        """
        return self._actions


class UserContributions:
    """Value object representing a user's contributions.

    Attributes:
        user_id: str. The unique ID of the user.
        created_exploration_ids: list(str). IDs of explorations that this
            user has created.
        edited_exploration_ids: list(str). IDs of explorations that this
            user has edited.
    """

    def __init__(
        self,
        user_id: str,
        created_exploration_ids: List[str],
        edited_exploration_ids: List[str]
    ) -> None:
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

    def validate(self) -> None:
        """Checks that user_id, created_exploration_ids and
        edited_exploration_ids fields of this UserContributions
        domain object are valid.

        Raises:
            ValidationError. No user id specified.
            ValidationError. The user_id is not str.
            ValidationError. The created_exploration_ids is not a list.
            ValidationError. The exploration_id in created_exploration_ids
                is not str.
            ValidationError. The edited_exploration_ids is not a list.
            ValidationError. The exploration_id in edited_exploration_ids
                is not str.
        """
        if not isinstance(self.user_id, str):
            raise utils.ValidationError(
                'Expected user_id to be a string, received %s' % self.user_id)
        if not self.user_id:
            raise utils.ValidationError('No user id specified.')

        if not isinstance(self.created_exploration_ids, list):
            raise utils.ValidationError(
                'Expected created_exploration_ids to be a list, received %s'
                % self.created_exploration_ids)
        for exploration_id in self.created_exploration_ids:
            if not isinstance(exploration_id, str):
                raise utils.ValidationError(
                    'Expected exploration_id in created_exploration_ids '
                    'to be a string, received %s' % (
                        exploration_id))

        if not isinstance(self.edited_exploration_ids, list):
            raise utils.ValidationError(
                'Expected edited_exploration_ids to be a list, received %s'
                % self.edited_exploration_ids)
        for exploration_id in self.edited_exploration_ids:
            if not isinstance(exploration_id, str):
                raise utils.ValidationError(
                    'Expected exploration_id in edited_exploration_ids '
                    'to be a string, received %s' % (
                        exploration_id))


class UserGlobalPrefs:
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
        self,
        can_receive_email_updates: bool,
        can_receive_editor_role_email: bool,
        can_receive_feedback_message_email: bool,
        can_receive_subscription_email: bool
    ) -> None:
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
    def create_default_prefs(cls) -> UserGlobalPrefs:
        """Returns UserGlobalPrefs with default attributes."""
        return cls(
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)


class UserExplorationPrefsDict(TypedDict):
    """Dictionary representing the UserExplorationPrefs object."""

    mute_feedback_notifications: bool
    mute_suggestion_notifications: bool


class UserExplorationPrefs:
    """Domain object for user exploration email preferences.

    Attributes:
        mute_feedback_notifications: bool. Whether the given user has muted
            feedback emails.
        mute_suggestion_notifications: bool. Whether the given user has
            muted suggestion emails.
    """

    def __init__(
        self,
        mute_feedback_notifications: bool,
        mute_suggestion_notifications: bool
    ) -> None:
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
    def create_default_prefs(cls) -> UserExplorationPrefs:
        """Returns UserExplorationPrefs with default attributes."""
        return cls(
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE,
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

    def to_dict(self) -> UserExplorationPrefsDict:
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


class ExpUserLastPlaythrough:
    """Domain object for an exploration last playthrough model."""

    def __init__(
        self,
        user_id: str,
        exploration_id: str,
        last_played_exp_version: int,
        last_updated: datetime.datetime,
        last_played_state_name: str
    ) -> None:
        self.id = '%s.%s' % (user_id, exploration_id)
        self.user_id = user_id
        self.exploration_id = exploration_id
        self.last_played_exp_version = last_played_exp_version
        self.last_updated = last_updated
        self.last_played_state_name = last_played_state_name

    def update_last_played_information(
        self,
        last_played_exp_version: int,
        last_played_state_name: str
    ) -> None:
        """Updates the last playthrough information of the user.

        Args:
            last_played_exp_version: int. The version of the exploration that
                was played by the user.
            last_played_state_name: str. The name of the state at which the
                learner left the exploration.
        """
        self.last_played_exp_version = last_played_exp_version
        self.last_played_state_name = last_played_state_name


class IncompleteActivities:
    """Domain object for the incomplete activities model."""

    def __init__(
        self,
        user_id: str,
        exploration_ids: List[str],
        collection_ids: List[str],
        story_ids: List[str],
        partially_learnt_topic_ids: List[str],
        partially_mastered_topic_id: Optional[str] = None
    ) -> None:
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids
        self.story_ids = story_ids
        self.partially_learnt_topic_ids = partially_learnt_topic_ids
        self.partially_mastered_topic_id = partially_mastered_topic_id

    def add_exploration_id(self, exploration_id: str) -> None:
        """Adds the exploration id to the list of incomplete exploration ids.

        Args:
            exploration_id: str. The exploration id to be inserted into the
                incomplete list.
        """
        self.exploration_ids.append(exploration_id)

    def remove_exploration_id(self, exploration_id: str) -> None:
        """Removes the exploration id from the list of incomplete exploration
        ids.

        Args:
            exploration_id: str. The exploration id to be removed from the
                incomplete list.
        """
        self.exploration_ids.remove(exploration_id)

    def add_collection_id(self, collection_id: str) -> None:
        """Adds the collection id to the list of incomplete collection ids.

        Args:
            collection_id: str. The collection id to be inserted into the
                incomplete list.
        """
        self.collection_ids.append(collection_id)

    def remove_collection_id(self, collection_id: str) -> None:
        """Removes the collection id from the list of incomplete collection
        ids.

        Args:
            collection_id: str. The collection id to be removed from the
                incomplete list.
        """
        self.collection_ids.remove(collection_id)

    def add_story_id(self, story_id: str) -> None:
        """Adds the story id to the list of incomplete story ids.

        Args:
            story_id: str. The story id to be inserted into the
                incomplete list.
        """
        self.story_ids.append(story_id)

    def remove_story_id(self, story_id: str) -> None:
        """Removes the story id from the list of incomplete story
        ids.

        Args:
            story_id: str. The story id to be removed from the
                incomplete list.
        """
        self.story_ids.remove(story_id)

    def add_partially_learnt_topic_id(
        self, partially_learnt_topic_id: str
    ) -> None:
        """Adds the topic id to the list of partially learnt topic ids.

        Args:
            partially_learnt_topic_id: str. The topic id to be inserted in the
                partially learnt list.
        """
        self.partially_learnt_topic_ids.append(partially_learnt_topic_id)

    def remove_partially_learnt_topic_id(
        self, partially_learnt_topic_id: str
    ) -> None:
        """Removes the topic id from the list of partially learnt topic
        ids.

        Args:
            partially_learnt_topic_id: str. The topic id to be removed from the
                partially learnt list.
        """
        self.partially_learnt_topic_ids.remove(partially_learnt_topic_id)


class CompletedActivities:
    """Domain object for the activities completed by learner model."""

    def __init__(
        self,
        user_id: str,
        exploration_ids: List[str],
        collection_ids: List[str],
        story_ids: List[str],
        learnt_topic_ids: List[str],
        mastered_topic_ids: Optional[List[str]] = None
    ) -> None:
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids
        self.story_ids = story_ids
        self.learnt_topic_ids = learnt_topic_ids
        self.mastered_topic_ids = mastered_topic_ids

    def add_exploration_id(self, exploration_id: str) -> None:
        """Adds the exploration id to the list of completed exploration ids.

        Args:
            exploration_id: str. The exploration id to be inserted into the
                completed list.
        """
        self.exploration_ids.append(exploration_id)

    def remove_exploration_id(self, exploration_id: str) -> None:
        """Removes the exploration id from the list of completed exploration
        ids.

        Args:
            exploration_id: str. The exploration id to be removed from the
                completed list.
        """
        self.exploration_ids.remove(exploration_id)

    def add_collection_id(self, collection_id: str) -> None:
        """Adds the collection id to the list of completed collection ids.

        Args:
            collection_id: str. The collection id to be inserted into the
                completed list.
        """
        self.collection_ids.append(collection_id)

    def remove_collection_id(self, collection_id: str) -> None:
        """Removes the collection id from the list of completed collection
        ids.

        Args:
            collection_id: str. The collection id to be removed from the
                completed list.
        """
        self.collection_ids.remove(collection_id)

    def add_story_id(self, story_id: str) -> None:
        """Adds the story id to the list of completed story ids.

        Args:
            story_id: str. The story id to be inserted in the
                completed list.
        """
        self.story_ids.append(story_id)

    def remove_story_id(self, story_id: str) -> None:
        """Removes the story id from the list of completed story
        ids.

        Args:
            story_id: str. The story id to be removed from the
                completed list.
        """
        self.story_ids.remove(story_id)

    def add_learnt_topic_id(self, learnt_topic_id: str) -> None:
        """Adds the topic id to the list of learnt topic ids.

        Args:
            learnt_topic_id: str. The topic id to be inserted in the
                learnt list.
        """
        self.learnt_topic_ids.append(learnt_topic_id)

    def remove_learnt_topic_id(self, learnt_topic_id: str) -> None:
        """Removes the topic id from the list of learnt topic
        ids.

        Args:
            learnt_topic_id: str. The topic id to be removed from the
                learnt list.
        """
        self.learnt_topic_ids.remove(learnt_topic_id)


class LearnerGoalsDict(TypedDict):
    """Dictionary representing the LearnerGoals object."""

    topic_ids_to_learn: List[str]
    topic_ids_to_master: List[str]


class LearnerGoals:
    """Domain object for the learner goals model."""

    def __init__(
        self,
        user_id: str,
        topic_ids_to_learn: List[str],
        topic_ids_to_master: List[str]
    ) -> None:
        self.id = user_id
        self.topic_ids_to_learn = topic_ids_to_learn
        self.topic_ids_to_master = topic_ids_to_master

    def add_topic_id_to_learn(self, topic_id: str) -> None:
        """Adds the topic id to 'topic IDs to learn' list.

        Args:
            topic_id: str. The topic id to be inserted to the learn list.
        """
        self.topic_ids_to_learn.append(topic_id)

    def remove_topic_id_from_learn(self, topic_id: str) -> None:
        """Removes the topic id from the 'topic IDs to learn' list.

        topic_id: str. The id of the topic to be removed.
        """
        self.topic_ids_to_learn.remove(topic_id)

    def to_dict(self) -> LearnerGoalsDict:
        """Return dictionary representation of LearnerGoals.

        Returns:
            dict. A dictionary containing the LearnerGoals class information
            in a dictionary form.
        """
        return {
            'topic_ids_to_learn': self.topic_ids_to_learn,
            'topic_ids_to_master': self.topic_ids_to_master
        }


class LearnerPlaylist:
    """Domain object for the learner playlist model."""

    def __init__(
        self,
        user_id: str,
        exploration_ids: List[str],
        collection_ids: List[str]
    ) -> None:
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids

    def insert_exploration_id_at_given_position(
        self, exploration_id: str, position_to_be_inserted: int
    ) -> None:
        """Inserts the given exploration id at the given position.

        Args:
            exploration_id: str. The exploration id to be inserted into the
                play later list.
            position_to_be_inserted: int. The position at which it
                is to be inserted.
        """
        self.exploration_ids.insert(
            position_to_be_inserted, exploration_id)

    def add_exploration_id_to_list(self, exploration_id: str) -> None:
        """Inserts the exploration id at the end of the list.

        Args:
            exploration_id: str. The exploration id to be appended to the end
                of the list.
        """
        self.exploration_ids.append(exploration_id)

    def insert_collection_id_at_given_position(
        self, collection_id: str, position_to_be_inserted: int
    ) -> None:
        """Inserts the given collection id at the given position.

        Args:
            collection_id: str. The collection id to be inserted into the
                play later list.
            position_to_be_inserted: int. The position at which it
                is to be inserted.
        """
        self.collection_ids.insert(position_to_be_inserted, collection_id)

    def add_collection_id_to_list(self, collection_id: str) -> None:
        """Inserts the collection id at the end of the list.

        Args:
            collection_id: str. The collection id to be appended to the end
                of the list.
        """
        self.collection_ids.append(collection_id)

    def remove_exploration_id(self, exploration_id: str) -> None:
        """Removes the exploration id from the learner playlist.

        exploration_id: str. The id of the exploration to be removed.
        """
        self.exploration_ids.remove(exploration_id)

    def remove_collection_id(self, collection_id: str) -> None:
        """Removes the collection id from the learner playlist.

        collection_id: str. The id of the collection to be removed.
        """
        self.collection_ids.remove(collection_id)


class UserContributionProficiency:
    """Domain object for UserContributionProficiencyModel."""

    def __init__(
        self,
        user_id: str,
        score_category: str,
        score: int,
        onboarding_email_sent: bool
    ) -> None:
        self.user_id = user_id
        self.score_category = score_category
        self.score = score
        self.onboarding_email_sent = onboarding_email_sent

    def increment_score(self, increment_by: int) -> None:
        """Increments the score of the user in the category by the given amount.

        In the first version of the scoring system, the increment_by quantity
        will be +1, i.e, each user gains a point for a successful contribution
        and doesn't lose score in any way.

        Args:
            increment_by: float. The amount to increase the score of the user
                by.
        """
        self.score += increment_by

    def can_user_review_category(self) -> bool:
        """Checks if user can review suggestions in category score_category.
        If the user has score above the minimum required score, then the user
        is allowed to review.

        Returns:
            bool. Whether the user can review suggestions under category
            score_category.
        """
        return self.score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW

    def mark_onboarding_email_as_sent(self) -> None:
        """Marks the email as sent."""
        self.onboarding_email_sent = True


class UserContributionRights:
    """Domain object for the UserContributionRightsModel."""

    def __init__(
        self,
        user_id: str,
        can_review_translation_for_language_codes: List[str],
        can_review_voiceover_for_language_codes: List[str],
        can_review_questions: bool,
        can_submit_questions: bool
    ):
        self.id = user_id
        self.can_review_translation_for_language_codes = (
            can_review_translation_for_language_codes)
        self.can_review_voiceover_for_language_codes = (
            can_review_voiceover_for_language_codes)
        self.can_review_questions = can_review_questions
        self.can_submit_questions = can_submit_questions

    def can_review_at_least_one_item(self) -> bool:
        """Checks whether user has rights to review at least one item.

        Returns:
            boolean. Whether user has rights to review at east one item.
        """
        # Note that 'can_review_translation_for_language_codes' and
        # 'can_review_voiceover_for_language_codes' are List[str], so we need
        # the bool cast to ensure that the return value is boolean.
        return bool(
            self.can_review_translation_for_language_codes or
            self.can_review_voiceover_for_language_codes or
            self.can_review_questions)

    def validate(self) -> None:
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


# TODO(#15106): Refactor ModifiableUserData to limit the number of Optional
# fields used in ModifiableUserDataDict.
class ModifiableUserDataDict(TypedDict):
    """Dictionary representing the ModifiableUserData object."""

    display_alias: str
    pin: Optional[str]
    preferred_language_codes: List[str]
    preferred_site_language_code: Optional[str]
    preferred_audio_language_code: Optional[str]
    preferred_translation_language_code: Optional[str]
    user_id: Optional[str]


class RawUserDataDict(TypedDict):
    """Type for the argument raw_user_data_dict."""

    schema_version: int
    display_alias: str
    pin: Optional[str]
    preferred_language_codes: List[str]
    preferred_site_language_code: Optional[str]
    preferred_audio_language_code: Optional[str]
    preferred_translation_language_code: Optional[str]
    user_id: Optional[str]


class ModifiableUserData:
    """Domain object to represent the new values in a UserSettingsModel change
    submitted by the Android client.
    """

    def __init__(
        self,
        display_alias: str,
        pin: Optional[str],
        preferred_language_codes: List[str],
        preferred_site_language_code: Optional[str],
        preferred_audio_language_code: Optional[str],
        preferred_translation_language_code: Optional[str],
        user_id: Optional[str] = None
    ) -> None:
        """Constructs a ModifiableUserData domain object.

        Args:
            display_alias: str. Display alias of the user shown on Android.
            pin: str or None. PIN of the user used for PIN based authentication
                on Android. None if it hasn't been set till now.
            preferred_language_codes: list(str). Exploration language
                preferences specified by the user.
            preferred_site_language_code: str or None. System language
                preference.
            preferred_audio_language_code: str or None. Audio language
                preference.
            preferred_translation_language_code: str or None. Text Translation
                language preference of the translator that persists on the
                contributor dashboard.
            user_id: str or None. User ID of the user whose data is being
                updated. None if request did not have a user_id for the user
                yet and expects the backend to create a new user entry for it.
        """
        self.display_alias = display_alias
        self.pin = pin
        self.preferred_language_codes = preferred_language_codes
        self.preferred_site_language_code = preferred_site_language_code
        self.preferred_audio_language_code = preferred_audio_language_code
        self.preferred_translation_language_code = (
            preferred_translation_language_code)
        # The user_id is not intended to be a modifiable attribute, it is just
        # needed to identify the object.
        self.user_id = user_id

    @classmethod
    def from_dict(
        cls, modifiable_user_data_dict: ModifiableUserDataDict
    ) -> ModifiableUserData:
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
            modifiable_user_data_dict['preferred_translation_language_code'],
            modifiable_user_data_dict['user_id'],
        )

    CURRENT_SCHEMA_VERSION = 1

    @classmethod
    def from_raw_dict(
        cls, raw_user_data_dict: RawUserDataDict
    ) -> ModifiableUserData:
        """Converts the raw_user_data_dict into a ModifiableUserData domain
        object by converting it according to the latest schema format.

        Args:
            raw_user_data_dict: dict. The input raw form of user_data dict
                coming from the controller layer, which has to be converted.

        Returns:
            ModifiableUserData. The domain object representing the user data
            dict transformed according to the latest schema version.

        Raises:
            Exception. No schema version specified.
            Exception. Schema version is not of type int.
            Exception. Invalid schema version.
        """
        data_schema_version = raw_user_data_dict['schema_version']

        if data_schema_version is None:
            raise Exception(
                'Invalid modifiable user data: no schema version specified.')
        if not isinstance(data_schema_version, int):
            raise Exception(
                'Version has invalid type, expected int, '
                'received %s' % type(data_schema_version)
            )
        if (
            not isinstance(data_schema_version, int) or
            data_schema_version < 1 or
            data_schema_version > cls.CURRENT_SCHEMA_VERSION
        ):
            raise Exception(
                'Invalid version %s received. At present we can only process v1'
                ' to v%s modifiable user data.' % (
                    data_schema_version, cls.CURRENT_SCHEMA_VERSION)
            )

        return cls.from_dict(raw_user_data_dict)


class ExplorationUserDataDict(TypedDict):
    """Dictionary representing the ExplorationUserData object."""

    rating: Optional[int]
    rated_on: Optional[datetime.datetime]
    draft_change_list: Optional[List[Dict[str, str]]]
    draft_change_list_last_updated: Optional[datetime.datetime]
    draft_change_list_exp_version: Optional[int]
    draft_change_list_id: int
    mute_suggestion_notifications: bool
    mute_feedback_notifications: bool
    furthest_reached_checkpoint_exp_version: Optional[int]
    furthest_reached_checkpoint_state_name: Optional[str]
    most_recently_reached_checkpoint_exp_version: Optional[int]
    most_recently_reached_checkpoint_state_name: Optional[str]


class ExplorationUserData:
    """Value object representing a user's exploration data.

    Attributes:
        user_id: str. The user id.
        exploration_id: str. The exploration id.
        rating: int or None. The rating (1-5) the user assigned to the
            exploration.
        rated_on: datetime or None. When the most recent rating was awarded,
            or None if not rated.
        draft_change_list: list(dict) or None. List of uncommitted changes made
            by the user to the exploration.
        draft_change_list_last_updated: datetime or None. Timestamp of when the
            change list was last updated.
        draft_change_list_exp_version: int or None. The exploration version
            that this change list applied to.
        draft_change_list_id: int. The version of the draft change list which
            was last saved by the user.
        mute_suggestion_notifications: bool. The user's preference for
            receiving suggestion emails for this exploration.
        mute_feedback_notifications: bool. The user's preference for receiving
            feedback emails for this exploration.
        furthest_reached_checkpoint_exp_version: int or None. The exploration
            version of furthest reached checkpoint.
        furthest_reached_checkpoint_state_name: str or None. The state name
            of the furthest reached checkpoint.
        most_recently_reached_checkpoint_exp_version: int or None. The
            exploration version of the most recently reached checkpoint.
        most_recently_reached_checkpoint_state_name: str or None. The state
            name of the most recently reached checkpoint.
    """

    def __init__(
        self,
        user_id: str,
        exploration_id: str,
        rating: Optional[int] = None,
        rated_on: Optional[datetime.datetime] = None,
        draft_change_list: Optional[List[Dict[str, str]]] = None,
        draft_change_list_last_updated: Optional[datetime.datetime] = None,
        draft_change_list_exp_version: Optional[int] = None,
        draft_change_list_id: int = 0,
        mute_suggestion_notifications: bool = (
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
        mute_feedback_notifications: bool = (
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE),
        furthest_reached_checkpoint_exp_version: Optional[int] = None,
        furthest_reached_checkpoint_state_name: Optional[str] = None,
        most_recently_reached_checkpoint_exp_version: Optional[int] = None,
        most_recently_reached_checkpoint_state_name: Optional[str] = None
    ) -> None:
        """Constructs a ExplorationUserData domain object.

        Attributes:
            user_id: str. The user id.
            exploration_id: str. The exploration id.
            rating: int or None. The rating (1-5) the user assigned to the
                exploration.
            rated_on: datetime or None. When the most recent rating was
                awarded, or None if not rated.
            draft_change_list: list(dict) or None. List of uncommitted
                changes made by the user to the exploration.
            draft_change_list_last_updated: datetime or None. Timestamp of
                when the change list was last updated.
            draft_change_list_exp_version: int or None. The exploration
                version that this change list applied to.
            draft_change_list_id: int. The version of the draft change list
                which was last saved by the user.
            mute_suggestion_notifications: bool. The user's preference for
                receiving suggestion emails for this exploration.
            mute_feedback_notifications: bool. The user's preference for
                receiving feedback emails for this exploration.
            furthest_reached_checkpoint_exp_version: int or None. The
                exploration version of furthest reached checkpoint.
            furthest_reached_checkpoint_state_name: str or None. The
                state name of the furthest reached checkpoint.
            most_recently_reached_checkpoint_exp_version: int or None. The
                exploration version of the most recently reached
                checkpoint.
            most_recently_reached_checkpoint_state_name: str or None. The
                state name of the most recently reached checkpoint.
        """
        self.user_id = user_id
        self.exploration_id = exploration_id
        self.rating = rating
        self.rated_on = rated_on
        self.draft_change_list = draft_change_list
        self.draft_change_list_last_updated = draft_change_list_last_updated
        self.draft_change_list_exp_version = draft_change_list_exp_version
        self.draft_change_list_id = draft_change_list_id
        self.mute_suggestion_notifications = mute_suggestion_notifications
        self.mute_feedback_notifications = mute_feedback_notifications
        self.furthest_reached_checkpoint_exp_version = (
            furthest_reached_checkpoint_exp_version)
        self.furthest_reached_checkpoint_state_name = (
            furthest_reached_checkpoint_state_name)
        self.most_recently_reached_checkpoint_exp_version = (
            most_recently_reached_checkpoint_exp_version)
        self.most_recently_reached_checkpoint_state_name = (
            most_recently_reached_checkpoint_state_name)

    def to_dict(self) -> ExplorationUserDataDict:
        """Convert the ExplorationUserData domain instance into a dictionary
        form with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the UserSettings class information
            in a dictionary form.
        """

        return {
            'rating': self.rating,
            'rated_on': self.rated_on,
            'draft_change_list': self.draft_change_list,
            'draft_change_list_last_updated': (
                self.draft_change_list_last_updated),
            'draft_change_list_exp_version': self.draft_change_list_exp_version,
            'draft_change_list_id': self.draft_change_list_id,
            'mute_suggestion_notifications': self.mute_suggestion_notifications,
            'mute_feedback_notifications': self.mute_feedback_notifications,
            'furthest_reached_checkpoint_exp_version': (
                self.furthest_reached_checkpoint_exp_version),
            'furthest_reached_checkpoint_state_name': (
                self.furthest_reached_checkpoint_state_name),
            'most_recently_reached_checkpoint_exp_version': (
                self.most_recently_reached_checkpoint_exp_version),
            'most_recently_reached_checkpoint_state_name': (
                self.most_recently_reached_checkpoint_state_name)
        }


class LearnerGroupsUserDict(TypedDict):
    """Dictionary for LearnerGroupsUser domain object."""

    user_id: str
    invited_to_learner_groups_ids: List[str]
    learner_groups_user_details: List[LearnerGroupUserDetailsDict]
    learner_groups_user_details_schema_version: int


class LearnerGroupUserDetailsDict(TypedDict):
    """Dictionary for user details of a particular learner group."""

    group_id: str
    progress_sharing_is_turned_on: bool


class LearnerGroupUserDetails:
    """Domain object for user details of a particular learner group."""

    def __init__(
        self,
        group_id: str,
        progress_sharing_is_turned_on: bool
    ) -> None:
        """Constructs a LearnerGroupUserDetails domain object.

        Attributes:
            group_id: str. The id of the learner group.
            progress_sharing_is_turned_on: bool. Whether progress sharing is
                turned on for the learner group.
        """
        self.group_id = group_id
        self.progress_sharing_is_turned_on = progress_sharing_is_turned_on

    def to_dict(self) -> LearnerGroupUserDetailsDict:
        """Convert the LearnerGroupUserDetails domain instance into a
        dictionary form with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the LearnerGroupUserDetails class
            information in a dictionary form.
        """
        return {
            'group_id': self.group_id,
            'progress_sharing_is_turned_on': self.progress_sharing_is_turned_on
        }


class LearnerGroupsUser:
    """Domain object for learner groups user."""

    def __init__(
        self,
        user_id: str,
        invited_to_learner_groups_ids: List[str],
        learner_groups_user_details: List[LearnerGroupUserDetails],
        learner_groups_user_details_schema_version: int
    ) -> None:
        """Constructs a LearnerGroupsUser domain object.

        Attributes:
            user_id: str. The user id.
            invited_to_learner_groups_ids: list(str). List of learner group ids
                that the user has been invited to join as learner.
            learner_groups_user_details:
                list(LearnerGroupUserDetails). List of user details of
                all learner groups that the user is learner of.
            learner_groups_user_details_schema_version: int. The version
                of the learner groups user details schema blob.
        """
        self.user_id = user_id
        self.invited_to_learner_groups_ids = invited_to_learner_groups_ids
        self.learner_groups_user_details = learner_groups_user_details
        self.learner_groups_user_details_schema_version = (
            learner_groups_user_details_schema_version)

    def to_dict(self) -> LearnerGroupsUserDict:
        """Convert the LearnerGroupsUser domain instance into a dictionary
        form with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the LearnerGroupsUser class
            information in a dictionary form.
        """
        learner_groups_user_details_dict = [
            learner_group_details.to_dict()
            for learner_group_details in self.learner_groups_user_details
        ]

        return {
            'user_id': self.user_id,
            'invited_to_learner_groups_ids':
                self.invited_to_learner_groups_ids,
            'learner_groups_user_details': learner_groups_user_details_dict,
            'learner_groups_user_details_schema_version': (
                self.learner_groups_user_details_schema_version)
        }

    def validate(self) -> None:
        """Validates the LearnerGroupsUser domain object.

        Raises:
            ValidationError. One or more attributes of the LearnerGroupsUser
                are invalid.
        """
        for learner_group_details in self.learner_groups_user_details:
            if learner_group_details.group_id in (
                    self.invited_to_learner_groups_ids):
                raise utils.ValidationError(
                    'Learner cannot be invited to join learner group '
                    '%s since they are already its learner.' % (
                        learner_group_details.group_id))
