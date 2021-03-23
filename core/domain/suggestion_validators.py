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

"""Validators for suggestion models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from constants import constants
from core.domain import base_model_validators
from core.domain import suggestion_services
from core.domain import voiceover_services
from core.platform import models
import feconf

(
    base_models, exp_models, feedback_models, question_models,
    skill_models, suggestion_models, topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.question, models.NAMES.skill, models.NAMES.suggestion,
    models.NAMES.topic, models.NAMES.user
])

TARGET_TYPE_TO_TARGET_MODEL = {
    feconf.ENTITY_TYPE_EXPLORATION: (
        exp_models.ExplorationModel),
    feconf.ENTITY_TYPE_QUESTION: (
        question_models.QuestionModel),
    feconf.ENTITY_TYPE_SKILL: (
        skill_models.SkillModel),
    feconf.ENTITY_TYPE_TOPIC: (
        topic_models.TopicModel)
}
VALID_SCORE_CATEGORIES_FOR_TYPE_QUESTION = [
    '%s\\.[A-Za-z0-9-_]{1,%s}' % (
        suggestion_models.SCORE_TYPE_QUESTION, base_models.ID_LENGTH)]


class GeneralSuggestionModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating GeneralSuggestionModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: same as thread id:
        # [target_type].[target_id].[GENERATED_STRING].
        regex_string = '^%s\\.%s\\.[A-Za-z0-9=+/]{1,}$' % (
            item.target_type, item.target_id)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            return suggestion_services.get_suggestion_from_model(item)
        else:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.ExternalModelFetcherDetails(
                'feedback_thread_ids',
                feedback_models.GeneralFeedbackThreadModel, [item.id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'author_ids', [item.author_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )
        ]

        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    '%s_ids' % item.target_type,
                    TARGET_TYPE_TO_TARGET_MODEL[item.target_type],
                    [item.target_id]))
        if item.final_reviewer_id:
            field_name_to_external_model_references.append(
                base_model_validators.UserSettingsModelFetcherDetails(
                    'reviewer_ids', [item.final_reviewer_id],
                    may_contain_system_ids=True,
                    may_contain_pseudonymous_ids=True
                ))
        return field_name_to_external_model_references

    @classmethod
    def _validate_target_type(cls, item):
        """Validate the target type is valid.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
        """
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))

    @classmethod
    def _validate_target_version_at_submission(
            cls, item, field_name_to_external_model_references):
        """Validate the target version at submission is less than or
        equal to the version of the target model.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
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
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))
            return

        target_model_references = (
            field_name_to_external_model_references[
                '%s_ids' % item.target_type])

        for target_model_reference in target_model_references:
            target_model = target_model_reference.model_instance
            if target_model is None or target_model.deleted:
                model_class = target_model_reference.model_class
                model_id = target_model_reference.model_id
                cls._add_error(
                    '%s_ids %s' % (
                        item.target_type,
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field %s_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, item.target_type,
                        model_id, model_class.__name__, model_id))
                continue
            if item.target_version_at_submission > target_model.version:
                cls._add_error(
                    'target version at submission check',
                    'Entity id %s: target version %s in entity is greater '
                    'than the version %s of %s corresponding to '
                    'id %s' % (
                        item.id, item.target_version_at_submission,
                        target_model.version, item.target_type, item.target_id))

    @classmethod
    def _validate_final_reviewer_id(cls, item):
        """Validate that final reviewer id is None if suggestion is
        under review.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
        """
        if item.final_reviewer_id is None and (
                item.status != suggestion_models.STATUS_IN_REVIEW):
            cls._add_error(
                'final %s' % (
                    base_model_validators.ERROR_CATEGORY_REVIEWER_CHECK),
                'Entity id %s: Final reviewer id is empty but '
                'suggestion is %s' % (item.id, item.status))

        if item.final_reviewer_id:
            if item.status == suggestion_models.STATUS_IN_REVIEW:
                cls._add_error(
                    'final %s' % (
                        base_model_validators.ERROR_CATEGORY_REVIEWER_CHECK),
                    'Entity id %s: Final reviewer id %s is not empty but '
                    'suggestion is in review' % (
                        item.id, item.final_reviewer_id))

    @classmethod
    def _validate_score_category(
            cls, item, field_name_to_external_model_references):
        """Validate that the score_category subtype for suggestions matches the
        exploration category.

        Args:
            item: datastore_services.Model. GeneralSuggestionModel to validate.
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
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls._add_error(
                'target %s' % base_model_validators.ERROR_CATEGORY_TYPE_CHECK,
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))
            return
        score_category_type = (
            item.score_category.split(
                suggestion_models.SCORE_CATEGORY_DELIMITER)[0])

        if item.target_type == feconf.ENTITY_TYPE_EXPLORATION:
            target_model_references = (
                field_name_to_external_model_references[
                    '%s_ids' % item.target_type])

            for target_model_reference in target_model_references:
                target_model = target_model_reference.model_instance
                if target_model is None or target_model.deleted:
                    model_class = target_model_reference.model_class
                    model_id = target_model_reference.model_id
                    cls._add_error(
                        '%s_ids %s' % (
                            item.target_type,
                            base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                        'Entity id %s: based on field %s_ids having'
                        ' value %s, expected model %s with id %s but it '
                        'doesn\'t exist' % (
                            item.id, item.target_type,
                            model_id, model_class.__name__, model_id))

                # Note: An exploration's category can be changed after the
                # suggestion is submitted. Since this operation does not update
                # the suggestion's category, we cannot assume that the
                # exploration category matches the suggestion score category,
                # and thus do not validate it here.

        if score_category_type == suggestion_models.SCORE_TYPE_QUESTION:
            score_category_regex = (
                '^(%s)$' % ('|').join(VALID_SCORE_CATEGORIES_FOR_TYPE_QUESTION))
            if not re.compile(score_category_regex).match(item.score_category):
                cls._add_error(
                    'score category check',
                    'Entity id %s: Score category %s is invalid' % (
                        item.id, item.score_category))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_target_type,
            cls._validate_final_reviewer_id]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_target_version_at_submission,
            cls._validate_score_category]


class GeneralVoiceoverApplicationModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating GeneralVoiceoverApplicationModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        """Returns a domain object instance created from the model.

        Args:
            item: GeneralVoiceoverApplicationModel. Entity to validate.

        Returns:
            *. A domain object to validate.
        """
        return voiceover_services.get_voiceover_application_by_id(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.UserSettingsModelFetcherDetails(
                'author_ids', [item.author_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=True
            )
        ]
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            field_name_to_external_model_references.append(
                base_model_validators.ExternalModelFetcherDetails(
                    '%s_ids' % item.target_type,
                    TARGET_TYPE_TO_TARGET_MODEL[item.target_type],
                    [item.target_id]))
        if item.final_reviewer_id is not None:
            field_name_to_external_model_references.append(
                base_model_validators.UserSettingsModelFetcherDetails(
                    'final_reviewer_ids', [item.final_reviewer_id],
                    may_contain_system_ids=False,
                    may_contain_pseudonymous_ids=True
                ))
        return field_name_to_external_model_references


class CommunityContributionStatsModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating CommunityContributionStatsModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Since this is a singleton model, it has only one valid ID:
        # community_contribution_stats.
        return '^%s$' % (
            suggestion_models.COMMUNITY_CONTRIBUTION_STATS_MODEL_ID)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return (
            suggestion_services
            .create_community_contribution_stats_from_model(item)
        )

    @classmethod
    def _validate_translation_reviewer_counts(cls, item):
        """For each language code, validate that the translation reviewer
        count matches the number of translation reviewers in the datastore.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        supported_language_codes = [
            language_code['id'] for language_code in
            constants.SUPPORTED_AUDIO_LANGUAGES
        ]
        all_user_contribution_rights_models = (
            user_models.UserContributionRightsModel.get_all()
        )
        for language_code in supported_language_codes:
            expected_translation_reviewer_count = (
                all_user_contribution_rights_models.filter(
                    (
                        user_models.UserContributionRightsModel
                        .can_review_translation_for_language_codes
                    ) == language_code)
                .count()
            )
            if language_code in item.translation_reviewer_counts_by_lang_code:
                model_translation_reviewer_count = (
                    item.translation_reviewer_counts_by_lang_code[
                        language_code]
                )
                if model_translation_reviewer_count != (
                        expected_translation_reviewer_count):
                    cls._add_error(
                        'translation reviewer %s' % (
                            base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                        'Entity id %s: Translation reviewer count for language'
                        ' code %s: %s does not match the expected translation '
                        'reviewer count for language code %s: %s' % (
                            item.id, language_code,
                            model_translation_reviewer_count, language_code,
                            expected_translation_reviewer_count)
                        )
            elif expected_translation_reviewer_count != 0:
                cls._add_error(
                    'translation reviewer count %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: The translation reviewer count for '
                    'language code %s is %s, expected model '
                    'CommunityContributionStatsModel to have the language code '
                    '%s in its translation reviewer counts but it doesn\'t '
                    'exist.' % (
                        item.id, language_code,
                        expected_translation_reviewer_count, language_code)
                )

    @classmethod
    def _validate_translation_suggestion_counts(cls, item):
        """For each language code, validate that the translation suggestion
        count matches the number of translation suggestions in the datastore
        that are currently in review.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        supported_language_codes = [
            language_code['id'] for language_code in
            constants.SUPPORTED_AUDIO_LANGUAGES
        ]
        all_translation_suggestion_models_in_review = (
            suggestion_models.GeneralSuggestionModel.get_all()
            .filter(suggestion_models.GeneralSuggestionModel.status == (
                suggestion_models.STATUS_IN_REVIEW))
            .filter(
                suggestion_models.GeneralSuggestionModel.suggestion_type == (
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT))
        )
        for language_code in supported_language_codes:
            expected_translation_suggestion_count = (
                all_translation_suggestion_models_in_review.filter(
                    suggestion_models.GeneralSuggestionModel.language_code == (
                        language_code))
                .count()
            )
            if language_code in item.translation_suggestion_counts_by_lang_code:
                model_translation_suggestion_count = (
                    item.translation_suggestion_counts_by_lang_code[
                        language_code]
                )
                if model_translation_suggestion_count != (
                        expected_translation_suggestion_count):
                    cls._add_error(
                        'translation suggestion %s' % (
                            base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                        'Entity id %s: Translation suggestion count for '
                        'language code %s: %s does not match the expected '
                        'translation suggestion count for language code %s: '
                        '%s' % (
                            item.id, language_code,
                            model_translation_suggestion_count, language_code,
                            expected_translation_suggestion_count)
                        )
            elif expected_translation_suggestion_count != 0:
                cls._add_error(
                    'translation suggestion count %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: The translation suggestion count for '
                    'language code %s is %s, expected model '
                    'CommunityContributionStatsModel to have the language code '
                    '%s in its translation suggestion counts but it doesn\'t '
                    'exist.' % (
                        item.id, language_code,
                        expected_translation_suggestion_count, language_code)
                )

    @classmethod
    def _validate_question_reviewer_count(cls, item):
        """Validate that the question reviewer count matches the number of
        question reviewers in the datastore.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        expected_question_reviewer_count = (
            user_models.UserContributionRightsModel.query(
                ( # pylint: disable=singleton-comparison
                    user_models.UserContributionRightsModel
                    .can_review_questions
                ) == True)
            .count()
        )
        if item.question_reviewer_count != expected_question_reviewer_count:
            cls._add_error(
                'question reviewer %s' % (
                    base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                'Entity id %s: Question reviewer count: %s does not '
                'match the expected question reviewer count: %s.' % (
                    item.id, item.question_reviewer_count,
                    expected_question_reviewer_count)
            )

    @classmethod
    def _validate_question_suggestion_count(cls, item):
        """Validate that the question suggestion count matches the number of
        question suggestions in the datastore that are currently in review.

        Args:
            item: datastore_services.Model. CommunityContributionStatsModel to
                validate.
        """
        expected_question_suggestion_count = (
            suggestion_models.GeneralSuggestionModel.get_all()
            .filter(
                suggestion_models.GeneralSuggestionModel.status == (
                    suggestion_models.STATUS_IN_REVIEW))
            .filter(
                suggestion_models.GeneralSuggestionModel.suggestion_type == (
                    feconf.SUGGESTION_TYPE_ADD_QUESTION))
            .count()
        )
        if item.question_suggestion_count != expected_question_suggestion_count:
            cls._add_error(
                'question suggestion %s' % (
                    base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                'Entity id %s: Question suggestion count: %s does not '
                'match the expected question suggestion count: %s.' % (
                    item.id, item.question_suggestion_count,
                    expected_question_suggestion_count)
            )

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_translation_reviewer_counts,
            cls._validate_translation_suggestion_counts,
            cls._validate_question_reviewer_count,
            cls._validate_question_suggestion_count
        ]
