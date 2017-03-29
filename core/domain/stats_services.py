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

import itertools

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import interaction_registry
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.platform import models

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


def get_exps_unresolved_answers_for_default_rule(exp_ids):
    """Gets unresolved answers per exploration for default rule across all
    states for explorations with ids in exp_ids. The value of total count should
    match the sum of values of indiviual counts for each unresolved answer.

    TODO(526avijitgupta): Note that this method currently returns the data only
    for the DEFAULT rule. This should ideally handle all types of unresolved
    answers.

    Returns a dict of the following format:
        {
          'exp_id_1': {
            'frequency': 7 (number of unresolved answers for this exploration),
            'unresolved_answers': (list of unresolved answers sorted by count)
              [
                {'frequency': 4, 'answer': 'answer_1', 'state': 'Introduction'},
                {'frequency': 2, 'answer': 'answer_2', 'state': 'Introduction'},
                {'frequency': 1, 'answer': 'answer_3', 'state': 'End'}
              ]
          },
          'exp_id_2': {
            'frequency': 13,
            'unresolved_answers':
              [
                {'frequency': 8, 'answer': 'answer_5', 'state': 'Introduction'},
                {'frequency': 3, 'answer': 'answer_4', 'state': 'Quest'},
                {'frequency': 1, 'answer': 'answer_6', 'state': 'End'}
                {'frequency': 1, 'answer': 'answer_8', 'state': 'End'}
              ]
          }
        }
    """
    def _get_explorations_states_tuples_by_ids(exp_ids):
        """Returns a list of all (exp_id, state_name) tuples for the given
        exp_ids.
        E.g. - [
          ('eid1', 'Introduction'),
          ('eid1', 'End'),
          ('eid2', 'Introduction'),
          ('eid3', 'Introduction')
        ]
        when exp_ids = ['eid1', 'eid2', 'eid3'].
        """
        explorations = (
            exp_services.get_multiple_explorations_by_id(exp_ids, strict=False))
        return [
            (exploration.id, state_name)
            for exploration in explorations.values()
            for state_name in exploration.states
        ]

    explorations_states_tuples = _get_explorations_states_tuples_by_ids(exp_ids)
    exploration_states_answers_list = get_top_state_rule_answers_multi(
        explorations_states_tuples, [exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
    exps_answers_mapping = {}

    for ind, statewise_answers in enumerate(exploration_states_answers_list):
        exp_id = explorations_states_tuples[ind][0]
        if exp_id not in exps_answers_mapping:
            exps_answers_mapping[exp_id] = {
                'frequency': 0,
                'unresolved_answers': []
            }
        for answer in statewise_answers:
            exps_answers_mapping[exp_id]['frequency'] += answer['frequency']
            answer['state'] = explorations_states_tuples[ind][1]

        exps_answers_mapping[exp_id]['unresolved_answers'].extend(
            statewise_answers)

    for exp_id in exps_answers_mapping:
        exps_answers_mapping[exp_id]['unresolved_answers'] = (sorted(
            exps_answers_mapping[exp_id]['unresolved_answers'],
            key=lambda a: a['frequency'],
            reverse=True))

    return exps_answers_mapping


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
            stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                exploration_id, state_name, calculation_id))

        # If the calculation job has not yet been run for this state, we simply
        # exclude the corresponding visualization results.
        if calc_output_domain_object is None:
            continue

        calculation_ids_to_outputs[calculation_id] = (
            calc_output_domain_object.calculation_output)

    return [{
        'id': visualization.id,
        'data': calculation_ids_to_outputs[visualization.calculation_id],
        'options': visualization.options,
    } for visualization in visualizations
            if visualization.calculation_id in calculation_ids_to_outputs]


def get_top_state_rule_answers(
        exploration_id, state_name, classify_category_list):
    """Returns a list of top answers (sorted by submission frequency) submitted
    to the given state in the given exploration which were mapped to any of the
    rule classification categories listed in 'classify_category_list'. See
    exp_domain for the list of available classification categories (e.g.
    exp_domain.EXPLICIT_CLASSIFICATION). All answers submitted to the specified
    state that match the rule spec strings in rule_str_list are returned.
    """
    return get_top_state_rule_answers_multi(
        [(exploration_id, state_name)], classify_category_list)[0]


def get_top_state_rule_answers_multi(
        exploration_state_list, classify_category_list):
    """Returns a list of top answers (sorted by submission frequency) submitted
    to the given explorations and states which were mapped to any of the rule
    classification categories listed in 'classify_category_list'. See exp_domain
    for the list of available classification categories (e.g.
    exp_domain.EXPLICIT_CLASSIFICATION).

    NOTE TO DEVELOPERS: Classification categories are stored upon answer
    submission, so the answers returned by this function may be stale and not
    evaluate in the same way as they did upon submission since some of the
    answers may have been submitted to older versions of the exploration or the
    exploration's training models may have been recomputed.

    Also note that this function involves a O(N^2) operation based on the number
    of answers which match the input criteria (which can be quite large).
    """
    # TODO(bhenning): This should have a custom, continuous job (possibly as
    # part of the summarizers framework) which goes through all answers, finds
    # those which are not covered by hard rules or are not part of the training
    # data of soft rules, rank them by their frequency, then output them. This
    # output will have reasonably up-to-date answers which need to be resolved
    # by creators.
    answer_lists = []
    for exploration_id, state_name in exploration_state_list:
        job_result = (
            stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                exploration_id, state_name, 'TopAnswersByCategorization'))
        if job_result:
            calc_output = job_result.calculation_output
            answer_list = list(itertools.chain.from_iterable(
                calc_output[category]
                for category in classify_category_list
                if category in calc_output))

            # If the answer_list includes similar answers matching multiple
            # categories, those answers should be de-duplicated.
            # TODO(bhenning): Make this better than O(N^2); probably better just
            # to implement the job described above.
            combined_answer_list = [
                {'answer': answer['answer'], 'frequency': 0}
                for answer in answer_list]
            for answer in answer_list:
                for combined_answer in combined_answer_list:
                    if answer['answer'] == combined_answer['answer']:
                        combined_answer['frequency'] += answer['frequency']
                        break
            # Remove answers which are duplicated (have zero frequency)
            reduced_answer_list = [
                {'answer': answer['answer'], 'frequency': answer['frequency']}
                for answer in combined_answer_list if answer['frequency'] > 0]

            answer_lists.append(sorted(
                reduced_answer_list,
                cmp=lambda x, y: y['frequency'] - x['frequency']))
        else:
            answer_lists.append([])
    return answer_lists


def count_top_state_rule_answers(
        exploration_id, state_name, classification_category):
    """Returns the number of answers that have been submitted to the specified
    state and exploration and have been classified as the specific
    classification category.
    """
    top_answers = get_top_state_rule_answers(
        exploration_id, state_name, [classification_category])
    return sum([answer['frequency'] for answer in top_answers])


# TODO(bhenning): Test
def get_versions_for_exploration_stats(exploration_id):
    """Returns list of versions for this exploration."""
    return stats_models.ExplorationAnnotationsModel.get_versions(
        exploration_id)


# TODO(bhenning): Test
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
                    state_hit_counts[state_name].get('no_answer_count', 0)
                    if state_name in state_hit_counts else 0),
                'num_default_answers': count_top_state_rule_answers(
                    exploration_id, state_name,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            } for state_name in exploration.states
        },
    }


def record_answer(
        exploration_id, exploration_version, state_name, interaction_id,
        submitted_answer):
    """Record an answer by storing it to the corresponding StateAnswers entity.
    """
    record_answers(
        exploration_id, exploration_version, state_name, interaction_id,
        [submitted_answer])


def record_answers(
        exploration_id, exploration_version, state_name, interaction_id,
        submitted_answer_list):
    """Optimally record a group of answers using an already loaded exploration..
    The submitted_answer_list is a list of SubmittedAnswer domain objects.
    """
    state_answers = stats_domain.StateAnswers(
        exploration_id, exploration_version, state_name, interaction_id,
        submitted_answer_list)
    for submitted_answer in submitted_answer_list:
        submitted_answer.validate()

    stats_models.StateAnswersModel.insert_submitted_answers(
        state_answers.exploration_id, state_answers.exploration_version,
        state_answers.state_name, state_answers.interaction_id,
        state_answers.get_submitted_answer_dict_list())


def get_state_answers(exploration_id, exploration_version, state_name):
    """Returns a StateAnswers object containing all answers associated with the
    specified exploration state, or None if no such answers have yet been
    submitted.
    """
    state_answers_models = stats_models.StateAnswersModel.get_all_models(
        exploration_id, exploration_version, state_name)
    if state_answers_models:
        main_state_answers_model = state_answers_models[0]
        submitted_answer_dict_list = itertools.chain.from_iterable([
            state_answers_model.submitted_answer_list
            for state_answers_model in state_answers_models])
        return stats_domain.StateAnswers(
            exploration_id, exploration_version, state_name,
            main_state_answers_model.interaction_id,
            [stats_domain.SubmittedAnswer.from_dict(submitted_answer_dict)
             for submitted_answer_dict in submitted_answer_dict_list],
            schema_version=main_state_answers_model.schema_version)
    else:
        return None
