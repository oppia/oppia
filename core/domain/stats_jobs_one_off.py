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

"""Jobs for statistics views."""

import ast
import collections

from core import jobs
from core.domain import interaction_registry
from core.domain import stats_jobs_continuous
from core.platform import models

(stats_models,) = models.Registry.import_models([
    models.NAMES.statistics
])


class StatisticsAudit(jobs.BaseMapReduceJobManager):
    """A one-off statistics audit.

    Performs a brief audit of exploration completions and state hit counts to
    make sure they match counts stored in StateCounterModel. It also checks for
    some possible error cases like negative counts.
    """
    _STATE_COUNTER_ERROR_KEY = 'State Counter ERROR'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            stats_models.ExplorationAnnotationsModel,
            stats_models.StateCounterModel]

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item: ExplorationAnnotationsModel or
                StateCounterModel.

        Yields:
            tuple. For StateCounterModel, a 2-tuple in the form
                (_STATE_COUNTER_ERROR_KEY, error message).
            tuple. For ExplorationAnnotationModel, a 2-tuple in the form
                ('exploration_id', value).
                'exploration_id': str. the id of the exploration.
                'value': a dict, whose structure is as follows:
                    {
                        'version': str. version of the exploration.
                        'starts': int. # of times exploration was started.
                        'completions': int. # of times exploration was
                            completed.
                        'state_hit': a dict containing the hit counts for the
                            states in the exploration. It is formatted as
                            follows:
                            {
                                state_name: {
                                    'first_entry_count': int. # of sessions
                                        which hit this state.
                                    'total_entry_count': int. # of total hits
                                        for this state.
                                    'no_answer_count': int. # of hits with no
                                        answer for this state.
                                }
                            }
                    }
        """
        if isinstance(item, stats_models.StateCounterModel):
            if item.first_entry_count < 0:
                yield (
                    StatisticsAudit._STATE_COUNTER_ERROR_KEY,
                    'Less than 0: %s %d' % (item.key, item.first_entry_count))
            return
        # Older versions of ExplorationAnnotations didn't store exp_id
        # This is short hand for making sure we get ones updated most recently
        else:
            if item.exploration_id is not None:
                yield (item.exploration_id, {
                    'version': item.version,
                    'starts': item.num_starts,
                    'completions': item.num_completions,
                    'state_hit': item.state_hit_counts
                })

    @staticmethod
    def reduce(key, stringified_values):
        """Updates statistics for the given exploration.

        Args:
            key: str. The id of the exploration.
            stringified_values: list(str). A list of stringified values
                associated with the given key. An element of stringified_values
                would be of the form:
                    {
                        'version': str. version of the exploration.
                        'starts': int. # of times exploration was started.
                        'completions': int. # of times exploration was
                            completed.
                        'state_hit': dict. a dict containing the hit counts
                            for the states in the exploration. It is formatted
                            as follows:
                            {
                                state_name: {
                                    'first_entry_count': int. # of sessions
                                        which hit this state.
                                    'total_entry_count': int. # of total
                                        hits for this state.
                                    'no_answer_count': int. # of hits with
                                        no answer for this state.
                                }
                            }
                    }

        Yields:
            tuple(str). A 1-tuple whose only element is an error message.
        """
        if key == StatisticsAudit._STATE_COUNTER_ERROR_KEY:
            for value_str in stringified_values:
                yield (value_str,)
            return

        # If the code reaches this point, we are looking at values that
        # correspond to each version of a particular exploration.

        # These variables correspond to the VERSION_ALL version.
        all_starts = 0
        all_completions = 0
        all_state_hit = collections.defaultdict(int)

        # These variables correspond to the sum of counts for all other
        # versions besides VERSION_ALL.
        sum_starts = 0
        sum_completions = 0
        sum_state_hit = collections.defaultdict(int)

        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['starts'] < 0:
                yield (
                    'Negative start count: exp_id:%s version:%s starts:%s' %
                    (key, value['version'], value['starts']),)

            if value['completions'] < 0:
                yield (
                    'Negative completion count: exp_id:%s version:%s '
                    'completions:%s' %
                    (key, value['version'], value['completions']),)

            if value['completions'] > value['starts']:
                yield ('Completions > starts: exp_id:%s version:%s %s>%s' % (
                    key, value['version'], value['completions'],
                    value['starts']),)

            if value['version'] == stats_jobs_continuous.VERSION_ALL:
                all_starts = value['starts']
                all_completions = value['completions']
                for (state_name, counts) in value['state_hit'].iteritems():
                    all_state_hit[state_name] = counts['first_entry_count']
            else:
                sum_starts += value['starts']
                sum_completions += value['completions']
                for (state_name, counts) in value['state_hit'].iteritems():
                    sum_state_hit[state_name] += counts['first_entry_count']

        if sum_starts != all_starts:
            yield (
                'Non-all != all for starts: exp_id:%s sum: %s all: %s'
                % (key, sum_starts, all_starts),)
        if sum_completions != all_completions:
            yield (
                'Non-all != all for completions: exp_id:%s sum: %s all: %s'
                % (key, sum_completions, all_completions),)

        for state_name in all_state_hit:
            if (state_name not in sum_state_hit and
                    all_state_hit[state_name] != 0):
                yield (
                    'state hit count not same exp_id:%s state:%s, '
                    'all:%s sum: null' % (
                        key, state_name, all_state_hit[state_name]),)
            elif all_state_hit[state_name] != sum_state_hit[state_name]:
                yield (
                    'state hit count not same exp_id: %s state: %s '
                    'all: %s sum:%s' % (
                        key, state_name, all_state_hit[state_name],
                        sum_state_hit[state_name]),)


class AnswerModelInteractionConsistencyJob(jobs.BaseMapReduceJobManager):
    """A one-off job to check the consistency of internal answer model state.

    Verifies that all (exploration_id, exploration_version, state_name) tuples
    correspond to exactly one interaction ID across all submitted answer
    buckets. This job is used as a preliminary audit before running
    PurgeNewAnswersJob to ensure that job does not leave any remaining buckets
    after purging.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateAnswersModel]

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item: StateAnswersModel.

        Yields:
            tuple. a 2-tuple in the form
                ('exploration_id-exploration_version-state_name', value).
                'exploration_id': str. the id of the exploration.
                'exploration_version': number. the version of the exploration.
                'state_name': str. the name of the corresponding state.
                'value': a dict, whose structure is as follows:
                    {
                        'exploration_id': str. the id of the exploration.
                        'exploration_version': number. the version of the
                            exploration.
                        'state_name': str. the name of the corresponding state.
                        'interaction_id': str. the corresponding interaction ID.
                    }
        """
        combined_key = '%s-%s-%s' % (
            item.exploration_id, item.exploration_version, item.state_name)
        yield (combined_key, {
            'exploration_id': item.exploration_id,
            'exploration_version': item.exploration_version,
            'state_name': item.state_name,
            'interaction_id': item.interaction_id
        })


    @staticmethod
    def reduce(key, stringified_values): # pylint: disable=unused-argument
        """Outputs information about the current state of answers.

        Args:
            key: str. The combined exploration ID-version-state name mapped to
                the stringified_values.
            stringified_values: list(str). A list of stringified values
                associated with the given key. An element of stringified_values
                would be of the form:
                    {
                        'exploration_id': str. the id of the exploration.
                        'exploration_version': number. the version of the
                            exploration.
                        'state_name': str. the name of the corresponding state.
                        'interaction_id': str. the corresponding interaction ID.
                    }

        Yields:
            tuple(str). A 1-tuple whose only element is an error message.
        """
        first_value_dict = ast.literal_eval(stringified_values[0])
        exploration_id = first_value_dict['exploration_id']
        exploration_version = first_value_dict['exploration_version']
        state_name = first_value_dict['state_name']
        interaction_ids = set()
        for stringified_value in stringified_values:
            value_dict = ast.literal_eval(stringified_value)
            interaction_ids.add(value_dict['interaction_id'])
        if len(interaction_ids) != 1:
            yield (
                'Expected exploration %s (version %s) and state %s pair to '
                'only have 1 interaction ID, but found: %s' % (
                    exploration_id, exploration_version, state_name,
                    interaction_ids))


class PurgeNewAnswersAuditJob(jobs.BaseMapReduceJobManager):
    """A pre-purge audit job.

    This job performs the exact same work as PurgeNewAnswersJob without the
    actual deletion. This should be run before the deletion to ensure only the
    expected answer buckets are removed.
    """
    _ANSWER_BUCKET_REMOVED_KEY = 'removed_answer_bucket'
    _ANSWER_BUCKET_RETAINED_KEY = 'retained_answer_bucket'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateAnswersModel]

    @staticmethod
    def map(item):
        """Implements the map function and yields all answer buckets associated
        with interactions that no longer exist.

        Args:
            item: StateAnswersModel.

        Yields:
            tuple. a 2-tuple in the form
                (output_key, value).
                'output_key': str. either _ANSWER_BUCKET_RETAINED_KEY or
                    _ANSWER_BUCKET_REMOVED_KEY with an interaction ID appended.
                'value': a dict, whose structure is as follows:
                    {
                        'item_id': str. the id of the mapped model.
                        'interaction_id': str. the corresponding interaction ID.
                    }
        """
        interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())
        if item.interaction_id not in interaction_ids:
            removal_key = '%s-%s' % (
                PurgeNewAnswersAuditJob._ANSWER_BUCKET_REMOVED_KEY,
                item.interaction_id)
            yield (removal_key, {
                'item_id': item.id,
                'interaction_id': item.interaction_id
            })
        else:
            yield (PurgeNewAnswersAuditJob._ANSWER_BUCKET_RETAINED_KEY, {})


    @staticmethod
    def reduce(key, stringified_values):
        """Outputs results about which answer buckets would be removed if the
        actual PurgeNewAnswersJob were run.

        Args:
            key: str. Either _ANSWER_BUCKET_RETAINED_KEY or
                _ANSWER_BUCKET_REMOVED_KEY with an interaction ID appended.
            stringified_values: list(str). A list of stringified values
                associated with the given key. An element of stringified_values
                would be of the form:
                    {
                        'item_id': str. the id of the mapped model.
                        'interaction_id': str. the corresponding interaction ID.
                    }

        Yields:
            tuple(str). A 1-tuple whose only element is an output message.
        """
        if key.startswith(PurgeNewAnswersAuditJob._ANSWER_BUCKET_REMOVED_KEY):
            first_value_dict = ast.literal_eval(stringified_values[0])
            interaction_id = first_value_dict['interaction_id']
            item_ids = [
                ast.literal_eval(stringified_value)['item_id']
                for stringified_value in stringified_values]
            yield (
                'Will remove %d answer buckets corresponding to purged '
                'interaction %s: %s' % (
                    len(stringified_values), interaction_id, item_ids))
        else:
            yield (
                'Will retain %d answer buckets corresponding to current '
                'interactions' % len(stringified_values))


class PurgeNewAnswersJob(jobs.BaseMapReduceJobManager):
    """A one-off purge job for answers.

    Purges all answers from StateAnswersModel which correspond to interactions
    that are no longer being used by Oppia, such as FileReadInput and
    TarFileReadInput. See #3284 for additional context.
    """
    _ANSWER_BUCKET_REMOVED_KEY = 'removed_answer_bucket'
    _ANSWER_BUCKET_RETAINED_KEY = 'retained_answer_bucket'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateAnswersModel]

    @staticmethod
    def map(item):
        """Implements the map function and removes all answer buckets associated
        with interactions that no longer exist.

        Args:
            item: StateAnswersModel.

        Yields:
            tuple. a 2-tuple in the form
                (output_key, value).
                'output_key': str. either _ANSWER_BUCKET_RETAINED_KEY or
                    _ANSWER_BUCKET_REMOVED_KEY with an interaction ID appended.
                'value': a dict, whose structure is as follows:
                    {
                        'item_id': str. the id of the mapped model.
                        'interaction_id': str. the corresponding interaction ID.
                    }
        """
        interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())
        if item.interaction_id not in interaction_ids:
            item.delete()
            removal_key = '%s-%s' % (
                PurgeNewAnswersJob._ANSWER_BUCKET_REMOVED_KEY,
                item.interaction_id)
            yield (removal_key, {
                'item_id': item.id,
                'interaction_id': item.interaction_id
            })
        else:
            yield (PurgeNewAnswersJob._ANSWER_BUCKET_RETAINED_KEY, {})


    @staticmethod
    def reduce(key, stringified_values):
        """Outputs results about which answer buckets were removed.

        Args:
            key: str. Either _ANSWER_BUCKET_RETAINED_KEY or
                _ANSWER_BUCKET_REMOVED_KEY with an interaction ID appended.
            stringified_values: list(str). A list of stringified values
                associated with the given key. An element of stringified_values
                would be of the form:
                    {
                        'item_id': str. the id of the mapped model.
                        'interaction_id': str. the corresponding interaction ID.
                    }

        Yields:
            tuple(str). A 1-tuple whose only element is an output message.
        """
        if key.startswith(PurgeNewAnswersJob._ANSWER_BUCKET_REMOVED_KEY):
            first_value_dict = ast.literal_eval(stringified_values[0])
            interaction_id = first_value_dict['interaction_id']
            item_ids = [
                ast.literal_eval(stringified_value)['item_id']
                for stringified_value in stringified_values]
            yield (
                'Removed %d answer buckets corresponding to purged interaction '
                '%s: %s' % (len(stringified_values), interaction_id, item_ids))
        else:
            yield (
                'Retained %d answer buckets corresponding to current '
                'interactions' % len(stringified_values))
