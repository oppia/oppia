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

"""Services for exploration-related statistics."""

__author__ = 'Sean Lip'

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import interaction_registry
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])

import itertools
import logging
import sys
import utils


# TODO(bhenning): Test.
def get_visualizations_info(exploration_id, state_name):
    """Returns a list of visualization info. Each item in the list is a dict
    with keys 'data' and 'options'.
    """
    exploration = exp_services.get_exploration_by_id(exploration_id)
    if exploration.states[state_name].interaction.id is None:
        return []

    visualizations = interaction_registry.Registry.get_interaction_by_id(
        exploration.states[state_name].interaction.id).answer_visualizations

    calculation_ids = set([
        visualization.calculation_id for visualization in visualizations])

    calculation_ids_to_outputs = {}
    for calculation_id in calculation_ids:
        # This is None if the calculation job has not yet been run for this
        # state.
        calc_output_domain_object = (
            stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output(
                exploration_id, state_name, calculation_id))

        # If the calculation job has not yet been run for this state, we simply
        # exclude the corresponding visualization results.
        if calc_output_domain_object is None:
            continue

        calculation_ids_to_outputs[calculation_id] = (
            calc_output_domain_object.calculation_output)

    results_list = [{
        'id': visualization.id,
        'data': calculation_ids_to_outputs[visualization.calculation_id],
        'options': visualization.options,
    } for visualization in visualizations if
        visualization.calculation_id in calculation_ids_to_outputs]

    return results_list


# TODO(bhenning): This needs to be thoroughly tested (similar to how the
# unresolved answers getter was before). It would be preferred if this were
# tested on a branch alongside these changes, then used to verify that these
# changes to do not change the contract of the function.
def get_top_state_rule_answers(
        exploration_id, state_name, classify_category_list,
        top_answer_count_per_category):
    """Returns a list of top answers (by submission frequency) submitted to the
    given state in the given exploration which were mapped to any of the rule
    classification categories listed in 'classify_category_list'.

    NOTE TO DEVELOPERS: Classification categories are stored upon answer
    submission, so the answers returned by this function may be stale and not
    evaluate in the same way as they did upon submission.
    """
    # TODO(bhenning): This should have a custom, continuous job (possibly as
    # part of the summarizers framework) which goes through all answers, finds
    # those which are not covered by hard rules or are not part of the training
    # data of soft rules, rank them by their frequency, then output them. This
    # output will have reasonably up-to-date answers which need to be resolved
    # by creators.
    job_result = (
        stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output(
            exploration_id, state_name, 'TopAnswersByCategorization'))
    if job_result:
        calc_output = job_result.calculation_output
        return list(itertools.chain.from_iterable(
            calc_output[category][:top_answer_count_per_category]
            for category in classify_category_list if category in calc_output))
    else:
        return []


def count_top_state_rule_answers(
        exploration_id, state_name, classification_category,
        top_answer_count_per_category):
    """Returns the number of answers that have been submitted to the specified
    state and exploration and have been classified as the specific
    classification category.
    """
    top_answers = get_top_state_rule_answers(
        exploration_id, state_name, [classification_category],
        top_answer_count_per_category)
    return sum([answer['frequency'] for answer in top_answers])


def get_versions_for_exploration_stats(exploration_id):
    """Returns list of versions for this exploration."""
    return stats_models.ExplorationAnnotationsModel.get_versions(
        exploration_id)


def get_exploration_stats(exploration_id, exploration_version):
    """Returns a dict with state statistics for the given exploration id.

    Note that exploration_version should be a string.
    """
    exploration = exp_services.get_exploration_by_id(exploration_id)
    exp_stats = stats_jobs_continuous.StatisticsAggregator.get_statistics(
        exploration_id, exploration_version)

    last_updated = exp_stats['last_updated']
    state_hit_counts = exp_stats['state_hit_counts']

    # TODO(bhenning): 'num_default_answers' isn't the true count, since the
    # number of top answers pulled from the data store needs to be fixed.
    # Figure out whether this is adequate or if we need to have another job
    # which simply counts all answers for a given category (doesn't seem like a
    # very useful calculation).
    return {
        'last_updated': last_updated,
        'num_completions': exp_stats['complete_exploration_count'],
        'num_starts': exp_stats['start_exploration_count'],
        'state_stats': {
            state_name: {
                'name': state_name,
                'first_entry_count': (
                    state_hit_counts[state_name]['first_entry_count']
                    if state_name in state_hit_counts else 0),
                'total_entry_count': (
                    state_hit_counts[state_name]['total_entry_count']
                    if state_name in state_hit_counts else 0),
                'no_submitted_answer_count': (
                    state_hit_counts[state_name].get('no_answer_count', 0)),
                'num_default_answers': count_top_state_rule_answers(
                    exploration_id, state_name,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION, 100),
            } for state_name in exploration.states
        },
    }


# TODO(bhenning): Test this.
def record_answer(exploration_id, exploration_version, state_name,
        answer_group_index, rule_spec_index, classification_categorization,
        session_id, time_spent_in_sec, params, normalized_answer):
    """Record an answer by storing it to the corresponding StateAnswers entity.
    """
    # Retrieve state_answers from storage
    state_answers = get_state_answers(
        exploration_id, exploration_version, state_name)

    # Get interaction id from state_answers if it is stored there or obtain it
    # from the exploration (note that if the interaction id of a state is
    # changed by editing the exploration then this will correspond to a new
    # version of the exploration, for which a new state_answers entity with
    # correct updated interaction_id will be created when the first answer is
    # recorded). If no answers have yet been recorded for the given exploration
    # ID, version, and state name, then interaction_id will be None here.
    interaction_id = state_answers.interaction_id if state_answers else None

    if not interaction_id:
        # Retrieve the interaction ID from the exploration itself.
        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=exploration_version)
        interaction_id = exploration.states[state_name].interaction.id

    # Construct answer_dict and validate it.
    answer_dict = {
        'answer': normalized_answer,
        'time_spent_in_sec': time_spent_in_sec,
        'answer_group_index': answer_group_index,
        'rule_spec_index': rule_spec_index,
        'classification_categorization': classification_categorization,
        'session_id': session_id,
        'interaction_id': interaction_id,
        'params': params
    }
    _validate_answer(answer_dict)

    # Add answer to state_answers (or create a new one) and commit it.
    if state_answers:
        state_answers.answers_list.append(answer_dict)
    else:
        state_answers = stats_domain.StateAnswers(
            exploration_id, exploration_version,
            state_name, interaction_id, [answer_dict])
    _save_state_answers(state_answers)


def _save_state_answers(state_answers):
    """Validate StateAnswers domain object and commit to storage."""

    state_answers.validate()
    state_answers_model = stats_models.StateAnswersModel.create_or_update(
        state_answers.exploration_id, state_answers.exploration_version,
        state_answers.state_name, state_answers.interaction_id,
        state_answers.answers_list)
    state_answers_model.save()


# TODO(bhenning): Test this.
def get_state_answers(exploration_id, exploration_version, state_name):
    """Get a state answers domain object represented by a StateAnswersModel
    instance stored in the data store and retrieved using the provided
    exploration ID, version, and state name.
    """
    state_answers_model = stats_models.StateAnswersModel.get_model(
        exploration_id, exploration_version, state_name)
    if state_answers_model:
        return stats_domain.StateAnswers(
            exploration_id, exploration_version, state_name,
            state_answers_model.interaction_id,
            state_answers_model.answers_list)
    else:
        return None


def _validate_answer(answer_dict):
    """Validate answer dicts. In particular, check the following:

    - Minimum set of keys: 'answer', 'time_spent_in_sec', 'session_id'
    - Check size of every answer
    - Check time_spent_in_sec is non-negative
    """

    # TODO(msl): These validation methods need tests to ensure that
    # the right errors show up in the various cases.

    # Minimum set of keys required for answer_dicts in answers_list
    REQUIRED_ANSWER_DICT_KEYS = ['answer', 'time_spent_in_sec', 'session_id']

    # There is a danger of data overflow if the answer log exceeds
    # 1 MB. Given 1000-5000 answers, each answer must be at most
    # 200-1000 bytes in size. We will address this later if it
    # happens regularly. At the moment, a ValidationError is raised if
    # an answer exceeds the maximum size.
    MAX_BYTES_PER_ANSWER = 500

    # Prefix of strings that are cropped because they are too long.
    CROPPED_PREFIX_STRING = 'CROPPED: '
    # Answer value that is stored if non-string answer is too big
    PLACEHOLDER_FOR_TOO_LARGE_NONSTRING = 'TOO LARGE NONSTRING'

    # check type is dict
    if not isinstance(answer_dict, dict):
        raise utils.ValidationError(
            'Expected answer_dict to be a dict, received %s' %
            answer_dict)

    # check keys
    required_keys = set(REQUIRED_ANSWER_DICT_KEYS)
    actual_keys = set(answer_dict.keys())
    if not required_keys.issubset(actual_keys):
        missing_keys = required_keys.difference(actual_keys)
        raise utils.ValidationError(
            'answer_dict is missing required keys %s' % missing_keys)

    # check entries of answer_dict
    if (sys.getsizeof(answer_dict['answer']) >
            MAX_BYTES_PER_ANSWER):

        if type(answer_dict['answer']) == str:
            logging.warning(
                'answer is too big to be stored: %s ...' %
                str(answer_dict['answer'][:MAX_BYTES_PER_ANSWER]))
            answer_dict['answer'] = '%s%s ...' % (CROPPED_PREFIX_STRING,
                str(answer_dict['answer'][:MAX_BYTES_PER_ANSWER]))
        else:
            logging.warning('answer is too big to be stored')
            answer_dict['answer'] = PLACEHOLDER_FOR_TOO_LARGE_NONSTRING

    if not isinstance(answer_dict['session_id'], basestring):
        raise utils.ValidationError(
            'Expected session_id to be a string, received %s' %
            str(answer_dict['session_id']))

    if not isinstance(answer_dict['time_spent_in_sec'], float):
        raise utils.ValidationError(
            'Expected time_spent_in_sec to be a float, received %s' %
            str(answer_dict['time_spent_in_sec']))

    if answer_dict['time_spent_in_sec'] < 0.:
        raise utils.ValidationError(
            'Expected time_spent_in_sec to be non-negative, received %f' %
            answer_dict['time_spent_in_sec'])

