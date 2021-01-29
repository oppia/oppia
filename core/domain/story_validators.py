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

"""Validators for story models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import story_domain
from core.domain import story_fetchers
from core.platform import models
import python_utils

(
    base_models, exp_models,
    story_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration,
    models.NAMES.story, models.NAMES.user
])


class StoryModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating StoryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_fetchers.get_story_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_commit_log_entry_ids',
                story_models.StoryCommitLogEntryModel,
                ['story-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'story_summary_ids',
                story_models.StorySummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                story_models.StorySnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                story_models.StorySnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in (
                    item.story_contents['nodes'])])]


class StorySnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating StorySnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return story_domain.StoryChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class StorySnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating StorySnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class StoryCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating StoryCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [story]-[story_id]-[story_version].
        regex_string = '^(story)-%s-\\d+$' % (
            item.story_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('story'):
            return story_domain.StoryChange
        else:
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.story_id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class StorySummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating StorySummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_fetchers.get_story_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.id])]

    @classmethod
    def _validate_node_titles(
            cls, item, field_name_to_external_model_references):
        """Validate that node_titles of model is equal to list of node titles
        in StoryModel.story_contents.

        Args:
            item: datastore_services.Model. StorySummaryModel to validate.
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
        story_model_references = (
            field_name_to_external_model_references['story_ids'])

        for story_model_reference in story_model_references:
            story_model = story_model_reference.model_instance
            if story_model is None or story_model.deleted:
                model_class = story_model_reference.model_class
                model_id = story_model_reference.model_id
                cls._add_error(
                    'story_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field story_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            nodes = story_model.story_contents['nodes']
            node_titles = [node['title'] for node in nodes]
            if item.node_titles != node_titles:
                cls._add_error(
                    'node titles check',
                    'Entity id %s: Node titles: %s does not match the '
                    'nodes in story_contents dict: %s' % (
                        item.id, item.node_titles, nodes))

    @classmethod
    def _get_external_model_properties(cls):
        story_model_properties_dict = {
            'title': 'title',
            'language_code': 'language_code',
            'description': 'description',
            'story_model_created_on': 'created_on',
            'story_model_last_updated': 'last_updated'
        }

        return [(
            'story',
            'story_ids',
            story_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_node_titles]
