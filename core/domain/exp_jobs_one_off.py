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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import logging
import re

from constants import constants
from core import jobs
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import html_validation_service
from core.domain import image_validation_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.platform import models
import feconf
import python_utils
import utils

(
    base_models,
    exp_models,
    feedback_models,
    improvements_models,
    skill_models,
    stats_models,
    story_models,
) = models.Registry.import_models([
    models.NAMES.base_model,
    models.NAMES.exploration,
    models.NAMES.feedback,
    models.NAMES.improvements,
    models.NAMES.skill,
    models.NAMES.statistics,
    models.NAMES.story,
])


class RegenerateStringPropertyIndexOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job for regenerating the index of models changed to use an
    indexed StringProperty.

    Cloud NDB dropped support for StringProperty(indexed=False) and
    TextProperty(indexed=True). Therefore, to prepare for the migration to Cloud
    NDB, we need to regenerate the indexes for every model that has been changed
    in this way.

    https://cloud.google.com/appengine/docs/standard/python/datastore/indexes#unindexed-properties:
    > changing a property from unindexed to indexed does not affect any existing
    > entities that may have been created before the change. Queries filtering
    > on the property will not return such existing entities, because the
    > entities weren't written to the query's index when they were created. To
    > make the entities accessible by future queries, you must rewrite them to
    > Datastore so that they will be entered in the appropriate indexes. That
    > is, you must do the following for each such existing entity:
    > 1.  Retrieve (get) the entity from Datastore.
    > 2.  Write (put) the entity back to Datastore.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            exp_models.ExplorationModel,
            feedback_models.GeneralFeedbackMessageModel,
            improvements_models.TaskEntryModel,
            skill_models.SkillModel,
            stats_models.ExplorationAnnotationsModel,
            story_models.StoryModel,
            story_models.StorySummaryModel,
        ]

    @staticmethod
    def map(model):
        model_kind = type(model).__name__
        if isinstance(model, base_models.VersionedModel):
            # Change the method resolution order of model to use BaseModel's
            # implementation of `put`.
            model = super(base_models.VersionedModel, model)
        model.update_timestamps(update_last_updated_time=False)
        model.put()
        yield (model_kind, 1)

    @staticmethod
    def reduce(key, counts):
        yield (key, len(counts))


class ExplorationFirstPublishedOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that finds first published time in milliseconds for all
    explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotContentModel]

    @staticmethod
    def map(item):
        if item.content['status'] == rights_domain.ACTIVITY_STATUS_PUBLIC:
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

        exploration = exp_fetchers.get_exploration_from_model(item)
        exp_rights = rights_manager.get_exploration_rights(item.id)

        try:
            if exp_rights.status == rights_domain.ACTIVITY_STATUS_PRIVATE:
                exploration.validate()
            else:
                exploration.validate(strict=True)
        except utils.ValidationError as e:
            yield (item.id, python_utils.convert_to_bytes(e))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExplorationMigrationAuditJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-off job for testing exploration migration from any
    exploration schema version to the latest. This job runs the state
    migration, but does not commit the new exploration to the store.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(ExplorationMigrationAuditJob, cls).enqueue(
            job_id, shard_count=64)

    @staticmethod
    def map(item):
        if item.deleted:
            return

        current_state_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION

        states_schema_version = item.states_schema_version
        versioned_exploration_states = {
            'states_schema_version': states_schema_version,
            'states': item.states
        }
        while states_schema_version < current_state_schema_version:
            try:
                exp_domain.Exploration.update_states_from_model(
                    versioned_exploration_states, states_schema_version,
                    item.id)
                states_schema_version += 1
            except Exception as e:
                error_message = (
                    'Exploration %s failed migration to states v%s: %s' %
                    (item.id, states_schema_version + 1, e))
                logging.exception(error_message)
                yield ('MIGRATION_ERROR', error_message.encode('utf-8'))
                break

            if states_schema_version == current_state_schema_version:
                yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        if key == 'SUCCESS':
            yield (key, len(values))
        else:
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

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(ExplorationMigrationJobManager, cls).enqueue(
            job_id, shard_count=64)

    @staticmethod
    def map(item):
        if item.deleted:
            return

        # Do not upgrade explorations that fail non-strict validation.
        old_exploration = exp_fetchers.get_exploration_by_id(item.id)
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
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            # Note: update_exploration does not need to apply a change list in
            # order to perform a migration. See the related comment in
            # exp_services.apply_change_list for more information.
            #
            # Note: from_version and to_version really should be int, but left
            # as str to conform with legacy data.
            commit_cmds = [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': python_utils.UNICODE(
                    item.states_schema_version),
                'to_version': python_utils.UNICODE(
                    feconf.CURRENT_STATE_SCHEMA_VERSION)
            })]
            exp_services.update_exploration(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update exploration states from schema version %d to %d.' % (
                    item.states_schema_version,
                    feconf.CURRENT_STATE_SCHEMA_VERSION))
            yield ('SUCCESS', item.id)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class ExplorationMathSvgFilenameValidationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of an exploration and validates the
    svg_filename fields in each math rich-text components.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        invalid_tags_info_in_exp = []
        for state_name, state in exploration.states.items():
            html_string = ''.join(state.get_all_html_content_strings())
            error_list = (
                html_validation_service.
                validate_svg_filenames_in_math_rich_text(
                    feconf.ENTITY_TYPE_EXPLORATION, item.id, html_string))
            if len(error_list) > 0:
                invalid_tags_info_in_state = {
                    'state_name': state_name,
                    'error_list': error_list,
                    'no_of_invalid_tags': len(error_list)
                }
                invalid_tags_info_in_exp.append(invalid_tags_info_in_state)
        if len(invalid_tags_info_in_exp) > 0:
            yield ('Found invalid tags', (item.id, invalid_tags_info_in_exp))

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        no_of_invalid_tags = 0
        invalid_tags_info = {}
        for exp_id, invalid_tags_info_in_exp in final_values:
            invalid_tags_info[exp_id] = []
            for value in invalid_tags_info_in_exp:
                no_of_invalid_tags += value['no_of_invalid_tags']
                del value['no_of_invalid_tags']
                invalid_tags_info[exp_id].append(value)

        final_value_dict = {
            'no_of_explorations_with_no_svgs': len(final_values),
            'no_of_invalid_tags': no_of_invalid_tags,
        }
        yield ('Overall result.', final_value_dict)
        yield ('Detailed information on invalid tags. ', invalid_tags_info)


class ExplorationRteMathContentValidationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of an exploration and validates the
    Math content object for each math rich-text components.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        exploration = exp_fetchers.get_exploration_from_model(item)
        invalid_tags_info_in_exp = []
        for state_name, state in exploration.states.items():
            html_string = ''.join(state.get_all_html_content_strings())
            error_list = (
                html_validation_service.
                validate_math_content_attribute_in_html(html_string))
            if len(error_list) > 0:
                invalid_tags_info_in_state = {
                    'state_name': state_name,
                    'error_list': error_list,
                    'no_of_invalid_tags': len(error_list)
                }
                invalid_tags_info_in_exp.append(invalid_tags_info_in_state)
        if len(invalid_tags_info_in_exp) > 0:
            yield ('Found invalid tags', (item.id, invalid_tags_info_in_exp))

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        no_of_invalid_tags = 0
        invalid_tags_info = {}
        for exp_id, invalid_tags_info_in_exp in final_values:
            invalid_tags_info[exp_id] = []
            for value in invalid_tags_info_in_exp:
                no_of_invalid_tags += value['no_of_invalid_tags']
                del value['no_of_invalid_tags']
                invalid_tags_info[exp_id].append(value)

        final_value_dict = {
            'no_of_explorations_with_no_svgs': len(final_values),
            'no_of_invalid_tags': no_of_invalid_tags,
        }
        yield ('Overall result.', final_value_dict)
        yield ('Detailed information on invalid tags.', invalid_tags_info)


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

        exploration = exp_fetchers.get_exploration_from_model(item)
        for state_name, state in exploration.states.items():
            hints_length = len(state.interaction.hints)
            if hints_length > 0:
                exp_and_state_key = '%s %s' % (
                    item.id, state_name.encode('utf-8'))
                yield (python_utils.UNICODE(hints_length), exp_and_state_key)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


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

        try:
            exploration = exp_fetchers.get_exploration_from_model(item)
        except Exception as e:
            yield (
                'Error %s when loading exploration'
                % python_utils.convert_to_bytes(e), [item.id])
            return

        html_list = exploration.get_all_html_content_strings()

        err_dict = html_validation_service.validate_rte_format(
            html_list, feconf.RTE_FORMAT_CKEDITOR)

        for key in err_dict:
            if err_dict[key]:
                yield ('%s Exp Id: %s' % (key, item.id), err_dict[key])

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        # Combine all values from multiple lists into a single list
        # for that error type.
        output_values = list(set().union(*final_values))
        exp_id_index = key.find('Exp Id:')
        if exp_id_index == -1:
            yield (key, output_values)
        else:
            output_values.append(key[exp_id_index:])
            yield (key[:exp_id_index - 1], output_values)


class RTECustomizationArgsValidationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job for validating all the customizations arguments of
    Rich Text Components.
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
            exploration = exp_fetchers.get_exploration_from_model(item)
        except Exception as e:
            yield (
                'Error %s when loading exploration'
                % python_utils.UNICODE(e), [item.id])
            return

        html_list = exploration.get_all_html_content_strings()
        err_dict = html_validation_service.validate_customization_args(
            html_list)
        for key in err_dict:
            err_value_with_exp_id = err_dict[key]
            err_value_with_exp_id.append('Exp ID: %s' % item.id)
            yield (key, err_value_with_exp_id)

    @staticmethod
    def reduce(key, values):
        final_values = [ast.literal_eval(value) for value in values]
        flattened_values = [
            item for sublist in final_values for item in sublist]

        # Errors produced while loading exploration only contain exploration id
        # in error message, so no further formatting is required. For errors
        # from validation the output is in format [err1, expid1, err2, expid2].
        # So, we further format it as [(expid1, err1), (expid2, err2)].
        if 'loading exploration' in key:
            yield (key, flattened_values)
            return

        output_values = []
        index = 0
        while index < len(flattened_values):
            # flattened_values[index] = error message.
            # flattened_values[index + 1] = exp id in which error message
            # is present.
            output_values.append((
                flattened_values[index + 1], flattened_values[index]))
            index += 2
        output_values.sort()
        yield (key, output_values)


class PopulateXmlnsAttributeInExplorationMathSvgImagesJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate xmlns attribute in the math-expression svg
    images.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        fs = fs_domain.AbstractFileSystem(fs_domain.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, item.id))
        filepaths = fs.listdir('image')
        count_of_unchanged_svgs = 0
        filenames_of_modified_svgs = []
        for filepath in filepaths:
            filename = filepath.split('/')[-1]
            if not re.match(constants.MATH_SVG_FILENAME_REGEX, filename):
                continue
            old_svg_image = fs.get(filepath)
            new_svg_image = (
                html_validation_service.get_svg_with_xmlns_attribute(
                    old_svg_image))
            if new_svg_image == old_svg_image:
                count_of_unchanged_svgs += 1
                continue
            try:
                image_validation_services.validate_image_and_filename(
                    new_svg_image, filename)
            except Exception as e:
                yield (
                    'FAILED validation',
                    'Exploration with id %s failed image validation for the '
                    'filename %s with following error: %s' % (
                        item.id, filename, e))
            else:
                fs.commit(
                    filepath.encode('utf-8'), new_svg_image,
                    mimetype='image/svg+xml')
                filenames_of_modified_svgs.append(filename)
        if count_of_unchanged_svgs:
            yield ('UNCHANGED', count_of_unchanged_svgs)
        if len(filenames_of_modified_svgs) > 0:
            yield (
                'SUCCESS - CHANGED Exp Id: %s' % item.id,
                filenames_of_modified_svgs)

    @staticmethod
    def reduce(key, values):
        if key == 'UNCHANGED':
            final_values = [ast.literal_eval(value) for value in values]
            yield (key, sum(final_values))
        else:
            exp_id_index = key.find('Exp Id:')
            if exp_id_index == -1:
                yield (key, values)
            else:
                final_values = [ast.literal_eval(value) for value in values]
                output_values = list(set().union(*final_values))
                output_values.append(key[exp_id_index:])
                yield (key[:exp_id_index - 1], output_values)


class XmlnsAttributeInExplorationMathSvgImagesAuditJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job to audit math SVGs on the server that do not have xmlns
    attribute.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        fs = fs_domain.AbstractFileSystem(fs_domain.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, item.id))
        filepaths = fs.listdir('image')
        for filepath in filepaths:
            filename = filepath.split('/')[-1]
            if not re.match(constants.MATH_SVG_FILENAME_REGEX, filename):
                continue
            old_svg_image = fs.get(filepath)
            xmlns_attribute_is_present = (
                html_validation_service.does_svg_tag_contains_xmlns_attribute(
                    old_svg_image))
            if not xmlns_attribute_is_present:
                yield (item.id, filename)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class RemoveTranslatorIdsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that deletes the translator_ids from the ExpSummaryModel.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel]

    @staticmethod
    def map(exp_summary_model):
        # This is the only way to remove the field from the model,
        # see https://stackoverflow.com/a/15116016/3688189 and
        # https://stackoverflow.com/a/12701172/3688189.
        if 'translator_ids' in exp_summary_model._properties:  # pylint: disable=protected-access
            del exp_summary_model._properties['translator_ids']  # pylint: disable=protected-access
            if 'translator_ids' in exp_summary_model._values:  # pylint: disable=protected-access
                del exp_summary_model._values['translator_ids']  # pylint: disable=protected-access
            exp_summary_model.update_timestamps(update_last_updated_time=False)
            exp_summary_model.put()
            yield ('SUCCESS_REMOVED - ExpSummaryModel', exp_summary_model.id)
        else:
            yield (
                'SUCCESS_ALREADY_REMOVED - ExpSummaryModel',
                exp_summary_model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


def regenerate_exp_commit_log_model(exp_model, version):
    """Helper function to regenerate a commit log model for an
    exploration model.

    NOTE TO DEVELOPERS: Do not delete this function until issue #10808 is fixed.

    Args:
        exp_model: ExplorationModel. The exploration model for which
            commit log model is to be generated.
        version: int. The commit log version to be generated.

    Returns:
        ExplorationCommitLogEntryModel. The regenerated commit log model.
    """
    metadata_model = (
        exp_models.ExplorationSnapshotMetadataModel.get_by_id(
            '%s-%s' % (exp_model.id, version)))

    required_rights_model = exp_models.ExplorationRightsModel.get(
        exp_model.id, strict=True, version=1)
    for rights_version in python_utils.RANGE(2, version + 1):
        rights_model = exp_models.ExplorationRightsModel.get(
            exp_model.id, strict=False, version=rights_version)
        if rights_model is None:
            break
        if rights_model.created_on <= metadata_model.created_on:
            required_rights_model = rights_model
        else:
            break
    commit_log_model = (
        exp_models.ExplorationCommitLogEntryModel.create(
            exp_model.id, version, metadata_model.committer_id,
            metadata_model.commit_type,
            metadata_model.commit_message,
            metadata_model.commit_cmds,
            required_rights_model.status,
            required_rights_model.community_owned))
    commit_log_model.exploration_id = exp_model.id
    commit_log_model.created_on = metadata_model.created_on
    commit_log_model.last_updated = metadata_model.last_updated
    return commit_log_model


class RegenerateMissingExpCommitLogModels(jobs.BaseMapReduceOneOffJobManager):
    """Job that regenerates missing commit log models for an exploration.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10808 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        for version in python_utils.RANGE(1, item.version + 1):
            commit_log_model = (
                exp_models.ExplorationCommitLogEntryModel.get_by_id(
                    'exploration-%s-%s' % (item.id, version)))
            if commit_log_model is None:
                commit_log_model = regenerate_exp_commit_log_model(
                    item, version)
                commit_log_model.update_timestamps(
                    update_last_updated_time=False)
                commit_log_model.put()
                yield (
                    'Regenerated Exploration Commit Log Model: version %s' % (
                        version), item.id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ExpCommitLogModelRegenerationValidator(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that validates the process of regeneration of commit log
    models for an exploration.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10808 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        # This is done to ensure that all explorations are not checked and
        # a random sample of the explorations is checked.
        last_char_in_id = item.id[-1]
        if last_char_in_id < 'a' or last_char_in_id > 'j':
            return

        for version in python_utils.RANGE(1, item.version + 1):
            commit_log_model = (
                exp_models.ExplorationCommitLogEntryModel.get_by_id(
                    'exploration-%s-%s' % (item.id, version)))
            if commit_log_model is None:
                continue
            regenerated_commit_log_model = regenerate_exp_commit_log_model(
                item, version)

            fields = [
                'user_id', 'commit_type', 'commit_message', 'commit_cmds',
                'version', 'post_commit_status', 'post_commit_community_owned',
                'post_commit_is_private', 'exploration_id'
            ]

            for field in fields:
                commit_model_field_val = getattr(commit_log_model, field)
                regenerated_commit_log_model_field_val = getattr(
                    regenerated_commit_log_model, field)
                if commit_model_field_val != (
                        regenerated_commit_log_model_field_val):
                    yield (
                        'Mismatch between original model and regenerated model',
                        '%s in original model: %s, in regenerated model: %s' % (
                            field, commit_model_field_val,
                            regenerated_commit_log_model_field_val))

            time_fields = ['created_on', 'last_updated']
            for field in time_fields:
                commit_model_field_val = getattr(commit_log_model, field)
                regenerated_commit_log_model_field_val = getattr(
                    regenerated_commit_log_model, field)
                max_allowed_val = regenerated_commit_log_model_field_val + (
                    datetime.timedelta(minutes=1))
                min_allowed_val = regenerated_commit_log_model_field_val - (
                    datetime.timedelta(minutes=1))
                if commit_model_field_val > max_allowed_val or (
                        commit_model_field_val < min_allowed_val):
                    yield (
                        'Mismatch between original model and regenerated model',
                        '%s in original model: %s, in regenerated model: %s' % (
                            field, commit_model_field_val,
                            regenerated_commit_log_model_field_val))

    @staticmethod
    def reduce(key, values):
        yield (key, values)
