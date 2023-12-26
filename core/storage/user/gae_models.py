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

from __future__ import annotations

import itertools
import random
import string

from core import feconf
from core import utils
from core.constants import constants
from core.platform import models

from typing import (
    Dict, Final, List, Literal, Optional, Sequence, Tuple, TypedDict, Union,
    overload)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()


class UserSettingsModel(base_models.BaseModel):
    """Settings and preferences for a particular user.
    Instances of this class are keyed by the user id.
    """

    # Attributes used for both full users and profile users.

    # Email address of the user.
    email = datastore_services.StringProperty(required=True, indexed=True)
    # User role. Required for authorization. User gets a default role of
    # exploration editor.
    # TODO(1995YogeshSharma): Remove the default value once the one-off
    # migration (to give role to all users) is run.
    role = datastore_services.StringProperty(
        required=True, indexed=True, default=feconf.ROLE_ID_FULL_USER)
    # When the user last agreed to the terms of the site. May be None.
    last_agreed_to_terms = datastore_services.DateTimeProperty(default=None)
    # When the user last logged in. This may be out-of-date by up to
    # feconf.PROXIMAL_TIMEDELTA_SECS seconds.
    last_logged_in = datastore_services.DateTimeProperty(default=None)
    # A code associated with profile and full user on Android to provide a PIN
    # based authentication within the account.
    pin = datastore_services.StringProperty(default=None)
    # Name of a user displayed in Android UI. Unlike username, it can be
    # edited and is unique only among the profiles of the corresponding
    # regular user account.
    display_alias = datastore_services.StringProperty(default=None)
    # User specified biography (to be shown on their profile page).
    user_bio = datastore_services.TextProperty(indexed=False)
    # Subject interests specified by the user.
    subject_interests = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # When the user last edited an exploration.
    # Exploration language preferences specified by the user.
    # These language preferences are mainly for the purpose
    # of figuring out what to show by default in the library index page.
    preferred_language_codes = datastore_services.StringProperty(
        repeated=True,
        indexed=True,
        choices=[lc['code'] for lc in constants.SUPPORTED_CONTENT_LANGUAGES])
    # System language preference (for I18N).
    preferred_site_language_code = datastore_services.StringProperty(
        default=None, choices=[
            language['id'] for language in constants.SUPPORTED_SITE_LANGUAGES])
    # Audio language preference used for audio translations.
    preferred_audio_language_code = datastore_services.StringProperty(
        default=None, choices=[
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES])
    # Language preference when submitting text translations in the
    # contributor dashboard.
    preferred_translation_language_code = datastore_services.StringProperty(
        default=None)

    # Attributes used for full users only.

    # Identifiable username to display in the UI. May be None.
    username = datastore_services.StringProperty(indexed=True)
    # Normalized username to use for duplicate-username queries. May be None.
    normalized_username = datastore_services.StringProperty(indexed=True)
    # When the user last started the state editor tutorial. May be None.
    last_started_state_editor_tutorial = (
        datastore_services.DateTimeProperty(default=None))
    # When the user last started the state translation tutorial. May be None.
    last_started_state_translation_tutorial = (
        datastore_services.DateTimeProperty(default=None))
    last_edited_an_exploration = (
        datastore_services.DateTimeProperty(default=None))
    # When the user last created an exploration.
    last_created_an_exploration = (
        datastore_services.DateTimeProperty(default=None))
    # The preferred dashboard of the user.
    default_dashboard = datastore_services.StringProperty(
        default=constants.DASHBOARD_TYPE_LEARNER,
        indexed=True,
        choices=[
            constants.DASHBOARD_TYPE_LEARNER,
            constants.DASHBOARD_TYPE_CREATOR,
            constants.DASHBOARD_TYPE_CONTRIBUTOR
        ]
    )
    # The preferred dashboard display preference.
    creator_dashboard_display_pref = datastore_services.StringProperty(
        default=constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS['CARD'],
        indexed=True,
        choices=list(
            constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.values()))
    # The time, in milliseconds, when the user first contributed to Oppia.
    # May be None.
    first_contribution_msec = datastore_services.FloatProperty(default=None)

    # Currently, "roles" and "banned" fields are not in use.
    # A list of roles assigned to the user.
    roles = datastore_services.StringProperty(
        repeated=True, indexed=True, choices=feconf.ALLOWED_USER_ROLES)
    # Flag to indicate whether the user is banned.
    banned = datastore_services.BooleanProperty(indexed=True, default=False)
    # Flag to check whether the user has viewed lesson info modal once which
    # shows the progress of the user through exploration checkpoints.
    has_viewed_lesson_info_modal_once = datastore_services.BooleanProperty(
        indexed=True, default=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id, model,
        username, normalized_username, and display_alias fields.
        """
        return base_models.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @staticmethod
    def get_field_names_for_takeout() -> Dict[str, str]:
        """The export method renames some time-related fields to clearly
        indicate that they represent time in milliseconds since the epoch.
        """
        return {
            'last_agreed_to_terms': 'last_agreed_to_terms_msec',
            'last_started_state_editor_tutorial':
                'last_started_state_editor_tutorial_msec',
            'last_started_state_translation_tutorial':
                'last_started_state_translation_tutorial_msec',
            'last_logged_in': 'last_logged_in_msec',
            'last_edited_an_exploration': 'last_edited_an_exploration_msec',
            'last_created_an_exploration': 'last_created_an_exploration_msec'
        }

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'email': base_models.EXPORT_POLICY.EXPORTED,
            'last_agreed_to_terms': base_models.EXPORT_POLICY.EXPORTED,
            'roles': base_models.EXPORT_POLICY.EXPORTED,
            'banned': base_models.EXPORT_POLICY.EXPORTED,
            'last_logged_in': base_models.EXPORT_POLICY.EXPORTED,
            'display_alias': base_models.EXPORT_POLICY.EXPORTED,
            'user_bio': base_models.EXPORT_POLICY.EXPORTED,
            'subject_interests': base_models.EXPORT_POLICY.EXPORTED,
            'preferred_language_codes':
                base_models.EXPORT_POLICY.EXPORTED,
            'preferred_site_language_code':
                base_models.EXPORT_POLICY.EXPORTED,
            'preferred_audio_language_code':
                base_models.EXPORT_POLICY.EXPORTED,
            'preferred_translation_language_code':
                base_models.EXPORT_POLICY.EXPORTED,
            'username': base_models.EXPORT_POLICY.EXPORTED,
            'normalized_username': base_models.EXPORT_POLICY.EXPORTED,
            'last_started_state_editor_tutorial':
                base_models.EXPORT_POLICY.EXPORTED,
            'last_started_state_translation_tutorial':
                base_models.EXPORT_POLICY.EXPORTED,
            'last_edited_an_exploration':
                base_models.EXPORT_POLICY.EXPORTED,
            'last_created_an_exploration':
                base_models.EXPORT_POLICY.EXPORTED,
            'default_dashboard': base_models.EXPORT_POLICY.EXPORTED,
            'creator_dashboard_display_pref':
                base_models.EXPORT_POLICY.EXPORTED,
            'first_contribution_msec':
                base_models.EXPORT_POLICY.EXPORTED,
            'has_viewed_lesson_info_modal_once':
                base_models.EXPORT_POLICY.EXPORTED,
            # Pin is not exported since this is an auth mechanism.
            'pin': base_models.EXPORT_POLICY.NOT_APPLICABLE,

            # The role is a deprecated field and doesn't contain any correct
            # information related to user settings.
            'role': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserSettingsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserSettingsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def export_data(
        user_id: str
    ) -> Dict[str, Union[str, float, bool, List[str], None]]:
        """Exports the data from UserSettingsModel into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserSettingsModel.
        """
        user = UserSettingsModel.get(user_id)
        return {
            'email': user.email,
            'roles': user.roles,
            'banned': user.banned,
            'username': user.username,
            'normalized_username': user.normalized_username,
            'last_agreed_to_terms_msec': (
                utils.get_time_in_millisecs(user.last_agreed_to_terms)
                if user.last_agreed_to_terms
                else None
            ),
            'last_started_state_editor_tutorial_msec': (
                utils.get_time_in_millisecs(
                    user.last_started_state_editor_tutorial)
                if user.last_started_state_editor_tutorial
                else None
            ),
            'last_started_state_translation_tutorial_msec': (
                utils.get_time_in_millisecs(
                    user.last_started_state_translation_tutorial)
                if user.last_started_state_translation_tutorial
                else None
            ),
            'last_logged_in_msec': (
                utils.get_time_in_millisecs(user.last_logged_in)
                if user.last_logged_in
                else None
            ),
            'last_edited_an_exploration_msec': (
                utils.get_time_in_millisecs(user.last_edited_an_exploration)
                if user.last_edited_an_exploration
                else None
            ),
            'last_created_an_exploration_msec': (
                utils.get_time_in_millisecs(user.last_created_an_exploration)
                if user.last_created_an_exploration
                else None
            ),
            'default_dashboard': user.default_dashboard,
            'creator_dashboard_display_pref': (
                user.creator_dashboard_display_pref),
            'user_bio': user.user_bio,
            'subject_interests': user.subject_interests,
            'first_contribution_msec': user.first_contribution_msec,
            'preferred_language_codes': user.preferred_language_codes,
            'preferred_site_language_code': user.preferred_site_language_code,
            'preferred_audio_language_code': user.preferred_audio_language_code,
            'preferred_translation_language_code': (
                user.preferred_translation_language_code),
            'display_alias': user.display_alias,
            'has_viewed_lesson_info_modal_once': (
                user.has_viewed_lesson_info_modal_once)
        }

    @classmethod
    def get_new_id(cls, unused_entity_name: str = '') -> str:
        """Gets a new id for an entity, based on its name.
        The returned id is guaranteed to be unique among all instances of this
        entity.

        Args:
            unused_entity_name: The name of the entity. Coerced to a utf-8
                encoded string. Defaults to ''.

        Returns:
            str. New unique id for this entity class.

        Raises:
            Exception. An ID cannot be generated within a reasonable number
                of attempts.
        """
        for _ in range(base_models.MAX_RETRIES):
            new_id = 'uid_%s' % ''.join(
                random.choice(string.ascii_lowercase)
                for _ in range(feconf.USER_ID_RANDOM_PART_LENGTH))
            if (
                    not cls.get_by_id(new_id) and
                    not DeletedUserModel.get_by_id(new_id)
            ):
                return new_id

        raise Exception('New id generator is producing too many collisions.')

    @classmethod
    def is_normalized_username_taken(cls, normalized_username: str) -> bool:
        """Returns whether or not a given normalized_username is taken or was
        used by some deleted user.

        Args:
            normalized_username: str. The given user's normalized username.

        Returns:
            bool. Whether the normalized_username has already been taken.
         """
        hashed_normalized_username = utils.convert_to_hash(
            normalized_username, DeletedUsernameModel.ID_LENGTH)
        return (
            cls.query().filter(
                cls.normalized_username == normalized_username
            ).get() is not None
            or DeletedUsernameModel.get(
                hashed_normalized_username, strict=False
            ) is not None
        )

    @classmethod
    def get_by_normalized_username(
        cls, normalized_username: str
    ) -> Optional[UserSettingsModel]:
        """Returns a user model given a normalized username.

        Args:
            normalized_username: str. The user's normalized username.

        Returns:
            UserSettingsModel. The UserSettingsModel instance which contains
            the same normalized_username.
        """
        return cls.get_all().filter(
            cls.normalized_username == normalized_username
        ).get()

    @classmethod
    def get_by_email(cls, email: str) -> Optional[UserSettingsModel]:
        """Returns a user model given an email.

        Args:
            email: str. The user's email.

        Returns:
            UserSettingsModel | None. The UserSettingsModel instance which
            contains the same email.
        """
        return cls.query(cls.email == email).get()

    @classmethod
    def get_by_role(cls, role: str) -> Sequence[UserSettingsModel]:
        """Returns user models with given role.

        Args:
            role: str. The role ID that is being queried for.

        Returns:
            list(UserSettingsModel). The UserSettingsModel instances which
            have the given role ID.
        """
        return cls.query(cls.roles == role).fetch()


class CompletedActivitiesModel(base_models.BaseModel):
    """Keeps track of all the explorations and collections completed by the
    learner.

    Instances of this class are keyed by the user id.
    """

    # IDs of all the explorations completed by the user.
    exploration_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the collections completed by the user.
    collection_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the stories completed by the user.
    story_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the topics learnt by the user (i.e. the topics in which the
    # learner has completed all the stories).
    learnt_topic_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the topics learnt by the user(i.e. the topics in which the
    # learner has completed all the subtopics).
    mastered_topic_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
            'collection_ids': base_models.EXPORT_POLICY.EXPORTED,
            'story_ids': base_models.EXPORT_POLICY.EXPORTED,
            'learnt_topic_ids': base_models.EXPORT_POLICY.EXPORTED,
            'mastered_topic_ids': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of CompletedActivitiesModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether CompletedActivitiesModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def export_data(user_id: str) -> Dict[str, List[str]]:
        """(Takeout) Export CompletedActivitiesModel's user properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. A dict with four keys, 'completed_exploration_ids',
            'completed_collection_ids', 'completed_story_ids' and
            'learnt_topic_ids'. The corresponding values are
            lists of the IDs of the explorations, collections, stories
            and topics respectively, which the given user has completed.
            If there is no model for the given user_id, the function
            returns an empty dict.
        """
        user_model = CompletedActivitiesModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        return {
            'exploration_ids': user_model.exploration_ids,
            'collection_ids': user_model.collection_ids,
            'story_ids': user_model.story_ids,
            'learnt_topic_ids': user_model.learnt_topic_ids,
            'mastered_topic_ids': user_model.mastered_topic_ids
        }


class IncompleteActivitiesModel(base_models.BaseModel):
    """Keeps track of all the activities currently being completed by the
    learner.

    Instances of this class are keyed by the user id.
    """

    # The ids of the explorations partially completed by the user.
    exploration_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # The ids of the collections partially completed by the user.
    collection_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the stories partially completed by the user.
    story_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the topics partially learnt by the user(i.e. the topics in
    # which the learner has not completed all the stories).
    partially_learnt_topic_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the topics partially mastered by the user(i.e. the topics in
    # which the learner has not completed all the subtopics).
    partially_mastered_topic_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
            'collection_ids': base_models.EXPORT_POLICY.EXPORTED,
            'story_ids': base_models.EXPORT_POLICY.EXPORTED,
            'partially_learnt_topic_ids': base_models.EXPORT_POLICY.EXPORTED,
            'partially_mastered_topic_ids': (
                base_models.EXPORT_POLICY.EXPORTED)
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of IncompleteActivitiesModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether IncompleteActivitiesModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def export_data(user_id: str) -> Dict[str, List[str]]:
        """(Takeout) Export IncompleteActivitiesModel's user properties.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict or None. A dict with four keys, 'incomplete_exploration_ids',
            'incomplete_collection_ids', 'incomplete_story_ids' and
            'partially_learnt_topic_ids'. The corresponding values are
            lists of the IDs of the explorations, collections, stories and
            topics respectively, which the given user has not yet completed. If
            the user_id is invalid, returns None.
        """
        user_model = IncompleteActivitiesModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        return {
            'exploration_ids': user_model.exploration_ids,
            'collection_ids': user_model.collection_ids,
            'story_ids': user_model.story_ids,
            'partially_learnt_topic_ids': (
                user_model.partially_learnt_topic_ids),
            'partially_mastered_topic_ids': (
                user_model.partially_mastered_topic_ids)
        }


class ExpUserLastPlaythroughModel(base_models.BaseModel):
    """Stores the "last playthrough" information for partially-completed
    explorations.

    ID for this model is of format '[user_id].[exploration_id]'.
    """

    # The user id.
    user_id = datastore_services.StringProperty(required=True, indexed=True)
    # The exploration id.
    exploration_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The version of the exploration last played by the user.
    last_played_exp_version = datastore_services.IntegerProperty(default=None)
    # The name of the state at which the learner left the exploration when
    # he/she last played it.
    last_played_state_name = datastore_services.StringProperty(default=None)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_id field.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user, since a user
        has multiple playthroughs associated with their account.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'last_played_exp_version':
                base_models.EXPORT_POLICY.EXPORTED,
            'last_played_state_name': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of ExpUserLastPlaythroughModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether ExpUserLastPlaythroughModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def _generate_id(cls, user_id: str, exploration_id: str) -> str:
        """Generates key for the instance of ExpUserLastPlaythroughModel
        class in the required format with the arguments provided.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            str. The generated id using user_id and exploration_id
            of the form '[user_id].[exploration_id]'.
        """
        return '%s.%s' % (user_id, exploration_id)

    @classmethod
    def create(
        cls,
        user_id: str,
        exploration_id: str
    ) -> ExpUserLastPlaythroughModel:
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

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @classmethod
    def get( # type: ignore[override]
        cls, user_id: str, exploration_id: str
    ) -> Optional[ExpUserLastPlaythroughModel]:
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
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[int, str, None]]]:
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
                'last_played_exp_version': user_model.last_played_exp_version,
                'last_played_state_name': user_model.last_played_state_name
            }

        return user_data


class LearnerGoalsModel(base_models.BaseModel):
    """Keeps track of all the topics to learn.

    Instances of this class are keyed by the user id.
    """

    # IDs of all the topics selected by the user to learn.
    topic_ids_to_learn = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the topics selected by the user to master.
    topic_ids_to_master = (
        datastore_services.StringProperty(repeated=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'topic_ids_to_learn': base_models.EXPORT_POLICY.EXPORTED,
            'topic_ids_to_master': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of LearnerGoalsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether LearnerGoalsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def export_data(user_id: str) -> Dict[str, List[str]]:
        """(Takeout) Export user-relevant properties of LearnerGoalsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict or None. A dict with one keys, 'topic_ids_to_learn'.
            The corresponding values is the list of IDs of the topics
            which the given user has as their goal.
            If the user_id is invalid, returns None instead.
        """
        user_model = LearnerGoalsModel.get(user_id, strict=False)
        if user_model is None:
            return {}

        return {
            'topic_ids_to_learn': user_model.topic_ids_to_learn,
            'topic_ids_to_master': user_model.topic_ids_to_master
        }


class LearnerPlaylistModel(base_models.BaseModel):
    """Keeps track of all the explorations and collections in the playlist of
    the user.

    Instances of this class are keyed by the user id.
    """

    # IDs of all the explorations in the playlist of the user.
    exploration_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of all the collections in the playlist of the user.
    collection_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
            'collection_ids': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of LearnerPlaylistModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether LearnerPlaylistModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def export_data(user_id: str) -> Dict[str, List[str]]:
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
            'exploration_ids': user_model.exploration_ids,
            'collection_ids': user_model.collection_ids
        }


class UserContributionsModel(base_models.BaseModel):
    """Tracks explorations created/edited for a particular user.

    Instances of this class are keyed by the user id.
    """

    # IDs of explorations that this user has created.
    created_exploration_ids = datastore_services.StringProperty(
        repeated=True, indexed=True)
    # IDs of explorations that this user has made a positive
    # (i.e. non-revert) commit to.
    edited_exploration_ids = datastore_services.StringProperty(
        repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'created_exploration_ids':
                base_models.EXPORT_POLICY.EXPORTED,
            'edited_exploration_ids':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserContributionsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserContributionsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def export_data(user_id: str) -> Dict[str, List[str]]:
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
    site_updates = datastore_services.BooleanProperty(indexed=True)
    # The user's preference for receiving email when user is added as a member
    # in exploration. This is set to True when user has never set a preference.
    editor_role_notifications = datastore_services.BooleanProperty(
        indexed=True, default=feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
    # The user's preference for receiving email when user receives feedback
    # message for his/her exploration.
    feedback_message_notifications = datastore_services.BooleanProperty(
        indexed=True, default=feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
    # The user's preference for receiving email when a creator, to which this
    # user has subscribed, publishes an exploration.
    subscription_notifications = datastore_services.BooleanProperty(
        indexed=True, default=feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserEmailPreferencesModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserEmailPreferencesModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'site_updates': base_models.EXPORT_POLICY.EXPORTED,
            'editor_role_notifications':
                base_models.EXPORT_POLICY.EXPORTED,
            'feedback_message_notifications':
                base_models.EXPORT_POLICY.EXPORTED,
            'subscription_notifications':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @staticmethod
    def export_data(user_id: str) -> Dict[str, bool]:
        """Exports the UserEmailPreferencesModel for this user."""
        user_email_preferences = UserEmailPreferencesModel.get_by_id(user_id)
        if user_email_preferences:
            return {
                'site_updates': user_email_preferences.site_updates,
                'editor_role_notifications':
                    user_email_preferences.editor_role_notifications,
                'feedback_message_notifications':
                    user_email_preferences.feedback_message_notifications,
                'subscription_notifications':
                    user_email_preferences.subscription_notifications
            }
        else:
            return {}


class UserSubscriptionsModel(base_models.BaseModel):
    """A list of things that a user subscribes to.

    Instances of this class are keyed by the user id.
    """

    # IDs of explorations that this user subscribes to.
    exploration_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of collections that this user subscribes to.
    collection_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # IDs of feedback thread ids that this user subscribes to.
    general_feedback_thread_ids = datastore_services.StringProperty(
        repeated=True, indexed=True)
    # IDs of the creators to whom this learner has subscribed.
    creator_ids = datastore_services.StringProperty(repeated=True, indexed=True)
    # When the user last checked notifications. May be None.
    last_checked = datastore_services.DateTimeProperty(default=None)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
            'collection_ids': base_models.EXPORT_POLICY.EXPORTED,
            'general_feedback_thread_ids':
                base_models.EXPORT_POLICY.EXPORTED,
            'creator_ids': base_models.EXPORT_POLICY.EXPORTED,
            'last_checked': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def get_field_names_for_takeout(cls) -> Dict[str, str]:
        """Indicates that creator_ids are an exception in the export policy
        for Takeout. Also renames timestamp fields to clearly indicate that
        they represent milliseconds since the epoch.
        """
        return dict(super(cls, cls).get_field_names_for_takeout(), ** {
            # We do not want to expose creator_ids, so we instead return
            # creator_usernames.
            'creator_ids': 'creator_usernames',
            'last_checked': 'last_checked_msec'
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserSubscriptionsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        user_subscriptions_models: List[UserSubscriptionsModel] = list(
            cls.query(
                cls.creator_ids == user_id
            ).fetch()
        )

        for user_subscribers_model in user_subscriptions_models:
            user_subscribers_model.creator_ids.remove(user_id)

        # Delete the references to this user from other user subscriptions
        # models.
        cls.update_timestamps_multi(user_subscriptions_models)
        cls.put_multi(user_subscriptions_models)

        # Delete the model for the user.
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserSubscriptionsModel exists for user or references
        user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return (
            cls.query(
                cls.creator_ids == user_id
            ).get(keys_only=True) is not None or
            cls.get_by_id(user_id) is not None
        )

    @staticmethod
    def export_data(user_id: str) -> Dict[str, Union[List[str], float, None]]:
        """Export UserSubscriptionsModel data as dict for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of data from UserSubscriptionsModel.

        Raises:
            Exception. No UserSettingsModel exist for the given creator_id.
        """
        user_model = UserSubscriptionsModel.get(user_id, strict=False)

        if user_model is None:
            return {}

        # Ruling out the possibility of None for mypy type checking.
        assert user_model is not None
        creator_user_models = (
            UserSettingsModel.get_multi(user_model.creator_ids)
        )
        filtered_creator_user_models = []
        for creator_user_model in creator_user_models:
            if creator_user_model is None:
                continue
            filtered_creator_user_models.append(creator_user_model)
        creator_usernames = [
            creator.username for creator in filtered_creator_user_models]

        user_data = {
            'exploration_ids': user_model.exploration_ids,
            'collection_ids': user_model.collection_ids,
            'general_feedback_thread_ids': (
                user_model.general_feedback_thread_ids),
            'creator_usernames': creator_usernames,
            'last_checked_msec':
                None if user_model.last_checked is None else
                utils.get_time_in_millisecs(user_model.last_checked)
        }

        return user_data


class UserSubscribersModel(base_models.BaseModel):
    """The list of subscribers of the user.

    Instances of this class are keyed by the user id.
    """

    # IDs of the learners who have subscribed to this user.
    subscriber_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserSubscribersModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        user_subscribers_models: List[UserSubscribersModel] = list(cls.query(
            cls.subscriber_ids == user_id
        ).fetch())

        for user_subscribers_model in user_subscribers_models:
            user_subscribers_model.subscriber_ids.remove(user_id)

        # Delete the references to this user from other user subscribers models.
        cls.update_timestamps_multi(user_subscribers_models)
        cls.put_multi(user_subscribers_models)

        # Delete the model for the user.
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserSubscribersModel exists for user or references
        user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return (
            cls.query(
                cls.subscriber_ids == user_id
            ).get(keys_only=True) is not None or
            cls.get_by_id(user_id) is not None)

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is not included because it contains data corresponding to other
        users.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this model is not
        exported because it contains data corresponding to other users.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'subscriber_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class UserRecentChangesBatchModel(base_models.BaseMapReduceBatchResultsModel):
    """A list of recent changes corresponding to things a user subscribes to.

    This is computed using a MapReduce batch job and may not be up to date.
    Instances of this class are keyed by the user id.
    """

    # The output of the batch job.
    output = datastore_services.JsonProperty(indexed=False)
    # The time, in milliseconds since the epoch, when the job that computed
    # this batch model was queued.
    job_queued_msec = datastore_services.FloatProperty(indexed=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserRecentChangesBatchModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserRecentChangesBatchModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'output': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'job_queued_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    impact_score = datastore_services.FloatProperty(indexed=True)
    # The total plays of all the explorations.
    total_plays = datastore_services.IntegerProperty(indexed=True, default=0)
    # The average of average ratings of all explorations.
    average_ratings = datastore_services.FloatProperty(indexed=True)
    # The number of ratings of all explorations.
    num_ratings = datastore_services.IntegerProperty(indexed=True, default=0)
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
    weekly_creator_stats_list = datastore_services.JsonProperty(repeated=True)
    # The version of dashboard stats schema.
    schema_version = (
        datastore_services.IntegerProperty(
            required=True,
            default=feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION,
            indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'impact_score': base_models.EXPORT_POLICY.EXPORTED,
            'total_plays': base_models.EXPORT_POLICY.EXPORTED,
            'average_ratings': base_models.EXPORT_POLICY.EXPORTED,
            'num_ratings': base_models.EXPORT_POLICY.EXPORTED,
            'weekly_creator_stats_list': base_models.EXPORT_POLICY.EXPORTED,
            'schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserStatsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserStatsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @classmethod
    def get_or_create(cls, user_id: str) -> UserStatsModel:
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
    def export_data(
        user_id: str
    ) -> Dict[str, Union[float, List[Dict[str, Dict[str, float]]]]]:
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

    ID for this model is of format '[user_id].[exploration_id]'.
    """

    # The user id.
    user_id = datastore_services.StringProperty(required=True, indexed=True)
    # The exploration id.
    exploration_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The rating (1-5) the user assigned to the exploration. Note that this
    # represents a rating given on completion of the exploration.
    rating = datastore_services.IntegerProperty(default=None, indexed=True)
    # When the most recent rating was awarded, or None if not rated.
    rated_on = datastore_services.DateTimeProperty(default=None, indexed=False)
    # List of uncommitted changes made by the user to the exploration.
    draft_change_list = datastore_services.JsonProperty(default=None)
    # Timestamp of when the change list was last updated.
    draft_change_list_last_updated = (
        datastore_services.DateTimeProperty(default=None))
    # The exploration version that this change list applied to.
    draft_change_list_exp_version = (
        datastore_services.IntegerProperty(default=None))
    # The version of the draft change list which was last saved by the user.
    # Can be zero if the draft is None or if the user has not committed
    # draft changes to this exploration since the draft_change_list_id property
    # was introduced.
    draft_change_list_id = datastore_services.IntegerProperty(default=0)
    # The user's preference for receiving suggestion emails for this
    # exploration.
    mute_suggestion_notifications = datastore_services.BooleanProperty(
        default=feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
    # The user's preference for receiving feedback emails for this exploration.
    mute_feedback_notifications = datastore_services.BooleanProperty(
        default=feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
    # The state name of the furthest reached checkpoint.
    furthest_reached_checkpoint_state_name = datastore_services.StringProperty(
        default=None)
    # The exploration version of the furthest reached checkpoint.
    furthest_reached_checkpoint_exp_version = (
        datastore_services.IntegerProperty(default=None))
    # The state name of the most recently reached checkpoint.
    most_recently_reached_checkpoint_state_name = (
        datastore_services.StringProperty(default=None))
    # The exploration version of the most recently reached checkpoint.
    most_recently_reached_checkpoint_exp_version = (
        datastore_services.IntegerProperty(default=None))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_id field.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of ExplorationUserDataModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple explorations (and corresponding data) relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @staticmethod
    def get_field_names_for_takeout() -> Dict[str, str]:
        """Fields are renamed to clarify that they represent the time in
        milliseconds since the epoch.
        """
        return {
            'rated_on': 'rated_on_msec',
            'draft_change_list_last_updated':
                'draft_change_list_last_updated_msec'
        }

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'rating': base_models.EXPORT_POLICY.EXPORTED,
            'rated_on': base_models.EXPORT_POLICY.EXPORTED,
            'draft_change_list': base_models.EXPORT_POLICY.EXPORTED,
            'draft_change_list_last_updated':
                base_models.EXPORT_POLICY.EXPORTED,
            'draft_change_list_exp_version':
                base_models.EXPORT_POLICY.EXPORTED,
            'draft_change_list_id': base_models.EXPORT_POLICY.EXPORTED,
            'mute_suggestion_notifications':
                base_models.EXPORT_POLICY.EXPORTED,
            'mute_feedback_notifications':
                base_models.EXPORT_POLICY.EXPORTED,
            'furthest_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.EXPORTED,
            'furthest_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.EXPORTED,
            'most_recently_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.EXPORTED,
            'most_recently_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether ExplorationUserDataModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def _generate_id(cls, user_id: str, exploration_id: str) -> str:
        """Generates key for the instance of ExplorationUserDataModel class in
        the required format with the arguments provided.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            str. The generated id using user_id and exploration_id
            of the form '[user_id].[exploration_id]'.
        """
        return '%s.%s' % (user_id, exploration_id)

    @classmethod
    def create(
        cls, user_id: str, exploration_id: str
    ) -> ExplorationUserDataModel:
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

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @classmethod
    def get( # type: ignore[override]
        cls, user_id: str, exploration_id: str
    ) -> Optional[ExplorationUserDataModel]:
        """Gets the ExplorationUserDataModel for the given user and exploration
         ids.

        Args:
            user_id: str. The id of the user.
            exploration_id: str. The id of the exploration.

        Returns:
            ExplorationUserDataModel|None. The ExplorationUserDataModel instance
            which matches with the given user_id and exploration_id.
        """
        instance_id = cls._generate_id(user_id, exploration_id)
        return super(ExplorationUserDataModel, cls).get(
            instance_id, strict=False)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get_multi().
    @classmethod
    def get_multi( # type: ignore[override]
        cls, user_id_exp_id_combinations: List[Tuple[str, str]]
    ) -> List[Optional[ExplorationUserDataModel]]:
        """Gets all ExplorationUserDataModels for the given pairs of user ids
        and exploration ids.

        Args:
            user_id_exp_id_combinations: list(tuple(str, str)). A list of
                combinations of user_id and exploration_id pairs for which
                ExplorationUserDataModels are to be fetched.

        Returns:
            list(ExplorationUserDataModel|None). The ExplorationUserDataModel
            instance which matches with the given user_ids and exploration_ids.
        """
        instance_ids = [
            cls._generate_id(user_id, exploration_id)
            for (user_id, exploration_id) in user_id_exp_id_combinations
        ]

        return super(ExplorationUserDataModel, cls).get_multi(instance_ids)

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[str, float, bool, None]]]:
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
                'rated_on_msec': (
                    utils.get_time_in_millisecs(user_model.rated_on)
                    if user_model.rated_on
                    else None
                ),
                'draft_change_list': user_model.draft_change_list,
                'draft_change_list_last_updated_msec': (
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
                    user_model.mute_feedback_notifications),
                'furthest_reached_checkpoint_exp_version': (
                    user_model.furthest_reached_checkpoint_exp_version),
                'furthest_reached_checkpoint_state_name': (
                    user_model.furthest_reached_checkpoint_state_name),
                'most_recently_reached_checkpoint_exp_version': (
                    user_model.most_recently_reached_checkpoint_exp_version),
                'most_recently_reached_checkpoint_state_name': (
                    user_model.most_recently_reached_checkpoint_state_name)
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
    user_id = datastore_services.StringProperty(required=True, indexed=True)
    # The collection id.
    collection_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The list of IDs of explorations which have been completed within the
    # context of the collection represented by collection_id.
    completed_explorations = datastore_services.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_id field.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there can be
        multiple collections associated with a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'collection_id':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'completed_explorations': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of CollectionProgressModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether CollectionProgressModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def _generate_id(cls, user_id: str, collection_id: str) -> str:
        """Generates key for the instance of CollectionProgressModel class in
        the required format with the arguments provided.

        Args:
            user_id: str. The id of the user.
            collection_id: str. The id of the exploration.

        Returns:
            str. The generated id using user_id and exploration_id
            of the form '[user_id].[collection_id]'.
        """
        return '%s.%s' % (user_id, collection_id)

    @classmethod
    def create(
        cls, user_id: str, collection_id: str
    ) -> CollectionProgressModel:
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

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @classmethod
    def get( # type: ignore[override]
        cls, user_id: str, collection_id: str
    ) -> Optional[CollectionProgressModel]:
        """Gets the CollectionProgressModel for the given user and collection
        id.

        Args:
            user_id: str. The id of the user.
            collection_id: str. The id of the collection.

        Returns:
            CollectionProgressModel|None. The CollectionProgressModel instance
            which matches the given user_id and collection_id.
        """
        instance_id = cls._generate_id(user_id, collection_id)
        return super(CollectionProgressModel, cls).get(
            instance_id, strict=False)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get_multi().
    @classmethod
    def get_multi( # type: ignore[override]
        cls, user_id: str, collection_ids: List[str]
    ) -> List[Optional[CollectionProgressModel]]:
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
    def get_or_create(
        cls, user_id: str, collection_id: str
    ) -> CollectionProgressModel:
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
    def export_data(cls, user_id: str) -> Dict[str, Dict[str, List[str]]]:
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
            user_data[user_model.collection_id] = {
                'completed_explorations': user_model.completed_explorations
            }

        return user_data


class StoryProgressModel(base_models.BaseModel):
    """Stores progress a user has made within a story, including all
    nodes which have been completed within the context of the story.

    Please note instances of this progress model will persist even after a
    story is deleted.

    ID for this model is of format '[user_id].[story_id]'.
    """

    # The user id.
    user_id = datastore_services.StringProperty(required=True, indexed=True)
    # The story id.
    story_id = datastore_services.StringProperty(required=True, indexed=True)
    # The list of node ids which have been completed within the context of
    # the story represented by story_id.
    completed_node_ids = datastore_services.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_id field.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since a user
        can have multiple stories associated with their account.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_id':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'completed_node_ids': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of StoryProgressModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether StoryProgressModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def _generate_id(cls, user_id: str, story_id: str) -> str:
        """"Generates the id for StoryProgressModel.

        Args:
            user_id: str. The id of the user.
            story_id: str. The id of the story.

        Returns:
            str. The model id corresponding to user_id and story_id.
        """
        return '%s.%s' % (user_id, story_id)

    @classmethod
    def create(cls, user_id: str, story_id: str) -> StoryProgressModel:
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

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get_multi().
    @overload  # type: ignore[override]
    @classmethod
    def get(
        cls, user_id: str, story_id: str
    ) -> StoryProgressModel: ...

    @overload
    @classmethod
    def get(
        cls, user_id: str, story_id: str, *, strict: Literal[True]
    ) -> StoryProgressModel: ...

    @overload
    @classmethod
    def get(
        cls, user_id: str, story_id: str, *, strict: Literal[False]
    ) -> Optional[StoryProgressModel]: ...

    @overload
    @classmethod
    def get(
        cls, user_id: str, story_id: str, *, strict: bool = ...
    ) -> Optional[StoryProgressModel]: ...

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @classmethod
    def get( # type: ignore[override]
        cls, user_id: str, story_id: str, strict: bool = True
    ) -> Optional[StoryProgressModel]:
        """Gets the StoryProgressModel for the given user and story
        id.

        Args:
            user_id: str. The id of the user.
            story_id: str. The id of the story.
            strict: bool. Whether to fail noisily if no StoryProgressModel
                with the given id exists in the datastore.

        Returns:
            StoryProgressModel|None. The StoryProgressModel instance which
            matches the given user_id and story_id.
        """
        instance_id = cls._generate_id(user_id, story_id)
        return super(StoryProgressModel, cls).get(
            instance_id, strict=strict)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get_multi().
    @classmethod
    def get_multi( # type: ignore[override]
        cls, user_ids: List[str], story_ids: List[str]
    ) -> List[Optional[StoryProgressModel]]:
        """Gets the StoryProgressModels for the given user ids and story
        ids.

        Args:
            user_ids: list(str). The ids of the users.
            story_ids: list(str). The ids of the stories.

        Returns:
            list(StoryProgressModel|None). The list of StoryProgressModel
            instances which matches the given user_ids and story_ids.
        """
        all_posssible_combinations = itertools.product(user_ids, story_ids)
        instance_ids = [
            cls._generate_id(user_id, story_id)
            for (user_id, story_id) in all_posssible_combinations
        ]

        return super(StoryProgressModel, cls).get_multi(
            instance_ids)

    @classmethod
    def get_or_create(cls, user_id: str, story_id: str) -> StoryProgressModel:
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
    def export_data(cls, user_id: str) -> Dict[str, Dict[str, List[str]]]:
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
            user_data[user_model.story_id] = {
                'completed_node_ids': user_model.completed_node_ids
            }
        return user_data


class UserQueryModel(base_models.BaseModel):
    """Model for storing result of queries.

    The id of each instance of this model is alphanumeric id of length 12
    unique to each model instance.

    This model turns off caching, because this results in stale data being
    shown after each UserQueryOneOffJob.
    """

    _use_cache: bool = False
    _use_memcache: bool = False
    # Options for a query specified by query submitter.
    # Query option to specify whether user has created or edited one or more
    # explorations in last n days. This only returns users who have ever
    # created or edited at least one exploration.
    inactive_in_last_n_days = datastore_services.IntegerProperty(default=None)
    # Query option to check whether given user has logged in
    # since last n days.
    has_not_logged_in_for_n_days = (
        datastore_services.IntegerProperty(default=None))
    # Query option to check whether user has created at least
    # n explorations.
    created_at_least_n_exps = datastore_services.IntegerProperty(default=None)
    # Query option to check whether user has created fewer than
    # n explorations.
    created_fewer_than_n_exps = datastore_services.IntegerProperty(default=None)
    # Query option to check if user has edited at least n explorations.
    edited_at_least_n_exps = datastore_services.IntegerProperty(default=None)
    # Query option to check if user has edited fewer than n explorations.
    edited_fewer_than_n_exps = datastore_services.IntegerProperty(default=None)
    # Query option to check if user has created collection.
    created_collection = datastore_services.BooleanProperty(default=False)
    # List of all user_ids who satisfy all parameters given in above query.
    # This list will be empty initially. Once query has completed its execution
    # this list will be populated with all qualifying user ids.
    user_ids = datastore_services.JsonProperty(default=[], compressed=True)
    # ID of the user who submitted the query.
    submitter_id = (
        datastore_services.StringProperty(indexed=True, required=True))
    # ID of the instance of BulkEmailModel which stores information
    # about sent emails.
    sent_email_model_id = (
        datastore_services.StringProperty(default=None, indexed=True))
    # Current status of the query.
    query_status = datastore_services.StringProperty(
        indexed=True, choices=feconf.ALLOWED_USER_QUERY_STATUSES)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_ids and submitter_id fields.

        This model is marked as deleted after a period of time after its
        creation. See MODEL_CLASSES_TO_MARK_AS_DELETED and
        mark_outdated_models_as_deleted() in cron_services.py.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is not exported since this is a computed model
        and the information already exists in other exported models.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but model is not
        exported since this is a computed model and because noteworthy details
        that belong to this model have already been exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'inactive_in_last_n_days': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'has_not_logged_in_for_n_days':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_at_least_n_exps': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_fewer_than_n_exps':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'edited_at_least_n_exps': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'edited_fewer_than_n_exps':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_collection': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'user_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'submitter_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'sent_email_model_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'query_status': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of UserQueryModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.submitter_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserQueryModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.query(cls.submitter_id == user_id).get(
            keys_only=True) is not None

    # TODO(#13523): Change the return value of the function below from
    # tuple(list, str|None, bool) to a domain object.
    @classmethod
    def fetch_page(
        cls,
        page_size: int,
        cursor: Optional[str]
    ) -> Tuple[Sequence[UserQueryModel], Optional[str], bool]:
        """Fetches a list of all query_models sorted by creation date.

        Args:
            page_size: int. The maximum number of entities to be returned.
            cursor: str or None. The list of returned entities starts from this
                datastore cursor.

        Returns:
            3-tuple of (query_models, cursor, more). As described in
            fetch_page() at:
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
        start_cursor = datastore_services.make_cursor(urlsafe_cursor=cursor)

        created_on_query = cls.query().order(-cls.created_on)
        fetch_result: Tuple[
            Sequence[UserQueryModel], datastore_services.Cursor, bool
        ] = created_on_query.fetch_page(page_size, start_cursor=start_cursor)
        query_models, next_cursor, _ = fetch_result
        # TODO(#13462): Refactor this so that we don't do the lookup.
        # Do a forward lookup so that we can know if there are more values.
        fetch_result = created_on_query.fetch_page(
            page_size + 1, start_cursor=start_cursor)
        plus_one_query_models, _, _ = fetch_result
        more_results = len(plus_one_query_models) == page_size + 1
        # The urlsafe returns bytes and we need to decode them to string.
        next_cursor_str = (
            next_cursor.urlsafe().decode('utf-8')
            if (next_cursor and more_results) else None
        )
        return (
            query_models,
            next_cursor_str,
            more_results
        )


class UserBulkEmailsModel(base_models.BaseModel):
    """Model to store IDs BulkEmailModel sent to a user.

    Instances of this class are keyed by the user id.
    """

    # IDs of all BulkEmailModels that correspond to bulk emails sent to this
    # user.
    sent_email_model_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserBulkEmailsModel exists for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of UserBulkEmailsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'sent_email_model_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class UserSkillMasteryModel(base_models.BaseModel):
    """Model for storing a user's degree of mastery of a skill in Oppia.

    This model stores the degree of mastery of each skill for a given user.

    ID for this model is of format '[user_id].[skill_id]'.
    """

    # The user id of the user.
    user_id = datastore_services.StringProperty(required=True, indexed=True)
    # The skill id for which the degree of mastery is stored.
    skill_id = datastore_services.StringProperty(required=True, indexed=True)
    # The degree of mastery of the user in the skill.
    degree_of_mastery = (
        datastore_services.FloatProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_ids field.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since a user has
        many relevant skill masteries.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_id':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'degree_of_mastery': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of UserSkillMasteryModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserSkillMasteryModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def construct_model_id(cls, user_id: str, skill_id: str) -> str:
        """Returns model id corresponding to user and skill.

        Args:
            user_id: str. The user ID of the user.
            skill_id: str. The unique id of the skill.

        Returns:
            str. The model id corresponding to the given user and skill.
        """
        return '%s.%s' % (user_id, skill_id)

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, Dict[str, float]]:
        """Exports the data from UserSkillMasteryModel
        into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserSkillMasteryModel.
        """

        user_data = {}
        mastery_models: Sequence[UserSkillMasteryModel] = (
            cls.get_all().filter(cls.user_id == user_id).fetch())
        for mastery_model in mastery_models:
            mastery_model_skill_id = mastery_model.skill_id
            user_data[mastery_model_skill_id] = {
                'degree_of_mastery': mastery_model.degree_of_mastery
            }

        return user_data


class UserContributionProficiencyModel(base_models.BaseModel):
    """Model for storing the scores of a user for various suggestions created by
    the user. Users having scores above a particular threshold for a category
    can review suggestions for that category.

    ID for this model is of format '[score_category].[user_id]'.
    """

    # The user id of the user.
    user_id = datastore_services.StringProperty(required=True, indexed=True)
    # The category of suggestion to score the user on.
    score_category = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The score of the user for the above category of suggestions.
    score = datastore_services.FloatProperty(required=True, indexed=True)
    # Flag to check if email to onboard reviewer has been sent for the category.
    onboarding_email_sent = (
        datastore_services.BooleanProperty(required=True, default=False))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user:
        user_ids field.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since a user has
        multiple relevant contribution proficiencies.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'score_category':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'score': base_models.EXPORT_POLICY.EXPORTED,
            'onboarding_email_sent': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def export_data(
        cls,
        user_id: str
    ) -> Dict[str, Dict[str, Union[float, bool]]]:
        """(Takeout) Exports the data from UserContributionProficiencyModel
        into dict format.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserContributionProficiencyModel.
        """
        user_data = {}
        scoring_models: Sequence[UserContributionProficiencyModel] = (
            cls.query(cls.user_id == user_id).fetch())
        for scoring_model in scoring_models:
            user_data[scoring_model.score_category] = {
                'score': scoring_model.score,
                'onboarding_email_sent': scoring_model.onboarding_email_sent
            }
        return user_data

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of UserContributionProficiencyModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserContributionProficiencyModels exist for user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the models for user_id exists.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def get_all_categories_where_user_can_review(
        cls,
        user_id: str
    ) -> List[str]:
        """Gets all the score categories where the user has a score above the
        threshold.

        Args:
            user_id: str. The id of the user.

        Returns:
            list(str). A list of score_categories where the user has score above
            the threshold.
        """
        scoring_models: Sequence[UserContributionProficiencyModel] = (
            cls.get_all().filter(datastore_services.all_of(
                cls.user_id == user_id,
                cls.score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW
            )).fetch())
        return (
            [scoring_model.score_category for scoring_model in scoring_models])

    @classmethod
    def get_all_scores_of_user(
        cls, user_id: str
    ) -> Sequence[UserContributionProficiencyModel]:
        """Gets all scores for a given user.

        Args:
            user_id: str. The id of the user.

        Returns:
            list(UserContributionProficiencyModel). All instances for the given
            user.
        """
        return cls.get_all().filter(cls.user_id == user_id).fetch()

    @classmethod
    def get_all_users_with_score_above_minimum_for_category(
        cls, score_category: str
    ) -> Sequence[UserContributionProficiencyModel]:
        """Gets all instances which have score above the
        MINIMUM_SCORE_REQUIRED_TO_REVIEW threshold for the given category.

        Args:
            score_category: str. The category being queried.

        Returns:
            list(UserContributionProficiencyModel). All instances for the given
            category with scores above MINIMUM_SCORE_REQUIRED_TO_REVIEW.
        """
        return cls.get_all().filter(datastore_services.all_of(
            cls.score_category == score_category,
            cls.score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW
        )).fetch()

    @classmethod
    def _get_instance_id(cls, user_id: str, score_category: str) -> str:
        """Generates the instance id in the form '[score_category].[user_id]'.

        Args:
            user_id: str. The ID of the user.
            score_category: str. The category of suggestion to score the user
                on.

        Returns:
            str. The instance ID for UserContributionProficiencyModel.
        """
        return '.'.join([score_category, user_id])

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get().
    @classmethod
    def get( # type: ignore[override]
        cls, user_id: str, score_category: str
    ) -> Optional[UserContributionProficiencyModel]:
        """Gets the user's scoring model corresponding to the score category.

        Args:
            user_id: str. The id of the user.
            score_category: str. The score category of the suggestion.

        Returns:
            UserContributionProficiencyModel|None. A
            UserContributionProficiencyModel corresponding to the user score
            identifier or None if none exist.
        """
        instance_id = cls._get_instance_id(user_id, score_category)
        return cls.get_by_id(instance_id)

    @classmethod
    def create(
        cls,
        user_id: str,
        score_category: str,
        score: float,
        onboarding_email_sent: bool = False
    ) -> UserContributionProficiencyModel:
        """Creates a new UserContributionProficiencyModel entry.

        Args:
            user_id: str. The ID of the user.
            score_category: str. The score category of the suggestion.
            score: float. The score of the user.
            onboarding_email_sent: bool. Whether the email to onboard the
                user as a reviewer has been sent.

        Returns:
            UserContributionProficiencyModel. The user proficiency model that
            was created.

        Raises:
            Exception. There is already an entry with the given id.
        """
        instance_id = cls._get_instance_id(user_id, score_category)

        if cls.get_by_id(instance_id):
            raise Exception(
                'There is already a UserContributionProficiencyModel entry with'
                ' the given id: %s' % instance_id
            )

        user_proficiency_model = cls(
            id=instance_id, user_id=user_id, score_category=score_category,
            score=score,
            onboarding_email_sent=onboarding_email_sent)
        user_proficiency_model.update_timestamps()
        user_proficiency_model.put()
        return user_proficiency_model


class UserContributionRightsModel(base_models.BaseModel):
    """Model for storing user's rights in the contributor dashboard.

    Instances of this class are keyed by the user id.
    """

    can_review_translation_for_language_codes = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    can_review_voiceover_for_language_codes = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    can_review_questions = datastore_services.BooleanProperty(indexed=True)
    can_submit_questions = datastore_services.BooleanProperty(
        default=False, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserContributionRightsModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of UserContributionRightsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def export_data(
        cls,
        user_id: str
    ) -> Dict[str, Union[bool, List[str], None]]:
        """(Takeout) Exports the data from UserContributionRightsModel
        into dict format.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from UserContributionRightsModel.
        """
        rights_model = cls.get_by_id(user_id)

        if rights_model is None:
            return {}

        return {
            'can_review_translation_for_language_codes': (
                rights_model.can_review_translation_for_language_codes),
            'can_review_voiceover_for_language_codes': (
                rights_model.can_review_voiceover_for_language_codes),
            'can_review_questions': rights_model.can_review_questions,
            'can_submit_questions': rights_model.can_submit_questions
        }

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'can_review_translation_for_language_codes':
                base_models.EXPORT_POLICY.EXPORTED,
            'can_review_voiceover_for_language_codes':
                base_models.EXPORT_POLICY.EXPORTED,
            'can_review_questions': base_models.EXPORT_POLICY.EXPORTED,
            'can_submit_questions': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def get_translation_reviewer_user_ids(
        cls,
        language_code: str
    ) -> List[str]:
        """Returns the IDs of the users who have rights to review translations
        in the given language code.

        Args:
            language_code: str. The code of the language.

        Returns:
            list(str). A list of IDs of users who have rights to review
            translations in the given language code.
        """
        reviewer_keys = cls.query(
            cls.can_review_translation_for_language_codes == language_code
        ).fetch(keys_only=True)
        return [reviewer_key.id() for reviewer_key in reviewer_keys]

    @classmethod
    def get_voiceover_reviewer_user_ids(cls, language_code: str) -> List[str]:
        """Returns the IDs of the users who have rights to review voiceovers in
        the given language code.

        Args:
            language_code: str. The code of the language.

        Returns:
            list(str). A list of IDs of users who have rights to review
            voiceovers in the given language code.
        """
        reviewer_keys = cls.query(
            cls.can_review_voiceover_for_language_codes == language_code
        ).fetch(keys_only=True)
        return [reviewer_key.id() for reviewer_key in reviewer_keys]

    @classmethod
    def get_question_reviewer_user_ids(cls) -> List[str]:
        """Returns the IDs of the users who have rights to review questions.

        Returns:
            list(str). A list of IDs of users who have rights to review
            questions.
        """
        reviewer_keys = cls.query(
            cls.can_review_questions == True # pylint: disable=singleton-comparison
        ).fetch(keys_only=True)
        return [reviewer_key.id() for reviewer_key in reviewer_keys]

    @classmethod
    def get_question_submitter_user_ids(cls) -> List[str]:
        """Returns the IDs of the users who have rights to submit questions.

        Returns:
            list(str). A list of IDs of users who have rights to submit
            questions.
        """
        contributor_keys = cls.query(
            cls.can_submit_questions == True # pylint: disable=singleton-comparison
        ).fetch(keys_only=True)
        return [contributor_key.id() for contributor_key in contributor_keys]


class PendingDeletionRequestModel(base_models.BaseModel):
    """Model for storing pending deletion requests.

    Model contains activity ids that were marked as deleted and should be
    force deleted in the deletion process.

    Instances of this class are keyed by the user id.
    """

    # The username of the user.
    username = datastore_services.StringProperty(indexed=True)
    # The email of the user.
    email = datastore_services.StringProperty(required=True, indexed=True)
    # Normalized username of the deleted user. May be None in the cases when
    # the user was deleted after a short time and thus the username wasn't that
    # known on the Oppia site.
    normalized_long_term_username = (
        datastore_services.StringProperty(indexed=True))

    # Whether the deletion is completed.
    deletion_complete = (
        datastore_services.BooleanProperty(default=False, indexed=True))

    # A dict mapping model IDs to pseudonymous user IDs. Each type of entity
    # is grouped under different key (e.g. config, feedback, story, skill,
    # question), the keys need to be from the core.platform.models.Names enum.
    # For each entity, we use a different pseudonymous user ID. Note that all
    # these pseudonymous user IDs originate from the same about-to-be-deleted
    # user. If a key is absent from the pseudonymizable_entity_mappings dict,
    # this means that for this activity type the mappings are not yet generated.
    # Example structure: {
    #     'config': {'some_config': 'pseudo_user_id_1'},
    #     'skill': {'skill_id': 'pseudo_user_id_2'},
    #     'story': {
    #         'story_1_id': 'pseudo_user_id_3',
    #         'story_2_id': 'pseudo_user_id_4',
    #         'story_3_id': 'pseudo_user_id_5'
    #     },
    #     'question': {}
    # }
    pseudonymizable_entity_mappings = (
        datastore_services.JsonProperty(default={}))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id, email,
        and normalized_long_term_username fields.
        """
        return base_models.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not need to be exported as it temporarily holds user
        requests for data deletion, and does not contain any information
        relevant to the user for data export.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but the model does not
        need to be exported as it temporarily holds user requests for data
        deletion, and does not contain any information relevant to the user for
        data export.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'email': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'normalized_long_term_username': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'deletion_complete': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'pseudonymizable_entity_mappings': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE)
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instance of PendingDeletionRequestModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether PendingDeletionRequestModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None


class DeletedUserModel(base_models.BaseModel):
    """Model for storing deleted user IDs."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: id field, but it is
        corresponding to a deleted user.
        """
        return base_models.DELETION_POLICY.KEEP

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a
        particular, existing user. DeletedUserModel contains only IDs that were
        deleted.
        """
        empty_dict: Dict[str, base_models.EXPORT_POLICY] = {}
        return dict(super(cls, cls).get_export_policy(), **empty_dict)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether DeletedUserModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether the model for user_id exists.
        """
        return cls.get_by_id(user_id) is not None


class PseudonymizedUserModel(base_models.BaseModel):
    """Model for storing pseudonymized user IDs."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """PseudonymizedUserModel contains only pseudonymous ids."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user.
        PseudonymizedUserModel contains only pseudonymous ids.
        """
        empty_dict: Dict[str, base_models.EXPORT_POLICY] = {}
        return dict(super(cls, cls).get_export_policy(), **empty_dict)

    @classmethod
    def get_new_id(cls, unused_entity_name: str) -> str:
        """Gets a new id for an entity, based on its name.

        The returned id is guaranteed to be unique among all instances of this
        entity.

        Args:
            unused_entity_name: The name of the entity. Coerced to a utf-8
                encoded string. Defaults to ''.

        Returns:
            str. New unique id for this entity class.

        Raises:
            Exception. An ID cannot be generated within a reasonable number
                of attempts.
        """
        for _ in range(base_models.MAX_RETRIES):
            new_id = 'pid_%s' % ''.join(
                random.choice(string.ascii_lowercase)
                for _ in range(feconf.USER_ID_RANDOM_PART_LENGTH))

            if not cls.get_by_id(new_id):
                return new_id

        raise Exception('New id generator is producing too many collisions.')


class DeletedUsernameModel(base_models.BaseModel):
    """Model for storing deleted username hashes. The username hash is stored
    in the ID of this model.
    """

    ID_LENGTH: Final = 32

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: id field, but it is
        corresponding to a deleted user.

        Model contains only hashes of usernames that were deleted. The hashes
        are kept in order to prevent the reuse of usernames of deleted users.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
        ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user.
        DeletedUsernameModel contains only hashes of usernames that were
        deleted.
        """
        empty_dict: Dict[str, base_models.EXPORT_POLICY] = {}
        return dict(super(cls, cls).get_export_policy(), **empty_dict)


class LearnerGroupUserDetailsDict(TypedDict):
    """Dictionary for user details of a particular learner group to export."""

    group_id: str
    progress_sharing_is_turned_on: bool


class LearnerGroupsUserDataDict(TypedDict):
    """Dictionary for user data to export."""

    invited_to_learner_groups_ids: List[str]
    learner_groups_user_details: List[LearnerGroupUserDetailsDict]


class LearnerGroupsUserModel(base_models.BaseModel):
    """Model for storing user's learner groups related data.

    Instances of this class are keyed by the user id.
    """

    # List of learner group ids which the learner has been invited to join.
    invited_to_learner_groups_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # List of LearnerGroupUserDetailsDict, each dict corresponds to a learner
    # group and has details of the user correspoding to that group.
    learner_groups_user_details = (
        datastore_services.JsonProperty(repeated=True, indexed=False))
    # Version of learner group details blob schema.
    learner_groups_user_details_schema_version = (
        datastore_services.IntegerProperty(
            required=True, default=0, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether LearnerGroupsUserModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of LearnerGroupsUserModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.export_data().
    @classmethod
    def export_data(cls, user_id: str) -> LearnerGroupsUserDataDict: # type: ignore[override]
        """(Takeout) Exports the data from LearnerGroupsUserModel
        into dict format.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from LearnerGroupsUserModel.
        """
        learner_grp_user_model = cls.get_by_id(user_id)

        if learner_grp_user_model is None:
            return {}

        return {
            'invited_to_learner_groups_ids': (
                learner_grp_user_model.invited_to_learner_groups_ids),
            'learner_groups_user_details': (
                learner_grp_user_model.learner_groups_user_details)
        }

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'invited_to_learner_groups_ids':
                base_models.EXPORT_POLICY.EXPORTED,
            'learner_groups_user_details':
                base_models.EXPORT_POLICY.EXPORTED,
            'learner_groups_user_details_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def delete_learner_group_references(
        cls, group_id: str, user_ids: List[str]
    ) -> None:
        """Delete all references of given learner group stored in learner
        groups user model.

        Args:
            group_id: str. The group_id denotes which group's reference to
                delete.
            user_ids: list(str). The user_ids denotes ids of users that were
                referenced in the given group.
        """
        found_models = cls.get_multi(user_ids)

        learner_groups_user_models_to_put = []

        for learner_grp_usr_model in found_models:
            if learner_grp_usr_model is None:
                continue

            # If the user has been invited to join the group as learner, delete
            # the group id from the invited_to_learner_groups_ids list.
            if (
                group_id in learner_grp_usr_model.invited_to_learner_groups_ids
            ):
                learner_grp_usr_model.invited_to_learner_groups_ids.remove(
                    group_id)

            # If the user is a learner of the group, delete the corresponding
            # learner group details of the learner stored in
            # learner_groups_user_details field.
            updated_details = []

            for learner_group_details in (
                learner_grp_usr_model.learner_groups_user_details
            ):
                if learner_group_details['group_id'] != group_id:
                    updated_details.append(learner_group_details)

            learner_grp_usr_model.learner_groups_user_details = (
                updated_details)

            learner_groups_user_models_to_put.append(learner_grp_usr_model)

        cls.update_timestamps_multi(learner_groups_user_models_to_put)
        cls.put_multi(learner_groups_user_models_to_put)


class PinnedOpportunityModel(base_models.BaseModel):
    """Model for storing pinned opportunities in the
    contributor dashboard for a user.

    The ID of each instance is the combination of user_id,
    language_code, and topic_id.
    """

    user_id = datastore_services.StringProperty(required=True, indexed=True)
    language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    opportunity_id = datastore_services.StringProperty(indexed=True)

    @classmethod
    def _generate_id(
        cls,
        user_id: str,
        language_code: str,
        topic_id: str
    ) -> str:
        """Generates the ID for the instance of PinnedOpportunityModel class.

        Args:
            user_id: str. The ID of the user.
            language_code: str. The code of the language.
            topic_id: str. The ID of the topic.

        Returns:
            str. The ID for this entity, in the form
            user_id.language_code.topic_id.
        """
        return '%s.%s.%s' % (user_id, language_code, topic_id)

    @classmethod
    def create(
        cls,
        user_id: str,
        language_code: str,
        topic_id: str,
        opportunity_id: str
    ) -> PinnedOpportunityModel:
        """Creates a new PinnedOpportunityModel instance. Fails if the
        model already exists.

        Args:
            user_id: str. The ID of the user.
            language_code: str. The code of the language.
            topic_id: str. The ID of the topic.
            opportunity_id: str. The ID of the pinned opportunity.

        Returns:
            PinnedOpportunityModel. The created instance.

        Raises:
            Exception. There is already a pinned opportunity with
                the given id.
        """
        instance_id = cls._generate_id(user_id, language_code, topic_id)
        if cls.get_by_id(instance_id):
            raise Exception(
                'There is already a pinned opportunity with the given'
                ' id: %s' % instance_id)

        instance = cls(
            id=instance_id, user_id=user_id, language_code=language_code,
            topic_id=topic_id, opportunity_id=opportunity_id)
        instance.update_timestamps()
        instance.put()
        return instance

    @classmethod
    def get_model(
        cls,
        user_id: str,
        language_code: str,
        topic_id: str
    ) -> Optional[
        PinnedOpportunityModel]:
        """Fetches the PinnedOpportunityModel instance from the datastore.

        Args:
            user_id: str. The ID of the user.
            language_code: str. The code of the language.
            topic_id: str. The ID of the topic.

        Returns:
            PinnedOpportunityModel. The model instance with the given parameters
            or None if not found.
        """
        return cls.get_by_id(cls._generate_id(user_id, language_code, topic_id))

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of PinnedOpportunityModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def get_deletion_policy(cls) -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: user_id."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether PinnedOpportunityModel references the
        supplied user.

        Args:
            user_id: str. The ID of the user whose data should be
                checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.user_id == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'language_code':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            # User ID is not exported in order to keep internal ids private.
            'user_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'opportunity_id':
                base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, Dict[str, str]]:
        """Fetches all the data associated with the given user ID.

        Args:
            user_id: str. The ID of the user whose data should be fetched.

        Returns:
            dict. A dictionary containing all the data associated
            with the user.
        """
        user_data = {}

        user_models: Sequence[PinnedOpportunityModel] = (
            cls.query(cls.user_id == user_id).fetch())

        for model in user_models:
            key = '%s_%s' % (
                model.language_code,
                model.topic_id,
            )
            user_data[key] = {
                'opportunity_id': model.opportunity_id,
            }
        return user_data

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there are
        multiple languages and topics relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER
