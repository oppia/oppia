# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Commands that can be used to operate on opportunity models."""

from __future__ import annotations

import collections
import logging

from core import feature_flag_list, feconf
from core.constants import constants
from core.domain import (
    exp_domain,
    exp_fetchers,
    feature_flag_services,
    opportunity_domain,
    question_fetchers,
    skill_domain,
    skill_fetchers,
    story_domain,
    story_fetchers,
    suggestion_services,
    taskqueue_services,
    topic_domain,
    topic_fetchers,
    translation_domain,
    translation_services,
)
from core.platform import models

from typing import Dict, List, Optional, Sequence, Set, Tuple, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import opportunity_models, user_models

opportunity_models, user_models = models.Registry.import_models(
    [models.Names.OPPORTUNITY, models.Names.USER]
)

# NOTE TO DEVELOPERS: The functions:
#   - delete_all_exploration_opportunity_summary_models()
#   - delete_all_skill_opportunity_models()
# were removed in #13021 as part of the migration to Apache Beam. Please refer
# to that PR if you need to reinstate them.


def is_exploration_available_for_contribution(exp_id: str) -> bool:
    """Checks whether a given exploration id belongs to a curated list of
    exploration i.e, whether it's used as the chapter of any story.

    Args:
        exp_id: str. The id of the exploration which is needed to be checked.

    Returns:
        bool. Whether the given exp_id belongs to the curated explorations.
    """
    model = opportunity_models.ExplorationOpportunitySummaryModel.get(
        exp_id, strict=False
    )

    return model is not None


def get_exploration_opportunity_summary_from_model(
    model: opportunity_models.ExplorationOpportunitySummaryModel,
) -> opportunity_domain.ExplorationOpportunitySummary:
    """Returns the ExplorationOpportunitySummary object out of the model.

    Args:
        model: ExplorationOpportunitySummaryModel. The exploration opportunity
            summary model.

    Returns:
        ExplorationOpportunitySummary. The corresponding
        ExplorationOpportunitySummary object.
    """
    # We're making sure that the audio language codes in any exploration
    # opportunity domain object match the ones in
    # constants.SUPPORTED_AUDIO_LANGUAGES.
    set_of_all_languages = set(
        model.incomplete_translation_language_codes
        + model.language_codes_needing_voice_artists
        + model.language_codes_with_assigned_voice_artists
    )
    supported_language_codes = set(
        language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES
    )
    missing_language_codes = list(
        supported_language_codes - set_of_all_languages
    )
    if missing_language_codes:
        logging.info(
            'Missing language codes %s in exploration opportunity model with '
            'id %s' % (missing_language_codes, model.id)
        )

    new_incomplete_translation_language_codes = (
        model.incomplete_translation_language_codes + missing_language_codes
    )

    return opportunity_domain.ExplorationOpportunitySummary(
        model.id,
        model.topic_id,
        model.topic_name,
        model.story_id,
        model.story_title,
        model.chapter_title,
        model.content_count,
        new_incomplete_translation_language_codes,
        model.translation_counts,
        model.language_codes_needing_voice_artists,
        model.language_codes_with_assigned_voice_artists,
        {},
        (
            model.reviewer_only_content_count
            if model.reviewer_only_content_count is not None
            else 0
        ),
        False,
    )


def _construct_new_opportunity_summary_models(
    exploration_opportunity_summary_list: List[
        opportunity_domain.ExplorationOpportunitySummary
    ],
) -> List[opportunity_models.ExplorationOpportunitySummaryModel]:
    """Create ExplorationOpportunitySummaryModels from domain objects.

    Args:
        exploration_opportunity_summary_list: list(
            ExplorationOpportunitySummary). A list of exploration opportunity
            summary object.

    Returns:
        list(ExplorationOpportunitySummaryModel). A list of
        ExplorationOpportunitySummaryModel to be stored in the datastore.
    """
    exploration_opportunity_summary_model_list = []
    for opportunity_summary in exploration_opportunity_summary_list:
        model = opportunity_models.ExplorationOpportunitySummaryModel(
            id=opportunity_summary.id,
            topic_id=opportunity_summary.topic_id,
            topic_name=opportunity_summary.topic_name,
            story_id=opportunity_summary.story_id,
            story_title=opportunity_summary.story_title,
            chapter_title=opportunity_summary.chapter_title,
            content_count=opportunity_summary.content_count,
            incomplete_translation_language_codes=(
                opportunity_summary.incomplete_translation_language_codes
            ),
            translation_counts=opportunity_summary.translation_counts,
            language_codes_needing_voice_artists=(
                opportunity_summary.language_codes_needing_voice_artists
            ),
            language_codes_with_assigned_voice_artists=(
                opportunity_summary.language_codes_with_assigned_voice_artists
            ),
            reviewer_only_content_count=(
                opportunity_summary.reviewer_only_content_count
            ),
        )

        exploration_opportunity_summary_model_list.append(model)
    return exploration_opportunity_summary_model_list


def _save_multi_exploration_opportunity_summary(
    exploration_opportunity_summary_list: List[
        opportunity_domain.ExplorationOpportunitySummary
    ],
) -> None:
    """Stores multiple ExplorationOpportunitySummary into datastore as a
    ExplorationOpportunitySummaryModel.

    Args:
        exploration_opportunity_summary_list: list(
            ExplorationOpportunitySummary). A list of exploration opportunity
            summary object.
    """
    exploration_opportunity_summary_model_list = (
        _construct_new_opportunity_summary_models(
            exploration_opportunity_summary_list
        )
    )
    (
        opportunity_models.ExplorationOpportunitySummaryModel.update_timestamps_multi(
            exploration_opportunity_summary_model_list
        )
    )
    opportunity_models.ExplorationOpportunitySummaryModel.put_multi(
        exploration_opportunity_summary_model_list
    )


def create_exp_opportunity_summary(
    topic: topic_domain.Topic,
    story: story_domain.Story,
    exploration: exp_domain.Exploration,
) -> opportunity_domain.ExplorationOpportunitySummary:
    """Create an ExplorationOpportunitySummary object with the given topic,
    story and exploration object.

    Args:
        topic: Topic. The topic object to which the opportunity belongs.
        story: Story. The story object to which the opportunity belongs.
        exploration: Exploration. The exploration object to which the
            opportunity belongs.

    Returns:
        ExplorationOpportunitySummary. The exploration opportunity summary
        object.
    """
    # TODO(#13903): Find a way to reduce runtime of computing the complete
    # languages.
    complete_translation_language_list = (
        translation_services.get_languages_with_complete_translation(
            exploration
        )
    )
    # TODO(#13912): Revisit voiceover language logic.
    language_codes_needing_voice_artists = set(
        complete_translation_language_list
    )
    incomplete_translation_language_codes = (
        _compute_incomplete_translation_languages(
            complete_translation_language_list
        )
    )
    if exploration.language_code in incomplete_translation_language_codes:
        # Remove exploration language from incomplete translation languages list
        # as an exploration does not need a translation in its own language.
        incomplete_translation_language_codes.remove(exploration.language_code)
        # Add exploration language to voiceover required languages list as an
        # exploration can be voiceovered in its own language.
        language_codes_needing_voice_artists.add(exploration.language_code)

    content_count = exploration.get_content_count()
    reviewer_only_content_count = exploration.get_reviewer_only_content_count()
    translation_counts = translation_services.get_translation_counts(
        feconf.TranslatableEntityType.EXPLORATION, exploration
    )

    story_node = story.story_contents.get_node_with_corresponding_exp_id(
        exploration.id
    )

    # TODO(#7376): Once the voiceover application functionality is
    # implemented change this method such that it also populates the
    # language_codes_with_assigned_voice_artists with the required data.

    exploration_opportunity_summary = (
        opportunity_domain.ExplorationOpportunitySummary(
            exploration.id,
            topic.id,
            topic.name,
            story.id,
            story.title,
            story_node.title,
            content_count,
            incomplete_translation_language_codes,
            translation_counts,
            list(language_codes_needing_voice_artists),
            [],
            {},
            reviewer_only_content_count,
        )
    )

    return exploration_opportunity_summary


def generate_voiceovers_async_for_exp_linked_to_topic(exp_id: str) -> None:
    """Triggers asynchronous voiceover generation for the specified exploration.

    Args:
        exp_id: str. The ID of the exploration for which voiceovers should be
            generated.
    """
    # Asynchronously regenerates voiceovers for exploration contents in English
    # and other available translations when the exploration is linked to a
    # story.
    if feature_flag_services.is_feature_flag_enabled(
        feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS.value,
        None,
    ):
        taskqueue_services.defer(
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_CURATION'
            ],
            taskqueue_services.QUEUE_NAME_VOICEOVER_REGENERATION,
            exp_id,
        )


def _compute_incomplete_translation_languages(
    complete_translation_languages: List[str],
) -> List[str]:
    """Computes all languages that are not fully translated in an entity.

    Args:
        complete_translation_languages: list(str). List of complete translation
            language codes in the entity.

    Returns:
        list(str). List of incomplete translation language codes sorted
        alphabetically.
    """
    audio_language_codes = set(
        language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES
    )
    incomplete_translation_language_codes = audio_language_codes - set(
        complete_translation_languages
    )
    return sorted(list(incomplete_translation_language_codes))


def get_entity_by_type_and_id(entity_type: str, entity_id: str) -> Union[
    exp_domain.Exploration,
    story_domain.Story,
    skill_domain.Skill,
    topic_domain.Topic,
]:
    """Helper method to fetch an entity by type and ID.

    Args:
        entity_type: str. The type of the entity.
        entity_id: str. The ID of the entity.

    Returns:
        BaseTranslatableObject. The domain object corresponding to the given ID.

    Raises:
        ValueError. If an unsupported entity type is provided.
    """
    if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
        return exp_fetchers.get_exploration_by_id(entity_id)
    elif entity_type == feconf.ENTITY_TYPE_STORY:
        return story_fetchers.get_story_by_id(entity_id)
    elif entity_type == feconf.ENTITY_TYPE_SKILL:
        return skill_fetchers.get_skill_by_id(entity_id)
    elif entity_type == feconf.ENTITY_TYPE_TOPIC:
        return topic_fetchers.get_topic_by_id(entity_id)
    else:
        raise ValueError(f'Unsupported entity type: {entity_type}')


def get_translation_opportunity_summary_from_model(
    model: opportunity_models.TranslationOpportunityModel,
) -> opportunity_domain.TranslationOpportunity:
    """Returns a domain object for a translation opportunity from the given model.

    Args:
        model: TranslationOpportunityModel. The model instance from the datastore.

    Returns:
        TranslationOpportunity. The corresponding domain object.
    """
    return opportunity_domain.TranslationOpportunity(
        entity_type=model.entity_type,
        entity_id=model.entity_id,
        topic_ids=model.topic_ids,
        content_count=model.content_count,
        incomplete_translation_language_codes=(
            model.incomplete_translation_language_codes
        ),
        translation_counts=model.translation_counts,
    )


def compute_translation_opportunity_models_with_updated_entity(
    entity_type: str,
    entity_id: str,
    content_count: int,
    translation_counts: Dict[str, int],
) -> List[opportunity_models.TranslationOpportunityModel]:
    """Returns translation opportunity domain objects for the given entity
    with updated content and translation counts.

    Args:
        entity_type: str. The type of entity (e.g., 'exploration').
        entity_id: str. The ID of the entity.
        content_count: int. Total number of translatable content strings.
        translation_counts: Dict[str, int]. Map of language code to
            number of translated content strings.

    Returns:
        list(TranslationOpportunityModel). A list with one
        TranslationOpportunityModel object.

    Raises:
        ValueError. If there is a missing topic ID for the given entity.
    """
    topic_ids_by_entity = _compute_topic_ids_of_translation_opportunities(
        {entity_type: [entity_id]}
    )

    topic_ids = topic_ids_by_entity.get(entity_id, [])

    if not topic_ids:
        raise ValueError(
            f'Missing topic id for {entity_type} with id {entity_id}'
        )

    complete_translation_language_list = []
    for language_code, translation_count in translation_counts.items():
        if translation_count == content_count:
            complete_translation_language_list.append(language_code)

    model_id = f'{entity_type}.{entity_id}'
    model = opportunity_models.TranslationOpportunityModel.get(
        model_id, strict=False
    )
    if model is None:
        # If the model does not exist, we create a new one.
        create_translation_opportunity({entity_type: [entity_id]})
        model = opportunity_models.TranslationOpportunityModel.get(model_id)

    translation_opportunity = get_translation_opportunity_summary_from_model(
        model
    )
    translation_opportunity.content_count = content_count
    translation_opportunity.translation_counts = translation_counts
    incomplete_translation_language_codes = (
        _compute_incomplete_translation_languages(
            complete_translation_language_list
        )
    )

    entity = get_entity_by_type_and_id(entity_type, entity_id)
    if entity.language_code in incomplete_translation_language_codes:
        incomplete_translation_language_codes.remove(entity.language_code)

    translation_opportunity.incomplete_translation_language_codes = (
        incomplete_translation_language_codes
    )

    translation_opportunity.validate()

    return _construct_new_translation_opportunity_models(
        [translation_opportunity]
    )


def _fetch_entities_by_type(
    entity_type: str,
    entity_ids: List[str],
) -> List[
    Union[
        story_domain.Story,
        skill_domain.Skill,
        topic_domain.Topic,
    ]
]:
    """Fetches entities of the given type, filtering out None values.

    Args:
        entity_type: str. The type of entities to fetch.
        entity_ids: list(str). The IDs of the entities to fetch.

    Returns:
        list(Story|Skill|Topic). A list of non-None domain objects.

    Raises:
        Exception. If the entity type is unsupported.
    """
    if entity_type == feconf.ENTITY_TYPE_STORY:
        stories = story_fetchers.get_stories_by_ids(entity_ids)
        return [s for s in stories if s is not None]
    elif entity_type == feconf.ENTITY_TYPE_SKILL:
        skills = skill_fetchers.get_multi_skills(entity_ids, strict=False)
        return [s for s in skills if s is not None]
    elif entity_type == feconf.ENTITY_TYPE_TOPIC:
        topics = topic_fetchers.get_topics_by_ids(entity_ids, strict=False)
        return [t for t in topics if t is not None]
    else:
        raise Exception(f'Unsupported entity type: {entity_type}')


def _build_opportunity_for_non_exploration_entity(
    entity: Union[
        story_domain.Story,
        skill_domain.Skill,
        topic_domain.Topic,
    ],
    entity_type: str,
    translatable_entity_type: feconf.TranslatableEntityType,
    entity_to_topics: Dict[str, List[str]],
) -> opportunity_domain.TranslationOpportunity:
    """Builds a TranslationOpportunity for a non-exploration entity.

    This is shared logic for stories, skills, and topics. Explorations
    are handled separately because they use
    get_languages_with_complete_translation which is exploration-specific.

    Args:
        entity: Story|Skill|Topic. The domain object.
        entity_type: str. The entity type string constant.
        translatable_entity_type: TranslatableEntityType. The enum value for
            translation services.
        entity_to_topics: dict(str, list(str)). Mapping of entity ID to
            associated topic IDs.

    Returns:
        TranslationOpportunity. The constructed opportunity domain object.
    """
    # Story, Skill, and Topic do not extend BaseTranslatableObject, so
    # get_content_count() is not available. Content count defaults to 0
    # until these entities implement the translatable interface.
    content_count = 0
    translation_counts = translation_services.get_translation_counts(
        translatable_entity_type, entity
    )
    complete_langs = [
        lang
        for lang, count in translation_counts.items()
        if count == content_count
    ]
    incomplete_langs = _compute_incomplete_translation_languages(complete_langs)
    # Remove the entity's own language from the incomplete list, since an
    # entity does not need a translation in its own language.
    incomplete_langs = [
        lang for lang in incomplete_langs if lang != entity.language_code
    ]
    return opportunity_domain.TranslationOpportunity(
        topic_ids=entity_to_topics.get(entity.id, []),
        entity_id=entity.id,
        content_count=content_count,
        incomplete_translation_language_codes=incomplete_langs,
        translation_counts=translation_counts,
        entity_type=entity_type,
    )


def create_translation_opportunity(
    entity_types_and_ids: Dict[str, List[str]],
) -> None:
    """Creates and stores translation opportunities for the given entities.

    Args:
        entity_types_and_ids: dict(str, list(str)). A mapping of entity types
            (e.g., 'exploration') to lists of entity IDs to process.
    """
    entity_to_topics = _compute_topic_ids_of_translation_opportunities(
        entity_types_and_ids
    )

    opportunities_list = []

    for entity_type, entity_ids in entity_types_and_ids.items():
        unique_ids = list(set(entity_ids))
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            exp_id_to_exploration = (
                exp_fetchers.get_multiple_explorations_by_id(unique_ids)
            )
            for exploration_id, exploration in exp_id_to_exploration.items():
                complete_langs = translation_services.get_languages_with_complete_translation(
                    exploration
                )
                incomplete_langs = _compute_incomplete_translation_languages(
                    complete_langs
                )
                incomplete_langs = [
                    lang
                    for lang in incomplete_langs
                    if (lang != exploration.language_code)
                ]
                translation_counts = (
                    translation_services.get_translation_counts(
                        feconf.TranslatableEntityType.EXPLORATION, exploration
                    )
                )
                opportunity = opportunity_domain.TranslationOpportunity(
                    topic_ids=entity_to_topics.get(exploration_id, []),
                    entity_id=exploration_id,
                    content_count=exploration.get_content_count(),
                    incomplete_translation_language_codes=incomplete_langs,
                    translation_counts=translation_counts,
                    entity_type=feconf.ENTITY_TYPE_EXPLORATION,
                )
                opportunities_list.append(opportunity)
        else:
            entities = _fetch_entities_by_type(entity_type, unique_ids)
            translatable_entity_type = feconf.TranslatableEntityType(
                entity_type
            )
            for entity in entities:
                opportunity = _build_opportunity_for_non_exploration_entity(
                    entity,
                    entity_type,
                    translatable_entity_type,
                    entity_to_topics,
                )
                opportunities_list.append(opportunity)

    if opportunities_list:
        _save_multi_translation_opportunities(opportunities_list)


def _save_multi_translation_opportunities(
    translation_opportunity_list: List[
        opportunity_domain.TranslationOpportunity
    ],
) -> None:
    """Converts and saves a list of translation opportunity domain objects.

    Args:
        translation_opportunity_list: list(TranslationOpportunity). A list of
            domain objects representing translation opportunities.
    """
    models_to_persist = _construct_new_translation_opportunity_models(
        translation_opportunity_list
    )

    if models_to_persist:
        models_to_save = []
        for model in models_to_persist:
            existing_model = opportunity_models.TranslationOpportunityModel.get(
                model.id, strict=False
            )

            if existing_model is None:
                models_to_save.append(model)
            else:
                if (
                    existing_model.content_count != model.content_count
                    or existing_model.translation_counts
                    != model.translation_counts
                    or set(existing_model.incomplete_translation_language_codes)
                    != set(model.incomplete_translation_language_codes)
                    or existing_model.topic_ids != model.topic_ids
                ):
                    models_to_save.append(model)

        if models_to_save:
            opportunity_models.TranslationOpportunityModel.update_timestamps_multi(
                models_to_save
            )
            opportunity_models.TranslationOpportunityModel.put_multi(
                models_to_save
            )


def _construct_new_translation_opportunity_models(
    translation_opportunity_list: List[
        opportunity_domain.TranslationOpportunity
    ],
) -> List[opportunity_models.TranslationOpportunityModel]:
    """Create TranslationOpportunityModels from domain objects.

    Args:
        translation_opportunity_list: list(TranslationOpportunity). A list of
            translation opportunity domain objects.

    Returns:
        list(TranslationOpportunityModel). A list of
        TranslationOpportunityModel instances to be stored in the datastore.
    """
    translation_opportunity_model_list = []
    for opportunity in translation_opportunity_list:
        model = opportunity_models.TranslationOpportunityModel.create_new(
            entity_type=opportunity.entity_type,
            entity_id=opportunity.entity_id,
            topic_ids=opportunity.topic_ids,
            content_count=opportunity.content_count,
            incomplete_translation_language_codes=(
                opportunity.incomplete_translation_language_codes
            ),
            translation_counts=opportunity.translation_counts,
        )
        translation_opportunity_model_list.append(model)

    return translation_opportunity_model_list


def _compute_topic_ids_of_translation_opportunities(
    entity_types_and_ids: Dict[str, List[str]],
) -> Dict[str, List[str]]:
    """Returns the topic IDs associated with the given entity IDs.

    Args:
        entity_types_and_ids: dict(str, list(str)). A dictionary keyed by entity
            type with the value being a list of entity IDs.

    Returns:
        dict(str, list(str)). A dictionary mapping each provided entity ID to a
        list of topic IDs it is associated with.

    Raises:
        Exception. If an unsupported entity type is provided.
    """
    entity_id_to_topic_ids: Dict[str, List[str]] = {}

    topic_summaries = []
    if feconf.ENTITY_TYPE_EXPLORATION in entity_types_and_ids or (
        feconf.ENTITY_TYPE_STORY in entity_types_and_ids
    ):
        topic_summaries = topic_fetchers.get_all_topic_summaries()

    all_topics = []
    if 'skill' in entity_types_and_ids:
        all_topics = topic_fetchers.get_all_topics()

    for entity_type, entity_ids in entity_types_and_ids.items():
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            exp_ids_set = set(entity_ids)
            found_exp_ids: Set[str] = set()

            for topic_summary in topic_summaries:
                topic_id = topic_summary.id
                for (
                    exp_ids
                ) in topic_summary.published_story_exploration_mapping.values():
                    for exp_id in exp_ids:
                        if (
                            exp_id in exp_ids_set
                            and exp_id not in found_exp_ids
                        ):
                            entity_id_to_topic_ids.setdefault(
                                exp_id, []
                            ).append(topic_id)
                            found_exp_ids.add(exp_id)
                            if found_exp_ids == exp_ids_set:
                                break
                if found_exp_ids == exp_ids_set:
                    break

        elif entity_type == feconf.ENTITY_TYPE_STORY:
            story_ids_set = set(entity_ids)
            found_story_ids: Set[str] = set()

            for topic_summary in topic_summaries:
                topic_id = topic_summary.id
                for (
                    story_id
                ) in topic_summary.published_story_exploration_mapping:
                    if (
                        story_id in story_ids_set
                        and story_id not in found_story_ids
                    ):
                        entity_id_to_topic_ids.setdefault(story_id, []).append(
                            topic_id
                        )
                        found_story_ids.add(story_id)
                        if found_story_ids == story_ids_set:
                            break
                if found_story_ids == story_ids_set:
                    break

        elif entity_type == feconf.ENTITY_TYPE_SKILL:
            skill_ids_set = set(entity_ids)
            found_skill_ids: Set[str] = set()

            for topic in all_topics:
                topic_id = topic.id
                for skill_id in topic.get_all_skill_ids():
                    if (
                        skill_id in skill_ids_set
                        and skill_id not in found_skill_ids
                    ):
                        entity_id_to_topic_ids.setdefault(skill_id, []).append(
                            topic_id
                        )
                        found_skill_ids.add(skill_id)
                        if found_skill_ids == skill_ids_set:
                            break
                if found_skill_ids == skill_ids_set:
                    break

        elif entity_type == feconf.ENTITY_TYPE_TOPIC:
            topic_ids_set = set(entity_ids)
            for topic_id in topic_ids_set:
                entity_id_to_topic_ids[topic_id] = [topic_id]

        else:
            raise Exception(f'Unsupported entity type: {entity_type}')

    return entity_id_to_topic_ids


def add_new_exploration_opportunities(
    story_id: str, exp_ids: List[str]
) -> None:
    """Adds new exploration opportunity into the model.

    Args:
        story_id: str. ID of the story.
        exp_ids: list(str). A list of exploration ids for which new
            opportunities are to be created. All exp_ids must be part of the
            given story.
    """
    story = story_fetchers.get_story_by_id(story_id)
    topic = topic_fetchers.get_topic_by_id(story.corresponding_topic_id)
    _create_exploration_opportunities(story, topic, exp_ids)


def _create_exploration_opportunities(
    story: story_domain.Story, topic: topic_domain.Topic, exp_ids: List[str]
) -> None:
    """Creates new exploration opportunities corresponding to the supplied
    story, topic, and exploration IDs.

    Args:
        story: Story. The story domain object corresponding to the exploration
            opportunities.
        topic: Topic. The topic domain object corresponding to the exploration
            opportunities.
        exp_ids: list(str). A list of exploration ids for which new
            opportunities are to be created. All exp_ids must be part of the
            given story.
    """
    explorations = exp_fetchers.get_multiple_explorations_by_id(exp_ids)
    exploration_opportunity_summary_list = []
    for exploration in explorations.values():
        exploration_opportunity_summary_list.append(
            create_exp_opportunity_summary(topic, story, exploration)
        )
        generate_voiceovers_async_for_exp_linked_to_topic(exploration.id)
    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list
    )


def compute_opportunity_models_with_updated_exploration(
    exp_id: str, content_count: int, translation_counts: Dict[str, int]
) -> List[opportunity_models.ExplorationOpportunitySummaryModel]:
    """Updates the opportunities models with the changes made in the
    exploration.

    Args:
        exp_id: str. The exploration id which is also the id of the opportunity
            model.
        content_count: int. The number of contents available in the exploration.
        translation_counts: dict(str, int). The number of translations available
            for the exploration in different languages.

    Returns:
        list(ExplorationOpportunitySummaryModel). A list of opportunity models
        which are updated.
    """
    updated_exploration = exp_fetchers.get_exploration_by_id(exp_id)

    complete_translation_language_list = []
    for language_code, translation_count in translation_counts.items():
        if translation_count == content_count:
            complete_translation_language_list.append(language_code)

    model = opportunity_models.ExplorationOpportunitySummaryModel.get(exp_id)
    exploration_opportunity_summary = (
        get_exploration_opportunity_summary_from_model(model)
    )
    exploration_opportunity_summary.content_count = content_count
    exploration_opportunity_summary.translation_counts = translation_counts
    exploration_opportunity_summary.reviewer_only_content_count = (
        updated_exploration.get_reviewer_only_content_count()
    )
    incomplete_translation_language_codes = (
        _compute_incomplete_translation_languages(
            complete_translation_language_list
        )
    )
    if (
        updated_exploration.language_code
        in incomplete_translation_language_codes
    ):
        # Remove exploration language from incomplete translation languages list
        # as an exploration does not need a translation in its own language.
        incomplete_translation_language_codes.remove(
            updated_exploration.language_code
        )
    exploration_opportunity_summary.incomplete_translation_language_codes = (
        incomplete_translation_language_codes
    )

    new_languages_for_voiceover = set(complete_translation_language_list) - set(
        exploration_opportunity_summary.language_codes_with_assigned_voice_artists
    )

    # We only append new languages to language_codes_needing_voice_artists(
    # instead of adding all of the complete_translation_language_list), as the
    # complete translation languages list will be dynamic based on some
    # content text are changed, where as the voiceover is a long term work and
    # we can allow a voice_artist to work for an exploration which needs a
    # little bit update in text translation.
    language_codes_needing_voice_artists_set = set(
        exploration_opportunity_summary.language_codes_needing_voice_artists
    )
    language_codes_needing_voice_artists_set |= set(new_languages_for_voiceover)

    exploration_opportunity_summary.language_codes_needing_voice_artists = list(
        language_codes_needing_voice_artists_set
    )

    exploration_opportunity_summary.validate()

    return _construct_new_opportunity_summary_models(
        [exploration_opportunity_summary]
    )


def update_translation_opportunity_with_accepted_suggestion(
    entity_id: str,
    language_code: str,
    entity_type: str = feconf.ENTITY_TYPE_EXPLORATION,
) -> None:
    """Updates the translation opportunity for the accepted suggestion.

    Args:
        entity_id: str. The ID of the entity.
        language_code: str. The language code of the accepted translation
            suggestion.
        entity_type: str. The type of the entity.
    """
    if feature_flag_services.is_feature_flag_enabled(
        feature_flag_list.FeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS.value,
        None,
    ):
        model_id = f'{entity_type}.{entity_id}'
        model = opportunity_models.TranslationOpportunityModel.get(
            model_id, strict=False
        )
        if model is None:
            return

        translation_opportunity = (
            get_translation_opportunity_summary_from_model(model)
        )
        old_translation_count = translation_opportunity.translation_counts.get(
            language_code, 0
        )

        entity = get_entity_by_type_and_id(entity_type, entity_id)
        current_translation_counts = (
            translation_services.get_translation_counts(
                feconf.TranslatableEntityType(entity_type), entity
            )
        )

        new_count = current_translation_counts.get(language_code, 0)
        translation_opportunity.translation_counts[language_code] = new_count
        translation_opportunity.content_count = (
            entity.get_content_count()
            if isinstance(entity, translation_domain.BaseTranslatableObject)
            else 0
        )
        translation_opportunity.update_translation_count(
            language_code, new_count
        )

        # Remove the entity's own language from the incomplete list, since an
        # entity does not need a translation in its own language.
        if (
            entity.language_code
            in translation_opportunity.incomplete_translation_language_codes
        ):
            translation_opportunity.incomplete_translation_language_codes.remove(
                entity.language_code
            )

        translation_opportunity.validate()
        _save_multi_translation_opportunities([translation_opportunity])

        # Write audit model only for explorations for backward compatibility.
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            audit_model = opportunity_models.ExplorationOpportunitySummaryAuditModel.create_new(
                exploration_id=entity_id,
                language_code=language_code,
                action='translation_accepted',
                old_translation_count=old_translation_count,
                new_translation_count=new_count,
                content_count=translation_opportunity.content_count,
            )
            audit_model.put()
    else:
        if entity_type != feconf.ENTITY_TYPE_EXPLORATION:
            return

        exp_model = opportunity_models.ExplorationOpportunitySummaryModel.get(
            entity_id
        )
        if exp_model is None:
            return

        exp_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(exp_model)
        )

        # Capture the old stored count before recounting for audit tracking.
        old_translation_count = exp_opportunity_summary.translation_counts.get(
            language_code, 0
        )

        # Recount the translations to ensure that the counts are accurate and to
        # prevent any double counting of translations.
        exploration = exp_fetchers.get_exploration_by_id(entity_id)
        current_translation_counts = (
            translation_services.get_translation_counts(
                feconf.TranslatableEntityType.EXPLORATION, exploration
            )
        )

        if language_code in current_translation_counts:
            exp_opportunity_summary.translation_counts[language_code] = (
                current_translation_counts[language_code]
            )
        else:
            exp_opportunity_summary.translation_counts[language_code] = 0

        if (
            exp_opportunity_summary.content_count
            == exp_opportunity_summary.translation_counts[language_code]
        ):
            if (
                language_code
                in exp_opportunity_summary.incomplete_translation_language_codes
            ):
                exp_opportunity_summary.incomplete_translation_language_codes.remove(
                    language_code
                )
            exp_opportunity_summary.language_codes_needing_voice_artists.append(
                language_code
            )

        exp_opportunity_summary.validate()
        _save_multi_exploration_opportunity_summary([exp_opportunity_summary])

        audit_model = opportunity_models.ExplorationOpportunitySummaryAuditModel.create_new(
            exploration_id=entity_id,
            language_code=language_code,
            action='translation_accepted',
            old_translation_count=old_translation_count,
            new_translation_count=exp_opportunity_summary.translation_counts[
                language_code
            ],
            content_count=exp_opportunity_summary.content_count,
        )
        audit_model.put()


def update_exploration_opportunities_with_story_changes(
    story: story_domain.Story, exp_ids: List[str]
) -> None:
    """Updates the opportunities models with the story changes.

    Args:
        story: Story. The new story object.
        exp_ids: list(str). A list of exploration IDs whose exploration
            opportunity summary models need to be updated.
    """
    exp_opportunity_models_with_none = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(exp_ids)
    )

    exploration_opportunity_summary_list = []

    for exp_opportunity_model in exp_opportunity_models_with_none:
        # Ruling out the possibility of None for mypy type checking.
        assert exp_opportunity_model is not None
        exploration_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_model
            )
        )
        exploration_opportunity_summary.story_title = story.title
        node = story.story_contents.get_node_with_corresponding_exp_id(
            exploration_opportunity_summary.id
        )
        exploration_opportunity_summary.chapter_title = node.title
        exploration_opportunity_summary.validate()

        exploration_opportunity_summary_list.append(
            exploration_opportunity_summary
        )

    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list
    )


def delete_translation_opportunities(
    entity_types_and_ids: Dict[str, List[str]],
) -> None:
    """Deletes translation opportunities for the given entities.

    Args:
        entity_types_and_ids: dict(str, list(str)). A dictionary mapping entity
            types (e.g., 'story', 'exploration') to a list of their
            corresponding entity IDs.
    """
    opportunity_ids = [
        f'{entity_type}.{entity_id}'
        for entity_type, entity_ids in entity_types_and_ids.items()
        for entity_id in entity_ids
    ]

    models_to_delete = [
        model
        for model in opportunity_models.TranslationOpportunityModel.get_multi(
            opportunity_ids
        )
        if model is not None
    ]

    if models_to_delete:
        opportunity_models.TranslationOpportunityModel.delete_multi(
            models_to_delete
        )


def delete_exploration_opportunities(exp_ids: List[str]) -> None:
    """Deletes the ExplorationOpportunitySummaryModel models corresponding to
    the given exp_ids.

    Args:
        exp_ids: list(str). A list of exploration IDs whose opportunity summary
            models are to be deleted.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(exp_ids)
    )
    exp_opportunity_models_to_be_deleted = [
        model for model in exp_opportunity_models if model is not None
    ]
    opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
        exp_opportunity_models_to_be_deleted
    )


def delete_exploration_opportunities_corresponding_to_topic(
    topic_id: str,
) -> None:
    """Deletes the ExplorationOpportunitySummaryModel models which corresponds
    to the given topic_id.

    Args:
        topic_id: str. The ID of the topic.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_by_topic(
            topic_id
        )
    )
    opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
        list(exp_opportunity_models)
    )


def update_exploration_opportunities(
    old_story: story_domain.Story, new_story: story_domain.Story
) -> None:
    """Updates the opportunities models according to the changes made in the
    story.

    Args:
        old_story: Story. The old story object which is now updated.
        new_story: Story. The new story object.
    """
    model_ids_need_update = set([])
    exp_ids_in_old_story = old_story.story_contents.get_all_linked_exp_ids()
    exp_ids_in_new_story = new_story.story_contents.get_all_linked_exp_ids()
    new_added_exp_ids = set(exp_ids_in_new_story) - set(exp_ids_in_old_story)
    deleted_exp_ids = set(exp_ids_in_old_story) - set(exp_ids_in_new_story)
    unchanged_exp_ids = set(exp_ids_in_new_story) - new_added_exp_ids
    if old_story.title != new_story.title:
        model_ids_need_update |= set(unchanged_exp_ids)
    else:
        for exp_id in unchanged_exp_ids:
            new_node = (
                new_story.story_contents.get_node_with_corresponding_exp_id(
                    exp_id
                )
            )
            old_node = (
                old_story.story_contents.get_node_with_corresponding_exp_id(
                    exp_id
                )
            )
            if old_node.title != new_node.title:
                model_ids_need_update.add(exp_id)

    update_exploration_opportunities_with_story_changes(
        new_story, list(model_ids_need_update)
    )
    add_new_exploration_opportunities(new_story.id, list(new_added_exp_ids))
    delete_exploration_opportunities(list(deleted_exp_ids))


def delete_exp_opportunities_corresponding_to_story(story_id: str) -> None:
    """Deletes the ExplorationOpportunitySummaryModel models which corresponds
    to the given story_id.

    Args:
        story_id: str. The ID of the story.
    """
    exp_opprtunity_model_class = (
        opportunity_models.ExplorationOpportunitySummaryModel
    )
    exp_opportunity_models: Sequence[
        opportunity_models.ExplorationOpportunitySummaryModel
    ] = (
        exp_opprtunity_model_class.get_all()
        .filter(exp_opprtunity_model_class.story_id == story_id)
        .fetch()
    )
    exp_opprtunity_model_class.delete_multi(list(exp_opportunity_models))


def get_translation_opportunities_with_new_models(
    entity_type: str,
    language_code: str,
    topic_name: Optional[str] = None,
    cursor: Optional[str] = None,
) -> Tuple[
    List[opportunity_domain.TranslationOpportunityCardInfo],
    Optional[str],
    bool,
]:
    """Returns a list of translation opportunity card info objects for the given
    entity type, filtered by topic name and language code.

    Args:
        entity_type: str. The entity type to fetch opportunities for.
        language_code: str. The language code to filter by.
        topic_name: str or None. The name of the topic to filter by.
        cursor: str or None. The datastore cursor for pagination.

    Returns:
        3-tuple(opportunities, cursor, more). where:
            opportunities: list(TranslationOpportunityCardInfo). A list of
                TranslationOpportunityCardInfo domain objects.
            cursor: str or None. A query cursor pointing to the next batch of
                results. If there are no more results, this might be None.
            more: bool. If True, there are (probably) more results after this
                batch.
    """
    topic_id = None
    if topic_name:
        topic = topic_fetchers.get_topic_by_name(topic_name, strict=False)
        if topic is None:
            return [], None, False
        topic_id = topic.id

    page_size = constants.OPPORTUNITIES_PAGE_SIZE
    opportunity_models_list, cursor, more = (
        opportunity_models.TranslationOpportunityModel.get_by_entity_type_and_topic(
            entity_type, topic_id, language_code, page_size, cursor
        )
    )

    if not opportunity_models_list:
        return [], cursor, more

    card_infos = _get_translation_opportunity_cards_from_models(
        opportunity_models_list, entity_type, language_code
    )

    return card_infos, cursor, more


def _get_translation_opportunity_cards_from_models(
    opportunity_models_list: Sequence[
        opportunity_models.TranslationOpportunityModel
    ],
    entity_type: str,
    language_code: str,
) -> List[opportunity_domain.TranslationOpportunityCardInfo]:
    """Returns a list of translation opportunity card info objects for the given
    list of models.

    Args:
        opportunity_models_list: list(TranslationOpportunityModel). The list of models.
        entity_type: str. The entity type.
        language_code: str. The language code.

    Returns:
        list(TranslationOpportunityCardInfo). A list of TranslationOpportunityCardInfo.
    """
    entity_ids = [model.entity_id for model in opportunity_models_list]

    topic_summaries = topic_fetchers.get_all_topic_summaries()
    topic_summary_map = {ts.id: ts for ts in topic_summaries if ts is not None}

    story_map = {}
    skill_map = {}
    topic_map = {}
    exp_id_to_story_id = {}

    if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
        for ts in topic_summaries:
            for (
                story_id,
                exp_ids,
            ) in ts.published_story_exploration_mapping.items():
                for exp_id in exp_ids:
                    if exp_id in entity_ids:
                        exp_id_to_story_id[exp_id] = story_id

        story_ids = list(set(exp_id_to_story_id.values()))
        if story_ids:
            stories = story_fetchers.get_stories_by_ids(story_ids)
            story_map = {
                story.id: story for story in stories if story is not None
            }

    elif entity_type == feconf.ENTITY_TYPE_STORY:
        stories = story_fetchers.get_stories_by_ids(entity_ids)
        story_map = {story.id: story for story in stories if story is not None}

    elif entity_type == feconf.ENTITY_TYPE_SKILL:
        skills = skill_fetchers.get_multi_skills(entity_ids, strict=False)
        skill_map = {skill.id: skill for skill in skills if skill is not None}

    else:
        topics = topic_fetchers.get_topics_by_ids(entity_ids, strict=False)
        topic_map = {topic.id: topic for topic in topics if topic is not None}

    in_review_counts = {}
    if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
        in_review_counts = (
            _build_exp_id_to_translation_suggestion_in_review_count(
                entity_ids, language_code
            )
        )

    published_topic_ids = set()
    if entity_type == feconf.ENTITY_TYPE_TOPIC:
        published_topic_ids = {
            ts.id for ts in topic_fetchers.get_published_topic_summaries()
        }

    card_infos = []
    for model in opportunity_models_list:
        topic_name_val = ''
        if model.topic_ids:
            for t_id in model.topic_ids:
                if t_id in topic_summary_map:
                    topic_name_val = topic_summary_map[t_id].name
                    break

        currently_available_to_learners = False
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            for ts in topic_summaries:
                for (
                    story_id,
                    exp_ids,
                ) in ts.published_story_exploration_mapping.items():
                    if model.entity_id in exp_ids:
                        currently_available_to_learners = True
                        break
                if currently_available_to_learners:
                    break

        elif entity_type == feconf.ENTITY_TYPE_STORY:
            for ts in topic_summaries:
                if model.entity_id in ts.published_story_exploration_mapping:
                    currently_available_to_learners = True
                    break

        elif entity_type == feconf.ENTITY_TYPE_SKILL:
            if model.topic_ids:
                currently_available_to_learners = True

        else:
            currently_available_to_learners = (
                model.entity_id in published_topic_ids
            )

        entity_description = ''
        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            exp_id = model.entity_id
            story_id_val = exp_id_to_story_id.get(exp_id)
            if story_id_val and story_id_val in story_map:
                story_val = story_map[story_id_val]
                story_node = (
                    story_val.story_contents.get_node_with_corresponding_exp_id(
                        exp_id
                    )
                )
                if story_node:
                    entity_description = story_node.title
        elif entity_type == feconf.ENTITY_TYPE_STORY:
            story_val_obj = story_map.get(model.entity_id)
            if story_val_obj:
                entity_description = story_val_obj.title
        elif entity_type == feconf.ENTITY_TYPE_SKILL:
            skill_val_obj = skill_map.get(model.entity_id)
            if skill_val_obj:
                entity_description = skill_val_obj.description
        else:
            topic_val_obj = topic_map.get(model.entity_id)
            if topic_val_obj:
                entity_description = topic_val_obj.name

        card_info = opportunity_domain.TranslationOpportunityCardInfo(
            topic_ids=model.topic_ids,
            entity_id=model.entity_id,
            content_count=model.content_count,
            incomplete_translation_language_codes=model.incomplete_translation_language_codes,
            translation_counts=model.translation_counts,
            entity_type=model.entity_type,
            topic_name=topic_name_val,
            entity_description=entity_description,
            is_pinned=False,
            currently_available_to_learners=currently_available_to_learners,
        )

        if model.entity_id in in_review_counts:
            card_info.translation_in_review_counts = {
                language_code: in_review_counts[model.entity_id]
            }

        card_infos.append(card_info)

    return card_infos


def get_translation_opportunity_cards_by_entity_ids_with_new_models(
    entity_type: str,
    entity_ids: List[str],
    language_code: str,
) -> List[opportunity_domain.TranslationOpportunityCardInfo]:
    """Returns a list of translation opportunity card info objects for the given
    entity IDs and type.

    Args:
        entity_type: str. The entity type.
        entity_ids: list(str). The entity IDs.
        language_code: str. The language code to filter by.

    Returns:
        list(TranslationOpportunityCardInfo). A list of TranslationOpportunityCardInfo domain objects.
    """
    if not entity_ids:
        return []

    opportunity_models_from_db = (
        opportunity_models.TranslationOpportunityModel.get_by_entity_ids(
            entity_type, entity_ids
        )
    )

    opportunity_models_list = [
        model for model in opportunity_models_from_db if model is not None
    ]
    if not opportunity_models_list:
        return []

    return _get_translation_opportunity_cards_from_models(
        opportunity_models_list, entity_type, language_code
    )


def get_translation_opportunities(
    language_code: str, topic_name: Optional[str], cursor: Optional[str]
) -> Tuple[
    List[opportunity_domain.ExplorationOpportunitySummary], Optional[str], bool
]:
    """Returns a list of opportunities available for translation in a specific
    language.

    Args:
        cursor: str or None. If provided, the list of returned entities
            starts from this datastore cursor. Otherwise, the returned
            entities start from the beginning of the full list of entities.
        language_code: str. The language for which translation opportunities
            should be fetched.
        topic_name: str or None. The topic for which translation opportunities
            should be fetched. If topic_name is None or empty, fetch
            translation opportunities from all topics.

    Returns:
        3-tuple(opportunities, cursor, more). where:
            opportunities: list(ExplorationOpportunitySummary). A list of
                ExplorationOpportunitySummary domain objects.
            cursor: str or None. A query cursor pointing to the next batch of
                results. If there are no more results, this might be None.
            more: bool. If True, there are (probably) more results after this
                batch. If False, there are no further results after this batch.
    """
    page_size = constants.OPPORTUNITIES_PAGE_SIZE
    exp_opportunity_summary_models, cursor, more = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_all_translation_opportunities(
            page_size, cursor, language_code, topic_name
        )
    )
    opportunity_summaries = []
    opportunity_summary_exp_ids = [
        opportunity.id for opportunity in exp_opportunity_summary_models
    ]
    exp_id_to_in_review_count = {}
    if len(opportunity_summary_exp_ids) > 0:
        exp_id_to_in_review_count = (
            _build_exp_id_to_translation_suggestion_in_review_count(
                opportunity_summary_exp_ids, language_code
            )
        )

    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        opportunity_summary = get_exploration_opportunity_summary_from_model(
            exp_opportunity_summary_model
        )
        if opportunity_summary.id in exp_id_to_in_review_count:
            # Compute the translation_in_review_counts domain object field
            # adhoc. Note that this field is not persisted and is only used in
            # the frontend.
            # TODO(#14833): Compute this value in the backend controller
            # instead.
            opportunity_summary.translation_in_review_counts = {
                language_code: exp_id_to_in_review_count[opportunity_summary.id]
            }

        opportunity_summaries.append(opportunity_summary)
    return opportunity_summaries, cursor, more


def _build_exp_id_to_translation_suggestion_in_review_count(
    exp_ids: List[str], language_code: str
) -> Dict[str, int]:
    """Returns a dict mapping exploration ID to the count of corresponding
    translation suggestions that are currently in review.

    Args:
        exp_ids: list(str). List of exploration IDs for which to count
            corresponding translations suggestions.
        language_code: str. The language for which translation suggestions
            should be fetched.

    Returns:
        dict(str, int). Dict of exploration IDs to counts of corresponding
        translation suggestions currently in review.
    """
    exp_id_to_in_review_count: Dict[str, int] = collections.defaultdict(int)
    suggestions_in_review = (
        suggestion_services.get_translation_suggestions_in_review_by_exp_ids(
            exp_ids, language_code
        )
    )
    for suggestion in suggestions_in_review:
        if suggestion is not None:
            exp_id_to_in_review_count[suggestion.target_id] += 1
    return exp_id_to_in_review_count


def get_exploration_opportunity_summaries_by_ids(
    ids: List[str],
) -> Dict[str, Optional[opportunity_domain.ExplorationOpportunitySummary]]:
    """Returns a dict with key as id and value representing
    ExplorationOpportunitySummary objects corresponding to the opportunity id.

    Args:
        ids: list(str). A list of opportunity ids.

    Returns:
        dict(str, ExplorationOpportunitySummary|None). A dict with key as the
        opportunity id and values representing the ExplorationOpportunitySummary
        domain objects corresponding to the opportunity id if exist else None.
    """
    opportunities: Dict[
        str, Optional[opportunity_domain.ExplorationOpportunitySummary]
    ] = {opportunity_id: None for opportunity_id in ids}
    exp_opportunity_summary_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(ids)
    )
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        if exp_opportunity_summary_model is not None:
            opportunities[exp_opportunity_summary_model.id] = (
                get_exploration_opportunity_summary_from_model(
                    exp_opportunity_summary_model
                )
            )
    return opportunities


def get_exploration_opportunity_summary_by_id(
    opportunity_id: str,
) -> Optional[opportunity_domain.ExplorationOpportunitySummary]:
    """Returns an ExplorationOpportunitySummary object corresponding to the
    opportunity id.

    Args:
        opportunity_id: str. An opportunity id.

    Returns:
        ExplorationOpportunitySummary|None. An ExplorationOpportunitySummary
        domain object corresponding to the opportunity id if it exists, else
        None.
    """
    exp_opportunity_summary_model = (
        opportunity_models.ExplorationOpportunitySummaryModel.get(
            opportunity_id, strict=False
        )
    )
    if exp_opportunity_summary_model is None:
        return None
    return get_exploration_opportunity_summary_from_model(
        exp_opportunity_summary_model
    )


def get_exploration_opportunity_summaries_by_topic_id(
    topic_id: str,
) -> List[opportunity_domain.ExplorationOpportunitySummary]:
    """Returns a list of all exploration opportunity summaries
    with the given topic ID.

    Args:
        topic_id: str. The topic for which opportunity summaries
            are fetched.

    Returns:
        list(ExplorationOpportunitySummary). A list of all
        exploration opportunity summaries with the given topic ID.
    """
    opportunity_summaries = []
    exp_opportunity_summary_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_by_topic(
            topic_id
        )
    )
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        opportunity_summary = get_exploration_opportunity_summary_from_model(
            exp_opportunity_summary_model
        )
        opportunity_summaries.append(opportunity_summary)
    return opportunity_summaries


def update_opportunities_with_new_topic_name(
    topic_id: str, topic_name: str
) -> None:
    """Updates the exploration opportunity summary models with new topic name.

    Args:
        topic_id: str. The corresponding topic id of the opportunity.
        topic_name: str. The new topic name.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_by_topic(
            topic_id
        )
    )

    exploration_opportunity_summary_list = []
    for exp_opportunity_model in exp_opportunity_models:
        exploration_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_model
            )
        )
        exploration_opportunity_summary.topic_name = topic_name
        exploration_opportunity_summary.validate()

        exploration_opportunity_summary_list.append(
            exploration_opportunity_summary
        )

    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list
    )


def get_skill_opportunity_from_model(
    model: opportunity_models.SkillOpportunityModel,
) -> opportunity_domain.SkillOpportunity:
    """Returns a SkillOpportunity domain object from a SkillOpportunityModel.

    Args:
        model: SkillOpportunityModel. The skill opportunity model.

    Returns:
        SkillOpportunity. The corresponding SkillOpportunity object.
    """
    return opportunity_domain.SkillOpportunity(
        model.id, model.skill_description, model.question_count
    )


def get_skill_opportunities(
    cursor: Optional[str],
) -> Tuple[List[opportunity_domain.SkillOpportunity], Optional[str], bool]:
    """Returns a list of skill opportunities available for questions.

    Args:
        cursor: str or None. If provided, the list of returned entities
            starts from this datastore cursor. Otherwise, the returned
            entities start from the beginning of the full list of entities.

    Returns:
        3-tuple(opportunities, cursor, more). where:
            opportunities: list(SkillOpportunity). A list of SkillOpportunity
                domain objects.
            cursor: str or None. A query cursor pointing to the next
                batch of results. If there are no more results, this might
                be None.
            more: bool. If True, there are (probably) more results after
                this batch. If False, there are no further results after
                this batch.
    """
    skill_opportunity_models, cursor, more = (
        opportunity_models.SkillOpportunityModel.get_skill_opportunities(
            constants.OPPORTUNITIES_PAGE_SIZE, cursor
        )
    )
    opportunities = []
    for skill_opportunity_model in skill_opportunity_models:
        skill_opportunity = get_skill_opportunity_from_model(
            skill_opportunity_model
        )
        opportunities.append(skill_opportunity)
    return opportunities, cursor, more


def get_skill_opportunities_by_ids(
    ids: List[str],
) -> Dict[str, Optional[opportunity_domain.SkillOpportunity]]:
    """Returns a list of SkillOpportunity domain objects corresponding to the
    given list of ids.

    Args:
        ids: list(str). A list of the opportunity ids.

    Returns:
        dict(str, SkillOpportunity|None). A dict with key as the
        opportunity id and values representing the SkillOpportunity
        domain objects corresponding to the opportunity id if exist else None.
    """
    opportunities: Dict[str, Optional[opportunity_domain.SkillOpportunity]] = {
        opportunity_id: None for opportunity_id in ids
    }
    skill_opportunity_models = (
        opportunity_models.SkillOpportunityModel.get_multi(ids)
    )

    for skill_opportunity_model in skill_opportunity_models:
        if skill_opportunity_model is not None:
            opportunities[skill_opportunity_model.id] = (
                get_skill_opportunity_from_model(skill_opportunity_model)
            )
    return opportunities


def create_skill_opportunity(skill_id: str, skill_description: str) -> None:
    """Creates a SkillOpportunityModel entity in the datastore.

    Args:
        skill_id: str. The skill_id of the opportunity.
        skill_description: str. The skill_description of the opportunity.

    Raises:
        Exception. If a SkillOpportunityModel corresponding to the supplied
            skill_id already exists.
    """
    skill_opportunity_model = (
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id)
    )
    if skill_opportunity_model is not None:
        raise Exception(
            'SkillOpportunity corresponding to skill ID %s already exists.'
            % (skill_id)
        )

    questions, _ = (
        question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
            constants.MAX_QUESTIONS_PER_SKILL, [skill_id], 0
        )
    )
    skill_opportunity = opportunity_domain.SkillOpportunity(
        skill_id=skill_id,
        skill_description=skill_description,
        question_count=len(questions),
    )
    _save_skill_opportunities([skill_opportunity])


def _save_skill_opportunities(
    skill_opportunities: List[opportunity_domain.SkillOpportunity],
) -> None:
    """Saves SkillOpportunity domain objects into datastore as
    SkillOpportunityModel objects.

    Args:
        skill_opportunities: list(SkillOpportunity). A list of SkillOpportunity
            domain objects.
    """
    skill_opportunity_models = []
    for skill_opportunity in skill_opportunities:
        skill_opportunity.validate()
        model = opportunity_models.SkillOpportunityModel(
            id=skill_opportunity.id,
            skill_description=skill_opportunity.skill_description,
            question_count=skill_opportunity.question_count,
        )
        skill_opportunity_models.append(model)
    opportunity_models.SkillOpportunityModel.update_timestamps_multi(
        skill_opportunity_models
    )
    opportunity_models.SkillOpportunityModel.put_multi(skill_opportunity_models)


def update_skill_opportunity_skill_description(
    skill_id: str, new_description: str
) -> None:
    """Updates the skill_description of the SkillOpportunityModel with
    new_description.

    Args:
        skill_id: str. The corresponding skill_id of the opportunity.
        new_description: str. The new skill_description.
    """
    skill_opportunity = _get_skill_opportunity(skill_id)
    if skill_opportunity is not None:
        skill_opportunity.skill_description = new_description
        _save_skill_opportunities([skill_opportunity])


def _get_skill_opportunity(
    skill_id: str,
) -> Optional[opportunity_domain.SkillOpportunity]:
    """Returns the SkillOpportunity domain object representing a
    SkillOpportunityModel with the supplied skill_id in the datastore.

    Args:
        skill_id: str. The corresponding skill_id of the opportunity.

    Returns:
        SkillOpportunity or None. The domain object representing a
        SkillOpportunity with the supplied skill_id, or None if it does not
        exist.
    """
    skill_opportunity_model = (
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id)
    )
    if skill_opportunity_model is not None:
        return get_skill_opportunity_from_model(skill_opportunity_model)
    return None


def delete_skill_opportunity(skill_id: str) -> None:
    """Deletes the SkillOpportunityModel corresponding to the supplied skill_id.

    Args:
        skill_id: str. The skill_id corresponding to the to-be-deleted
            SkillOpportunityModel.
    """
    skill_opportunity_model = (
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id)
    )
    if skill_opportunity_model is not None:
        opportunity_models.SkillOpportunityModel.delete(skill_opportunity_model)


def increment_question_counts(skill_ids: List[str], delta: int) -> None:
    """Increments question_count(s) of SkillOpportunityModel(s) with
    corresponding skill_ids.

    Args:
        skill_ids: list(str). A list of skill_ids corresponding to
            SkillOpportunityModel(s).
        delta: int. The delta for which to increment each question_count.
    """
    updated_skill_opportunities = (
        _get_skill_opportunities_with_updated_question_counts(skill_ids, delta)
    )
    _save_skill_opportunities(updated_skill_opportunities)


def update_skill_opportunities_on_question_linked_skills_change(
    old_skill_ids: List[str], new_skill_ids: List[str]
) -> None:
    """Updates question_count(s) of SkillOpportunityModel(s) corresponding to
    the change in linked skill IDs for a question from old_skill_ids to
    new_skill_ids, e.g. if skill_id1 is in old_skill_ids, but not in
    new_skill_ids, the question_count of the SkillOpportunityModel for skill_id1
    would be decremented.

    NOTE: Since this method is updating the question_counts based on the change
    of skill_ids from old_skill_ids to new_skill_ids, the input skill_id lists
    must be related.

    Args:
        old_skill_ids: list(str). A list of old skill_id(s).
        new_skill_ids: list(str). A list of new skill_id(s).
    """
    old_skill_ids_set = set(old_skill_ids)
    new_skill_ids_set = set(new_skill_ids)
    new_skill_ids_added_to_question = new_skill_ids_set - old_skill_ids_set
    skill_ids_removed_from_question = old_skill_ids_set - new_skill_ids_set
    updated_skill_opportunities = []
    updated_skill_opportunities.extend(
        _get_skill_opportunities_with_updated_question_counts(
            list(new_skill_ids_added_to_question), 1
        )
    )
    updated_skill_opportunities.extend(
        _get_skill_opportunities_with_updated_question_counts(
            list(skill_ids_removed_from_question), -1
        )
    )
    _save_skill_opportunities(updated_skill_opportunities)


def _get_skill_opportunities_with_updated_question_counts(
    skill_ids: List[str], delta: int
) -> List[opportunity_domain.SkillOpportunity]:
    """Returns a list of SkillOpportunities with corresponding skill_ids
    with question_count(s) updated by delta.

    Args:
        skill_ids: List(str). The IDs of the matching SkillOpportunityModels
            in the datastore.
        delta: int. The delta by which to update each question_count (can be
            negative).

    Returns:
        list(SkillOpportunity). The updated SkillOpportunities.
    """
    updated_skill_opportunities = []
    skill_opportunity_models = (
        opportunity_models.SkillOpportunityModel.get_multi(skill_ids)
    )
    for skill_opportunity_model in skill_opportunity_models:
        if skill_opportunity_model is not None:
            skill_opportunity = get_skill_opportunity_from_model(
                skill_opportunity_model
            )
            # The question count should never be negative. We default to 0
            # if some operation tries to reduce question count down to a
            # negative value.
            skill_opportunity.question_count = max(
                skill_opportunity.question_count + delta, 0
            )
            updated_skill_opportunities.append(skill_opportunity)
    return updated_skill_opportunities


def regenerate_opportunities_related_to_topic(
    topic_id: str, delete_existing_opportunities: bool = False
) -> int:
    """Regenerates opportunity models which belongs to a given topic.

    Args:
        topic_id: str. The ID of the topic.
        delete_existing_opportunities: bool. Whether to delete all the existing
            opportunities related to the given topic.

    Returns:
        int. The number of opportunity models created.

    Raises:
        Exception. Failure to regenerate opportunities for given topic.
    """
    if delete_existing_opportunities:
        exp_opportunity_models = (
            opportunity_models.ExplorationOpportunitySummaryModel.get_by_topic(
                topic_id
            )
        )
        opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
            list(exp_opportunity_models)
        )

    topic = topic_fetchers.get_topic_by_id(topic_id)
    story_ids = topic.get_canonical_story_ids()
    stories = story_fetchers.get_stories_by_ids(story_ids)
    exp_ids = []
    non_existing_story_ids = []

    for index, story in enumerate(stories):
        if story is None:
            non_existing_story_ids.append(story_ids[index])
        else:
            exp_ids += story.story_contents.get_all_linked_exp_ids()

    exp_ids_to_exp = exp_fetchers.get_multiple_explorations_by_id(
        exp_ids, strict=False
    )
    non_existing_exp_ids = set(exp_ids) - set(exp_ids_to_exp.keys())

    if len(non_existing_exp_ids) > 0 or len(non_existing_story_ids) > 0:
        raise Exception(
            'Failed to regenerate opportunities for topic id: %s, '
            'missing_exp_with_ids: %s, missing_story_with_ids: %s'
            % (topic_id, list(non_existing_exp_ids), non_existing_story_ids)
        )

    exploration_opportunity_summary_list = []
    for story in stories:
        # Ruling out the possibility of None for mypy type checking, because
        # above we are already validating that story is not None.
        assert story is not None
        for exp_id in story.story_contents.get_all_linked_exp_ids():
            exploration_opportunity_summary_list.append(
                create_exp_opportunity_summary(
                    topic, story, exp_ids_to_exp[exp_id]
                )
            )

    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list
    )
    return len(exploration_opportunity_summary_list)


def update_pinned_opportunity_model(
    user_id: str,
    language_code: str,
    topic_id: str,
    lesson_id: Optional[str],
    entity_type: str = feconf.ENTITY_TYPE_EXPLORATION,
) -> None:
    """Pins/Unpins Reviewable opportunities in Contributor Dashboard.

    Args:
        user_id: str. The ID of the user.
        language_code: str. The language code for which opportunity
            has to be pinned.
        topic_id: str. The topic id of the opportunity to be
            pinned.
        lesson_id: str or None. The opportunity_id/exp_id of opportunity
            to be pinned. None if user wants to unpin the opportunity.
        entity_type: str. The type of the entity to be pinned.
    """

    pinned_opportunity = user_models.PinnedOpportunityModel.get_model(
        user_id, language_code, topic_id
    )

    if not pinned_opportunity and not lesson_id:
        # If there's no model and no lesson_id provided, no action needed.
        return

    if not pinned_opportunity and lesson_id:
        # If no model exists, create a new one with the provided parameters.
        user_models.PinnedOpportunityModel.create(
            user_id=user_id,
            language_code=language_code,
            topic_id=topic_id,
            opportunity_id=lesson_id,
            entity_type=entity_type,
        )
    else:
        if pinned_opportunity:
            # Update the model's opportunity_id and entity_type.
            pinned_opportunity.opportunity_id = lesson_id
            if lesson_id is not None:
                pinned_opportunity.entity_type = entity_type
            pinned_opportunity.update_timestamps()
            pinned_opportunity.put()


def get_pinned_lesson(
    user_id: str, language_code: str, topic_id: str
) -> Optional[opportunity_domain.ExplorationOpportunitySummary]:
    """Retrieves the pinned lesson for a user in a specific language and topic.

    NOTE: If the pinned lesson exists, it will have the 'is_pinned'
    attribute set to True.

    Args:
        user_id: str. The ID of the user for whom to retrieve the pinned
            lesson.
        language_code: str. The ISO 639-1 language code for the
            desired language.
        topic_id: str. The ID of the topic for which to retrieve
            the pinned lesson.

    Returns:
        ExplorationOpportunitySummary or None. The pinned lesson as an
        ExplorationOpportunitySummary object, or None if no
        pinned lesson exists.
    """
    pinned_opportunity = user_models.PinnedOpportunityModel.get_model(
        user_id, language_code, topic_id
    )
    if pinned_opportunity and pinned_opportunity.opportunity_id is not None:
        # If the model exists and has a valid opportunity_id, return it.
        model = opportunity_models.ExplorationOpportunitySummaryModel.get(
            pinned_opportunity.opportunity_id
        )
        exploration_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(model)
        )
        exploration_opportunity_summary.is_pinned = True

        return exploration_opportunity_summary

    # If the model doesn't exist or has None as opportunity_id, return None.
    return None
