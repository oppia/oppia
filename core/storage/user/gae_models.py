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

"""Models for Oppia users."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import random
import string

from constants import constants
from core.platform import models
import feconf
import python_utils
import utils

from google.appengine.datastore import datastore_query
from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])
transaction_services = models.Registry.import_transaction_services()

USER_ID_LENGTH = 32


class UserSettingsModel(base_models.BaseModel):
    """Settings and preferences for a particular user.

    Instances of this class are keyed by the user id.
    """
    # User id used to identify user by GAE. Is not required for now because we
    # need to perform migration to fill this for existing users.
    gae_id = ndb.StringProperty(required=True, indexed=True)
    # Email address of the user.
    email = ndb.StringProperty(required=True, indexed=True)
    # User role. Required for authorization. User gets a default role of
    # exploration editor.
    # TODO(1995YogeshSharma): Remove the default value once the one-off
    # migration (to give role to all users) is run.
    role = ndb.StringProperty(
        required=True, indexed=True, default=feconf.ROLE_ID_EXPLORATION_EDITOR)
    # Identifiable username to display in the UI. May be None.
    username = ndb.StringProperty(indexed=True)
    # Normalized username to use for duplicate-username queries. May be None.
    normalized_username = ndb.StringProperty(indexed=True)
    # When the user last agreed to the terms of the site. May be None.
    last_agreed_to_terms = ndb.DateTimeProperty(default=None)
    # When the user last started the state editor tutorial. May be None.
    last_started_state_editor_tutorial = ndb.DateTimeProperty(default=None)
    # When the user last started the state translation tutorial. May be None.
    last_started_state_translation_tutorial = ndb.DateTimeProperty(default=None)
    # When the user last logged in. This may be out-of-date by up to
    # feconf.PROXIMAL_TIMEDELTA_SECS seconds.
    last_logged_in = ndb.DateTimeProperty(default=None)
    # When the user last edited an exploration.
    last_edited_an_exploration = ndb.DateTimeProperty(default=None)
    # When the user last created an exploration.
    last_created_an_exploration = ndb.DateTimeProperty(default=None)
    # User uploaded profile picture as a dataURI string. May be None.
    profile_picture_data_url = ndb.TextProperty(default=None, indexed=False)
    # The preferred dashboard of the user.
    default_dashboard = ndb.StringProperty(
        default=constants.DASHBOARD_TYPE_LEARNER,
        indexed=True,
        choices=[
            constants.DASHBOARD_TYPE_LEARNER,
            constants.DASHBOARD_TYPE_CREATOR])
    # The preferred dashboard display preference.
    creator_dashboard_display_pref = ndb.StringProperty(
        default=constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS['CARD'],
        indexed=True,
        choices=list(
            constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.values()))
    # User specified biography (to be shown on their profile page).
    user_bio = ndb.TextProperty(indexed=False)
    # Subject interests specified by the user.
    subject_interests = ndb.StringProperty(repeated=True, indexed=True)
    # The time, in milliseconds, when the user first contributed to Oppia.
    # May be None.
    first_contribution_msec = ndb.FloatProperty(default=None)
    # Exploration language preferences specified by the user.
    # TODO(sll): Add another field for the language that the user wants the
    # site to display in. These language preferences are mainly for the purpose
    # of figuring out what to show by default in the library index page.
    preferred_language_codes = ndb.StringProperty(
        repeated=True,
        indexed=True,
        choices=[lc['code'] for lc in constants.SUPPORTED_CONTENT_LANGUAGES])
    # System language preference (for I18N).
    preferred_site_language_code = ndb.StringProperty(
        default=None, choices=[
            language['id'] for language in constants.SUPPORTED_SITE_LANGUAGES])
    # Audio language preference used for audio translations.
    preferred_audio_language_code = ndb.StringProperty(
        default=None, choices=[
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES])

    @staticmethod
    def get_deletion_policy():
        """UserSettingsModel can be deleted since it only contains information
        relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of UserSettingsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserSettingsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserSettingsModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @staticmethod
    def export_data(user_id):
        """Exports the data from UserSettingsModel into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserSettingsModel.
        """
        user = UserSettingsModel.get(user_id)
        return {
            'email': user.email,
            'role': user.role,
            'username': user.username,
            'normalized_username': user.normalized_username,
            'last_agreed_to_terms': (
                utils.get_time_in_millisecs(user.last_agreed_to_terms)
                if user.last_agreed_to_terms
                else None
            ),
            'last_started_state_editor_tutorial': (
                utils.get_time_in_millisecs(
                    user.last_started_state_editor_tutorial)
                if user.last_started_state_editor_tutorial
                else None
            ),
            'last_started_state_translation_tutorial': (
                utils.get_time_in_millisecs(
                    user.last_started_state_translation_tutorial)
                if user.last_started_state_translation_tutorial
                else None
            ),
            'last_logged_in': (
                utils.get_time_in_millisecs(user.last_logged_in)
                if user.last_logged_in
                else None
            ),
            'last_edited_an_exploration': (
                utils.get_time_in_millisecs(user.last_edited_an_exploration)
                if user.last_edited_an_exploration
                else None
            ),
            'profile_picture_data_url': user.profile_picture_data_url,
            'default_dashboard': user.default_dashboard,
            'creator_dashboard_display_pref': (
                user.creator_dashboard_display_pref),
            'user_bio': user.user_bio,
            'subject_interests': user.subject_interests,
            'first_contribution_msec': user.first_contribution_msec,
            'preferred_language_codes': user.preferred_language_codes,
            'preferred_site_language_code': user.preferred_site_language_code,
            'preferred_audio_language_code': user.preferred_audio_language_code
        }

    @classmethod
    def get_new_id(cls, unused_entity_name):
        """Gets a new id for an entity, based on its name.

        The returned id is guaranteed to be unique among all instances of this
        entity.

        Args:
            unused_entity_name: The name of the entity. Coerced to a utf-8
                encoded string. Defaults to ''.

        Returns:
            str. New unique id for this entity class.

        Raises:
            Exception: An ID cannot be generated within a reasonable number
                of attempts.
        """
        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            new_id = ''.join(
                random.choice(string.ascii_lowercase)
                for _ in python_utils.RANGE(USER_ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception('New id generator is producing too many collisions.')

    @classmethod
    def is_normalized_username_taken(cls, normalized_username):
        """Returns whether or not a given normalized_username is taken.

        Args:
            normalized_username: str. The given user's normalized username.

        Returns:
            bool. Whether the normalized_username has already been taken.
         """
        return bool(cls.get_all().filter(
            cls.normalized_username == normalized_username).get())

    @classmethod
    def get_by_gae_id(cls, gae_id):
        """Returns a user model with given GAE user ID.

        Args:
            gae_id: str. The GAE user ID that is being queried for.

        Returns:
            UserSettingsModel. The UserSettingsModel instance which has the same
            GAE user ID.
        """
        return cls.query(cls.gae_id == gae_id).get()

    @classmethod
    def get_by_normalized_username(cls, normalized_username):
        """Returns a user model given a normalized username.

        Args:
            normalized_username: str. The user's normalized username.

        Returns:
            UserSettingsModel. The UserSettingsModel instance which contains
            the same normalized_username.
        """
        return cls.get_all().filter(
            cls.normalized_username == normalized_username).get()

    @classmethod
    def get_by_role(cls, role):
        """Returns user models with given role.

        Args:
            role: str. The role ID that is being queried for.

        Returns:
            list(UserSettingsModel). The UserSettingsModel instances which
            have the given role ID.
        """
        return cls.query(cls.role == role).fetch()


class CompletedActivitiesModel(base_models.BaseModel):
    """Keeps track of all the explorations and collections completed by the
    learner.

    Instances of this class are keyed by the user id.
    """
    # IDs of all the explorations completed by the user.
    exploration_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of all the collections completed by the user.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """CompletedActivitiesModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of CompletedActivitiesModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether CompletedActivitiesModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """CompletedActivitiesModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @staticmethod
    def export_data(user_id):
        """(Takeout) Export CompletedActivitiesModel's user properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict with two keys, 'completed_exploration_ids'
            and 'completed_collection_ids'. The corresponding values are
            lists of the IDs of the explorations and collections,
            respectively, which the given user has completed. If there is no
            model for the given user_id, the function returns an empty dict.
        """
        user_model = CompletedActivitiesModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        return {
            'completed_exploration_ids': user_model.exploration_ids,
            'completed_collection_ids': user_model.collection_ids
        }


class IncompleteActivitiesModel(base_models.BaseModel):
    """Keeps track of all the activities currently being completed by the
    learner.

    Instances of this class are keyed by the user id.
    """
    # The ids of the explorations partially completed by the user.
    exploration_ids = ndb.StringProperty(repeated=True, indexed=True)
    # The ids of the collections partially completed by the user.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """IncompleteActivitiesModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of IncompleteActivitiesModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether IncompleteActivitiesModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """IncompleteActivitiesModel has ID that contains user ID and needs to
        be replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @staticmethod
    def export_data(user_id):
        """(Takeout) Export IncompleteActivitiesModel's user properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict or None. A dict with two keys, 'incomplete_exploration_ids'
            and 'incomplete_collection_ids'. The corresponding values are
            lists of the IDs of the explorations and collections,
            respectively, which the given user has not yet completed. If
            the user_id is invalid, returns None.
        """
        user_model = IncompleteActivitiesModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        return {
            'incomplete_exploration_ids': user_model.exploration_ids,
            'incomplete_collection_ids': user_model.collection_ids
        }


class ExpUserLastPlaythroughModel(base_models.BaseModel):
    """Stores the "last playthrough" information for partially-completed
    explorations.

    Instances of this class have keys of the form
    [user_id].[exploration_id]
    """
    # The user id.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The exploration id.
    exploration_id = ndb.StringProperty(required=True, indexed=True)
    # The version of the exploration last played by the user.
    last_played_exp_version = ndb.IntegerProperty(default=None)
    # The name of the state at which the learner left the exploration when
    # he/she last played it.
    last_played_state_name = ndb.StringProperty(default=None)

    @staticmethod
    def get_deletion_policy():
        """ExpUserLastPlaythroughModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of ExpUserLastPlaythroughModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        ndb.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExpUserLastPlaythroughModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """ExpUserLastPlaythroughModel has ID that contains user ID and
        one other field that contains user ID.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD

    @classmethod
    def _generate_id(cls, user_id, exploration_id):
        """Generates key for the instance of ExpUserLastPlaythroughModel
        class in the required format with the arguments provided.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            str. The generated key using user_id and exploration_id
                of the form [user_id].[exploration_id].
        """
        return '%s.%s' % (user_id, exploration_id)

    @classmethod
    def create(cls, user_id, exploration_id):
        """Creates a new ExpUserLastPlaythroughModel instance and returns it.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            ExpUserLastPlaythroughModel. The newly created
            ExpUserLastPlaythroughModel instance.
        """
        instance_id = cls._generate_id(user_id, exploration_id)
        return cls(
            id=instance_id, user_id=user_id, exploration_id=exploration_id)

    @classmethod
    def get(cls, user_id, exploration_id):
        """Gets the ExpUserLastPlaythroughModel for the given user and
        exploration id.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            ExpUserLastPlaythroughModel. The ExpUserLastPlaythroughModel
                instance which matches with the given user_id and
                exploration_id.
        """
        instance_id = cls._generate_id(user_id, exploration_id)
        return super(ExpUserLastPlaythroughModel, cls).get(
            instance_id, strict=False)

    @classmethod
    def export_data(cls, user_id):
        """Takeout: Export ExpUserLastPlaythroughModel user-relevant properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict where each key is an exploration ID that the user
            has partially completed. For each exploration ID key, the value
            stored is a dict with two keys 'exp_version' and 'state_name',
            which represents the exploration version and the state name
            (aka card title) of the last playthrough for that exploration.
        """
        found_models = cls.get_all().filter(cls.user_id == user_id)
        user_data = {}
        for user_model in found_models:
            user_data[user_model.exploration_id] = {
                'exp_version': user_model.last_played_exp_version,
                'state_name': user_model.last_played_state_name
            }

        return user_data


class LearnerPlaylistModel(base_models.BaseModel):
    """Keeps track of all the explorations and collections in the playlist of
    the user.

    Instances of this class are keyed by the user id.
    """
    # IDs of all the explorations in the playlist of the user.
    exploration_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of all the collections in the playlist of the user.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """LearnerPlaylistModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of LearnerPlaylistModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether LearnerPlaylistModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """LearnerPlaylistModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @staticmethod
    def export_data(user_id):
        """(Takeout) Export user-relevant properties of LearnerPlaylistModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict or None. A dict with two keys, 'playlist_exploration_ids'
            and 'playlist_collection_ids'. The corresponding values are
            lists of the IDs of the explorations and collections,
            respectively, which the given user has in their playlist.
            If the user_id is invalid, returns None instead.
        """
        user_model = LearnerPlaylistModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        return {
            'playlist_exploration_ids': user_model.exploration_ids,
            'playlist_collection_ids': user_model.collection_ids
        }


class UserContributionsModel(base_models.BaseModel):
    """Tracks explorations created/edited for a particular user.

    Instances of this class are keyed by the user id.
    """
    # IDs of explorations that this user has created
    # Includes subsequently deleted and private explorations.
    created_exploration_ids = ndb.StringProperty(
        repeated=True, indexed=True, default=None)
    # IDs of explorations that this user has made a positive
    # (i.e. non-revert) commit to.
    # Includes subsequently deleted and private explorations.
    edited_exploration_ids = ndb.StringProperty(
        repeated=True, indexed=True, default=None)

    @staticmethod
    def get_deletion_policy():
        """UserContributionsModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of UserContributionsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserContributionsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserContributionsModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @staticmethod
    def export_data(user_id):
        """(Takeout) Export user-relevant properties of UserContributionsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict or None. A dict containing the user-relevant properties of
            UserContributionsModel (i.e. the IDs of created and edited
            explorations), or None if the user_id is invalid.
        """
        user_model = UserContributionsModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        return {
            'created_exploration_ids': user_model.created_exploration_ids,
            'edited_exploration_ids': user_model.edited_exploration_ids
        }


class UserEmailPreferencesModel(base_models.BaseModel):
    """Email preferences for a particular user.

    Instances of this class are keyed by the user id.
    """
    # The user's preference for receiving general site updates. This is set to
    # None if the user has never set a preference.
    site_updates = ndb.BooleanProperty(indexed=True)
    # The user's preference for receiving email when user is added as a member
    # in exploration. This is set to True when user has never set a preference.
    editor_role_notifications = ndb.BooleanProperty(
        indexed=True, default=feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
    # The user's preference for receiving email when user receives feedback
    # message for his/her exploration.
    feedback_message_notifications = ndb.BooleanProperty(
        indexed=True, default=feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
    # The user's preference for receiving email when a creator, to which this
    # user has subscribed, publishes an exploration.
    subscription_notifications = ndb.BooleanProperty(
        indexed=True, default=feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

    @staticmethod
    def get_deletion_policy():
        """UserEmailPreferencesModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of UserEmailPreferencesModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserEmailPreferencesModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """UserEmailPreferencesModel has ID that contains user ID and needs to
        be replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY


class UserSubscriptionsModel(base_models.BaseModel):
    """A list of things that a user subscribes to.

    Instances of this class are keyed by the user id.
    """
    # IDs of activities (e.g., explorations) that this user subscribes to.
    # TODO(bhenning): Rename this to exploration_ids and perform a migration.
    activity_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of collections that this user subscribes to.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)
    # DEPRECATED. DO NOT USE. Use general_feedback_thread_ids instead.
    feedback_thread_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of feedback thread ids that this user subscribes to.
    general_feedback_thread_ids = ndb.StringProperty(
        repeated=True, indexed=True)
    # IDs of the creators to whom this learner has subscribed.
    creator_ids = ndb.StringProperty(repeated=True, indexed=True)
    # When the user last checked notifications. May be None.
    last_checked = ndb.DateTimeProperty(default=None)

    @staticmethod
    def get_deletion_policy():
        """UserSubscriptionsModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of UserSubscriptionsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserSubscriptionsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserSubscriptionsModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @staticmethod
    def export_data(user_id):
        """Export UserSubscriptionsModel data as dict for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of data from UserSubscriptionsModel.
        """
        user_model = UserSubscriptionsModel.get(user_id, strict=False)

        if user_model is None:
            raise Exception('UserSubscriptionsModel does not exist.')

        user_data = {
            'activity_ids': user_model.activity_ids,
            'collection_ids': user_model.collection_ids,
            'general_feedback_thread_ids': (
                user_model.general_feedback_thread_ids),
            'creator_ids': user_model.creator_ids,
            'last_checked': user_model.last_checked
        }

        return user_data


class UserSubscribersModel(base_models.BaseModel):
    """The list of subscribers of the user.

    Instances of this class are keyed by the user id.
    """

    # IDs of the learners who have subscribed to this user.
    subscriber_ids = ndb.StringProperty(repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """UserSubscribersModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of UserSubscribersModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserSubscribersModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_export_policy():
        """This model is not included because it contains data about other
        users.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """UserSubscribersModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY


class UserRecentChangesBatchModel(base_models.BaseMapReduceBatchResultsModel):
    """A list of recent changes corresponding to things a user subscribes to.

    This is computed using a MapReduce batch job and may not be up to date.
    Instances of this class are keyed by the user id.
    """
    # The output of the batch job.
    output = ndb.JsonProperty(indexed=False)
    # The time, in milliseconds since the epoch, when the job that computed
    # this batch model was queued.
    job_queued_msec = ndb.FloatProperty(indexed=False)

    @staticmethod
    def get_deletion_policy():
        """UserRecentChangesBatchModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of UserRecentChangesBatchModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserRecentChangesBatchModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """UserRecentChangesBatchModel has ID that contains user ID and needs to
        be replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY


class UserStatsModel(base_models.BaseMapReduceBatchResultsModel):
    """User-specific statistics keyed by user id.
    Values for total plays and average ratings are recorded by aggregating over
    all explorations owned by a user.
    Impact scores are calculated over explorations for which a user
    is listed as a contributor.

    The impact score for a particular user is defined as:
    Sum of (
    ln(playthroughs) * (ratings_scaler) * (average(ratings) - 2.5))
    *(multiplier),
    where multiplier = 10, and ratings_scaler is .1 * (number of ratings)
    if there are < 10 ratings for that exploration.

    The impact score is 0 for an exploration with 0 playthroughs or with an
    average rating of less than 2.5.
    """
    # The impact score.
    impact_score = ndb.FloatProperty(indexed=True)
    # The total plays of all the explorations.
    total_plays = ndb.IntegerProperty(indexed=True, default=0)
    # The average of average ratings of all explorations.
    average_ratings = ndb.FloatProperty(indexed=True)
    # The number of ratings of all explorations.
    num_ratings = ndb.IntegerProperty(indexed=True, default=0)
    # A list which stores history of creator stats.
    # Each item in the list is a Json object keyed by a datetime string and
    # value as another Json object containing key-value pairs to be stored.
    # [
    #  {
    #   (date_1): {
    #    "average_ratings": 4.3,
    #    "total_plays": 40
    #   }
    #  },
    #  {
    #   (date_2): {
    #    "average_ratings": 4.1,
    #    "total_plays": 60
    #   }
    #  },
    # ]
    weekly_creator_stats_list = ndb.JsonProperty(repeated=True)
    # The version of dashboard stats schema.
    schema_version = (
        ndb.IntegerProperty(
            required=True,
            default=feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION,
            indexed=True))

    @staticmethod
    def get_deletion_policy():
        """UserStatsModel can be deleted since it only contains information
        relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instance of UserStatsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserStatsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserStatsModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @classmethod
    def get_or_create(cls, user_id):
        """Creates a new UserStatsModel instance, if it does not already exist.

        Args:
            user_id: str. The user_id to be associated with the UserStatsModel.

        Returns:
            UserStatsModel. Either an existing one which matches the
                given user_id, or the newly created one if it did not already
                exist.
        """
        entity = cls.get(user_id, strict=False)
        if not entity:
            entity = cls(id=user_id)
        return entity

    @staticmethod
    def export_data(user_id):
        """(Takeout) Export the user-relevant properties of UserStatsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.
                If the user_id is not valid, this method returns None.

        Returns:
            dict. The user-relevant properties of UserStatsModel in a python
                dict format.
        """
        user_model = UserStatsModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        weekly_stats = user_model.weekly_creator_stats_list
        weekly_stats_constructed = []
        for weekly_stat in weekly_stats:
            for date_key in weekly_stat:
                stat_dict = weekly_stat[date_key]
                constructed_stat = {
                    date_key: {
                        'average_ratings': stat_dict['average_ratings'],
                        'total_plays': stat_dict['total_plays']
                    }
                }
                weekly_stats_constructed.append(constructed_stat)

        user_data = {
            'impact_score': user_model.impact_score,
            'total_plays': user_model.total_plays,
            'average_ratings': user_model.average_ratings,
            'num_ratings': user_model.num_ratings,
            'weekly_creator_stats_list': weekly_stats_constructed
        }

        return user_data


class ExplorationUserDataModel(base_models.BaseModel):
    """User-specific data pertaining to a specific exploration.

    Instances of this class have keys of the form
    [USER_ID].[EXPLORATION_ID]
    """
    # The user id.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The exploration id.
    exploration_id = ndb.StringProperty(required=True, indexed=True)
    # The rating (1-5) the user assigned to the exploration. Note that this
    # represents a rating given on completion of the exploration.
    rating = ndb.IntegerProperty(default=None, indexed=True)
    # When the most recent rating was awarded, or None if not rated.
    rated_on = ndb.DateTimeProperty(default=None, indexed=False)
    # List of uncommitted changes made by the user to the exploration.
    draft_change_list = ndb.JsonProperty(default=None)
    # Timestamp of when the change list was last updated.
    draft_change_list_last_updated = ndb.DateTimeProperty(default=None)
    # The exploration version that this change list applied to.
    draft_change_list_exp_version = ndb.IntegerProperty(default=None)
    # The version of the draft change list which was last saved by the user.
    # Can be zero if the draft is None or if the user has not committed
    # draft changes to this exploration since the draft_change_list_id property
    # was introduced.
    draft_change_list_id = ndb.IntegerProperty(default=0)
    # The user's preference for receiving suggestion emails for this
    # exploration.
    mute_suggestion_notifications = ndb.BooleanProperty(
        default=feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
    # The user's preference for receiving feedback emails for this exploration.
    mute_feedback_notifications = ndb.BooleanProperty(
        default=feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)

    @staticmethod
    def get_deletion_policy():
        """ExplorationUserDataModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of ExplorationUserDataModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        ndb.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExplorationUserDataModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """ExplorationUserDataModel has ID that contains user id and one other
        field that contains user ID.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD

    @classmethod
    def _generate_id(cls, user_id, exploration_id):
        """Generates key for the instance of ExplorationUserDataModel class in
        the required format with the arguments provided.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            str. The generated key using user_id and exploration_id
                of the form [user_id].[exploration_id].
        """
        return '%s.%s' % (user_id, exploration_id)

    @classmethod
    def create(cls, user_id, exploration_id):
        """Creates a new ExplorationUserDataModel instance and returns it.

        Note that the client is responsible for actually saving this entity to
        the datastore.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            ExplorationUserDataModel. The newly created
                ExplorationUserDataModel instance.
        """
        instance_id = cls._generate_id(user_id, exploration_id)
        return cls(
            id=instance_id, user_id=user_id, exploration_id=exploration_id)

    @classmethod
    def get(cls, user_id, exploration_id):
        """Gets the ExplorationUserDataModel for the given user and exploration
         ids.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            ExplorationUserDataModel. The ExplorationUserDataModel instance
                which matches with the given user_id and exploration_id.
        """
        instance_id = cls._generate_id(user_id, exploration_id)
        return super(ExplorationUserDataModel, cls).get(
            instance_id, strict=False)

    @classmethod
    def get_multi(cls, user_ids, exploration_id):
        """Gets the ExplorationUserDataModel for the given user and exploration
         ids.

        Args:
            user_ids: list(str). A list of user_ids.
            exploration_id: str. The id of the exploration.

        Returns:
            ExplorationUserDataModel. The ExplorationUserDataModel instance
                which matches with the given user_ids and exploration_id.
        """
        instance_ids = (
            cls._generate_id(user_id, exploration_id) for user_id in user_ids)
        return super(ExplorationUserDataModel, cls).get_multi(
            instance_ids)

    @classmethod
    def export_data(cls, user_id):
        """Takeout: Export user-relevant properties of ExplorationUserDataModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. The user-relevant properties of ExplorationUserDataModel
            in a python dict format. In this case, the ids of created
            explorations and edited explorations.
        """
        found_models = cls.get_all().filter(cls.user_id == user_id)
        user_data = {}
        for user_model in found_models:
            user_data[user_model.exploration_id] = {
                'rating': user_model.rating,
                'rated_on': (
                    utils.get_time_in_millisecs(user_model.rated_on)
                    if user_model.rated_on
                    else None
                ),
                'draft_change_list': user_model.draft_change_list,
                'draft_change_list_last_updated': (
                    utils.get_time_in_millisecs(
                        user_model.draft_change_list_last_updated)
                    if user_model.draft_change_list_last_updated
                    else None
                ),
                'draft_change_list_exp_version': (
                    user_model.draft_change_list_exp_version),
                'draft_change_list_id': user_model.draft_change_list_id,
                'mute_suggestion_notifications': (
                    user_model.mute_suggestion_notifications),
                'mute_feedback_notifications': (
                    user_model.mute_feedback_notifications)
            }

        return user_data


class CollectionProgressModel(base_models.BaseModel):
    """Stores progress a user has made within a collection, including all
    explorations which have been completed within the context of the collection.

    Please note instances of this progress model will persist even after a
    collection is deleted.

    TODO(bhenning): Implement a job which removes stale versions of this model
    in the data store. That is, it should go through all completion models and
    ensure both the user and collection it is associated with still exist within
    the data store, otherwise it should remove the instance of the completion
    model.
    """
    # The user id.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The collection id.
    collection_id = ndb.StringProperty(required=True, indexed=True)
    # The list of IDs of explorations which have been completed within the
    # context of the collection represented by collection_id.
    completed_explorations = ndb.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy():
        """CollectionProgressModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of CollectionProgressModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        ndb.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether CollectionProgressModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """CollectionProgressModel has ID that contains user id and one other
        field that contains user ID.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD

    @classmethod
    def _generate_id(cls, user_id, collection_id):
        """Generates key for the instance of CollectionProgressModel class in
        the required format with the arguments provided.

        Args:
            user_id: str. The id of the user.
            collection_id: str. The id of the exploration.

        Returns:
            str. The generated key using user_id and exploration_id
                of the form [user_id].[collection_id].
        """
        return '%s.%s' % (user_id, collection_id)

    @classmethod
    def create(cls, user_id, collection_id):
        """Creates a new CollectionProgressModel instance and returns it.

        Note: the client is responsible for actually saving this entity to the
        datastore.

        Args:
            user_id: str. The id of the user.
            collection_id: str. The id of the collection.

        Returns:
            CollectionProgressModel. The newly created CollectionProgressModel
                instance.
        """
        instance_id = cls._generate_id(user_id, collection_id)
        return cls(
            id=instance_id, user_id=user_id, collection_id=collection_id)

    @classmethod
    def get(cls, user_id, collection_id):
        """Gets the CollectionProgressModel for the given user and collection
        id.

        Args:
            user_id: str. The id of the user.
            collection_id: str. The id of the collection.

        Returns:
            CollectionProgressModel. The CollectionProgressModel instance which
                matches the given user_id and collection_id.
        """
        instance_id = cls._generate_id(user_id, collection_id)
        return super(CollectionProgressModel, cls).get(
            instance_id, strict=False)

    @classmethod
    def get_multi(cls, user_id, collection_ids):
        """Gets the CollectionProgressModels for the given user and collection
        ids.

        Args:
            user_id: str. The id of the user.
            collection_ids: list(str). The ids of the collections.

        Returns:
            list(CollectionProgressModel). The list of CollectionProgressModel
            instances which matches the given user_id and collection_ids.
        """
        instance_ids = [cls._generate_id(user_id, collection_id)
                        for collection_id in collection_ids]

        return super(CollectionProgressModel, cls).get_multi(
            instance_ids)

    @classmethod
    def get_or_create(cls, user_id, collection_id):
        """Gets the CollectionProgressModel for the given user and collection
        ids, or creates a new instance with if no such instance yet exists
        within the datastore.

        Args:
            user_id: str. The id of the user.
            collection_id: str. The id of the collection.

        Returns:
            CollectionProgressModel. Either an existing one which
                matches the given user_id and collection_id, or the newly
                created one if it does not already exist.
        """
        instance_model = cls.get(user_id, collection_id)
        if instance_model:
            return instance_model
        else:
            return cls.create(user_id, collection_id)

    @classmethod
    def export_data(cls, user_id):
        """Takeout: Export CollectionProgressModel user-relevant properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict where each key is the ID of a collection the user
            is associated with. The corresponding value is a list of the
            exploration ID's that user has completed in that respective
            collection.
        """
        found_models = cls.get_all().filter(cls.user_id == user_id)
        user_data = {}
        for user_model in found_models:
            user_data[user_model.collection_id] = (
                user_model.completed_explorations)

        return user_data


class StoryProgressModel(base_models.BaseModel):
    """Stores progress a user has made within a story, including all
    nodes which have been completed within the context of the story.

    Please note instances of this progress model will persist even after a
    story is deleted.

    ID for this model is of format "{{USER_ID}}.{{STORY_ID}}".
    """
    # The user id.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The story id.
    story_id = ndb.StringProperty(required=True, indexed=True)
    # The list of node ids which have been completed within the context of
    # the story represented by story_id.
    completed_node_ids = ndb.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy():
        """StoryProgressModel can be deleted since it only contains information
        relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of StoryProgressModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        ndb.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether StoryProgressModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """StoryProgressModel has ID that contains user id and one other field
        that contains user ID.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD

    @classmethod
    def _generate_id(cls, user_id, story_id):
        """"Generates the id for StoryProgressModel.

        Args:
            user_id: str. The id of the user.
            story_id: str. The id of the story.

        Returns:
            str. The model id corresponding to user_id and story_id.
        """
        return '%s.%s' % (user_id, story_id)

    @classmethod
    def create(cls, user_id, story_id):
        """Creates a new StoryProgressModel instance and returns it.

        Note: the client is responsible for actually saving this entity to the
        datastore.

        Args:
            user_id: str. The id of the user.
            story_id: str. The id of the story.

        Returns:
            StoryProgressModel. The newly created StoryProgressModel
                instance.
        """
        instance_id = cls._generate_id(user_id, story_id)
        return cls(
            id=instance_id, user_id=user_id, story_id=story_id)

    @classmethod
    def get(cls, user_id, story_id, strict=True):
        """Gets the StoryProgressModel for the given user and story
        id.

        Args:
            user_id: str. The id of the user.
            story_id: str. The id of the story.
            strict: bool. Whether to fail noisily if no StoryProgressModel
                with the given id exists in the datastore.

        Returns:
            StoryProgressModel. The StoryProgressModel instance which
                matches the given user_id and story_id.
        """
        instance_id = cls._generate_id(user_id, story_id)
        return super(StoryProgressModel, cls).get(
            instance_id, strict=strict)

    @classmethod
    def get_multi(cls, user_id, story_ids):
        """Gets the StoryProgressModels for the given user and story
        ids.

        Args:
            user_id: str. The id of the user.
            story_ids: list(str). The ids of the stories.

        Returns:
            list(StoryProgressModel). The list of StoryProgressModel
                instances which matches the given user_id and story_ids.
        """
        instance_ids = [cls._generate_id(user_id, story_id)
                        for story_id in story_ids]

        return super(StoryProgressModel, cls).get_multi(
            instance_ids)

    @classmethod
    def get_or_create(cls, user_id, story_id):
        """Gets the StoryProgressModel for the given user and story
        ids, or creates a new instance with if no such instance yet exists
        within the datastore.

        Note: This method is not responsible for creating the instance of
        the class in the datastore. It just returns an instance of the class.

        Args:
            user_id: str. The id of the user.
            story_id: str. The id of the story.

        Returns:
            StoryProgressModel. Either an existing one which
                matches the given user_id and story_id, or the newly created
                one if it does not already exist.
        """
        instance_model = cls.get(user_id, story_id, strict=False)
        if instance_model is not None:
            return instance_model
        else:
            return cls.create(user_id, story_id)

    @classmethod
    def export_data(cls, user_id):
        """Takeout: Export StoryProgressModel user-relevant properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict where each key is the ID of a story the user has
            begun. The corresponding value is a list of the completed story
            node ids for that respective story.
        """
        found_models = cls.get_all().filter(cls.user_id == user_id)
        user_data = {}
        for user_model in found_models:
            user_data[user_model.story_id] = user_model.completed_node_ids
        return user_data


class UserQueryModel(base_models.BaseModel):
    """Model for storing result of queries.

    The id of each instance of this model is alphanumeric id of length 12
    unique to each model instance.
    """
    # Options for a query specified by query submitter.
    # Query option to specify whether user has created or edited one or more
    # explorations in last n days. This only returns users who have ever
    # created or edited at least one exploration.
    inactive_in_last_n_days = ndb.IntegerProperty(default=None)
    # Query option to check whether given user has logged in
    # since last n days.
    has_not_logged_in_for_n_days = ndb.IntegerProperty(default=None)
    # Query option to check whether user has created at least
    # n explorations.
    created_at_least_n_exps = ndb.IntegerProperty(default=None)
    # Query option to check whether user has created fewer than
    # n explorations.
    created_fewer_than_n_exps = ndb.IntegerProperty(default=None)
    # Query option to check if user has edited at least n explorations.
    edited_at_least_n_exps = ndb.IntegerProperty(default=None)
    # Query option to check if user has edited fewer than n explorations.
    edited_fewer_than_n_exps = ndb.IntegerProperty(default=None)
    # List of all user_ids who satisfy all parameters given in above query.
    # This list will be empty initially. Once query has completed its execution
    # this list will be populated with all qualifying user ids.
    user_ids = ndb.JsonProperty(default=[], compressed=True)
    # ID of the user who submitted the query.
    submitter_id = ndb.StringProperty(indexed=True, required=True)
    # ID of the instance of BulkEmailModel which stores information
    # about sent emails.
    sent_email_model_id = ndb.StringProperty(default=None, indexed=True)
    # Current status of the query.
    query_status = ndb.StringProperty(
        indexed=True,
        choices=[
            feconf.USER_QUERY_STATUS_PROCESSING,
            feconf.USER_QUERY_STATUS_COMPLETED,
            feconf.USER_QUERY_STATUS_ARCHIVED,
            feconf.USER_QUERY_STATUS_FAILED
        ])

    @staticmethod
    def get_deletion_policy():
        """UserQueryModel can be deleted since it only contains information
        relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model is not exported since this is a computed model
        and the information already exists in other exported models.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of UserQueryModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        ndb.delete_multi(
            cls.query(cls.submitter_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserQueryModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.query(cls.submitter_id == user_id).get(
            keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserQueryModel has two fields that contain user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD

    @classmethod
    def get_user_id_migration_field(cls):
        """Return field that contains user ID."""
        return cls.submitter_id

    @classmethod
    def fetch_page(cls, page_size, cursor):
        """Fetches a list of all query_models sorted by creation date.

        Args:
            page_size: int. The maximum number of entities to be returned.
            cursor: str or None. The list of returned entities starts from this
                datastore cursor.

        Returns:
            3-tuple of (query_models, cursor, more) as described in fetch_page()
            at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                query_models: List of UserQueryModel instances.
                next_cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are probably more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        cursor = datastore_query.Cursor(urlsafe=cursor)
        query_models, next_cursor, more = (
            cls.query().order(-cls.created_on).
            fetch_page(page_size, start_cursor=cursor))
        next_cursor = next_cursor.urlsafe() if (next_cursor and more) else None
        return query_models, next_cursor, more


class UserBulkEmailsModel(base_models.BaseModel):
    """Model to store IDs BulkEmailModel sent to a user.

    Instances of this class are keyed by the user id.
    """
    # IDs of all BulkEmailModels that correspond to bulk emails sent to this
    # user.
    sent_email_model_ids = ndb.StringProperty(indexed=True, repeated=True)

    @staticmethod
    def get_deletion_policy():
        """UserBulkEmailsModel should be kept for audit purposes."""
        return base_models.DELETION_POLICY.KEEP

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserBulkEmailsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """UserBulkEmailsModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY


class UserSkillMasteryModel(base_models.BaseModel):
    """Model for storing a user's degree of mastery of a skill in Oppia.

    This model stores the degree of mastery of each skill for a given user.

    The id for this model is of form '{{USER_ID}}.{{SKILL_ID}}'.
    """

    # The user id of the user.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The skill id for which the degree of mastery is stored.
    skill_id = ndb.StringProperty(required=True, indexed=True)
    # The degree of mastery of the user in the skill.
    degree_of_mastery = ndb.FloatProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """UserSkillMasteryModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of UserSkillMasteryModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        ndb.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserSkillMasteryModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserSkillMasteryModel has ID that contains user id and one other
        field that contains user ID.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD

    @classmethod
    def construct_model_id(cls, user_id, skill_id):
        """Returns model id corresponding to user and skill.

        Args:
            user_id: str. The user ID of the user.
            skill_id: str. The unique id of the skill.

        Returns:
            str. The model id corresponding to the given user and skill.
        """
        return '%s.%s' % (user_id, skill_id)

    @classmethod
    def export_data(cls, user_id):
        """Exports the data from UserSkillMasteryModel
        into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserSkillMasteryModel.
        """

        user_data = dict()
        mastery_models = cls.get_all().filter(cls.user_id == user_id).fetch()

        for mastery_model in mastery_models:
            mastery_model_skill_id = mastery_model.skill_id
            user_data[mastery_model_skill_id] = mastery_model.degree_of_mastery

        return user_data


class UserContributionScoringModel(base_models.BaseModel):
    """Model for storing the scores of a user for various suggestions created by
    the user. Users having scores above a particular threshold for a category
    can review suggestions for that category.

    The id for this model is of the form '{{score_category}}.{{user_id}}'.
    """

    # The user id of the user.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The category of suggestion to score the user on.
    score_category = ndb.StringProperty(required=True, indexed=True)
    # The score of the user for the above category of suggestions.
    score = ndb.FloatProperty(required=True, indexed=True)
    # Flag to check if email to onboard reviewer has been sent for the category.
    has_email_been_sent = ndb.BooleanProperty(required=True, default=False)

    @staticmethod
    def get_deletion_policy():
        """UserContributionScoringModel can be deleted since it only contains
        information relevant to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Exports the data from UserContributionScoringModel
        into dict format.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserContributionScoringModel.
        """
        user_data = dict()
        scoring_models = cls.query(cls.user_id == user_id).fetch()
        for scoring_model in scoring_models:
            user_data[scoring_model.score_category] = {
                'score': scoring_model.score,
                'has_email_been_sent': scoring_model.has_email_been_sent
            }
        return user_data

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of UserContributionScoringModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        ndb.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserContributionScoringModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserContributionScoringModel has ID that contains user id and one
        other field that contains user ID.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD

    @classmethod
    def get_all_categories_where_user_can_review(cls, user_id):
        """Gets all the score categories where the user has a score above the
        threshold.

        Args:
            user_id: str. The id of the user.

        Returns:
            list(str). A list of score_categories where the user has score above
                the threshold.
        """
        scoring_models = cls.get_all().filter(cls.user_id == user_id).filter(
            cls.score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW).fetch()
        return (
            [scoring_model.score_category for scoring_model in scoring_models])

    @classmethod
    def get_all_scores_of_user(cls, user_id):
        """Gets all scores for a given user.

        Args:
            user_id: str. The id of the user.

        Returns:
            list(UserContributionsScoringModel). All instances for the given
                user.
        """
        return cls.get_all().filter(cls.user_id == user_id).fetch()

    @classmethod
    def get_all_users_with_score_above_minimum_for_category(
            cls, score_category):
        """Gets all instances which have score above the
        MINIMUM_SCORE_REQUIRED_TO_REVIEW threshold for the given category.

        Args:
            score_category: str. The category being queried.

        Returns:
            list(UserContributionsScoringModel). All instances for the given
                category with scores above MINIMUM_SCORE_REQUIRED_TO_REVIEW.
        """
        return cls.get_all().filter(
            cls.score_category == score_category).filter(
                cls.score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW).fetch()

    @classmethod
    def _get_instance_id(cls, user_id, score_category):
        """Generates the instance id in the form {{score_category}}.{{user_id}}.

        Args:
            user_id: str. The ID of the user.
            score_category: str. The category of suggestion to score the user
                on.

        Returns:
            str. The instance ID for UserContributionScoringModel.
        """
        return '.'.join([score_category, user_id])

    @classmethod
    def get_score_of_user_for_category(cls, user_id, score_category):
        """Gets the score of the user for the given score category.

        Args:
            user_id: str. The ID of the user.
            score_category: str. The category of suggestion to score the user
                on.

        Returns:
            float|None. The score of the user in the given category.
        """
        instance_id = cls._get_instance_id(user_id, score_category)
        model = cls.get_by_id(instance_id)

        return model.score if model else None

    @classmethod
    def create(cls, user_id, score_category, score):
        """Creates a new UserContributionScoringModel entry.

        Args:
            user_id: str. The ID of the user.
            score_category: str. The category of the suggestion.
            score: float. The score of the user.

        Raises:
            Exception: There is already an entry with the given id.
        """
        instance_id = cls._get_instance_id(user_id, score_category)

        if cls.get_by_id(instance_id):
            raise Exception('There is already an entry with the given id: %s' %
                            instance_id)

        cls(id=instance_id, user_id=user_id, score_category=score_category,
            score=score).put()

    @classmethod
    def increment_score_for_user(cls, user_id, score_category, increment_by):
        """Increment the score of the user in the category by the given amount.

        Args:
            user_id: str. The id of the user.
            score_category: str. The category of the suggestion.
            increment_by: float. The amount to increase the score of the user
                by. May be negative, in which case the score is reduced.
        """
        instance_id = cls._get_instance_id(user_id, score_category)
        model = cls.get_by_id(instance_id)
        if not model:
            cls.create(user_id, score_category, increment_by)
        else:
            model.score += increment_by
            model.put()


class UserCommunityRightsModel(base_models.BaseModel):
    """Model for storing user's rights on community dashboard.

    Instances of this class are keyed by the user id.
    """
    can_review_translation_for_language_codes = ndb.StringProperty(
        repeated=True, indexed=True)
    can_review_voiceover_for_language_codes = ndb.StringProperty(
        repeated=True, indexed=True)
    can_review_questions = ndb.BooleanProperty(indexed=True)

    @staticmethod
    def get_deletion_policy():
        """The model can be deleted since it only contains information relevant
        to the one user.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserCommunityRightsModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """UserCommunityRightsModel has ID that contains user ID and needs to be
        replaced.
        """
        return base_models.USER_ID_MIGRATION_POLICY.COPY

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of UserCommunityRightsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Exports the data from UserCommunityRightsModel
        into dict format.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserCommunityRightsModel.
        """
        rights_model = cls.get_by_id(user_id)

        if rights_model is None:
            return {}

        return {
            'can_review_translation_for_language_codes': (
                rights_model.can_review_translation_for_language_codes),
            'can_review_voiceover_for_language_codes': (
                rights_model.can_review_voiceover_for_language_codes),
            'can_review_questions': rights_model.can_review_questions
        }

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def get_translation_reviewer_user_ids(cls, language_code):
        """Returns the IDs of the users who have rights to review translations
        in the given language code.

        Args:
            language_code: str. The code of the language.

        Returns:
            list(str). A list of IDs of users who have rights to review
            translations in the given language code.
        """
        reviewer_keys = (
            cls.query(
                cls.can_review_translation_for_language_codes == language_code)
            .fetch(keys_only=True))
        return [reviewer_key.id() for reviewer_key in reviewer_keys]

    @classmethod
    def get_voiceover_reviewer_user_ids(cls, language_code):
        """Returns the IDs of the users who have rights to review voiceovers in
        the given language code.

        Args:
            language_code: str. The code of the language.

        Returns:
            list(str). A list of IDs of users who have rights to review
            voiceovers in the given language code.
        """
        reviewer_keys = (
            cls.query(
                cls.can_review_voiceover_for_language_codes == language_code)
            .fetch(keys_only=True))
        return [reviewer_key.id() for reviewer_key in reviewer_keys]

    @classmethod
    def get_question_reviewer_user_ids(cls):
        """Returns the IDs of the users who have rights to review questions.

        Returns:
            list(str). A list of IDs of users who have rights to review
            questions.
        """
        reviewer_keys = cls.query(cls.can_review_questions == True).fetch( # pylint: disable=singleton-comparison
            keys_only=True)
        return [reviewer_key.id() for reviewer_key in reviewer_keys]


class PendingDeletionRequestModel(base_models.BaseModel):
    """Model for storing pending deletion requests.

    Model contains activity ids that were marked as deleted and should be
    force deleted in the deletion process.

    Instances of this class are keyed by the user id.
    """
    # The email of the user.
    email = ndb.StringProperty(required=True)
    # Whether the deletion is completed.
    deletion_complete = ndb.BooleanProperty(default=False, indexed=True)
    # IDs of all the private explorations created by this user.
    exploration_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of all the private collections created by this user.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """PendingDeletionRequestModel should be deleted after the user is
        deleted.
        """
        return base_models.DELETION_POLICY.KEEP

    @staticmethod
    def get_export_policy():
        """Model does not need to exported as it temporarily holds user
        requests for data deletion, and does not contain any information
        relevant to the user for data export.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether PendingDeletionRequestModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """PendingDeletionRequestModel is going to be used later and only as
        a temporary model, so it doesn't need to be migrated.
        """
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE
