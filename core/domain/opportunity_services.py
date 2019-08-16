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

from constants import constants
from core.domain import exp_fetchers
from core.domain import opportunity_domain
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

    return opportunity_domain.ExplorationOpportunitySummary(
        model.id, model.topic_id, model.topic_name, model.story_id,
        model.story_title, model.chapter_title, model.content_count,
        model.incomplete_translation_language_codes, model.translation_counts,
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
    for exp_id, exploration in explorations.iteritems():
        node = story.story_contents.get_node_with_corresponding_exp_id(exp_id)

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

        # TODO(#7376): Once the voiceover application functionality is
        # implemented change this method such that it also populates the
        # assigned_voice_artist_in_language_codes with the required data.

        exploration_opportunity_summary = (
            opportunity_domain.ExplorationOpportunitySummary(
                exp_id, topic.id, topic.name, story.id, story.title, node.title,
                content_count, list(incomplete_translation_language_codes),
                translation_counts, list(need_voice_artist_in_language_codes),
                []))

        exploration_opportunity_summary_list.append(
            exploration_opportunity_summary)

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
            opportunities: list(dict). A list of dict of opportunity details.
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
        opportunities.append(exp_opportunity_summary.to_dict())
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
            opportunities: list(dict). A list of dict of opportunity details.
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
        opportunities.append(exp_opportunity_summary.to_dict())
    return opportunities, cursor, more


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
