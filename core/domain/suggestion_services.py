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

from core.domain import email_manager
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
        author_id, change, description, final_reviewer_id):
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
        change: dict. The details of the suggestion.
        description: str. The description of the changes provided by the author.
        final_reviewer_id: str|None. The ID of the reviewer who has
            accepted/rejected the suggestion.
    """
    if description is None:
        description = DEFAULT_SUGGESTION_THREAD_SUBJECT
    thread_id = feedback_services.create_thread(
        target_type, target_id, author_id, description,
        DEFAULT_SUGGESTION_THREAD_INITIAL_MESSAGE, has_suggestion=True)

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
    else:
        raise Exception('Invalid suggestion type')

    suggestion_models.GeneralSuggestionModel.create(
        suggestion_type, target_type, target_id,
        target_version_at_submission, status, author_id,
        final_reviewer_id, change, score_category, thread_id)


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
    suggestion_model.change_cmd = suggestion.change.to_dict()
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
    thread_id = suggestion.suggestion_id
    feedback_services.create_message(
        thread_id, reviewer_id, feedback_models.STATUS_CHOICES_FIXED,
        None, review_message)

    if feconf.ENABLE_RECORDING_OF_SCORES:
        increment_score_for_user(
            suggestion.author_id, suggestion.score_category,
            suggestion_models.INCREMENT_SCORE_OF_AUTHOR_BY)
        if feconf.SEND_SUGGESTION_REVIEW_RELATED_EMAILS:
            scores = get_all_scores_of_user(suggestion.author_id)
            if (
                    suggestion.score_category in scores and
                    scores[suggestion.score_category] >=
                    feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW):
                if check_if_email_has_been_sent_to_user(
                        suggestion.author_id, suggestion.score_category):
                    email_manager.send_mail_to_onboard_new_reviewers(
                        suggestion.author_id, suggestion.score_category)
                    mark_email_has_been_sent_to_user(
                        suggestion.author_id, suggestion.score_category)


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

    thread_id = suggestion.suggestion_id
    feedback_services.create_message(
        thread_id, reviewer_id, feedback_models.STATUS_CHOICES_IGNORED,
        None, review_message)


def resubmit_rejected_suggestion(suggestion, summary_message, author_id):
    """Resubmit a rejected suggestion.

     Args:
        suggestion: Suggestion. The rejected suggestion.
        summary_message: str. The message provided by the author to
            summarize new suggestion.
        author_id: str. The ID of the author creating the suggestion.

    Raises:
        Exception: The summary message is empty.
        Exception: The suggestion has not been handled yet.
        Exception: The suggestion has already been accepted.
    """
    if not summary_message:
        raise Exception('Summary message cannot be empty.')
    if not suggestion.is_handled:
        raise Exception('The suggestion is not yet handled.')
    if suggestion.status == suggestion_models.STATUS_ACCEPTED:
        raise Exception(
            'The suggestion was accepted. '
            'Only rejected suggestions can be resubmitted.')

    suggestion.status = suggestion_models.STATUS_IN_REVIEW
    _update_suggestion(suggestion)

    thread_id = suggestion.suggestion_id
    feedback_services.create_message(
        thread_id, author_id, feedback_models.STATUS_CHOICES_OPEN,
        None, summary_message)


def get_all_suggestions_that_can_be_reviewed_by_user(user_id):
    """Returns a list of suggestions which need to be reviewed, in categories
    where the user has crossed the minimum score to review.

    Args:
        user_id: str. The ID of the user.

    Returns:
        list(Suggestion). A list of suggestions which the given user is allowed
            to review.
    """
    score_categories = (
        user_models.UserContributionScoringModel
        .get_all_categories_where_user_can_review(user_id))

    if len(score_categories) == 0:
        return []

    return (
        [get_suggestion_from_model(s)
         for s in suggestion_models.GeneralSuggestionModel
         .get_in_review_suggestions_in_score_categories(
             score_categories, user_id)])


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
        userContributionScoringModel.score,
        userContributionScoringModel.has_email_been_sent)


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
    if score is None:
        return False
    return score >= feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW


def check_if_email_has_been_sent_to_user(user_id, score_category):
    """Checks if user has already received an email.

    Args:
        user_id: str. The id of the user.
        score_category: str. The score category.

    Returns:
        bool. Whether the email has already been sent to the user.
    """
    scoring_model_instance = user_models.UserContributionScoringModel.get_by_id(
        '%s.%s' % (score_category, user_id))
    if scoring_model_instance is None:
        return False
    return scoring_model_instance.has_email_been_sent


def mark_email_has_been_sent_to_user(user_id, score_category):
    """Marks that the user has already received an email.

    Args:
        user_id: str. The id of the user.
        score_category: str. The score category.
    """
    scoring_model_instance = user_models.UserContributionScoringModel.get_by_id(
        '%s.%s' % (score_category, user_id))

    if scoring_model_instance is None:
        raise Exception('Expected user scoring model to exist for user')
    scoring_model_instance.has_email_been_sent = True
    scoring_model_instance.put()


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


def get_next_user_in_rotation(score_category):
    """Gets the id of the next user in the reviewer rotation for the given
    score_category. The order is alphabetical, and the next user in the
    alphabetical order is returned.

    Args:
        score_category: str. The score category.

    Returns:
        str|None. The user id of the next user in the reviewer rotation, if
            there are reviewers for the given category. Else None.
    """
    reviewer_ids = get_all_user_ids_who_are_allowed_to_review(score_category)
    reviewer_ids.sort()

    if len(reviewer_ids) == 0:
        # No reviewers available for the given category.
        return None

    position_tracking_model = (
        suggestion_models.ReviewerRotationTrackingModel.get_by_id(
            score_category))

    next_user_id = None
    if position_tracking_model is None:
        # No rotation has started yet, start rotation at index 0.
        next_user_id = reviewer_ids[0]
    else:
        current_position_user_id = (
            position_tracking_model.current_position_in_rotation)

        for reviewer_id in reviewer_ids:
            if reviewer_id > current_position_user_id:
                next_user_id = reviewer_id
                break

        if next_user_id is None:
            # All names are lexicographically smaller than or equal to the
            # current position username. Hence, Rotating back to the front.
            next_user_id = reviewer_ids[0]

    update_position_in_rotation(score_category, next_user_id)
    return next_user_id


def update_position_in_rotation(score_category, user_id):
    """Updates the current position in the rotation to the given user_id.

    Args:
        score_category: str. The score category.
        user_id: str. The ID of the user who completed their turn in the
            rotation for the given category.
    """
    suggestion_models.ReviewerRotationTrackingModel.update_position_in_rotation(
        score_category, user_id)


def check_can_resubmit_suggestion(suggestion_id, user_id):
    """Checks whether the given user can resubmit the suggestion.

    Args:
        suggestion_id: str. The ID of the suggestion.
        user_id: str. The ID of the user.

    Returns:
        bool: Whether the user can resubmit the suggestion.
    """

    suggestion = get_suggestion_by_id(suggestion_id)

    return suggestion.author_id == user_id
