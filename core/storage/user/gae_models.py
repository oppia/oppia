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

from constants import constants
from core.platform import models
import feconf

from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class UserSettingsModel(base_models.BaseModel):
    """Settings and preferences for a particular user.

    Instances of this class are keyed by the user id.
    """
    # Email address of the user.
    email = ndb.StringProperty(required=True, indexed=True)
    # User role. Required for authorization. User gets a default role of
    # exploration editor.
    # TODO (1995YogeshSharma): Remove the default value once the one-off
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
    last_started_state_editor_tutorial = ndb.DateTimeProperty(default=None)  # pylint: disable=invalid-name
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
        choices=constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.values())
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
        choices=[lc['code'] for lc in constants.ALL_LANGUAGE_CODES])
    # System language preference (for I18N).
    preferred_site_language_code = ndb.StringProperty(
        default=None, choices=[
            language['id'] for language in constants.SUPPORTED_SITE_LANGUAGES])
    # Audio language preference used for audio translations.
    preferred_audio_language_code = ndb.StringProperty(
        default=None, choices=[
            language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES])

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


class IncompleteActivitiesModel(base_models.BaseModel):
    """Keeps track of all the activities currently being completed by the
    learner.

    Instances of this class are keyed by the user id.
    """
    # The ids of the explorations partially completed by the user.
    exploration_ids = ndb.StringProperty(repeated=True, indexed=True)
    # The ids of the collections partially completed by the user.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)


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

    @classmethod
    def _generate_id(cls, user_id, exploration_id):
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
            instance which matches with the given user_id and exploration_id.
        """
        instance_id = cls._generate_id(user_id, exploration_id)
        return super(ExpUserLastPlaythroughModel, cls).get(
            instance_id, strict=False)


class LearnerPlaylistModel(base_models.BaseModel):
    """Keeps track of all the explorations and collections in the playlist of
    the user.

    Instances of this class are keyed by the user id.
    """
    # IDs of all the explorations in the playlist of the user.
    exploration_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of all the collections in the playlist of the user.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)


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


class UserSubscriptionsModel(base_models.BaseModel):
    """A list of things that a user subscribes to.

    Instances of this class are keyed by the user id.
    """
    # IDs of activities (e.g., explorations) that this user subscribes to.
    # TODO(bhenning): Rename this to exploration_ids and perform a migration.
    activity_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of collections that this user subscribes to.
    collection_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of feedback thread ids that this user subscribes to.
    feedback_thread_ids = ndb.StringProperty(repeated=True, indexed=True)
    # IDs of the learners who have subscribed to this user.
    creator_ids = ndb.StringProperty(repeated=True, indexed=True)
    # When the user last checked notifications. May be None.
    last_checked = ndb.DateTimeProperty(default=None)


class UserSubscribersModel(base_models.BaseModel):
    """The list of subscribers of the user."""

    # IDs of the learners who have subscribed to this user.
    subscriber_ids = ndb.StringProperty(repeated=True, indexed=True)


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

    @classmethod
    def get_or_create(cls, user_id):
        """Creates a new UserStatsModel instance, if it does not already exist.

        Args:
            user_id: str. The user_id to be associated with the UserStatsModel.

        Returns:
            UserStatsModel. Either an existing one which matches the
            given user_id, or the newly created one if it did not already exist.
        """
        entity = cls.get(user_id, strict=False)
        if not entity:
            entity = cls(id=user_id)
        return entity


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

    @classmethod
    def _generate_id(cls, user_id, exploration_id):
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
    # The list of explorations which have been completed within the context of
    # the collection represented by collection_id.
    completed_explorations = ndb.StringProperty(repeated=True)

    @classmethod
    def _generate_id(cls, user_id, collection_id):
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
            matches the given user_id and collection_id, or the newly created
            one if it does not already exist.
        """
        instance_model = cls.get(user_id, collection_id)
        if instance_model:
            return instance_model
        else:
            return cls.create(user_id, collection_id)


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
        cursor = Cursor(urlsafe=cursor)
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


class UserSkillMasteryModel(base_models.BaseModel):
    """Model for storing a user's degree of mastery of a skill in Oppia.

    This model stores the degree of mastery of each skill for a given user.

    The id for this model is of form '{{USER_ID}}:{{SKILL_ID}}'
    """

    # The user id of the user.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The skill id for which the degree of mastery is stored.
    skill_id = ndb.StringProperty(required=True, indexed=True)
    # The degree of mastery of the user in the skill.
    degree_of_mastery = ndb.FloatProperty(required=True, indexed=True)

    @classmethod
    def get_model_id(cls, user_id, skill_id):
        """Returns model id corresponding to user and skill.

        Args:
            user_id: str. The user id of the logged in user.
            skill_id: str. The unique id of the skill.

        Returns:
            str. The model id corresponding to user and skill.
        """
        return '%s:%s' % (user_id, skill_id)

    @classmethod
    def get_all_skill_mastery_models_for_user(cls, user_id):
        """Returns all skill mastery models of a particular user.

        Args:
            user_id: str. The user id corresponding to a user.

        Returns:
            list. All skill mastery models where user_id belongs to the
                entered user are returned as a list where each element
                is one skill mastery model.
        """
        return cls.query(cls.user_id == user_id).fetch()
