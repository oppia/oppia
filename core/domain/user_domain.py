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

from core.platform import models
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


class UserGlobalPrefs(object):
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
            can_receive_feedback_message_email, can_receive_subscription_email):
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


class UserExplorationPrefs(object):
    """Domain object for user exploration email preferences.

    Attributes:
        mute_feedback_notifications: bool. Whether the given user has muted
            feedback emails.
        mute_suggestion_notifications: bool. Whether the given user has
            muted suggestion emails.
    """

    def __init__(self, mute_feedback_notifications,
                 mute_suggestion_notifications):
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


class ExpUserLastPlaythrough(object):
    """Domain object for an exploration last playthrough model."""

    def __init__(self, user_id, exploration_id, version_last_played,
                 time_last_played_msec, last_state_played):
        self.id = '%s.%s' % (user_id, exploration_id)
        self.user_id = user_id
        self.exploration_id = exploration_id
        self.version_last_played = version_last_played
        self.time_last_played_msec = time_last_played_msec
        self.last_state_played = last_state_played

    def update_last_played_information(self, time_last_played_msec,
                                       version_last_played,
                                       last_state_played):
        """Updates the last playthrough information of the user.

        Args:
            time_last_played_msec: int. The time in milliseconds since the user
                last played the exploration.
            version_last_played: int. The version of the exploration that was
                played by the user.
            last_state_played: str. The name of the state at which the learner
                left the exploration.
        """
        self.time_last_played_msec = time_last_played_msec
        self.version_last_played = version_last_played
        self.last_state_played = last_state_played

class IncompleteExplorations(object):
    """Domain object for the incomplete explorations model."""

    def __init__(self, user_id, incomplete_exploration_ids):
        self.id = user_id
        self.incomplete_exploration_ids = incomplete_exploration_ids

    def add_exploration_id(self, exploration_id):
        """Adds the exploration id to the list of incomplete exploration ids."""

        self.incomplete_exploration_ids.append(exploration_id)

    def remove_exploration_id(self, exploration_id):
        """Removes the exploration id from the list of incomplete exploration
        ids.
        """

        self.incomplete_exploration_ids.remove(exploration_id)

    def get_last_playthrough_information(self, exploration_id):
        """Get the information regarding the last playthrough of the user of
        the given exploration.

        Args:
            exploration_id: str. The id of the exploration.

        Returns:
            ExpUserLastPlaythrough. A ExpUserLastPlaythrough domain object
            corresponding to the given exploration id.
        """
        incomplete_exploration_user_model = (
            user_models.ExpUserLastPlaythroughModel.get(
                self.id, exploration_id))

        if not incomplete_exploration_user_model:
            incomplete_exploration_user_model = (
                user_models.ExpUserLastPlaythroughModel.create(
                    self.id, exploration_id))

        return ExpUserLastPlaythrough(
            self.id, exploration_id,
            incomplete_exploration_user_model.version_last_played,
            incomplete_exploration_user_model.time_last_played_msec,
            incomplete_exploration_user_model.last_state_played)


class ActivitiesCompletedByLearner(object):
    """Domain object for the activities completed by learner model."""

    def __init__(self, user_id, completed_exploration_ids,
                 completed_collection_ids):
        self.id = user_id
        self.completed_exploration_ids = completed_exploration_ids
        self.completed_collection_ids = completed_collection_ids

    def add_exploration_id(self, exploration_id):
        """Adds the exploration id to the list of completed exploration ids."""

        self.completed_exploration_ids.append(exploration_id)

    def add_collection_id(self, collection_id):
        """Adds the collection id to the list of completed collection ids."""

        self.completed_collection_ids.append(collection_id)


class IncompleteCollections(object):
    """Domain object for the collections partially completed by the user."""

    def __init__(self, user_id, incomplete_collection_ids):
        self.id = user_id
        self.incomplete_collection_ids = incomplete_collection_ids

    def add_collection_id(self, collection_id):
        """Adds the collection id to the list of incomplete collection ids."""

        self.incomplete_collection_ids.append(collection_id)

    def remove_collection_id(self, collection_id):
        """Removes the collection id from the list of incomplete collection
        ids.
        """

        self.incomplete_collection_ids.remove(collection_id)
