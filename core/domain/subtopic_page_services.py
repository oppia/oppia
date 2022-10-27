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

"""Commands for operations on subtopic pages, and related models."""

from __future__ import annotations

import copy

from core import feconf
from core.domain import change_domain
from core.domain import classroom_services
from core.domain import learner_group_services
from core.domain import skill_services
from core.domain import subtopic_page_domain
from core.domain import topic_fetchers
from core.platform import models

from typing import Dict, List, Literal, Optional, Sequence, overload

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import subtopic_models

(subtopic_models,) = models.Registry.import_models([models.Names.SUBTOPIC])


def _migrate_page_contents_to_latest_schema(
    versioned_page_contents: (
        subtopic_page_domain.VersionedSubtopicPageContentsDict
    )
) -> None:
    """Holds the responsibility of performing a step-by-step, sequential update
    of the page contents structure based on the schema version of the input
    page contents dictionary. If the current page_contents schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_page_contents: dict. A dict with two keys:
          - schema_version: int. The schema version for the page_contents dict.
          - page_contents: dict. The dict comprising the page contents.

    Raises:
        Exception. The schema version of the page_contents is outside of what
            is supported at present.
    """
    page_contents_schema_version = versioned_page_contents['schema_version']
    if not (1 <= page_contents_schema_version
            <= feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d page schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION)

    while (page_contents_schema_version <
           feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        subtopic_page_domain.SubtopicPage.update_page_contents_from_model(
            versioned_page_contents, page_contents_schema_version)
        page_contents_schema_version += 1


def get_subtopic_page_from_model(
    subtopic_page_model: subtopic_models.SubtopicPageModel
) -> subtopic_page_domain.SubtopicPage:
    """Returns a domain object for an SubtopicPage given a subtopic page model.

    Args:
        subtopic_page_model: SubtopicPageModel. The subtopic page model to get
            the corresponding domain object.

    Returns:
        SubtopicPage. The domain object corresponding to the given model object.
    """
    versioned_page_contents: (
        subtopic_page_domain.VersionedSubtopicPageContentsDict
    ) = {
        'schema_version': subtopic_page_model.page_contents_schema_version,
        'page_contents': copy.deepcopy(subtopic_page_model.page_contents)
    }
    if (subtopic_page_model.page_contents_schema_version !=
            feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        _migrate_page_contents_to_latest_schema(versioned_page_contents)
    return subtopic_page_domain.SubtopicPage(
        subtopic_page_model.id,
        subtopic_page_model.topic_id,
        subtopic_page_domain.SubtopicPageContents.from_dict(
            versioned_page_contents['page_contents']),
        versioned_page_contents['schema_version'],
        subtopic_page_model.language_code,
        subtopic_page_model.version
    )


@overload
def get_subtopic_page_by_id(
    topic_id: str, subtopic_id: int
) -> subtopic_page_domain.SubtopicPage: ...


@overload
def get_subtopic_page_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: Literal[True]
) -> subtopic_page_domain.SubtopicPage: ...


@overload
def get_subtopic_page_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: Literal[False]
) -> Optional[subtopic_page_domain.SubtopicPage]: ...


@overload
def get_subtopic_page_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: bool = ...
) -> Optional[subtopic_page_domain.SubtopicPage]: ...


def get_subtopic_page_by_id(
    topic_id: str,
    subtopic_id: int,
    strict: bool = True
) -> Optional[subtopic_page_domain.SubtopicPage]:
    """Returns a domain object representing a subtopic page.

    Args:
        topic_id: str. ID of the topic that the subtopic is a part of.
        subtopic_id: int. The id of the subtopic.
        strict: bool. Whether to fail noisily if no subtopic page with the given
            id exists in the datastore.

    Returns:
        SubtopicPage or None. The domain object representing a subtopic page
        with the given id, or None if it does not exist.
    """
    subtopic_page_id = subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
        topic_id, subtopic_id)
    subtopic_page_model = subtopic_models.SubtopicPageModel.get(
        subtopic_page_id, strict=strict)
    if subtopic_page_model:
        subtopic_page = get_subtopic_page_from_model(subtopic_page_model)
        return subtopic_page
    else:
        return None


def get_subtopic_pages_with_ids(
    topic_id: str,
    subtopic_ids: List[int]
) -> List[Optional[subtopic_page_domain.SubtopicPage]]:
    """Returns a list of domain objects with given ids.

    Args:
        topic_id: str. ID of the topic that the subtopics belong to.
        subtopic_ids: list(int). The ids of the subtopics.

    Returns:
        list(SubtopicPage) or None. The list of domain objects representing the
        subtopic pages corresponding to given ids list or None if none exist.
    """
    subtopic_page_ids = []
    for subtopic_id in subtopic_ids:
        subtopic_page_ids.append(
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id, subtopic_id))
    subtopic_page_models = subtopic_models.SubtopicPageModel.get_multi(
        subtopic_page_ids)
    subtopic_pages: List[Optional[subtopic_page_domain.SubtopicPage]] = []
    for subtopic_page_model in subtopic_page_models:
        if subtopic_page_model is None:
            subtopic_pages.append(subtopic_page_model)
        else:
            subtopic_pages.append(
                get_subtopic_page_from_model(subtopic_page_model))
    return subtopic_pages


@overload
def get_subtopic_page_contents_by_id(
    topic_id: str, subtopic_id: int
) -> subtopic_page_domain.SubtopicPageContents: ...


@overload
def get_subtopic_page_contents_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: Literal[True]
) -> subtopic_page_domain.SubtopicPageContents: ...


@overload
def get_subtopic_page_contents_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: Literal[False]
) -> Optional[subtopic_page_domain.SubtopicPageContents]: ...


def get_subtopic_page_contents_by_id(
    topic_id: str,
    subtopic_id: int,
    strict: bool = True
) -> Optional[subtopic_page_domain.SubtopicPageContents]:
    """Returns the page contents of a subtopic

    Args:
        topic_id: str. ID of the topic that the subtopic belong to.
        subtopic_id: int. The id of the subtopic.
        strict: bool. Whether to fail noisily if no subtopic page with the given
            id exists in the datastore.

    Returns:
        SubtopicPageContents or None. The page contents for a subtopic page,
        or None if subtopic page does not exist.
    """
    subtopic_page = get_subtopic_page_by_id(
        topic_id, subtopic_id, strict=strict)
    if subtopic_page is not None:
        return subtopic_page.page_contents
    else:
        return None


def save_subtopic_page(
    committer_id: str,
    subtopic_page: subtopic_page_domain.SubtopicPage,
    commit_message: Optional[str],
    change_list: Sequence[change_domain.BaseChange]
) -> None:
    """Validates a subtopic page and commits it to persistent storage. If
    successful, increments the version number of the incoming subtopic page
    domain object by 1.

    Args:
        committer_id: str. ID of the given committer.
        subtopic_page: SubtopicPage. The subtopic page domain object to be
            saved.
        commit_message: str|None. The commit description message, for
            unpublished topics, it may be equal to None.
        change_list: list(SubtopicPageChange). List of changes applied to a
            subtopic page.

    Raises:
        Exception. Received invalid change list.
        Exception. The subtopic page model and the incoming subtopic page domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save topic %s: %s' % (subtopic_page.id, change_list))
    subtopic_page.validate()

    subtopic_page_model = subtopic_models.SubtopicPageModel.get(
        subtopic_page.id, strict=False)
    if subtopic_page_model is None:
        subtopic_page_model = subtopic_models.SubtopicPageModel(
            id=subtopic_page.id)
    else:
        if subtopic_page.version > subtopic_page_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of topic '
                'from version %s. Please reload the page and try again.'
                % (subtopic_page_model.version, subtopic_page.version))

        if subtopic_page.version < subtopic_page_model.version:
            raise Exception(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (subtopic_page_model.version, subtopic_page.version))

    subtopic_page_model.topic_id = subtopic_page.topic_id
    subtopic_page_model.page_contents = subtopic_page.page_contents.to_dict()
    subtopic_page_model.language_code = subtopic_page.language_code
    subtopic_page_model.page_contents_schema_version = (
        subtopic_page.page_contents_schema_version)
    change_dicts = [change.to_dict() for change in change_list]
    subtopic_page_model.commit(committer_id, commit_message, change_dicts)
    subtopic_page.version += 1


def delete_subtopic_page(
    committer_id: str,
    topic_id: str,
    subtopic_id: int,
    force_deletion: bool = False
) -> None:
    """Delete a topic summary model.

    Args:
        committer_id: str. The user who is deleting the subtopic page.
        topic_id: str. The ID of the topic that this subtopic belongs to.
        subtopic_id: int. ID of the subtopic which was removed.
        force_deletion: bool. If true, the subtopic page and its history are
            fully deleted and are unrecoverable. Otherwise, the subtopic page
            and all its history are marked as deleted, but the corresponding
            models are still retained in the datastore. This last option is the
            preferred one.
    """
    subtopic_page_id = subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
        topic_id, subtopic_id)
    subtopic_models.SubtopicPageModel.get(subtopic_page_id).delete(
        committer_id, feconf.COMMIT_MESSAGE_SUBTOPIC_PAGE_DELETED,
        force_deletion=force_deletion)
    learner_group_services.remove_subtopic_page_reference_from_learner_groups(
        topic_id, subtopic_id)


def get_topic_ids_from_subtopic_page_ids(
    subtopic_page_ids: List[str]
) -> List[str]:
    """Returns the topic ids corresponding to the given set of subtopic page
    ids.

    Args:
        subtopic_page_ids: list(str). The ids of the subtopic pages.

    Returns:
        list(str). The topic ids corresponding to the given subtopic page ids.
        The returned list of topic ids is deduplicated and ordered
        alphabetically.
    """
    return sorted(list({
        subtopic_page_id.split(':')[0] for subtopic_page_id in
        subtopic_page_ids
    }))


def get_multi_users_subtopic_pages_progress(
    user_ids: List[str],
    subtopic_page_ids: List[str]
) -> Dict[str, List[subtopic_page_domain.SubtopicPageSummaryDict]]:
    """Returns the progress of the given user on the given subtopic pages.

    Args:
        user_ids: list(str). The ids of the users.
        subtopic_page_ids: list(str). The ids of the subtopic pages.

    Returns:
        dict(str, list(SubtopicPageSummaryDict)). User IDs as keys and Subtopic
        Page Summary domain object dictionaries containing details of the
        subtopic page and users mastery in it as values.
    """

    topic_ids = get_topic_ids_from_subtopic_page_ids(subtopic_page_ids)
    topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)

    all_skill_ids_lists = [
        topic.get_all_skill_ids() for topic in topics if topic
    ]
    all_skill_ids = list(
        {
            skill_id for skill_list in all_skill_ids_lists
            for skill_id in skill_list
        }
    )

    all_users_skill_mastery_dicts = (
        skill_services.get_multi_users_skills_mastery(
            user_ids, all_skill_ids
        )
    )

    all_users_subtopic_prog_summaries: Dict[
        str, List[subtopic_page_domain.SubtopicPageSummaryDict]
    ] = {user_id: [] for user_id in user_ids}
    for topic in topics:
        for subtopic in topic.subtopics:
            subtopic_page_id = '{}:{}'.format(topic.id, subtopic.id)
            if subtopic_page_id not in subtopic_page_ids:
                continue
            for user_id, skills_mastery_dict in (
                all_users_skill_mastery_dicts.items()
            ):
                skill_mastery_dict = {
                    skill_id: mastery
                    for skill_id, mastery in skills_mastery_dict.items()
                    if mastery is not None and (
                        skill_id in subtopic.skill_ids
                    )
                }
                subtopic_mastery: Optional[float] = None

                # Subtopic mastery is average of skill masteries.
                if skill_mastery_dict:
                    subtopic_mastery = (
                        sum(skill_mastery_dict.values()) /
                        len(skill_mastery_dict)
                    )

                all_users_subtopic_prog_summaries[user_id].append({
                    'subtopic_id': subtopic.id,
                    'subtopic_title': subtopic.title,
                    'parent_topic_id': topic.id,
                    'parent_topic_name': topic.name,
                    'thumbnail_filename': subtopic.thumbnail_filename,
                    'thumbnail_bg_color': subtopic.thumbnail_bg_color,
                    'subtopic_mastery': subtopic_mastery,
                    'parent_topic_url_fragment': topic.url_fragment,
                    'classroom_url_fragment': (
                        classroom_services
                            .get_classroom_url_fragment_for_topic_id(
                                topic.id))
                })

    return all_users_subtopic_prog_summaries


def get_learner_group_syllabus_subtopic_page_summaries(
    subtopic_page_ids: List[str]
) -> List[subtopic_page_domain.SubtopicPageSummaryDict]:
    """Returns summary dicts corresponding to the given subtopic page ids.

    Args:
        subtopic_page_ids: list(str). The ids of the subtopic pages.

    Returns:
        list(SubtopicPageSummaryDict). The summary dicts corresponding to the
        given subtopic page ids.
    """
    topic_ids = get_topic_ids_from_subtopic_page_ids(subtopic_page_ids)
    topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)

    all_learner_group_subtopic_page_summaries: List[
        subtopic_page_domain.SubtopicPageSummaryDict
    ] = []
    for topic in topics:
        for subtopic in topic.subtopics:
            subtopic_page_id = '{}:{}'.format(topic.id, subtopic.id)
            if subtopic_page_id not in subtopic_page_ids:
                continue
            all_learner_group_subtopic_page_summaries.append({
                'subtopic_id': subtopic.id,
                'subtopic_title': subtopic.title,
                'parent_topic_id': topic.id,
                'parent_topic_name': topic.name,
                'thumbnail_filename': subtopic.thumbnail_filename,
                'thumbnail_bg_color': subtopic.thumbnail_bg_color,
                'subtopic_mastery': None,
                'parent_topic_url_fragment': topic.url_fragment,
                'classroom_url_fragment': None
            })

    return all_learner_group_subtopic_page_summaries
