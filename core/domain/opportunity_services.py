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
import copy

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
    translation_fetchers,
    translation_services,
)
from core.platform import models

from typing import Dict, List, Optional, Sequence, Set, Tuple, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import opportunity_models, story_models, user_models

opportunity_models, story_models, user_models = models.Registry.import_models(
    [models.Names.OPPORTUNITY, models.Names.STORY, models.Names.USER]
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
    model = opportunity_models.TranslationOpportunityModel.get(
        f'{feconf.ENTITY_TYPE_EXPLORATION}.{exp_id}', strict=False
    )

    return model is not None


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
        topic_ids=list(model.topic_ids),
        content_count=model.content_count,
        incomplete_translation_language_codes=list(
            model.incomplete_translation_language_codes
        ),
        # We use copy.deepcopy() and list() to prevent accidental modifications
        # to the underlying datastore model properties when the domain object
        # is mutated.
        translation_counts=copy.deepcopy(model.translation_counts),
    )


def get_translation_opportunities_by_entity_ids(
    entity_type: str,
    entity_ids: List[str],
) -> Dict[str, Optional[opportunity_domain.TranslationOpportunity]]:
    """Returns a dict mapping entity ID to corresponding TranslationOpportunity
    domain objects.

    Args:
        entity_type: str. The entity type.
        entity_ids: list(str). The entity IDs.

    Returns:
        dict(str, TranslationOpportunity|None). A dict with key as the entity ID
        and values representing the TranslationOpportunity domain objects.
    """
    opportunities: Dict[
        str, Optional[opportunity_domain.TranslationOpportunity]
    ] = {entity_id: None for entity_id in entity_ids}
    opportunity_models_list = (
        opportunity_models.TranslationOpportunityModel.get_by_entity_ids(
            entity_type, entity_ids
        )
    )
    for model in opportunity_models_list:
        if model is not None:
            opportunities[model.entity_id] = (
                get_translation_opportunity_summary_from_model(model)
            )
    return opportunities


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
    model_id = f'{entity_type}.{entity_id}'
    model = opportunity_models.TranslationOpportunityModel.get(
        model_id, strict=False
    )
    if model is None:
        topic_ids_by_entity = _compute_topic_ids_of_translation_opportunities(
            {entity_type: [entity_id]}
        )
        topic_ids = topic_ids_by_entity.get(entity_id, [])
        if not topic_ids:
            raise ValueError(
                f'Missing topic id for {entity_type} with id {entity_id}'
            )
        # If the model does not exist, we create a new one.
        create_translation_opportunity(
            {entity_type: [entity_id]}, topic_ids=topic_ids
        )
        model = opportunity_models.TranslationOpportunityModel.get(model_id)
    elif not model.topic_ids:
        topic_ids_by_entity = _compute_topic_ids_of_translation_opportunities(
            {entity_type: [entity_id]}
        )
        topic_ids = topic_ids_by_entity.get(entity_id, [])
        if not topic_ids:
            raise ValueError(
                f'Missing topic id for {entity_type} with id {entity_id}'
            )
        model.topic_ids = topic_ids

    complete_translation_language_list = []
    for language_code, translation_count in translation_counts.items():
        if translation_count == content_count:
            complete_translation_language_list.append(language_code)

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
    # Story and Topic do not extend BaseTranslatableObject, so
    # get_content_count() is not available for them. Content count defaults
    # to 0 for non-translatable entities.
    content_count = (
        entity.get_content_count()
        if isinstance(entity, translation_domain.BaseTranslatableObject)
        else 0
    )
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
    topic_ids: Optional[List[str]] = None,
) -> None:
    """Creates and stores translation opportunities for the given entities.

    Args:
        entity_types_and_ids: dict(str, list(str)). A mapping of entity types
            (e.g., 'exploration') to lists of entity IDs to process.
        topic_ids: list(str)|None. Specific topic IDs to associate with the
            opportunities. If None, the topic IDs are computed dynamically.
    """
    if topic_ids is not None:
        entity_to_topics = {
            entity_id: topic_ids
            for entity_ids_list in entity_types_and_ids.values()
            for entity_id in entity_ids_list
        }
    else:
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
                merged_topic_ids = sorted(
                    list(set(existing_model.topic_ids + model.topic_ids))
                )
                if (
                    existing_model.content_count != model.content_count
                    or existing_model.translation_counts
                    != model.translation_counts
                    or set(existing_model.incomplete_translation_language_codes)
                    != set(model.incomplete_translation_language_codes)
                    or existing_model.topic_ids != merged_topic_ids
                ):
                    model.topic_ids = merged_topic_ids
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
    if feconf.ENTITY_TYPE_SKILL in entity_types_and_ids:
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
    _create_exploration_opportunities(topic, exp_ids)


def _create_exploration_opportunities(
    topic: topic_domain.Topic, exp_ids: List[str]
) -> None:
    """Creates new exploration opportunities corresponding to the supplied
    topic and exploration IDs.

    Args:
        topic: Topic. The topic domain object corresponding to the exploration
            opportunities.
        exp_ids: list(str). A list of exploration ids for which new
            opportunities are to be created.
    """
    explorations = exp_fetchers.get_multiple_explorations_by_id(exp_ids)
    for exploration in explorations.values():
        generate_voiceovers_async_for_exp_linked_to_topic(exploration.id)

    create_translation_opportunity(
        {feconf.ENTITY_TYPE_EXPLORATION: exp_ids}, topic_ids=[topic.id]
    )


def remove_topic_from_translation_opportunities(
    topic_id: str,
    entity_types_and_ids: Dict[str, List[str]],
) -> None:
    """Removes a topic ID from topic_ids list of translation opportunities.

    Args:
        topic_id: str. The topic ID to remove.
        entity_types_and_ids: dict(str, list(str)). A dictionary mapping entity
            types to lists of entity IDs.
    """
    opportunity_ids = [
        f'{entity_type}.{entity_id}'
        for entity_type, entity_ids in entity_types_and_ids.items()
        for entity_id in entity_ids
    ]

    opp_models = opportunity_models.TranslationOpportunityModel.get_multi(
        opportunity_ids
    )
    models_to_update = []

    for model in opp_models:
        if model is not None and topic_id in model.topic_ids:
            model.topic_ids.remove(topic_id)
            models_to_update.append(model)

    if models_to_update:
        opportunity_models.TranslationOpportunityModel.update_timestamps_multi(
            models_to_update
        )
        opportunity_models.TranslationOpportunityModel.put_multi(
            models_to_update
        )


def compute_opportunity_models_with_updated_exploration(
    exp_id: str, content_count: int, translation_counts: Dict[str, int]
) -> List[opportunity_models.TranslationOpportunityModel]:
    """Updates the opportunities models with the changes made in the
    exploration.

    Args:
        exp_id: str. The exploration id which is also the id of the opportunity
            model.
        content_count: int. The number of contents available in the exploration.
        translation_counts: dict(str, int). The number of translations available
            for the exploration in different languages.

    Returns:
        list(TranslationOpportunityModel). A list of opportunity models
        which are updated.
    """
    return compute_translation_opportunity_models_with_updated_entity(
        feconf.ENTITY_TYPE_EXPLORATION,
        exp_id,
        content_count,
        translation_counts,
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
    model_id = f'{entity_type}.{entity_id}'

    model = opportunity_models.TranslationOpportunityModel.get(
        model_id, strict=False
    )
    if model is None:
        return

    translation_opportunity = get_translation_opportunity_summary_from_model(
        model
    )

    entity = get_entity_by_type_and_id(entity_type, entity_id)
    entity_translation = translation_fetchers.get_entity_translation(
        feconf.TranslatableEntityType(entity_type),
        entity_id,
        entity.version,
        language_code,
    )

    new_count = (
        entity.get_translation_count(entity_translation)
        if isinstance(entity, translation_domain.BaseTranslatableObject)
        else 0
    )

    translation_opportunity.translation_counts[language_code] = new_count
    translation_opportunity.content_count = (
        entity.get_content_count()
        if isinstance(entity, translation_domain.BaseTranslatableObject)
        else 0
    )
    translation_opportunity.update_translation_count(language_code, new_count)

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


def delete_translation_opportunities(
    entity_types_and_ids: Dict[str, List[str]],
) -> None:
    """Deletes translation opportunities for the given entities.

    Args:
        entity_types_and_ids: dict(str, list(str)). A mapping of entity types
            to lists of entity IDs.
    """
    model_ids = [
        f'{entity_type}.{entity_id}'
        for entity_type, entity_ids in entity_types_and_ids.items()
        for entity_id in entity_ids
    ]
    if not model_ids:
        return
    opp_models = opportunity_models.TranslationOpportunityModel.get_multi(
        model_ids
    )
    models_to_delete = [model for model in opp_models if model is not None]
    if models_to_delete:
        opportunity_models.TranslationOpportunityModel.delete_multi(
            models_to_delete
        )


def delete_exploration_opportunities(exp_ids: List[str]) -> None:
    """Deletes translation opportunities corresponding to the given exploration IDs.

    Args:
        exp_ids: list(str). A list of exploration IDs whose opportunity summary
            models are to be deleted.
    """
    delete_translation_opportunities({feconf.ENTITY_TYPE_EXPLORATION: exp_ids})


def delete_exploration_opportunities_corresponding_to_topic(
    topic_id: str,
) -> None:
    """Deletes translation opportunities corresponding to the given topic.

    Args:
        topic_id: str. The ID of the topic.
    """
    translation_opportunity_models = (
        opportunity_models.TranslationOpportunityModel.get_by_topic(topic_id)
    )
    if translation_opportunity_models:
        opportunity_models.TranslationOpportunityModel.delete_multi(
            list(translation_opportunity_models)
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
    exp_ids_in_old_story = old_story.story_contents.get_all_linked_exp_ids()
    exp_ids_in_new_story = new_story.story_contents.get_all_linked_exp_ids()
    new_added_exp_ids = set(exp_ids_in_new_story) - set(exp_ids_in_old_story)
    deleted_exp_ids = set(exp_ids_in_old_story) - set(exp_ids_in_new_story)

    add_new_exploration_opportunities(new_story.id, list(new_added_exp_ids))
    delete_exploration_opportunities(list(deleted_exp_ids))


def delete_exp_opportunities_corresponding_to_story(story_id: str) -> None:
    """Deletes translation opportunities corresponding to the story.

    Args:
        story_id: str. The ID of the story.
    """
    story_model = story_models.StoryModel.get_by_id(story_id)
    if story_model is not None:
        story = story_fetchers.get_story_from_model(story_model)
        delete_exploration_opportunities(
            story.story_contents.get_all_linked_exp_ids()
        )


def get_translation_opportunities(
    entity_type: Optional[str],
    language_code: Optional[str] = None,
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
        entity_type: str or None. The entity type to fetch opportunities for.
            If None, opportunities for all entity types are returned.
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
    valid_entity_types = (
        None,
        feconf.ENTITY_TYPE_EXPLORATION,
        feconf.ENTITY_TYPE_SKILL,
        feconf.ENTITY_TYPE_STORY,
        feconf.ENTITY_TYPE_TOPIC,
    )
    if entity_type not in valid_entity_types:
        cursor = topic_name
        topic_name = language_code
        language_code = entity_type
        entity_type = None

    assert language_code is not None
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
        opportunity_models_list, language_code
    )

    return card_infos, cursor, more


def get_translation_opportunities_count(
    entity_type: Optional[str],
    language_code: Optional[str] = None,
    topic_name: Optional[str] = None,
) -> int:
    """Returns the total count of translation opportunities for the given
    entity type, filtered by topic name and language code.

    Args:
        entity_type: str or None. The entity type to count opportunities
            for. If None, all entity types are included.
        language_code: str. The language code to filter by.
        topic_name: str or None. The name of the topic to filter by.

    Returns:
        int. The total number of matching translation opportunities.
    """
    valid_entity_types = (
        None,
        feconf.ENTITY_TYPE_EXPLORATION,
        feconf.ENTITY_TYPE_SKILL,
        feconf.ENTITY_TYPE_STORY,
        feconf.ENTITY_TYPE_TOPIC,
    )
    if entity_type not in valid_entity_types:
        topic_name = language_code
        language_code = entity_type
        entity_type = None

    assert language_code is not None
    topic_id = None
    if topic_name:
        topic = topic_fetchers.get_topic_by_name(topic_name, strict=False)
        if topic is None:
            return 0
        topic_id = topic.id

    return opportunity_models.TranslationOpportunityModel.count_by_entity_type_and_topic(
        entity_type, topic_id, language_code
    )


def _get_translation_opportunity_cards_from_models(
    opportunity_models_list: Sequence[
        opportunity_models.TranslationOpportunityModel
    ],
    language_code: str,
) -> List[opportunity_domain.TranslationOpportunityCardInfo]:
    """Returns a list of translation opportunity card info objects for the given
    list of models. Each card's entity type is taken from its own model, so a
    list mixing entity types is handled correctly.

    Args:
        opportunity_models_list: list(TranslationOpportunityModel). The list of models.
        language_code: str. The language code.

    Returns:
        list(TranslationOpportunityCardInfo). A list of TranslationOpportunityCardInfo.
    """
    topic_summaries = [
        ts for ts in topic_fetchers.get_all_topic_summaries() if ts is not None
    ]
    topic_summary_map = {ts.id: ts for ts in topic_summaries}

    story_map = {}
    skill_map = {}
    topic_map = {}
    exp_id_to_story_id = {}

    # A single page of opportunities can mix entity types, so the models are
    # grouped by their own entity type and each group is fetched in one batch.
    entity_ids_by_type: Dict[str, List[str]] = collections.defaultdict(list)
    for model in opportunity_models_list:
        entity_ids_by_type[model.entity_type].append(model.entity_id)

    exp_entity_ids = entity_ids_by_type[feconf.ENTITY_TYPE_EXPLORATION]
    story_entity_ids = entity_ids_by_type[feconf.ENTITY_TYPE_STORY]
    skill_entity_ids = entity_ids_by_type[feconf.ENTITY_TYPE_SKILL]
    topic_entity_ids = entity_ids_by_type[feconf.ENTITY_TYPE_TOPIC]

    explorations_map = {}
    exp_summary_map = {}
    in_review_counts = {}

    # Explorations and stories reach learners only through a published story,
    # so both sets are collected in a single pass here rather than rescanned
    # for every opportunity in the loop below. The same pass resolves the story
    # each requested exploration belongs to, which the card uses for its
    # description and its story title.
    requested_exp_ids = set(exp_entity_ids)
    published_exp_ids = set()
    published_story_ids = set()
    for ts in topic_summaries:
        for (
            story_id,
            exp_ids,
        ) in ts.published_story_exploration_mapping.items():
            published_story_ids.add(story_id)
            published_exp_ids.update(exp_ids)
            for exp_id in exp_ids:
                if exp_id in requested_exp_ids:
                    exp_id_to_story_id[exp_id] = story_id

    missing_exp_ids = requested_exp_ids - set(exp_id_to_story_id.keys())
    if missing_exp_ids:
        all_topic_ids = {
            t_id
            for model in opportunity_models_list
            if model.entity_type == feconf.ENTITY_TYPE_EXPLORATION
            and model.entity_id in missing_exp_ids
            for t_id in model.topic_ids
        }
        for t_id in all_topic_ids:
            topic = topic_fetchers.get_topic_by_id(t_id, strict=False)
            if topic is not None:
                topic_stories = story_fetchers.get_stories_by_ids(
                    topic.get_canonical_story_ids()
                )
                for story in topic_stories:
                    if story is not None:
                        for (
                            exp_id
                        ) in story.story_contents.get_all_linked_exp_ids():
                            if exp_id in missing_exp_ids:
                                exp_id_to_story_id[exp_id] = story.id

    if exp_entity_ids:
        story_ids = list(set(exp_id_to_story_id.values()))
        if story_ids:
            stories = story_fetchers.get_stories_by_ids(story_ids)
            story_map.update(
                {story.id: story for story in stories if story is not None}
            )

        explorations_map = exp_fetchers.get_multiple_explorations_by_id(
            exp_entity_ids, strict=False
        )
        exp_summaries = exp_fetchers.get_exploration_summaries_matching_ids(
            exp_entity_ids
        )
        for exp_summary in exp_summaries:
            if exp_summary is not None:
                exp_summary_map[exp_summary.id] = exp_summary

    exp_and_skill_entity_ids = exp_entity_ids + skill_entity_ids
    if exp_and_skill_entity_ids:
        in_review_counts = (
            _build_entity_id_to_translation_suggestion_in_review_count(
                exp_and_skill_entity_ids, language_code
            )
        )

    if story_entity_ids:
        stories = story_fetchers.get_stories_by_ids(story_entity_ids)
        story_map.update(
            {story.id: story for story in stories if story is not None}
        )

    if skill_entity_ids:
        skills = skill_fetchers.get_multi_skills(skill_entity_ids, strict=False)
        skill_map.update(
            {skill.id: skill for skill in skills if skill is not None}
        )

    if topic_entity_ids:
        topics = topic_fetchers.get_topics_by_ids(
            topic_entity_ids, strict=False
        )
        topic_map.update(
            {topic.id: topic for topic in topics if topic is not None}
        )

    published_topic_ids = {
        ts.id for ts in topic_fetchers.get_published_topic_summaries()
    }

    card_infos = []
    for model in opportunity_models_list:
        model_entity_type = model.entity_type
        topic_name_val = ''
        if model.topic_ids:
            for t_id in model.topic_ids:
                if t_id in topic_summary_map:
                    topic_name_val = topic_summary_map[t_id].name
                    break

        # Every field that depends on the entity type is resolved in this one
        # branch, so each opportunity is classified once.
        currently_available_to_learners = False
        entity_description = ''
        story_title_val = None
        reviewer_only_content_count_val = None
        language_code_val = None

        if model_entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            exp_id = model.entity_id
            currently_available_to_learners = exp_id in published_exp_ids
            story_id_val = exp_id_to_story_id.get(exp_id)
            if story_id_val and story_id_val in story_map:
                story_val = story_map[story_id_val]
                story_title_val = story_val.title
                story_node = (
                    story_val.story_contents.get_node_with_corresponding_exp_id(
                        exp_id
                    )
                )
                if story_node:
                    entity_description = story_node.title
            if exp_id in explorations_map:
                reviewer_only_content_count_val = explorations_map[
                    exp_id
                ].get_reviewer_only_content_count()
            if exp_id in exp_summary_map:
                language_code_val = exp_summary_map[exp_id].language_code

        elif model_entity_type == feconf.ENTITY_TYPE_STORY:
            currently_available_to_learners = (
                model.entity_id in published_story_ids
            )
            story_val_obj = story_map.get(model.entity_id)
            if story_val_obj:
                entity_description = story_val_obj.title

        elif model_entity_type == feconf.ENTITY_TYPE_SKILL:
            # A skill reaches learners as soon as it is assigned to a topic.
            currently_available_to_learners = bool(model.topic_ids)
            skill_val_obj = skill_map.get(model.entity_id)
            if skill_val_obj:
                entity_description = skill_val_obj.description

        else:
            assert model_entity_type == feconf.ENTITY_TYPE_TOPIC
            currently_available_to_learners = (
                model.entity_id in published_topic_ids
            )
            topic_val_obj = topic_map.get(model.entity_id)
            if topic_val_obj:
                entity_description = topic_val_obj.name

        card_info = opportunity_domain.TranslationOpportunityCardInfo(
            topic_ids=model.topic_ids,
            entity_id=model.entity_id,
            content_count=model.content_count,
            incomplete_translation_language_codes=model.incomplete_translation_language_codes,
            translation_counts=model.translation_counts,
            entity_type=model_entity_type,
            topic_name=topic_name_val,
            entity_description=entity_description,
            is_pinned=False,
            currently_available_to_learners=currently_available_to_learners,
            story_title=story_title_val,
            language_code=language_code_val,
            reviewer_only_content_count=reviewer_only_content_count_val,
        )

        if model.entity_id in in_review_counts:
            card_info.translation_in_review_counts = {
                language_code: in_review_counts[model.entity_id]
            }

        card_infos.append(card_info)

    return card_infos


def get_translation_opportunity_cards_by_entity_ids(
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
        opportunity_models_list, language_code
    )


def _build_entity_id_to_translation_suggestion_in_review_count(
    entity_ids: List[str], language_code: str
) -> Dict[str, int]:
    """Returns a dict mapping entity ID to the count of corresponding
    translation suggestions that are currently in review. Suggestions are
    matched on their target ID alone, so the entity IDs may belong to any
    translatable entity type.

    Args:
        entity_ids: list(str). List of entity IDs for which to count
            corresponding translations suggestions.
        language_code: str. The language for which translation suggestions
            should be fetched.

    Returns:
        dict(str, int). Dict of entity IDs to counts of corresponding
        translation suggestions currently in review.
    """
    entity_id_to_in_review_count: Dict[str, int] = collections.defaultdict(int)
    suggestions_in_review = (
        suggestion_services.get_translation_suggestions_in_review_by_entity_ids(
            entity_ids, language_code
        )
    )
    for suggestion in suggestions_in_review:
        if suggestion is not None:
            entity_id_to_in_review_count[suggestion.target_id] += 1
    return entity_id_to_in_review_count


def get_topic_id_to_translation_completeness(
    language_code: str,
) -> Dict[str, float]:
    """Returns a map from topic id to translation completeness percentage
    (0-100) for the given language, aggregated over all translation
    opportunities in that topic.

    Args:
        language_code: str. The language to compute completeness for.

    Returns:
        dict(str, float). Map of topic id to completeness percentage.
    """
    all_opportunities: Sequence[
        opportunity_models.TranslationOpportunityModel
    ] = opportunity_models.TranslationOpportunityModel.get_all().fetch()

    topic_id_to_content_count: Dict[str, int] = collections.defaultdict(int)
    topic_id_to_translation_count: Dict[str, int] = collections.defaultdict(int)
    for opp in all_opportunities:
        for topic_id in opp.topic_ids:
            topic_id_to_content_count[topic_id] += opp.content_count
            topic_id_to_translation_count[topic_id] += (
                opp.translation_counts or {}
            ).get(language_code, 0)

    topic_id_to_completeness: Dict[str, float] = {}
    for topic_id, content_count in topic_id_to_content_count.items():
        topic_id_to_completeness[topic_id] = (
            topic_id_to_translation_count[topic_id] / content_count * 100
            if content_count > 0
            else 0
        )
    return topic_id_to_completeness


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


def get_skill_opportunities_count() -> int:
    """Returns the total count of skill opportunities available for
    adding questions.

    Returns:
        int. The total number of skill opportunities.
    """
    return opportunity_models.SkillOpportunityModel.count_skill_opportunities()


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
    skill_opportunity_model = opportunity_models.SkillOpportunityModel.get(
        skill_id, strict=False
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
    skill_opportunity_model = opportunity_models.SkillOpportunityModel.get(
        skill_id, strict=False
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
    skill_opportunity_model = opportunity_models.SkillOpportunityModel.get(
        skill_id, strict=False
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
        translation_opportunity_models = (
            opportunity_models.TranslationOpportunityModel.get_by_topic(
                topic_id
            )
        )
        opportunity_models.TranslationOpportunityModel.delete_multi(
            list(translation_opportunity_models)
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

    create_translation_opportunity(
        {feconf.ENTITY_TYPE_EXPLORATION: exp_ids}, topic_ids=[topic_id]
    )

    return len(exp_ids)


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
        # The checks above guarantee that the model exists here.
        assert pinned_opportunity is not None
        # Update the model's opportunity_id and entity_type.
        pinned_opportunity.opportunity_id = lesson_id
        if lesson_id is not None:
            pinned_opportunity.entity_type = entity_type
        pinned_opportunity.update_timestamps()
        pinned_opportunity.put()
