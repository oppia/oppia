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

from __future__ import annotations

import copy
import itertools

from core import feconf
from core.domain import caching_services
from core.domain import classroom_services
from core.domain import exp_fetchers
from core.domain import story_domain
from core.domain import topic_fetchers
from core.domain import user_services
from core.platform import models

from typing import Dict, List, Literal, Optional, Sequence, overload

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import story_models
    from mypy_imports import user_models

(story_models, user_models) = models.Registry.import_models(
    [models.Names.STORY, models.Names.USER])


def _migrate_story_contents_to_latest_schema(
    versioned_story_contents: story_domain.VersionedStoryContentsDict,
    story_id: str
) -> None:
    """Holds the responsibility of performing a step-by-step, sequential update
    of the story structure based on the schema version of the input
    story dictionary. If the current story_contents schema changes, a new
    conversion function must be added and some code appended to this function
    to account for that new version.

    Args:
        versioned_story_contents: dict. A dict with two keys:
          - schema_version: str. The schema version for the story_contents dict.
          - story_contents: dict. The dict comprising the story
              contents.
        story_id: str. The unique ID of the story.

    Raises:
        Exception. The schema version of the story_contents is outside of what
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
            versioned_story_contents, story_contents_schema_version, story_id)
        story_contents_schema_version += 1


def get_story_from_model(
    story_model: story_models.StoryModel
) -> story_domain.Story:
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
    versioned_story_contents: story_domain.VersionedStoryContentsDict = {
        'schema_version': story_model.story_contents_schema_version,
        'story_contents': copy.deepcopy(story_model.story_contents)
    }

    # Migrate the story contents if it is not using the latest schema version.
    if (story_model.story_contents_schema_version !=
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        _migrate_story_contents_to_latest_schema(
            versioned_story_contents, story_model.id)

    return story_domain.Story(
        story_model.id, story_model.title, story_model.thumbnail_filename,
        story_model.thumbnail_bg_color, story_model.thumbnail_size_in_bytes,
        story_model.description, story_model.notes,
        story_domain.StoryContents.from_dict(
            versioned_story_contents['story_contents']),
        versioned_story_contents['schema_version'],
        story_model.language_code, story_model.corresponding_topic_id,
        story_model.version, story_model.url_fragment,
        story_model.meta_tag_content, story_model.created_on,
        story_model.last_updated)


def get_story_summary_from_model(
    story_summary_model: story_models.StorySummaryModel
) -> story_domain.StorySummary:
    """Returns a domain object for an Oppia story summary given a
    story summary model.

    Args:
        story_summary_model: StorySummaryModel. The story summary model object
            to get the corresponding domain object.

    Returns:
        StorySummary. The corresponding domain object to the given story
        summary model object.
    """
    return story_domain.StorySummary(
        story_summary_model.id, story_summary_model.title,
        story_summary_model.description,
        story_summary_model.language_code,
        story_summary_model.version,
        story_summary_model.node_titles,
        story_summary_model.thumbnail_bg_color,
        story_summary_model.thumbnail_filename,
        story_summary_model.url_fragment,
        story_summary_model.story_model_created_on,
        story_summary_model.story_model_last_updated
    )


@overload
def get_story_by_id(
    story_id: str,
) -> story_domain.Story: ...


@overload
def get_story_by_id(
    story_id: str,
    *,
    version: Optional[int] = None
) -> story_domain.Story: ...


@overload
def get_story_by_id(
    story_id: str,
    *,
    strict: Literal[True],
    version: Optional[int] = None
) -> story_domain.Story: ...


@overload
def get_story_by_id(
    story_id: str,
    *,
    strict: Literal[False],
    version: Optional[int] = None
) -> Optional[story_domain.Story]: ...


def get_story_by_id(
    story_id: str,
    strict: bool = True,
    version: Optional[int] = None
) -> Optional[story_domain.Story]:
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
    sub_namespace = str(version) if version else None
    cached_story = caching_services.get_multi(
        caching_services.CACHE_NAMESPACE_STORY,
        sub_namespace,
        [story_id]).get(story_id)

    if cached_story is not None:
        return cached_story
    else:
        story_model = story_models.StoryModel.get(
            story_id, strict=strict, version=version)
        if story_model:
            story = get_story_from_model(story_model)
            caching_services.set_multi(
                caching_services.CACHE_NAMESPACE_STORY,
                sub_namespace,
                {story_id: story})
            return story
        else:
            return None


def get_story_by_url_fragment(
    url_fragment: str
) -> Optional[story_domain.Story]:
    """Returns a domain object representing a story.

    Args:
        url_fragment: str. The url fragment of the story.

    Returns:
        Story or None. The domain object representing a story with the
        given url_fragment, or None if it does not exist.
    """
    story_model = story_models.StoryModel.get_by_url_fragment(url_fragment)
    if story_model is None:
        return None

    story = get_story_from_model(story_model)
    return story


@overload
def get_story_summary_by_id(
    story_id: str
) -> story_domain.StorySummary: ...


@overload
def get_story_summary_by_id(
    story_id: str, *, strict: Literal[True]
) -> story_domain.StorySummary: ...


@overload
def get_story_summary_by_id(
    story_id: str, *, strict: Literal[False]
) -> Optional[story_domain.StorySummary]: ...


def get_story_summary_by_id(
    story_id: str, strict: bool = True
) -> Optional[story_domain.StorySummary]:
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


@overload
def get_stories_by_ids(
    story_ids: List[str], *, strict: Literal[True]
) -> List[story_domain.Story]: ...


@overload
def get_stories_by_ids(
    story_ids: List[str]
) -> List[Optional[story_domain.Story]]: ...


@overload
def get_stories_by_ids(
    story_ids: List[str], *, strict: Literal[False]
) -> List[Optional[story_domain.Story]]: ...


def get_stories_by_ids(
    story_ids: List[str], strict: bool = False
) -> Sequence[Optional[story_domain.Story]]:
    """Returns a list of stories matching the IDs provided.

    Args:
        story_ids: list(str). List of IDs to get stories for.
        strict: bool. Whether to fail noisily if no story model exists
            with a given ID exists in the datastore.

    Returns:
        list(Story|None). The list of stories corresponding to given ids.  If a
        Story does not exist, the corresponding returned list element is None.

    Raises:
        Exception. No story model exists for the given story_id.
    """
    all_story_models = story_models.StoryModel.get_multi(story_ids)
    stories: List[Optional[story_domain.Story]] = []
    for index, story_model in enumerate(all_story_models):
        if story_model is None:
            if strict:
                raise Exception(
                    'No story model exists for the story_id: %s'
                    % story_ids[index]
                )
            stories.append(story_model)
        elif story_model is not None:
            stories.append(get_story_from_model(story_model))
    return stories


def get_story_summaries_by_ids(
    story_ids: List[str]
) -> List[story_domain.StorySummary]:
    """Returns the StorySummary objects corresponding the given story ids.

    Args:
        story_ids: list(str). The list of story ids for which the story
            summaries are to be found.

    Returns:
        list(StorySummary). The story summaries corresponds to given story
        ids.
    """
    story_summary_models = story_models.StorySummaryModel.get_multi(story_ids)
    story_summaries = [
        get_story_summary_from_model(story_summary_model)
        for story_summary_model in story_summary_models
        if story_summary_model is not None
    ]
    return story_summaries


def get_learner_group_syllabus_story_summaries(
    story_ids: List[str]
) -> List[story_domain.LearnerGroupSyllabusStorySummaryDict]:
    """Returns the learner group syllabus story summary dicts
    corresponding the given story ids.

    Args:
        story_ids: list(str). The list of story ids for which the story
            summaries are to be returned.

    Returns:
        list(LearnerGroupSyllabusStorySummaryDict). The story summaries
        corresponds to given story ids.
    """
    # Validating if story exists before adding it to all stories list is only
    # done for mypy type checks as all story ids are supposed to be valid as
    # a part of validation done for learner group syllabus before calling
    # this function.
    all_stories = [
        story for story in get_stories_by_ids(story_ids) if story
    ]

    topic_ids = list(
        {story.corresponding_topic_id for story in all_stories}
    )
    topics = topic_fetchers.get_topics_by_ids(topic_ids)
    topic_id_to_topic_map = {}
    for topic in topics:
        # Ruling out the possibility of None for mypy type checking. Topic is
        # guaranteed to exist as a part of validation done for story ids since
        # story is bound to be part of a topic.
        assert topic is not None
        topic_id_to_topic_map[topic.id] = topic

    story_summaries_dicts = [
        story_summary.to_dict() for story_summary in
        get_story_summaries_by_ids(story_ids)
    ]

    return [
        {
            'id': story.id,
            'title': story.title,
            'description': story.description,
            'language_code': story.language_code,
            'version': story.version,
            'node_titles': summary_dict['node_titles'],
            'thumbnail_filename': story.thumbnail_filename,
            'thumbnail_bg_color': story.thumbnail_bg_color,
            'url_fragment': story.url_fragment,
            'story_model_created_on': summary_dict['story_model_created_on'],
            'story_model_last_updated':
                summary_dict['story_model_last_updated'],
            'story_is_published': True,
            'completed_node_titles': [],
            'all_node_dicts': [
                node.to_dict() for node in
                story.story_contents.nodes
            ],
            'topic_name':
                topic_id_to_topic_map[story.corresponding_topic_id].name,
            'topic_url_fragment':
                topic_id_to_topic_map[
                    story.corresponding_topic_id].url_fragment,
            'classroom_url_fragment': None
        }
        for (story, summary_dict) in
        zip(all_stories, story_summaries_dicts)
    ]


def get_latest_completed_node_ids(user_id: str, story_id: str) -> List[str]:
    """Returns the ids of the completed nodes that come latest in the story.

    Args:
        user_id: str. ID of the given user.
        story_id: str. ID of the story.

    Returns:
        list(str). List of the completed node ids that come latest in the story.
        If length is larger than 3, return the last three of them. If length is
        smaller or equal to 3, return all of them.
    """
    progress_model = user_models.StoryProgressModel.get(
        user_id, story_id, strict=False)

    if not progress_model:
        return []

    num_of_nodes = min(len(progress_model.completed_node_ids), 3)
    story = get_story_by_id(story_id, strict=True)
    ordered_node_ids = (
        [node.id for node in story.story_contents.get_ordered_nodes()])
    ordered_completed_node_ids = (
        [node_id for node_id in ordered_node_ids
         if node_id in progress_model.completed_node_ids]
    )
    return ordered_completed_node_ids[-num_of_nodes:]


def get_completed_nodes_in_story(
    user_id: str, story_id: str
) -> List[story_domain.StoryNode]:
    """Returns nodes that are completed in a story

    Args:
        user_id: str. The user id of the user.
        story_id: str. The id of the story.

    Returns:
        list(StoryNode). The list of the story nodes that the user has
        completed.
    """
    story = get_story_by_id(story_id, strict=True)
    completed_nodes = []

    completed_node_ids = get_completed_node_ids(user_id, story_id)
    for node in story.story_contents.nodes:
        if node.id in completed_node_ids:
            completed_nodes.append(node)

    return completed_nodes


def get_user_progress_in_story_chapters(
    user_id: str, story_ids: List[str]
) -> List[story_domain.StoryChapterProgressSummaryDict]:
    """Returns the progress of multiple users in multiple chapters.

    Args:
        user_id: str. The user id of the user.
        story_ids: list(str). The ids of the stories.

    Returns:
        list(StoryChapterProgressSummaryDict). The list of the progress
        summaries of the user corresponding to all stories chapters.
    """
    all_valid_story_nodes: List[story_domain.StoryNode] = []
    for story in get_stories_by_ids(story_ids):
        if story is not None:
            all_valid_story_nodes.extend(story.story_contents.nodes)
    exp_ids = [
        node.exploration_id for node in all_valid_story_nodes
        if node.exploration_id
    ]
    exp_id_to_exp_map = exp_fetchers.get_multiple_explorations_by_id(exp_ids)
    user_id_exp_id_combinations = list(itertools.product([user_id], exp_ids))
    exp_user_data_models = (
        user_models.ExplorationUserDataModel.get_multi(
            user_id_exp_id_combinations))

    all_chapters_progress: List[
        story_domain.StoryChapterProgressSummaryDict] = []
    for i, user_id_exp_id_pair in enumerate(user_id_exp_id_combinations):
        exp_id = user_id_exp_id_pair[1]
        exploration = exp_id_to_exp_map[exp_id]
        all_checkpoints = user_services.get_checkpoints_in_order(
            exploration.init_state_name,
            exploration.states)
        model = exp_user_data_models[i]
        visited_checkpoints = 0
        if model is not None:
            most_recently_visited_checkpoint = (
                model.most_recently_reached_checkpoint_state_name)
            if most_recently_visited_checkpoint is not None:
                visited_checkpoints = all_checkpoints.index(
                    most_recently_visited_checkpoint) + 1
        all_chapters_progress.append({
            'exploration_id': exp_id,
            'visited_checkpoints_count': visited_checkpoints,
            'total_checkpoints_count': len(all_checkpoints)
        })

    return all_chapters_progress


def get_multi_users_progress_in_stories(
    user_ids: List[str], story_ids: List[str]
) -> Dict[str, List[story_domain.LearnerGroupSyllabusStorySummaryDict]]:
    """Returns the progress of given users in all given stories.

    Args:
        user_ids: list(str). The user ids of the users.
        story_ids: list(str). The list of story ids.

    Returns:
        Dict(str, list(StoryProgressDict)). Dictionary of user id and their
        corresponding list of story progress dicts.
    """
    all_valid_stories = [
        story for story in get_stories_by_ids(story_ids) if story
    ]

    # Filter unique topic ids from all valid stories.
    topic_ids = list(
        {story.corresponding_topic_id for story in all_valid_stories}
    )
    topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)
    topic_id_to_topic_map = {}
    for topic in topics:
        topic_id_to_topic_map[topic.id] = topic

    story_id_to_story_map = {story.id: story for story in all_valid_stories}
    valid_story_ids = [story.id for story in all_valid_stories]
    all_story_summaries = get_story_summaries_by_ids(valid_story_ids)
    story_id_to_summary_map = {
        summary.id: summary for summary in all_story_summaries
    }

    # All poosible combinations of user_id and story_id for which progress
    # models are returned.
    all_posssible_combinations = itertools.product(user_ids, valid_story_ids)
    progress_models = user_models.StoryProgressModel.get_multi(
        user_ids, valid_story_ids
    )
    all_users_stories_progress: Dict[
        str, List[story_domain.LearnerGroupSyllabusStorySummaryDict]
    ] = {user_id: [] for user_id in user_ids}
    for i, (user_id, story_id) in enumerate(all_posssible_combinations):
        progress_model = progress_models[i]
        completed_node_ids = []
        if progress_model is not None:
            completed_node_ids = progress_model.completed_node_ids
        story = story_id_to_story_map[story_id]
        completed_node_titles = [
            node.title for node in story.story_contents.nodes
            if node.id in completed_node_ids
        ]
        topic = topic_id_to_topic_map[story.corresponding_topic_id]
        summary_dict = story_id_to_summary_map[story_id].to_dict()
        all_users_stories_progress[user_id].append({
            'id': summary_dict['id'],
            'title': summary_dict['title'],
            'description': summary_dict['description'],
            'language_code': summary_dict['language_code'],
            'version': summary_dict['version'],
            'node_titles': summary_dict['node_titles'],
            'thumbnail_filename': summary_dict['thumbnail_filename'],
            'thumbnail_bg_color': summary_dict['thumbnail_bg_color'],
            'url_fragment': summary_dict['url_fragment'],
            'story_model_created_on':
                summary_dict['story_model_created_on'],
            'story_model_last_updated':
                summary_dict['story_model_last_updated'],
            'story_is_published': True,
            'completed_node_titles': completed_node_titles,
            'all_node_dicts': [
                node.to_dict() for node in
                story.story_contents.nodes
            ],
            'topic_name': topic.name,
            'topic_url_fragment': topic.url_fragment,
            'classroom_url_fragment':
                classroom_services.get_classroom_url_fragment_for_topic_id(
                    topic.id),
        })

    return all_users_stories_progress


def get_pending_and_all_nodes_in_story(
    user_id: str, story_id: str
) -> Dict[str, List[story_domain.StoryNode]]:
    """Returns the nodes that are pending in a story

    Args:
        user_id: str. The user id of the user.
        story_id: str. The id of the story.

    Returns:
        Dict[str, List[story_domain.StoryNode]]. The list of story nodes,
        pending for the user.
    """
    story = get_story_by_id(story_id, strict=True)
    pending_nodes = []

    completed_node_ids = get_completed_node_ids(user_id, story_id)
    for node in story.story_contents.nodes:
        if node.id not in completed_node_ids:
            pending_nodes.append(node)

    return {
        'all_nodes': story.story_contents.nodes,
        'pending_nodes': pending_nodes
    }


def get_completed_node_ids(user_id: str, story_id: str) -> List[str]:
    """Returns the ids of the nodes completed in the story.

    Args:
        user_id: str. ID of the given user.
        story_id: str. ID of the story.

    Returns:
        list(str). List of the node ids completed in story.
    """
    progress_model = user_models.StoryProgressModel.get(
        user_id, story_id, strict=False)

    # TODO(#15621): The explicit declaration of type for ndb properties should
    # be removed. Currently, these ndb properties are annotated with Any return
    # type. Once we have proper return type we can remove this.
    if progress_model:
        completed_node_ids: List[str] = progress_model.completed_node_ids
        return completed_node_ids
    else:
        return []


def get_node_index_by_story_id_and_node_id(
    story_id: str, node_id: str
) -> int:
    """Returns the index of the story node with the given story id
    and node id.

    Args:
        story_id: str. ID of the story.
        node_id: str. ID of the story node.

    Returns:
        int. The index of the corresponding node.

    Raises:
        Exception. The given story does not exist.
    """
    story = get_story_by_id(story_id, strict=False)
    if story is None:
        raise Exception('Story with id %s does not exist.' % story_id)

    node_index = story.story_contents.get_node_index(node_id)
    return node_index
