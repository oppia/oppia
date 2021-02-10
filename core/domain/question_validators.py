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

"""Validators for question models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.domain import skill_fetchers
from core.platform import models
import python_utils
import utils

(
    base_models, question_models,
    skill_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.question,
    models.NAMES.skill, models.NAMES.user
])


class QuestionModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating QuestionModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return question_fetchers.get_question_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_commit_log_entry_ids',
                question_models.QuestionCommitLogEntryModel,
                ['question-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'question_summary_ids',
                question_models.QuestionSummaryModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                question_models.QuestionSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                question_models.QuestionSnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'linked_skill_ids',
                skill_models.SkillModel, item.linked_skill_ids)]

    @classmethod
    def _validate_inapplicable_skill_misconception_ids(cls, item):
        """Validate that inapplicable skill misconception ids are valid.

        Args:
            item: datastore_services.Model. QuestionModel to validate.
        """
        inapplicable_skill_misconception_ids = (
            item.inapplicable_skill_misconception_ids)
        skill_misconception_id_mapping = {}
        skill_ids = []
        for skill_misconception_id in inapplicable_skill_misconception_ids:
            skill_id, misconception_id = skill_misconception_id.split('-')
            skill_misconception_id_mapping[skill_id] = misconception_id
            skill_ids.append(skill_id)

        skills = skill_fetchers.get_multi_skills(skill_ids, strict=False)
        for skill in skills:
            if skill is not None:
                misconception_ids = [
                    misconception.id
                    for misconception in skill.misconceptions
                ]
                expected_misconception_id = (
                    skill_misconception_id_mapping[skill.id])
                if int(expected_misconception_id) not in misconception_ids:
                    cls._add_error(
                        'misconception id',
                        'Entity id %s: misconception with the id %s does '
                        'not exist in the skill with id %s' % (
                            item.id, expected_misconception_id, skill.id))
        missing_skill_ids = utils.compute_list_difference(
            skill_ids,
            [skill.id for skill in skills if skill is not None])
        for skill_id in missing_skill_ids:
            cls._add_error(
                'skill id',
                'Entity id %s: skill with the following id does not exist:'
                ' %s' % (item.id, skill_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_inapplicable_skill_misconception_ids]


class QuestionSkillLinkModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating QuestionSkillLinkModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '%s:%s' % (item.question_id, item.skill_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel,
                [item.question_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, [item.skill_id])]


class QuestionSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating QuestionSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return question_domain.QuestionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class QuestionSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating QuestionSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class QuestionCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
    """Class for validating QuestionCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [question]-[question_id]-[question_version].
        regex_string = '^(question)-%s-\\d+$' % (
            item.question_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('question'):
            return question_domain.QuestionChange
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
                'question_ids', question_models.QuestionModel,
                [item.question_id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class QuestionSummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating QuestionSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return question_services.get_question_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'question_ids', question_models.QuestionModel, [item.id])]

    @classmethod
    def _validate_question_content(
            cls, item, field_name_to_external_model_references):
        """Validate that question_content model is equal to
        QuestionModel.question_state_data.content.html.

        Args:
            item: datastore_services.Model. QuestionSummaryModel to validate.
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
        question_model_references = (
            field_name_to_external_model_references['question_ids'])

        for question_model_reference in question_model_references:
            question_model = question_model_reference.model_instance
            if question_model is None or question_model.deleted:
                model_class = question_model_reference.model_class
                model_id = question_model_reference.model_id
                cls._add_error(
                    'question_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field question_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            content_html = question_model.question_state_data['content']['html']
            if item.question_content != content_html:
                cls._add_error(
                    'question content check',
                    'Entity id %s: Question content: %s does not match '
                    'content html in question state data in question '
                    'model: %s' % (
                        item.id, item.question_content,
                        content_html))

    @classmethod
    def _get_external_model_properties(cls):
        question_model_properties_dict = {
            'question_model_created_on': 'created_on',
            'question_model_last_updated': 'last_updated'
        }

        return [(
            'question',
            'question_ids',
            question_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_question_content]
