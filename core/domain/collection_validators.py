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

"""Validators for collection models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.platform import models
import python_utils
import utils

(
    base_models, collection_models, exp_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.exploration
])


class CollectionModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating CollectionModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        collection_rights = rights_manager.get_collection_rights(
            item.id, strict=False)

        if collection_rights is None:
            return base_model_validators.VALIDATION_MODE_NEUTRAL

        if rights_manager.is_collection_private(item.id):
            return base_model_validators.VALIDATION_MODE_NON_STRICT

        return base_model_validators.VALIDATION_MODE_STRICT

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in item.collection_contents[
                    'nodes']]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_commit_log_entry_ids',
                collection_models.CollectionCommitLogEntryModel,
                ['collection-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_summary_ids',
                collection_models.CollectionSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                collection_models.CollectionSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                collection_models.CollectionSnapshotContentModel,
                snapshot_model_ids)]


class CollectionSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return collection_domain.CollectionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class CollectionSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating CollectionSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids',
                collection_models.CollectionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class CollectionRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating CollectionRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids',
                collection_models.CollectionModel, [item.id]),
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
                collection_models.CollectionRightsSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                collection_models.CollectionRightsSnapshotContentModel,
                snapshot_model_ids)]

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: datastore_services.Model. CollectionRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_FIRST_PUBLISHED_MSEC_CHECK,
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                % (item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class CollectionRightsSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'collection rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_domain.CollectionRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class CollectionRightsSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating CollectionRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'collection rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class CollectionCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating CollectionCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [collection/rights]-[collection_id]-[collection_version].
        regex_string = '^(collection|rights)-%s-\\d+$' % (
            item.collection_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_domain.CollectionRightsChange
        elif item.id.startswith('collection'):
            return collection_domain.CollectionChange
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
                'collection_ids',
                collection_models.CollectionModel, [item.collection_id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]
        if item.id.startswith('rights'):
            external_id_relationships.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'collection_rights_ids',
                    collection_models.CollectionRightsModel,
                    [item.collection_id]))
        return external_id_relationships


class CollectionSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating CollectionSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids',
                collection_models.CollectionModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_rights_ids',
                collection_models.CollectionRightsModel, [item.id]),
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
            base_model_validators.UserSettingsModelFetcherDetails(
                'contributor_user_ids', item.contributor_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: datastore_services.Model. CollectionSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            list(item.contributors_summary.keys()))
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls._add_error(
                'contributors %s' % (
                    base_model_validators.ERROR_CATEGORY_SUMMARY_CHECK),
                'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s' % (
                    item.id, sorted(item.contributor_ids),
                    sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_node_count(
            cls, item, field_name_to_external_model_references):
        """Validate that node_count of model is equal to number of nodes
        in CollectionModel.collection_contents.

        Args:
            item: datastore_services.Model. CollectionSummaryModel to validate.
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
        collection_model_references = (
            field_name_to_external_model_references['collection_ids'])

        for collection_model_reference in collection_model_references:
            collection_model = collection_model_reference.model_instance
            if collection_model is None or collection_model.deleted:
                model_class = collection_model_reference.model_class
                model_id = collection_model_reference.model_id
                cls._add_error(
                    'collection_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field collection_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            nodes = collection_model.collection_contents['nodes']
            if item.node_count != len(nodes):
                cls._add_error(
                    'node %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Node count: %s does not match the number of '
                    'nodes in collection_contents dict: %s' % (
                        item.id, item.node_count, nodes))

    @classmethod
    def _validate_ratings_is_empty(cls, item):
        """Validate that ratings for the entity is empty.

        Args:
            item: datastore_services.Model. CollectionSummaryModel to validate.
        """
        if item.ratings:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATINGS_CHECK,
                'Entity id %s: Expected ratings for the entity to be '
                'empty but received %s' % (item.id, item.ratings))

    @classmethod
    def _get_external_model_properties(cls):
        collection_model_properties_dict = {
            'title': 'title',
            'category': 'category',
            'objective': 'objective',
            'language_code': 'language_code',
            'tags': 'tags',
            'collection_model_created_on': 'created_on',
            'collection_model_last_updated': 'last_updated'
        }

        collection_rights_model_properties_dict = {
            'status': 'status',
            'community_owned': 'community_owned',
            'owner_ids': 'owner_ids',
            'editor_ids': 'editor_ids',
            'viewer_ids': 'viewer_ids',
        }

        return [(
            'collection',
            'collection_ids',
            collection_model_properties_dict
        ), (
            'collection rights',
            'collection_rights_ids',
            collection_rights_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_ratings_is_empty,
            cls._validate_contributors_summary,
            ]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_node_count]
