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

"""One-off jobs for explorations."""

import ast
import logging

from core import jobs
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.platform import models
import feconf
import utils

(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])

_COMMIT_TYPE_REVERT = 'revert'


class ExpSummariesCreationOneOffJob(jobs.BaseMapReduceJobManager):
    """Job that calculates summaries of explorations. For every
    ExplorationModel entity, create a ExpSummaryModel entity containing
    information described in ExpSummariesAggregator.

    The summaries store the following information:
        title, category, objective, language_code, tags,
        last_updated, created_on, status (private, public or
        publicized), community_owned, owner_ids, editor_ids,
        viewer_ids, version.

        Note: contributor_ids field populated by
        ExpSummariesContributorsOneOffJob.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exploration_model):
        if not exploration_model.deleted:
            exp_services.create_exploration_summary(
                exploration_model.id, None)

    @staticmethod
    def reduce(exp_id, list_of_exps):
        pass


class ExpSummariesContributorsOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job that finds the user ids of the contributors
    (defined as any human who has made a 'positive' -- i.e.
    non-revert-- commit) for each exploration.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationSnapshotMetadataModel]

    @staticmethod
    def map(item):
        if (item.commit_type != _COMMIT_TYPE_REVERT and
                item.committer_id not in feconf.SYSTEM_USER_IDS):
            exp_id = item.get_unversioned_instance_id()
            yield (exp_id, item.committer_id)

    @staticmethod
    def reduce(exp_id, committer_id_list):
        exp_summary_model = exp_models.ExpSummaryModel.get_by_id(exp_id)
        if exp_summary_model is None:
            return

        exp_summary_model.contributor_ids = list(set(committer_id_list))
        exp_summary_model.put()


class ExplorationContributorsSummaryOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job that computes the number of commits
    done by contributors for each Exploration
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        summary = exp_services.get_exploration_summary_by_id(item.id)
        summary.contributors_summary = (
            exp_services.compute_exploration_contributors_summary(item.id))
        exp_services.save_exploration_summary(summary)

    @staticmethod
    def reduce(key, values):
        pass


class ExplorationFirstPublishedOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job that finds first published time in milliseconds for all
    explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotContentModel]

    @staticmethod
    def map(item):
        if item.content['status'] == rights_manager.ACTIVITY_STATUS_PUBLIC:
            yield (
                item.get_unversioned_instance_id(),
                utils.get_time_in_millisecs(item.created_on))

    @staticmethod
    def reduce(exp_id, stringified_commit_times_msecs):
        exploration_rights = rights_manager.get_exploration_rights(
            exp_id, strict=False)
        if exploration_rights is None:
            return

        commit_times_msecs = [
            ast.literal_eval(commit_time_string) for
            commit_time_string in stringified_commit_times_msecs]
        first_published_msec = min(commit_times_msecs)
        rights_manager.update_activity_first_published_msec(
            feconf.ACTIVITY_TYPE_EXPLORATION, exp_id,
            first_published_msec)


class IndexAllExplorationsJobManager(jobs.BaseMapReduceJobManager):
    """One-off job that indexes all explorations and computes their ranks."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if not item.deleted:
            exp_services.index_explorations_given_ids([item.id])

    @staticmethod
    def reduce(key, values):
        pass


class ExplorationValidityJobManager(jobs.BaseMapReduceJobManager):
    """Job that checks that all explorations have appropriate validation
    statuses.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)
        exp_rights = rights_manager.get_exploration_rights(item.id)

        try:
            if exp_rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
                exploration.validate()
            else:
                exploration.validate(strict=True)
        except utils.ValidationError as e:
            yield (item.id, unicode(e).encode('utf-8'))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExplorationMigrationJobManager(jobs.BaseMapReduceJobManager):
    """A reusable one-time job that may be used to migrate exploration schema
    versions. This job will load all existing explorations from the data store
    and immediately store them back into the data store. The loading process of
    an exploration in exp_services automatically performs schema updating. This
    job persists that conversion work, keeping explorations up-to-date and
    improving the load time of new explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        # Do not upgrade explorations that fail non-strict validation.
        old_exploration = exp_services.get_exploration_by_id(item.id)
        try:
            old_exploration.validate()
        except Exception as e:
            logging.error(
                'Exploration %s failed non-strict validation: %s' %
                (item.id, e))
            return

        # If the exploration model being stored in the datastore is not the
        # most up-to-date states schema version, then update it.
        if (item.states_schema_version !=
                feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION):
            # Note: update_exploration does not need to apply a change list in
            # order to perform a migration. See the related comment in
            # exp_services.apply_change_list for more information.
            commit_cmds = [{
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': str(item.states_schema_version),
                'to_version': str(
                    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
            }]
            exp_services.update_exploration(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update exploration states from schema version %d to %d.' % (
                    item.states_schema_version,
                    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class InteractionAuditOneOffJob(jobs.BaseMapReduceJobManager):
    """Job that produces a list of (exploration, state) pairs, grouped by the
    interaction they use.

    This job is for demonstration purposes. It is not enabled by default in the
    jobs registry.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)
        for state_name, state in exploration.states.iteritems():
            exp_and_state_key = '%s %s' % (item.id, state_name)
            yield (state.interaction.id, exp_and_state_key)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ItemSelectionInteractionOneOffJob(jobs.BaseMapReduceJobManager):
    """Job that produces a list of (exploration, state) pairs that use the item
    selection interaction and that have rules that do not match the answer
    choices. These probably need to be fixed manually.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)
        for state_name, state in exploration.states.iteritems():
            if state.interaction.id == 'ItemSelectionInput':
                choices = (
                    state.interaction.customization_args['choices']['value'])
                for group in state.interaction.answer_groups:
                    for rule_spec in group.rule_specs:
                        for rule_item in rule_spec.inputs['x']:
                            if rule_item not in choices:
                                yield (
                                    item.id,
                                    '%s: %s' % (
                                        state_name.encode('utf-8'),
                                        rule_item.encode('utf-8')))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ViewableExplorationsAuditJob(jobs.BaseMapReduceJobManager):
    """Job that outputs a list of private explorations which are viewable."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration_rights = rights_manager.get_exploration_rights(
            item.id, strict=False)
        if exploration_rights is None:
            return

        if (exploration_rights.status == feconf.ACTIVITY_STATUS_PRIVATE
                and exploration_rights.viewable_if_private):
            yield (item.id, item.title.encode('utf-8'))

    @staticmethod
    def reduce(key, values):
        yield (key, values)
