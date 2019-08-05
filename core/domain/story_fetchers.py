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

"""Commands that can be used to fetch story related models.

All functions here should be agnostic of how StoryModel objects are
stored in the database. In particular, the various query methods should
delegate to the Story model class. This will enable the story
storage model to be changed without affecting this module and others above it.
"""

import copy

from core.domain import story_domain
from core.platform import models
import feconf

(story_models, user_models) = models.Registry.import_models(
    [models.NAMES.story, models.NAMES.user])
memcache_services = models.Registry.import_memcache_services()


def _migrate_story_contents_to_latest_schema(versioned_story_contents):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the story structure based on the schema version of the input
    story dictionary. If the current story_contents schema changes, a new
    conversion function must be added and some code appended to this function
    to account for that new version.

    Args:
        versioned_story_contents: A dict with two keys:
          - schema_version: str. The schema version for the story_contents dict.
          - story_contents: dict. The dict comprising the story
              contents.

    Raises:
        Exception: The schema version of the story_contents is outside of what
        is supported at present.
    """
    story_contents_schema_version = versioned_story_contents['schema_version']
    if not (1 <= story_contents_schema_version
            <= feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d story schemas at '
            'present.' % feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)

    while (story_contents_schema_version <
           feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        story_domain.Story.update_story_contents_from_model(
            versioned_story_contents, story_contents_schema_version)
        story_contents_schema_version += 1


# Repository GET methods.
def get_story_memcache_key(story_id, version=None):
    """Returns a memcache key for the story.

    Args:
        story_id: str. ID of the story.
        version: str. Schema version of the story.

    Returns:
        str. The memcache key of the story.
    """
    if version:
        return 'story-version:%s:%s' % (story_id, version)
    else:
        return 'story:%s' % story_id


def get_story_from_model(story_model):
    """Returns a story domain object given a story model loaded
    from the datastore.

    Args:
        story_model: StoryModel. The story model loaded from the
            datastore.

    Returns:
        story. A Story domain object corresponding to the given
        story model.
    """

    # Ensure the original story model does not get altered.
    versioned_story_contents = {
        'schema_version': story_model.story_contents_schema_version,
        'story_contents': copy.deepcopy(story_model.story_contents)
    }

    # Migrate the story contents if it is not using the latest schema version.
    if (story_model.story_contents_schema_version !=
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        _migrate_story_contents_to_latest_schema(
            versioned_story_contents)

    return story_domain.Story(
        story_model.id, story_model.title,
        story_model.description, story_model.notes,
        story_domain.StoryContents.from_dict(
            versioned_story_contents['story_contents']),
        versioned_story_contents['schema_version'],
        story_model.language_code, story_model.corresponding_topic_id,
        story_model.version, story_model.created_on,
        story_model.last_updated)


def get_story_summary_from_model(story_summary_model):
    """Returns a domain object for an Oppia story summary given a
    story summary model.

    Args:
        story_summary_model: StorySummaryModel.

    Returns:
        StorySummary.
    """
    return story_domain.StorySummary(
        story_summary_model.id, story_summary_model.title,
        story_summary_model.description,
        story_summary_model.language_code,
        story_summary_model.version,
        story_summary_model.node_count,
        story_summary_model.story_model_created_on,
        story_summary_model.story_model_last_updated
    )


def get_story_by_id(story_id, strict=True, version=None):
    """Returns a domain object representing a story.

    Args:
        story_id: str. ID of the story.
        strict: bool. Whether to fail noisily if no story with the given
            id exists in the datastore.
        version: str or None. The version number of the story to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Story or None. The domain object representing a story with the
        given id, or None if it does not exist.
    """
    story_memcache_key = get_story_memcache_key(
        story_id, version=version)
    memcached_story = memcache_services.get_multi(
        [story_memcache_key]).get(story_memcache_key)

    if memcached_story is not None:
        return memcached_story
    else:
        story_model = story_models.StoryModel.get(
            story_id, strict=strict, version=version)
        if story_model:
            story = get_story_from_model(story_model)
            memcache_services.set_multi({story_memcache_key: story})
            return story
        else:
            return None


def get_story_summary_by_id(story_id, strict=True):
    """Returns a domain object representing a story summary.

    Args:
        story_id: str. ID of the story summary.
        strict: bool. Whether to fail noisily if no story summary with the given
            id exists in the datastore.
    Returns:
        StorySummary. The story summary domain object corresponding to
        a story with the given story_id.
    """
    story_summary_model = story_models.StorySummaryModel.get(
        story_id, strict=strict)
    if story_summary_model:
        story_summary = get_story_summary_from_model(
            story_summary_model)
        return story_summary
    else:
        return None


def get_story_summaries_by_ids(story_ids):
    """Returns the StorySummary objects corresponding the given story ids.

    Args:
        story_ids: list(str). The list of story ids for which the story
            summaries are to be found.

    Returns:
        list(StorySummary). The story summaries corresponding to given story
            ids.
    """
    story_summary_models = story_models.StorySummaryModel.get_multi(story_ids)
    story_summaries = [
        get_story_summary_from_model(story_summary_model)
        for story_summary_model in story_summary_models
        if story_summary_model is not None
    ]
    return story_summaries


def get_latest_completed_node_ids(user_id, story_id):
    """Returns the ids of the completed nodes that come latest in the story.

    Args:
        user_id: str. ID of the given user.
        story_id: str. ID of the story.

    Returns:
        list(str). List of the completed node ids that come latest in the story.
            If length is larger than 3, return the last three of them.
            If length is smaller or equal to 3, return all of them.
    """
    progress_model = user_models.StoryProgressModel.get(
        user_id, story_id, strict=False)

    if not progress_model:
        return []

    num_of_nodes = min(len(progress_model.completed_node_ids), 3)
    story = get_story_by_id(story_id)
    ordered_node_ids = (
        [node.id for node in story.story_contents.get_ordered_nodes()])
    ordered_completed_node_ids = (
        [node_id for node_id in ordered_node_ids
         if node_id in progress_model.completed_node_ids]
    )
    return ordered_completed_node_ids[-num_of_nodes:]


def get_completed_nodes_in_story(user_id, story_id):
    """Returns nodes that are completed in a story

    Args:
        user_id: str. The user id of the user.
        story_id: str. The id of the story.

    Returns:
        list(StoryNode): The list of the story nodes that the user has
        completed.
    """
    story = get_story_by_id(story_id)
    completed_nodes = []

    completed_node_ids = get_completed_node_ids(user_id, story_id)
    for node in story.story_contents.nodes:
        if node.id in completed_node_ids:
            completed_nodes.append(node)

    return completed_nodes


def get_pending_nodes_in_story(user_id, story_id):
    """Returns the nodes that are pending in a story

    Args:
        user_id: str. The user id of the user.
        story_id: str. The id of the story.

    Returns:
        list(StoryNode): The list of story nodes, pending
        for the user.
    """
    story = get_story_by_id(story_id)
    pending_nodes = []

    completed_node_ids = get_completed_node_ids(user_id, story_id)
    for node in story.story_contents.nodes:
        if node.id not in completed_node_ids:
            pending_nodes.append(node)

    return pending_nodes


def get_completed_node_ids(user_id, story_id):
    """Returns the ids of the nodes completed in the story.

    Args:
        user_id: str. ID of the given user.
        story_id: str. ID of the story.

    Returns:
        list(str). List of the node ids completed in story.
    """
    progress_model = user_models.StoryProgressModel.get(
        user_id, story_id, strict=False)

    return progress_model.completed_node_ids if progress_model else []


def get_node_index_by_story_id_and_node_id(story_id, node_id):
    """Returns the index of the story node with the given story id
    and node id.

    Args:
        story_id: str. ID of the story.
        node_id: str. ID of the story node.

    Returns:
        int. The index of the corresponding node.

    Raises:
        Exception. The given story does not exist.
        Exception. The given node does not exist in the story.
    """
    try:
        story = get_story_by_id(story_id)
    except Exception:
        raise Exception('Story with id %s does not exist.' % story_id)

    node_index = story.story_contents.get_node_index(node_id)
    if node_index is None:
        raise Exception('Story node with id %s does not exist '
                        'in this story.' % node_id)
    return node_index
