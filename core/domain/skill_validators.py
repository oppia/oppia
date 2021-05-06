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

"""Validators for skill prod models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.platform import models
import python_utils

(
    base_models, question_models, skill_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.question, models.NAMES.skill,
    models.NAMES.user
])


class SkillModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating SkillModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return skill_fetchers.get_skill_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        superseding_skill_ids = []
        if item.superseding_skill_id:
            superseding_skill_ids = [item.superseding_skill_id]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'skill_commit_log_entry_ids',
                skill_models.SkillCommitLogEntryModel,
                ['skill-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'skill_summary_ids', skill_models.SkillSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'superseding_skill_ids', skill_models.SkillModel,
                superseding_skill_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                skill_models.SkillSnapshotMetadataModel, snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids', skill_models.SkillSnapshotContentModel,
                snapshot_model_ids)]

    @classmethod
    def _validate_all_questions_merged(cls, item):
        """Validate that all_questions_merged is True only if
        superseding_skill_id is not None and there are no
        questions linked with the skill. The superseding skill
        id check is already performed in domain object validation,
        so it is not repeated here.

        Args:
            item: datastore_services.Model. SkillModel to validate.
        """
        questions_ids_linked_with_skill = (
            question_models.QuestionSkillLinkModel
            .get_all_question_ids_linked_to_skill_id(item.id))
        if item.all_questions_merged and questions_ids_linked_with_skill:
            cls._add_error(
                'all questions merged check',
                'Entity id %s: all_questions_merged is True but the '
                'following question ids are still linked to the skill: %s' % (
                    item.id, questions_ids_linked_with_skill))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_all_questions_merged]


class SkillSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating SkillSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'skill'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return skill_domain.SkillChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class SkillSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating SkillSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'skill'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class SkillCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating SkillCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'skill'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [skill/rights]-[skill_id]-[skill_version].
        regex_string = '^(skill|rights)-%s-\\d+$' % (
            item.skill_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('skill'):
            return skill_domain.SkillChange
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
                'skill_ids', skill_models.SkillModel, [item.skill_id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class SkillSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating SkillSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return skill_services.get_skill_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, [item.id])]

    @classmethod
    def _validate_misconception_count(
            cls, item, field_name_to_external_model_references):
        """Validate that misconception_count of model is equal to
        number of misconceptions in SkillModel.misconceptions.

        Args:
            item: datastore_services.Model. SkillSummaryModel to validate.
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
        skill_model_references = (
            field_name_to_external_model_references['skill_ids'])

        for skill_model_reference in skill_model_references:
            skill_model = skill_model_reference.model_instance
            if not skill_model or skill_model.deleted:
                model_class = skill_model_reference.model_class
                model_id = skill_model_reference.model_id
                cls._add_error(
                    'skill_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field skill_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.misconception_count != len(skill_model.misconceptions):
                cls._add_error(
                    'misconception %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Misconception count: %s does not match '
                    'the number of misconceptions in skill model: %s' % (
                        item.id, item.misconception_count,
                        skill_model.misconceptions))

    @classmethod
    def _validate_worked_examples_count(
            cls, item, field_name_to_external_model_references):
        """Validate that worked examples count of model is equal to
        number of misconceptions in SkillModel.skill_contents.worked_examples.

        Args:
            item: datastore_services.Model. SkillSummaryModel to validate.
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
        skill_model_references = (
            field_name_to_external_model_references['skill_ids'])

        for skill_model_reference in skill_model_references:
            skill_model = skill_model_reference.model_instance
            if not skill_model or skill_model.deleted:
                model_class = skill_model_reference.model_class
                model_id = skill_model_reference.model_id
                cls._add_error(
                    'skill_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field skill_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.worked_examples_count != len(
                    skill_model.skill_contents['worked_examples']):
                cls._add_error(
                    'worked examples %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Worked examples count: %s does not match '
                    'the number of worked examples in skill_contents '
                    'in skill model: %s' % (
                        item.id, item.worked_examples_count,
                        skill_model.skill_contents['worked_examples']))

    @classmethod
    def _get_external_model_properties(cls):
        skill_model_properties_dict = {
            'description': 'description',
            'language_code': 'language_code',
            'skill_model_created_on': 'created_on',
            'skill_model_last_updated': 'last_updated'
        }

        return [(
            'skill',
            'skill_ids',
            skill_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_misconception_count,
            cls._validate_worked_examples_count]
