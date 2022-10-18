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

from __future__ import annotations

import datetime
import itertools
import logging
import re

from core import feconf
from core import utils
from core.domain import auth_services
from core.domain import collection_services
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import taskqueue_services
from core.domain import topic_services
from core.domain import user_services
from core.domain import wipeout_domain
from core.platform import models

from typing import Dict, Final, List, Optional, Sequence, Tuple, Type, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_feedback_report_models
    from mypy_imports import base_models
    from mypy_imports import blog_models
    from mypy_imports import bulk_email_services
    from mypy_imports import collection_models
    from mypy_imports import config_models
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import feedback_models
    from mypy_imports import question_models
    from mypy_imports import skill_models
    from mypy_imports import story_models
    from mypy_imports import subtopic_models
    from mypy_imports import suggestion_models
    from mypy_imports import topic_models
    from mypy_imports import transaction_services
    from mypy_imports import user_models

(
    app_feedback_report_models, base_models, blog_models,
    collection_models, config_models, exp_models, feedback_models,
    question_models, skill_models, story_models, subtopic_models,
    suggestion_models, topic_models, user_models
) = models.Registry.import_models([
    models.Names.APP_FEEDBACK_REPORT, models.Names.BASE_MODEL,
    models.Names.BLOG, models.Names.COLLECTION, models.Names.CONFIG,
    models.Names.EXPLORATION, models.Names.FEEDBACK, models.Names.QUESTION,
    models.Names.SKILL, models.Names.STORY, models.Names.SUBTOPIC,
    models.Names.SUGGESTION, models.Names.TOPIC, models.Names.USER,
])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()
bulk_email_services = models.Registry.import_bulk_email_services()


WIPEOUT_LOGS_PREFIX: Final = '[WIPEOUT]'
PERIOD_AFTER_WHICH_USERNAME_CANNOT_BE_REUSED: Final = (
    datetime.timedelta(weeks=1)
)


def get_pending_deletion_request(
    user_id: str
) -> wipeout_domain.PendingDeletionRequest:
    """Return the pending deletion request.

    Args:
        user_id: str. The unique ID of the user.

    Returns:
        PendingDeletionRequest. The pending deletion request domain object.
    """
    pending_deletion_request_model = (
        user_models.PendingDeletionRequestModel.get_by_id(user_id))
    return wipeout_domain.PendingDeletionRequest(
        pending_deletion_request_model.id,
        pending_deletion_request_model.email,
        pending_deletion_request_model.normalized_long_term_username,
        pending_deletion_request_model.deletion_complete,
        pending_deletion_request_model.pseudonymizable_entity_mappings
    )


def get_number_of_pending_deletion_requests() -> int:
    """Get number of pending deletion request.

    Returns:
        int. The number of pending deletion requests.
    """
    return user_models.PendingDeletionRequestModel.query().count()


def save_pending_deletion_requests(
    pending_deletion_requests: List[wipeout_domain.PendingDeletionRequest]
) -> None:
    """Save a list of pending deletion request domain objects as
    PendingDeletionRequestModel entities in the datastore.

    Args:
        pending_deletion_requests: list(PendingDeletionRequest). List of pending
            deletion request objects to be saved in the datastore.
    """
    user_ids = [request.user_id for request in pending_deletion_requests]
    pending_deletion_request_models = (
        user_models.PendingDeletionRequestModel.get_multi(
            user_ids, include_deleted=True)
    )
    final_pending_deletion_request_models = []
    for deletion_request_model, deletion_request in zip(
            pending_deletion_request_models, pending_deletion_requests):
        deletion_request.validate()
        deletion_request_dict = {
            'email': deletion_request.email,
            'normalized_long_term_username': (
                deletion_request.normalized_long_term_username),
            'deletion_complete': deletion_request.deletion_complete,
            'pseudonymizable_entity_mappings': (
                deletion_request.pseudonymizable_entity_mappings)
        }
        if deletion_request_model is not None:
            deletion_request_model.populate(**deletion_request_dict)
        else:
            deletion_request_dict['id'] = deletion_request.user_id
            deletion_request_model = user_models.PendingDeletionRequestModel(
                **deletion_request_dict
            )
        final_pending_deletion_request_models.append(deletion_request_model)

    user_models.PendingDeletionRequestModel.update_timestamps_multi(
        final_pending_deletion_request_models)
    user_models.PendingDeletionRequestModel.put_multi(
        final_pending_deletion_request_models)


def pre_delete_user(user_id: str) -> None:
    """Prepare user for the full deletion.
        1. Mark all the activities that are private and solely owned by the user
           being deleted as deleted.
        2. Disable all the email preferences.
        3. Mark the user as to be deleted.
        4. Create PendingDeletionRequestModel for the user.

    Args:
        user_id: str. The id of the user to be deleted. If the user_id
            corresponds to a profile user then only that profile is deleted.
            For a full user, all of its associated profile users are deleted
            too.

    Raises:
        Exception. No data available for when the user was created on.
    """
    pending_deletion_requests = []
    user_settings = user_services.get_user_settings(user_id, strict=True)

    linked_profile_user_ids = [
        user.user_id for user in
        user_services.get_all_profiles_auth_details_by_parent_user_id(user_id)
    ]
    profile_users_settings_list = user_services.get_users_settings(
        linked_profile_user_ids, strict=True)
    for profile_user_settings in profile_users_settings_list:
        profile_id = profile_user_settings.user_id
        user_services.mark_user_for_deletion(profile_id)
        pending_deletion_requests.append(
            wipeout_domain.PendingDeletionRequest.create_default(
                profile_id,
                profile_user_settings.email
            )
        )
    if feconf.ROLE_ID_MOBILE_LEARNER not in user_settings.roles:
        taskqueue_services.defer(
            taskqueue_services.FUNCTION_ID_REMOVE_USER_FROM_RIGHTS_MODELS,
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS,
            user_id,
        )
        # Set all the user's email preferences to False in order to disable all
        # ordinary emails that could be sent to the users.
        user_services.update_email_preferences(
            user_id, False, False, False, False)
        bulk_email_services.permanently_delete_user_from_list(
            user_settings.email)

    user_services.mark_user_for_deletion(user_id)

    date_now = datetime.datetime.utcnow()
    date_before_which_username_should_be_saved = (
        date_now - PERIOD_AFTER_WHICH_USERNAME_CANNOT_BE_REUSED)
    if user_settings.created_on is None:
        raise Exception(
            'No data available for when the user was created on.'
        )
    normalized_long_term_username = (
        user_settings.normalized_username
        if user_settings.created_on < date_before_which_username_should_be_saved
        else None
    )
    pending_deletion_requests.append(
        wipeout_domain.PendingDeletionRequest.create_default(
            user_id,
            user_settings.email,
            normalized_long_term_username=normalized_long_term_username
        )
    )

    save_pending_deletion_requests(pending_deletion_requests)


def delete_users_pending_to_be_deleted() -> None:
    """Taskqueue service method for deleting users that are pending
    to be deleted. Once these users are deleted, the job results
    will be mailed to the admin.
    """
    pending_deletion_request_models: Sequence[
        user_models.PendingDeletionRequestModel
    ] = (
        user_models.PendingDeletionRequestModel.query().fetch())
    if len(pending_deletion_request_models) == 0:
        return

    email_message = 'Results of the User Deletion Cron Job'
    for request_model in pending_deletion_request_models:
        pending_deletion_request = get_pending_deletion_request(
            request_model.id)
        # The final status of the deletion. Either 'SUCCESS' or 'ALREADY DONE'.
        deletion_status = run_user_deletion(pending_deletion_request)
        email_message += '\n-----------------------------------\n'
        email_message += (
            'PendingDeletionRequestModel ID: %s\n'
            'User ID: %s\n'
            'Deletion status: %s\n'
        ) % (
            request_model.id, pending_deletion_request.user_id,
            deletion_status
        )

    email_subject = 'User Deletion job result'
    if feconf.CAN_SEND_EMAILS:
        email_manager.send_mail_to_admin(email_subject, email_message)


def check_completion_of_user_deletion() -> None:
    """Taskqueue service method for checking the completion of user deletion.
    It checks if all models do not contain the user ID of the deleted user in
    their fields. If any field contains the user ID of the deleted user, the
    deletion_complete is set to False, so that later the
    delete_users_pending_to_be_deleted will be run on that user again.
    If all the fields do not contain the user ID of the deleted
    user, the final email announcing that the deletion was completed is sent,
    and the deletion request is deleted.
    """
    pending_deletion_request_models: Sequence[
        user_models.PendingDeletionRequestModel
    ] = (
        user_models.PendingDeletionRequestModel.query().fetch())

    email_message = 'Results of the Completion of User Deletion Cron Job'
    for request_model in pending_deletion_request_models:
        pending_deletion_request = get_pending_deletion_request(
            request_model.id)
        # The final status of the completion. Either 'NOT DELETED', 'SUCCESS',
        # or 'FAILURE'.
        completion_status = run_user_deletion_completion(
            pending_deletion_request)
        if feconf.CAN_SEND_EMAILS:
            email_message += '\n-----------------------------------\n'
            email_message += (
                'PendingDeletionRequestModel ID: %s\n'
                'User ID: %s\n'
                'Completion status: %s\n'
            ) % (
                request_model.id, pending_deletion_request.user_id,
                completion_status
            )
            email_subject = 'Completion of User Deletion job result'
            email_manager.send_mail_to_admin(email_subject, email_message)


def run_user_deletion(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> str:
    """Run the user deletion.

    Args:
        pending_deletion_request: PendingDeletionRequest. The domain object for
            the user being deleted.

    Returns:
        str. The outcome of the deletion.
    """

    if pending_deletion_request.deletion_complete:
        return wipeout_domain.USER_DELETION_ALREADY_DONE
    else:
        delete_user(pending_deletion_request)
        pending_deletion_request.deletion_complete = True
        save_pending_deletion_requests([pending_deletion_request])
        return wipeout_domain.USER_DELETION_SUCCESS


def run_user_deletion_completion(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> str:
    """Run the user deletion verification.

    Args:
        pending_deletion_request: PendingDeletionRequest. The domain object for
            the user being verified.

    Returns:
        str. The outcome of the verification.
    """
    # If deletion_complete is False the delete_users_pending_to_be_deleted
    # wasn't yet run for the user. The verification will be done in the next
    # run of check_completion_of_user_deletion.
    if not pending_deletion_request.deletion_complete:
        return wipeout_domain.USER_VERIFICATION_NOT_DELETED
    elif verify_user_deleted(pending_deletion_request.user_id):
        _delete_models_with_delete_at_end_policy(
            pending_deletion_request.user_id)
        user_models.DeletedUserModel(
            id=pending_deletion_request.user_id
        ).put()
        if pending_deletion_request.normalized_long_term_username is not None:
            user_services.save_deleted_username(
                pending_deletion_request.normalized_long_term_username)
        if feconf.CAN_SEND_EMAILS:
            email_manager.send_account_deleted_email(
                pending_deletion_request.user_id,
                pending_deletion_request.email
            )
        return wipeout_domain.USER_VERIFICATION_SUCCESS
    else:
        if feconf.CAN_SEND_EMAILS:
            email_manager.send_account_deletion_failed_email(
                pending_deletion_request.user_id,
                pending_deletion_request.email
            )
        pending_deletion_request.deletion_complete = False
        save_pending_deletion_requests([pending_deletion_request])
        return wipeout_domain.USER_VERIFICATION_FAILURE


def _delete_models_with_delete_at_end_policy(user_id: str) -> None:
    """Delete auth and user models with deletion policy 'DELETE_AT_END'.

    Args:
        user_id: str. The unique ID of the user that is being deleted.
    """
    for model_class in models.Registry.get_storage_model_classes(
            [models.Names.AUTH, models.Names.USER]):
        policy = model_class.get_deletion_policy()
        if policy == base_models.DELETION_POLICY.DELETE_AT_END:
            model_class.apply_deletion_policy(user_id)


def delete_user(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> None:
    """Delete all the models for user specified in pending_deletion_request
    on the basis of the user role.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to delete or pseudonymize all the models.
    """
    user_id = pending_deletion_request.user_id
    user_roles = user_models.UserSettingsModel.get_by_id(user_id).roles

    auth_services.delete_external_auth_associations(user_id)

    _delete_models(user_id, models.Names.AUTH)
    _delete_models(user_id, models.Names.USER)
    _pseudonymize_config_models(pending_deletion_request)
    _delete_models(user_id, models.Names.FEEDBACK)
    _delete_models(user_id, models.Names.IMPROVEMENTS)
    _delete_models(user_id, models.Names.SUGGESTION)
    if feconf.ROLE_ID_MOBILE_LEARNER not in user_roles:
        remove_user_from_activities_with_associated_rights_models(
            pending_deletion_request.user_id)
        _pseudonymize_app_feedback_report_models(pending_deletion_request)
        _pseudonymize_feedback_models(pending_deletion_request)
        _pseudonymize_suggestion_models(pending_deletion_request)
        _pseudonymize_activity_models_without_associated_rights_models(
            pending_deletion_request,
            models.Names.QUESTION,
            question_models.QuestionSnapshotMetadataModel,
            question_models.QuestionCommitLogEntryModel,
            'question_id')
        _pseudonymize_activity_models_without_associated_rights_models(
            pending_deletion_request,
            models.Names.SKILL,
            skill_models.SkillSnapshotMetadataModel,
            skill_models.SkillCommitLogEntryModel,
            'skill_id')
        _pseudonymize_activity_models_without_associated_rights_models(
            pending_deletion_request,
            models.Names.STORY,
            story_models.StorySnapshotMetadataModel,
            story_models.StoryCommitLogEntryModel,
            'story_id')
        _pseudonymize_activity_models_without_associated_rights_models(
            pending_deletion_request,
            models.Names.SUBTOPIC,
            subtopic_models.SubtopicPageSnapshotMetadataModel,
            subtopic_models.SubtopicPageCommitLogEntryModel,
            'subtopic_page_id')
        _pseudonymize_activity_models_with_associated_rights_models(
            pending_deletion_request,
            models.Names.EXPLORATION,
            exp_models.ExplorationSnapshotMetadataModel,
            exp_models.ExplorationRightsSnapshotMetadataModel,
            exp_models.ExplorationRightsSnapshotContentModel,
            exp_models.ExplorationCommitLogEntryModel,
            'exploration_id',
            feconf.EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS,
            ['owner_ids', 'editor_ids', 'voice_artist_ids', 'viewer_ids'])
        _remove_user_id_from_contributors_in_summary_models(
            user_id, exp_models.ExpSummaryModel)
        _pseudonymize_activity_models_with_associated_rights_models(
            pending_deletion_request,
            models.Names.COLLECTION,
            collection_models.CollectionSnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotContentModel,
            collection_models.CollectionCommitLogEntryModel,
            'collection_id',
            feconf.COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS,
            ['owner_ids', 'editor_ids', 'voice_artist_ids', 'viewer_ids'])
        _remove_user_id_from_contributors_in_summary_models(
            user_id, collection_models.CollectionSummaryModel)
        _pseudonymize_activity_models_with_associated_rights_models(
            pending_deletion_request,
            models.Names.TOPIC,
            topic_models.TopicSnapshotMetadataModel,
            topic_models.TopicRightsSnapshotMetadataModel,
            topic_models.TopicRightsSnapshotContentModel,
            topic_models.TopicCommitLogEntryModel,
            'topic_id',
            feconf.TOPIC_RIGHTS_CHANGE_ALLOWED_COMMANDS,
            ['manager_ids'])
        _pseudonymize_blog_post_models(pending_deletion_request)
        _pseudonymize_version_history_models(pending_deletion_request)
    _delete_models(user_id, models.Names.EMAIL)
    _delete_models(user_id, models.Names.LEARNER_GROUP)


def verify_user_deleted(
    user_id: str, include_delete_at_end_models: bool = False
) -> bool:
    """Verify that all the models for user specified in pending_deletion_request
    are deleted.

    Args:
        user_id: str. The ID of the user whose deletion should be verified.
        include_delete_at_end_models: bool. Whether to skip models
            that have deletion policy equal to 'DELETE_AT_END'.

    Returns:
        bool. True if all the models were correctly deleted, False otherwise.
    """
    if not auth_services.verify_external_auth_associations_are_deleted(user_id):
        return False

    policies_not_to_verify = [
        base_models.DELETION_POLICY.KEEP,
        base_models.DELETION_POLICY.NOT_APPLICABLE
    ]
    if not include_delete_at_end_models:
        policies_not_to_verify.append(
            base_models.DELETION_POLICY.DELETE_AT_END)

    user_is_verified = True
    for model_class in models.Registry.get_all_storage_model_classes():
        if (
                model_class.get_deletion_policy() not in policies_not_to_verify
                and model_class.has_reference_to_user_id(user_id)
        ):
            logging.error(
                '%s %s is not deleted for user with ID %s' % (
                    WIPEOUT_LOGS_PREFIX, model_class.__name__, user_id))
            user_is_verified = False
    return user_is_verified


def remove_user_from_activities_with_associated_rights_models(
    user_id: str
) -> None:
    """Remove the user from exploration, collection, and topic models.

    Args:
        user_id: str. The ID of the user for which to remove the user from
            explorations, collections, and topics.
    """
    subscribed_exploration_summaries = (
        exp_fetchers.get_exploration_summaries_where_user_has_role(user_id))

    explorations_to_be_deleted_ids = [
        exp_summary.id for exp_summary in subscribed_exploration_summaries if
        exp_summary.is_private() and
        exp_summary.is_solely_owned_by_user(user_id)
    ]
    exp_services.delete_explorations(
        user_id, explorations_to_be_deleted_ids, force_deletion=True)

    # Release ownership of explorations that are public and are solely owned
    # by the to-be-deleted user.
    explorations_to_release_ownership_ids = [
        exp_summary.id for exp_summary in subscribed_exploration_summaries if
        not exp_summary.is_private() and
        exp_summary.is_solely_owned_by_user(user_id) and
        not exp_summary.community_owned
    ]
    for exp_id in explorations_to_release_ownership_ids:
        rights_manager.release_ownership_of_exploration(
            user_services.get_system_user(), exp_id)

    explorations_to_remove_user_from_ids = [
        exp_summary.id for exp_summary in subscribed_exploration_summaries if
        not exp_summary.is_solely_owned_by_user(user_id) and
        exp_summary.does_user_have_any_role(user_id)
    ]
    for exp_id in explorations_to_remove_user_from_ids:
        rights_manager.deassign_role_for_exploration(
            user_services.get_system_user(), exp_id, user_id)

    # To hard-delete explorations marked as deleted we are using the rights
    # model to retrieve the exploration as the summary model gets hard-deleted
    # while marking the exploration as deleted.
    explorations_rights = (
        rights_manager.get_exploration_rights_where_user_is_owner(user_id))
    explorations_to_be_deleted_ids = [
        exploration_rights.id for exploration_rights
        in explorations_rights if
        exploration_rights.is_private() and
        exploration_rights.is_solely_owned_by_user(user_id)
    ]
    exp_services.delete_explorations(
        user_id, explorations_to_be_deleted_ids, force_deletion=True)

    subscribed_collection_summaries = (
        collection_services.get_collection_summaries_where_user_has_role(
            user_id))

    collections_to_be_deleted_ids = [
        col_summary.id for col_summary in subscribed_collection_summaries if
        col_summary.is_private() and
        col_summary.is_solely_owned_by_user(user_id)
    ]
    collection_services.delete_collections(
        user_id, collections_to_be_deleted_ids, force_deletion=True)

    # Release ownership of collections that are public and are solely owned
    # by the to-be-deleted user.
    collections_to_release_ownership_ids = [
        col_summary.id for col_summary in subscribed_collection_summaries if
        not col_summary.is_private() and
        col_summary.is_solely_owned_by_user(user_id) and
        not col_summary.community_owned
    ]
    for col_id in collections_to_release_ownership_ids:
        rights_manager.release_ownership_of_collection(
            user_services.get_system_user(), col_id)

    collections_to_remove_user_from_ids = [
        col_summary.id for col_summary in subscribed_collection_summaries if
        not col_summary.is_solely_owned_by_user(user_id) and
        col_summary.does_user_have_any_role(user_id)
    ]
    for col_id in collections_to_remove_user_from_ids:
        rights_manager.deassign_role_for_collection(
            user_services.get_system_user(), col_id, user_id)

    # To hard-delete collections marked as deleted we are using the rights
    # model to retrieve the collection as the summary model gets hard-deleted
    # while marking the collection as deleted.
    collection_rights = (
        rights_manager.get_collection_rights_where_user_is_owner(user_id))
    collections_to_be_deleted_ids = [
        collection_rights.id for collection_rights in collection_rights if
        collection_rights.is_private() and
        collection_rights.is_solely_owned_by_user(user_id)
    ]
    collection_services.delete_collections(
        user_id, collections_to_be_deleted_ids, force_deletion=True)

    topic_services.deassign_user_from_all_topics(
        user_services.get_system_user(), user_id)


def _generate_entity_to_pseudonymized_ids_mapping(
    entity_ids: List[str]
) -> Dict[str, str]:
    """Generate mapping from entity IDs to pseudonymous user IDs.

    Args:
        entity_ids: list(str). List of entity IDs for which to generate new
            pseudonymous user IDs. The IDs are of entities (e.g. models in
            config, collection, skill, or suggestion) that were modified
            in some way by the user who is currently being deleted.

    Returns:
        dict(str, str). Mapping between the entity IDs and pseudonymous user
        IDs. For each entity (with distinct ID) we generate a new pseudonymous
        user ID.
    """
    return {
        entity_id: user_models.PseudonymizedUserModel.get_new_id('')
        for entity_id in entity_ids
    }


def _save_pseudonymizable_entity_mappings_to_same_pseudonym(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest,
    entity_category: models.Names,
    entity_ids: List[str]
) -> None:
    """Generate mapping from entity IDs to a single pseudonymized user ID.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to which to save the entity mappings.
        entity_category: models.Names. The category of the models that
            contain the entity IDs.
        entity_ids: list(str). List of entity IDs for which to generate new
            pseudonymous user IDs. The IDs are of entities (e.g. models in
            config, collection, skill, or suggestion) that were modified
            in some way by the user who is currently being deleted.
    """
    if (
            entity_category.value not in
            pending_deletion_request.pseudonymizable_entity_mappings):
        pseudonymized_id = user_models.PseudonymizedUserModel.get_new_id('')
        pending_deletion_request.pseudonymizable_entity_mappings[
            entity_category.value] = {
                entity_id: pseudonymized_id for entity_id in entity_ids
            }
        save_pending_deletion_requests([pending_deletion_request])


def _save_pseudonymizable_entity_mappings_to_different_pseudonyms(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest,
    entity_category: models.Names,
    entity_ids: List[str]
) -> None:
    """Save the entity mappings for some entity category into the pending
    deletion request.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to which to save the entity mappings.
        entity_category: models.Names. The category of the models that
            contain the entity IDs.
        entity_ids: list(str). The IDs for which to generate the mappings.
    """
    # The pseudonymizable_entity_mappings field might have only been partially
    # generated, so we fill in the missing part for this entity category.
    if (
            entity_category.value not in
            pending_deletion_request.pseudonymizable_entity_mappings):
        pending_deletion_request.pseudonymizable_entity_mappings[
            entity_category.value] = (
                _generate_entity_to_pseudonymized_ids_mapping(entity_ids))
        save_pending_deletion_requests([pending_deletion_request])


def _delete_models(user_id: str, module_name: models.Names) -> None:
    """Delete all the models from the given module, for a given user.

    Args:
        user_id: str. The id of the user to be deleted.
        module_name: models.Names. The name of the module containing the models
            that are being deleted.
    """
    for model_class in models.Registry.get_storage_model_classes([module_name]):
        deletion_policy = model_class.get_deletion_policy()
        if deletion_policy == base_models.DELETION_POLICY.DELETE:
            model_class.apply_deletion_policy(user_id)


# The type of the argument 'commit_log_model_class' is Optional[...], because
# when we are dealing with config_model classes we pass None to this argument,
# because we do not have commit_log_model classes for config_model classes.
def _collect_and_save_entity_ids_from_snapshots_and_commits(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest,
    activity_category: models.Names,
    snapshot_metadata_model_classes: List[
        Type[base_models.BaseSnapshotMetadataModel]
    ],
    commit_log_model_class: Optional[Type[base_models.BaseCommitLogEntryModel]],
    commit_log_model_field_name: Optional[str]
) -> Tuple[
    List[base_models.BaseSnapshotMetadataModel],
    List[base_models.BaseCommitLogEntryModel]
]:
    """Collect and save the activity IDs that for the user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to collect the entity IDs.
        activity_category: models.Names. The category of the models that are
            that contain the entity IDs.
        snapshot_metadata_model_classes: list(class). The snapshot metadata
            model classes that contain the entity IDs.
        commit_log_model_class: class. The metadata model classes that
            contains the entity IDs.
        commit_log_model_field_name: str. The name of the field holding the
            entity ID in the corresponding commit log model.

    Returns:
        (list(BaseSnapshotMetadataModel), list(BaseCommitLogEntryModel)).
        The tuple of snapshot metadata and commit log models.

    Raises:
        Exception. Field name can only be None when commit log model class is
            not provided.
    """
    user_id = pending_deletion_request.user_id

    snapshot_metadata_models: List[base_models.BaseSnapshotMetadataModel] = []
    for snapshot_model_class in snapshot_metadata_model_classes:
        snapshot_metadata_models.extend(snapshot_model_class.query(
            datastore_services.any_of(
                snapshot_model_class.committer_id == user_id,
                snapshot_model_class.commit_cmds_user_ids == user_id,
                snapshot_model_class.content_user_ids == user_id,
            )).fetch())
    snapshot_metadata_ids = set(
        model.get_unversioned_instance_id()
        for model in snapshot_metadata_models)

    commit_log_ids = set()
    commit_log_models: List[base_models.BaseCommitLogEntryModel] = []
    if commit_log_model_class is not None:
        commit_log_models = list(commit_log_model_class.query(
            commit_log_model_class.user_id == user_id
        ).fetch())
        if commit_log_model_field_name is None:
            raise Exception(
                'Field name can only be None when commit log model class is '
                'not provided.'
            )
        commit_log_ids = set(
            getattr(model, commit_log_model_field_name)
            for model in commit_log_models)
        if snapshot_metadata_ids != commit_log_ids:
            logging.error(
                '%s The commit log model \'%s\' and snapshot models %s IDs '
                'differ. Snapshots without commit logs: %s, '
                'commit logs without snapshots: %s.' % (
                    WIPEOUT_LOGS_PREFIX,
                    commit_log_model_class.__name__,
                    [
                        snapshot_metadata_model_class.__name__
                        for snapshot_metadata_model_class
                        in snapshot_metadata_model_classes
                    ],
                    list(snapshot_metadata_ids - commit_log_ids),
                    list(commit_log_ids - snapshot_metadata_ids)
                )
            )
    model_ids = snapshot_metadata_ids | commit_log_ids

    _save_pseudonymizable_entity_mappings_to_different_pseudonyms(
        pending_deletion_request, activity_category, list(model_ids))

    return (snapshot_metadata_models, commit_log_models)


def _pseudonymize_config_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> None:
    """Pseudonymize the config models for the user.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to pseudonymize the models.
    """
    snapshot_model_classes = (
        config_models.ConfigPropertySnapshotMetadataModel,
        config_models.PlatformParameterSnapshotMetadataModel)

    snapshot_metadata_models, _ = (
        _collect_and_save_entity_ids_from_snapshots_and_commits(
            pending_deletion_request,
            models.Names.CONFIG,
            list(snapshot_model_classes),
            None,
            None
        )
    )

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        activity_related_models: List[base_models.BaseModel],
        pseudonymized_id: str
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        activity_related_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            activity_related_models: list(BaseModel). Models whose user IDs
                should be pseudonymized.
            pseudonymized_id: str. New pseudonymized user ID to be used for
                the models.
        """
        metadata_models = [
            model for model in activity_related_models
            if isinstance(model, snapshot_model_classes)]
        for metadata_model in metadata_models:
            metadata_model.committer_id = pseudonymized_id
            metadata_model.update_timestamps()

        datastore_services.put_multi(metadata_models)

    config_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.Names.CONFIG.value])
    for config_id, pseudonymized_id in config_ids_to_pids.items():
        config_related_models = [
            model for model in snapshot_metadata_models
            if model.get_unversioned_instance_id() == config_id]
        for i in range(
                0,
                len(config_related_models),
                feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            _pseudonymize_models_transactional(
                config_related_models[
                    i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_id
            )


def _pseudonymize_activity_models_without_associated_rights_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest,
    activity_category: models.Names,
    snapshot_model_class: Type[base_models.BaseSnapshotMetadataModel],
    commit_log_model_class: Type[base_models.BaseCommitLogEntryModel],
    commit_log_model_field_name: str
) -> None:
    """Collect the activity IDs that for the user with user_id. Verify that each
    snapshot has corresponding commit log.

    Activity models are models that have a main VersionedModel,
    CommitLogEntryModel, and other additional models that mostly use the same ID
    as the main model (e.g. collection, exploration, question, skill, story,
    topic). Activity models with associated rights models, e.g. models in
    collections, explorations, and topics, should not be handled by this method
    but with _pseudonymize_activity_models_with_associated_rights_models.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to pseudonymize the models.
        activity_category: models.Names. The category of the models that are
            being pseudonymized.
        snapshot_model_class: class. The metadata model class that is being
            pseudonymized.
        commit_log_model_class: class. The commit log model class that is being
            pseudonymized.
        commit_log_model_field_name: str. The name of the field holding the
            activity ID in the corresponding commit log model.
    """
    snapshot_metadata_models, commit_log_models = (
        _collect_and_save_entity_ids_from_snapshots_and_commits(
            pending_deletion_request,
            activity_category,
            [snapshot_model_class],
            commit_log_model_class,
            commit_log_model_field_name
        )
    )

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        activity_related_models: List[base_models.BaseModel],
        pseudonymized_id: str
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        activity_related_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            activity_related_models: list(BaseModel). Models whose user IDs
                should be pseudonymized.
            pseudonymized_id: str. New pseudonymized user ID to be used for
                the models.
        """
        metadata_models = [
            model for model in activity_related_models
            if isinstance(model, snapshot_model_class)]
        for metadata_model in metadata_models:
            metadata_model.committer_id = pseudonymized_id
            metadata_model.update_timestamps()

        commit_log_models = [
            model for model in activity_related_models
            if isinstance(model, commit_log_model_class)]
        for commit_log_model in commit_log_models:
            commit_log_model.user_id = pseudonymized_id
            commit_log_model.update_timestamps()
        all_models: List[base_models.BaseModel] = []
        for metadata_model in metadata_models:
            all_models.append(metadata_model)
        for commit_log_model in commit_log_models:
            all_models.append(commit_log_model)
        datastore_services.put_multi(all_models)

    activity_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            activity_category.value])
    for activity_id, pseudonymized_id in activity_ids_to_pids.items():
        activity_related_models: List[base_models.BaseModel] = [
            model for model in snapshot_metadata_models
            if model.get_unversioned_instance_id() == activity_id
        ]
        for model in commit_log_models:
            if getattr(model, commit_log_model_field_name) == activity_id:
                activity_related_models.append(model)
        for i in range(
                0,
                len(activity_related_models),
                feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            _pseudonymize_models_transactional(
                activity_related_models[
                    i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_id)


def _pseudonymize_activity_models_with_associated_rights_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest,
    activity_category: models.Names,
    snapshot_metadata_model_class: Type[base_models.BaseSnapshotMetadataModel],
    rights_snapshot_metadata_model_class: Type[
        base_models.BaseSnapshotMetadataModel
    ],
    rights_snapshot_content_model_class: Type[
        base_models.BaseSnapshotContentModel
    ],
    commit_log_model_class: Type[base_models.BaseCommitLogEntryModel],
    commit_log_model_field_name: str,
    allowed_commands: List[feconf.ValidCmdDict],
    rights_user_id_fields: List[str]
) -> None:
    """Pseudonymize the activity models with associated rights models for the
    user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
        activity_category: models.Names. The category of the models that are
            being pseudonymized.
        snapshot_metadata_model_class:
            CollectionSnapshotMetadataModel|ExplorationSnapshotMetadataModel.
            The snapshot metadata model class.
        rights_snapshot_metadata_model_class:
            BaseSnapshotMetadataModel. The rights snapshot metadata model class.
        rights_snapshot_content_model_class:
            BaseSnapshotContentModel. The rights snapshot content model class.
        commit_log_model_class:
            CollectionCommitLogEntryModel|ExplorationCommitLogEntryModel.
            The commit log model class.
        commit_log_model_field_name: str. The name of the field holding the
            activity id in the corresponding commit log model.
        allowed_commands: list(dict). The commands that are allowed for the
            activity commits.
        rights_user_id_fields: list(str). The names of user ID fields of
            the activity rights model.
    """
    user_id = pending_deletion_request.user_id

    snapshot_metadata_models, commit_log_models = (
        _collect_and_save_entity_ids_from_snapshots_and_commits(
            pending_deletion_request,
            activity_category,
            [
                snapshot_metadata_model_class,
                rights_snapshot_metadata_model_class
            ],
            commit_log_model_class,
            commit_log_model_field_name
        )
    )

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        activity_related_models: List[base_models.BaseModel],
        pseudonymized_id: str
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        activity_related_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            activity_related_models: list(BaseModel). Models whose user IDs
                should be pseudonymized.
            pseudonymized_id: str. New pseudonymized user ID to be used for
                the models.
        """
        pseudonymized_username = user_services.get_pseudonymous_username(
            pseudonymized_id)

        snapshot_metadata_models = [
            model for model in activity_related_models
            if isinstance(model, snapshot_metadata_model_class)]
        for snapshot_metadata_model in snapshot_metadata_models:
            if user_id == snapshot_metadata_model.committer_id:
                snapshot_metadata_model.committer_id = pseudonymized_id
            snapshot_metadata_model.update_timestamps()

        rights_snapshot_metadata_models = [
            model for model in activity_related_models
            if isinstance(model, rights_snapshot_metadata_model_class)]
        for rights_snapshot_metadata_model in rights_snapshot_metadata_models:
            for commit_cmd in rights_snapshot_metadata_model.commit_cmds:
                user_id_attribute_names = next(
                    cmd['user_id_attribute_names']
                    for cmd in allowed_commands
                    if cmd['name'] == commit_cmd['cmd']
                )
                for user_id_attribute_name in user_id_attribute_names:
                    if commit_cmd[user_id_attribute_name] == user_id:
                        commit_cmd[user_id_attribute_name] = pseudonymized_id

            assign_commit_message_match = re.match(
                rights_domain.ASSIGN_ROLE_COMMIT_MESSAGE_REGEX,
                rights_snapshot_metadata_model.commit_message)
            if assign_commit_message_match:
                rights_snapshot_metadata_model.commit_message = (
                    rights_domain.ASSIGN_ROLE_COMMIT_MESSAGE_TEMPLATE % (
                        pseudonymized_username,
                        assign_commit_message_match.group(2),
                        assign_commit_message_match.group(3),
                    )
                )
            deassign_commit_message_match = re.match(
                rights_domain.DEASSIGN_ROLE_COMMIT_MESSAGE_REGEX,
                rights_snapshot_metadata_model.commit_message)
            if deassign_commit_message_match:
                rights_snapshot_metadata_model.commit_message = (
                    rights_domain.DEASSIGN_ROLE_COMMIT_MESSAGE_TEMPLATE % (
                        pseudonymized_username,
                        deassign_commit_message_match.group(2),
                    )
                )

            rights_snapshot_metadata_model.content_user_ids = [
                pseudonymized_id if model_user_id == user_id else model_user_id
                for model_user_id in
                rights_snapshot_metadata_model.content_user_ids
            ]
            rights_snapshot_metadata_model.commit_cmds_user_ids = [
                pseudonymized_id if model_user_id == user_id else model_user_id
                for model_user_id in
                rights_snapshot_metadata_model.commit_cmds_user_ids
            ]
            if user_id == rights_snapshot_metadata_model.committer_id:
                rights_snapshot_metadata_model.committer_id = pseudonymized_id
            rights_snapshot_metadata_model.update_timestamps()

        rights_snapshot_content_models = [
            model for model in activity_related_models
            if isinstance(model, rights_snapshot_content_model_class)]
        for rights_snapshot_content_model in rights_snapshot_content_models:
            model_dict = rights_snapshot_content_model.content
            for field_name in rights_user_id_fields:
                model_dict[field_name] = [
                    pseudonymized_id if field_id == user_id else field_id
                    for field_id in model_dict[field_name]
                ]
            rights_snapshot_content_model.content = model_dict
            rights_snapshot_content_model.update_timestamps()

        commit_log_models = [
            model for model in activity_related_models
            if isinstance(model, commit_log_model_class)]
        for commit_log_model in commit_log_models:
            commit_log_model.user_id = pseudonymized_id
            commit_log_model.update_timestamps()
        all_models: List[base_models.BaseModel] = []
        for snapshot_metadata_model in (
            snapshot_metadata_models +
            rights_snapshot_metadata_models
        ):
            all_models.append(snapshot_metadata_model)
        for snapshot_content_model in rights_snapshot_content_models:
            all_models.append(snapshot_content_model)
        for commit_log_model in commit_log_models:
            all_models.append(commit_log_model)
        datastore_services.put_multi(all_models)

    activity_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            activity_category.value])
    for activity_id, pseudonymized_id in activity_ids_to_pids.items():
        activity_related_snapshot_metadata_models = [
            model for model in snapshot_metadata_models
            if model.get_unversioned_instance_id() == activity_id
        ]

        activity_related_rights_snapshots_ids = [
            model.id for model in activity_related_snapshot_metadata_models
            if isinstance(model, rights_snapshot_metadata_model_class)]
        activity_related_snapshot_content_models = (
            rights_snapshot_content_model_class.get_multi(
                activity_related_rights_snapshots_ids, include_deleted=True
            )
        )

        activity_related_models: List[base_models.BaseModel] = [
            model for model in commit_log_models
            if getattr(model, commit_log_model_field_name) == activity_id
        ]
        for snapshot_content_model in activity_related_snapshot_content_models:
            # Here, we assert that snapshot_content_model is never going to
            # be a None value, because above we are fetching snapshot_models
            # only for those ids that belong to already existing models.
            assert snapshot_content_model is not None
            activity_related_models.append(snapshot_content_model)
        for metadata_model in activity_related_snapshot_metadata_models:
            activity_related_models.append(metadata_model)

        for i in range(
                0,
                len(activity_related_models),
                feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            _pseudonymize_models_transactional(
                activity_related_models[
                    i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_id
            )


def _remove_user_id_from_contributors_in_summary_models(
    user_id: str,
    summary_model_class: Union[
        Type[collection_models.CollectionSummaryModel],
        Type[exp_models.ExpSummaryModel]
    ]
) -> None:
    """Remove the user ID from contributor_ids and contributor_summary
    fields in relevant summary models.

    Args:
        user_id: str. The user ID that should be removed.
        summary_model_class: CollectionSummaryModel|ExpSummaryModel. Class of
            the summary model from which should the user ID be removed.
    """
    related_summary_models: Sequence[
        Union[
            collection_models.CollectionSummaryModel,
            exp_models.ExpSummaryModel
        ]
    ] = summary_model_class.query(
        summary_model_class.contributor_ids == user_id
    ).fetch()

    @transaction_services.run_in_transaction_wrapper
    def _remove_user_id_from_models_transactional(
        summary_models: List[base_models.BaseModel]
    ) -> None:
        """Remove the user ID from contributor_ids and contributor_summary
        fields.

        This function is run in a transaction, with the maximum number of
        summary_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            summary_models: list(BaseModel). Models from which should
                the user ID be removed.
        """
        for summary_model in related_summary_models:
            summary_model.contributor_ids = [
                contributor_id for contributor_id in
                summary_model.contributor_ids if contributor_id != user_id
            ]
            if user_id in summary_model.contributors_summary:
                del summary_model.contributors_summary[user_id]

        summary_model_class.update_timestamps_multi(summary_models)
        datastore_services.put_multi(summary_models)

    for i in range(
            0,
            len(related_summary_models),
            feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
        _remove_user_id_from_models_transactional(
            related_summary_models[
                i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION])


def _pseudonymize_app_feedback_report_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> None:
    """Pseudonymize the app feedback report models for the user with user_id,
    if they scrubbed a feedback report. If the user scrubs multiple reports,
    they will be given the same pseudonym for each model entity.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    model_class = app_feedback_report_models.AppFeedbackReportModel
    user_id = pending_deletion_request.user_id

    feedback_report_models: Sequence[
        app_feedback_report_models.AppFeedbackReportModel
    ] = model_class.query(
        model_class.scrubbed_by == user_id).fetch()
    report_ids = set(model.id for model in feedback_report_models)

    # Fill in any missing keys in the category's
    # pseudonymizable_entity_mappings, using the same pseudonym for each entity
    # so that a user will have the same pseudonymized ID for each entity
    # referencing them.
    entity_category = models.Names.APP_FEEDBACK_REPORT
    _save_pseudonymizable_entity_mappings_to_same_pseudonym(
        pending_deletion_request, entity_category, list(report_ids))

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        feedback_report_models: List[
            app_feedback_report_models.AppFeedbackReportModel
        ]
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        feedback_report_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            feedback_report_models: list(FeedbackReportModel). The models with a
                user ID in the 'scrubbed_by' field that we want to pseudonymize.
        """
        for report_model in feedback_report_models:
            report_model.scrubbed_by = (
                report_ids_to_pids[report_model.id])
        model_class.update_timestamps_multi(feedback_report_models)
        model_class.put_multi(feedback_report_models)

    report_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.Names.APP_FEEDBACK_REPORT.value])

    for i in range(
            0, len(feedback_report_models),
            feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
        _pseudonymize_models_transactional(
            feedback_report_models[
                i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION])


def _pseudonymize_feedback_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> None:
    """Pseudonymize the feedback models for the user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id

    # We want to preserve the same pseudonymous user ID on all the models
    # related to one feedback thread. So we collect all the users' feedback
    # thread models, feedback thread message models, and suggestion models; then
    # for each collection (e.g. a suggestion thread with a few messages) of
    # these models we generate a pseudonymous user ID and replace the user ID
    # with that pseudonymous user ID in all the models.
    feedback_thread_model_class = feedback_models.GeneralFeedbackThreadModel
    feedback_thread_models: Sequence[
        feedback_models.GeneralFeedbackThreadModel
    ] = feedback_thread_model_class.query(
        datastore_services.any_of(
            feedback_thread_model_class.original_author_id == user_id,
            feedback_thread_model_class.last_nonempty_message_author_id == (
                user_id)
        )).fetch()
    feedback_ids = set(model.id for model in feedback_thread_models)

    feedback_message_model_class = feedback_models.GeneralFeedbackMessageModel
    feedback_message_models: Sequence[
        feedback_models.GeneralFeedbackMessageModel
    ] = feedback_message_model_class.query(
        feedback_message_model_class.author_id == user_id
    ).fetch()
    feedback_ids |= set(model.thread_id for model in feedback_message_models)

    suggestion_model_class = suggestion_models.GeneralSuggestionModel
    general_suggestion_models: Sequence[
        suggestion_models.GeneralSuggestionModel
    ] = suggestion_model_class.query(
        datastore_services.any_of(
            suggestion_model_class.author_id == user_id,
            suggestion_model_class.final_reviewer_id == user_id
        )).fetch()
    feedback_ids |= set(model.id for model in general_suggestion_models)

    _save_pseudonymizable_entity_mappings_to_different_pseudonyms(
        pending_deletion_request, models.Names.FEEDBACK, list(feedback_ids))

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        feedback_related_models: List[base_models.BaseModel],
        pseudonymized_id: str
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        feedback_related_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            feedback_related_models: list(BaseModel). Models whose user IDs
                should be pseudonymized.
            pseudonymized_id: str. New pseudonymized user ID to be used for
                the models.
        """
        feedback_thread_models = [
            model for model in feedback_related_models
            if isinstance(model, feedback_thread_model_class)]
        for feedback_thread_model in feedback_thread_models:
            if feedback_thread_model.original_author_id == user_id:
                feedback_thread_model.original_author_id = pseudonymized_id
            if feedback_thread_model.last_nonempty_message_author_id == user_id:
                feedback_thread_model.last_nonempty_message_author_id = (
                    pseudonymized_id)
            feedback_thread_model.update_timestamps()

        feedback_message_models = [
            model for model in feedback_related_models
            if isinstance(model, feedback_message_model_class)]
        for feedback_message_model in feedback_message_models:
            feedback_message_model.author_id = pseudonymized_id
            feedback_message_model.update_timestamps()

        general_suggestion_models = [
            model for model in feedback_related_models
            if isinstance(model, suggestion_model_class)]
        for general_suggestion_model in general_suggestion_models:
            if general_suggestion_model.author_id == user_id:
                general_suggestion_model.author_id = pseudonymized_id
            if general_suggestion_model.final_reviewer_id == user_id:
                general_suggestion_model.final_reviewer_id = pseudonymized_id
            general_suggestion_model.update_timestamps()
        all_models: List[base_models.BaseModel] = []
        for feedback_thread_model in feedback_thread_models:
            all_models.append(feedback_thread_model)
        for feedback_message_model in feedback_message_models:
            all_models.append(feedback_message_model)
        for general_suggestion_model in general_suggestion_models:
            all_models.append(general_suggestion_model)
        datastore_services.put_multi(all_models)

    feedback_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.Names.FEEDBACK.value])
    for feedback_id, pseudonymized_id in feedback_ids_to_pids.items():
        feedback_related_models: List[base_models.BaseModel] = [
            model for model in feedback_thread_models
            if model.id == feedback_id
        ]
        for feedback_model in feedback_message_models:
            if feedback_model.thread_id == feedback_id:
                feedback_related_models.append(feedback_model)
        for suggestion_model in general_suggestion_models:
            if suggestion_model.id == feedback_id:
                feedback_related_models.append(suggestion_model)
        for i in range(
                0,
                len(feedback_related_models),
                feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            _pseudonymize_models_transactional(
                feedback_related_models[
                    i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_id)


def _pseudonymize_suggestion_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> None:
    """Pseudonymize the suggestion models for the user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id

    voiceover_application_class = (
        suggestion_models.GeneralVoiceoverApplicationModel)

    voiceover_application_models: Sequence[
        suggestion_models.GeneralVoiceoverApplicationModel
    ] = voiceover_application_class.query(
        datastore_services.any_of(
            voiceover_application_class.author_id == user_id,
            voiceover_application_class.final_reviewer_id == user_id
        )).fetch()
    suggestion_ids = set(model.id for model in voiceover_application_models)

    _save_pseudonymizable_entity_mappings_to_different_pseudonyms(
        pending_deletion_request, models.Names.SUGGESTION, list(suggestion_ids))

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        voiceover_application_models: List[
            suggestion_models.GeneralVoiceoverApplicationModel
        ]
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        voiceover_application_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            voiceover_application_models:
                list(GeneralVoiceoverApplicationModel). Models whose user IDs
                should be pseudonymized.
        """
        for voiceover_application_model in voiceover_application_models:
            if voiceover_application_model.author_id == user_id:
                voiceover_application_model.author_id = (
                    suggestion_ids_to_pids[voiceover_application_model.id]
                )
            if voiceover_application_model.final_reviewer_id == user_id:
                voiceover_application_model.final_reviewer_id = (
                    suggestion_ids_to_pids[voiceover_application_model.id]
                )
        voiceover_application_class.update_timestamps_multi(
            voiceover_application_models)
        voiceover_application_class.put_multi(voiceover_application_models)

    suggestion_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.Names.SUGGESTION.value])
    for i in range(
            0,
            len(voiceover_application_models),
            feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
        _pseudonymize_models_transactional(
            voiceover_application_models[
                i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION]
        )


def _pseudonymize_blog_post_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> None:
    """Pseudonymizes the blog post models for the user with user_id.
       Also removes the user-id from the list of editor ids from the
       blog post rights model.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending
            deletion request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id

    # We want to preserve the same pseudonymous user ID on all the models
    # related to one blog post. So we collect all the users' blog
    # post models and blog post summary models then
    # we generate a pseudonymous user ID and replace the user ID
    # with that pseudonymous user ID in all the models.
    blog_post_model_class = blog_models.BlogPostModel
    blog_post_models_list: Sequence[
        blog_models.BlogPostModel
    ] = blog_post_model_class.query(
        blog_post_model_class.author_id == user_id
    ).fetch()
    blog_post_ids = {model.id for model in blog_post_models_list}

    blog_post_summary_model_class = blog_models.BlogPostSummaryModel
    blog_post_summary_models: Sequence[
        blog_models.BlogPostSummaryModel
    ] = blog_post_summary_model_class.query(
        blog_post_summary_model_class.author_id == user_id
    ).fetch()
    blog_post_ids |= {model.id for model in blog_post_summary_models}

    _save_pseudonymizable_entity_mappings_to_different_pseudonyms(
        pending_deletion_request, models.Names.BLOG, list(blog_post_ids))

    # We want to remove the user ID from the list of editor ids on all the
    # blog post rights models related to the user.
    blog_models.BlogPostRightsModel.deassign_user_from_all_blog_posts(user_id)

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        blog_posts_related_models: List[base_models.BaseModel],
        pseudonymized_id: str
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        blog_posts_related_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            blog_posts_related_models: list(BaseModel). Models whose user IDs
                should be pseudonymized.
            pseudonymized_id: str. New pseudonymized user ID to be used for
                the models.
        """
        blog_post_models_list: List[
            Union[
                blog_models.BlogPostModel,
                blog_models.BlogPostSummaryModel
            ]
        ] = [
            model for model in blog_posts_related_models
            if isinstance(model, blog_post_model_class)]
        for blog_post_model in blog_post_models_list:
            if blog_post_model.author_id == user_id:
                blog_post_model.author_id = pseudonymized_id
            blog_post_model.update_timestamps()

        blog_post_summary_models_list: List[
            Union[
                blog_models.BlogPostModel,
                blog_models.BlogPostSummaryModel
            ]
        ] = [
            model for model in blog_posts_related_models
            if isinstance(model, blog_post_summary_model_class)]
        for blog_post_summary in blog_post_summary_models_list:
            if blog_post_summary.author_id == user_id:
                blog_post_summary.author_id = pseudonymized_id
            blog_post_summary.update_timestamps()
        datastore_services.put_multi(
            blog_post_models_list + blog_post_summary_models_list)

    blog_post_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.Names.BLOG.value])
    for blog_post_id, pseudonymized_id in blog_post_ids_to_pids.items():
        blog_posts_related_models = [
            model for model in itertools.chain(
                blog_post_models_list, blog_post_summary_models)
            if model.id == blog_post_id
        ]
        transaction_slices = utils.grouper(
            blog_posts_related_models,
            feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION)
        for transaction_slice in transaction_slices:
            _pseudonymize_models_transactional(
                [m for m in transaction_slice if m is not None],
                pseudonymized_id)


def _pseudonymize_version_history_models(
    pending_deletion_request: wipeout_domain.PendingDeletionRequest
) -> None:
    """Pseudonymizes the version history models for the user with the given
    user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending
            deletion request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id

    version_history_model_class = exp_models.ExplorationVersionHistoryModel
    version_history_models: Sequence[
        exp_models.ExplorationVersionHistoryModel
    ] = version_history_model_class.query(
        user_id == version_history_model_class.committer_ids
    ).fetch()

    @transaction_services.run_in_transaction_wrapper
    def _pseudonymize_models_transactional(
        version_history_models: List[exp_models.ExplorationVersionHistoryModel],
        exp_ids_to_pids: Dict[str, str]
    ) -> None:
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        version_history_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            version_history_models: list(ExplorationVersionHistoryModel). Models
                whose user IDs should be pseudonymized.
            exp_ids_to_pids: dict(str, str). A mapping of exploration ids to
                pseudonymous ids.
        """
        for model in version_history_models:
            # Pseudonymize user id from state_version_history.
            for state_name in model.state_version_history:
                state_version_history = (
                    model.state_version_history[state_name])
                if state_version_history['committer_id'] == user_id:
                    state_version_history['committer_id'] = (
                        exp_ids_to_pids[model.exploration_id])

            # Pseudonymize user id from metadata_last_edited_committer_id.
            if model.metadata_last_edited_committer_id == user_id:
                model.metadata_last_edited_committer_id = (
                    exp_ids_to_pids[model.exploration_id])

            # Pseudonymize user id from committer_ids.
            for idx, committer_id in enumerate(model.committer_ids):
                if committer_id == user_id:
                    model.committer_ids[idx] = (
                        exp_ids_to_pids[model.exploration_id])

        version_history_model_class.update_timestamps_multi(
            version_history_models)
        version_history_model_class.put_multi(version_history_models)

    exp_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.Names.EXPLORATION.value])

    for i in range(
            0,
            len(version_history_models),
            feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION
    ):
        _pseudonymize_models_transactional(
            version_history_models[
                i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION],
            exp_ids_to_pids)
