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
from core.domain import interaction_registry
from core.domain import stats_domain
from core.platform import models
import feconf

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])
transaction_services = models.Registry.import_transaction_services()


# Counts contributions from all versions.
VERSION_ALL = 'all'


def get_exploration_stats(exp_id, exp_version):
    """Retrieves the ExplorationStats domain instance.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.

    Returns:
        ExplorationStats. The exploration stats domain object.
    """
    exploration_stats = get_exploration_stats_by_id(exp_id, exp_version)

    if exploration_stats is None:
        exploration_stats = stats_domain.ExplorationStats.create_default(
            exp_id, exp_version, {})

    return exploration_stats


def update_stats(exp_id, exp_version, aggregated_stats):
    """Updates ExplorationStatsModel according to the dict containing aggregated
    stats.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        aggregated_stats: dict. Dict representing an ExplorationStatsModel
            instance with stats aggregated in the frontend.
    """
    exploration_stats = get_exploration_stats_by_id(
        exp_id, exp_version)

    exploration_stats.num_starts_v2 += aggregated_stats['num_starts']
    exploration_stats.num_completions_v2 += aggregated_stats['num_completions']
    exploration_stats.num_actual_starts_v2 += aggregated_stats[
        'num_actual_starts']

    for state_name in aggregated_stats['state_stats_mapping']:
        exploration_stats.state_stats_mapping[
            state_name].total_answers_count_v2 += aggregated_stats[
                'state_stats_mapping'][state_name]['total_answers_count']
        exploration_stats.state_stats_mapping[
            state_name].useful_feedback_count_v2 += aggregated_stats[
                'state_stats_mapping'][state_name]['useful_feedback_count']
        exploration_stats.state_stats_mapping[
            state_name].total_hit_count_v2 += aggregated_stats[
                'state_stats_mapping'][state_name]['total_hit_count']
        exploration_stats.state_stats_mapping[
            state_name].first_hit_count_v2 += aggregated_stats[
                'state_stats_mapping'][state_name]['first_hit_count']
        exploration_stats.state_stats_mapping[
            state_name].num_times_solution_viewed_v2 += aggregated_stats[
                'state_stats_mapping'][state_name]['num_times_solution_viewed']
        exploration_stats.state_stats_mapping[
            state_name].num_completions_v2 += aggregated_stats[
                'state_stats_mapping'][state_name]['num_completions']

    save_stats_model_transactional(exploration_stats)


def handle_stats_creation_for_new_exploration(exp_id, exp_version, state_names):
    """Creates ExplorationStatsModel for the freshly created exploration and
    sets all initial values to zero.

    Args:
        exp_id: str. ID of the exploration.
        exp_version. int. Version of the exploration.
        state_names: list(str). State names of the exploration.
    """
    state_stats_mapping = {
        state_name: stats_domain.StateStats.create_default()
        for state_name in state_names
    }

    exploration_stats = stats_domain.ExplorationStats.create_default(
        exp_id, exp_version, state_stats_mapping)
    create_stats_model(exploration_stats)


def handle_stats_creation_for_new_exp_version(
        exp_id, exp_version, state_names, change_list):
    """Retrieves the ExplorationStatsModel for the old exp_version and makes
    any required changes to the structure of the model. Then, a new
    ExplorationStatsModel is created for the new exp_version.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        state_names: list(str). State names of the exploration.
        change_list: list(dict). A list of changes introduced in this commit.
    """
    old_exp_version = exp_version - 1
    new_exp_version = exp_version
    exploration_stats = get_exploration_stats_by_id(
        exp_id, old_exp_version)
    if exploration_stats is None:
        handle_stats_creation_for_new_exploration(
            exp_id, new_exp_version, state_names)
        return

    # Handling state additions, deletions and renames.
    for change_dict in change_list:
        if change_dict['cmd'] == exp_domain.CMD_ADD_STATE:
            exploration_stats.state_stats_mapping[change_dict[
                'state_name']] = stats_domain.StateStats.create_default()
        elif change_dict['cmd'] == exp_domain.CMD_DELETE_STATE:
            exploration_stats.state_stats_mapping.pop(change_dict[
                'state_name'])
        elif change_dict['cmd'] == exp_domain.CMD_RENAME_STATE:
            exploration_stats.state_stats_mapping[change_dict[
                'new_state_name']] = exploration_stats.state_stats_mapping.pop(
                    change_dict['old_state_name'])

    exploration_stats.exp_version = new_exp_version

    # Create new statistics model.
    create_stats_model(exploration_stats)


def get_exploration_stats_by_id(exp_id, exp_version):
    """Retrieves the ExplorationStats domain object.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.

    Returns:
        ExplorationStats. The domain object for exploration statistics.

    Raises:
        Exception: Entity for class ExplorationStatsModel with id not found.
    """
    exploration_stats = None
    exploration_stats_model = stats_models.ExplorationStatsModel.get_model(
        exp_id, exp_version)
    if exploration_stats_model is not None:
        exploration_stats = get_exploration_stats_from_model(
            exploration_stats_model)
    return exploration_stats


def get_multiple_exploration_stats_by_version(exp_id, version_numbers):
    """Returns a list of ExplorationStats domain objects corresponding to the
    specified versions.

    Args:
        exp_id: str. ID of the exploration.
        version_numbers: list(int). List of version numbers.

    Returns:
        list(ExplorationStats|None). List of ExplorationStats domain class
            instances.
    """
    exploration_stats = []
    exploration_stats_models = (
        stats_models.ExplorationStatsModel.get_multi_versions(
            exp_id, version_numbers))
    for exploration_stats_model in exploration_stats_models:
        if exploration_stats_model is None:
            exploration_stats.append(None)
        else:
            exploration_stats.append(get_exploration_stats_from_model(
                exploration_stats_model))
    return exploration_stats


def get_exploration_stats_from_model(exploration_stats_model):
    """Gets an ExplorationStats domain object from an ExplorationStatsModel
    instance.

    Args:
        exploration_stats_model: ExplorationStatsModel. Exploration statistics
            model in datastore.

    Returns:
        ExplorationStats. The domain object for exploration statistics.
    """
    new_state_stats_mapping = {
        state_name: stats_domain.StateStats.from_dict(
            exploration_stats_model.state_stats_mapping[state_name])
        for state_name in exploration_stats_model.state_stats_mapping
    }
    return stats_domain.ExplorationStats(
        exploration_stats_model.exp_id,
        exploration_stats_model.exp_version,
        exploration_stats_model.num_starts_v1,
        exploration_stats_model.num_starts_v2,
        exploration_stats_model.num_actual_starts_v1,
        exploration_stats_model.num_actual_starts_v2,
        exploration_stats_model.num_completions_v1,
        exploration_stats_model.num_completions_v2,
        new_state_stats_mapping)


def create_stats_model(exploration_stats):
    """Creates an ExplorationStatsModel in datastore given an ExplorationStats
    domain object.

    Args:
        exploration_stats: ExplorationStats. The domain object for exploration
            statistics.

    Returns:
        str. ID of the datastore instance for ExplorationStatsModel.
    """
    new_state_stats_mapping = {
        state_name: exploration_stats.state_stats_mapping[state_name].to_dict()
        for state_name in exploration_stats.state_stats_mapping
    }
    instance_id = stats_models.ExplorationStatsModel.create(
        exploration_stats.exp_id,
        exploration_stats.exp_version,
        exploration_stats.num_starts_v1,
        exploration_stats.num_starts_v2,
        exploration_stats.num_actual_starts_v1,
        exploration_stats.num_actual_starts_v2,
        exploration_stats.num_completions_v1,
        exploration_stats.num_completions_v2,
        new_state_stats_mapping
    )
    return instance_id


def _save_stats_model(exploration_stats):
    """Updates the ExplorationStatsModel datastore instance with the passed
    ExplorationStats domain object.

    Args:
        exploration_stats. ExplorationStats. The exploration statistics domain
            object.
    """
    new_state_stats_mapping = {
        state_name: exploration_stats.state_stats_mapping[state_name].to_dict()
        for state_name in exploration_stats.state_stats_mapping
    }

    exploration_stats_model = stats_models.ExplorationStatsModel.get_model(
        exploration_stats.exp_id, exploration_stats.exp_version)

    exploration_stats_model.num_starts_v1 = exploration_stats.num_starts_v1
    exploration_stats_model.num_starts_v2 = exploration_stats.num_starts_v2
    exploration_stats_model.num_actual_starts_v1 = (
        exploration_stats.num_actual_starts_v1)
    exploration_stats_model.num_actual_starts_v2 = (
        exploration_stats.num_actual_starts_v2)
    exploration_stats_model.num_completions_v1 = (
        exploration_stats.num_completions_v1)
    exploration_stats_model.num_completions_v2 = (
        exploration_stats.num_completions_v2)
    exploration_stats_model.state_stats_mapping = new_state_stats_mapping

    exploration_stats_model.put()


def save_stats_model_transactional(exploration_stats):
    """Updates the ExplorationStatsModel datastore instance with the passed
    ExplorationStats domain object in a transaction.

    Args:
        exploration_stats. ExplorationStats. The exploration statistics domain
            object.
    """
    transaction_services.run_in_transaction(
        _save_stats_model, exploration_stats)


def get_exploration_stats_multi(exp_version_references):
    """Retrieves the exploration stats for the given explorations.

    Args:
        exp_version_references: list(ExpVersionReference). List of exploration
            version reference domain objects.

    Returns:
        list(ExplorationStats). The list of exploration stats domain objects.
    """
    exploration_stats_models = (
        stats_models.ExplorationStatsModel.get_multi_stats_models(
            exp_version_references))

    exploration_stats_list = []
    for index, exploration_stats_model in enumerate(exploration_stats_models):
        if exploration_stats_model is None:
            exploration_stats_list.append(
                stats_domain.ExplorationStats.create_default(
                    exp_version_references[index].exp_id,
                    exp_version_references[index].version,
                    {}))
        else:
            exploration_stats_list.append(
                get_exploration_stats_from_model(exploration_stats_model))

    return exploration_stats_list


def get_visualizations_info(exp_id, state_name, interaction_id):
    """Returns a list of visualization info. Each item in the list is a dict
    with keys 'data' and 'options'.

    Args:
        exp_id: str. The ID of the exploration.
        state_name: str. Name of the state.
        interaction_id: str. The interaction type.

    Returns:
        list(dict). Each item in the list is a dict with keys representing
        - 'id': str. The visualization ID.
        - 'data': list(dict). A list of answer/frequency dicts.
        - 'options': dict. The visualization options.

        An example of the returned value may be:
        [{'options': {'y_axis_label': 'Count', 'x_axis_label': 'Answer'},
        'id': 'BarChart',
        'data': [{u'frequency': 1, u'answer': 0}]}]
    """
    if interaction_id is None:
        return []

    visualizations = interaction_registry.Registry.get_interaction_by_id(
        interaction_id).answer_visualizations

    calculation_ids = set([
        visualization.calculation_id for visualization in visualizations])

    calculation_ids_to_outputs = {}
    for calculation_id in calculation_ids:
        # This is None if the calculation job has not yet been run for this
        # state.
        calc_output_domain_object = _get_calc_output(
            exp_id, state_name, calculation_id)

        # If the calculation job has not yet been run for this state, we simply
        # exclude the corresponding visualization results.
        if calc_output_domain_object is None:
            continue

        # If the output was associated with a different interaction ID, skip the
        # results. This filtering step is needed since the same calculation_id
        # can be shared across multiple interaction types.
        if calc_output_domain_object.interaction_id != interaction_id:
            continue

        calculation_ids_to_outputs[calculation_id] = (
            calc_output_domain_object.calculation_output.to_raw_type())
    return [{
        'id': visualization.id,
        'data': calculation_ids_to_outputs[visualization.calculation_id],
        'options': visualization.options,
        'addressed_info_is_supported': (
            visualization.addressed_info_is_supported),
    } for visualization in visualizations
            if visualization.calculation_id in calculation_ids_to_outputs]


def record_answer(
        exploration_id, exploration_version, state_name, interaction_id,
        submitted_answer):
    """Record an answer by storing it to the corresponding StateAnswers entity.

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration.
        state_name: str. The name of the state.
        interaction_id: str. The ID of the interaction.
        submitted_answer: SubmittedAnswer. The submitted answer.
    """
    record_answers(
        exploration_id, exploration_version, state_name, interaction_id,
        [submitted_answer])


def record_answers(
        exploration_id, exploration_version, state_name, interaction_id,
        submitted_answer_list):
    """Optimally record a group of answers using an already loaded exploration..
    The submitted_answer_list is a list of SubmittedAnswer domain objects.

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration.
        state_name: str. The name of the state.
        interaction_id: str. The ID of the interaction.
        submitted_answer_list: list(SubmittedAnswer). The list of answers to be
            recorded.
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

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration to fetch
            answers for.
        state_name: str. The name of the state to fetch answers for.

    Returns:
        StateAnswers or None. A StateAnswers object containing all answers
        associated with the state, or None if no such answers exist.
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

    # Return at most 100 answers, and only answers from the initial shard (If
    # we needed to use subsequent shards then the answers are probably too big
    # anyway).
    sample_answers = answers_model.submitted_answer_list[:100]
    return [
        stats_domain.SubmittedAnswer.from_dict(submitted_answer_dict).answer
        for submitted_answer_dict in sample_answers]


def get_state_answers_stats(exp_id, state_name, test_only_min_frequency=None):
    calculation_output = (
        _get_calc_output(exp_id, state_name, 'Top10AnswerFrequencies')
            .calculation_output.to_raw_type())
    return [
        {'answer': calc['answer'], 'frequency': calc['frequency']}
        for calc in calculation_output
        if calc['frequency'] >= (test_only_min_frequency or
                                 feconf.STATE_ANSWER_STATS_MIN_FREQUENCY)]


def get_state_answers_stats_multi(
        exp_id, state_names, test_only_min_frequency=None):
    return {
        state_name:
            get_state_answers_stats(exp_id, state_name, test_only_min_frequency)
        for state_name in state_names
    }


def _get_calc_output(exploration_id, state_name, calculation_id):
    """Get state answers calculation output domain object obtained from
    StateAnswersCalcOutputModel instance stored in the data store. The
    calculation ID comes from the name of the calculation class used to compute
    aggregate data from submitted user answers. This returns aggregated output
    for all versions of the specified state and exploration.

    Args:
        exploration_id: str. ID of the exploration.
        state_name: str. Name of the state.
        calculation_id: str. Name of the calculation class.

    Returns:
        StateAnswersCalcOutput|None. The state answers calculation output
            domain object or None.
    """
    calc_output_model = stats_models.StateAnswersCalcOutputModel.get_model(
        exploration_id, VERSION_ALL, state_name, calculation_id)
    if calc_output_model:
        calculation_output = None
        if (calc_output_model.calculation_output_type ==
                stats_domain.CALC_OUTPUT_TYPE_ANSWER_FREQUENCY_LIST):
            calculation_output = (
                stats_domain.AnswerFrequencyList.from_raw_type(
                    calc_output_model.calculation_output))
        elif (calc_output_model.calculation_output_type ==
              stats_domain.CALC_OUTPUT_TYPE_CATEGORIZED_ANSWER_FREQUENCY_LISTS):
            calculation_output = (
                stats_domain.CategorizedAnswerFrequencyLists.from_raw_type(
                    calc_output_model.calculation_output))
        return stats_domain.StateAnswersCalcOutput(
            exploration_id, VERSION_ALL, state_name,
            calc_output_model.interaction_id, calculation_id,
            calculation_output)
    else:
        return None
