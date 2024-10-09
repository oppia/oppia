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

from __future__ import annotations

import collections
import itertools
import logging

from core import feature_flag_list
from core import feconf
from core import utils
from core.constants import constants
from core.domain import caching_services
from core.domain import change_domain
from core.domain import feature_flag_services
from core.domain import feedback_services
from core.domain import fs_services
from core.domain import opportunity_services
from core.domain import rights_domain
from core.domain import role_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import user_domain
from core.domain import user_services
from core.platform import models

from typing import Dict, List, Optional, Sequence, Tuple, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import topic_models

(topic_models,) = models.Registry.import_models([models.Names.TOPIC])


def _create_topic(
    committer_id: str,
    topic: topic_domain.Topic,
    commit_message: str,
    commit_cmds: List[topic_domain.TopicChange]
) -> None:
    """Creates a new topic, and ensures that rights for a new topic
    are saved first.

    Args:
        committer_id: str. ID of the committer.
        topic: Topic. Topic domain object.
        commit_message: str. A description of changes made to the topic.
        commit_cmds: list(TopicChange). A list of TopicChange objects that
            represent change commands made to the given topic.
    """
    topic.validate()
    if does_topic_with_name_exist(topic.name):
        raise utils.ValidationError(
            'Topic with name \'%s\' already exists' % topic.name)
    if does_topic_with_url_fragment_exist(topic.url_fragment):
        raise utils.ValidationError(
            'Topic with URL Fragment \'%s\' already exists'
            % topic.url_fragment)
    create_new_topic_rights(topic.id, committer_id)
    model = topic_models.TopicModel(
        id=topic.id,
        name=topic.name,
        abbreviated_name=topic.abbreviated_name,
        url_fragment=topic.url_fragment,
        thumbnail_bg_color=topic.thumbnail_bg_color,
        thumbnail_filename=topic.thumbnail_filename,
        thumbnail_size_in_bytes=topic.thumbnail_size_in_bytes,
        canonical_name=topic.canonical_name,
        description=topic.description,
        language_code=topic.language_code,
        canonical_story_references=[
            reference.to_dict()
            for reference in topic.canonical_story_references],
        additional_story_references=[
            reference.to_dict()
            for reference in topic.additional_story_references],
        uncategorized_skill_ids=topic.uncategorized_skill_ids,
        subtopic_schema_version=topic.subtopic_schema_version,
        story_reference_schema_version=topic.story_reference_schema_version,
        next_subtopic_id=topic.next_subtopic_id,
        subtopics=[subtopic.to_dict() for subtopic in topic.subtopics],
        meta_tag_content=topic.meta_tag_content,
        practice_tab_is_displayed=topic.practice_tab_is_displayed,
        page_title_fragment_for_web=topic.page_title_fragment_for_web,
        skill_ids_for_diagnostic_test=topic.skill_ids_for_diagnostic_test
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    topic.version += 1
    generate_topic_summary(topic.id)


def does_topic_with_name_exist(topic_name: str) -> bool:
    """Checks if the topic with provided name exists.

    Args:
        topic_name: str. The topic name.

    Returns:
        bool. Whether the the topic name exists.

    Raises:
        Exception. Topic name is not a string.
    """
    if not isinstance(topic_name, str):
        raise utils.ValidationError('Name should be a string.')
    existing_topic = topic_fetchers.get_topic_by_name(topic_name)
    return existing_topic is not None


def does_topic_with_url_fragment_exist(url_fragment: str) -> bool:
    """Checks if topic with provided url fragment exists.

    Args:
        url_fragment: str. The url fragment for the topic.

    Returns:
        bool. Whether the the url fragment for the topic exists.

    Raises:
        Exception. Topic URL fragment is not a string.
    """
    if not isinstance(url_fragment, str):
        raise utils.ValidationError('Topic URL fragment should be a string.')
    existing_topic = (
        topic_fetchers.get_topic_by_url_fragment(url_fragment))
    return existing_topic is not None


def save_new_topic(committer_id: str, topic: topic_domain.Topic) -> None:
    """Saves a new topic.

    Args:
        committer_id: str. ID of the committer.
        topic: Topic. Topic to be saved.
    """
    commit_message = (
        'New topic created with name \'%s\'.' % topic.name)
    _create_topic(
        committer_id, topic, commit_message, [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': topic.name
        })])


def apply_change_list(
    topic_id: str, change_list: Sequence[change_domain.BaseChange]
) -> Tuple[
    topic_domain.Topic,
    Dict[str, subtopic_page_domain.SubtopicPage],
    List[int],
    List[int],
    Dict[str, List[subtopic_page_domain.SubtopicPageChange]]
]:
    """Applies a changelist to a topic and returns the result. The incoming
    changelist should not have simultaneuous creations and deletion of
    subtopics.

    Args:
        topic_id: str. ID of the given topic.
        change_list: list(TopicChange). A change list to be applied to the given
            topic.

    Raises:
        Exception. The incoming changelist had simultaneous creation and
            deletion of subtopics.

    Returns:
        tuple(Topic, dict, list(int), list(int), list(SubtopicPageChange)). The
        modified topic object, the modified subtopic pages dict keyed
        by subtopic page id containing the updated domain objects of
        each subtopic page, a list of ids of the deleted subtopics,
        a list of ids of the newly created subtopics and a list of changes
        applied to modified subtopic pages.
    """
    topic = topic_fetchers.get_topic_by_id(topic_id)
    newly_created_subtopic_ids: List[int] = []
    existing_subtopic_page_ids_to_be_modified: List[int] = []
    deleted_subtopic_ids: List[int] = []
    modified_subtopic_pages_list: List[
        Optional[subtopic_page_domain.SubtopicPage]
    ] = []
    modified_subtopic_pages: Dict[str, subtopic_page_domain.SubtopicPage] = {}
    modified_subtopic_change_cmds: Dict[
        str, List[subtopic_page_domain.SubtopicPageChange]
    ] = collections.defaultdict(list)

    for change in change_list:
        if (change.cmd ==
                subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY):
            # Here we use cast because we are narrowing down the type from
            # TopicChange to a specific change command.
            update_subtopic_page_property_cmd = cast(
                subtopic_page_domain.UpdateSubtopicPagePropertyCmd,
                change
            )
            if (
                update_subtopic_page_property_cmd.subtopic_id <
                topic.next_subtopic_id
            ):
                existing_subtopic_page_ids_to_be_modified.append(
                    update_subtopic_page_property_cmd.subtopic_id)
                subtopic_page_id = (
                    subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                        topic_id, update_subtopic_page_property_cmd.subtopic_id
                    )
                )
                modified_subtopic_change_cmds[subtopic_page_id].append(
                    update_subtopic_page_property_cmd)
    modified_subtopic_pages_list = (
        subtopic_page_services.get_subtopic_pages_with_ids(
            topic_id, existing_subtopic_page_ids_to_be_modified))
    for subtopic_page in modified_subtopic_pages_list:
        # Ruling out the possibility of None for mypy type checking.
        assert subtopic_page is not None
        modified_subtopic_pages[subtopic_page.id] = subtopic_page

    try:
        for change in change_list:
            if change.cmd == topic_domain.CMD_ADD_SUBTOPIC:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                add_subtopic_cmd = cast(
                    topic_domain.AddSubtopicCmd, change
                )
                topic.add_subtopic(
                    add_subtopic_cmd.subtopic_id,
                    add_subtopic_cmd.title,
                    add_subtopic_cmd.url_fragment
                )
                subtopic_page_id = (
                    subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                        topic_id, add_subtopic_cmd.subtopic_id))
                modified_subtopic_pages[subtopic_page_id] = (
                    subtopic_page_domain.SubtopicPage.create_default_subtopic_page( # pylint: disable=line-too-long
                        add_subtopic_cmd.subtopic_id, topic_id)
                )
                modified_subtopic_change_cmds[subtopic_page_id].append(
                    subtopic_page_domain.SubtopicPageChange({
                        'cmd': 'create_new',
                        'topic_id': topic_id,
                        'subtopic_id': add_subtopic_cmd.subtopic_id
                    }))
                newly_created_subtopic_ids.append(add_subtopic_cmd.subtopic_id)
            elif change.cmd == topic_domain.CMD_DELETE_SUBTOPIC:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                delete_subtopic_cmd = cast(
                    topic_domain.DeleteSubtopicCmd, change
                )
                topic.delete_subtopic(delete_subtopic_cmd.subtopic_id)
                if (
                    delete_subtopic_cmd.subtopic_id in
                    newly_created_subtopic_ids
                ):
                    raise Exception(
                        'The incoming changelist had simultaneous'
                        ' creation and deletion of subtopics.')
                deleted_subtopic_ids.append(delete_subtopic_cmd.subtopic_id)
            elif change.cmd == topic_domain.CMD_ADD_CANONICAL_STORY:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                add_canonical_story_cmd = cast(
                    topic_domain.AddCanonicalStoryCmd, change
                )
                topic.add_canonical_story(add_canonical_story_cmd.story_id)
            elif change.cmd == topic_domain.CMD_DELETE_CANONICAL_STORY:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                delete_canonical_story_cmd = cast(
                    topic_domain.DeleteCanonicalStoryCmd, change
                )
                topic.delete_canonical_story(
                    delete_canonical_story_cmd.story_id
                )
            elif change.cmd == topic_domain.CMD_REARRANGE_CANONICAL_STORY:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                rearrange_canonical_story_cmd = cast(
                    topic_domain.RearrangeCanonicalStoryCmd, change
                )
                topic.rearrange_canonical_story(
                    rearrange_canonical_story_cmd.from_index,
                    rearrange_canonical_story_cmd.to_index
                )
            elif change.cmd == topic_domain.CMD_ADD_ADDITIONAL_STORY:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                add_additional_story_cmd = cast(
                    topic_domain.AddAdditionalStoryCmd, change
                )
                topic.add_additional_story(add_additional_story_cmd.story_id)
            elif change.cmd == topic_domain.CMD_DELETE_ADDITIONAL_STORY:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                delete_additional_story_cmd = cast(
                    topic_domain.DeleteAdditionalStoryCmd, change
                )
                topic.delete_additional_story(
                    delete_additional_story_cmd.story_id
                )
            elif change.cmd == topic_domain.CMD_ADD_UNCATEGORIZED_SKILL_ID:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                add_uncategorized_skill_id_cmd = cast(
                    topic_domain.AddUncategorizedSkillIdCmd,
                    change
                )
                topic.add_uncategorized_skill_id(
                    add_uncategorized_skill_id_cmd.new_uncategorized_skill_id
                )
            elif change.cmd == topic_domain.CMD_REMOVE_UNCATEGORIZED_SKILL_ID:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                remove_uncategorized_skill_id_cmd = cast(
                    topic_domain.RemoveUncategorizedSkillIdCmd,
                    change
                )
                topic.remove_uncategorized_skill_id(
                    remove_uncategorized_skill_id_cmd.uncategorized_skill_id
                )
            elif change.cmd == topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                move_skill_id_to_subtopic_cmd = cast(
                    topic_domain.MoveSkillIdToSubtopicCmd,
                    change
                )
                topic.move_skill_id_to_subtopic(
                    move_skill_id_to_subtopic_cmd.old_subtopic_id,
                    move_skill_id_to_subtopic_cmd.new_subtopic_id,
                    move_skill_id_to_subtopic_cmd.skill_id
                )
            elif change.cmd == topic_domain.CMD_REARRANGE_SKILL_IN_SUBTOPIC:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                rearrange_skill_in_subtopic_cmd = cast(
                    topic_domain.RearrangeSkillInSubtopicCmd, change
                )
                topic.rearrange_skill_in_subtopic(
                    rearrange_skill_in_subtopic_cmd.subtopic_id,
                    rearrange_skill_in_subtopic_cmd.from_index,
                    rearrange_skill_in_subtopic_cmd.to_index
                )
            elif change.cmd == topic_domain.CMD_REARRANGE_SUBTOPIC:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                rearrange_subtopic_cmd = cast(
                    topic_domain.RearrangeSubtopicCmd, change
                )
                topic.rearrange_subtopic(
                    rearrange_subtopic_cmd.from_index,
                    rearrange_subtopic_cmd.to_index
                )
            elif change.cmd == topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                remove_skill_id_from_subtopic_cmd = cast(
                    topic_domain.RemoveSkillIdFromSubtopicCmd, change
                )
                topic.remove_skill_id_from_subtopic(
                    remove_skill_id_from_subtopic_cmd.subtopic_id,
                    remove_skill_id_from_subtopic_cmd.skill_id
                )
            elif change.cmd == topic_domain.CMD_UPDATE_TOPIC_PROPERTY:
                if (change.property_name ==
                        topic_domain.TOPIC_PROPERTY_NAME):
                    # Here we use cast because this 'if' condition forces
                    # change to have type UpdateTopicPropertyNameCmd.
                    update_topic_name_cmd = cast(
                        topic_domain.UpdateTopicPropertyNameCmd,
                        change
                    )
                    topic.update_name(update_topic_name_cmd.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_ABBREVIATED_NAME):
                    # Here we use cast because this 'elif' condition forces
                    # change to have type UpdateTopicPropertyAbbreviatedNameCmd.
                    update_abbreviated_name_cmd = cast(
                        topic_domain.UpdateTopicPropertyAbbreviatedNameCmd,
                        change
                    )
                    topic.update_abbreviated_name(
                        update_abbreviated_name_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_URL_FRAGMENT):
                    # Here we use cast because this 'elif' condition forces
                    # change to have type UpdateTopicPropertyUrlFragmentCmd.
                    update_url_fragment_cmd = cast(
                        topic_domain.UpdateTopicPropertyUrlFragmentCmd,
                        change
                    )
                    topic.update_url_fragment(update_url_fragment_cmd.new_value)
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_DESCRIPTION):
                    # Here we use cast because this 'elif' condition forces
                    # change to have type UpdateTopicPropertyDescriptionCmd.
                    update_topic_description_cmd = cast(
                        topic_domain.UpdateTopicPropertyDescriptionCmd,
                        change
                    )
                    topic.update_description(
                        update_topic_description_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE):
                    # Here we use cast because this 'elif' condition forces
                    # change to have type UpdateTopicPropertyLanguageCodeCmd.
                    update_topic_language_code_cmd = cast(
                        topic_domain.UpdateTopicPropertyLanguageCodeCmd,
                        change
                    )
                    topic.update_language_code(
                        update_topic_language_code_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_THUMBNAIL_FILENAME):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateTopicPropertyThumbnailFilenameCmd.
                    update_topic_thumbnail_filename_cmd = cast(
                        topic_domain.UpdateTopicPropertyThumbnailFilenameCmd,
                        change
                    )
                    update_thumbnail_filename(
                        topic, update_topic_thumbnail_filename_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_THUMBNAIL_BG_COLOR):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateTopicPropertyThumbnailBGColorCmd.
                    update_topic_thumbnail_bg_color_cmd = cast(
                        topic_domain.UpdateTopicPropertyThumbnailBGColorCmd,
                        change
                    )
                    topic.update_thumbnail_bg_color(
                        update_topic_thumbnail_bg_color_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_META_TAG_CONTENT):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateTopicPropertyMetaTagContentCmd.
                    update_topic_meta_tag_content_cmd = cast(
                        topic_domain.UpdateTopicPropertyMetaTagContentCmd,
                        change
                    )
                    topic.update_meta_tag_content(
                        update_topic_meta_tag_content_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateTopicPropertyPracticeTabIsDisplayedCmd.
                    update_practice_tab_is_displayed_cmd = cast(
                        topic_domain.UpdateTopicPropertyPracticeTabIsDisplayedCmd,  # pylint: disable=line-too-long
                        change
                    )
                    topic.update_practice_tab_is_displayed(
                        update_practice_tab_is_displayed_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain.TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateTopicPropertyTitleFragmentForWebCmd.
                    update_title_fragment_for_web_cmd = cast(
                        topic_domain.UpdateTopicPropertyTitleFragmentForWebCmd,
                        change
                    )
                    topic.update_page_title_fragment_for_web(
                        update_title_fragment_for_web_cmd.new_value
                    )
                elif (change.property_name ==
                      topic_domain
                      .TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateTopicPropertySkillIdsForDiagnosticTestCmd.
                    update_skill_ids_for_diagnostic_test_cmd = cast(
                        topic_domain.UpdateTopicPropertySkillIdsForDiagnosticTestCmd,  # pylint: disable=line-too-long
                        change
                    )
                    topic.update_skill_ids_for_diagnostic_test(
                        update_skill_ids_for_diagnostic_test_cmd.new_value
                    )
            elif (change.cmd ==
                  subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY):
                # Ruling out the possibility of any other type for mypy
                # type checking.
                assert isinstance(change.subtopic_id, int)
                subtopic_page_id = (
                    subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                        topic_id, change.subtopic_id))
                if ((modified_subtopic_pages[subtopic_page_id] is None) or
                        (change.subtopic_id in deleted_subtopic_ids)):
                    raise Exception(
                        'The subtopic with id %s doesn\'t exist' % (
                            change.subtopic_id))

                if (change.property_name ==
                        subtopic_page_domain.
                        SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML):
                    # Here we use cast because this 'if'
                    # condition forces change to have type
                    # UpdateSubtopicPagePropertyPageContentsHtmlCmd.
                    update_subtopic_page_contents_html_cmd = cast(
                        subtopic_page_domain.UpdateSubtopicPagePropertyPageContentsHtmlCmd,  # pylint: disable=line-too-long
                        change
                    )
                    page_contents = state_domain.SubtitledHtml.from_dict(
                        update_subtopic_page_contents_html_cmd.new_value)
                    page_contents.validate()
                    modified_subtopic_pages[
                        subtopic_page_id].update_page_contents_html(
                            page_contents)

                elif (change.property_name ==
                      subtopic_page_domain.
                      SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateSubtopicPagePropertyPageContentsAudioCmd.
                    update_subtopic_page_contents_audio_cmd = cast(
                        subtopic_page_domain.UpdateSubtopicPagePropertyPageContentsAudioCmd,  # pylint: disable=line-too-long
                        change
                    )
                    modified_subtopic_pages[
                        subtopic_page_id].update_page_contents_audio(
                            state_domain.RecordedVoiceovers.from_dict(
                               update_subtopic_page_contents_audio_cmd.new_value
                            )
                        )
            elif change.cmd == topic_domain.CMD_UPDATE_SUBTOPIC_PROPERTY:
                # Here we use cast because we are narrowing down the type from
                # TopicChange to a specific change command.
                update_subtopic_property_cmd = cast(
                    topic_domain.UpdateSubtopicPropertyCmd,
                    change
                )
                if (update_subtopic_property_cmd.property_name ==
                        topic_domain.SUBTOPIC_PROPERTY_TITLE):
                    topic.update_subtopic_title(
                        update_subtopic_property_cmd.subtopic_id,
                        update_subtopic_property_cmd.new_value
                    )
                if (update_subtopic_property_cmd.property_name ==
                        topic_domain.SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME):
                    update_subtopic_thumbnail_filename(
                        topic, update_subtopic_property_cmd.subtopic_id,
                        update_subtopic_property_cmd.new_value
                    )
                if (update_subtopic_property_cmd.property_name ==
                        topic_domain.SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR):
                    topic.update_subtopic_thumbnail_bg_color(
                        update_subtopic_property_cmd.subtopic_id,
                        update_subtopic_property_cmd.new_value
                    )
                if (update_subtopic_property_cmd.property_name ==
                        topic_domain.SUBTOPIC_PROPERTY_URL_FRAGMENT):
                    topic.update_subtopic_url_fragment(
                        update_subtopic_property_cmd.subtopic_id,
                        update_subtopic_property_cmd.new_value
                    )

            elif (
                    change.cmd ==
                    topic_domain.CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION):
                # Loading the topic model from the datastore into a
                # Topic domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # topic is sufficient to apply the schema migration.
                continue
        return (
            topic, modified_subtopic_pages, deleted_subtopic_ids,
            newly_created_subtopic_ids, modified_subtopic_change_cmds)

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, topic_id, change_list)
        )
        raise e


def _save_topic(
    committer_id: str,
    topic: topic_domain.Topic,
    commit_message: Optional[str],
    change_list: Sequence[change_domain.BaseChange]
) -> None:
    """Validates a topic and commits it to persistent storage. If
    successful, increments the version number of the incoming topic domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        topic: Topic. The topic domain object to be saved.
        commit_message: str|None. The commit description message, for
            unpublished topics, it may be equal to None.
        change_list: list(TopicChange). List of changes applied to a topic.

    Raises:
        Exception. Received invalid change list.
        Exception. The topic model and the incoming topic domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save topic %s: %s' % (topic.id, change_list))
    topic_rights = topic_fetchers.get_topic_rights(topic.id, strict=True)
    topic.validate(strict=topic_rights.topic_is_published)

    topic_model = topic_models.TopicModel.get(topic.id, strict=True)

    # Topic model cannot be None as topic is passed as parameter here and that
    # is only possible if a topic model with that topic id exists. Also this is
    # a private function and so it cannot be called independently with any
    # topic object.
    if topic.version > topic_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of topic '
            'from version %s. Please reload the page and try again.'
            % (topic_model.version, topic.version))
    if topic.version < topic_model.version:
        raise Exception(
            'Trying to update version %s of topic from version %s, '
            'which is too old. Please reload the page and try again.'
            % (topic_model.version, topic.version))

    topic_model_to_commit = populate_topic_model_fields(topic_model, topic)
    change_dicts = [change.to_dict() for change in change_list]
    topic_model_to_commit.commit(committer_id, commit_message, change_dicts)
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_TOPIC, None, [topic.id])
    topic.version += 1


def update_topic_and_subtopic_pages(
    committer_id: str,
    topic_id: str,
    change_list: Sequence[change_domain.BaseChange],
    commit_message: Optional[str]
) -> None:
    """Updates a topic and its subtopic pages. Commits changes.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        topic_id: str. The topic id.
        change_list: list(TopicChange and SubtopicPageChange). These changes are
            applied in sequence to produce the resulting topic.
        commit_message: str or None. A description of changes made to the
            topic.

    Raises:
        ValueError. Current user does not have enough rights to edit a topic.
    """
    topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=True)
    if topic_rights.topic_is_published and not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')

    old_topic = topic_fetchers.get_topic_by_id(topic_id)
    (
        updated_topic, updated_subtopic_pages_dict,
        deleted_subtopic_ids, newly_created_subtopic_ids,
        updated_subtopic_pages_change_cmds_dict
    ) = apply_change_list(topic_id, change_list)

    if (
            old_topic.url_fragment != updated_topic.url_fragment and
            does_topic_with_url_fragment_exist(updated_topic.url_fragment)):
        raise utils.ValidationError(
            'Topic with URL Fragment \'%s\' already exists'
            % updated_topic.url_fragment)
    if (
            old_topic.name != updated_topic.name and
            does_topic_with_name_exist(updated_topic.name)):
        raise utils.ValidationError(
            'Topic with name \'%s\' already exists' % updated_topic.name)

    _save_topic(
        committer_id, updated_topic, commit_message, change_list
    )
    # The following loop deletes those subtopic pages that are already in the
    # datastore, which are supposed to be deleted in the current changelist.
    for subtopic_id in deleted_subtopic_ids:
        if subtopic_id not in newly_created_subtopic_ids:
            subtopic_page_services.delete_subtopic_page(
                committer_id, topic_id, subtopic_id)

    for subtopic_page_id, subtopic_page in updated_subtopic_pages_dict.items():
        subtopic_page_change_list = updated_subtopic_pages_change_cmds_dict[
            subtopic_page_id]
        subtopic_id = subtopic_page.get_subtopic_id_from_subtopic_page_id()
        # The following condition prevents the creation of subtopic pages that
        # were deleted above.
        if subtopic_id not in deleted_subtopic_ids:
            subtopic_page_services.save_subtopic_page(
                committer_id, subtopic_page, commit_message,
                subtopic_page_change_list)
    generate_topic_summary(topic_id)

    if old_topic.name != updated_topic.name:
        opportunity_services.update_opportunities_with_new_topic_name(
            updated_topic.id, updated_topic.name)


def delete_uncategorized_skill(
    user_id: str,
    topic_id: str,
    uncategorized_skill_id: str
) -> None:
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


def add_uncategorized_skill(
    user_id: str,
    topic_id: str,
    uncategorized_skill_id: str
) -> None:
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


def publish_story(
    topic_id: str,
    story_id: str,
    committer_id: str
) -> None:
    """Marks the given story as published.

    Args:
        topic_id: str. The id of the topic.
        story_id: str. The id of the given story.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given story does not exist.
        Exception. The story is already published.
        Exception. The user does not have enough rights to publish the story.
    """
    def _are_nodes_valid_for_publishing(
        story_nodes: List[story_domain.StoryNode]
    ) -> None:
        """Validates the story nodes before publishing.

        Args:
            story_nodes: list(dict(str, *)). The list of story nodes dicts.

        Raises:
            Exception. The exploration id is invalid or corresponds to an
                exploration which isn't published yet.
        """
        exploration_id_list = []
        for node in story_nodes:
            assert node.exploration_id is not None
            exploration_id_list.append(node.exploration_id)
        story_services.validate_explorations_for_story(
            exploration_id_list, True)

    topic = topic_fetchers.get_topic_by_id(topic_id, strict=True)
    user = user_services.get_user_actions_info(committer_id)
    if role_services.ACTION_CHANGE_STORY_STATUS not in user.actions:
        raise Exception(
            'The user does not have enough rights to publish the story.')

    story = story_fetchers.get_story_by_id(story_id, strict=False)
    if story is None:
        raise Exception('A story with the given ID doesn\'t exist')
    for node in story.story_contents.nodes:
        if node.id == story.story_contents.initial_node_id:
            _are_nodes_valid_for_publishing([node])

    serial_chapter_curriculum_admin_view_feature_is_enabled = (
        feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames
            .SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW.value,
            None)
    )
    if not serial_chapter_curriculum_admin_view_feature_is_enabled:
        chapters_change_list = []
        for node in story.story_contents.nodes:
            chapters_change_list.append(story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'node_id': node.id,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_STATUS),
                'old_value': node.status,
                'new_value': constants.STORY_NODE_STATUS_PUBLISHED
            }))

        if chapters_change_list:
            update_story_and_topic_summary(
                committer_id, story_id, chapters_change_list,
                'Published the story.', topic.id)

    topic.publish_story(story_id)
    change_list = [topic_domain.TopicChange({
        'cmd': topic_domain.CMD_PUBLISH_STORY,
        'story_id': story_id
    })]
    _save_topic(
        committer_id, topic, 'Published story with id %s' % story_id,
        change_list)
    generate_topic_summary(topic.id)
    # Create exploration opportunities corresponding to the story and linked
    # explorations.
    linked_exp_ids = story.story_contents.get_all_linked_exp_ids()
    opportunity_services.add_new_exploration_opportunities(
        story_id, linked_exp_ids)


def unpublish_story(
    topic_id: str, story_id: str, committer_id: str
) -> None:
    """Marks the given story as unpublished.

    Args:
        topic_id: str. The id of the topic.
        story_id: str. The id of the given story.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given story does not exist.
        Exception. The story is already unpublished.
        Exception. The user does not have enough rights to unpublish the story.
    """
    user = user_services.get_user_actions_info(committer_id)
    if role_services.ACTION_CHANGE_STORY_STATUS not in user.actions:
        raise Exception(
            'The user does not have enough rights to unpublish the story.')
    topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
    if topic is None:
        raise Exception('A topic with the given ID doesn\'t exist')
    story = story_fetchers.get_story_by_id(story_id, strict=False)
    if story is None:
        raise Exception('A story with the given ID doesn\'t exist')

    serial_chapter_curriculum_admin_view_feature_is_enabled = (
        feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames
            .SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW.value,
            None)
    )
    if not serial_chapter_curriculum_admin_view_feature_is_enabled:
        chapters_change_list = []
        for node in story.story_contents.nodes:
            chapters_change_list.append(story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'node_id': node.id,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_STATUS),
                'old_value': node.status,
                'new_value': constants.STORY_NODE_STATUS_DRAFT
            }))

        if chapters_change_list:
            update_story_and_topic_summary(
                committer_id, story_id, chapters_change_list,
                'Unpublished the story.', topic.id)

    topic.unpublish_story(story_id)
    change_list = [topic_domain.TopicChange({
        'cmd': topic_domain.CMD_UNPUBLISH_STORY,
        'story_id': story_id
    })]
    _save_topic(
        committer_id, topic, 'Unpublished story with id %s' % story_id,
        change_list)
    generate_topic_summary(topic.id)

    # Delete corresponding exploration opportunities and reject associated
    # translation suggestions.
    exp_ids = story.story_contents.get_all_linked_exp_ids()
    opportunity_services.delete_exploration_opportunities(exp_ids)
    suggestion_services.auto_reject_translation_suggestions_for_exp_ids(exp_ids)


def delete_canonical_story(
    user_id: str, topic_id: str, story_id: str
) -> None:
    """Removes story with given id from the topic.

    NOTE TO DEVELOPERS: Presently, this function only removes story_reference
    from canonical_story_references list.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic from which to remove the story.
        story_id: str. The story to remove from the topic.
    """
    change_list = [topic_domain.TopicChange({
        'cmd': topic_domain.CMD_DELETE_CANONICAL_STORY,
        'story_id': story_id
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Removed %s from canonical story ids' % story_id)


def add_canonical_story(
    user_id: str, topic_id: str, story_id: str
) -> None:
    """Adds a story to the canonical story reference list of a topic.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic to which the story is to be added.
        story_id: str. The story to add to the topic.
    """
    change_list = [topic_domain.TopicChange({
        'cmd': topic_domain.CMD_ADD_CANONICAL_STORY,
        'story_id': story_id
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Added %s to canonical story ids' % story_id)


def delete_additional_story(
    user_id: str, topic_id: str, story_id: str
) -> None:
    """Removes story with given id from the topic.

    NOTE TO DEVELOPERS: Presently, this function only removes story_reference
    from additional_story_references list.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic from which to remove the story.
        story_id: str. The story to remove from the topic.
    """
    change_list = [topic_domain.TopicChange({
        'cmd': topic_domain.CMD_DELETE_ADDITIONAL_STORY,
        'story_id': story_id
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Removed %s from additional story ids' % story_id)


def add_additional_story(
    user_id: str, topic_id: str, story_id: str
) -> None:
    """Adds a story to the additional story reference list of a topic.

    Args:
        user_id: str. The id of the user who is performing the action.
        topic_id: str. The id of the topic to which the story is to be added.
        story_id: str. The story to add to the topic.
    """
    change_list = [topic_domain.TopicChange({
        'cmd': topic_domain.CMD_ADD_ADDITIONAL_STORY,
        'story_id': story_id
    })]
    update_topic_and_subtopic_pages(
        user_id, topic_id, change_list,
        'Added %s to additional story ids' % story_id)


def delete_topic(
    committer_id: str, topic_id: str, force_deletion: bool = False
) -> None:
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
        ValueError. User does not have enough rights to delete a topic.
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

    all_story_references = (
        topic_model.canonical_story_references +
        topic_model.additional_story_references)
    for story_reference in all_story_references:
        story_services.delete_story(
            committer_id, story_reference['story_id'],
            force_deletion=force_deletion)
    topic_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_TOPIC_DELETED,
        force_deletion=force_deletion)

    feedback_services.delete_threads_for_multiple_entities(
        feconf.ENTITY_TYPE_TOPIC, [topic_id])

    # This must come after the topic is retrieved. Otherwise the memcache
    # key will be reinstated.
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_TOPIC, None, [topic_id])
    (
        opportunity_services
        .delete_exploration_opportunities_corresponding_to_topic(topic_id))


def delete_topic_summary(topic_id: str) -> None:
    """Delete a topic summary model.

    Args:
        topic_id: str. ID of the topic whose topic summary is to
            be deleted.
    """

    topic_models.TopicSummaryModel.get(topic_id).delete()


def update_story_and_topic_summary(
    committer_id: str,
    story_id: str,
    change_list: List[story_domain.StoryChange],
    commit_message: str,
    topic_id: str
) -> None:
    """Updates a story. Commits changes. Then generates a new
    topic summary.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        story_id: str. The story id.
        change_list: list(StoryChange). These changes are applied in sequence to
            produce the resulting story.
        commit_message: str. A description of changes made to the
            story.
        topic_id: str. The id of the topic to which the story is belongs.
    """
    story_services.update_story(
        committer_id, story_id, change_list, commit_message)
    # Generate new TopicSummary after a Story has been updated to
    # make sure the TopicSummaryTile displays the correct number
    # of chapters on the classroom page.
    generate_topic_summary(topic_id)


def generate_topic_summary(topic_id: str) -> None:
    """Creates and stores a summary of the given topic.

    Args:
        topic_id: str. ID of the topic.
    """
    topic = topic_fetchers.get_topic_by_id(topic_id)
    topic_summary = compute_summary_of_topic(topic)
    save_topic_summary(topic_summary)


def compute_summary_of_topic(
    topic: topic_domain.Topic
) -> topic_domain.TopicSummary:
    """Create a TopicSummary domain object for a given Topic domain
    object and return it.

    Args:
        topic: Topic. The topic object for which the summary is to be computed.

    Returns:
        TopicSummary. The computed summary for the given topic.

    Raises:
        Exception. No data available for when the topic was last updated.
    """
    canonical_story_count = 0
    additional_story_count = 0
    published_canonical_story_ids = []
    for reference in topic.canonical_story_references:
        if reference.story_is_published:
            canonical_story_count += 1
            published_canonical_story_ids.append(reference.story_id)

    published_additional_story_ids = []
    for reference in topic.additional_story_references:
        if reference.story_is_published:
            additional_story_count += 1
            published_additional_story_ids.append(reference.story_id)
    topic_model_canonical_story_count = canonical_story_count
    topic_model_additional_story_count = additional_story_count
    topic_model_uncategorized_skill_count = len(topic.uncategorized_skill_ids)
    topic_model_subtopic_count = len(topic.subtopics)

    published_stories_query_result = story_fetchers.get_stories_by_ids(
        published_canonical_story_ids + published_additional_story_ids,
        strict=False)
    published_stories = [
        story for story in published_stories_query_result
        if story is not None]
    topic_model_published_story_exploration_mapping: Dict[str, List[str]] = (
        _compute_story_exploration_mapping(published_stories))

    total_published_node_count = 0
    for story in published_stories:
        if story.id in published_canonical_story_ids:
            total_published_node_count += (
                story.story_contents.get_published_node_count()
                if feature_flag_services.is_feature_flag_enabled(
                    feature_flag_list.FeatureNames
                    .SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW.value,
                    None)
                else len(story.story_contents.nodes))
    topic_model_published_node_count = total_published_node_count

    total_skill_count = topic_model_uncategorized_skill_count
    for subtopic in topic.subtopics:
        total_skill_count += len(subtopic.skill_ids)

    if topic.created_on is None or topic.last_updated is None:
        raise Exception(
            'No data available for when the topic was last updated.'
        )
    topic_summary = topic_domain.TopicSummary(
        topic.id, topic.name, topic.canonical_name, topic.language_code,
        topic.description, topic.version, topic_model_canonical_story_count,
        topic_model_additional_story_count,
        topic_model_uncategorized_skill_count, topic_model_subtopic_count,
        total_skill_count, topic_model_published_node_count,
        topic.thumbnail_filename, topic.thumbnail_bg_color, topic.url_fragment,
        topic_model_published_story_exploration_mapping, topic.created_on,
        topic.last_updated
    )

    return topic_summary


def _compute_story_exploration_mapping(
    stories: List[story_domain.Story]
) -> Dict[str, List[str]]:
    """Returns a mapping from each story id to a list of its linked
    exploration ids.

    Args:
        stories: list(Story). A list of stories to reference in the mapping.

    Returns:
        dict(str, list(str)). A mapping whose keys are story ids and whose
        values are lists of exploration ids linked to the corresponding story.
    """
    mapping: Dict[str, List[str]] = {}
    for story in stories:
        mapping[story.id] = (
            story.story_contents.get_linked_exp_ids_of_published_nodes()
            if feature_flag_services.is_feature_flag_enabled(
                feature_flag_list.FeatureNames
                .SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW.value,
                None)
            else story.story_contents.get_all_linked_exp_ids())
    return mapping


def save_topic_summary(topic_summary: topic_domain.TopicSummary) -> None:
    """Save a topic summary domain object as a TopicSummaryModel
    entity in the datastore.

    Args:
        topic_summary: TopicSummary. The topic summary object to be saved
            in the datastore.
    """
    existing_topic_summary_model = (
        topic_models.TopicSummaryModel.get_by_id(topic_summary.id))
    topic_summary_model = populate_topic_summary_model_fields(
    existing_topic_summary_model, topic_summary)
    topic_summary_model.update_timestamps()
    topic_summary_model.put()


def publish_topic(topic_id: str, committer_id: str) -> None:
    """Marks the given topic as published.

    Args:
        topic_id: str. The id of the given topic.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given topic does not exist.
        Exception. The topic is already published.
        Exception. The user does not have enough rights to publish the topic.
    """
    topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=False)
    if topic_rights is None:
        raise Exception('The given topic does not exist')
    topic = topic_fetchers.get_topic_by_id(topic_id)
    topic.validate(strict=True)
    user = user_services.get_user_actions_info(committer_id)
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


def unpublish_topic(topic_id: str, committer_id: str) -> None:
    """Marks the given topic as unpublished.

    Args:
        topic_id: str. The id of the given topic.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given topic does not exist.
        Exception. The topic is already unpublished.
        Exception. The user does not have enough rights to unpublish the topic.
    """
    topic_rights = topic_fetchers.get_topic_rights(topic_id, strict=False)
    if topic_rights is None:
        raise Exception('The given topic does not exist')
    user = user_services.get_user_actions_info(committer_id)
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


def save_topic_rights(
    topic_rights: topic_domain.TopicRights,
    committer_id: str,
    commit_message: str,
    commit_cmds: List[topic_domain.TopicRightsChange]
) -> None:
    """Saves a TopicRights domain object to the datastore.

    Args:
        topic_rights: TopicRights. The rights object for the given
            topic.
        committer_id: str. ID of the committer.
        commit_message: str. Descriptive message for the commit.
        commit_cmds: list(TopicRightsChange). A list of commands describing
            what kind of commit was done.
    """

    model = topic_models.TopicRightsModel.get(topic_rights.id, strict=True)

    model.manager_ids = topic_rights.manager_ids
    model.topic_is_published = topic_rights.topic_is_published
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)


def create_new_topic_rights(
    topic_id: str, committer_id: str
) -> None:
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


def filter_published_topic_ids(topic_ids: List[str]) -> List[str]:
    """Given list of topic IDs, returns the IDs of all topics that are published
    in that list.

    Args:
        topic_ids: list(str). The list of topic ids.

    Returns:
        list(str). The topic IDs in the passed in list corresponding to
        published topics.
    """
    topic_rights_models = topic_models.TopicRightsModel.get_multi(topic_ids)
    published_topic_ids = []
    for ind, model in enumerate(topic_rights_models):
        if model is None:
            continue
        rights = topic_fetchers.get_topic_rights_from_model(model)
        if rights.topic_is_published:
            published_topic_ids.append(topic_ids[ind])
    return published_topic_ids


def check_can_edit_topic(
    user: user_domain.UserActionsInfo,
    topic_rights: Optional[topic_domain.TopicRights]
) -> bool:
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
    if user.user_id and topic_rights.is_manager(user.user_id):
        return True

    return False


def deassign_user_from_all_topics(
    committer: user_domain.UserActionsInfo, user_id: str
) -> None:
    """Deassigns given user from all topics assigned to them.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user
            who is performing the action.
        user_id: str. The ID of the user.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. Guest users are not allowed to deassing users from
            all topics.
    """
    topic_rights_list = topic_fetchers.get_topic_rights_with_user(user_id)
    if committer.user_id is None:
        raise Exception(
            'Guest users are not allowed to deassing users from all topics.'
        )
    for topic_rights in topic_rights_list:
        topic_rights.manager_ids.remove(user_id)
        commit_cmds = [topic_domain.TopicRightsChange({
            'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
            'removed_user_id': user_id
        })]
        save_topic_rights(
            topic_rights, committer.user_id,
            'Removed all assigned topics from %s' % (
                user_services.get_username(user_id)
            ),
            commit_cmds
        )


def deassign_manager_role_from_topic(
    committer: user_domain.UserActionsInfo,
    user_id: str,
    topic_id: str
) -> None:
    """Deassigns given user from all topics assigned to them.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user
            who is performing the action.
        user_id: str. The ID of the user.
        topic_id: str. The ID of the topic.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. Guest users are not allowed to deassing manager role
            from topic.
    """
    if committer.user_id is None:
        raise Exception(
            'Guest users are not allowed to deassing manager role from topic.'
        )
    topic_rights = topic_fetchers.get_topic_rights(topic_id)
    if user_id not in topic_rights.manager_ids:
        raise Exception('User does not have manager rights in topic.')

    topic_rights.manager_ids.remove(user_id)
    commit_cmds = [topic_domain.TopicRightsChange({
        'cmd': topic_domain.CMD_REMOVE_MANAGER_ROLE,
        'removed_user_id': user_id
    })]
    save_topic_rights(
        topic_rights,
        committer.user_id,
        'Removed all assigned topics from %s' % (
            user_services.get_username(user_id)
        ),
        commit_cmds
    )


def assign_role(
    committer: user_domain.UserActionsInfo,
    assignee: user_domain.UserActionsInfo,
    new_role: str,
    topic_id: str
) -> None:
    """Assigns a new role to the user.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user
            who is performing the action.
        assignee: UserActionsInfo. UserActionsInfo object for the user
            whose role is being changed.
        new_role: str. The name of the new role. Possible values are:
            ROLE_MANAGER.
        topic_id: str. ID of the topic.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. The assignee is already a manager for the topic.
        Exception. The assignee doesn't have enough rights to become a manager.
        Exception. The role is invalid.
        Exception. Guest user is not allowed to assign roles to a user.
        Exception. The role of the Guest user cannot be changed.
    """
    committer_id = committer.user_id
    if committer_id is None:
        raise Exception(
            'Guest user is not allowed to assign roles to a user.'
        )
    topic_rights = topic_fetchers.get_topic_rights(topic_id)
    if (role_services.ACTION_MODIFY_CORE_ROLES_FOR_ANY_ACTIVITY not in
            committer.actions):
        logging.error(
            'User %s tried to allow user %s to be a %s of topic %s '
            'but was refused permission.' % (
                committer_id, assignee.user_id, new_role, topic_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    if assignee.user_id is None:
        raise Exception(
            'Cannot change the role of the Guest user.'
        )
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

    commit_message = rights_domain.ASSIGN_ROLE_COMMIT_MESSAGE_TEMPLATE % (
        assignee_username, old_role, new_role)
    commit_cmds = [topic_domain.TopicRightsChange({
        'cmd': topic_domain.CMD_CHANGE_ROLE,
        'assignee_id': assignee.user_id,
        'old_role': old_role,
        'new_role': new_role
    })]

    save_topic_rights(topic_rights, committer_id, commit_message, commit_cmds)


def get_story_titles_in_topic(topic: topic_domain.Topic) -> List[str]:
    """Returns titles of the stories present in the topic.

    Args:
        topic: Topic. The topic domain objects.

    Returns:
        list(str). The list of story titles in the topic.
    """
    canonical_story_references = topic.canonical_story_references
    story_ids = [story.story_id for story in canonical_story_references]
    stories = story_fetchers.get_stories_by_ids(story_ids)
    story_titles = [story.title for story in stories if story is not None]
    return story_titles


def update_thumbnail_filename(
    topic: topic_domain.Topic, new_thumbnail_filename: str
) -> None:
    """Updates the thumbnail filename and file size in a topic object.

    Args:
        topic: topic_domain.Topic. The topic domain object whose thumbnail
            is to be updated.
        new_thumbnail_filename: str. The updated thumbnail filename
            for the topic.

    Raises:
        Exception. The thumbnail does not exist for expected topic in
            the filesystem.
    """
    fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, topic.id)
    filepath = '%s/%s' % (
        constants.ASSET_TYPE_THUMBNAIL, new_thumbnail_filename)
    if fs.isfile(filepath):
        thumbnail_size_in_bytes = len(fs.get(filepath))
        topic.update_thumbnail_filename_and_size(
            new_thumbnail_filename, thumbnail_size_in_bytes)
    else:
        raise Exception(
            'The thumbnail %s for topic with id %s does not exist'
            ' in the filesystem.' % (new_thumbnail_filename, topic.id))


def update_subtopic_thumbnail_filename(
    topic: topic_domain.Topic,
    subtopic_id: int,
    new_thumbnail_filename: str
) -> None:
    """Updates the thumbnail filename and file size in a subtopic.

    Args:
        topic: topic_domain.Topic. The topic domain object containing
            the subtopic whose thumbnail is to be updated.
        subtopic_id: int. The id of the subtopic to edit.
        new_thumbnail_filename: str. The new thumbnail filename for the
            subtopic.

    Raises:
        Exception. The thumbnail does not exist for expected topic in
            the filesystem.
    """
    fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, topic.id)
    filepath = '%s/%s' % (
        constants.ASSET_TYPE_THUMBNAIL, new_thumbnail_filename)
    if fs.isfile(filepath):
        thumbnail_size_in_bytes = len(fs.get(filepath))
        topic.update_subtopic_thumbnail_filename_and_size(
            subtopic_id, new_thumbnail_filename, thumbnail_size_in_bytes)
    else:
        raise Exception(
            'The thumbnail %s for subtopic with topic_id %s does not exist'
            ' in the filesystem.' % (new_thumbnail_filename, topic.id))


def get_topic_id_to_diagnostic_test_skill_ids(
    topic_ids: List[str]
) -> Dict[str, List[str]]:
    """Returns a dict with topic ID as key and a list of diagnostic test
    skill IDs as value.

    Args:
        topic_ids: List(str). A list of topic IDs.

    Raises:
        Exception. The topic models for some of the given topic IDs do not
            exist.

    Returns:
        dict(str, list(str)). A dict with topic ID as key and a list of
        diagnostic test skill IDs as value.
    """
    topic_id_to_diagnostic_test_skill_ids = {}
    topics = topic_fetchers.get_topics_by_ids(topic_ids)

    for topic in topics:
        if topic is None:
            continue
        topic_id_to_diagnostic_test_skill_ids[topic.id] = (
            topic.skill_ids_for_diagnostic_test)

    correct_topic_ids = list(topic_id_to_diagnostic_test_skill_ids.keys())
    # The topic IDs for which topic models do not exist are referred to as
    # incorrect topic IDs.
    incorrect_topic_ids = [
        topic_id for topic_id in topic_ids if topic_id not in correct_topic_ids
    ]
    if incorrect_topic_ids:
        error_msg = (
            'No corresponding topic models exist for these topic IDs: %s.'
            % (', '.join(incorrect_topic_ids))
        )
        raise Exception(error_msg)
    return topic_id_to_diagnostic_test_skill_ids


def populate_topic_model_fields(
    topic_model: topic_models.TopicModel,
    topic: topic_domain.Topic
) -> topic_models.TopicModel:
    """Populate topic model with the data from topic object.

    Args:
        topic_model: TopicModel. The model to populate.
        topic: Topic. The topic domain object which should be used to
            populate the model.

    Returns:
        TopicModel. Populated model.
    """
    topic_model.description = topic.description
    topic_model.name = topic.name
    topic_model.canonical_name = topic.canonical_name
    topic_model.abbreviated_name = topic.abbreviated_name
    topic_model.url_fragment = topic.url_fragment
    topic_model.thumbnail_bg_color = topic.thumbnail_bg_color
    topic_model.thumbnail_filename = topic.thumbnail_filename
    topic_model.thumbnail_size_in_bytes = topic.thumbnail_size_in_bytes
    topic_model.canonical_story_references = [
        reference.to_dict() for reference in topic.canonical_story_references
    ]
    topic_model.additional_story_references = [
        reference.to_dict() for reference in topic.additional_story_references
    ]
    topic_model.uncategorized_skill_ids = topic.uncategorized_skill_ids
    topic_model.subtopics = [subtopic.to_dict() for subtopic in topic.subtopics]
    topic_model.subtopic_schema_version = topic.subtopic_schema_version
    topic_model.story_reference_schema_version = (
        topic.story_reference_schema_version)
    topic_model.next_subtopic_id = topic.next_subtopic_id
    topic_model.language_code = topic.language_code
    topic_model.meta_tag_content = topic.meta_tag_content
    topic_model.practice_tab_is_displayed = topic.practice_tab_is_displayed
    topic_model.page_title_fragment_for_web = topic.page_title_fragment_for_web
    topic_model.skill_ids_for_diagnostic_test = (
        topic.skill_ids_for_diagnostic_test)
    return topic_model


def populate_topic_summary_model_fields(
    topic_summary_model: topic_models.TopicSummaryModel,
    topic_summary: topic_domain.TopicSummary
) -> topic_models.TopicSummaryModel:
    """Populate topic summary model with the data from topic summary object.

    Args:
        topic_summary_model: TopicSummaryModel. The model to populate.
        topic_summary: TopicSummary. The topic summary domain object which
            should be used to populate the model.

    Returns:
        TopicSummaryModel. Populated model.
    """
    topic_summary_dict = {
        'name': topic_summary.name,
        'description': topic_summary.description,
        'canonical_name': topic_summary.canonical_name,
        'language_code': topic_summary.language_code,
        'version': topic_summary.version,
        'additional_story_count': topic_summary.additional_story_count,
        'canonical_story_count': topic_summary.canonical_story_count,
        'uncategorized_skill_count': topic_summary.uncategorized_skill_count,
        'subtopic_count': topic_summary.subtopic_count,
        'total_skill_count': topic_summary.total_skill_count,
        'total_published_node_count':
            topic_summary.total_published_node_count,
        'thumbnail_filename': topic_summary.thumbnail_filename,
        'thumbnail_bg_color': topic_summary.thumbnail_bg_color,
        'topic_model_last_updated': topic_summary.topic_model_last_updated,
        'topic_model_created_on': topic_summary.topic_model_created_on,
        'url_fragment': topic_summary.url_fragment,
        'published_story_exploration_mapping': (
            topic_summary.published_story_exploration_mapping)
    }

    if topic_summary_model is not None:
        topic_summary_model.populate(**topic_summary_dict)
    else:
        topic_summary_dict['id'] = topic_summary.id
        topic_summary_model = topic_models.TopicSummaryModel(
            **topic_summary_dict)

    return topic_summary_model


def get_topic_id_to_topic_name_dict(topic_ids: List[str]) -> Dict[str, str]:
    """Returns a dict with topic ID as key and topic name as value, for all
    given topic IDs.

    Args:
        topic_ids: List(str). A list of topic IDs.

    Raises:
        Exception. The topic models for some of the given topic IDs do not
            exist.

    Returns:
        dict(str, str). A dict with topic ID as key and topic name as value.
    """
    topic_id_to_topic_name = {}
    topics = topic_fetchers.get_topics_by_ids(topic_ids)

    for topic in topics:
        if topic is None:
            continue
        topic_id_to_topic_name[topic.id] = topic.name

    correct_topic_ids = list(topic_id_to_topic_name.keys())
    # The topic IDs for which topic models do not exist are referred to as
    # incorrect topic IDs.
    incorrect_topic_ids = [
        topic_id for topic_id in topic_ids if topic_id not in correct_topic_ids
    ]
    if incorrect_topic_ids:
        error_msg = (
            'No corresponding topic models exist for these topic IDs: %s.'
            % (', '.join(incorrect_topic_ids))
        )
        raise Exception(error_msg)
    return topic_id_to_topic_name


def get_chapter_counts_in_topic_summaries(
    topic_summary_dicts: List[topic_domain.FrontendTopicSummaryDict]
) -> Dict[str, topic_domain.TopicChapterCounts]:
    """Returns topic chapter counts for each topic summary dict.

    Args:
        topic_summary_dicts: List[FrontendTopicSummaryDict]. A list of
            topic summary dicts.

    Returns:
        Dict[str, TopicChapterCounts]. Dict of topic id and topic chapter
        counts domain object.
    """

    topic_summary_id_mapping: Dict[
        str, topic_domain.FrontendTopicSummaryDict] = {}
    for topic_summary in topic_summary_dicts:
        topic_summary_id_mapping.update({
            topic_summary['id']: topic_summary})

    topic_ids = [summary['id'] for summary in topic_summary_dicts]
    all_topics = topic_fetchers.get_topics_by_ids(topic_ids)
    all_valid_topics = [topic for topic in all_topics if topic is not None]
    all_story_ids: List[str] = []
    topic_chapter_counts_dict: Dict[str, topic_domain.TopicChapterCounts] = {}
    for topic in all_valid_topics:
        story_ids = [story_reference.story_id for
            story_reference in topic.canonical_story_references]
        all_story_ids = all_story_ids + story_ids

    all_stories = story_fetchers.get_stories_by_ids(all_story_ids)
    all_valid_stories = [story for story in all_stories if story is not None]
    story_id_mapping: Dict[str, story_domain.Story] = {}
    for story in all_valid_stories:
        story_id_mapping.update({story.id: story})

    for topic in all_valid_topics:
        topic_summary_dict = topic_summary_id_mapping[topic.id]
        upcoming_chapters_count = 0
        overdue_chapters_count = 0
        total_chapter_counts = []
        published_chapter_counts = []
        stories = []
        for story_reference in topic.canonical_story_references:
            if story_reference.story_id in story_id_mapping:
                stories.append(story_id_mapping[story_reference.story_id])
            else:
                logging.error(
                    'Topic %s has an invalid story reference ID %s' % (
                        topic.id, story_reference.story_id))
        for story in stories:
            nodes = story.story_contents.nodes
            total_chapters_count = len(nodes)
            published_chapters_count = 0
            for node in nodes:
                if node.status == constants.STORY_NODE_STATUS_PUBLISHED:
                    published_chapters_count += 1
                else:
                    if node.is_node_upcoming():
                        upcoming_chapters_count += 1
                    elif node.is_node_behind_schedule():
                        overdue_chapters_count += 1

            total_chapter_counts.append(total_chapters_count)
            published_chapter_counts.append(published_chapters_count)

        topic_chapter_counts = topic_domain.TopicChapterCounts(
            upcoming_chapters_count, overdue_chapters_count,
            total_chapter_counts, published_chapter_counts)

        topic_chapter_counts_dict.update({
            topic_summary_dict['id']: topic_chapter_counts
        })

    return topic_chapter_counts_dict


def get_all_published_story_exploration_ids(
    topic_id: Optional[str] = None
) -> List[str]:
    """Returns a list of each exploration id linked to each published story
    chapter that belongs to topic(s).

    Args:
        topic_id: str|None. The id of a topic. If topic_id is provided, the
            result includes exploration ids only from the corresponding
            topic. If no topic_id is provided, the result includes
            exploration ids in all topics.

    Returns:
        list(str). A list of all exploration ids linked to the topic(s)'
        published stories' chapters.
    """
    fetched_topic_summaries = (
        [topic_fetchers.get_topic_summary_by_id(topic_id)] if topic_id
        else topic_fetchers.get_all_topic_summaries()
    )

    # Keep each summary's mapping. For those without a mapping,
    # record their ids, fetch their corresponding topics with them, and then
    # use the topic to compute the mapping. Add each computed mapping to
    # the list of persisted mappings.
    mappings = []
    ids_of_topic_summaries_without_mapping: List[str] = []
    for summary in fetched_topic_summaries:
        if summary.published_story_exploration_mapping is None:
            ids_of_topic_summaries_without_mapping.append(summary.id)
        else:
            mappings.append(
                summary.published_story_exploration_mapping)
    if len(ids_of_topic_summaries_without_mapping) > 0:
        topics_without_mapping = topic_fetchers.get_topics_by_ids(
            ids_of_topic_summaries_without_mapping
        )

        published_story_ids_grouped_by_topic = [
            [
                story_ref.story_id for story_ref
                in topic.canonical_story_references +
                    topic.additional_story_references
                if story_ref.story_is_published
            ]
            for topic in topics_without_mapping if topic is not None
        ]
        cumulative_published_story_counts_by_topic = list(
            itertools.accumulate([0] + [
                len(topic_published_story_ids)
                for topic_published_story_ids
                in published_story_ids_grouped_by_topic[:-1]
            ])
        )

        published_stories_in_all_topics_without_mapping = [
            story for story in story_fetchers.get_stories_by_ids(
                list(itertools.chain.from_iterable(
                    published_story_ids_grouped_by_topic
                )),
                strict=False
            )
            if story is not None
        ]
        published_stories_grouped_by_topic = [
            [
                published_stories_in_all_topics_without_mapping[
                    cumulative_published_story_counts_by_topic[i] + j
                ]
                for j in range(len(published_story_ids_grouped_by_topic[i]))
            ]
            for i in range(len(published_story_ids_grouped_by_topic))
        ]

        for published_stories_in_topic in published_stories_grouped_by_topic:
            mappings.append(_compute_story_exploration_mapping(
                published_stories_in_topic
            ))

    exp_ids = itertools.chain.from_iterable(
        itertools.chain.from_iterable(mapping.values())
        for mapping in mappings
    )

    return list(set(exp_ids))
