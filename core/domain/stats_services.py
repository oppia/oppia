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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.platform import models

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])

IMPROVE_TYPE_DEFAULT = 'default'
IMPROVE_TYPE_INCOMPLETE = 'incomplete'
# TODO(bhenning): Everything is handler name submit; therefore, it is
# pointless and should be removed.
_OLD_SUBMIT_HANDLER_NAME = 'submit'


def get_top_unresolved_answers_for_default_rule(exploration_id, state_name):
    return {
        answer: count for (answer, count) in
        stats_domain.StateRuleAnswerLog.get(
            exploration_id, state_name, exp_domain.DEFAULT_RULESPEC_STR
        ).get_top_answers(3)
    }


def get_state_rules_stats(exploration_id, state_name):
    """Gets statistics for the answer groups and rules of this state.

    Returns:
        A dict, keyed by the string '{HANDLER_NAME}.{RULE_STR}', whose
        values are the corresponding stats_domain.StateRuleAnswerLog
        instances.
    """
    exploration = exp_services.get_exploration_by_id(exploration_id)
    state = exploration.states[state_name]

    rule_keys = []
    for group in state.interaction.answer_groups:
        for rule in group.rule_specs:
            rule_keys.append((
                _OLD_SUBMIT_HANDLER_NAME, rule.stringify_classified_rule()))

    if state.interaction.default_outcome:
        rule_keys.append((
            _OLD_SUBMIT_HANDLER_NAME, exp_domain.DEFAULT_RULESPEC_STR))

    answer_logs = stats_domain.StateRuleAnswerLog.get_multi(
        exploration_id, [{
            'state_name': state_name,
            'rule_str': rule_key[1]
        } for rule_key in rule_keys])

    results = {}
    for ind, answer_log in enumerate(answer_logs):
        results['.'.join(rule_keys[ind])] = {
            'answers': answer_log.get_top_answers(5),
            'rule_hits': answer_log.total_answer_count
        }

    return results


def get_top_state_rule_answers(
        exploration_id, state_name, rule_str_list, top_answer_count_per_rule):
    """Returns a list of top answers (by submission frequency) submitted to the
    given state in the given exploration which were mapped to any of the rules
    listed in 'rule_str_list'. The number of answers returned is the number of
    rule spec strings based in multiplied by top_answer_count_per_rule.
    """
    answer_logs = stats_domain.StateRuleAnswerLog.get_multi(
        exploration_id, [{
            'state_name': state_name,
            'rule_str': rule_str
        } for rule_str in rule_str_list])

    all_top_answers = []
    for answer_log in answer_logs:
        top_answers = answer_log.get_top_answers(top_answer_count_per_rule)
        all_top_answers += [
            {'value': top_answer[0], 'count': top_answer[1]}
            for top_answer in top_answers
        ]
    return all_top_answers


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
            'rule_str': exp_domain.DEFAULT_RULESPEC_STR
        } for state_name in state_names])

    statistics = stats_jobs_continuous.StatisticsAggregator.get_statistics(
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
                state.interaction.default_outcome is not None and
                state.interaction.default_outcome.dest == state_name):
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

    return sorted([
        ranked_state for ranked_state in ranked_states
        if ranked_state['rank'] != 0
    ], key=lambda x: -x['rank'])


def get_versions_for_exploration_stats(exploration_id):
    """Returns list of versions for this exploration."""
    return stats_models.ExplorationAnnotationsModel.get_versions(
        exploration_id)


def get_total_unresolved_answers_for_exploration(exploration_id):
    """Returns the sum total of unresolved answers (across all states) of an
    exploration."""
    exploration = exp_services.get_exploration_by_id(exploration_id)
    state_names = exploration.states.keys()

    rules_list = []
    for state_name in state_names:
        rules_list.append({'state_name': state_name,
                           'rule_str': exp_domain.DEFAULT_RULESPEC_STR})
    return (sum(state_domain.total_answer_count for state_domain in
                stats_domain.StateRuleAnswerLog.get_multi(
                    exploration_id, rules_list)))


def get_exploration_stats(exploration_id, exploration_version):
    """Returns a dict with state statistics for the given exploration id.

    Note that exploration_version should be a string.
    """
    exploration = exp_services.get_exploration_by_id(exploration_id)
    exp_stats = stats_jobs_continuous.StatisticsAggregator.get_statistics(
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
