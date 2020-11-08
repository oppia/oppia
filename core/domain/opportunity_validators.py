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

"""Validators for opportunity models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.domain import question_services
from core.domain import skill_fetchers
from core.domain import story_fetchers
from core.platform import models

(
    exp_models, skill_models, story_models,
    topic_models) = (
        models.Registry.import_models([
            models.NAMES.exploration,
            models.NAMES.skill, models.NAMES.story,
            models.NAMES.topic]))


class ExplorationOpportunitySummaryModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating ExplorationOpportunitySummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return (
            opportunity_services.get_exploration_opportunity_summary_from_model(
                item))

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel, [item.id]),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids',
                topic_models.TopicModel, [item.topic_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids',
                story_models.StoryModel, [item.story_id])]

    @classmethod
    def _validate_translation_counts(
            cls, item, field_name_to_external_model_references):
        """Validate that translation_counts match the translations available in
        the exploration.

        Args:
            item: datastore_services.Model. ExplorationOpportunitySummaryModel
                to validate.
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
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model)
            exploration_translation_counts = (
                exploration.get_translation_counts())
            if exploration_translation_counts != item.translation_counts:
                cls._add_error(
                    'translation %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Translation counts: %s does not match the '
                    'translation counts of external exploration model: %s' % (
                        item.id, item.translation_counts,
                        exploration_translation_counts))

    @classmethod
    def _validate_content_count(
            cls, item, field_name_to_external_model_references):
        """Validate that content_count of model is equal to the number of
        content available in the corresponding ExplorationModel.

        Args:
            item: datastore_services.Model. ExplorationOpportunitySummaryModel
                to validate.
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
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model)
            exploration_content_count = exploration.get_content_count()
            if exploration_content_count != item.content_count:
                cls._add_error(
                    'content %s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: Content count: %s does not match the '
                    'content count of external exploration model: %s' % (
                        item.id, item.content_count, exploration_content_count))

    @classmethod
    def _validate_chapter_title(
            cls, item, field_name_to_external_model_references):
        """Validate that chapter_title matches the title of the corresponding
        node of StoryModel.

        Args:
            item: datastore_services.Model. ExplorationOpportunitySummaryModel
                to validate.
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
            story = story_fetchers.get_story_from_model(story_model)
            corresponding_story_node = (
                story.story_contents.get_node_with_corresponding_exp_id(
                    item.id))

            if item.chapter_title != corresponding_story_node.title:
                cls._add_error(
                    'chapter title check',
                    'Entity id %s: Chapter title: %s does not match the '
                    'chapter title of external story model: %s' % (
                        item.id, item.chapter_title,
                        corresponding_story_node.title))

    @classmethod
    def _get_external_model_properties(cls):
        topic_model_properties_dict = {
            'topic_name': 'name'
        }

        story_model_properties_dict = {
            'story_title': 'title'
        }

        return [(
            'topic',
            'topic_ids',
            topic_model_properties_dict
        ), (
            'story',
            'story_ids',
            story_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_translation_counts,
            cls._validate_content_count,
            cls._validate_chapter_title
            ]


class SkillOpportunityModelValidator(
        base_model_validators.BaseSummaryModelValidator):
    """Class for validating SkillOpportunityModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return (
            opportunity_services.get_skill_opportunity_from_model(item))

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, [item.id])]

    @classmethod
    def _validate_question_count(
            cls, item, field_name_to_external_model_references):
        """Validate that question_count matches the number of questions linked
        to the opportunity's skill.

        Args:
            item: datastore_services.Model. SkillOpportunityModel to validate.
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
            if skill_model is None or skill_model.deleted:
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
            skill = skill_fetchers.get_skill_from_model(skill_model)
            question_skill_links = (
                question_services.get_question_skill_links_of_skill(
                    skill.id, skill.description))
            question_count = len(question_skill_links)
            if question_count != item.question_count:
                cls._add_error(
                    'question_%s' % (
                        base_model_validators.ERROR_CATEGORY_COUNT_CHECK),
                    'Entity id %s: question_count: %s does not match the '
                    'question_count of external skill model: %s' % (
                        item.id, item.question_count, question_count))

    @classmethod
    def _get_external_model_properties(cls):
        skill_model_properties_dict = {
            'skill_description': 'description'
        }

        return [(
            'skill',
            'skill_ids',
            skill_model_properties_dict
        )]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_question_count,
        ]
