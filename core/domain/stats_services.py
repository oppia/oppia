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
from core.domain import stats_domain
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


IMPROVE_TYPE_DEFAULT = 'default'
IMPROVE_TYPE_INCOMPLETE = 'incomplete'
SUBMIT_HANDLER_NAME = 'submit'


class EventHandler(object):
    """Records analytics events."""

    @classmethod
    def record_state_hit(cls, exploration_id, state_name, first_time):
        """Record an event when a state is encountered by the reader."""
        stats_models.StateCounterModel.inc(
            exploration_id, state_name, first_time)

    @classmethod
    def record_answer_submitted(
            cls, exploration_id, exploration_version, state_name,
            handler_name, rule, answer):
        """Records an event when an answer triggers a rule."""
        # TODO(sll): Escape these args?
        stats_models.process_submitted_answer(
            exploration_id, exploration_version, state_name,
            handler_name, rule, answer)

    @classmethod
    def resolve_answers_for_default_rule(
            cls, exploration_id, state_name, handler_name, answers):
        """Resolves a list of answers for the default rule of this state."""
        # TODO(sll): Escape these args?
        stats_models.resolve_answers(
            exploration_id, state_name, handler_name,
            exp_domain.DEFAULT_RULESPEC_STR, answers)

    @classmethod
    def start_exploration(cls, exp_id, exp_version, state_name, session_id,
                          params, play_type):
        stats_models.StartExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, params,
            play_type)

    @classmethod
    def maybe_leave_exploration(
            cls, exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type):
        stats_models.MaybeLeaveExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


def get_top_unresolved_answers_for_default_rule(exploration_id, state_name):
    return {
        answer: count for (answer, count) in
        stats_domain.StateRuleAnswerLog.get(
            exploration_id, state_name, SUBMIT_HANDLER_NAME,
            exp_domain.DEFAULT_RULESPEC_STR
        ).get_top_answers(10)
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
    for handler in state.widget.handlers:
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


def get_exploration_annotations(exp_id):
    exp_annotations = stats_models.ExplorationAnnotationsModel.get(
        exp_id, strict=False)
    if not exp_annotations:
        exp_annotations = stats_models.ExplorationAnnotationsModel(
            id=exp_id, num_visits=0, num_completions=0)
    return exp_annotations


def get_state_stats_for_exploration(exploration_id):
    """Returns a dict with state statistics for the given exploration id."""
    exploration = exp_services.get_exploration_by_id(exploration_id)

    state_stats = {}
    for state_name in exploration.states:
        state_counts = stats_domain.StateCounter.get(
            exploration_id, state_name)

        state_stats[state_name] = {
            'name': state_name,
            'firstEntryCount': state_counts.first_entry_count,
            'totalEntryCount': state_counts.total_entry_count,
        }

    return state_stats


def get_state_improvements(exploration_id):
    """Returns a list of dicts, each representing a suggestion for improvement
    to a particular state.
    """
    ranked_states = []

    exploration = exp_services.get_exploration_by_id(exploration_id)
    state_list = exploration.states.keys()

    default_rule_answer_logs = stats_domain.StateRuleAnswerLog.get_multi(
        exploration_id, [{
            'state_name': state_name,
            'handler_name': SUBMIT_HANDLER_NAME,
            'rule_str': exp_domain.DEFAULT_RULESPEC_STR
        } for state_name in state_list])

    for ind, state_name in enumerate(state_list):
        state_counts = stats_domain.StateCounter.get(
            exploration_id, state_name)
        total_entry_count = state_counts.total_entry_count
        if total_entry_count == 0:
            continue

        threshold = 0.2 * total_entry_count
        default_rule_answer_log = default_rule_answer_logs[ind]
        default_count = default_rule_answer_log.total_answer_count
        no_answer_submitted_count = state_counts.no_answer_count

        eligible_flags = []
        state = exploration.states[state_name]
        if (default_count > threshold and
                state.widget.handlers[0].default_rule_spec.dest == state_name):
            eligible_flags.append({
                'rank': default_count,
                'improve_type': IMPROVE_TYPE_DEFAULT})
        if no_answer_submitted_count > threshold:
            eligible_flags.append({
                'rank': no_answer_submitted_count,
                'improve_type': IMPROVE_TYPE_INCOMPLETE})

        state_rank, improve_type = 0, ''
        if eligible_flags:
            eligible_flags = sorted(
                eligible_flags, key=lambda flag: flag['rank'],
                reverse=True)
            ranked_states.append({
                'rank': eligible_flags[0]['rank'],
                'state_name': state_name,
                'type': eligible_flags[0]['improve_type'],
            })

    return sorted(
        [state for state in ranked_states if state['rank'] != 0],
        key=lambda x: -x['rank'])
