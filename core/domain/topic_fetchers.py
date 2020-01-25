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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy

from core.domain import topic_domain
from core.platform import models
import feconf

(skill_models, topic_models,) = models.Registry.import_models([
    models.NAMES.skill, models.NAMES.topic])
memcache_services = models.Registry.import_memcache_services()


def _migrate_subtopics_to_latest_schema(versioned_subtopics):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the subtopics structure based on the schema version of the input
    subtopics dictionary. If the current subtopics schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_subtopics: A dict with two keys:
          - schema_version: int. The schema version for the subtopics dict.
          - subtopics: list(dict). The list of dicts comprising the topic's
              subtopics.

    Raises:
        Exception: The schema version of subtopics is outside of what
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
            versioned_subtopics, subtopic_schema_version)
        subtopic_schema_version += 1


def _migrate_story_references_to_latest_schema(versioned_story_references):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the story reference structure based on the schema version of the input
    story reference dictionary. If the current story reference schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_story_references: A dict with two keys:
          - schema_version: int. The schema version for the story reference
                dict.
          - story_references: list(dict). The list of dicts comprising the
                topic's story references.

    Raises:
        Exception: The schema version of story_references is outside of what
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


def get_topic_memcache_key(topic_id, version=None):
    """Returns a memcache key for the topic.

    Args:
        topic_id: str. ID of the topic.
        version: int. The version of the topic.

    Returns:
        str. The memcache key of the topic.
    """
    if version:
        return 'topic-version:%s:%s' % (topic_id, version)
    else:
        return 'topic:%s' % topic_id


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
        _migrate_subtopics_to_latest_schema(versioned_subtopics)
    if (topic_model.story_reference_schema_version !=
            feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION):
        _migrate_story_references_to_latest_schema(
            versioned_canonical_story_references)
        _migrate_story_references_to_latest_schema(
            versioned_additional_story_references)
    return topic_domain.Topic(
        topic_model.id, topic_model.name,
        topic_model.abbreviated_name,
        topic_model.thumbnail_filename,
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
        topic_model.created_on, topic_model.last_updated)


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
    topic_memcache_key = get_topic_memcache_key(topic_id, version=version)
    memcached_topic = memcache_services.get_multi(
        [topic_memcache_key]).get(topic_memcache_key)

    if memcached_topic is not None:
        return memcached_topic
    else:
        topic_model = topic_models.TopicModel.get(
            topic_id, strict=strict, version=version)
        if topic_model:
            topic = get_topic_from_model(topic_model)
            memcache_services.set_multi({topic_memcache_key: topic})
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


def get_all_topics_with_skills():
    """Returns a list of topics with linked skills.

    Returns:
        list(Topic). A list of topics with skills.
    """
    all_topic_models = topic_models.TopicModel.get_all()
    topics_with_skills = []
    for topic_model in all_topic_models:
        if topic_model:
            topic = get_topic_from_model(topic_model)
            if topic.get_all_skill_ids():
                topics_with_skills.append(topic)
    return topics_with_skills


def get_all_topics():
    """Returns all the topics present in the datastore.

    Returns:
        list(Topic). The list of topics present in the datastore.
    """
    backend_topic_models = topic_models.TopicModel.get_all()
    topics = [
        get_topic_from_model(topic) for topic in backend_topic_models]
    return topics
