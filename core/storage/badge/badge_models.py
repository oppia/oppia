# coding: utf-8
#
# Storage models for the Gamification Badge System (Oppia-compatible).

from __future__ import annotations

from core.platform import models

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])
BaseModel = base_models.BaseModel
datastore_services = base_models.datastore_services


class BadgeModel(BaseModel):
    """Badge definition model."""

    name = datastore_services.StringProperty(required=True, indexed=True)
    description = datastore_services.TextProperty(required=True)
    icon_svg = datastore_services.TextProperty(required=True)

    rarity = datastore_services.StringProperty(
        choices=['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'],
        required=True,
        indexed=True
    )

    tier = datastore_services.StringProperty(
        choices=['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        required=True,
        indexed=True
    )

    badge_type = datastore_services.StringProperty(
        choices=[
            'STREAK', 'COURSE_COMPLETION', 'LESSON_COMPLETION',
            'QUIZ_PERFORMANCE', 'MASTERY', 'SOCIAL', 'CREATOR',
            'CHALLENGE', 'MILESTONE'
        ],
        required=True,
        indexed=True
    )

    criteria = datastore_services.JsonProperty(default={})
    category = datastore_services.StringProperty(
        choices=[
            'LEARNING', 'PROGRAMMING', 'MATHEMATICS', 'SCIENCE',
            'LANGUAGES', 'ARTS', 'MOTIVATION', 'COMMUNITY', 'CREATIVITY'
        ],
        required=True,
        indexed=True
    )

    xp_reward = datastore_services.IntegerProperty(default=10)
    points = datastore_services.IntegerProperty(default=0)

    evolution_chain = datastore_services.JsonProperty(default=[])
    collection_id = datastore_services.StringProperty(indexed=True)

    total_awards = datastore_services.IntegerProperty(default=0, indexed=True)
    keywords = datastore_services.StringProperty(repeated=True, indexed=True)

    last_awarded = datastore_services.DateTimeProperty()

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER


class UserBadgeModel(BaseModel):
    """A badge earned by a user."""

    user_id = datastore_services.StringProperty(required=True, indexed=True)
    badge_id = datastore_services.StringProperty(required=True, indexed=True)

    awarded_date = datastore_services.DateTimeProperty(indexed=True)
    times_earned = datastore_services.IntegerProperty(default=1)

    progress_data = datastore_services.JsonProperty(default={})
    share_count = datastore_services.IntegerProperty(default=0)
    is_favorite = datastore_services.BooleanProperty(default=False, indexed=True)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER


class BadgeCollectionModel(BaseModel):
    """A collection/group of badges."""

    name = datastore_services.StringProperty(required=True, indexed=True)
    description = datastore_services.TextProperty(required=True)
    badge_ids = datastore_services.StringProperty(repeated=True)
    completion_reward_xp = datastore_services.IntegerProperty(default=0)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER


class BadgeAnalyticsModel(BaseModel):
    """Analytics for each badge."""

    badge_id = datastore_services.StringProperty(required=True, indexed=True)
    total_awards = datastore_services.IntegerProperty(default=0)
    total_shares = datastore_services.IntegerProperty(default=0)
    total_favorites = datastore_services.IntegerProperty(default=0)

    average_time_to_earn = datastore_services.IntegerProperty(default=0)
    leaderboard_rank = datastore_services.IntegerProperty(default=0, indexed=True)
    engagement_score = datastore_services.FloatProperty(default=0.0, indexed=True)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER


class UserBadgeProgressModel(BaseModel):
    """Tracks user progress toward earning a badge."""

    user_id = datastore_services.StringProperty(required=True, indexed=True)
    badge_id = datastore_services.StringProperty(required=True, indexed=True)

    current_progress = datastore_services.IntegerProperty(default=0)
    progress_data = datastore_services.JsonProperty(default={})

    last_progress_date = datastore_services.DateTimeProperty(indexed=True)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER
