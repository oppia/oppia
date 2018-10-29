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

"""Commands for operations on topics, and related models."""

import copy
import logging

from core.domain import role_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import user_services
from core.platform import models
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])
datastore_services = models.Registry.import_datastore_services()
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


# Repository GET methods.
def _get_topic_memcache_key(topic_id, version=None):
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
    if (topic_model.subtopic_schema_version !=
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
        _migrate_subtopics_to_latest_schema(versioned_subtopics)
    return topic_domain.Topic(
        topic_model.id, topic_model.name,
        topic_model.description, topic_model.canonical_story_ids,
        topic_model.additional_story_ids, topic_model.uncategorized_skill_ids,
        [
            topic_domain.Subtopic.from_dict(subtopic)
            for subtopic in versioned_subtopics['subtopics']
        ],
        versioned_subtopics['schema_version'],
        topic_model.next_subtopic_id,
        topic_model.language_code,
        topic_model.version, topic_model.created_on,
        topic_model.last_updated)


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
        topic_summary_model: TopicSummaryModel.

    Returns:
        TopicSummary.
    """
    return topic_domain.TopicSummary(
        topic_summary_model.id, topic_summary_model.name,
        topic_summary_model.canonical_name,
        topic_summary_model.language_code,
        topic_summary_model.version,
        topic_summary_model.canonical_story_count,
        topic_summary_model.additional_story_count,
        topic_summary_model.uncategorized_skill_count,
        topic_summary_model.subtopic_count,
        topic_summary_model.total_skill_count,
        topic_summary_model.topic_model_created_on,
        topic_summary_model.topic_model_last_updated
    )


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
    topic_memcache_key = _get_topic_memcache_key(topic_id, version=version)
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


def _create_topic(committer_id, topic, commit_message, commit_cmds):
    """Creates a new topic, and ensures that rights for a new topic
    are saved first.

    Args:
        committer_id: str. ID of the committer.
        topic: Topic. topic domain object.
        commit_message: str. A description of changes made to the topic.
        commit_cmds: list(TopicChange). A list of TopicChange objects that
            represent change commands made to the given topic.
    """
    topic.validate()
    create_new_topic_rights(topic.id, committer_id)
    model = topic_models.TopicModel(
        id=topic.id,
        name=topic.name,
        canonical_name=topic.canonical_name,
        description=topic.description,
        language_code=topic.language_code,
        canonical_story_ids=topic.canonical_story_ids,
        additional_story_ids=topic.additional_story_ids,
        uncategorized_skill_ids=topic.uncategorized_skill_ids,
        subtopic_schema_version=topic.subtopic_schema_version,
        next_subtopic_id=topic.next_subtopic_id,
        subtopics=[subtopic.to_dict() for subtopic in topic.subtopics]
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    topic.version += 1
    create_topic_summary(topic.id)


def save_new_topic(committer_id, topic):
    """Saves a new topic.

    Args:
        committer_id: str. ID of the committer.
        topic: Topic. Topic to be saved.

    Raises:
        Exception. Topic with same name already exists.
    """
    existing_topic = get_topic_by_name(topic.name)
    if existing_topic is not None:
        raise Exception('Topic with name \'%s\' already exists' % topic.name)

    commit_message = (
        'New topic created with name \'%s\'.' % topic.name)
    _create_topic(
        committer_id, topic, commit_message, [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': topic.name
        })])


def apply_change_list(topic_id, change_list):
    """Applies a changelist to a topic and returns the result. The incoming
    changelist should not have simultaneuous creations and deletion of
    subtopics.

    Args:
        topic_id: str. ID of the given topic.
        change_list: list(TopicChange). A change list to be applied to the given
            topic.

    Raises:
        Exception. The incoming changelist had simultaneuous creation and
            deletion of subtopics.
    Returns:
        Topic, dict, list(int), list(int). The modified topic
            object, the modified subtopic pages dict keyed by subtopic page id
            containing the updated domain objects of each subtopic page, a list
            of ids of the deleted subtopics and a list of ids of the newly
            created subtopics.
    """
    topic = get_topic_by_id(topic_id)
    newly_created_subtopic_ids = []
    existing_subtopic_page_ids_to_be_modified = []
    deleted_subtopic_ids = []
    modified_subtopic_pages_list = []
    modified_subtopic_pages = {}

    for change in change_list:
        if (change.cmd ==
                subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY):
            if change.id < topic.next_subtopic_id:
                existing_subtopic_page_ids_to_be_modified.append(change.id)
    modified_subtopic_pages_list = (
        subtopic_page_services.get_subtopic_pages_with_ids(
            topic_id, existing_subtopic_page_ids_to_be_modified))
    for subtopic_page in modified_subtopic_pages_list:
        modified_subtopic_pages[subtopic_page.id] = subtopic_page
    try:
        for change in change_list:
            if change.cmd == topic_domain.CMD_ADD_SUBTOPIC:
                topic.add_subtopic(change.subtopic_id, change.title)
                subtopic_page_id = (
                    subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                        topic_id, change.subtopic_id))
                modified_subtopic_pages[subtopic_page_id] = (
                    subtopic_page_domain.SubtopicPage.create_default_subtopic_page( #pylint: disable=line-too-long
                        change.subtopic_id, topic_id)
                )
                newly_created_subtopic_ids.append(change.subtopic_id)
            elif change.cmd == topic_domain.CMD_DELETE_SUBTOPIC:
                topic.delete_subtopic(change.id)
                if change.id in newly_created_subtopic_ids:
                    raise Exception(
                        'The incoming changelist had simultaneous'
                        ' creation and deletion of subtopics.')
                deleted_subtopic_ids.append(change.id)
            elif change.cmd == topic_domain.CMD_ADD_UNCATEGORIZED_SKILL_ID:
                topic.add_uncategorized_skill_id(change.id)
            elif change.cmd == topic_domain.CMD_REMOVE_UNCATEGORIZED_SKILL_ID:
                topic.remove_uncategorized_skill_id(change.id)
            elif change.cmd == topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC:
                topic.move_skill_id_to_subtopic(
                    change.old_subtopic_id, change.new_subtopic_id,
                    change.skill_id)
            elif change.cmd == topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC:
                topic.remove_skill_id_from_subtopic(
                    change.subtopic_id, change.skill_id)
            elif change.cmd == topic_domain.CMD_UPDATE_TOPIC_PROPERTY:
                if (change.property_name ==
                        topic_domain.TOPIC_PROPERTY_NAME):
                    topic.update_name(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_DESCRIPTION):
                    topic.update_description(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_CANONICAL_STORY_IDS):
                    topic.update_canonical_story_ids(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_ADDITIONAL_STORY_IDS):
                    topic.update_additional_story_ids(change.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE):
                    topic.update_language_code(change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif (change.cmd ==
                  subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY):
                subtopic_page_id = (
                    subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                        topic_id, change.id))
                if ((modified_subtopic_pages[subtopic_page_id] is None) or
                        (change.id in deleted_subtopic_ids)):
                    raise Exception(
                        'The subtopic with id %s doesn\'t exist' % change.id)

                if (change.property_name ==
                        subtopic_page_domain.SUBTOPIC_PAGE_PROPERTY_HTML_DATA):
                    modified_subtopic_pages[subtopic_page_id].update_html_data(
                        change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif change.cmd == topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY:
                if (change.property_name ==
                        topic_domain.SUBTOPIC_PROPERTY_TITLE):
                    topic.update_subtopic_title(change.id, change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif (
                    change.cmd ==
                    topic_domain.CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION):
                # Loading the topic model from the datastore into a
                # Topic domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # topic is sufficient to apply the schema migration.
                continue
            else:
                raise Exception('Invalid change dict.')
        return (
            topic, modified_subtopic_pages, deleted_subtopic_ids,
            newly_created_subtopic_ids)

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, topic_id, change_list)
        )
        raise


def _save_topic(committer_id, topic, commit_message, change_list):
    """Validates a topic and commits it to persistent storage. If
    successful, increments the version number of the incoming topic domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        topic: Topic. The topic domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(TopicChange). List of changes applied to a topic.

    Raises:
        Exception: Received invalid change list.
        Exception: The topic model and the incoming topic domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save topic %s: %s' % (topic.id, change_list))
    topic.validate()

    topic_model = topic_models.TopicModel.get(topic.id, strict=False)
    if topic_model is None:
        topic_model = topic_models.TopicModel(id=topic.id)
    else:
        if topic.version > topic_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of topic '
                'from version %s. Please reload the page and try again.'
                % (topic_model.version, topic.version))
        elif topic.version < topic_model.version:
            raise Exception(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (topic_model.version, topic.version))

    topic_model.description = topic.description
    topic_model.name = topic.name
    topic_model.canonical_story_ids = topic.canonical_story_ids
    topic_model.additional_story_ids = topic.additional_story_ids
    topic_model.uncategorized_skill_ids = topic.uncategorized_skill_ids
    topic_model.subtopics = [subtopic.to_dict() for subtopic in topic.subtopics]
    topic_model.subtopic_schema_version = topic.subtopic_schema_version
    topic_model.next_subtopic_id = topic.next_subtopic_id
    topic_model.language_code = topic.language_code
    change_dicts = [change.to_dict() for change in change_list]
    topic_model.commit(committer_id, commit_message, change_dicts)
    memcache_services.delete(_get_topic_memcache_key(topic.id))
    topic.version += 1


def update_topic_and_subtopic_pages(
        committer_id, topic_id, change_list, commit_message):
    """Updates a topic and its subtopic pages. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - topic_id: str. The topic id.
    - change_list: list(TopicChange and SubtopicPageChange). These changes are
        applied in sequence to produce the resulting topic.
    - commit_message: str or None. A description of changes made to the
        topic.

    Raises:
        ValueError: Current user does not have enough rights to edit a topic.
    """
    if not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')

    (
        updated_topic, updated_subtopic_pages_dict,
        deleted_subtopic_ids, newly_created_subtopic_ids
    ) = apply_change_list(topic_id, change_list)

    _save_topic(
        committer_id, updated_topic, commit_message, change_list
    )
    # The following loop deletes those subtopic pages that are already in the
    # datastore, which are supposed to be deleted in the current changelist.
    for subtopic_id in deleted_subtopic_ids:
        if subtopic_id not in newly_created_subtopic_ids:
            subtopic_page_services.delete_subtopic_page(
                committer_id, topic_id, subtopic_id)

    for subtopic_page_id in updated_subtopic_pages_dict:
        subtopic_page = updated_subtopic_pages_dict[subtopic_page_id]
        subtopic_id = subtopic_page.get_subtopic_id_from_subtopic_page_id()
        # The following condition prevents the creation of subtopic pages that
        # were deleted above.
        if subtopic_id not in deleted_subtopic_ids:
            subtopic_page_services.save_subtopic_page(
                committer_id, subtopic_page, commit_message, change_list)
    create_topic_summary(topic_id)


def delete_uncategorized_skill(user_id, topic_id, uncategorized_skill_id):
    """Removes skill with given id from the topic.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic from which to remove the skill.
        uncategorized_skill_id: str. The uncategorized skill to remove from the
            topic.
    """
    change_list = [topic_domain.TopicChange({
        'cmd': 'remove_uncategorized_skill_id',
        'uncategorized_skill_id': uncategorized_skill_id
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Removed %s from uncategorized skill ids' % uncategorized_skill_id)


def add_uncategorized_skill(user_id, topic_id, uncategorized_skill_id):
    """Adds a skill with given id to the topic.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic to which the skill is to be added.
        uncategorized_skill_id: str. The id of the uncategorized skill to add
            to the topic.
    """
    change_list = [topic_domain.TopicChange({
        'cmd': 'add_uncategorized_skill_id',
        'new_uncategorized_skill_id': uncategorized_skill_id
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Added %s to uncategorized skill ids' % uncategorized_skill_id)


def delete_story(user_id, topic_id, story_id):
    """Removes story with given id from the topic.

    NOTE TO DEVELOPERS: Presently, this function only removes story_id from
    canonical_story_ids list.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic from which to remove the story.
        story_id: str. The story to remove from the topic.
    """
    topic = get_topic_by_id(topic_id)
    old_canonical_story_ids = copy.deepcopy(topic.canonical_story_ids)
    topic.delete_story(story_id)
    change_list = [topic_domain.TopicChange({
        'cmd': 'update_topic_property',
        'property_name': 'canonical_story_ids',
        'old_value': old_canonical_story_ids,
        'new_value': topic.canonical_story_ids
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Removed %s from canonical story ids' % story_id)


def add_canonical_story(user_id, topic_id, story_id):
    """Adds a story to the canonical story id list of a topic.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic to which the story is to be added.
        story_id: str. The story to add to the topic.
    """
    topic = get_topic_by_id(topic_id)
    old_canonical_story_ids = copy.deepcopy(topic.canonical_story_ids)
    topic.add_canonical_story(story_id)
    change_list = [topic_domain.TopicChange({
        'cmd': 'update_topic_property',
        'property_name': 'canonical_story_ids',
        'old_value': old_canonical_story_ids,
        'new_value': topic.canonical_story_ids
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Added %s to canonical story ids' % story_id)


def delete_topic(committer_id, topic_id, force_deletion=False):
    """Deletes the topic with the given topic_id.

    Args:
        committer_id: str. ID of the committer.
        topic_id: str. ID of the topic to be deleted.
        force_deletion: bool. If true, the topic and its history are fully
            deleted and are unrecoverable. Otherwise, the topic and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.

    Raises:
        ValueError: User does not have enough rights to delete a topic.
    """
    topic_rights_model = topic_models.TopicRightsModel.get(topic_id)
    topic_rights_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_TOPIC_DELETED,
        force_deletion=force_deletion)

    # Delete the summary of the topic (regardless of whether
    # force_deletion is True or not).
    delete_topic_summary(topic_id)
    topic_model = topic_models.TopicModel.get(topic_id)
    for subtopic in topic_model.subtopics:
        subtopic_page_services.delete_subtopic_page(
            committer_id, topic_id, subtopic['id'])
    topic_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_TOPIC_DELETED,
        force_deletion=force_deletion)

    # This must come after the topic is retrieved. Otherwise the memcache
    # key will be reinstated.
    topic_memcache_key = _get_topic_memcache_key(topic_id)
    memcache_services.delete(topic_memcache_key)


def delete_topic_summary(topic_id):
    """Delete a topic summary model.

    Args:
        topic_id: str. ID of the topic whose topic summary is to
            be deleted.
    """

    topic_models.TopicSummaryModel.get(topic_id).delete()


def create_topic_summary(topic_id):
    """Creates and stores a summary of the given topic.

    Args:
        topic_id: str. ID of the topic.
    """
    topic = get_topic_by_id(topic_id)
    topic_summary = compute_summary_of_topic(topic)
    save_topic_summary(topic_summary)


def compute_summary_of_topic(topic):
    """Create a TopicSummary domain object for a given Topic domain
    object and return it.

    Args:
        topic: Topic. The topic object for which the summary is to be computed.

    Returns:
        TopicSummary. The computed summary for the given topic.
    """
    topic_model_canonical_story_count = len(topic.canonical_story_ids)
    topic_model_additional_story_count = len(topic.additional_story_ids)
    topic_model_uncategorized_skill_count = len(topic.uncategorized_skill_ids)
    topic_model_subtopic_count = len(topic.subtopics)

    total_skill_count = topic_model_uncategorized_skill_count
    for subtopic in topic.subtopics:
        total_skill_count = total_skill_count + len(subtopic.skill_ids)

    topic_summary = topic_domain.TopicSummary(
        topic.id, topic.name, topic.canonical_name, topic.language_code,
        topic.version, topic_model_canonical_story_count,
        topic_model_additional_story_count,
        topic_model_uncategorized_skill_count, topic_model_subtopic_count,
        total_skill_count, topic.created_on, topic.last_updated
    )

    return topic_summary


def save_topic_summary(topic_summary):
    """Save a topic summary domain object as a TopicSummaryModel
    entity in the datastore.

    Args:
        topic_summary: The topic summary object to be saved in the
            datastore.
    """
    topic_summary_model = topic_models.TopicSummaryModel(
        id=topic_summary.id,
        name=topic_summary.name,
        canonical_name=topic_summary.canonical_name,
        language_code=topic_summary.language_code,
        version=topic_summary.version,
        additional_story_count=topic_summary.additional_story_count,
        canonical_story_count=topic_summary.canonical_story_count,
        uncategorized_skill_count=topic_summary.uncategorized_skill_count,
        subtopic_count=topic_summary.subtopic_count,
        total_skill_count=topic_summary.total_skill_count,
        topic_model_last_updated=topic_summary.topic_model_last_updated,
        topic_model_created_on=topic_summary.topic_model_created_on
    )

    topic_summary_model.put()


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


def publish_topic(topic_id, committer_id):
    """Marks the given topic as published.

    Args:
        topic_id: str. The id of the given topic.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given topic does not exist.
        Exception. The topic is already published.
        Exception. The user does not have enough rights to publish the topic.
    """
    topic_rights = get_topic_rights(topic_id, strict=False)
    if topic_rights is None:
        raise Exception('The given topic does not exist')
    user = user_services.UserActionsInfo(committer_id)
    if role_services.ACTION_CHANGE_TOPIC_STATUS not in user.actions:
        raise Exception(
            'The user does not have enough rights to publish the topic.')

    if topic_rights.topic_is_published:
        raise Exception('The topic is already published.')
    topic_rights.topic_is_published = True
    commit_cmds = [topic_domain.TopicRightsChange({
        'cmd': topic_domain.CMD_PUBLISH_TOPIC
    })]
    save_topic_rights(
        topic_rights, committer_id, 'Published the topic', commit_cmds)


def unpublish_topic(topic_id, committer_id):
    """Marks the given topic as unpublished.

    Args:
        topic_id: str. The id of the given topic.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given topic does not exist.
        Exception. The topic is already unpublished.
        Exception. The user does not have enough rights to unpublish the topic.
    """
    topic_rights = get_topic_rights(topic_id, strict=False)
    if topic_rights is None:
        raise Exception('The given topic does not exist')
    user = user_services.UserActionsInfo(committer_id)
    if role_services.ACTION_CHANGE_TOPIC_STATUS not in user.actions:
        raise Exception(
            'The user does not have enough rights to unpublish the topic.')

    if not topic_rights.topic_is_published:
        raise Exception('The topic is already unpublished.')
    topic_rights.topic_is_published = False
    commit_cmds = [topic_domain.TopicRightsChange({
        'cmd': topic_domain.CMD_UNPUBLISH_TOPIC
    })]
    save_topic_rights(
        topic_rights, committer_id, 'Unpublished the topic', commit_cmds)


def save_topic_rights(topic_rights, committer_id, commit_message, commit_cmds):
    """Saves a TopicRights domain object to the datastore.

    Args:
        topic_rights: TopicRights. The rights object for the given
            topic.
        committer_id: str. ID of the committer.
        commit_message: str. Descriptive message for the commit.
        commit_cmds: list(TopicRightsChange). A list of commands describing
            what kind of commit was done.
    """

    model = topic_models.TopicRightsModel.get(topic_rights.id, strict=False)

    model.manager_ids = topic_rights.manager_ids
    model.topic_is_published = topic_rights.topic_is_published
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)


def create_new_topic_rights(topic_id, committer_id):
    """Creates a new topic rights object and saves it to the datastore.

    Args:
        topic_id: str. ID of the topic.
        committer_id: str. ID of the committer.
    """
    topic_rights = topic_domain.TopicRights(topic_id, [], False)
    commit_cmds = [{'cmd': topic_domain.CMD_CREATE_NEW}]

    topic_models.TopicRightsModel(
        id=topic_rights.id,
        manager_ids=topic_rights.manager_ids,
        topic_is_published=topic_rights.topic_is_published
    ).commit(committer_id, 'Created new topic rights', commit_cmds)


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


def get_all_topic_rights():
    """Returns the rights object of all topics present in the datastore.

    Returns:
        dict. The dict of rights objects of all topics present in
            the datastore keyed by topic id.
    """
    topic_rights_models = topic_models.TopicRightsModel.get_all()
    topic_rights = {}
    for model in topic_rights_models:
        rights = get_topic_rights_from_model(model)
        topic_rights[rights.id] = rights
    return topic_rights


def check_can_edit_topic(user, topic_rights):
    """Checks whether the user can edit the given topic.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        topic_rights: TopicRights or None. Rights object for the given topic.

    Returns:
        bool. Whether the given user can edit the given topic.
    """
    if topic_rights is None:
        return False
    if role_services.ACTION_EDIT_ANY_TOPIC in user.actions:
        return True
    if role_services.ACTION_EDIT_OWNED_TOPIC not in user.actions:
        return False
    if topic_rights.is_manager(user.user_id):
        return True

    return False


def check_can_edit_subtopic_page(user):
    """Checks whether the user can edit the subtopic pages for a topic.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.

    Returns:
        bool. Whether the given user can edit a subtopic page.
    """
    if role_services.ACTION_EDIT_ANY_SUBTOPIC_PAGE in user.actions:
        return True

    return False


def assign_role(committer, assignee, new_role, topic_id):
    """Assigns a new role to the user.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user
            who is performing the action.
        assignee: UserActionsInfo. UserActionsInfo object for the user
            whose role is being changed.
        new_role: str. The name of the new role. Possible values are:
            ROLE_MANAGER
        topic_id: str. ID of the topic.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. The assignee is already a manager for the topic.
        Exception. The assignee doesn't have enough rights to become a manager.
        Exception. The role is invalid.
    """
    committer_id = committer.user_id
    topic_rights = get_topic_rights(topic_id)
    if (role_services.ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY not in
            committer.actions):
        logging.error(
            'User %s tried to allow user %s to be a %s of topic %s '
            'but was refused permission.' % (
                committer_id, assignee.user_id, new_role, topic_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    assignee_username = user_services.get_username(assignee.user_id)
    if role_services.ACTION_EDIT_OWNED_TOPIC not in assignee.actions:
        raise Exception(
            'The assignee doesn\'t have enough rights to become a manager.')

    old_role = topic_domain.ROLE_NONE
    if topic_rights.is_manager(assignee.user_id):
        old_role = topic_domain.ROLE_MANAGER

    if new_role == topic_domain.ROLE_MANAGER:
        if topic_rights.is_manager(assignee.user_id):
            raise Exception('This user already is a manager for this topic')
        topic_rights.manager_ids.append(assignee.user_id)
    elif new_role == topic_domain.ROLE_NONE:
        if topic_rights.is_manager(assignee.user_id):
            topic_rights.manager_ids.remove(assignee.user_id)
        else:
            old_role = topic_domain.ROLE_NONE
    else:
        raise Exception('Invalid role: %s' % new_role)

    commit_message = 'Changed role of %s from %s to %s' % (
        assignee_username, old_role, new_role)
    commit_cmds = [topic_domain.TopicRightsChange({
        'cmd': topic_domain.CMD_CHANGE_ROLE,
        'assignee_id': assignee.user_id,
        'old_role': old_role,
        'new_role': new_role
    })]

    save_topic_rights(topic_rights, committer_id, commit_message, commit_cmds)
