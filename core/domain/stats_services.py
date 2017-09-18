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
from core.domain import stats_domain
from core.platform import models

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


def handle_stats_creation_for_new_exploration(exploration):
    """Creates ExplorationStatsModel for the freshly created exploration and
    sets all initial values to zero.

    Args:
        exploration: Exploration. The exploration domain object.
    """
    state_stats_mapping = {
        state_name: stats_domain.StateStats.create_default()
        for state_name in exploration.states
    }

    exploration_stats = stats_domain.ExplorationStats(
        exploration.id, exploration.version, 0, 0, state_stats_mapping)
    create_stats_model(exploration_stats)


def handle_stats_creation_for_new_exp_version(exploration, change_list):
    """Retrieves the ExplorationStatsModel for the old exp_version and makes
    any required changes to the structure of the model. Then, a new
    ExplorationStatsModel is created for the new exp_version.

    Args:
        exploration: Exploration. The exploration domain object after the
            commit.
        change_list: list(dict). A list of changes introduced in this commit.
    """

    old_exp_version = exploration.version - 1
    new_exp_version = exploration.version
    exploration_stats = get_exploration_stats_by_id(
        exploration.id, old_exp_version)

    # This mapping from new state names to old ones account for circular
    # renames and multiple renames within a commit. We will use this mapping
    # to handle state renames in the statistics model.
    new_to_old_state_names = exploration.get_state_names_mapping(change_list)

    # Handling state renames.
    for state_name in exploration.states:
        if state_name not in new_to_old_state_names.values():
            exploration_stats.state_stats_mapping[state_name] = (
                exploration_stats.state_stats_mapping.pop(
                    new_to_old_state_names[state_name]))

    # Handling state additions and deletions.
    for change_dict in change_list:
        if change_dict['cmd'] == exp_domain.CMD_ADD_STATE:
            exploration_stats.state_stats_mapping[change_dict['state_name']] = (
                stats_domain.StateStats.create_default())

        if change_dict['cmd'] == exp_domain.CMD_DELETE_STATE:
            exploration_stats.state_stats_mapping.pop(change_dict['state_name'])

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
    exploration_stats_model = stats_models.ExplorationStatsModel.get_model(
        exp_id, exp_version)
    exploration_stats = get_exploration_stats_from_model(
        exploration_stats_model)
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
        exploration_stats_model.num_actual_starts,
        exploration_stats_model.num_completions,
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
        exploration_stats.num_actual_starts,
        exploration_stats.num_completions,
        new_state_stats_mapping
    )
    return instance_id

# TODO(pranav): Implement this method and update all references to
# stats_services_old.get_state_answers to point to this method.
def get_state_answers():
    pass

# TODO(pranav): Implement this method and update all references to
# stats_services_old.record_answer to point to this method.
def record_answer():
    pass

# TODO(pranav): Implement this method and update all references to
# stats_services_old.record_answers to point to this method.
def record_answers():
    pass

# TODO(pranav): Implement this method and update all references to
# stats_services_old.get_visualizations_info to point to this method.
def get_visualizations_info():
    pass
