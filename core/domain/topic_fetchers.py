# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
# limitations under the License.]

"""Getter commands for for topic models."""

from __future__ import annotations

import copy

from core import feconf
from core import utils
from core.domain import caching_services
from core.domain import classroom_services
from core.domain import story_fetchers
from core.domain import topic_domain
from core.platform import models

(skill_models, topic_models,) = models.Registry.import_models([
    models.Names.SKILL, models.Names.TOPIC])


def _migrate_subtopics_to_latest_schema(versioned_subtopics, topic_id):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the subtopics structure based on the schema version of the input
    subtopics dictionary. If the current subtopics schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_subtopics: dict. A dict with two keys:
          - schema_version: int. The schema version for the subtopics dict.
          - subtopics: list(dict). The list of dicts comprising the topic's
              subtopics.
        topic_id: str. The id of the topic to which the subtopics are part of.

    Raises:
        Exception. The schema version of subtopics is outside of what
            is supported at present.
    """
    subtopic_schema_version = versioned_subtopics['schema_version']
    if not (1 <= subtopic_schema_version
            <= feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d subtopic schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION)

    while (subtopic_schema_version <
           feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
        topic_domain.Topic.update_subtopics_from_model(
            versioned_subtopics, subtopic_schema_version, topic_id)
        subtopic_schema_version += 1


def _migrate_story_references_to_latest_schema(versioned_story_references):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the story reference structure based on the schema version of the input
    story reference dictionary. If the current story reference schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_story_references: dict. A dict with two keys:
          - schema_version: int. The schema version for the story reference
                dict.
          - story_references: list(dict). The list of dicts comprising the
                topic's story references.

    Raises:
        Exception. The schema version of story_references is outside of what
            is supported at present.
    """
    story_reference_schema_version = (
        versioned_story_references['schema_version'])
    if not (1 <= story_reference_schema_version
            <= feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d story reference schemas at '
            'present.' % feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION)

    while (story_reference_schema_version <
           feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION):
        topic_domain.Topic.update_story_references_from_model(
            versioned_story_references, story_reference_schema_version)
        story_reference_schema_version += 1


def get_topic_from_model(topic_model):
    """Returns a topic domain object given a topic model loaded
    from the datastore.

    Args:
        topic_model: TopicModel. The topic model loaded from the
            datastore.

    Returns:
        topic. A Topic domain object corresponding to the given
        topic model.
    """
    versioned_subtopics = {
        'schema_version': topic_model.subtopic_schema_version,
        'subtopics': copy.deepcopy(topic_model.subtopics)
    }
    versioned_canonical_story_references = {
        'schema_version': topic_model.story_reference_schema_version,
        'story_references': topic_model.canonical_story_references
    }
    versioned_additional_story_references = {
        'schema_version': topic_model.story_reference_schema_version,
        'story_references': topic_model.additional_story_references
    }
    if (topic_model.subtopic_schema_version !=
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
        _migrate_subtopics_to_latest_schema(
            versioned_subtopics, topic_model.id)
    if (topic_model.story_reference_schema_version !=
            feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION):
        _migrate_story_references_to_latest_schema(
            versioned_canonical_story_references)
        _migrate_story_references_to_latest_schema(
            versioned_additional_story_references)
    return topic_domain.Topic(
        topic_model.id, topic_model.name,
        topic_model.abbreviated_name,
        topic_model.url_fragment,
        topic_model.thumbnail_filename,
        topic_model.thumbnail_bg_color,
        topic_model.thumbnail_size_in_bytes,
        topic_model.description, [
            topic_domain.StoryReference.from_dict(reference)
            for reference in versioned_canonical_story_references[
                'story_references']
        ], [
            topic_domain.StoryReference.from_dict(reference)
            for reference in versioned_additional_story_references[
                'story_references']
        ], topic_model.uncategorized_skill_ids,
        [
            topic_domain.Subtopic.from_dict(subtopic)
            for subtopic in versioned_subtopics['subtopics']
        ],
        versioned_subtopics['schema_version'],
        topic_model.next_subtopic_id,
        topic_model.language_code,
        topic_model.version, feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
        topic_model.meta_tag_content, topic_model.practice_tab_is_displayed,
        topic_model.page_title_fragment_for_web, topic_model.created_on,
        topic_model.last_updated)


def get_topic_by_id(topic_id, strict=True, version=None):
    """Returns a domain object representing a topic.

    Args:
        topic_id: str. ID of the topic.
        strict: bool. Whether to fail noisily if no topic with the given
            id exists in the datastore.
        version: int or None. The version number of the topic to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Topic or None. The domain object representing a topic with the
        given id, or None if it does not exist.
    """
    sub_namespace = str(version) if version else None
    cached_topic = caching_services.get_multi(
        caching_services.CACHE_NAMESPACE_TOPIC,
        sub_namespace,
        [topic_id]).get(topic_id)

    if cached_topic is not None:
        return cached_topic
    else:
        topic_model = topic_models.TopicModel.get(
            topic_id, strict=strict, version=version)
        if topic_model:
            topic = get_topic_from_model(topic_model)
            caching_services.set_multi(
                caching_services.CACHE_NAMESPACE_TOPIC,
                sub_namespace,
                {topic_id: topic})
            return topic
        else:
            return None


def get_topics_by_ids(topic_ids):
    """Returns a list of topics matching the IDs provided.

    Args:
        topic_ids: list(str). List of IDs to get topics for.

    Returns:
        list(Topic|None). The list of topics corresponding to given ids
        (with None in place of topic ids corresponding to deleted topics).
    """
    all_topic_models = topic_models.TopicModel.get_multi(topic_ids)
    topics = [
        get_topic_from_model(topic_model) if topic_model is not None else None
        for topic_model in all_topic_models]
    return topics


def get_topic_by_name(topic_name):
    """Returns a domain object representing a topic.

    Args:
        topic_name: str. The name of the topic.

    Returns:
        Topic or None. The domain object representing a topic with the
        given id, or None if it does not exist.
    """
    topic_model = topic_models.TopicModel.get_by_name(topic_name)
    if topic_model is None:
        return None

    topic = get_topic_from_model(topic_model)
    return topic


def get_topic_by_url_fragment(url_fragment):
    """Returns a domain object representing a topic.

    Args:
        url_fragment: str. The url fragment of the topic.

    Returns:
        Topic or None. The domain object representing a topic with the
        given id, or None if it does not exist.
    """
    topic_model = (
        topic_models.TopicModel.get_by_url_fragment(url_fragment))
    if topic_model is None:
        return None

    topic = get_topic_from_model(topic_model)
    return topic


def get_all_topics():
    """Returns all the topics present in the datastore.

    Returns:
        list(Topic). The list of topics present in the datastore.
    """
    backend_topic_models = topic_models.TopicModel.get_all()
    topics = [
        get_topic_from_model(topic) for topic in backend_topic_models]
    return topics


def get_topic_rights(topic_id, strict=True):
    """Retrieves the rights object for the given topic.

    Args:
        topic_id: str. ID of the topic.
        strict: bool. Whether to fail noisily if no topic with a given id
            exists in the datastore.

    Returns:
        TopicRights. The rights object associated with the given topic.

    Raises:
        EntityNotFoundError. The topic with ID topic_id was not
            found in the datastore.
    """

    model = topic_models.TopicRightsModel.get(topic_id, strict=strict)

    if model is None:
        return None

    return get_topic_rights_from_model(model)


def get_topic_rights_from_model(topic_rights_model):
    """Constructs a TopicRights object from the given topic rights model.

    Args:
        topic_rights_model: TopicRightsModel. Topic rights from the
            datastore.

    Returns:
        TopicRights. The rights object created from the model.
    """

    return topic_domain.TopicRights(
        topic_rights_model.id,
        topic_rights_model.manager_ids,
        topic_rights_model.topic_is_published
    )


def get_all_topic_summaries():
    """Returns the summaries of all topics present in the datastore.

    Returns:
        list(TopicSummary). The list of summaries of all topics present in the
        datastore.
    """
    topic_summaries_models = topic_models.TopicSummaryModel.get_all()
    topic_summaries = [
        get_topic_summary_from_model(summary)
        for summary in topic_summaries_models]
    return topic_summaries


def get_multi_topic_summaries(topic_ids):
    """Returns the summaries of all topics whose topic ids are passed in.

    Args:
        topic_ids: list(str). The IDs of topics for which summaries are to be
            returned.

    Returns:
        list(TopicSummary). The list of summaries of all given topics present in
        the datastore.
    """
    topic_summaries_models = topic_models.TopicSummaryModel.get_multi(topic_ids)
    topic_summaries = [
        get_topic_summary_from_model(summary) if summary else None
        for summary in topic_summaries_models]
    return topic_summaries


def get_all_skill_ids_assigned_to_some_topic():
    """Returns the ids of all the skills that are linked to some topics.

    Returns:
        set([str]). The ids of all the skills linked to some topic.
    """
    skill_ids = set([])
    all_topic_models = topic_models.TopicModel.get_all()
    all_topics = [get_topic_from_model(topic) for topic in all_topic_models]
    for topic in all_topics:
        skill_ids.update(topic.get_all_skill_ids())
    return skill_ids


def get_topic_summary_from_model(topic_summary_model):
    """Returns a domain object for an Oppia topic summary given a
    topic summary model.

    Args:
        topic_summary_model: TopicSummaryModel. The topic summary model object
            to get the corresponding domain object.

    Returns:
        TopicSummary. The domain object corresponding to the given model object.
    """
    return topic_domain.TopicSummary(
        topic_summary_model.id, topic_summary_model.name,
        topic_summary_model.canonical_name,
        topic_summary_model.language_code,
        topic_summary_model.description,
        topic_summary_model.version,
        topic_summary_model.canonical_story_count,
        topic_summary_model.additional_story_count,
        topic_summary_model.uncategorized_skill_count,
        topic_summary_model.subtopic_count,
        topic_summary_model.total_skill_count,
        topic_summary_model.total_published_node_count,
        topic_summary_model.thumbnail_filename,
        topic_summary_model.thumbnail_bg_color,
        topic_summary_model.url_fragment,
        topic_summary_model.topic_model_created_on,
        topic_summary_model.topic_model_last_updated
    )


def get_topic_summary_by_id(topic_id, strict=True):
    """Returns a domain object representing a topic summary.

    Args:
        topic_id: str. ID of the topic summary.
        strict: bool. Whether to fail noisily if no topic summary with the given
            id exists in the datastore.

    Returns:
        TopicSummary or None. The topic summary domain object corresponding to
        a topic with the given topic_id, if it exists, or else None.
    """
    topic_summary_model = topic_models.TopicSummaryModel.get(
        topic_id, strict=strict)
    if topic_summary_model:
        topic_summary = get_topic_summary_from_model(topic_summary_model)
        return topic_summary
    else:
        return None


def get_new_topic_id():
    """Returns a new topic id.

    Returns:
        str. A new topic id.
    """
    return topic_models.TopicModel.get_new_id('')


def get_multi_topic_rights(topic_ids):
    """Returns the rights of all topics whose topic ids are passed in.

    Args:
        topic_ids: list(str). The IDs of topics for which rights are to be
            returned.

    Returns:
        list(TopicRights). The list of rights of all given topics present in
        the datastore.
    """
    topic_rights_models = topic_models.TopicRightsModel.get_multi(topic_ids)
    topic_rights = [
        get_topic_rights_from_model(rights) if rights else None
        for rights in topic_rights_models]
    return topic_rights


def get_topic_rights_with_user(user_id):
    """Retrieves the rights object for all topics assigned to given user.

    Args:
        user_id: str. ID of the user.

    Returns:
        list(TopicRights). The rights objects associated with the topics
        assigned to given user.
    """
    topic_rights_models = topic_models.TopicRightsModel.get_by_user(user_id)
    return [
        get_topic_rights_from_model(model)
        for model in topic_rights_models
        if model is not None]


def get_all_topic_rights():
    """Returns the rights object of all topics present in the datastore.

    Returns:
        dict. The dict of rights objects of all topics present in the datastore
        keyed by topic id.
    """
    topic_rights_models = topic_models.TopicRightsModel.get_all()
    topic_rights = {}
    for model in topic_rights_models:
        rights = get_topic_rights_from_model(model)
        topic_rights[rights.id] = rights
    return topic_rights


def get_canonical_story_dicts(user_id, topic):
    """Returns a list of canonical story dicts in the topic.

    Args:
        user_id: str. The ID of the user.
        topic: Topic. The topic domain object.

    Returns:
        list(dict). A list of canonical story dicts in the given topic.
    """
    canonical_story_ids = topic.get_canonical_story_ids(
        include_only_published=True)
    canonical_story_summaries = [
        story_fetchers.get_story_summary_by_id(
            canonical_story_id) for canonical_story_id
        in canonical_story_ids]
    canonical_story_dicts = []
    for story_summary in canonical_story_summaries:
        pending_and_all_nodes_in_story = (
            story_fetchers.get_pending_and_all_nodes_in_story(
                user_id, story_summary.id))
        all_nodes = pending_and_all_nodes_in_story['all_nodes']
        pending_nodes = pending_and_all_nodes_in_story['pending_nodes']
        pending_node_titles = [node.title for node in pending_nodes]
        completed_node_titles = utils.compute_list_difference(
            story_summary.node_titles, pending_node_titles)
        story_summary_dict = story_summary.to_human_readable_dict()
        story_summary_dict['topic_url_fragment'] = topic.url_fragment
        story_summary_dict['classroom_url_fragment'] = (
            classroom_services.get_classroom_url_fragment_for_topic_id(
                topic.id))
        story_summary_dict['story_is_published'] = True
        story_summary_dict['completed_node_titles'] = completed_node_titles
        story_summary_dict['all_node_dicts'] = [
            node.to_dict() for node in all_nodes]
        canonical_story_dicts.append(story_summary_dict)

    return canonical_story_dicts
