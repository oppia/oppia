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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from constants import constants
from core.domain import exp_fetchers
from core.domain import opportunity_domain
from core.domain import question_fetchers
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.platform import models
import feconf

(opportunity_models,) = models.Registry.import_models(
    [models.NAMES.opportunity])


def is_exploration_available_for_contribution(exp_id):
    """Checks whether a given exploration id belongs to a curated list of
    exploration i.e, whether it's used as the chapter of any story.

    Args:
        exp_id: str. The id of the exploration which is needed to be checked.

    Returns:
        bool. Whether the given exp_id belongs to the curated explorations.
    """
    model = opportunity_models.ExplorationOpportunitySummaryModel.get(
        exp_id, strict=False)

    return True if model is not None else False


def get_exploration_opportunity_summary_from_model(model):
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
        model.need_voice_artist_in_language_codes +
        model.assigned_voice_artist_in_language_codes)
    supported_language_codes = set([language['id'] for language in (
        constants.SUPPORTED_AUDIO_LANGUAGES)])
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
        model.need_voice_artist_in_language_codes,
        model.assigned_voice_artist_in_language_codes)


def _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list):
    """Stores multiple ExplorationOpportunitySummary into datastore as a
    ExplorationOpportunitySummaryModel.

    Args:
        exploration_opportunity_summary_list: list(
            ExplorationOpportunitySummary). A list of exploration opportunity
            summary object.
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
            need_voice_artist_in_language_codes=(
                opportunity_summary.need_voice_artist_in_language_codes),
            assigned_voice_artist_in_language_codes=(
                opportunity_summary.assigned_voice_artist_in_language_codes)
        )

        exploration_opportunity_summary_model_list.append(model)

    opportunity_models.ExplorationOpportunitySummaryModel.put_multi(
        exploration_opportunity_summary_model_list)


def _create_exploration_opportunity_summary(topic, story, exploration):
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

    audio_language_codes = set([
        language['id'] for language in constants.SUPPORTED_AUDIO_LANGUAGES])

    complete_translation_languages = set(
        exploration.get_languages_with_complete_translation())

    incomplete_translation_language_codes = (
        audio_language_codes - complete_translation_languages)
    need_voice_artist_in_language_codes = complete_translation_languages

    if exploration.language_code in incomplete_translation_language_codes:
        # Removing exploration language from incomplete translation
        # languages list as exploration does not need any translation in
        # its own language.
        incomplete_translation_language_codes.discard(
            exploration.language_code)
        # Adding exploration language to voiceover required languages
        # list as exploration can be voiceovered in it's own language.
        need_voice_artist_in_language_codes.add(exploration.language_code)

    content_count = exploration.get_content_count()
    translation_counts = exploration.get_translation_counts()

    story_node = story.story_contents.get_node_with_corresponding_exp_id(
        exploration.id)

    # TODO(#7376): Once the voiceover application functionality is
    # implemented change this method such that it also populates the
    # assigned_voice_artist_in_language_codes with the required data.

    exploration_opportunity_summary = (
        opportunity_domain.ExplorationOpportunitySummary(
            exploration.id, topic.id, topic.name, story.id, story.title,
            story_node.title, content_count,
            list(incomplete_translation_language_codes), translation_counts,
            list(need_voice_artist_in_language_codes), []))

    return exploration_opportunity_summary


def add_new_exploration_opportunities(story_id, exp_ids):
    """Adds new exploration opportunity into the model.

    Args:
        story_id: str. ID of the story.
        exp_ids: list(str). A list of exploration ids for which new
            opportunities are to be created. All exp_ids must be part of the
            given story.
    """
    story = story_fetchers.get_story_by_id(story_id)
    topic = topic_fetchers.get_topic_by_id(story.corresponding_topic_id)
    explorations = exp_fetchers.get_multiple_explorations_by_id(exp_ids)

    exploration_opportunity_summary_list = []
    for exploration in explorations.values():
        exploration_opportunity_summary_list.append(
            _create_exploration_opportunity_summary(
                topic, story, exploration))
    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list)


def update_opportunity_with_updated_exploration(exp_id):
    """Updates the opportunities models with the changes made in the
    exploration.

    Args:
        exp_id: str. The exploration id which is also the id of the opportunity
            model.
    """
    updated_exploration = exp_fetchers.get_exploration_by_id(exp_id)
    content_count = updated_exploration.get_content_count()
    translation_counts = updated_exploration.get_translation_counts()
    complete_translation_language_list = (
        updated_exploration.get_languages_with_complete_translation())
    model = opportunity_models.ExplorationOpportunitySummaryModel.get(exp_id)
    exploration_opportunity_summary = (
        get_exploration_opportunity_summary_from_model(model))
    exploration_opportunity_summary.content_count = content_count
    exploration_opportunity_summary.translation_counts = translation_counts
    exploration_opportunity_summary.complete_translation_languages = (
        complete_translation_language_list)

    new_languages_for_voiceover = set(complete_translation_language_list) - set(
        exploration_opportunity_summary.assigned_voice_artist_in_language_codes)

    # We only append new languages to need_voice_artist_in_language_codes(
    # instead of adding all of the complete_translation_language_list), as the
    # complete translation languages list will be dynamic based on some
    # content text are changed, where as the voiceover is a long term work and
    # we can allow a voice_artist to work for an exploration which needs a
    # little bit update in text translation.
    need_voice_artist_in_language_codes_set = set(
        exploration_opportunity_summary.need_voice_artist_in_language_codes)
    need_voice_artist_in_language_codes_set |= set(new_languages_for_voiceover)

    exploration_opportunity_summary.need_voice_artist_in_language_codes = list(
        need_voice_artist_in_language_codes_set)

    exploration_opportunity_summary.validate()

    _save_multi_exploration_opportunity_summary(
        [exploration_opportunity_summary])


def update_exploration_opportunities_with_story_changes(story, exp_ids):
    """Updates the opportunities models with the story changes.

    Args:
        story: Story. The new story object.
        exp_ids: list(str). A list of exploration IDs whose exploration
            opportunity summary models need to be updated.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(
            exp_ids))

    exploration_opportunity_summary_list = []

    for exp_opportunity_model in exp_opportunity_models:
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
        exploration_opportunity_summary_list)


def update_exploration_voiceover_opportunities(
        exp_id, assigned_voice_artist_in_language_code):
    """Updates the assigned_voice_artist_in_language_codes of exploration
    opportunity model.

    Args:
        exp_id: str. The ID of the exploration.
        assigned_voice_artist_in_language_code: str. The language code in which
            a voice artist is assigned to the exploration.
    """
    model = opportunity_models.ExplorationOpportunitySummaryModel.get(exp_id)
    exploration_opportunity_summary = (
        get_exploration_opportunity_summary_from_model(model))

    exploration_opportunity_summary.need_voice_artist_in_language_codes.remove(
        assigned_voice_artist_in_language_code)
    (
        exploration_opportunity_summary
        .assigned_voice_artist_in_language_codes.append(
            assigned_voice_artist_in_language_code))
    exploration_opportunity_summary.validate()
    _save_multi_exploration_opportunity_summary(
        [exploration_opportunity_summary])


def delete_exploration_opportunities(exp_ids):
    """Deletes the ExplorationOpportunitySummaryModel models corresponding to
    the given exp_ids.

    Args:
        exp_ids: list(str). A list of exploration IDs whose opportunity summary
            models are to be deleted.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(
            exp_ids))
    opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
        exp_opportunity_models)


def delete_exploration_opportunities_corresponding_to_topic(topic_id):
    """Deletes the ExplorationOpportunitySummaryModel models which corresponds
    to the given topic_id.

    Args:
        topic_id: str. The ID of the topic.
    """
    exp_opportunity_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_by_topic(
            topic_id))
    opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
        exp_opportunity_models)


def update_exploration_opportunities(old_story, new_story):
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
    add_new_exploration_opportunities(new_story.id, new_added_exp_ids)
    delete_exploration_opportunities(list(deleted_exp_ids))


def get_translation_opportunities(language_code, cursor):
    """Returns a list of opportunities available for translation in a specific
    language.

    Args:
        cursor: str or None. If provided, the list of returned entities
            starts from this datastore cursor. Otherwise, the returned
            entities start from the beginning of the full list of entities.
        language_code: str. The language for which translation opportunities
            should be fetched.

    Returns:
        3-tuple(opportunities, cursor, more). where:
            opportunities: list(ExplorationOpportunitySummary). A list of
                ExplorationOpportunitySummary domain objects.
            cursor: str or None. A query cursor pointing to the next batch of
                results. If there are no more results, this might be None.
            more: bool. If True, there are (probably) more results after this
                batch. If False, there are no further results after this batch.
    """
    page_size = feconf.OPPORTUNITIES_PAGE_SIZE
    exp_opportunity_summary_models, cursor, more = (
        opportunity_models
        .ExplorationOpportunitySummaryModel.get_all_translation_opportunities(
            page_size, cursor, language_code))
    opportunities = []
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        exp_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_summary_model))
        opportunities.append(exp_opportunity_summary)
    return opportunities, cursor, more


def get_voiceover_opportunities(language_code, cursor):
    """Returns a list of opportunities available for voiceover in a specific
    language.

    Args:
        cursor: str or None. If provided, the list of returned entities
            starts from this datastore cursor. Otherwise, the returned
            entities start from the beginning of the full list of entities.
        language_code: str. The language for which voiceover opportunities
            to be fetched.

    Returns:
        3-tuple(opportunities, cursor, more). where:
            opportunities: list(ExplorationOpportunitySummary). A list of
                ExplorationOpportunitySummary domain objects.
            cursor: str or None. A query cursor pointing to the next
                batch of results. If there are no more results, this might
                be None.
            more: bool. If True, there are (probably) more results after
                this batch. If False, there are no further results after
                this batch.
    """
    page_size = feconf.OPPORTUNITIES_PAGE_SIZE
    exp_opportunity_summary_models, cursor, more = (
        opportunity_models.ExplorationOpportunitySummaryModel
        .get_all_voiceover_opportunities(page_size, cursor, language_code))
    opportunities = []
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        exp_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_summary_model))
        opportunities.append(exp_opportunity_summary)
    return opportunities, cursor, more


def get_exploration_opportunity_summaries_by_ids(ids):
    """Returns a list of ExplorationOpportunitySummary objects corresponding to
    the given list of ids.

    Args:
        ids: list(str). A list of opportunity ids.

    Returns:
        list(ExplorationOpportunitySummary). A list of
            ExplorationOpportunitySummary domain objects corresponding to the
            supplied ids.
    """
    exp_opportunity_summary_models = (
        opportunity_models.ExplorationOpportunitySummaryModel.get_multi(ids))
    opportunities = []
    for exp_opportunity_summary_model in exp_opportunity_summary_models:
        exp_opportunity_summary = (
            get_exploration_opportunity_summary_from_model(
                exp_opportunity_summary_model))
        opportunities.append(exp_opportunity_summary)
    return opportunities


def update_opportunities_with_new_topic_name(topic_id, topic_name):
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
        exploration_opportunity_summary_list)


def get_skill_opportunity_from_model(model):
    """Returns a SkillOpportunity domain object from a SkillOpportunityModel.

    Args:
        model: SkillOpportunityModel. The skill opportunity model.

    Returns:
        SkillOpportunity. The corresponding SkillOpportunity object.
    """
    return opportunity_domain.SkillOpportunity(
        model.id, model.skill_description, model.question_count)


def get_skill_opportunities(cursor):
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
    page_size = feconf.OPPORTUNITIES_PAGE_SIZE
    skill_opportunity_models, cursor, more = (
        opportunity_models.SkillOpportunityModel
        .get_skill_opportunities(page_size, cursor))
    opportunities = []
    for skill_opportunity_model in skill_opportunity_models:
        skill_opportunity = (
            get_skill_opportunity_from_model(skill_opportunity_model))
        opportunities.append(skill_opportunity)
    return opportunities, cursor, more


def get_skill_opportunities_by_ids(ids):
    """Returns a list of SkillOpportunity domain objects corresponding to the
    given list of ids.

    Args:
        ids: list(str). A list of the opportunity ids.

    Returns:
        list(SkillOpportunity). A list of SkillOpportunity domain objects
            corresponding to the supplied ids.
    """
    skill_opportunity_models = (
        opportunity_models.SkillOpportunityModel.get_multi(ids))
    opportunities = []
    for skill_opportunity_model in skill_opportunity_models:
        skill_opportunity = (
            get_skill_opportunity_from_model(skill_opportunity_model))
        opportunities.append(skill_opportunity)
    return opportunities


def create_skill_opportunity(skill_id, skill_description):
    """Creates a SkillOpportunityModel entity in the datastore.

    Args:
        skill_id: str. The skill_id of the opportunity.
        skill_description: str. The skill_description of the opportunity.

    Raises:
        Exception: If a SkillOpportunityModel corresponding to the supplied
            skill_id already exists.
    """
    skill_opportunity_model = (
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id))
    if skill_opportunity_model is not None:
        raise Exception(
            'SkillOpportunity corresponding to skill ID %s already exists.' % (
                skill_id))

    questions, _, _ = (
        question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
            constants.MAX_QUESTIONS_PER_SKILL, [skill_id], ''))
    skill_opportunity = opportunity_domain.SkillOpportunity(
        skill_id=skill_id,
        skill_description=skill_description,
        question_count=len(questions)
    )
    _save_skill_opportunities([skill_opportunity])


def _save_skill_opportunities(skill_opportunities):
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
    opportunity_models.SkillOpportunityModel.put_multi(skill_opportunity_models)


def update_skill_opportunity_skill_description(skill_id, new_description):
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


def _get_skill_opportunity(skill_id):
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


def delete_skill_opportunity(skill_id):
    """Deletes the SkillOpportunityModel corresponding to the supplied skill_id.

    Args:
        skill_id: str. The skill_id corresponding to the to-be-deleted
            SkillOpportunityModel.
    """
    skill_opportunity_model = (
        opportunity_models.SkillOpportunityModel.get_by_id(skill_id))
    if skill_opportunity_model is not None:
        opportunity_models.SkillOpportunityModel.delete(skill_opportunity_model)


def increment_question_counts(skill_ids, delta):
    """Increments question_count(s) of SkillOpportunityModel(s) with
    corresponding skill_ids.

    Args:
        skill_ids: list(str). A list of skill_ids corresponding to
            SkillOpportunityModel(s).
        delta: int. The delta for which to increment each question_count.
    """
    updated_skill_opportunities = (
        _get_skill_opportunity_with_updated_question_count(skill_ids, delta))
    _save_skill_opportunities(updated_skill_opportunities)


def update_skill_opportunities_on_question_linked_skills_change(
        old_skill_ids, new_skill_ids):
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
        _get_skill_opportunity_with_updated_question_count(
            new_skill_ids_added_to_question, 1))
    updated_skill_opportunities.extend(
        _get_skill_opportunity_with_updated_question_count(
            skill_ids_removed_from_question, -1))
    _save_skill_opportunities(updated_skill_opportunities)


def _get_skill_opportunity_with_updated_question_count(skill_ids, delta):
    """Returns a list of SkillOpportunities with corresponding skill_ids
    with question_count(s) updated by delta.

    Args:
        skill_ids: iterable(str). The IDs of the matching SkillOpportunityModels
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
            skill_opportunity.question_count += delta
            updated_skill_opportunities.append(skill_opportunity)
    return updated_skill_opportunities


def regenerate_opportunities_related_to_topic(
        topic_id, delete_existing_opportunities=False):
    """Regenerates opportunity models which belongs to a given topic.

    Args:
        topic_id: str. The ID of the topic.
        delete_existing_opportunities: bool. Whether to delete all the existing
            opportunities related to the given topic.

    Returns:
        int. The number of opportunity models created.
    """
    if delete_existing_opportunities:
        exp_opportunity_models = (
            opportunity_models.ExplorationOpportunitySummaryModel.get_by_topic(
                topic_id))
        opportunity_models.ExplorationOpportunitySummaryModel.delete_multi(
            exp_opportunity_models)

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
        for exp_id in story.story_contents.get_all_linked_exp_ids():
            exploration_opportunity_summary_list.append(
                _create_exploration_opportunity_summary(
                    topic, story, exp_ids_to_exp[exp_id]))

    _save_multi_exploration_opportunity_summary(
        exploration_opportunity_summary_list)
    return len(exploration_opportunity_summary_list)


def delete_all_exploration_opportunity_summary_models():
    """Deletes all of the ExplorationOpportunitySummaryModel."""
    opportunity_models.ExplorationOpportunitySummaryModel.delete_all()


def delete_all_skill_opportunity_models():
    """Deletes all of the SkillOpportunityModels from the datastore."""
    opportunity_models.SkillOpportunityModel.delete_all()
