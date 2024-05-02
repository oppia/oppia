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

from core import feconf

from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import opportunity_domain
from core.domain import question_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import translation_services
from core.platform import models

from typing import Dict, List, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import opportunity_models
    from mypy_imports import user_models

(opportunity_models, user_models) = models.Registry.import_models([
    models.Names.OPPORTUNITY, models.Names.USER
])

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
        exp_id, strict=False)

    return model is not None


def get_exploration_opportunity_summary_from_model(
    model: opportunity_models.ExplorationOpportunitySummaryModel
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
        model.incomplete_translation_language_codes +
        model.language_codes_needing_voice_artists +
        model.language_codes_with_assigned_voice_artists)
    supported_language_codes = set(
        language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES)
    missing_language_codes = list(
        supported_language_codes - set_of_all_languages)
    if missing_language_codes:
        logging.info(
            'Missing language codes %s in exploration opportunity model with '
            'id %s' % (missing_language_codes, model.id))

    new_incomplete_translation_language_codes = (
        model.incomplete_translation_language_codes + missing_language_codes)

    return opportunity_domain.ExplorationOpportunitySummary(
        model.id, model.topic_id, model.topic_name, model.story_id,
        model.story_title, model.chapter_title, model.content_count,
        new_incomplete_translation_language_codes, model.translation_counts,
        model.language_codes_needing_voice_artists,
        model.language_codes_with_assigned_voice_artists,
        {}, False)


def _construct_new_opportunity_summary_models(
    exploration_opportunity_summary_list: List[
        opportunity_domain.ExplorationOpportunitySummary
    ]
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
                opportunity_summary.incomplete_translation_language_codes),
            translation_counts=opportunity_summary.translation_counts,
            language_codes_needing_voice_artists=(
                opportunity_summary.language_codes_needing_voice_artists),
            language_codes_with_assigned_voice_artists=(
                opportunity_summary.language_codes_with_assigned_voice_artists)
        )

        exploration_opportunity_summary_model_list.append(model)
    return exploration_opportunity_summary_model_list


def _save_multi_exploration_opportunity_summary(
    exploration_opportunity_summary_list: List[
        opportunity_domain.ExplorationOpportunitySummary
    ]
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
        opportunity_models.ExplorationOpportunitySummaryModel
        .update_timestamps_multi(exploration_opportunity_summary_model_list)
    )
    opportunity_models.ExplorationOpportunitySummaryModel.put_multi(
        exploration_opportunity_summary_model_list)


def create_exp_opportunity_summary(
    topic: topic_domain.Topic,
    story: story_domain.Story,
    exploration: exp_domain.Exploration
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
            exploration))
    # TODO(#13912): Revisit voiceover language logic.
    language_codes_needing_voice_artists = set(
        complete_translation_language_list)
    incomplete_translation_language_codes = (
        _compute_exploration_incomplete_translation_languages(
            complete_translation_language_list))
    if exploration.language_code in incomplete_translation_language_codes:
        # Remove exploration language from incomplete translation languages list
        # as an exploration does not need a translation in its own language.
        incomplete_translation_language_codes.remove(exploration.language_code)
        # Add exploration language to voiceover required languages list as an
        # exploration can be voiceovered in its own language.
        language_codes_needing_voice_artists.add(exploration.language_code)

    content_count = exploration.get_content_count()
    translation_counts = translation_services.get_translation_counts(
        feconf.TranslatableEntityType.EXPLORATION, exploration
    )

    story_node = story.story_contents.get_node_with_corresponding_exp_id(
        exploration.id)

    # TODO(#7376): Once the voiceover application functionality is
    # implemented change this method such that it also populates the
    # language_codes_with_assigned_voice_artists with the required data.

    exploration_opportunity_summary = (
        opportunity_domain.ExplorationOpportunitySummary(
            exploration.id, topic.id, topic.name, story.id, story.title,
            story_node.title, content_count,
            incomplete_translation_language_codes,
            translation_counts, list(language_codes_needing_voice_artists), [],
            {}))

    return exploration_opportunity_summary


def _compute_exploration_incomplete_translation_languages(
    complete_translation_languages: List[str]
) -> List[str]:
    """Computes all languages that are not 100% translated in an exploration.

    Args:
        complete_translation_languages: list(str). List of complete translation
            language codes in the exploration.

    Returns:
        list(str). List of incomplete translation language codes sorted
        alphabetically.
    """
    audio_language_codes = set(
        language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES)
    incomplete_translation_language_codes = (
        audio_language_codes - set(complete_translation_languages))
    return sorted(list(incomplete_translation_language_codes))


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
    story: story_domain.Story,
    topic: topic_domain.Topic,
    exp_ids: List[str]
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
            create_exp_opportunity_summary(
                topic, story, exploration))
    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list
    )


def compute_opportunity_models_with_updated_exploration(
    exp_id: str,
    content_count: int,
    translation_counts: Dict[str, int]
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
        get_exploration_opportunity_summary_from_model(model))
    exploration_opportunity_summary.content_count = content_count
    exploration_opportunity_summary.translation_counts = translation_counts
    incomplete_translation_language_codes = (
        _compute_exploration_incomplete_translation_languages(
            complete_translation_language_list))
    if (
            updated_exploration.language_code
            in incomplete_translation_language_codes):
        # Remove exploration language from incomplete translation languages list
        # as an exploration does not need a translation in its own language.
        incomplete_translation_language_codes.remove(
            updated_exploration.language_code)
    exploration_opportunity_summary.incomplete_translation_language_codes = (
        incomplete_translation_language_codes)

    new_languages_for_voiceover = set(complete_translation_language_list) - set(
        exploration_opportunity_summary.
        language_codes_with_assigned_voice_artists)

    # We only append new languages to language_codes_needing_voice_artists(
    # instead of adding all of the complete_translation_language_list), as the
    # complete translation languages list will be dynamic based on some
    # content text are changed, where as the voiceover is a long term work and
    # we can allow a voice_artist to work for an exploration which needs a
    # little bit update in text translation.
    language_codes_needing_voice_artists_set = set(
        exploration_opportunity_summary.language_codes_needing_voice_artists)
    language_codes_needing_voice_artists_set |= set(new_languages_for_voiceover)

    exploration_opportunity_summary.language_codes_needing_voice_artists = list(
        language_codes_needing_voice_artists_set)

    exploration_opportunity_summary.validate()

    return _construct_new_opportunity_summary_models(
        [exploration_opportunity_summary])


def update_translation_opportunity_with_accepted_suggestion(
    exploration_id: str, language_code: str
) -> None:
    """Updates the translation opportunity for the accepted suggestion in the
    ExplorationOpportunitySummaryModel.

    Args:
        exploration_id: str. The ID of the exploration.
        language_code: str. The langauge code of the accepted translation
            suggestion.
    """
    model = opportunity_models.ExplorationOpportunitySummaryModel.get(
        exploration_id)
    exp_opportunity_summary = (
        get_exploration_opportunity_summary_from_model(model))

    if language_code in exp_opportunity_summary.translation_counts:
        exp_opportunity_summary.translation_counts[language_code] += 1
    else:
        exp_opportunity_summary.translation_counts[language_code] = 1

    if (
        exp_opportunity_summary.content_count ==
        exp_opportunity_summary.translation_counts[language_code]
    ):
        exp_opportunity_summary.incomplete_translation_language_codes.remove(
            language_code)
        exp_opportunity_summary.language_codes_needing_voice_artists.append(
            language_code
        )

    exp_opportunity_summary.validate()
    _save_multi_exploration_opportunity_summary([exp_opportunity_summary])


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
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(
            exp_ids))

    exploration_opportunity_summary_list = []

    for exp_opportunity_model in exp_opportunity_models_with_none:
        # Ruling out the possibility of None for mypy type checking.
        assert exp_opportunity_model is not None
        exploration_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_model))
        exploration_opportunity_summary.story_title = story.title
        node = story.story_contents.get_node_with_corresponding_exp_id(
            exploration_opportunity_summary.id)
        exploration_opportunity_summary.chapter_title = node.title
        exploration_opportunity_summary.validate()

        exploration_opportunity_summary_list.append(
            exploration_opportunity_summary)

    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list
    )


def delete_exploration_opportunities(exp_ids: List[str]) -> None:
    """Deletes the ExplorationOpportunitySummaryModel models corresponding to
    the given exp_ids.

    Args:
        exp_ids: list(str). A list of exploration IDs whose opportunity summary
            models are to be deleted.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(
            exp_ids))
    exp_opportunity_models_to_be_deleted = [
        model for model in exp_opportunity_models
        if model is not None]
    opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
        exp_opportunity_models_to_be_deleted)


def delete_exploration_opportunities_corresponding_to_topic(
    topic_id: str
) -> None:
    """Deletes the ExplorationOpportunitySummaryModel models which corresponds
    to the given topic_id.

    Args:
        topic_id: str. The ID of the topic.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_by_topic(
            topic_id))
    opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
        list(exp_opportunity_models))


def update_exploration_opportunities(
    old_story: story_domain.Story,
    new_story: story_domain.Story
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
                    exp_id))
            old_node = (
                old_story.story_contents.get_node_with_corresponding_exp_id(
                    exp_id))
            if old_node.title != new_node.title:
                model_ids_need_update.add(exp_id)

    update_exploration_opportunities_with_story_changes(
        new_story, list(model_ids_need_update))
    add_new_exploration_opportunities(new_story.id, list(new_added_exp_ids))
    delete_exploration_opportunities(list(deleted_exp_ids))


def delete_exp_opportunities_corresponding_to_story(story_id: str) -> None:
    """Deletes the ExplorationOpportunitySummaryModel models which corresponds
    to the given story_id.

    Args:
        story_id: str. The ID of the story.
    """
    exp_opprtunity_model_class = (
        opportunity_models.ExplorationOpportunitySummaryModel)
    exp_opportunity_models: Sequence[
        opportunity_models.ExplorationOpportunitySummaryModel
    ] = exp_opprtunity_model_class.get_all().filter(
        exp_opprtunity_model_class.story_id == story_id
    ).fetch()
    exp_opprtunity_model_class.delete_multi(list(exp_opportunity_models))


def get_translation_opportunities(
    language_code: str,
    topic_name: Optional[str],
    cursor: Optional[str]
) -> Tuple[
    List[opportunity_domain.ExplorationOpportunitySummary],
    Optional[str],
    bool
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
        opportunity_models
        .ExplorationOpportunitySummaryModel.get_all_translation_opportunities(
            page_size, cursor, language_code, topic_name))
    opportunity_summaries = []
    opportunity_summary_exp_ids = [
        opportunity.id for opportunity in exp_opportunity_summary_models]
    exp_id_to_in_review_count = {}
    if len(opportunity_summary_exp_ids) > 0:
        exp_id_to_in_review_count = (
            _build_exp_id_to_translation_suggestion_in_review_count(
                opportunity_summary_exp_ids, language_code))
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_summary_model))
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
        suggestion_services
        .get_translation_suggestions_in_review_by_exp_ids(
            exp_ids, language_code))
    for suggestion in suggestions_in_review:
        if suggestion is not None:
            exp_id_to_in_review_count[suggestion.target_id] += 1
    return exp_id_to_in_review_count


def get_exploration_opportunity_summaries_by_ids(
    ids: List[str]
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
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(ids))
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        if exp_opportunity_summary_model is not None:
            opportunities[exp_opportunity_summary_model.id] = (
                get_exploration_opportunity_summary_from_model(
                    exp_opportunity_summary_model))
    return opportunities


def get_exploration_opportunity_summary_by_id(
    opportunity_id: str
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
            opportunity_id, strict=False))
    if exp_opportunity_summary_model is None:
        return None
    return get_exploration_opportunity_summary_from_model(
        exp_opportunity_summary_model)


def get_exploration_opportunity_summaries_by_topic_id(
    topic_id: str
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
        opportunity_models.
            ExplorationOpportunitySummaryModel.get_by_topic(topic_id)
    )
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_summary_model))
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
            topic_id))

    exploration_opportunity_summary_list = []
    for exp_opportunity_model in exp_opportunity_models:
        exploration_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_model))
        exploration_opportunity_summary.topic_name = topic_name
        exploration_opportunity_summary.validate()

        exploration_opportunity_summary_list.append(
            exploration_opportunity_summary)

    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list
    )


def get_skill_opportunity_from_model(
    model: opportunity_models.SkillOpportunityModel
) -> opportunity_domain.SkillOpportunity:
    """Returns a SkillOpportunity domain object from a SkillOpportunityModel.

    Args:
        model: SkillOpportunityModel. The skill opportunity model.

    Returns:
        SkillOpportunity. The corresponding SkillOpportunity object.
    """
    return opportunity_domain.SkillOpportunity(
        model.id, model.skill_description, model.question_count)


def get_skill_opportunities(
    cursor: Optional[str]
) -> Tuple[
    List[opportunity_domain.SkillOpportunity], Optional[str], bool
]:
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
        opportunity_models.SkillOpportunityModel
        .get_skill_opportunities(constants.OPPORTUNITIES_PAGE_SIZE, cursor))
    opportunities = []
    for skill_opportunity_model in skill_opportunity_models:
        skill_opportunity = (
            get_skill_opportunity_from_model(skill_opportunity_model))
        opportunities.append(skill_opportunity)
    return opportunities, cursor, more


def get_skill_opportunities_by_ids(
    ids: List[str]
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
    opportunities: Dict[
        str, Optional[opportunity_domain.SkillOpportunity]
    ] = {opportunity_id: None for opportunity_id in ids}
    skill_opportunity_models = (
        opportunity_models.SkillOpportunityModel.get_multi(ids))

    for skill_opportunity_model in skill_opportunity_models:
        if skill_opportunity_model is not None:
            opportunities[skill_opportunity_model.id] = (
                get_skill_opportunity_from_model(skill_opportunity_model))
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
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id))
    if skill_opportunity_model is not None:
        raise Exception(
            'SkillOpportunity corresponding to skill ID %s already exists.' % (
                skill_id))

    questions, _ = (
        question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
            constants.MAX_QUESTIONS_PER_SKILL, [skill_id], 0))
    skill_opportunity = opportunity_domain.SkillOpportunity(
        skill_id=skill_id,
        skill_description=skill_description,
        question_count=len(questions)
    )
    _save_skill_opportunities([skill_opportunity])


def _save_skill_opportunities(
    skill_opportunities: List[opportunity_domain.SkillOpportunity]
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
        skill_opportunity_models)
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
    skill_id: str
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
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id))
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
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id))
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
        _get_skill_opportunities_with_updated_question_counts(skill_ids, delta))
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
            list(new_skill_ids_added_to_question), 1))
    updated_skill_opportunities.extend(
        _get_skill_opportunities_with_updated_question_counts(
            list(skill_ids_removed_from_question), -1))
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
        opportunity_models.SkillOpportunityModel.get_multi(skill_ids))
    for skill_opportunity_model in skill_opportunity_models:
        if skill_opportunity_model is not None:
            skill_opportunity = get_skill_opportunity_from_model(
                skill_opportunity_model)
            # The question count should never be negative. We default to 0
            # if some operation tries to reduce question count down to a
            # negative value.
            skill_opportunity.question_count = max(
                skill_opportunity.question_count + delta, 0)
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
                topic_id))
        opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
            list(exp_opportunity_models))

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
        exp_ids, strict=False)
    non_existing_exp_ids = set(exp_ids) - set(exp_ids_to_exp.keys())

    if len(non_existing_exp_ids) > 0 or len(non_existing_story_ids) > 0:
        raise Exception(
            'Failed to regenerate opportunities for topic id: %s, '
            'missing_exp_with_ids: %s, missing_story_with_ids: %s' % (
                topic_id, list(non_existing_exp_ids), non_existing_story_ids))

    exploration_opportunity_summary_list = []
    for story in stories:
        # Ruling out the possibility of None for mypy type checking, because
        # above we are already validating that story is not None.
        assert story is not None
        for exp_id in story.story_contents.get_all_linked_exp_ids():
            exploration_opportunity_summary_list.append(
                create_exp_opportunity_summary(
                    topic, story, exp_ids_to_exp[exp_id]))

    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list)
    return len(exploration_opportunity_summary_list)


def update_pinned_opportunity_model(
    user_id: str,
    language_code: str,
    topic_id: str,
    lesson_id: Optional[str]
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
    """

    pinned_opportunity = user_models.PinnedOpportunityModel.get_model(
        user_id,
        language_code,
        topic_id)

    if not pinned_opportunity and not lesson_id:
        # If there's no model and no lesson_id provided, no action needed.
        return

    if not pinned_opportunity and lesson_id:
        # If no model exists, create a new one with the provided parameters.
        user_models.PinnedOpportunityModel.create(
            user_id=user_id,
            language_code=language_code,
            topic_id=topic_id,
            opportunity_id=lesson_id
        )
    else:
        if pinned_opportunity:
            # Update the model's opportunity_id with the given lesson_id.
            pinned_opportunity.opportunity_id = lesson_id
            pinned_opportunity.update_timestamps()
            pinned_opportunity.put()


def get_pinned_lesson(
    user_id: str,
    language_code: str,
    topic_id: str
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
        user_id,
        language_code,
        topic_id
    )
    if pinned_opportunity and pinned_opportunity.opportunity_id is not None:
        # If the model exists and has a valid opportunity_id, return it.
        model = opportunity_models.ExplorationOpportunitySummaryModel.get(
            pinned_opportunity.opportunity_id)
        exploration_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(model))
        exploration_opportunity_summary.is_pinned = True

        return exploration_opportunity_summary

    # If the model doesn't exist or has None as opportunity_id, return None.
    return None
