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
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import user_services
from core.domain import wipeout_domain
from core.platform import models
import python_utils

current_user_services = models.Registry.import_current_user_services()
(
    base_models, improvements_models, question_models,
    skill_models, story_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.improvements, models.NAMES.question,
    models.NAMES.skill, models.NAMES.story, models.NAMES.user
])
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
        pending_deletion_request_model.deletion_complete,
        pending_deletion_request_model.exploration_ids,
        pending_deletion_request_model.collection_ids,
        pending_deletion_request_model.activity_mappings
    )


def save_pending_deletion_request(pending_deletion_request):
    """Save a pending deletion request domain object as
    a PendingDeletionRequestModel entity in the datastore.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    pending_deletion_request_dict = {
        'email': pending_deletion_request.email,
        'deletion_complete': pending_deletion_request.deletion_complete,
        'exploration_ids': pending_deletion_request.exploration_ids,
        'collection_ids': pending_deletion_request.collection_ids,
        'activity_mappings': pending_deletion_request.activity_mappings
    }

    pending_deletion_request_model = (
        user_models.PendingDeletionRequestModel.get_by_id(
            pending_deletion_request.user_id))
    if pending_deletion_request_model is not None:
        pending_deletion_request_model.populate(**pending_deletion_request_dict)
        pending_deletion_request_model.put()
    else:
        pending_deletion_request_dict['id'] = pending_deletion_request.user_id
        user_models.PendingDeletionRequestModel(
            **pending_deletion_request_dict
        ).put()


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

    email = user_services.get_user_settings(user_id, strict=True).email
    user_services.mark_user_for_deletion(user_id)

    save_pending_deletion_request(
        wipeout_domain.PendingDeletionRequest.create_default(
            user_id,
            email,
            explorations_to_be_deleted_ids,
            collections_to_be_deleted_ids
        )
    )


def delete_user(pending_deletion_request):
    """Delete all the models for user specified in pending_deletion_request.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object for which to delete or pseudonymize all the models.
    """
    _delete_user_models(pending_deletion_request.user_id)
    _hard_delete_explorations_and_collections(pending_deletion_request)
    _delete_improvements_models(pending_deletion_request.user_id)
    _delete_question_models(pending_deletion_request)
    _delete_skill_models(pending_deletion_request)
    _delete_story_models(pending_deletion_request)


def verify_user_deleted(pending_deletion_request):
    """Verify that all the models for user specified in pending_deletion_request
    are deleted.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.

    Returns:
        bool. True if all the models were correctly deleted, False otherwise.
    """
    return _verify_models_deleted(
        pending_deletion_request.user_id,
        [
            models.NAMES.improvements,
            models.NAMES.question,
            models.NAMES.skill,
            models.NAMES.story,
            models.NAMES.user
        ]
    )


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
    collection_services.delete_collections(
        pending_deletion_request.user_id,
        pending_deletion_request.collection_ids,
        force_deletion=True)


def _generate_activity_to_pseudonymized_ids_mapping(activity_ids):
    """Generate mapping from activity IDs to pseudonymous user IDs.

    Args:
        activity_ids: list(str). List of activity IDs for which to generate
            new pseudonymous user IDs. The IDs are of activities that were
            modified in some way by the user who is currently being deleted.

    Returns:
        dict(str, str). Mapping between the activity IDs and pseudonymous
        user IDs. For each activity (with distinct ID) we generate a new
        pseudonymous user ID.
    """
    return {
        activity_id: user_models.PseudonymizedUserModel.get_new_id('')
        for activity_id in activity_ids
    }


def _delete_improvements_models(user_id):
    """Delete the improvements models for the user with user_id.

    Args:
        user_id: str. The id of the user to be deleted.
    """
    for model_class in models.Registry.get_storage_model_classes(
            [models.NAMES.improvements]):
        if (model_class.get_deletion_policy() not in
                [base_models.DELETION_POLICY.KEEP,
                 base_models.DELETION_POLICY.NOT_APPLICABLE]):
            model_class.apply_deletion_policy(user_id)


def _delete_question_models(pending_deletion_request):
    """Pseudonymize the question models for the user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id
    metadata_models = question_models.QuestionSnapshotMetadataModel.query(
        question_models.QuestionSnapshotMetadataModel.committer_id == user_id
    ).fetch()
    question_ids = set([
        model.get_unversioned_instance_id() for model in metadata_models])

    commit_log_models = question_models.QuestionCommitLogEntryModel.query(
        question_models.QuestionCommitLogEntryModel.user_id == user_id
    ).fetch()
    commit_log_ids = set(model.question_id for model in commit_log_models)
    if question_ids != commit_log_ids:
        logging.error(
            'The commit log and snapshot question IDs differ. '
            'Snapshots without commit logs: %s, '
            'Commit logs without snapshots: %s.',
            list(question_ids - commit_log_ids),
            list(commit_log_ids - question_ids))

    question_ids |= commit_log_ids
    if models.NAMES.question not in pending_deletion_request.activity_mappings:
        pending_deletion_request.activity_mappings[models.NAMES.question] = (
            _generate_activity_to_pseudonymized_ids_mapping(question_ids))
        save_pending_deletion_request(pending_deletion_request)

    def _pseudonymize_models(question_related_models, pseudonymized_user_id):
        """Pseudonymize user ID fields in the models.

        Args:
            question_related_models: list(ndb.Model). Models whose user IDs
                should be pseudonymized.
            pseudonymized_user_id: str. New pseudonymized user ID to be used for
                the models.
        """
        metadata_models = [
            model for model in question_related_models
            if isinstance(model, question_models.QuestionSnapshotMetadataModel)]
        for metadata_model in metadata_models:
            metadata_model.committer_id = pseudonymized_user_id
        question_models.QuestionSnapshotMetadataModel.put_multi(metadata_models)

        commit_log_models = [
            model for model in question_related_models
            if isinstance(model, question_models.QuestionCommitLogEntryModel)]
        for commit_log_model in commit_log_models:
            commit_log_model.user_id = pseudonymized_user_id
        question_models.QuestionCommitLogEntryModel.put_multi(commit_log_models)

    question_mappings = (
        pending_deletion_request.activity_mappings[models.NAMES.question])
    for question_id, pseudonymized_user_id in question_mappings.items():
        question_related_models = [
            model for model in metadata_models
            if model.get_unversioned_instance_id() == question_id]
        question_related_models += [
            model for model in commit_log_models
            if model.question_id == question_id]
        for i in python_utils.RANGE(
                0,
                len(question_related_models),
                MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            transaction_services.run_in_transaction(
                _pseudonymize_models,
                question_related_models[i:i + MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_user_id)


def _delete_skill_models(pending_deletion_request):
    """Pseudonymize the skill models for the user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id
    metadata_models = skill_models.SkillSnapshotMetadataModel.query(
        skill_models.SkillSnapshotMetadataModel.committer_id == user_id
    ).fetch()
    skill_ids = set([
        model.get_unversioned_instance_id() for model in metadata_models])

    commit_log_models = skill_models.SkillCommitLogEntryModel.query(
        skill_models.SkillCommitLogEntryModel.user_id == user_id
    ).fetch()
    commit_log_ids = set(model.skill_id for model in commit_log_models)
    if skill_ids != commit_log_ids:
        logging.error(
            'The commit log and snapshot skill IDs differ. '
            'Snapshots without commit logs: %s, '
            'Commit logs without snapshots: %s.',
            list(skill_ids - commit_log_ids),
            list(commit_log_ids - skill_ids))

    skill_ids |= commit_log_ids
    if models.NAMES.skill not in pending_deletion_request.activity_mappings:
        pending_deletion_request.activity_mappings[models.NAMES.skill] = (
            _generate_activity_to_pseudonymized_ids_mapping(skill_ids))
        save_pending_deletion_request(pending_deletion_request)

    def _pseudonymize_models(skill_related_models, pseudonymized_user_id):
        """Pseudonymize user ID fields in the models.

        Args:
            skill_related_models: list(ndb.Model). Models whose user IDs should
                be pseudonymized.
            pseudonymized_user_id: str. New pseudonymized user ID to be used for
                the models.
        """
        metadata_models = [
            model for model in skill_related_models
            if isinstance(model, skill_models.SkillSnapshotMetadataModel)]
        for metadata_model in metadata_models:
            metadata_model.committer_id = pseudonymized_user_id
        skill_models.SkillSnapshotMetadataModel.put_multi(metadata_models)

        commit_log_models = [
            model for model in skill_related_models
            if isinstance(model, skill_models.SkillCommitLogEntryModel)]
        for commit_log_model in commit_log_models:
            commit_log_model.user_id = pseudonymized_user_id
        skill_models.SkillCommitLogEntryModel.put_multi(commit_log_models)

    skill_mappings = (
        pending_deletion_request.activity_mappings[models.NAMES.skill])
    for skill_id, pseudonymized_user_id in skill_mappings.items():
        skill_related_models = [
            model for model in metadata_models
            if model.get_unversioned_instance_id() == skill_id]
        skill_related_models += [
            model for model in commit_log_models if model.skill_id == skill_id]
        for i in python_utils.RANGE(
                0, len(skill_related_models), MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            transaction_services.run_in_transaction(
                _pseudonymize_models,
                skill_related_models[i:i + MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_user_id)


def _delete_story_models(pending_deletion_request):
    """Pseudonymize the story models for the user with user_id.

    Args:
        pending_deletion_request: PendingDeletionRequest. The pending deletion
            request object to be saved in the datastore.
    """
    user_id = pending_deletion_request.user_id
    metadata_models = story_models.StorySnapshotMetadataModel.query(
        story_models.StorySnapshotMetadataModel.committer_id == user_id
    ).fetch()
    story_ids = set([
        model.get_unversioned_instance_id() for model in metadata_models])

    commit_log_models = story_models.StoryCommitLogEntryModel.query(
        story_models.StoryCommitLogEntryModel.user_id == user_id
    ).fetch()
    commit_log_ids = set(model.story_id for model in commit_log_models)
    if story_ids != commit_log_ids:
        logging.error(
            'The commit log and snapshot story IDs differ. '
            'Snapshots without commit logs: %s, '
            'Commit logs without snapshots: %s.',
            list(story_ids - commit_log_ids),
            list(commit_log_ids - story_ids))

    story_ids |= commit_log_ids
    if models.NAMES.story not in pending_deletion_request.activity_mappings:
        pending_deletion_request.activity_mappings[models.NAMES.story] = (
            _generate_activity_to_pseudonymized_ids_mapping(story_ids))
        save_pending_deletion_request(pending_deletion_request)

    def _pseudonymize_models(story_related_models, pseudonymized_user_id):
        """Pseudonymize user ID fields in the models.

        Args:
            story_related_models: list(ndb.Model). Models whose user IDs should
                be pseudonymized.
            pseudonymized_user_id: str. New pseudonymized user ID to be used for
                the models.
        """
        metadata_models = [
            model for model in story_related_models
            if isinstance(model, story_models.StorySnapshotMetadataModel)]
        for metadata_model in metadata_models:
            metadata_model.committer_id = pseudonymized_user_id
        story_models.StorySnapshotMetadataModel.put_multi(metadata_models)

        commit_log_models = [
            model for model in story_related_models
            if isinstance(model, story_models.StoryCommitLogEntryModel)]
        for commit_log_model in commit_log_models:
            commit_log_model.user_id = pseudonymized_user_id
        story_models.StoryCommitLogEntryModel.put_multi(commit_log_models)

    story_mappings = (
        pending_deletion_request.activity_mappings[models.NAMES.story])
    for story_id, pseudonymized_user_id in story_mappings.items():
        story_related_models = [
            model for model in metadata_models
            if model.get_unversioned_instance_id() == story_id]
        story_related_models += [
            model for model in commit_log_models if model.story_id == story_id]
        for i in python_utils.RANGE(
                0, len(story_related_models), MAX_NUMBER_OF_OPS_IN_TRANSACTION):
            transaction_services.run_in_transaction(
                _pseudonymize_models,
                story_related_models[i:i + MAX_NUMBER_OF_OPS_IN_TRANSACTION],
                pseudonymized_user_id)


def _delete_user_models(user_id):
    """Delete the user models for the user with user_id.

    Args:
        user_id: str. The id of the user to be deleted.
    """
    for model_class in models.Registry.get_storage_model_classes(
            [models.NAMES.user]):
        if (model_class.get_deletion_policy() not in
                [base_models.DELETION_POLICY.KEEP,
                 base_models.DELETION_POLICY.NOT_APPLICABLE]):
            model_class.apply_deletion_policy(user_id)


def _verify_models_deleted(user_id, model_categories):
    """Verify that the user models for the user with user_id are deleted.

    Args:
        user_id: str. The id of the user to be deleted.
        model_categories: list(enum). Categories of models to check.

    Returns:
        bool. True if all the user models were correctly deleted, False
        otherwise.
    """
    for model_class in models.Registry.get_storage_model_classes(
            model_categories):
        try:
            if (
                    model_class.get_deletion_policy() not in
                    [base_models.DELETION_POLICY.KEEP,
                     base_models.DELETION_POLICY.NOT_APPLICABLE] and
                    model_class.has_reference_to_user_id(user_id)
            ):
                return False
        except NotImplementedError:
            continue
    return True
