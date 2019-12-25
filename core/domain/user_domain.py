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

from core.platform import models
import feconf
import python_utils
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


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
        self.can_receive_feedback_message_email = ( #pylint: disable=invalid-name
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

        Return:
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
            self, user_id, exploration_ids, collection_ids):
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids

    def add_exploration_id(self, exploration_id):
        """Adds the exploration id to the list of incomplete exploration ids."""
        self.exploration_ids.append(exploration_id)

    def remove_exploration_id(self, exploration_id):
        """Removes the exploration id from the list of incomplete exploration
        ids.
        """
        self.exploration_ids.remove(exploration_id)

    def add_collection_id(self, collection_id):
        """Adds the collection id to the list of incomplete collection ids."""
        self.collection_ids.append(collection_id)

    def remove_collection_id(self, collection_id):
        """Removes the collection id from the list of incomplete collection
        ids.
        """
        self.collection_ids.remove(collection_id)


class CompletedActivities(python_utils.OBJECT):
    """Domain object for the activities completed by learner model."""

    def __init__(
            self, user_id, exploration_ids, collection_ids):
        self.id = user_id
        self.exploration_ids = exploration_ids
        self.collection_ids = collection_ids

    def add_exploration_id(self, exploration_id):
        """Adds the exploration id to the list of completed exploration ids."""
        self.exploration_ids.append(exploration_id)

    def remove_exploration_id(self, exploration_id):
        """Removes the exploration id from the list of completed exploration
        ids.
        """
        self.exploration_ids.remove(exploration_id)

    def add_collection_id(self, collection_id):
        """Adds the collection id to the list of completed collection ids."""
        self.collection_ids.append(collection_id)

    def remove_collection_id(self, collection_id):
        """Removes the collection id from the list of completed collection
        ids.
        """
        self.collection_ids.remove(collection_id)


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


class UserContributionScoring(python_utils.OBJECT):
    """Domain object for UserContributionScoringModel."""

    def __init__(self, user_id, score_category, score, has_email_been_sent):
        self.user_id = user_id
        self.score_category = score_category
        self.score = score
        self.has_email_been_sent = has_email_been_sent


class VoiceoverClaimedTask(python_utils.OBJECT):
    """Domain object for the VoiceoverClaimedTaskModel."""
    def __init__(
            self, task_id, target_type, target_id, user_id, language_code,
            content_count, voiceover_count, voiceover_needs_update_count,
            completed):
        """Initializes a VoiceoverClaimedTask domain object.

        Args:
            task_id: str. The ID of the voiceover claimed task.
            target_type: str. The type of the targeted entity.
            target_id: str. The ID of the target entity.
            user_id: str. The ID of the user who has claimed the task.
            language_code: str. The language code for the voiceover task
                claimed.
            content_count: int. The number of contents available in the targeted
                entity.
            voiceover_count: int. The count of the content which has voiceover
                in the given language.
            voiceover_needs_update_count: int. The count of voiceover which
                needs update.
            completed: bool. A boolean status to mark the claimed task
                completed.
        """
        self.id = task_id
        self.target_type = target_type
        self.target_id = target_id
        self.user_id = user_id
        self.language_code = language_code
        self.content_count = content_count
        self.voiceover_count = voiceover_count
        self.voiceover_needs_update_count = voiceover_needs_update_count
        self.completed = completed

    def validate(self):
        """Validates the VoiceoverClaimedTask object.

        Raises:
            ValidationError: One or more attributes of the
                VoiceoverClaimedTask object are invalid.
        """

        if self.target_type not in feconf.VOICEOVER_TASK_TARGET_TYPE_CHOICES:
            raise utils.ValidationError(
                'Expected target_type to be among allowed choices, '
                'received %s' % self.target_type)

        if not isinstance(self.target_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected target_id to be a string, received %s' % type(
                    self.target_id))

        if not isinstance(self.user_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected user_id to be a string, received %s' % type(
                    self.user_id))

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)
        if not utils.is_supported_audio_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)

        if not isinstance(self.content_count, int):
            raise utils.ValidationError(
                'Expected content_count to be an integer, received %s' % (
                    type(self.content_count)))

        if not isinstance(self.voiceover_count, int):
            raise utils.ValidationError(
                'Expected voiceover_count to be an integer, found %s' % type(
                    self.voiceover_count))

        if not isinstance(self.voiceover_needs_update_count, int):
            raise utils.ValidationError(
                'Expected voiceover_needs_update_count to be an integer, '
                'found %s' % type(self.voiceover_needs_update_count))

        if not isinstance(self.completed, bool):
            raise utils.ValidationError(
                'Expected completed to be a boolean value, found: %s' % (
                    self.completed))

    def to_dict(self):
        """Returns a dict representation of a voiceover claimed task object.

        Returns:
            dict. A dict representation of a voiceover claimed task object.
        """
        return {
            'id': self.id,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'user_id': self.user_id,
            'language_code': self.language_code,
            'content_count': self.content_count,
            'voiceover_count': self.voiceover_count,
            'voiceover_needs_update_count': self.voiceover_needs_update_count,
            'completed': self.completed
        }

    def can_mark_task_completed(self):
        """Returns a boolean value which indicates whether the claimed task can
        be marked as completed.

        Returns:
            bool. Whether the claimed task can be marked as completed.
        """
        return (
            self.voiceover_count == self.content_count and (
                self.voiceover_needs_update_count == 0))
