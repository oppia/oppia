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

"""Validators for topic models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.platform import models
import python_utils

(
    base_models, skill_models, story_models, subtopic_models, topic_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.skill,
    models.NAMES.story, models.NAMES.subtopic, models.NAMES.topic
])


class TopicModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating TopicModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_fetchers.get_topic_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        topic_rights = topic_fetchers.get_topic_rights(
            item.id, strict=False)

        if topic_rights is None:
            return base_model_validators.VALIDATION_MODE_NEUTRAL

        if topic_rights.topic_is_published:
            return base_model_validators.VALIDATION_MODE_STRICT

        return base_model_validators.VALIDATION_MODE_NON_STRICT

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        skill_ids = item.uncategorized_skill_ids
        for subtopic in item.subtopics:
            skill_ids = skill_ids + subtopic['skill_ids']
        skill_ids = list(set(skill_ids))
        canonical_story_ids = [
            reference['story_id']
            for reference in item.canonical_story_references]
        additional_story_ids = [
            reference['story_id']
            for reference in item.additional_story_references]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_commit_log_entry_ids',
                topic_models.TopicCommitLogEntryModel,
                ['topic-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_summary_ids', topic_models.TopicSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                topic_models.TopicSnapshotMetadataModel, snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids', topic_models.TopicSnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                canonical_story_ids + additional_story_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, skill_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                ['%s-%s' % (
                    item.id, subtopic['id']) for subtopic in item.subtopics])]

    @classmethod
    def _validate_canonical_name_is_unique(cls, item):
        """Validate that canonical name of the model unique.

        Args:
            item: datastore_services.Model. TopicModel to validate.
        """
        topic_models_list = topic_models.TopicModel.query().filter(
            topic_models.TopicModel.canonical_name == (
                item.canonical_name)).filter(
                    topic_models.TopicModel.deleted == False).fetch() # pylint: disable=singleton-comparison
        topic_model_ids = [
            topic_model.id
            for topic_model in topic_models_list if topic_model.id != item.id]
        if topic_model_ids:
            cls._add_error(
                'unique %s' % base_model_validators.ERROR_CATEGORY_NAME_CHECK,
                'Entity id %s: canonical name %s matches with canonical '
                'name of topic models with ids %s' % (
                    item.id, item.canonical_name, topic_model_ids))

    @classmethod
    def _validate_canonical_name_matches_name_in_lowercase(cls, item):
        """Validate that canonical name of the model is same as name of the
        model in lowercase.

        Args:
            item: datastore_services.Model. TopicModel to validate.
        """
        name = item.name
        if name.lower() != item.canonical_name:
            cls._add_error(
                'canonical %s' % (
                    base_model_validators.ERROR_CATEGORY_NAME_CHECK),
                'Entity id %s: Entity name %s in lowercase does not match '
                'canonical name %s' % (item.id, item.name, item.canonical_name))

    @classmethod
    def _validate_uncategorized_skill_ids_not_in_subtopic_skill_ids(cls, item):
        """Validate that uncategorized_skill_ids of model is not present in
        any subtopic of the model.

        Args:
            item: datastore_services.Model. TopicModel to validate.
        """
        for skill_id in item.uncategorized_skill_ids:
            for subtopic in item.subtopics:
                if skill_id in subtopic['skill_ids']:
                    cls._add_error(
                        'uncategorized skill %s' % (
                            base_model_validators.ERROR_CATEGORY_ID_CHECK),
                        'Entity id %s: uncategorized skill id %s is present '
                        'in subtopic for entity with id %s' % (
                            item.id, skill_id, subtopic['id']))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_canonical_name_is_unique,
            cls._validate_canonical_name_matches_name_in_lowercase,
            cls._validate_uncategorized_skill_ids_not_in_subtopic_skill_ids]


class TopicSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating TopicSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class TopicSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating TopicSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class TopicRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating TopicRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel, [item.id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'manager_user_ids', item.manager_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                topic_models.TopicRightsSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                topic_models.TopicRightsSnapshotContentModel,
                snapshot_model_ids)]


class TopicRightsSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating TopicRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'topic rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class TopicRightsSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating TopicRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'topic rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class TopicCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating TopicCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [topic/rights]-[topic_id]-[topic_version].
        regex_string = '^(topic|rights)-%s-\\d*$' % (
            item.topic_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return topic_domain.TopicRightsChange
        elif item.id.startswith('topic'):
            return topic_domain.TopicChange
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
                'topic_ids', topic_models.TopicModel, [item.topic_id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]
        if item.id.startswith('rights'):
            external_id_relationships.append(
                base_model_validators.ExternalModelFetcherDetails(
                    'topic_rights_ids', topic_models.TopicRightsModel,
                    [item.topic_id]))
        return external_id_relationships


class TopicSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating TopicSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_fetchers.get_topic_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_rights_ids', topic_models.TopicRightsModel, [item.id])]

    @classmethod
    def _validate_canonical_story_count(
            cls, item, field_name_to_external_model_references):
        """Validate that canonical story count of model is equal to
        number of story ids in TopicModel.canonical_story_ids.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            pubished_canonical_story_ids = [
                reference['story_id']
                for reference in topic_model.canonical_story_references
                if reference['story_is_published']]
            if item.canonical_story_count != len(pubished_canonical_story_ids):
                cls._add_error(
                    'canonical story %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Canonical story count: %s does not '
                    'match the number of story ids in canonical_story_ids in '
                    'topic model: %s' % (
                        item.id, item.canonical_story_count,
                        pubished_canonical_story_ids))

    @classmethod
    def _validate_additional_story_count(
            cls, item, field_name_to_external_model_references):
        """Validate that additional story count of model is equal to
        number of story ids in TopicModel.additional_story_ids.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            published_additional_story_ids = [
                reference['story_id']
                for reference in topic_model.additional_story_references
                if reference['story_is_published']]
            if (
                    item.additional_story_count !=
                    len(published_additional_story_ids)):
                cls._add_error(
                    'additional story %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Additional story count: %s does not '
                    'match the number of story ids in additional_story_ids in '
                    'topic model: %s' % (
                        item.id, item.additional_story_count,
                        published_additional_story_ids))

    @classmethod
    def _validate_uncategorized_skill_count(
            cls, item, field_name_to_external_model_references):
        """Validate that uncategorized skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.uncategorized_skill_count != len(
                    topic_model.uncategorized_skill_ids):
                cls._add_error(
                    'uncategorized skill %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Uncategorized skill count: %s does not '
                    'match the number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s' % (
                        item.id, item.uncategorized_skill_count,
                        topic_model.uncategorized_skill_ids))

    @classmethod
    def _validate_total_skill_count(
            cls, item, field_name_to_external_model_references):
        """Validate that total skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids and skill
        ids in subtopics of TopicModel.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            subtopic_skill_ids = []
            for subtopic in topic_model.subtopics:
                subtopic_skill_ids = subtopic_skill_ids + subtopic['skill_ids']
            if item.total_skill_count != len(
                    topic_model.uncategorized_skill_ids + subtopic_skill_ids):
                cls._add_error(
                    'total skill %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Total skill count: %s does not '
                    'match the total number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s and skill_ids '
                    'in subtopics of topic model: %s' % (
                        item.id, item.total_skill_count,
                        topic_model.uncategorized_skill_ids,
                        subtopic_skill_ids))

    @classmethod
    def _validate_subtopic_count(
            cls, item, field_name_to_external_model_references):
        """Validate that subtopic count of model is equal to
        number of subtopics in TopicModel.

        Args:
            item: datastore_services.Model. TopicSummaryModel to validate.
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
        topic_model_references = (
            field_name_to_external_model_references['topic_ids'])

        for topic_model_reference in topic_model_references:
            topic_model = topic_model_reference.model_instance
            if topic_model is None or topic_model.deleted:
                model_class = topic_model_reference.model_class
                model_id = topic_model_reference.model_id
                cls._add_error(
                    'topic_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field topic_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.subtopic_count != len(topic_model.subtopics):
                cls._add_error(
                    'subtopic %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Subtopic count: %s does not '
                    'match the total number of subtopics in topic '
                    'model: %s ' % (
                        item.id, item.subtopic_count, topic_model.subtopics))

    @classmethod
    def _get_external_model_properties(cls):
        topic_model_properties_dict = {
            'name': 'name',
            'canonical_name': 'canonical_name',
            'language_code': 'language_code',
            'topic_model_created_on': 'created_on',
            'topic_model_last_updated': 'last_updated'
        }

        return [(
            'topic',
            'topic_ids',
            topic_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_canonical_story_count,
            cls._validate_additional_story_count,
            cls._validate_uncategorized_skill_count,
            cls._validate_total_skill_count,
            cls._validate_subtopic_count]
