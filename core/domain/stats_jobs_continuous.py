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

from core import jobs
from core.domain import calculation_registry
from core.domain import exp_services
from core.domain import interaction_registry
from core.platform import models
import feconf

(base_models, stats_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()

# Counts contributions from all versions.
VERSION_ALL = 'all'


class InteractionAnswerSummariesMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job to calculate interaction view statistics, e.g. most frequent answers
    of multiple-choice interactions.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        """Returns the InteractionAnswerSummariesAggregator class associated
        with this MapReduce job.
        """
        return InteractionAnswerSummariesAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        """Returns the StateAnswersModel object."""
        return [stats_models.StateAnswersModel]

    # TODO(bhenning): Update this job to persist results for all older
    # exploration versions, since those versions should never have new answers
    # submitted to them. Moreover, answers are also only added so this job might
    # be further optimized to increment on previous results, rather than
    # recomputing results from scratch each time.
    @staticmethod
    def map(item):
        """Returns the submitted answer in dict format:
            {
                'state_answers_model_id': The id of the submitted output
                    answer.
                'interaction_id': The interaction id to which the submitted
                    output answer belongs to.
                'exploration_version': The exploration version to which the
                    submitted output answer belongs to.
            }

        Args:
            item: The submitted answer.

        Yields:
            dict(str, str). The submitted answer in dict format.
        """
        if InteractionAnswerSummariesMRJobManager._entity_created_before_job_queued( # pylint: disable=line-too-long
                item):
            # Output answers submitted to the exploration for this exp version.
            versioned_key = u'%s:%s:%s' % (
                item.exploration_id, item.exploration_version, item.state_name)
            yield (versioned_key.encode('utf-8'), {
                'state_answers_model_id': item.id,
                'interaction_id': item.interaction_id,
                'exploration_version': item.exploration_version
            })

            # Output the same set of answers independent of the version. This
            # allows the reduce step to aggregate answers across all
            # exploration versions.
            all_versions_key = u'%s:%s:%s' % (
                item.exploration_id, VERSION_ALL, item.state_name)
            yield (all_versions_key.encode('utf-8'), {
                'state_answers_model_id': item.id,
                'interaction_id': item.interaction_id,
                'exploration_version': item.exploration_version
            })

    @staticmethod
    def reduce(key, stringified_values):
        """Calculates and saves each answer submitted for the exploration.

        Args:
            key: str. The unique key of the form:
                <exploration_id>:<exploration_version>:<state_name>
            stringified_values: list(str). A list of stringified_values of the
                submitted answers.

        Yields:
            str. One of the following strings:
                - Expected a single version when aggregating answers for:
                    Occurs when the versions list contains multiple versions
                    instead of a specific version.
                - Expected exactly one interaction ID for exploration:
                    Occurs when there is not exactly one interaction ID
                    for each exploration and version.
                - Expected at least one item ID for exploration:
                    Occurs when there is not at least one Item ID for
                    each exploration and version.
                - Ignoring answers submitted to version:
                    Occurs when version mismatches and the new
                    version has a different interaction ID.
        """
        exploration_id, exploration_version, state_name = key.split(':')

        value_dicts = [
            ast.literal_eval(stringified_value)
            for stringified_value in stringified_values]

        # Extract versions in descending order since answers are prioritized
        # based on recency.
        versions = list(set([
            int(value_dict['exploration_version'])
            for value_dict in value_dicts]))
        versions.sort(reverse=True)

        # For answers mapped to specific versions, the versions list should only
        # contain the version they correspond to. Otherwise, if they map to
        # VERSION_ALL, then multiple versions may be included.
        if exploration_version != VERSION_ALL and (
                len(versions) != 1 or versions[0] != int(exploration_version)):
            yield (
                'Expected a single version when aggregating answers for '
                'exploration %s (v=%s), but found: %s' % (
                    exploration_id, exploration_version, versions))

        # Map interaction IDs and StateAnswersModel IDs to exploration versions.
        versioned_interaction_ids = {version: set() for version in versions}
        versioned_item_ids = {version: set() for version in versions}
        for value_dict in value_dicts:
            version = value_dict['exploration_version']
            versioned_interaction_ids[version].add(value_dict['interaction_id'])
            versioned_item_ids[version].add(
                value_dict['state_answers_model_id'])

        # Convert the interaction IDs to a list so they may be easily indexed.
        versioned_interaction_ids = {
            v: list(interaction_ids)
            for v, interaction_ids in versioned_interaction_ids.iteritems()
        }

        # Verify all interaction ID and item ID containers are well-structured.
        for version, interaction_ids in versioned_interaction_ids.iteritems():
            if len(interaction_ids) != 1:
                yield (
                    'Expected exactly one interaction ID for exploration %s '
                    'and version %s, found: %s' % (
                        exploration_id, version, len(interaction_ids)))
        for version, item_ids in versioned_item_ids.iteritems():
            if not item_ids:
                yield (
                    'Expected at least one item ID for exploration %s and '
                    'version %s, found: %s' % (
                        exploration_id, version, len(item_ids)))

        # Filter out any item IDs which happen at and before a version with a
        # changed interaction ID. Start with the most recent version since it
        # will refer to the most relevant answers.
        latest_version = versions[0]
        latest_interaction_id = versioned_interaction_ids[latest_version][0]

        # Ensure the exploration corresponding to these answers exists.
        exp = exp_services.get_exploration_by_id(
            exploration_id, strict=False)
        if exp is None:
            return

        if exploration_version == VERSION_ALL:
            # If aggregating across all versions, verify that the latest answer
            # version is equal to the latest version of the exploration,
            # otherwise ignore all answers since none of them can be applied to
            # the latest version.
            if state_name in exp.states:
                loaded_interaction_id = exp.states[state_name].interaction.id
                # Only check if the version mismatches if the new version has a
                # different interaction ID.
                if latest_interaction_id != loaded_interaction_id and (
                        latest_version != exp.version):
                    yield (
                        'Ignoring answers submitted to version %s and below '
                        'since the latest exploration version is %s' % (
                            latest_version, exp.version))
                    versions = []

        # In the VERSION_ALL case, we only take into account the most recent
        # consecutive block of versions with the same interaction ID as the
        # current version, and ignore all versions prior to this block. This
        # logic isn't needed for individually-mapped versions and, in that case,
        # we skip all this code in favor of performance.
        if len(versions) > 1:
            invalid_version_indexes = [
                index for index, version in enumerate(versions)
                if versioned_interaction_ids[version][0] != (
                    latest_interaction_id)]
            earliest_acceptable_version_index = (
                invalid_version_indexes[0] - 1
                if invalid_version_indexes else len(versions) - 1)
            earliest_acceptable_version = versions[
                earliest_acceptable_version_index]
            # Trim away anything related to the versions which correspond to
            # different or since changed interaction IDs.
            ignored_versions = [
                version for version in versions
                if version < earliest_acceptable_version]
            for ignored_version in ignored_versions:
                del versioned_interaction_ids[ignored_version]
                del versioned_item_ids[ignored_version]
            versions = versions[:earliest_acceptable_version_index + 1]

        # Retrieve all StateAnswerModel entities associated with the remaining
        # item IDs which correspond to a single interaction ID shared among all
        # the versions between start_version and latest_version, inclusive.
        item_ids = set()
        for version in versions:
            item_ids.update(versioned_item_ids[version])

        # Collapse the list of answers into a single answer dict. This
        # aggregates across multiple answers if the key ends with VERSION_ALL.
        # TODO(bhenning): Find a way to iterate across all answers more
        # efficiently and by not loading all answers for a particular
        # exploration into memory.
        submitted_answer_list = []
        combined_state_answers = {
            'exploration_id': exploration_id,
            'exploration_version': exploration_version,
            'state_name': state_name,
            'interaction_id': latest_interaction_id,
            'submitted_answer_list': submitted_answer_list
        }

        # NOTE: The answers stored in submitted_answers_list must be sorted
        # according to the chronological order of their submission otherwise
        # TopNUnresolvedAnswersByFrequency calculation will output invalid
        # results.
        state_answers_models = stats_models.StateAnswersModel.get_multi(
            item_ids)
        for state_answers_model in state_answers_models:
            if state_answers_model:
                submitted_answer_list += (
                    state_answers_model.submitted_answer_list)

        # Get all desired calculations for the current interaction id.
        calc_ids = interaction_registry.Registry.get_interaction_by_id(
            latest_interaction_id).answer_calculation_ids
        calculations = [
            calculation_registry.Registry.get_calculation_by_id(calc_id)
            for calc_id in calc_ids]

        # Perform each calculation, and store the output.
        for calc in calculations:
            calc_output = calc.calculate_from_state_answers_dict(
                combined_state_answers)
            calc_output.save()


class InteractionAnswerSummariesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    # TODO(bhenning): Implement a real-time model for
    # InteractionAnswerSummariesAggregator.
    """Realtime model class for InteractionAnswerSummariesAggregator."""
    pass


class InteractionAnswerSummariesAggregator(
        jobs.BaseContinuousComputationManager):
    """A continuous-computation job that listens to answers to states and
    updates StateAnswer view calculations.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        """Returns a list of event types that this class subscribes to.

        Returns:
            list(str). A list of submitted answer event type.
        """
        return [feconf.EVENT_TYPE_ANSWER_SUBMITTED]

    @classmethod
    def _get_realtime_datastore_class(cls):
        """Returns InteractionAnswerSummariesRealtimeModel class for
        InteractionAnswerSummariesAggregator.
        """
        return InteractionAnswerSummariesRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        """Returns InteractionAnswerSummariesMRJobManager class which calculates
        interaction view statistics.
        """
        return InteractionAnswerSummariesMRJobManager
