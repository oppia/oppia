# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Service for handling the user deletion process."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import collection_services
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import user_services
from core.platform import models

current_user_services = models.Registry.import_current_user_services()
(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])
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
    exp_services.delete_explorations(user_id, explorations_to_be_deleted_ids)

    subscribed_collection_summaries = (
        collection_services.get_collection_summaries_subscribed_to(user_id))
    collections_to_be_deleted_ids = [
        col_summary.id for col_summary in subscribed_collection_summaries
        if col_summary.is_private() and
        col_summary.is_solely_owned_by_user(user_id)]
    collection_services.delete_collections(
        user_id, collections_to_be_deleted_ids)

    # Set all the user's email preferences to False in order to disable all
    # ordinary emails that could be sent to the users.
    user_services.update_email_preferences(user_id, False, False, False, False)

    user_services.mark_user_for_deletion(
        user_id,
        explorations_to_be_deleted_ids,
        collections_to_be_deleted_ids,
    )


def delete_user(pending_deletion_model):
    """Delete all the models for user specified in pending_deletion_model.

    Args:
        pending_deletion_model: PendingDeletionRequestModel.
    """
    _delete_user_models(pending_deletion_model.id)
    pending_deletion_model.deletion_complete = True
    pending_deletion_model.put()


def verify_user_deleted(pending_deletion_model):
    """Verify that all the models for user specified in pending_deletion_model
    are deleted.

    Args:
        pending_deletion_model: PendingDeletionRequestModel.

    Returns:
        bool. True if all the models were correctly deleted, False otherwise.
    """
    if _verify_user_models_deleted(pending_deletion_model.id):
        pending_deletion_model.delete()
        email_manager.send_account_deleted_email(
            pending_deletion_model.id, pending_deletion_model.email)
        return True
    else:
        pending_deletion_model.deletion_complete = False
        pending_deletion_model.put()
        return False


def _delete_user_models(user_id):
    """Delete the user models for the user with user_id.

    Args:
        user_id: str. The id of the user to be deleted.
    """
    for model_class in models.Registry.get_storage_model_classes(
            [models.NAMES.user]):
        if (model_class.get_deletion_policy() !=
                base_models.DELETION_POLICY.KEEP):
            model_class.apply_deletion_policy(user_id)


def _verify_user_models_deleted(user_id):
    """Verify that the user models for the user with user_id are deleted.

    Args:
        user_id: str. The id of the user to be deleted.

    Returns:
        bool. True if all the user models were correctly deleted, False
        otherwise.
    """
    for model_class in models.Registry.get_storage_model_classes(
            [models.NAMES.user]):
        if (model_class.get_deletion_policy() !=
                base_models.DELETION_POLICY.KEEP):
            if model_class.has_reference_to_user_id(user_id):
                return False
    return True
