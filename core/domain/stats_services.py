# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

import feconf
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


IMPROVE_TYPE_DEFAULT = 'default'
IMPROVE_TYPE_INCOMPLETE = 'incomplete'
SUBMIT_HANDLER_NAME = 'submit'


class EventHandler(object):
    """Records events."""

    @classmethod
    def record_state_hit(cls, exploration_id, state_id, first_time):
        """Record an event when a state is encountered by the reader."""
        stats_models.StateCounterModel.inc(
            exploration_id, state_id, first_time)

    @classmethod
    def record_answer_submitted(
            cls, exploration_id, state_id, handler_name, rule_str, answer):
        """Records an event when an answer triggers a rule."""
        # TODO(sll): Escape these args?
        stats_models.process_submitted_answer(
            exploration_id, state_id, handler_name, rule_str, answer)

    @classmethod
    def resolve_answers_for_default_rule(
            cls, exploration_id, state_id, handler_name, answers):
        """Resolves a list of answers for the default rule of this state."""
        # TODO(sll): Escape these args?
        stats_models.resolve_answers(
            exploration_id, state_id, handler_name,
            exp_domain.DEFAULT_RULESPEC_STR, answers)

    @classmethod
    def record_state_feedback_from_reader(
            cls, exploration_id, state_id, history, feedback):
        """Records user feedback for a particular state."""
        stats_models.record_state_feedback_from_reader(
            exploration_id, state_id, history, feedback)


def get_exploration_visit_count(exploration_id):
    """Returns the number of times this exploration has been accessed."""
    exploration = exp_services.get_exploration_by_id(exploration_id)
    return stats_domain.StateCounter.get(
        exploration_id, exploration.init_state_id).first_entry_count


def get_exploration_completed_count(exploration_id):
    """Returns the number of times this exploration has been completed."""
    # Note that the subsequent_entries_count for END_DEST should be 0.
    return stats_domain.StateCounter.get(
        exploration_id, feconf.END_DEST).first_entry_count


def get_state_stats_for_exploration(exploration_id):
    """Returns a dict with state statistics for the given exploration id."""
    exploration = exp_services.get_exploration_by_id(exploration_id)

    state_stats = {}
    for state_id in exploration.state_ids:
        state_counts = stats_domain.StateCounter.get(exploration_id, state_id)
        first_entry_count = state_counts.first_entry_count
        total_entry_count = state_counts.total_entry_count

        state = exp_services.get_state_by_id(exploration_id, state_id)

        rule_stats = {}
        for handler in state.widget.handlers:
            for rule in handler.rule_specs:
                answer_log = stats_domain.StateRuleAnswerLog.get(
                    exploration_id, state.id, SUBMIT_HANDLER_NAME, str(rule))
                rule_stats['.'.join([SUBMIT_HANDLER_NAME, str(rule)])] = {
                    'answers': answer_log.get_top_answers(10),
                    # TODO(sll): This should be made more generic and the chart
                    # logic moved to the frontend.
                    'chartData': [
                        ['', 'This rule', 'Other answers'],
                        ['', answer_log.total_answer_count,
                         total_entry_count - answer_log.total_answer_count]
                    ]
                }

        state_stats[state_id] = {
            'name': state.name,
            'firstEntryCount': first_entry_count,
            'totalEntryCount': total_entry_count,
            'rule_stats': rule_stats,
            # Add information about resolved answers to the chart data.
            # TODO(sll): This should be made more generic and the chart logic
            # moved to the frontend.
            'no_answer_chartdata': [
                ['', 'No answer', 'Answer given'],
                ['',  state_counts.no_answer_count,
                 state_counts.active_answer_count]
            ]
        }

    return state_stats


def get_top_improvable_states(exploration_ids, N):
    """Returns the top N improvable states across all the given explorations."""

    ranked_states = []
    for exploration_id in exploration_ids:
        exploration = exp_services.get_exploration_by_id(exploration_id)
        for state_id in exploration.state_ids:
            state_counts = stats_domain.StateCounter.get(
                exploration_id, state_id)
            default_rule_answer_log = stats_domain.StateRuleAnswerLog.get(
                exploration.id, state_id, SUBMIT_HANDLER_NAME,
                exp_domain.DEFAULT_RULESPEC_STR)

            total_entry_count = state_counts.total_entry_count
            if total_entry_count == 0:
                continue

            default_count = default_rule_answer_log.total_answer_count
            no_answer_submitted_count = state_counts.no_answer_count

            eligible_flags = []

            state = exp_services.get_state_by_id(exploration_id, state_id)
            if (default_count > 0.2 * total_entry_count and
                    state.widget.handlers[0].default_rule_spec.dest ==
                    state.id):
                eligible_flags.append({
                    'rank': default_count,
                    'improve_type': IMPROVE_TYPE_DEFAULT})

            if no_answer_submitted_count > 0.2 * total_entry_count:
                eligible_flags.append({
                    'rank': no_answer_submitted_count,
                    'improve_type': IMPROVE_TYPE_INCOMPLETE})

            state_rank, improve_type = 0, ''
            if eligible_flags:
                eligible_flags = sorted(
                    eligible_flags, key=lambda flag: flag['rank'],
                    reverse=True)
                state_rank = eligible_flags[0]['rank']
                improve_type = eligible_flags[0]['improve_type']

            ranked_states.append({
                'exp_id': exploration_id,
                'exp_name': exploration.title,
                'state_id': state_id,
                'state_name': state.name,
                'rank': state_rank,
                'type': improve_type,
                'top_default_answers': default_rule_answer_log.get_top_answers(
                    5)
            })

    problem_states = sorted(
        [state for state in ranked_states if state['rank'] != 0],
        key=lambda state: state['rank'],
        reverse=True)
    return problem_states[:N]


def delete_all_stats():
    """Deletes all statistics."""
    stats_models.delete_all_stats()
