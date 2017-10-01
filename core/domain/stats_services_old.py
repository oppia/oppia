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

from core.domain import stats_jobs_continuous
from core.platform import models

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


# TODO(bhenning): Test
def get_versions_for_exploration_stats(exploration_id):
    """Returns a list of strings, each string representing a version of the
    given exploration_id for which statistics data exists. These versions are
    retrieved from ExplorationAnnotationsModel created when StatisticsAggregator
    job is run.

    An example of the return list may look like [u'3', u'all']
    where '3' and 'all' are versions of the given exploration ID from
    ExplorationAnnotationsModel.

    Args:
        exploration_id: str. The exploration ID.

    Returns:
        list(str). The versions of the given exploration for which statistics
        data exists. These may either be 'all' (which indicates that the
        statistics have been aggregated over all versions), or specific
        (stringified) version numbers.
    """
    return stats_models.ExplorationAnnotationsModel.get_versions(
        exploration_id)


# TODO(bhenning): Test
def get_exploration_stats(exploration_id, exploration_version, state_names):
    """Returns a dict with state statistics for the given exploration id.

    Args:
        exploration_id: str. The ID of the exploration.
        exploration_version: str. The version of the exploration from
            ExplorationAnnotationsModel. It can be 'all' or version number as
            string like '3'.
        state_names: list(str). List of state names in the exploration.

    Returns:
        dict. A dict with state statistics for the given exploration ID.
        The keys and values of the dict are as follows:
        - 'last_updated': float. Last updated timestamp of the exploration.
        - 'num_starts': int. The number of "start exploration" events recorded.
        - 'num_completions': int. The number of "complete exploration" events
            recorded.
        - 'state_stats': dict(dict). Contains state stats of states
            contained in the given exploration ID. The keys of the dict are the
            names of the states and its values are dict containing the
            statistics data of the respective state in the key.
            The keys and values of the dict are as follows:
            - state_name: dict. The statistics data of the state.
                The keys and values of the statistics data dict are as follows:
                - "first_entry_count": int. The number of sessions which hit
                    the state.
                - "name": str. The name of the state.
                - "total_entry_count": int. The total number of hits for the
                    state.
                - "no_submitted_answer_count": int. The number of hits with
                    no answer for this state.
    """
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
            } for state_name in state_names
        },
    }
