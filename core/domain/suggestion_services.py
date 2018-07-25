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
from core.domain import user_domain
from core.domain import user_services
from core.platform import models
import feconf

(feedback_models, suggestion_models, user_models) = (
    models.Registry.import_models(
        [models.NAMES.feedback, models.NAMES.suggestion, models.NAMES.user]))

DEFAULT_SUGGESTION_THREAD_SUBJECT = 'Suggestion from a user'
DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE = ''


def create_suggestion(
        suggestion_type, target_type, target_id, target_version_at_submission,
        author_id, change_cmd, description, final_reviewer_id):
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
        description: str. The description of the changes provided by the author.
        final_reviewer_id: str|None. The ID of the reviewer who has
            accepted/rejected the suggestion.
    """

    thread_id = None
    # TODO(nithesh): Remove the check for target type once the feedback threads
    # are generalised for all types of entities. As at the moment feedback
    # threads can only be linked to explorations, we have this check.
    # This will be completed as a part of milestone 2 of the generalised review
    # system project.
    if target_type == suggestion_models.TARGET_TYPE_EXPLORATION:
        thread_id = feedback_services.create_thread(
            target_id, None, author_id, description,
            DEFAULT_SUGGESTION_THREAD_SUBJECT, has_suggestion=True)
        # This line and the if..else will be removed after the feedback thread
        # migration is complete and the IDs for both models match.
        thread_id = suggestion_models.TARGET_TYPE_EXPLORATION + '.' + thread_id
    elif feconf.ENABLE_GENERALIZED_FEEDBACK_THREADS:
        # TODO (nithesh): Refactor the thread creation logic after #5235 is
        # merged.
        thread_id = feedback_services.create_thread(
            target_id, None, author_id, description,
            DEFAULT_SUGGESTION_THREAD_SUBJECT, has_suggestion=True)
        thread_id = suggestion_models.TARGET_TYPE_TOPIC + '.' + thread_id

    status = suggestion_models.STATUS_IN_REVIEW

    if target_type == suggestion_models.TARGET_TYPE_EXPLORATION:
        exploration = exp_services.get_exploration_by_id(target_id)
    if suggestion_type == suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT:
        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER + exploration.category)
    elif suggestion_type == suggestion_models.SUGGESTION_TYPE_ADD_QUESTION:
        score_category = (
            suggestion_models.SCORE_TYPE_QUESTION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + target_id)

    suggestion_models.GeneralSuggestionModel.create(
        suggestion_type, target_type, target_id,
        target_version_at_submission, status, author_id,
        final_reviewer_id, change_cmd, score_category, thread_id)


def get_suggestion_from_model(suggestion_model):
    """Converts the given SuggestionModel to a Suggestion domain object

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
        suggestion_model.final_reviewer_id, suggestion_model.change_cmd,
        suggestion_model.score_category, suggestion_model.last_updated)


def get_suggestion_by_id(suggestion_id):
    """Finds a suggestion by the suggestion ID.

    Args:
        suggestion_id: str. The ID of the suggestion.

    Returns:
        Suggestion|None. The corresponding suggestion, or None if no suggestion
            is found.
    """
    model = suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id)

    return get_suggestion_from_model(model) if model else None


def query_suggestions(query_fields_and_values):
    """Queries for suggestions.

    Args:
        query_fields_and_values: list(tuple(str, str)). A list of queries. The
            first element in each tuple is the field to be queried, and the
            second element is its value.

    Returns:
        list(Suggestion). A list of suggestions that match the given query
        values, up to a maximum of feconf.DEFAULT_QUERY_LIMIT suggestions.
    """
    return [get_suggestion_from_model(s)
            for s in suggestion_models.GeneralSuggestionModel.query_suggestions(
                query_fields_and_values)]


def get_all_stale_suggestions():
    """Gets a list of suggestions without any activity on them for
    THRESHOLD_TIME_BEFORE_ACCEPT time.

    Returns:
        list(Suggestion). A list of suggestions linked to the entity.
    """

    return [get_suggestion_from_model(s)
            for s in suggestion_models.GeneralSuggestionModel
            .get_all_stale_suggestions()]


def _update_suggestion(suggestion):
    """Updates the given suggestion.

    Args:
        suggestion: Suggestion. The suggestion to be updated.
    """
    suggestion.validate()

    suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
        suggestion.suggestion_id)

    suggestion_model.status = suggestion.status
    suggestion_model.final_reviewer_id = suggestion.final_reviewer_id
    suggestion_model.change_cmd = suggestion.change_cmd.to_dict()
    suggestion_model.score_category = suggestion.score_category

    suggestion_model.put()


def mark_review_completed(suggestion, status, reviewer_id):
    """Marks that a review has been completed.

    Args:
        suggestion: Suggestion. The suggestion to be updated.
        status: str. The status of the suggestion post review. Possible values
            are STATUS_ACCEPTED or STATUS_REJECTED.
        reviewer_id: str. The ID of the user who completed the review.
    """
    if(status not in [suggestion_models.STATUS_ACCEPTED,
                      suggestion_models.STATUS_REJECTED]):
        raise Exception('Invalid status after review.')

    suggestion.status = status
    suggestion.final_reviewer_id = reviewer_id

    _update_suggestion(suggestion)


# TODO (nithesh): This function is temporary. At the moment, the feedback
# threads id is of the form exp_id.<random_str> while the suggestion ids are of
# the form entity_type.entity_id.<random_str>. Once the feedback thread ID
# migration is complete, these two IDs will be matched, and this function will
# be removed.
def get_thread_id_from_suggestion_id(suggestion_id):
    """Gets the thread_id from the suggestion_id.

    Args:
        suggestion_id: str. The ID of the suggestion.

    Returns:
        str. The thread ID linked to the suggestion.
    """
    return suggestion_id[suggestion_id.find('.') + 1:]


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


def accept_suggestion(suggestion, reviewer_id, commit_message, review_message):
    """Accepts the given suggestion after validating it.

    Args:
        suggestion: Suggestion. The suggestion to be accepted.
        reviewer_id: str. The ID of the reviewer accepting the suggestion.
        commit_message: str. The commit message.
        review_message: str. The message provided by the reviewer while
            accepting the suggestion.

    Raises:
        Exception: The suggestion is already handled.
        Exception: The suggestion is not valid.
        Exception: The commit message is empty.
    """
    if suggestion.is_handled:
        raise Exception('The suggestion has already been accepted/rejected.')
    if not commit_message or not commit_message.strip():
        raise Exception('Commit message cannot be empty.')

    suggestion.pre_accept_validate()

    author_name = user_services.get_username(suggestion.author_id)
    commit_message = get_commit_message_for_suggestion(
        author_name, commit_message)
    mark_review_completed(
        suggestion, suggestion_models.STATUS_ACCEPTED, reviewer_id)
    suggestion.accept(commit_message)

    # TODO: Remove check for target being exploration after completing #5235.
    if suggestion.target_type == suggestion_models.TARGET_TYPE_EXPLORATION:
        feedback_services.create_message(
            get_thread_id_from_suggestion_id(suggestion.suggestion_id),
            reviewer_id, feedback_models.STATUS_CHOICES_FIXED, None,
            review_message)


def reject_suggestion(suggestion, reviewer_id, review_message):
    """Rejects the suggestion.

     Args:
        suggestion: Suggestion. The suggestion to be rejected.
        reviewer_id: str. The ID of the reviewer rejecting the suggestion.
        review_message: str. The message provided by the reviewer while
            rejecting the suggestion.

    Raises:
        Exception: The suggestion is already handled.
    """
    if suggestion.is_handled:
        raise Exception('The suggestion has already been accepted/rejected.')
    if not review_message:
        raise Exception('Review message cannot be empty.')
    mark_review_completed(
        suggestion, suggestion_models.STATUS_REJECTED, reviewer_id)
    # TODO: Remove check for target being exploration after completing #5235.
    if suggestion.target_type == suggestion_models.TARGET_TYPE_EXPLORATION:
        feedback_services.create_message(
            get_thread_id_from_suggestion_id(suggestion.suggestion_id),
            reviewer_id, feedback_models.STATUS_CHOICES_IGNORED, None,
            review_message)


def get_user_contribution_scoring_from_model(userContributionScoringModel):
    """Returns the UserContributionScoring domain object corresponding to the
    UserContributionScoringModel

    Args:
        userContributionScoringModel: UserContributionScoringModel. The model
            instance.

    Returns:
        UserContributionScoring. The corresponding domain object.
    """
    return user_domain.UserContributionScoring(
        userContributionScoringModel.user_id,
        userContributionScoringModel.score_category,
        userContributionScoringModel.score)


def get_all_scores_of_user(user_id):
    """Gets all scores for a given user.

    Args:
        user_id: str. The id of the user.

    Returns:
        dict. A dict containing all the scores of the user. The keys of the dict
            are the score categories and the values are the scores.
    """
    scores = {}
    for model in (
            user_models.UserContributionScoringModel.get_all_scores_of_user(
                user_id)):
        scores[model.score_category] = model.score

    return scores


def check_user_can_review_in_category(user_id, score_category):
    """Checks if user can review suggestions in category score_category.
    If the user has score above the minimum required score, then the user is
    allowed to review.

    Args:
        user_id: str. The id of the user.
        score_category: str. The category to check the user's score.

    Returns:
        bool. Whether the user can review suggestions under category
            score_category
    """
    score = (
        user_models.UserContributionScoringModel.get_score_of_user_for_category(
            user_id, score_category))
    if not score:
        return False
    return score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW


def get_all_user_ids_who_are_allowed_to_review(score_category):
    """Gets all user_ids of users who are allowed to review (as per their
    scores) suggestions to a particular category.

    Args:
        score_category: str. The category of the suggestion.

    Returns:
        list(str). All user_ids of users who are allowed to review in the given
            category.
    """
    return [model.user_id for model in
            user_models.UserContributionScoringModel
            .get_all_users_with_score_above_minimum_for_category(
                score_category)]


def increment_score_for_user(user_id, score_category, increment_by):
    """Increment the score of the user in the category by the given amount.

    In the first version of the scoring system, the increment_by quantity will
    be +1, i.e, each user gains a point for a successful contribution and
    doesn't lose score in any way.

    Args:
        user_id: str. The id of the user.
        score_category: str. The category of the suggestion.
        increment_by: float. The amount to increase the score of the user by.
    """
    user_models.UserContributionScoringModel.increment_score_for_user(
        user_id, score_category, increment_by)


def create_new_user_contribution_scoring_model(user_id, score_category, score):
    """Create a new UserContributionScoringModel instance for the user and the
    given category with a score of 0.

    Args:
        user_id: str. The id of the user.
        score_category: str. The category of the suggestion.
        score: float. The score of the user for the given category.
    """
    user_models.UserContributionScoringModel.create(
        user_id, score_category, score)
