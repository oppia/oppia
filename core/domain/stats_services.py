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

import feconf
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


IMPROVE_TYPE_DEFAULT = 'default'
IMPROVE_TYPE_INCOMPLETE = 'incomplete'
SUBMIT_HANDLER_NAME = 'submit'

STATUS_FIXED = 'fixed'
STATUS_WILL_NOT_FIX = 'will_not_fix'


class EventHandler(object):
    """Records events."""

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
    def record_state_feedback_from_reader(
            cls, exploration_id, state_name, feedback, history, submitter_id):
        """Records user feedback for a particular state."""
        stats_domain.FeedbackItem.create_feedback_for_state(
            exploration_id, state_name, feedback,
            additional_data={'history': history}, submitter_id=submitter_id)

    @classmethod
    def record_exploration_feedback_from_reader(
            cls, exploration_id, feedback, history):
        """Records user feedback for a particular exploration."""
        stats_domain.FeedbackItem.create_feedback_for_exploration(
            exploration_id, feedback, additional_data={'history': history})

    @classmethod
    def resolve_feedback(cls, feedback_item_id, new_status):
        """Resolves a feedback item."""
        if new_status not in [STATUS_FIXED, STATUS_WILL_NOT_FIX]:
            raise Exception('Unexpected status: %s' % new_status)
        feedback_item = get_feedback_item_by_id(feedback_item_id)
        feedback_item.change_status(new_status)
        _save_feedback_item(feedback_item)


def get_unresolved_answers_for_default_rule(exploration_id, state_name):
    return stats_domain.StateRuleAnswerLog.get(
        exploration_id, state_name, SUBMIT_HANDLER_NAME,
        exp_domain.DEFAULT_RULESPEC_STR
    ).answers


def get_feedback_item_by_id(feedback_item_id, strict=True):
    """Returns a domain object representing a feedback item."""
    feedback_item_model = stats_models.FeedbackItemModel.get(
        feedback_item_id, strict=strict)
    if feedback_item_model:
        feedback_item = stats_domain.FeedbackItem(feedback_item_model)
        return feedback_item
    else:
        return None


def _save_feedback_item(feedback_item):
    """Commits a feedback item to persistent storage."""
    feedback_item_model = stats_models.FeedbackItemModel.get(
        feedback_item.id)

    feedback_item_model.target_id = feedback_item.target_id
    feedback_item_model.content = feedback_item.content
    feedback_item_model.additional_data = feedback_item.additional_data
    feedback_item_model.submitter_id = feedback_item.submitter_id
    feedback_item_model.status = feedback_item.status

    feedback_item_model.put()


def get_exploration_visit_count(exploration_id):
    """Returns the number of times this exploration has been accessed."""
    exploration = exp_services.get_exploration_by_id(exploration_id)
    return stats_domain.StateCounter.get(
        exploration_id, exploration.init_state_name).first_entry_count


def get_exploration_completed_count(exploration_id):
    """Returns the number of times this exploration has been completed."""
    # Note that the subsequent_entries_count for END_DEST should be 0.
    return stats_domain.StateCounter.get(
        exploration_id, feconf.END_DEST).first_entry_count


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
        } for rule_key in rule_keys]
    )

    results = {}
    for ind, answer_log in enumerate(answer_logs):
        results['.'.join(rule_keys[ind])] = {
            'answers': answer_log.get_top_answers(10),
            'rule_hits': answer_log.total_answer_count
        }

    return results

def get_user_stats(user_id):
    """Returns a dict with user statistics for a given user"""
    feedback = stats_domain.FeedbackItem.get_feedback_items_for_user(user_id)
    exp_ids = {}
    for k in feedback:
        exp_id = stats_domain.FeedbackItem.get_exploration_id_from_target_id(
            feedback[k]['target_id'])
        exp_ids[exp_id] = True
    exp_titles = exp_services.get_exploration_titles(exp_ids.keys())
    for k in feedback:
        target_id = feedback[k]['target_id']
        exp_id = stats_domain.FeedbackItem.get_exploration_id_from_target_id(
            target_id)
        state_name = stats_domain.FeedbackItem.get_state_name_from_target_id(
            target_id)
        feedback[k]['exp_id'] = exp_id
        feedback[k]['exp_title'] = exp_titles[exp_id]
        feedback[k]['state_name'] = state_name

    return {'feedback': feedback}

def get_exploration_info(exploration_id):
    """Returns statistics about an exploration for display.
    Includes state-specific flags and is planned to have other
    fields for statistics display on an exploration level."""
    exploration_annotations = stats_domain.ExplorationAnnotations.get(
        exploration_id)

    state_infos = {}
    for state_name in exploration_annotations.summarized_state_data:
        state_infos[state_name] = (
            exploration_annotations.summarized_state_data[state_name])

    # TODO(sfederwisch): add other fields, like completion rate
    # exploration_feedback, state hit counts and time stats
    exp_info = {
       'stateInfos': state_infos,
    }
    return exp_info

def get_state_stats_for_exploration(exploration_id):
    """Returns a dict with state statistics for the given exploration id."""
    exploration = exp_services.get_exploration_by_id(exploration_id)

    state_stats = {}
    for state_name in exploration.states:
        state_counts = stats_domain.StateCounter.get(
            exploration_id, state_name)

        feedback_items = (
            stats_domain.FeedbackItem.get_feedback_items_for_state(
                exploration_id, state_name))
        reader_feedback = {}
        for fi in feedback_items:
            reader_feedback[fi.id] = {
                'content': fi.content,
                'stateHistory': fi.additional_data.get('state_history')
            }

        first_entry_count = state_counts.first_entry_count
        total_entry_count = state_counts.total_entry_count

        state_stats[state_name] = {
            'name': state_name,
            'firstEntryCount': first_entry_count,
            'totalEntryCount': total_entry_count,
            'readerFeedback': reader_feedback,
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
    """Returns the top N improvable states across the given explorations.


    NOTE: This method is temporarily retired from the profile page controller
    until we can find a way to make it faster.
    """

    ranked_states = []
    for exploration_id in exploration_ids:
        exploration = exp_services.get_exploration_by_id(exploration_id)
        state_list = exploration.states.keys()

        answer_logs = stats_domain.StateRuleAnswerLog.get_multi(
            exploration_id, [{
                'state_name': state_name,
                'handler_name': SUBMIT_HANDLER_NAME,
                'rule_str': exp_domain.DEFAULT_RULESPEC_STR
            } for state_name in state_list]
        )

        for ind, state_name in enumerate(state_list):
            state_counts = stats_domain.StateCounter.get(
                exploration_id, state_name)
            default_rule_answer_log = answer_logs[ind]

            total_entry_count = state_counts.total_entry_count
            if total_entry_count == 0:
                continue

            default_count = default_rule_answer_log.total_answer_count
            no_answer_submitted_count = state_counts.no_answer_count

            eligible_flags = []

            state = exploration.states[state_name]
            if (default_count > 0.2 * total_entry_count and
                    state.widget.handlers[0].default_rule_spec.dest ==
                    state_name):
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
                'state_name': state_name,
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
