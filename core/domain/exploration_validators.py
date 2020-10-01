# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Validator for exploration model."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import base_model_validators
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import rights_domain
from core.domain import rights_manager
from core.platform import models
import python_utils
import utils

(
    base_models, exp_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration, models.NAMES.user
])


class ExplorationUserDataModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating ExplorationUserDataModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.exploration_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'user_settings_ids', user_models.UserSettingsModel,
                [item.user_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                [item.exploration_id])]

    @classmethod
    def _validate_draft_change_list(cls, item):
        """Validates that commands in draft change list follow
        the schema of ExplorationChange domain object.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        if item.draft_change_list is None:
            return
        for change_dict in item.draft_change_list:
            try:
                exp_domain.ExplorationChange(change_dict)
            except Exception as e:
                cls._add_error(
                    'draft change list check',
                    'Entity id %s: Invalid change dict %s due to error %s' % (
                        item.id, change_dict, e))

    @classmethod
    def _validate_rating(cls, item):
        """Validates that rating is in the interval [1, 5].

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        if item.rating is not None and (item.rating < 1 or item.rating > 5):
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATINGS_CHECK,
                'Entity id %s: Expected rating to be in range [1, 5], '
                'received %s' % (item.id, item.rating))

    @classmethod
    def _validate_rated_on(cls, item):
        """Validates that rated on is less than the time when job
        was run.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        if item.rating is not None and not item.rated_on:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATED_ON_CHECK,
                'Entity id %s: rating %s exists but rated on is None' % (
                    item.id, item.rating))
        current_time = datetime.datetime.utcnow()
        if item.rated_on is not None and item.rated_on > current_time:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATED_ON_CHECK,
                'Entity id %s: rated on %s is greater than the time '
                'when job was run' % (item.id, item.rated_on))

    @classmethod
    def _validate_draft_change_list_last_updated(cls, item):
        """Validates that draft change list last updated is less than
        the time when job was run.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        if item.draft_change_list and not item.draft_change_list_last_updated:
            cls._add_error(
                'draft change list %s' % (
                    base_model_validators.ERROR_CATEGORY_LAST_UPDATED_CHECK),
                'Entity id %s: draft change list %s exists but '
                'draft change list last updated is None' % (
                    item.id, item.draft_change_list))
        current_time = datetime.datetime.utcnow()
        if item.draft_change_list_last_updated is not None and (
                item.draft_change_list_last_updated > current_time):
            cls._add_error(
                'draft change list %s' % (
                    base_model_validators.ERROR_CATEGORY_LAST_UPDATED_CHECK),
                'Entity id %s: draft change list last updated %s is '
                'greater than the time when job was run' % (
                    item.id, item.draft_change_list_last_updated))

    @classmethod
    def _validate_exp_version(
            cls, item, field_name_to_external_model_references):
        """Validates that draft change exp version is less than version
        of the exploration corresponding to the model.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expect model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.draft_change_list_exp_version > exploration_model.version:
                cls._add_error(
                    'exp %s' % (
                        base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: draft change list exp version %s is '
                    'greater than version %s of corresponding exploration '
                    'with id %s' % (
                        item.id, item.draft_change_list_exp_version,
                        exploration_model.version, exploration_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_draft_change_list,
            cls._validate_rating,
            cls._validate_rated_on,
            cls._validate_draft_change_list_last_updated]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_exp_version]


class ExplorationModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating ExplorationModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return exp_fetchers.get_exploration_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        exp_rights = rights_manager.get_exploration_rights(
            item.id, strict=False)

        if exp_rights is None:
            return base_model_validators.VALIDATION_MODE_NEUTRAL

        if rights_manager.is_exploration_private(item.id):
            return base_model_validators.VALIDATION_MODE_NON_STRICT

        return base_model_validators.VALIDATION_MODE_STRICT

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_commit_log_entry_ids',
                exp_models.ExplorationCommitLogEntryModel,
                ['exploration-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'exp_summary_ids',
                exp_models.ExpSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_rights_ids',
                exp_models.ExplorationRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                exp_models.ExplorationSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                exp_models.ExplorationSnapshotContentModel,
                snapshot_model_ids)]


class ExplorationSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return exp_domain.ExplorationChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel, [item.committer_id])]


class ExplorationSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating ExplorationSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class ExplorationRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating ExplorationRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        cloned_from_exploration_id = []
        if item.cloned_from:
            cloned_from_exploration_id.append(item.cloned_from)
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'cloned_from_exploration_ids',
                exp_models.ExplorationModel,
                cloned_from_exploration_id),
            base_model_validators.ExternalModelFetcherDetails(
                'owner_user_ids',
                user_models.UserSettingsModel, item.owner_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'editor_user_ids',
                user_models.UserSettingsModel, item.editor_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'viewer_user_ids',
                user_models.UserSettingsModel, item.viewer_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                exp_models.ExplorationRightsSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                exp_models.ExplorationRightsSnapshotContentModel,
                snapshot_model_ids)]

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ndb.Model. ExplorationRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_FIRST_PUBLISHED_MSEC_CHECK,
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run' % (
                    item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class ExplorationRightsSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'exploration rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_domain.ExplorationRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_rights_ids',
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.ExternalModelFetcherDetails(
                'committer_ids',
                user_models.UserSettingsModel, [item.committer_id])]


class ExplorationRightsSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating ExplorationRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'exploration rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_rights_ids',
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class ExplorationCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating ExplorationCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exploration/rights]-[exploration_id]-[exploration-version].
        regex_string = '^(exploration|rights)-%s-\\d+$' % (
            item.exploration_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_domain.ExplorationRightsChange
        elif item.id.startswith('exploration'):
            return exp_domain.ExplorationChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel, [item.exploration_id])]
        if item.id.startswith('rights'):
            external_id_relationships.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'exploration_rights_ids', exp_models.ExplorationRightsModel,
                    [item.exploration_id]))
        return external_id_relationships
