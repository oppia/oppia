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
import traceback

import bs4
from constants import constants
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


class ExpSummariesCreationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that calculates summaries of explorations. For every
    ExplorationModel entity, create a ExpSummaryModel entity containing
    information described in ExpSummariesAggregator.

    The summaries store the following information:
        title, category, objective, language_code, tags, last_updated,
        created_on, status (private, public), community_owned, owner_ids,
        editor_ids, viewer_ids, version.

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


class ExpSummariesContributorsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
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


class ExplorationContributorsSummaryOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job that computes the number of commits
    done by contributors for each Exploration.
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


class ExplorationFirstPublishedOneOffJob(jobs.BaseMapReduceOneOffJobManager):
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
            constants.ACTIVITY_TYPE_EXPLORATION, exp_id,
            first_published_msec)


class ExplorationValidityJobManager(jobs.BaseMapReduceOneOffJobManager):
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


class ExplorationMigrationJobManager(jobs.BaseMapReduceOneOffJobManager):
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
            commit_cmds = [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': str(item.states_schema_version),
                'to_version': str(
                    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)
            })]
            exp_services.update_exploration(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update exploration states from schema version %d to %d.' % (
                    item.states_schema_version,
                    feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class InteractionAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
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


class ItemSelectionInteractionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
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


class ViewableExplorationsAuditJob(jobs.BaseMapReduceOneOffJobManager):
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


class ExplorationConversionErrorIdentificationJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that outputs the list of explorations that currently consist of
    redundant features and result in an ExplorationConversionError when
    retrieved.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        try:
            exploration = exp_services.get_exploration_by_id(item.id)
        # Handle case where the exploration is deleted.
        except Exception as e:
            return

        latest_exp_version = exploration.version
        version_numbers = range(1, latest_exp_version + 1)

        try:
            exp_services.get_multiple_explorations_by_version(
                item.id, version_numbers)
        except Exception as e:
            yield (item.id, e)
            return

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExplorationStateIdMappingJob(jobs.BaseMapReduceOneOffJobManager):
    """Job produces state id mapping model for all explorations currently
    present in datastore.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        try:
            exploration = exp_services.get_exploration_from_model(item)
        except Exception as e:
            yield ('ERROR get_exp_from_model: exp_id %s' % item.id, str(e))
            return

        explorations = []

        # Fetch all versions of the exploration, if they exist.
        if exploration.version > 1:
            # Ignore latest version since we already have corresponding
            # exploration.
            versions = range(1, exploration.version)

            # Get all exploration versions for current exploration id.
            try:
                explorations = (
                    exp_services.get_multiple_explorations_by_version(
                        exploration.id, versions))
            except Exception as e:
                yield (
                    'ERROR get_multiple_exp_by_version exp_id %s' % item.id,
                    str(e))
                return

        # Append latest exploration to the list of explorations.
        explorations.append(exploration)

        # Retrieve list of snapshot models representing each version of the
        # exploration.
        versions = range(1, exploration.version + 1)
        snapshots_by_version = (
            exp_models.ExplorationModel.get_snapshots_metadata(
                exploration.id, versions))

        # Create and save state id mapping model for all exploration versions.
        for exploration, snapshot in zip(explorations, snapshots_by_version):
            if snapshot is None:
                yield (
                    'ERROR with exp_id %s' % item.id,
                    'Error: No exploration snapshot metadata model instance '
                    'found for exploration %s, version %d' % (
                        exploration.id, exploration.version))
                return

            change_list = snapshot['commit_cmds']

            try:
                # Check if commit is to revert the exploration.
                if change_list and change_list[0]['cmd'].endswith(
                        'revert_version_number'):
                    reverted_version = change_list[0]['version_number']
                    # pylint: disable=line-too-long
                    state_id_mapping = exp_services.generate_state_id_mapping_model_for_reverted_exploration(
                        exploration.id, exploration.version - 1,
                        reverted_version)
                    # pylint: enable=line-too-long
                else:
                    state_id_mapping = (
                        exp_services.generate_state_id_mapping_model(
                            exploration, change_list))

                state_id_mapping_model = exp_models.StateIdMappingModel.create(
                    state_id_mapping.exploration_id,
                    state_id_mapping.exploration_version,
                    state_id_mapping.state_names_to_ids,
                    state_id_mapping.largest_state_id_used, overwrite=True)
                state_id_mapping_model.put()

            except Exception as e:
                yield (
                    'ERROR with exp_id %s version %s' % (
                        item.id, exploration.version),
                    traceback.format_exc())
                return

        yield (exploration.id, exploration.version)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class HintsAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that tabulates the number of hints used by each state of an
    exploration.
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
            hints_length = len(state.interaction.hints)
            if hints_length > 0:
                exp_and_state_key = '%s %s' % (
                    item.id, state_name.encode('utf-8'))
                yield (str(hints_length), exp_and_state_key)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExplorationContentValidationJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of an exploration and validates it.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)
        # err_dict is a dictionary to store the invalid tags and the
        # invalid parent-child relations that we find.
        err_dict = {}

        allowed_parent_list = (
            feconf.RTE_CONTENT_SPEC['RTE_TYPE_TEXTANGULAR']
            ['ALLOWED_PARENT_LIST'])
        allowed_tag_list = (
            feconf.RTE_CONTENT_SPEC['RTE_TYPE_TEXTANGULAR']
            ['ALLOWED_TAG_LIST'])

        html_list = exploration.get_all_html_content_strings()

        for html_data in html_list:
            soup = bs4.BeautifulSoup(html_data, 'html.parser')

            for tag in soup.findAll():
                # Checking for tags not allowed in RTE.
                if tag.name not in allowed_tag_list:
                    if 'invalidTags' in err_dict:
                        err_dict['invalidTags'] += [tag.name]
                    else:
                        err_dict['invalidTags'] = [tag.name]
                # Checking for parent-child relation that are not
                # allowed in RTE.
                parent = tag.parent.name
                if (tag.name in allowed_tag_list) and (
                        parent not in allowed_parent_list[tag.name]):
                    if tag.name in err_dict:
                        err_dict[tag.name] += [parent]
                    else:
                        err_dict[tag.name] = [parent]

        for key in err_dict:
            yield(key, list(set(err_dict[key])))

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        # Combine all values from multiple lists into a single list
        # for that error type.
        yield (key, list(set().union(*final_values)))
