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

import logging

from core.domain import collection_services
from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import role_services
from core.domain import topic_services
from core.domain import user_services
from core.domain import wipeout_domain
from core.platform import models
import feconf
import python_utils

(
    base_models, collection_models, exp_models,
    feedback_models, improvements_models, question_models,
    skill_models, story_models, suggestion_models,
    topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.exploration,
    models.NAMES.feedback, models.NAMES.improvements, models.NAMES.question,
    models.NAMES.skill, models.NAMES.story, models.NAMES.suggestion,
    models.NAMES.topic, models.NAMES.user
])
current_user_services = models.Registry.import_current_user_services()
datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

MAX_NUMBER_OF_OPS_IN_TRANSACTION = 25


def get_pending_deletion_request(user_id):
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
        pending_deletion_request_model.role,
        pending_deletion_request_model.deletion_complete,
        pending_deletion_request_model.exploration_ids,
        pending_deletion_request_model.collection_ids,
        pending_deletion_request_model.pseudonymizable_entity_mappings
    )


def get_number_of_pending_deletion_requests():
    """Get number of pending deletion request.

    Returns:
        int. The number of pending deletion requests.
    """
    return user_models.PendingDeletionRequestModel.query().count()


def save_pending_deletion_requests(pending_deletion_requests):
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
    for deletion_request_model, deletion_request in python_utils.ZIP(
            pending_deletion_request_models, pending_deletion_requests):
        deletion_request.validate()
        deletion_request_dict = {
            'email': deletion_request.email,
            'role': deletion_request.role,
            'deletion_complete': deletion_request.deletion_complete,
            'exploration_ids': deletion_request.exploration_ids,
            'collection_ids': deletion_request.collection_ids,
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

    user_models.PendingDeletionRequestModel.put_multi(
        final_pending_deletion_request_models)


def delete_pending_deletion_request(user_id):
    """Delete PendingDeletionRequestModel entity in the datastore.

    Args:
        user_id: str. The unique ID of the user that
            the PendingDeletionRequestModel belongs to.
    """
    pending_deletion_request_model = (
        user_models.PendingDeletionRequestModel.get_by_id(user_id))
    pending_deletion_request_model.delete()


def pre_delete_user(user_id):
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
    """
    pending_deletion_requests = []
    user_settings = user_services.get_user_settings(
        user_id, strict=True)

    linked_profile_user_ids = [
        user.user_id for user in
        user_services.get_all_profiles_auth_details_by_parent_user_id(user_id)
    ]
    profile_users_settings_list = user_services.get_users_settings(
        linked_profile_user_ids)
    for profile_user_settings in profile_users_settings_list:
        profile_id = profile_user_settings.user_id
        user_services.mark_user_for_deletion(profile_id)
        pending_deletion_requests.append(
            wipeout_domain.PendingDeletionRequest.create_default(
                profile_id,
                profile_user_settings.email,
                profile_user_settings.role,
                [],
                []
            )
        )
    explorations_to_be_deleted_ids = []
    collections_to_be_deleted_ids = []
    if user_settings.role != feconf.ROLE_ID_LEARNER:
        subscribed_exploration_summaries = (
            exp_fetchers.get_exploration_summaries_subscribed_to(user_id))

        explorations_to_be_deleted_ids = [
            exp_summary.id for exp_summary in subscribed_exploration_summaries
            if exp_summary.is_private() and
            exp_summary.is_solely_owned_by_user(user_id)
        ]
        exp_services.delete_explorations(
            user_id, explorations_to_be_deleted_ids)

        # Release ownership of explorations that are public and are solely owned
        # by the to-be-deleted user.
        explorations_to_release_ownership_ids = [
            exp_summary.id for exp_summary in subscribed_exploration_summaries
            if not exp_summary.is_private() and
            exp_summary.is_solely_owned_by_user(user_id)
        ]
        for exp_id in explorations_to_release_ownership_ids:
            rights_manager.release_ownership_of_exploration(
                user_services.get_system_user(), exp_id)

        explorations_to_remove_user_from_ids = [
            exp_summary.id for exp_summary in subscribed_exploration_summaries
            if not exp_summary.is_solely_owned_by_user(user_id)
        ]
        for exp_id in explorations_to_remove_user_from_ids:
            rights_manager.deassign_role_for_exploration(
                user_services.get_system_user(), exp_id, user_id)

        subscribed_collection_summaries = (
            collection_services.get_collection_summaries_subscribed_to(user_id))
        collections_to_be_deleted_ids = [
            col_summary.id for col_summary in subscribed_collection_summaries
            if col_summary.is_private() and
            col_summary.is_solely_owned_by_user(user_id)
        ]
        collection_services.delete_collections(
            user_id, collections_to_be_deleted_ids)

        # Release ownership of collections that are public and are solely owned
        # by the to-be-deleted user.
        collections_to_release_ownership_ids = [
            col_summary.id for col_summary in subscribed_collection_summaries
            if not col_summary.is_private() and
            col_summary.is_solely_owned_by_user(user_id)
        ]
        for col_id in collections_to_release_ownership_ids:
            rights_manager.release_ownership_of_collection(
                user_services.get_system_user(), col_id)

        collections_to_remove_user_from_ids = [
            col_summary.id for col_summary in subscribed_collection_summaries
            if not col_summary.is_solely_owned_by_user(user_id)
        ]
        for col_id in collections_to_remove_user_from_ids:
            rights_manager.deassign_role_for_collection(
                user_services.get_system_user(), col_id, user_id)

        topic_services.deassign_user_from_all_topics(
            user_services.get_system_user(), user_id)

        # Set all the user's email preferences to False in order to disable all
        # ordinary emails that could be sent to the users.
        user_services.update_email_preferences(
            user_id, False, False, False, False)

    user_services.mark_user_for_deletion(user_id)
    pending_deletion_requests.append(
        wipeout_domain.PendingDeletionRequest.create_default(
            user_id,
            user_settings.email,
            user_settings.role,
            explorations_to_be_deleted_ids,
            collections_to_be_deleted_ids
        )
    )

    save_pending_deletion_requests(pending_deletion_requests)


def run_user_deletion(pending_deletion_request):
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


def run_user_deletion_completion(pending_deletion_request):
    """Run the user deletion verification.

    Args:
        pending_deletion_request: PendingDeletionRequest. The domain object for
            the user being verified.

    Returns:
        str. The outcome of the verification.
    """

    if not pending_deletion_request.deletion_complete:
        return wipeout_domain.USER_VERIFICATION_NOT_DELETED
    elif verify_user_deleted(pending_deletion_request):
        delete_pending_deletion_request(pending_deletion_request.user_id)
        email_manager.send_account_deleted_email(
            pending_deletion_request.user_id, pending_deletion_request.email)
        return wipeout_domain.USER_VERIFICATION_SUCCESS
    else:
        pending_deletion_request.deletion_complete = False
        save_pending_deletion_requests([pending_deletion_request])
        return wipeout_domain.USER_VERIFICATION_FAILURE


def delete_user(pending_deletion_request):
    """Delete all the models for user specified in pending_deletion_request
    on the basis of the user role specified in the request.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to delete or pseudonymize all the models.
    """
    user_id = pending_deletion_request.user_id
    user_role = pending_deletion_request.role
    _delete_models(user_id, user_role, models.NAMES.user)
    _delete_models(user_id, user_role, models.NAMES.feedback)
    _delete_models(user_id, user_role, models.NAMES.improvements)
    if user_role != feconf.ROLE_ID_LEARNER:
        _hard_delete_explorations_and_collections(pending_deletion_request)
        _pseudonymize_feedback_models(pending_deletion_request)
        _pseudonymize_suggestion_models(pending_deletion_request)
        _pseudonymize_activity_models_without_associated_rights_models(
            pending_deletion_request,
            models.NAMES.question,
            question_models.QuestionSnapshotMetadataModel,
            question_models.QuestionCommitLogEntryModel,
            'question_id')
        _pseudonymize_activity_models_without_associated_rights_models(
            pending_deletion_request,
            models.NAMES.skill,
            skill_models.SkillSnapshotMetadataModel,
            skill_models.SkillCommitLogEntryModel,
            'skill_id')
        _pseudonymize_activity_models_without_associated_rights_models(
            pending_deletion_request,
            models.NAMES.story,
            story_models.StorySnapshotMetadataModel,
            story_models.StoryCommitLogEntryModel,
            'story_id')
        _pseudonymize_activity_models_with_associated_rights_models(
            pending_deletion_request,
            models.NAMES.exploration,
            exp_models.ExplorationSnapshotMetadataModel,
            exp_models.ExplorationRightsSnapshotMetadataModel,
            exp_models.ExplorationRightsSnapshotContentModel,
            exp_models.ExplorationCommitLogEntryModel,
            'exploration_id')
        _pseudonymize_activity_models_with_associated_rights_models(
            pending_deletion_request,
            models.NAMES.collection,
            collection_models.CollectionSnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotContentModel,
            collection_models.CollectionCommitLogEntryModel,
            'collection_id')


def verify_user_deleted(pending_deletion_request):
    """Verify that all the models for user specified in pending_deletion_request
    are deleted.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.

    Returns:
        bool. True if all the models were correctly deleted, False otherwise.
    """
    for model_class in models.Registry.get_storage_model_classes([
            models.NAMES.collection,
            models.NAMES.exploration,
            models.NAMES.feedback,
            models.NAMES.improvements,
            models.NAMES.question,
            models.NAMES.skill,
            models.NAMES.story,
            models.NAMES.suggestion,
            models.NAMES.user
    ]):
        if (model_class.get_deletion_policy() not in
                [base_models.DELETION_POLICY.KEEP,
                 base_models.DELETION_POLICY.NOT_APPLICABLE] and
                model_class.has_reference_to_user_id(
                    pending_deletion_request.user_id)):
            return False
    return True


def _hard_delete_explorations_and_collections(pending_deletion_request):
    """Hard delete the exploration and collection models that are private and
    solely owned by the user.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to delete the explorations and collections.
    """
    exp_services.delete_explorations(
        pending_deletion_request.user_id,
        pending_deletion_request.exploration_ids,
        force_deletion=True)
    pending_deletion_request.exploration_ids = []
    save_pending_deletion_requests([pending_deletion_request])
    collection_services.delete_collections(
        pending_deletion_request.user_id,
        pending_deletion_request.collection_ids,
        force_deletion=True)
    pending_deletion_request.collection_ids = []
    save_pending_deletion_requests([pending_deletion_request])


def _generate_entity_to_pseudonymized_ids_mapping(entity_ids):
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


def _save_pseudonymizable_entity_mappings(
        pending_deletion_request, entity_category, entity_ids):
    """Save the entity mappings for some entity category into the pending
    deletion request.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to which to save the entity mappings.
        entity_category: models.NAMES. The category of the models that
            contain the entity IDs.
        entity_ids: list(str). The IDs for which to generate the mappings.
    """
    # The pseudonymizable_entity_mappings field might have only been partially
    # generated, so we fill in the missing part for this entity category.
    if (
            entity_category not in
            pending_deletion_request.pseudonymizable_entity_mappings):
        pending_deletion_request.pseudonymizable_entity_mappings[
            entity_category] = (
                _generate_entity_to_pseudonymized_ids_mapping(entity_ids))
        save_pending_deletion_requests([pending_deletion_request])


def _delete_models(user_id, user_role, module_name):
    """Delete all the models from the given module, for a given user.

    Args:
        user_id: str. The id of the user to be deleted.
        user_role: str. The role of the user to be deleted.
        module_name: models.NAMES. The name of the module containing the models
            that are being deleted.
    """
    for model_class in models.Registry.get_storage_model_classes([module_name]):
        deletion_policy = model_class.get_deletion_policy()
        lowest_role_for_class = model_class.get_lowest_supported_role()
        if (
                user_role != lowest_role_for_class and
                role_services.check_if_path_exists_in_roles_graph(
                    lowest_role_for_class, user_role) is False
        ):
            continue

        if deletion_policy == base_models.DELETION_POLICY.DELETE:
            model_class.apply_deletion_policy(user_id)


def _collect_activity_ids_from_snapshots_and_commit(
        pending_deletion_request,
        activity_category,
        snapshot_metadata_model_classes,
        commit_log_model_class,
        commit_log_model_field_name):
    """Collect the activity IDs that for the user with user_id. Verify that each
    snapshot has corresponding commit log.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to collect the activity IDs.
        activity_category: models.NAMES. The category of the models that are
            that contain the activity IDs.
        snapshot_metadata_model_classes: list(class). The snapshot metadata
            model classes that contain the activity IDs.
        commit_log_model_class: class. The metadata model classes that
            contains the activity IDs.
        commit_log_model_field_name: str. The name of the field holding the
            activity ID in the corresponding commit log model.

    Returns:
        (list(BaseSnapshotMetadataModel), list(BaseCommitLogEntryModel)).
        The tuple of snapshot metadata and commit log models.
    """
    user_id = pending_deletion_request.user_id
    snapshot_metadata_models = []
    for snapshot_model_class in snapshot_metadata_model_classes:
        snapshot_metadata_models.extend(snapshot_model_class.query(
            datastore_services.any_of(
                snapshot_model_class.committer_id == user_id,
                snapshot_model_class.commit_cmds_user_ids == user_id,
                snapshot_model_class.content_user_ids == user_id,
            )).fetch())
    snapshot_metadata_ids = set(
        model.get_unversioned_instance_id()
        for model in snapshot_metadata_models
    )

    commit_log_models = commit_log_model_class.query(
        commit_log_model_class.user_id == user_id
    ).fetch()
    commit_log_ids = set(
        getattr(model, commit_log_model_field_name)
        for model in commit_log_models
    )
    if snapshot_metadata_ids != commit_log_ids:
        logging.error(
            'The commit log and snapshot %s IDs differ. '
            'Snapshots without commit logs: %s, '
            'Commit logs without snapshots: %s.',
            activity_category,
            list(snapshot_metadata_ids - commit_log_ids),
            list(commit_log_ids - snapshot_metadata_ids))

    _save_pseudonymizable_entity_mappings(
        pending_deletion_request,
        activity_category,
        snapshot_metadata_ids | commit_log_ids)

    return (snapshot_metadata_models, commit_log_models)


def _pseudonymize_activity_models_without_associated_rights_models(
        pending_deletion_request,
        activity_category,
        snapshot_model_class,
        commit_log_model_class,
        commit_log_model_field_name):
    """Pseudonymize the activity models for the user with user_id.

    Activity models are models that have a main VersionedModel,
    CommitLogEntryModel, and other additional models that mostly use the same ID
    as the main model (e.g. collection, exploration, question, skill, story,
    topic). Activity models with associated rights models, e.g. models in
    collections, explorations, and topics, should not be handled by this method
    but with _pseudonymize_activity_models_with_associated_rights_models.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to pseudonymize the models.
        activity_category: models.NAMES. The category of the models that are
            being pseudonymized.
        snapshot_model_class: class. The metadata model class that is being
            pseudonymized.
        commit_log_model_class: class. The commit log model class that is being
            pseudonymized.
        commit_log_model_field_name: str. The name of the field holding the
            activity id in the corresponding commit log model.
    """
    snapshot_metadata_models, commit_log_models = (
        _collect_activity_ids_from_snapshots_and_commit(
            pending_deletion_request,
            activity_category,
            [snapshot_model_class],
            commit_log_model_class,
            commit_log_model_field_name
        )
    )

    def _pseudonymize_models(activity_related_models, pseudonymized_id):
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

        commit_log_models = [
            model for model in activity_related_models
            if isinstance(model, commit_log_model_class)]
        for commit_log_model in commit_log_models:
            commit_log_model.user_id = pseudonymized_id
        datastore_services.put_multi(metadata_models + commit_log_models)

    activity_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            activity_category])
    for activity_id, pseudonymized_id in activity_ids_to_pids.items():
        activity_related_models = [
            model for model in snapshot_metadata_models
            if model.get_unversioned_instance_id() == activity_id
        ] + [
            model for model in commit_log_models
            if getattr(model, commit_log_model_field_name) == activity_id
        ]
        for i in python_utils.RANGE(
                0,
                len(activity_related_models),
                MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            transaction_services.run_in_transaction(
                _pseudonymize_models,
                activity_related_models[i:i + MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_id)


def _pseudonymize_activity_models_with_associated_rights_models(
        pending_deletion_request,
        activity_category,
        snapshot_metadata_model_class,
        rights_snapshot_metadata_model_class,
        rights_snapshot_content_model_class,
        commit_log_model_class,
        commit_log_model_field_name):
    """Pseudonymize the activity models with associated rights models for the
    user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
        activity_category: models.NAMES. The category of the models that are
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
    """
    user_id = pending_deletion_request.user_id

    snapshot_metadata_models, commit_log_models = (
        _collect_activity_ids_from_snapshots_and_commit(
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

    def _pseudonymize_models(col_related_models, pseudonymized_id):
        """Pseudonymize user ID fields in the models.

        This function is run in a transaction, with the maximum number of
        activity_related_models being MAX_NUMBER_OF_OPS_IN_TRANSACTION.

        Args:
            col_related_models: list(BaseModel). Models whose user IDs should be
                pseudonymized.
            pseudonymized_id: str. New pseudonymized user ID to be used for
                the models.
        """
        snapshot_metadata_models = [
            model for model in col_related_models
            if isinstance(
                model,
                (
                    snapshot_metadata_model_class,
                    rights_snapshot_metadata_model_class
                )
            )
        ]
        allowed_commands = (
            feconf.COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS
            if activity_category == models.NAMES.collection else
            feconf.EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS
        )
        for snapshot_metadata_model in snapshot_metadata_models:
            for commit_cmd in snapshot_metadata_model.commit_cmds:
                user_id_attribute_names = python_utils.NEXT(
                    cmd['user_id_attribute_names']
                    for cmd in allowed_commands
                    if cmd['name'] == commit_cmd['cmd']
                )
                for user_id_attribute_name in user_id_attribute_names:
                    if commit_cmd[user_id_attribute_name] == user_id:
                        commit_cmd[user_id_attribute_name] = pseudonymized_id
            snapshot_metadata_model.content_user_ids = [
                pseudonymized_id if model_user_id == user_id else model_user_id
                for model_user_id in snapshot_metadata_model.content_user_ids
            ]
            snapshot_metadata_model.commit_cmds_user_ids = [
                pseudonymized_id if model_user_id == user_id else model_user_id
                for model_user_id in
                snapshot_metadata_model.commit_cmds_user_ids
            ]
            if user_id == snapshot_metadata_model.committer_id:
                snapshot_metadata_model.committer_id = pseudonymized_id

        rights_snapshot_content_models = [
            model for model in col_related_models
            if isinstance(model, rights_snapshot_content_model_class)]
        for rights_snapshot_content_model in rights_snapshot_content_models:
            model_dict = rights_snapshot_content_model.content
            for field_name in (
                    'owner_ids', 'editor_ids', 'voice_artist_ids', 'viewer_ids'
            ):
                model_dict[field_name] = [
                    pseudonymized_id if field_id == user_id else field_id
                    for field_id in model_dict[field_name]
                ]
            rights_snapshot_content_model.content = model_dict

        commit_log_models = [
            model for model in col_related_models
            if isinstance(model, commit_log_model_class)]
        for commit_log_model in commit_log_models:
            commit_log_model.user_id = pseudonymized_id

        datastore_services.put_multi(
            snapshot_metadata_models +
            rights_snapshot_content_models +
            commit_log_models)

    col_or_exp_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            activity_category])
    for col_or_exp_id, pseudonymized_id in col_or_exp_ids_to_pids.items():
        col_or_exp_related_snapshot_metadata_models = [
            model for model in snapshot_metadata_models
            if model.get_unversioned_instance_id() == col_or_exp_id
        ]

        col_or_exp_related_rights_snapshots_ids = [
            model.id for model in col_or_exp_related_snapshot_metadata_models
            if isinstance(model, rights_snapshot_metadata_model_class)]
        col_or_exp_related_snapshot_content_models = (
            rights_snapshot_content_model_class.get_multi(
                col_or_exp_related_rights_snapshots_ids, include_deleted=True
            )
        )

        col_or_exp_related_models = (
            col_or_exp_related_snapshot_metadata_models +
            col_or_exp_related_snapshot_content_models +
            [
                model for model in commit_log_models
                if getattr(model, commit_log_model_field_name) == col_or_exp_id
            ]
        )

        for i in python_utils.RANGE(
                0,
                len(col_or_exp_related_models),
                MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            transaction_services.run_in_transaction(
                _pseudonymize_models,
                col_or_exp_related_models[
                    i:i + MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_id
            )


def _pseudonymize_feedback_models(pending_deletion_request):
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
    feedback_thread_models = feedback_thread_model_class.query(
        datastore_services.any_of(
            feedback_thread_model_class.original_author_id == user_id,
            feedback_thread_model_class.last_nonempty_message_author_id == (
                user_id)
        )).fetch()
    feedback_ids = set([model.id for model in feedback_thread_models])

    feedback_message_model_class = feedback_models.GeneralFeedbackMessageModel
    feedback_message_models = feedback_message_model_class.query(
        feedback_message_model_class.author_id == user_id
    ).fetch()
    feedback_ids |= set([model.thread_id for model in feedback_message_models])

    suggestion_model_class = suggestion_models.GeneralSuggestionModel
    general_suggestion_models = suggestion_model_class.query(
        datastore_services.any_of(
            suggestion_model_class.author_id == user_id,
            suggestion_model_class.final_reviewer_id == user_id
        )).fetch()
    feedback_ids |= set([model.id for model in general_suggestion_models])

    _save_pseudonymizable_entity_mappings(
        pending_deletion_request, models.NAMES.feedback, feedback_ids)

    def _pseudonymize_models(feedback_related_models, pseudonymized_id):
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

        feedback_message_models = [
            model for model in feedback_related_models
            if isinstance(model, feedback_message_model_class)]
        for feedback_message_model in feedback_message_models:
            feedback_message_model.author_id = pseudonymized_id

        general_suggestion_models = [
            model for model in feedback_related_models
            if isinstance(model, suggestion_model_class)]
        for general_suggestion_model in general_suggestion_models:
            if general_suggestion_model.author_id == user_id:
                general_suggestion_model.author_id = pseudonymized_id
            if general_suggestion_model.final_reviewer_id == user_id:
                general_suggestion_model.final_reviewer_id = (
                    pseudonymized_id)

        datastore_services.put_multi(
            feedback_thread_models +
            feedback_message_models +
            general_suggestion_models)

    feedback_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.NAMES.feedback])
    for feedback_id, pseudonymized_id in feedback_ids_to_pids.items():
        feedback_related_models = [
            model for model in feedback_thread_models
            if model.id == feedback_id
        ] + [
            model for model in feedback_message_models
            if model.thread_id == feedback_id
        ] + [
            model for model in general_suggestion_models
            if model.id == feedback_id
        ]
        for i in python_utils.RANGE(
                0,
                len(feedback_related_models),
                MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            transaction_services.run_in_transaction(
                _pseudonymize_models,
                feedback_related_models[i:i + MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_id)


def _pseudonymize_suggestion_models(pending_deletion_request):
    """Pseudonymize the suggestion models for the user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id

    voiceover_application_class = (
        suggestion_models.GeneralVoiceoverApplicationModel)
    voiceover_application_models = voiceover_application_class.query(
        datastore_services.any_of(
            voiceover_application_class.author_id == user_id,
            voiceover_application_class.final_reviewer_id == user_id
        )).fetch()
    suggestion_ids = set([model.id for model in voiceover_application_models])

    _save_pseudonymizable_entity_mappings(
        pending_deletion_request, models.NAMES.suggestion, suggestion_ids)

    def _pseudonymize_models(voiceover_application_models):
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
        voiceover_application_class.put_multi(voiceover_application_models)

    suggestion_ids_to_pids = (
        pending_deletion_request.pseudonymizable_entity_mappings[
            models.NAMES.suggestion])
    for i in python_utils.RANGE(
            0,
            len(voiceover_application_models),
            MAX_NUMBER_OF_OPS_IN_TRANSACTION):
        transaction_services.run_in_transaction(
            _pseudonymize_models,
            voiceover_application_models[
                i:i + MAX_NUMBER_OF_OPS_IN_TRANSACTION])
