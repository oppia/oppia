# coding: utf-8
#
# Models for the Gamification Badge System in Oppia.

from __future__ import annotations

from core.platform import models

# Import BaseModel correctly (Oppia standard import)
(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])
BaseModel = base_models.BaseModel


class BadgeModel(BaseModel):
    """Represents a badge definition."""

    # Example fields:
    name = base_models.datastore_services.StringProperty(required=True)
    description = base_models.datastore_services.TextProperty()
    icon_url = base_models.datastore_services.StringProperty()
    is_active = base_models.datastore_services.BooleanProperty(default=True)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER


class UserBadgeModel(BaseModel):
    """Stores badges earned by a user."""

    user_id = base_models.datastore_services.StringProperty(required=True)
    badge_ids = base_models.datastore_services.StringProperty(repeated=True)
    last_earned_on = base_models.datastore_services.DateTimeProperty()

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER


class UserBadgeProgressModel(BaseModel):
    """Tracks progress of a user towards a badge (e.g., XP, tasks)."""

    user_id = base_models.datastore_services.StringProperty(required=True)
    badge_id = base_models.datastore_services.StringProperty(required=True)
    progress_value = base_models.datastore_services.IntegerProperty(default=0)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER


class BadgeCollectionModel(BaseModel):
    """A collection of badges (for grouping or levels)."""

    title = base_models.datastore_services.StringProperty(required=True)
    badge_ids = base_models.datastore_services.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER


class BadgeAnalyticsModel(BaseModel):
    """Stores analytics for badges (views, earns, etc.)"""

    badge_id = base_models.datastore_services.StringProperty(required=True)
    total_earns = base_models.datastore_services.IntegerProperty(default=0)
    total_views = base_models.datastore_services.IntegerProperty(default=0)

    @staticmethod
    def get_deletion_policy():
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
