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

import logging
import sys
import utils

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])
import feconf


IMPROVE_TYPE_DEFAULT = 'default'
IMPROVE_TYPE_INCOMPLETE = 'incomplete'


def get_top_unresolved_answers_for_default_rule(exploration_id, state_name):
    return {
        answer: count for (answer, count) in
        stats_domain.StateRuleAnswerLog.get(
            exploration_id, state_name, feconf.SUBMIT_HANDLER_NAME,
            exp_domain.DEFAULT_RULESPEC_STR
        ).get_top_answers(3)
    }


def get_state_rules_stats(exploration_id, state_name):
    """Gets statistics for the handlers and rules of this state.

    Returns:
        A dict, keyed by the string '{HANDLER_NAME}.{RULE_STR}', whose
        values are the corresponding stats_domain.StateRuleAnswerLog
        instances.
    """
    exploration = exp_services.get_exploration_by_id(exploration_id)
    state = exploration.states[state_name]

    rule_keys = []
    for handler in state.interaction.handlers:
        for rule in handler.rule_specs:
            rule_keys.append((handler.name, str(rule)))

    answer_logs = stats_domain.StateRuleAnswerLog.get_multi(
        exploration_id, [{
            'state_name': state_name,
            'handler_name': rule_key[0],
            'rule_str': rule_key[1]
        } for rule_key in rule_keys])

    results = {}
    for ind, answer_log in enumerate(answer_logs):
        results['.'.join(rule_keys[ind])] = {
            'answers': answer_log.get_top_answers(5),
            'rule_hits': answer_log.total_answer_count
        }

    return results


def get_state_improvements(exploration_id, exploration_version):
    """Returns a list of dicts, each representing a suggestion for improvement
    to a particular state.
    """
    ranked_states = []

    exploration = exp_services.get_exploration_by_id(exploration_id)
    state_names = exploration.states.keys()

    default_rule_answer_logs = stats_domain.StateRuleAnswerLog.get_multi(
        exploration_id, [{
            'state_name': state_name,
            'handler_name': feconf.SUBMIT_HANDLER_NAME,
            'rule_str': exp_domain.DEFAULT_RULESPEC_STR
        } for state_name in state_names])

    statistics = stats_jobs.StatisticsAggregator.get_statistics(
        exploration_id, exploration_version)
    state_hit_counts = statistics['state_hit_counts']

    for ind, state_name in enumerate(state_names):
        total_entry_count = 0
        no_answer_submitted_count = 0
        if state_name in state_hit_counts:
            total_entry_count = (
                state_hit_counts[state_name]['total_entry_count'])
            no_answer_submitted_count = state_hit_counts[state_name].get(
                'no_answer_count', 0)

        if total_entry_count == 0:
            continue

        threshold = 0.2 * total_entry_count
        default_rule_answer_log = default_rule_answer_logs[ind]
        default_count = default_rule_answer_log.total_answer_count

        eligible_flags = []
        state = exploration.states[state_name]
        if (default_count > threshold and
                state.interaction.handlers[0].default_rule_spec.dest
                == state_name):
            eligible_flags.append({
                'rank': default_count,
                'improve_type': IMPROVE_TYPE_DEFAULT})
        if no_answer_submitted_count > threshold:
            eligible_flags.append({
                'rank': no_answer_submitted_count,
                'improve_type': IMPROVE_TYPE_INCOMPLETE})

        if eligible_flags:
            eligible_flags = sorted(
                eligible_flags, key=lambda flag: flag['rank'], reverse=True)
            ranked_states.append({
                'rank': eligible_flags[0]['rank'],
                'state_name': state_name,
                'type': eligible_flags[0]['improve_type'],
            })

    return sorted(
        [state for state in ranked_states if state['rank'] != 0],
        key=lambda x: -x['rank'])


def get_versions_for_exploration_stats(exploration_id):
    """Returns list of versions for this exploration."""
    return stats_models.ExplorationAnnotationsModel.get_versions(
        exploration_id)


def get_exploration_stats(exploration_id, exploration_version):
    """Returns a dict with state statistics for the given exploration id.

    Note that exploration_version should be a string.
    """
    exploration = exp_services.get_exploration_by_id(exploration_id)
    exp_stats = stats_jobs.StatisticsAggregator.get_statistics(
        exploration_id, exploration_version)

    last_updated = exp_stats['last_updated']
    state_hit_counts = exp_stats['state_hit_counts']

    return {
        'improvements': get_state_improvements(
             exploration_id, exploration_version),
        'last_updated': last_updated,
        'num_completions': exp_stats['complete_exploration_count'],
        'num_starts': exp_stats['start_exploration_count'],
        'state_stats': {
            state_name: {
                'name': state_name,
                'firstEntryCount': (
                    state_hit_counts[state_name]['first_entry_count']
                    if state_name in state_hit_counts else 0),
                'totalEntryCount': (
                    state_hit_counts[state_name]['total_entry_count']
                    if state_name in state_hit_counts else 0),
            } for state_name in exploration.states
        },
    }


def record_answer(exploration_id, exploration_version, state_name,
                  handler_name, session_id, time_spent, params, 
                  answer_string):
    """
    Record an answer by storing it to the corresponding StateAnswers entity.
    """
    # Retrieve state_answers from storage
    state_answers = get_state_answers(
        exploration_id, exploration_version, state_name)

    # Get interaction id from state_answers if it is stored there or
    # obtain it from the exploration (note that if the interaction id 
    # of a state is changed by editing the exploration then this will
    # correspond to a new version of the exploration, for which a new
    # state_answers entity with correct updated interaction_id will
    # be created when the first answer is recorded).
    # If no interaction id exists, use None as placeholder.
    interaction_id = None
    if not state_answers is None:
        interaction_id = state_answers.interaction_id

    if interaction_id is None:
        # retrieve exploration and read its interaction id
        exploration = exp_services.get_exploration_by_id(
            exploration_id, version=exploration_version)
        if exploration.states[state_name].interaction.id:
            interaction_id = exploration.states[state_name].interaction.id

    # Construct answer_dict and validate it
    answer_dict = {'answer_string': answer_string, 
                   'time_taken_to_answer': time_spent,
                   'session_id': session_id,
                   'handler_name': handler_name,
                   'interaction_id': interaction_id,
                   'params': params}
    validate_answer(answer_dict)

    # Add answer to state_answers and commit to storage
    if state_answers:
        state_answers.answers_list.append(answer_dict)
    else:
        state_answers = stats_domain.StateAnswers(
            exploration_id, exploration_version, 
            state_name, interaction_id, [answer_dict])
    save_state_answers(state_answers)


def save_state_answers(state_answers):
    """
    Validate StateAnswers domain object and commit to storage.
    """
    stats_domain.StateAnswers.validate(state_answers)
    state_answers_model = stats_models.StateAnswersModel.create_or_update(
        state_answers.exploration_id, state_answers.exploration_version, 
        state_answers.state_name, state_answers.interaction_id, 
        state_answers.answers_list)
    state_answers_model.save()


def get_state_answers(exploration_id, exploration_version, state_name):
    """
    Get state answers domain object obtained from 
    StateAnswersModel instance stored in data store.
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


def get_answer_summarizers_outputs(
        exploration_id, exploration_version, state_name):
    """
    Get state answers calculation output domain object obtained from 
    StateAnswersCalcOutputModel instance stored in data store.
    """
    
    calc_output_model = stats_models.StateAnswersCalcOutputModel.get_model(
        exploration_id, exploration_version, state_name)
    if calc_output_model:
        return stats_domain.StateAnswersCalcOutput(
            exploration_id, exploration_version, state_name,
            calc_output_model.calculation_outputs)
    else:
        return None


def validate_answer(answer_dict):

    # Minimum set of keys required for answer_dicts in answers_list
    REQUIRED_ANSWER_DICT_KEYS = ['answer_string', 'time_taken_to_answer',
                                 'session_id']

    # There is a danger of data overflow if the answer log exceeds
    # 1 MB. Given 1000-5000 answers, each answer must be at most
    # 200-1000 bytes in size. We will address this later if it
    # happens regularly. At the moment, a ValidationError is raised if
    # an answer exceeds the maximum size.
    MAX_BYTES_PER_ANSWER_STRING = 500

    # check type is dict
    if not isinstance(answer_dict, dict):
        raise utils.ValidationError(
            'Expected answer_dict to be a dict, received %s' %
            answer_dict)

    # check keys
    required_keys = set(REQUIRED_ANSWER_DICT_KEYS)
    actual_keys = set(answer_dict.keys())
    if not required_keys.issubset(actual_keys):
        # find missing keys
        missing_keys = required_keys.difference(actual_keys)
        raise utils.ValidationError(
            ('answer_dict misses required keys %s' % missing_keys))

    # check values of answer_dict
    if not isinstance(answer_dict['answer_string'], basestring):
        raise utils.ValidationError(
            'Expected answer_string to be a string, received %s' %
            answer_dict['answer_string'])

    if not (sys.getsizeof(answer_dict['answer_string']) <= 
            MAX_BYTES_PER_ANSWER_STRING):
        logging.warning(
            'answer_string is too big to be stored: %s ...' %
            answer_dict['answer_string'][:MAX_BYTES_PER_ANSWER_STRING])
        answer_dict['answer_string'] = (
            'CROPPED BECAUSE TOO LONG: %s ...' % 
            answer_dict['answer_string'][:MAX_BYTES_PER_ANSWER_STRING])

    if not isinstance(answer_dict['session_id'], basestring):
        raise utils.ValidationError(
            'Expected session_id to be a string, received %s' %
            answer_dict['session_id'])

    if not isinstance(answer_dict['time_taken_to_answer'], float):
        raise utils.ValidationError(
            'Expected time_taken_to_answer to be a float, received %s' %
            answer_dict['time_taken_to_answer'])
