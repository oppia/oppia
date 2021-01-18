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

"""Validators for exploration models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import rights_domain
from core.domain import rights_manager
from core.platform import models
import feconf
import python_utils
import utils

(
    base_models, exp_models, story_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration,
    models.NAMES.story
])

TARGET_TYPE_TO_TARGET_MODEL = {
    feconf.ENTITY_TYPE_EXPLORATION: (
        exp_models.ExplorationModel)
}


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


class ExplorationContextModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating ExplorationContextModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.story_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exp_ids', exp_models.ExplorationModel, [item.id])]


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
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


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
            # TODO (#10828): Remove validation for cloned_from
            # exp ids after the field is entirely removed from
            # all models.
            base_model_validators.ExternalModelFetcherDetails(
                'cloned_from_exploration_ids',
                exp_models.ExplorationModel,
                cloned_from_exploration_id),
            base_model_validators.UserSettingsModelFetcherDetails(
                'owner_user_ids', item.owner_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.UserSettingsModelFetcherDetails(
                'editor_user_ids', item.editor_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.UserSettingsModelFetcherDetails(
                'viewer_user_ids', item.viewer_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
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
            item: datastore_services.Model. ExplorationRightsModel to validate.
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
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


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
                exp_models.ExplorationModel, [item.exploration_id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]
        if item.id.startswith('rights'):
            external_id_relationships.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'exploration_rights_ids', exp_models.ExplorationRightsModel,
                    [item.exploration_id]))
        return external_id_relationships
