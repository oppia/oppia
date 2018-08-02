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
import itertools
import logging
import re
import traceback

from constants import constants
from core import jobs
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import html_cleaner
from core.domain import rights_manager
from core.platform import models
import feconf
import utils

(file_models, base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.file, models.NAMES.base_model, models.NAMES.exploration])

_COMMIT_TYPE_REVERT = 'revert'
FILE_COPIED = 'File Copied'
FILE_ALREADY_EXISTS = 'File already exists in GCS'
FILE_IS_NOT_IN_GCS = 'File does not exist in GCS'
FILE_DELETED = 'File has been deleted'
NO_OF_FILES_DELETED = 'Number of files that got deleted'
NO_OF_FILES_NOT_IN_GCS = 'Number of files that are not in GCS are'
WRONG_INSTANCE_ID = 'Error: The instance_id is not correct'
ALLOWED_IMAGE_EXTENSIONS = list(itertools.chain.from_iterable(
    feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.values()))


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
                item.committer_id not in constants.SYSTEM_USER_IDS):
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
            yield (item.id, unicode(e).encode(encoding='utf-8'))

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

        if (exploration_rights.status == constants.ACTIVITY_STATUS_PRIVATE
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

        # Commit commands which are required to generate state id mapping for
        # given version of exploration from previous version of exploration.
        RELEVANT_COMMIT_CMDS = [
            exp_domain.CMD_ADD_STATE,
            exp_domain.CMD_RENAME_STATE,
            exp_domain.CMD_DELETE_STATE,
            exp_models.ExplorationModel.CMD_REVERT_COMMIT
        ]

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

            change_list = [
                exp_domain.ExplorationChange(change_cmd)
                for change_cmd in snapshot['commit_cmds']
                if change_cmd['cmd'] in RELEVANT_COMMIT_CMDS
            ]

            try:
                # Check if commit is to revert the exploration.
                if change_list and change_list[0].cmd == (
                        exp_models.ExplorationModel.CMD_REVERT_COMMIT):
                    reverted_version = change_list[0].version_number
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


class ExplorationContentValidationJobForTextAngular(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of an exploration and validates it
    for TextAngular.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)

        html_list = exploration.get_all_html_content_strings()

        err_dict = html_cleaner.validate_rte_format(
            html_list, feconf.RTE_FORMAT_TEXTANGULAR)

        for key in err_dict:
            if err_dict[key]:
                yield(key, err_dict[key])

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        # Combine all values from multiple lists into a single list
        # for that error type.
        yield (key, list(set().union(*final_values)))


class ExplorationMigrationValidationJobForTextAngular(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that migrates the html content of an exploration into the valid
    TextAngular format and validates it.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)

        html_list = exploration.get_all_html_content_strings()

        err_dict = html_cleaner.validate_rte_format(
            html_list, feconf.RTE_FORMAT_TEXTANGULAR, run_migration=True)

        for key in err_dict:
            if err_dict[key]:
                yield(key, err_dict[key])

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        # Combine all values from multiple lists into a single list
        # for that error type.
        yield (key, list(set().union(*final_values)))


class ExplorationContentValidationJobForCKEditor(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of an exploration and validates it
    for CKEditor.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_services.get_exploration_from_model(item)

        html_list = exploration.get_all_html_content_strings()

        err_dict = html_cleaner.validate_rte_format(
            html_list, feconf.RTE_FORMAT_CKEDITOR)

        for key in err_dict:
            if err_dict[key]:
                yield(key, err_dict[key])

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        # Combine all values from multiple lists into a single list
        # for that error type.
        yield (key, list(set().union(*final_values)))


class ExplorationMigrationValidationJobForCKEditor(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that migrates the html content of an exploration into the valid
    CKEditor format and validates it.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        err_dict = {}

        try:
            exploration = exp_services.get_exploration_from_model(item)
        except Exception as e:
            yield('Error %s in exploration' % str(e), [item.id])
            return

        html_list = exploration.get_all_html_content_strings()
        try:
            err_dict = html_cleaner.validate_rte_format(
                html_list, feconf.RTE_FORMAT_CKEDITOR, run_migration=True)
        except Exception as e:
            yield(
                'Error in exploration %s' % item.id,
                [traceback.format_exc()])
            return

        for key in err_dict:
            if err_dict[key]:
                yield(key, err_dict[key])

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        # Combine all values from multiple lists into a single list
        # for that error type.
        yield (key, list(set().union(*final_values)))


class ImageDataMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for migrating the images in the exploration
    from the GAE to GCS.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileSnapshotContentModel]

    @staticmethod
    def map(file_snapshot_content_model):
        # This job is allowed to run only in Production environment since it
        # uses GcsFileSystem which can't be used in Development environment.
        if not feconf.DEV_MODE:
            instance_id = (
                file_snapshot_content_model.get_unversioned_instance_id())
            filetype = instance_id[instance_id.rfind('.') + 1:]
            # To separate the image entries from the audio entries we get from
            # the FileSnapshotContentModel.
            if filetype in ALLOWED_IMAGE_EXTENSIONS:
                pattern = re.compile(
                    r'^/([^/]+)/assets/(([^/]+)\.(' + '|'.join(
                        ALLOWED_IMAGE_EXTENSIONS) + '))$')
                catched_groups = pattern.match(instance_id)
                if not catched_groups:
                    yield (WRONG_INSTANCE_ID, instance_id)
                else:
                    filename = catched_groups.group(2)
                    filepath = 'assets/' + filename
                    exploration_id = catched_groups.group(1)
                    file_model = file_models.FileModel.get_model(
                        exploration_id, filepath, False)
                    if file_model:
                        content = file_model.content
                        fs = fs_domain.AbstractFileSystem(
                            fs_domain.GcsFileSystem(exploration_id))
                        if fs.isfile('image/%s' % filename):
                            yield (FILE_ALREADY_EXISTS, file_model.id)
                        else:
                            fs.commit(
                                'ADMIN', 'image/%s' % filename,
                                content, mimetype='image/%s' % filetype)
                            yield (FILE_COPIED, 1)
                    else:
                        yield (FOUND_DELETED_FILE, file_model.id)


    @staticmethod
    def reduce(status, values):
        if status == FILE_COPIED:
            yield (status, len(values))
        else:
            yield (status, values)


class DeleteImagesFromGAEJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for deleting the images in the exploration
    from the GAE.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [file_models.FileSnapshotContentModel]

    @staticmethod
    def map(file_snapshot_content_model):
        # This job is allowed to run only in Production environment since it
        # uses GcsFileSystem which can't be used in Development environment.
        if not feconf.DEV_MODE:
            instance_id = (
                file_snapshot_content_model.get_unversioned_instance_id())
            filetype = instance_id[instance_id.rfind('.') + 1:]
            # To separate the image entries from the audio entries we get from
            # the FileSnapshotContentModel.
            if filetype in ALLOWED_IMAGE_EXTENSIONS:
                pattern = re.compile(
                    r'^/([^/]+)/assets/(([^/]+)\.(' + '|'.join(
                        ALLOWED_IMAGE_EXTENSIONS) + '))$')
                catched_groups = pattern.match(instance_id)
                if not catched_groups:
                    yield (WRONG_INSTANCE_ID, instance_id)
                else:
                    filename = catched_groups.group(2)
                    filepath = 'assets/' + filename
                    exploration_id = catched_groups.group(1)
                    file_model = file_models.FileModel.get_model(
                        exploration_id, filepath, False)
                    if file_model:
                        filemetadata_model = (
                            file_models.FileMetadataModel.get_model(
                                exploration_id, filepath, False))

                        fs = fs_domain.AbstractFileSystem(
                            fs_domain.GcsFileSystem(exploration_id))

                        if not fs.isfile('image/%s' % filename):
                            yield (FILE_IS_NOT_IN_GCS, file_model.id)
                        else:
                            file_model.delete(
                                'ADMIN',
                                'Deleting file_model for image from GAE',
                                False)
                            filemetadata_model.delete(
                                'ADMIN',
                                'Deleting filemetamodel for image from GAE',
                                False)
                            yield (FILE_DELETED, file_model.id)

    @staticmethod
    def reduce(status, values):
        if status == FILE_IS_NOT_IN_GCS:
            yield (NO_OF_FILES_NOT_IN_GCS, len(values))
        else:
            yield (NO_OF_FILES_DELETED, len(values))
