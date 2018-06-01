# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Funtions to create, accept, reject, update and perform other operations on
suggestions.
"""

from core.domain import exp_services
from core.domain import feedback_services
from core.domain import suggestion_registry
from core.domain import user_services
from core.platform import models
import feconf
import utils

(feedback_models, suggestion_models) = models.Registry.import_models([
    models.NAMES.feedback, models.NAMES.suggestion])

DEFAULT_SUGGESTION_THREAD_SUBJECT = 'Suggestion from a learner'
DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE = ''


def create_suggestion(
        suggestion_type, target_type, target_id, target_version_at_submission,
        author_id, change_cmd, score_category, description,
        assigned_reviewer_id, final_reviewer_id):
    """Creates a new SuggestionModel and the corresponding FeedbackThread.

    Args:
        suggestion_type: str. The type of the suggestion.
        target_type: str. The target entity being edited.

        (The above 2 parameters should be one of the constants defined in
        storage/suggestion/gae_models.py.)

        target_id: str. The ID of the target entity being suggested to.
        target_version_at_submission: int. The version number of the target
            entity at the time of creation of the suggestion.
        author_id: str. The ID of the user who submitted the suggestion.
        change_cmd: dict. The details of the suggestion.
        score_category: str. The category to score the author on.
        description: str. The description of the changes provided by the author.
        assigned_reviewer_id: str(optional). The ID of the user assigned to
            review the suggestion.
        final_reviewer_id: str(optional). The ID of the reviewer who has
            accepted/rejected the suggestion.
    """

    # TODO: Remove the check for target type once the feedback threads are
    # generalised for all types of entities. As at the moment feedback threads
    # can only be linked to explorations, we have this check.
    # This will be completed as a part of milestone 2 of the generalised review
    # system project.
    if target_type == suggestion_models.TARGET_TYPE_EXPLORATION:
        thread_id = feedback_services.create_thread(
            target_id, None, author_id, description,
            DEFAULT_SUGGESTION_THREAD_SUBJECT)
        # This line will be removed after the feedback thread migration is
        # complete and the IDs for both models match.
        thread_id = suggestion_models.TARGET_TYPE_EXPLORATION + '.' + thread_id
    if assigned_reviewer_id:
        suggestion_models.SuggestionModel.create(
            suggestion_type, target_type, target_id,
            target_version_at_submission, suggestion_models.STATUS_IN_REVIEW,
            author_id, assigned_reviewer_id, final_reviewer_id, change_cmd,
            score_category, thread_id)
    else:
        suggestion_models.SuggestionModel.create(
            suggestion_type, target_type, target_id,
            target_version_at_submission, suggestion_models.STATUS_RECEIVED,
            author_id, assigned_reviewer_id, final_reviewer_id, change_cmd,
            score_category, thread_id)


def get_suggestion_from_model(suggestion_model):
    """Converts the given SuggestionModel to a Suggestion object

    Args:
        suggestion_model: SuggestionModel.

    Returns:
        Suggestion. The corresponding Suggestion domain object.
    """
    suggestion_domain_class = (
        suggestion_registry.SUGGESTION_TYPES_TO_DOMAIN_CLASSES[
            suggestion_model.suggestion_type])
    return suggestion_domain_class(
        suggestion_model.id, suggestion_model.target_id,
        suggestion_model.target_version_at_submission,
        suggestion_model.status, suggestion_model.author_id,
        suggestion_model.assigned_reviewer_id,
        suggestion_model.final_reviewer_id, suggestion_model.change_cmd,
        suggestion_model.score_category)


def get_suggestion_by_id(suggestion_id):
    """Finds a suggestion by the suggestion ID.

    Args:
        suggestion_id: str. The ID of the suggestion.

    Returns:
        Suggestion|None. The corresponding suggestion, or None if no suggestion
            is found.
    """
    model = suggestion_models.SuggestionModel.get_by_id(suggestion_id)

    return get_suggestion_from_model(model) if model else None


def get_suggestions_by_author(author_id):
    """Gets a list of suggestions by the given author.

    Args:
        author_id: str. The ID of the author of the suggestions.

    Returns:
        list(Suggestion). A list of suggestions by the given author.
    """
    return [
        get_suggestion_from_model(s)
        for s in suggestion_models.SuggestionModel.get_suggestions_by_author(
            author_id)]


def get_suggestions_reviewed_by(reviewer_id):
    """Gets a list of suggestions that have been reviewed by the given user.

    Args:
        reviewer_id: str. The ID of the reviewer of the suggestion.

    Returns:
        list(Suggestion). A list of suggestions reviewed by the given user.
    """
    return [
        get_suggestion_from_model(s)
        for s in suggestion_models.SuggestionModel.get_suggestions_reviewed_by(
            reviewer_id)]


def get_suggestions_assigned_to_reviewer(assigned_reviewer_id):
    """Gets a list of suggestions assigned to the given user for review.

    Args:
        assigned_reviewer_id: str. The ID of the reviewer assigned to review the
                suggestion.

    Returns:
        list(Suggestion). A list of suggestions assigned to the given user
            for review.
    """
    return [
        get_suggestion_from_model(s)
        for s in suggestion_models.SuggestionModel
        .get_suggestions_assigned_to_reviewer(assigned_reviewer_id)]


def get_suggestions_by_status(status):
    """Gets a list of suggestions with the given status.

    Args:
        status: str. The status of the suggestion.

    Returns:
        list(Suggestion). A list of suggestions with the given status.
    """
    return [
        get_suggestion_from_model(s)
        for s in suggestion_models.SuggestionModel.get_suggestions_by_status(
            status)]


def get_suggestion_by_type(suggestion_type):
    """Gets a list of suggestions with the given sub_type.

    Args:
        suggestion_type: str. The sub type of the suggestion.

    Returns:
        list(Suggestion). A list of suggestions of the given type.
    """
    return [
        get_suggestion_from_model(s)
        for s in suggestion_models.SuggestionModel.get_suggestions_by_type(
            suggestion_type)]


def get_suggestions_by_target_id(target_type, target_id):
    """Gets a list of suggestions to the entity with the given ID.

    Args:
        target_type: str. The type of target entity the suggestion is linked to.
        target_id: str. The ID of the target entity the suggestion is linked to.

    Returns:
        list(Suggestion). A list of suggestions linked to the entity.
    """
    return [
        get_suggestion_from_model(s)
        for s in suggestion_models.SuggestionModel.get_suggestions_by_target_id(
            target_type, target_id)]


def _update_suggestion(suggestion):
    """Updates the given suggestion.

    Args:
        suggesstion: Suggestion. The domain object of the suggestion to be
            updated.
    """

    suggestion_model = suggestion_models.SuggestionModel.get_by_id(
        suggestion.suggestion_id)

    suggestion_model.status = suggestion.status
    suggestion_model.assigned_reviewer_id = suggestion.assigned_reviewer_id
    suggestion_model.final_reviewer_id = suggestion.final_reviewer_id
    suggestion_model.change_cmd = suggestion.change_cmd
    suggestion_model.score_category = suggestion.score_category

    suggestion_model.put()


def mark_review_completed(suggestion, status, reviewer_id):
    """Marks that a review has been completed.

    Args:
        suggestion: Suggestion. The domain object of the suggestion to be
            updated.
        status: str. The status of the suggestion post review.
        reviewer_id: str. The ID of the user who completed the review.
    """
    suggestion.status = status
    suggestion.final_reviewer_id = reviewer_id
    suggestion.assigned_reviewer_id = None

    _update_suggestion(suggestion)


def assign_reviewer_to_suggestion(suggestion, assigned_reviewer_id):
    """Assigns a user to review the suggestion.

    Args:
        suggestion: Suggestion. The domain object of the suggestion to be
            updated.
        assigned_reviewer_id: str. The ID of the user who is assigned to review.
    """
    suggestion.status = suggestion_models.STATUS_IN_REVIEW
    suggestion.assigned_reviewer_id = assigned_reviewer_id

    _update_suggestion(suggestion)


# This function is temporary. At the moment, the feedback threads id is of the
# form exp_id.<random_str> while the suggestion ids are of the form
# entity_type.entity_id.<random_str>. Once the feedback thread ID migration
# is complete, these two IDs will be matched, and this function will be removed.
def get_thread_id_from_suggestion_id(suggestion_id):
    """Gets the thread_id from the suggestion_id.

    Args:
        suggestion_id: str. The ID of the suggestion.

    Returns:
        str. The thread ID linked to the suggestion.
    """

    # Temporarily. Once the feedback migration is complete, this function will
    # be removed.
    return suggestion_id[suggestion_id.find('.') + 1:]


def is_suggestion_handled(suggestion):
    """Checks if the suggestion has been accepted or rejected.

    Args:
        suggestion: Suggestion. The domain object of the suggestion to be
            checked.

    Returns:
        bool. Whether the suggestion has been handled or not.
    """
    return (suggestion.status not in [suggestion_models.STATUS_IN_REVIEW,
                                      suggestion_models.STATUS_RECEIVED])


def get_commit_message_for_suggestion(author_username, commit_message):
    """Returns a modified commit message for an accepted suggestion.

    Args:
        author_username: str. Username of the suggestion author.
        commit_message: str. The original commit message submitted by the
            suggestion author.

    Returns:
        str. The modified commit message to be used in the exploration commit
        logs.
    """
    return '%s %s: %s' % (
        feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX,
        author_username, commit_message)


def accept_suggestion(suggestion, reviewer_id, commit_message):
    """Accepts the given suggestion after validating it.

    Args:
        suggestion: Suggestion. The domain object of the suggestion to be
            accepted.
        reviewer_id: str. The ID of the reviewer accepting the suggestion.
        commit_message: str. The commit message.

    Raises:
        Exception: The suggestion is already handled.
        Exception: The suggestion is not valid.
        Exception: The commit message is empty.
    """
    if is_suggestion_handled(suggestion):
        raise Exception('The suggestion has already been accepted/rejected.')
    if not commit_message or not commit_message.strip():
        raise Exception('Commit message cannot be empty.')

    try:
        # If an exception is raised, the suggestion status will be set as
        # STATUS_INVALID.
        suggestion.validate()
    except utils.ValidationError:
        _update_suggestion(suggestion)
        raise Exception('The given suggestion is not valid.')

    author_name = user_services.get_username(suggestion.author_id)
    commit_message = get_commit_message_for_suggestion(
        author_name, commit_message)
    suggestion.accept(commit_message)

    mark_review_completed(
        suggestion, suggestion_models.STATUS_ACCEPTED, reviewer_id)
    feedback_services.create_message(
        get_thread_id_from_suggestion_id(suggestion.suggestion_id), reviewer_id,
        feedback_models.STATUS_CHOICES_FIXED, None,
        'Accepted by %s' % reviewer_id)


def reject_suggestion(suggestion, reviewer_id):
    """Rejects the suggestion.

     Args:
        suggestion: Suggestion. The domain object of the suggestion to be
            rejected.
        reviewer_id: str. The ID of the reviewer rejecting the suggestion.

    Raises:
        Exception: The suggestion is already handled.
    """
    if is_suggestion_handled(suggestion):
        raise Exception('The suggestion has already been accepted/rejected.')

    mark_review_completed(
        suggestion, suggestion_models.STATUS_REJECTED, reviewer_id)
    feedback_services.create_message(
        get_thread_id_from_suggestion_id(suggestion.suggestion_id), reviewer_id,
        feedback_models.STATUS_CHOICES_IGNORED, None,
        'Rejected by %s' % reviewer_id)
