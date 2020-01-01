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

"""Services for user data."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import user_services
from core.platform import models

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])
transaction_services = models.Registry.import_transaction_services()


def pre_delete_user(user_id):
    """Prepare user for the full deletion.
        1. Mark all the activities that are private and solely owned by the user
           being deleted as deleted.
        2. Disable all the email preferences.
        3. Mark the user as to be deleted.
        4. Create PendingDeletionRequestModel for the user.

    Args:
        user_id: str. The id of the user to be deleted.
    """
    subscribed_exploration_summaries = (
        exp_fetchers.get_exploration_summaries_subscribed_to(user_id))
    explorations_to_be_deleted_ids = [
        exp_summary.id for exp_summary in subscribed_exploration_summaries
        if exp_summary.is_private() and
        exp_summary.is_solely_owned_by_user(user_id)]
    # TODO(#8301): Implement delete_explorations to make this efficient.
    for exp_id in explorations_to_be_deleted_ids:
        exp_services.delete_exploration(user_id, exp_id)

    subscribed_collection_summaries = (
        collection_services.get_collection_summaries_subscribed_to(user_id))
    collections_to_be_deleted_ids = [
        col_summary.id for col_summary in subscribed_collection_summaries
        if col_summary.is_private() and
        col_summary.is_solely_owned_by_user(user_id)]
    # TODO(#8301): Implement delete_collections to make this efficient.
    for col_id in collections_to_be_deleted_ids:
        collection_services.delete_collection(user_id, col_id)

    # Set all the user's email preferences to False in order to disable all
    # ordinary emails that could be sent to the users.
    user_services.update_email_preferences(user_id, False, False, False, False)

    user_services.mark_user_for_deletion(
        user_id,
        explorations_to_be_deleted_ids,
        collections_to_be_deleted_ids,
    )


def delete_user(pending_deletion_model):
    """Smth.

    Args:
        pending_deletion_model: PendingDeletionRequestModel.
    """
    pass


def verify_user_deleted(pending_deletion_model):
    """Smth.

    Args:
        pending_deletion_model: PendingDeletionRequestModel.
    """
    pass

def delete_user_models(user_id):
    """Smth.

    Args:
        user_id: PendingDeletionRequestModel.
    """
    user_models.UserSettingsModel.apply_deletion_policy(user_id)
    user_models.CompletedActivitiesModel.apply_deletion_policy(user_id)
    user_models.IncompleteActivitiesModel.apply_deletion_policy(user_id)
    user_models.ExpUserLastPlaythroughModel.apply_deletion_policy(user_id)
    user_models.LearnerPlaylistModel.apply_deletion_policy(user_id)
    user_models.UserContributionsModel.apply_deletion_policy(user_id)
    user_models.UserEmailPreferencesModel.apply_deletion_policy(user_id)
    user_models.UserSubscriptionsModel.apply_deletion_policy(user_id)
    user_models.UserSubscribersModel.apply_deletion_policy(user_id)
    user_models.UserRecentChangesBatchModel.apply_deletion_policy(user_id)
    user_models.UserStatsModel.apply_deletion_policy(user_id)
    # TODO(): ExplorationUserDataModel
    user_models.CollectionProgressModel.apply_deletion_policy(user_id)
    user_models.StoryProgressModel.apply_deletion_policy(user_id)
    user_models.UserQueryModel.apply_deletion_policy(user_id)
    user_models.UserBulkEmailsModel.apply_deletion_policy(user_id)
    user_models.UserSkillMasteryModel.apply_deletion_policy(user_id)
    user_models.UserContributionScoringModel.apply_deletion_policy(user_id)