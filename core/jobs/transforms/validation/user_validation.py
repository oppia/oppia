# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Beam DoFns and PTransforms to provide validation of user models."""

from __future__ import annotations

import datetime

from core import feconf
from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.jobs.types import model_property
from core.jobs.types import user_validation_errors
from core.platform import models

import apache_beam as beam

from typing import Iterator, List, Tuple, Type, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models
    from mypy_imports import collection_models
    from mypy_imports import datastore_services
    from mypy_imports import email_models
    from mypy_imports import exp_models
    from mypy_imports import feedback_models
    from mypy_imports import skill_models
    from mypy_imports import story_models
    from mypy_imports import user_models

(
    auth_models, collection_models, email_models,
    exp_models, feedback_models, skill_models,
    story_models, user_models
) = models.Registry.import_models([
    models.Names.AUTH, models.Names.COLLECTION, models.Names.EMAIL,
    models.Names.EXPLORATION, models.Names.FEEDBACK, models.Names.SKILL,
    models.Names.STORY, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()


@validation_decorators.AuditsExisting(
    auth_models.UserAuthDetailsModel,
    user_models.UserEmailPreferencesModel,
    user_models.UserSettingsModel,
)
class ValidateModelWithUserId(base_validation.ValidateBaseModelId):
    """Overload for models keyed by a user ID, which have a special format."""

    def __init__(self) -> None:
        super().__init__()
        # IMPORTANT: Only picklable objects can be stored on DoFns! This is
        # because DoFns are serialized with pickle when run on a pipeline (and
        # might be run on many different machines). Any other types assigned to
        # self, like compiled re patterns, ARE LOST AFTER DESERIALIZATION!
        # https://docs.python.org/3/library/pickle.html#what-can-be-pickled-and-unpickled
        self._pattern = feconf.USER_ID_REGEX


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
@validation_decorators.AuditsExisting(
    user_models.PendingDeletionRequestModel
)
class ValidateActivityMappingOnlyAllowedKeys(beam.DoFn):  # type: ignore[misc]
    """DoFn to check for Validates that pseudonymizable_entity_mappings."""

    def process(
        self, input_model: user_models.PendingDeletionRequestModel
    ) -> Iterator[user_validation_errors.ModelIncorrectKeyError]:
        """Function that check for incorrect key in model.

        Args:
            input_model: user_models.PendingDeletionRequestModel. Entity to
                validate.

        Yields:
            ModelIncorrectkeyError. An error class for incorrect key.
        """
        model = job_utils.clone_model(input_model)

        allowed_keys = [
            name.value for name in
            models.MODULES_WITH_PSEUDONYMIZABLE_CLASSES
        ]
        incorrect_keys = [
            key for key in model.pseudonymizable_entity_mappings.keys()
            if key not in allowed_keys
        ]

        if incorrect_keys:
            yield user_validation_errors.ModelIncorrectKeyError(
                model, incorrect_keys)


@validation_decorators.RelationshipsOf(user_models.CompletedActivitiesModel)
def completed_activities_model_relationships(
    model: Type[user_models.CompletedActivitiesModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[Union[
            exp_models.ExplorationModel,
            collection_models.CollectionModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.exploration_ids, [exp_models.ExplorationModel]
    yield model.collection_ids, [collection_models.CollectionModel]


@validation_decorators.RelationshipsOf(user_models.IncompleteActivitiesModel)
def incomplete_activities_model_relationships(
    model: Type[user_models.IncompleteActivitiesModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[Union[
            exp_models.ExplorationModel,
            collection_models.CollectionModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.exploration_ids, [exp_models.ExplorationModel]
    yield model.collection_ids, [collection_models.CollectionModel]


@validation_decorators.RelationshipsOf(user_models.ExpUserLastPlaythroughModel)
def exp_user_last_playthrough_model_relationships(
    model: Type[user_models.ExpUserLastPlaythroughModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[exp_models.ExplorationModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.exploration_id, [exp_models.ExplorationModel]


@validation_decorators.RelationshipsOf(user_models.LearnerPlaylistModel)
def learner_playlist_model_relationships(
    model: Type[user_models.LearnerPlaylistModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[Union[
            exp_models.ExplorationModel,
            collection_models.CollectionModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.exploration_ids, [exp_models.ExplorationModel]
    yield model.collection_ids, [collection_models.CollectionModel]


@validation_decorators.RelationshipsOf(user_models.UserContributionsModel)
def user_contributions_model_relationships(
    model: Type[user_models.UserContributionsModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[exp_models.ExplorationModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.created_exploration_ids, [exp_models.ExplorationModel]
    yield model.edited_exploration_ids, [exp_models.ExplorationModel]


@validation_decorators.RelationshipsOf(user_models.UserEmailPreferencesModel)
def user_email_preferences_model_relationships(
    model: Type[user_models.UserEmailPreferencesModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[user_models.UserSettingsModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(user_models.UserSubscriptionsModel)
def user_subscriptions_model_relationships(
    model: Type[user_models.UserSubscriptionsModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[Union[
            exp_models.ExplorationModel,
            collection_models.CollectionModel,
            feedback_models.GeneralFeedbackThreadModel,
            user_models.UserSubscribersModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.exploration_ids, [exp_models.ExplorationModel]
    yield model.collection_ids, [collection_models.CollectionModel]
    yield (
        model.general_feedback_thread_ids,
        [feedback_models.GeneralFeedbackThreadModel])
    yield model.creator_ids, [user_models.UserSubscribersModel]


@validation_decorators.RelationshipsOf(user_models.UserSubscribersModel)
def user_subscribers_model_relationships(
    model: Type[user_models.UserSubscribersModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[user_models.UserSubscriptionsModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.subscriber_ids, [user_models.UserSubscriptionsModel]


@validation_decorators.RelationshipsOf(user_models.UserRecentChangesBatchModel)
def user_recent_changes_batch_model_relationships(
    model: Type[user_models.UserRecentChangesBatchModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[user_models.UserSettingsModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(user_models.UserStatsModel)
def user_stats_model_relationships(
    model: Type[user_models.UserStatsModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[user_models.UserSettingsModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(user_models.ExplorationUserDataModel)
def exploration_user_data_model_relationships(
    model: Type[user_models.ExplorationUserDataModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[exp_models.ExplorationModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.exploration_id, [exp_models.ExplorationModel]


@validation_decorators.RelationshipsOf(user_models.CollectionProgressModel)
def collection_progress_model_relationships(
    model: Type[user_models.CollectionProgressModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[Union[
            collection_models.CollectionModel,
            exp_models.ExplorationModel,
            user_models.CompletedActivitiesModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.collection_id, [collection_models.CollectionModel]
    yield model.completed_explorations, [exp_models.ExplorationModel]
    yield model.user_id, [user_models.CompletedActivitiesModel]


@validation_decorators.RelationshipsOf(user_models.StoryProgressModel)
def story_progress_model_relationships(
    model: Type[user_models.StoryProgressModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[story_models.StoryModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.story_id, [story_models.StoryModel]


@validation_decorators.RelationshipsOf(user_models.UserQueryModel)
def user_query_model_relationships(
    model: Type[user_models.UserQueryModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[email_models.BulkEmailModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.sent_email_model_id, [email_models.BulkEmailModel]


@validation_decorators.RelationshipsOf(user_models.UserBulkEmailsModel)
def user_bulk_emails_model_relationships(
    model: Type[user_models.UserBulkEmailsModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[email_models.BulkEmailModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.sent_email_model_ids, [email_models.BulkEmailModel]


@validation_decorators.RelationshipsOf(user_models.UserSkillMasteryModel)
def user_skill_mastery_model_relationships(
    model: Type[user_models.UserSkillMasteryModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[skill_models.SkillModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.skill_id, [skill_models.SkillModel]


@validation_decorators.RelationshipsOf(
    user_models.UserContributionProficiencyModel)
def user_contribution_proficiency_model_relationships(
    model: Type[user_models.UserContributionProficiencyModel]
) -> Iterator[
    Tuple[
        datastore_services.Property,
        List[Type[user_models.UserSettingsModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.user_id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(user_models.UserContributionRightsModel)
def user_contribution_rights_model_relationships(
    model: Type[user_models.UserContributionRightsModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[user_models.UserSettingsModel]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""

    yield model.id, [user_models.UserSettingsModel]


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
@validation_decorators.AuditsExisting(
    user_models.ExplorationUserDataModel
)
class ValidateDraftChangeListLastUpdated(beam.DoFn):  # type: ignore[misc]
    """DoFn to validate the last_update of draft change list"""

    def process(
        self, input_model: user_models.ExplorationUserDataModel
    ) -> Iterator[
        Union[
            user_validation_errors.DraftChangeListLastUpdatedNoneError,
            user_validation_errors.DraftChangeListLastUpdatedInvalidError
        ]
    ]:
        """Function that checks if last_updated for draft change list is valid.

        Args:
            input_model: user_models.ExplorationUserDataModel.
                Entity to validate.

        Yields:
            DraftChangeListLastUpdatedNoneError. Error for models with
            draft change list but no draft_change_list_last_updated

            DraftChangeListLastUpdatedInvalidError. Error for models with
            draft_change_list_last_updated greater than current time.
        """
        model = job_utils.clone_model(input_model)
        if (model.draft_change_list and
                not model.draft_change_list_last_updated):
            yield user_validation_errors.DraftChangeListLastUpdatedNoneError(
                model)
        current_time = datetime.datetime.utcnow()
        if (model.draft_change_list_last_updated and
                model.draft_change_list_last_updated > current_time):
            yield user_validation_errors.DraftChangeListLastUpdatedInvalidError(
                model)


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
@validation_decorators.AuditsExisting(
    user_models.UserQueryModel
)
class ValidateArchivedModelsMarkedDeleted(beam.DoFn):  # type: ignore[misc]
    """DoFn to validate archived models marked deleted."""

    def process(
        self, input_model: user_models.UserQueryModel
    ) -> Iterator[user_validation_errors.ArchivedModelNotMarkedDeletedError]:
        """Function that checks if archived model is marked deleted.

        Args:
            input_model: user_models.UserQueryModel.
                Entity to validate.

        Yields:
            ArchivedModelNotMarkedDeletedError. Error for models marked
            archived but not deleted.
        """
        model = job_utils.clone_model(input_model)
        if model.query_status == feconf.USER_QUERY_STATUS_ARCHIVED:
            yield user_validation_errors.ArchivedModelNotMarkedDeletedError(
                model)
