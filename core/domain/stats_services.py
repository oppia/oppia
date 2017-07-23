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

from core.domain import exp_services
from core.domain import interaction_registry
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.platform import models

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


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


def get_sample_answers(exploration_id, exploration_version, state_name):
    """Fetches a list of sample answers that were submitted to the specified
    exploration state (at the given version of the exploration).

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration to fetch
            answers for.
        state_name: str. The name of the state to fetch answers for.

    Returns:
        list(*). A list of some sample raw answers. At most 100 answers are
        returned.
    """
    answers_model = stats_models.StateAnswersModel.get_master_model(
        exploration_id, exploration_version, state_name)
    if answers_model is None:
        return []

    # Return at most 100 answers, and only answers from the initial shard. (If
    # we needed to use subsequent shards then the answers are probably too big
    # anyway.)
    sample_answers = answers_model.submitted_answer_list[:100]
    return [
        stats_domain.SubmittedAnswer.from_dict(submitted_answer_dict).answer
        for submitted_answer_dict in sample_answers]
