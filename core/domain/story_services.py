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
# limitations under the License.

"""Commands that can be used to operate on stories.

All functions here should be agnostic of how StoryModel objects are
stored in the database. In particular, the various query methods should
delegate to the Story model class. This will enable the story
storage model to be changed without affecting this module and others above it.
"""

from __future__ import annotations

import copy
import logging

from core import feconf
from core import utils
from core.constants import constants
from core.domain import caching_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import learner_group_services
from core.domain import opportunity_services
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.platform import models

from typing import List, Sequence, Tuple, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import story_models
    from mypy_imports import user_models

(exp_models, story_models, user_models,) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.STORY, models.Names.USER])


def get_new_story_id() -> str:
    """Returns a new story id.

    Returns:
        str. A new story id.
    """
    return story_models.StoryModel.get_new_id('')


def _create_story(
    committer_id: str,
    story: story_domain.Story,
    commit_message: str,
    commit_cmds: List[story_domain.StoryChange]
) -> None:
    """Creates a new story.

    Args:
        committer_id: str. ID of the committer.
        story: Story. The story domain object.
        commit_message: str. A description of changes made to the story.
        commit_cmds: list(StoryChange). A list of change commands made to the
            given story.
    """
    story.validate()
    model = story_models.StoryModel(
        id=story.id,
        description=story.description,
        title=story.title,
        thumbnail_bg_color=story.thumbnail_bg_color,
        thumbnail_filename=story.thumbnail_filename,
        thumbnail_size_in_bytes=story.thumbnail_size_in_bytes,
        language_code=story.language_code,
        story_contents_schema_version=story.story_contents_schema_version,
        notes=story.notes,
        story_contents=story.story_contents.to_dict(),
        corresponding_topic_id=story.corresponding_topic_id,
        url_fragment=story.url_fragment,
        meta_tag_content=story.meta_tag_content
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    story.version += 1
    create_story_summary(story.id)


def save_new_story(committer_id: str, story: story_domain.Story) -> None:
    """Saves a new story.

    Args:
        committer_id: str. ID of the committer.
        story: Story. Story to be saved.
    """
    commit_message = (
        'New story created with title \'%s\'.' % story.title)
    _create_story(
        committer_id, story, commit_message, [story_domain.StoryChange({
            'cmd': story_domain.CMD_CREATE_NEW,
            'title': story.title
        })])


# Repository SAVE and DELETE methods.
def apply_change_list(
    story_id: str, change_list: List[story_domain.StoryChange]
) -> Tuple[story_domain.Story, List[str], List[str]]:
    """Applies a changelist to a story and returns the result.

    Args:
        story_id: str. ID of the given story.
        change_list: list(StoryChange). A change list to be applied to the given
            story.

    Returns:
        Story, list(str), list(str). The resulting story domain object, the
        exploration IDs removed from story and the exploration IDs added to
        the story.

    Raises:
        Exception. The elements in change list are not of domain object type.
    """
    story = story_fetchers.get_story_by_id(story_id)
    exp_ids_in_old_story = story.story_contents.get_all_linked_exp_ids()
    try:
        for change in change_list:
            if not isinstance(change, story_domain.StoryChange):
                raise Exception('Expected change to be of type StoryChange')
            if change.cmd == story_domain.CMD_ADD_STORY_NODE:
                # Here we use cast because we are narrowing down the type from
                # StoryChange to a specific change command.
                add_story_node_cmd = cast(
                    story_domain.AddStoryNodeCmd,
                    change
                )
                story.add_node(
                    add_story_node_cmd.node_id,
                    add_story_node_cmd.title
                )
            elif change.cmd == story_domain.CMD_DELETE_STORY_NODE:
                # Here we use cast because we are narrowing down the type from
                # StoryChange to a specific change command.
                delete_story_node_cmd = cast(
                    story_domain.DeleteStoryNodeCmd,
                    change
                )
                story.delete_node(delete_story_node_cmd.node_id)
            elif (change.cmd ==
                  story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS):
                # Here we use cast because we are narrowing down the type from
                # StoryChange to a specific change command.
                update_story_node_outline_status = cast(
                    story_domain.UpdateStoryNodeOutlineStatusCmd,
                    change
                )
                if update_story_node_outline_status.new_value:
                    story.mark_node_outline_as_finalized(
                        update_story_node_outline_status.node_id
                    )
                else:
                    story.mark_node_outline_as_unfinalized(
                        update_story_node_outline_status.node_id
                    )
            elif change.cmd == story_domain.CMD_UPDATE_STORY_NODE_PROPERTY:
                if (change.property_name ==
                        story_domain.STORY_NODE_PROPERTY_OUTLINE):
                    # Here we use cast because this 'if' condition forces
                    # change to have type UpdateStoryNodePropertyOutlineCmd.
                    update_node_outline_cmd = cast(
                        story_domain.UpdateStoryNodePropertyOutlineCmd,
                        change
                    )
                    story.update_node_outline(
                        update_node_outline_cmd.node_id,
                        update_node_outline_cmd.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_TITLE):
                    # Here we use cast because this 'elif' condition forces
                    # change to have type UpdateStoryNodePropertyTitleCmd.
                    update_node_title_cmd = cast(
                        story_domain.UpdateStoryNodePropertyTitleCmd,
                        change
                    )
                    story.update_node_title(
                        update_node_title_cmd.node_id,
                        update_node_title_cmd.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_DESCRIPTION):
                    # Here we use cast because this 'elif' condition forces
                    # change to have type UpdateStoryNodePropertyDescriptionCmd.
                    update_node_description_cmd = cast(
                        story_domain.UpdateStoryNodePropertyDescriptionCmd,
                        change
                    )
                    story.update_node_description(
                        update_node_description_cmd.node_id,
                        update_node_description_cmd.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_THUMBNAIL_FILENAME):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyThumbnailFilenameCmd.
                    update_node_thumbnail_filename_cmd = cast(
                       story_domain.UpdateStoryNodePropertyThumbnailFilenameCmd,
                       change
                    )
                    story.update_node_thumbnail_filename(
                        update_node_thumbnail_filename_cmd.node_id,
                        update_node_thumbnail_filename_cmd.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyThumbnailBGColorCmd.
                    update_node_thumbnail_bg_color = cast(
                        story_domain.UpdateStoryNodePropertyThumbnailBGColorCmd,
                        change
                    )
                    story.update_node_thumbnail_bg_color(
                        update_node_thumbnail_bg_color.node_id,
                        update_node_thumbnail_bg_color.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyAcquiredSkillIdsCmd.
                    update_node_acquired_skill_ids_cmd = cast(
                        story_domain.UpdateStoryNodePropertyAcquiredSkillIdsCmd,
                        change
                    )
                    story.update_node_acquired_skill_ids(
                        update_node_acquired_skill_ids_cmd.node_id,
                        update_node_acquired_skill_ids_cmd.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyPrerequisiteSkillIdsCmd.
                    update_prerequisite_skill_ids_cmd = cast(
                        story_domain.UpdateStoryNodePropertyPrerequisiteSkillIdsCmd,  # pylint: disable=line-too-long
                        change
                    )
                    story.update_node_prerequisite_skill_ids(
                        update_prerequisite_skill_ids_cmd.node_id,
                        update_prerequisite_skill_ids_cmd.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyDestinationNodeIdsCmd.
                    update_node_destination_node_ids_cmd = cast(
                        story_domain.UpdateStoryNodePropertyDestinationNodeIdsCmd,  # pylint: disable=line-too-long
                        change
                    )
                    story.update_node_destination_node_ids(
                        update_node_destination_node_ids_cmd.node_id,
                        update_node_destination_node_ids_cmd.new_value
                    )
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyExplorationIdCmd.
                    update_node_exploration_id_cmd = cast(
                        story_domain.UpdateStoryNodePropertyExplorationIdCmd,
                        change
                    )
                    story.update_node_exploration_id(
                        update_node_exploration_id_cmd.node_id,
                        update_node_exploration_id_cmd.new_value
                    )
                elif (change.property_name ==
                        story_domain.STORY_NODE_PROPERTY_STATUS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyStatusCmd.
                    update_node_status_cmd = cast(
                        story_domain.UpdateStoryNodePropertyStatusCmd,
                        change
                    )
                    story.update_node_status(
                        update_node_status_cmd.node_id,
                        update_node_status_cmd.new_value
                    )

                elif (change.property_name ==
                        story_domain.
                        STORY_NODE_PROPERTY_PLANNED_PUBLICATION_DATE):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyPlannedPublicationDateCmd.
                    update_node_planned_publication_date_cmd = cast(
                        story_domain.
                        UpdateStoryNodePropertyPlannedPublicationDateCmd,
                        change
                    )
                    story.update_node_planned_publication_date(
                        update_node_planned_publication_date_cmd.node_id,
                        update_node_planned_publication_date_cmd.new_value
                    )
                elif (change.property_name ==
                        story_domain.STORY_NODE_PROPERTY_LAST_MODIFIED):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyLastModifiedCmd.
                    update_node_last_modified_cmd = cast(
                        story_domain.UpdateStoryNodePropertyLastModifiedCmd,
                        change
                    )
                    story.update_node_last_modified(
                        update_node_last_modified_cmd.node_id,
                        update_node_last_modified_cmd.new_value
                    )
                elif (change.property_name ==
                        story_domain.
                        STORY_NODE_PROPERTY_FIRST_PUBLICATION_DATE):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyFirstPublicationDateCmd.
                    update_node_first_publication_date_cmd = cast(
                        story_domain.
                        UpdateStoryNodePropertyFirstPublicationDateCmd,
                        change
                    )
                    story.update_node_first_publication_date(
                        update_node_first_publication_date_cmd.node_id,
                        update_node_first_publication_date_cmd.new_value
                    )
                elif (change.property_name ==
                        story_domain.STORY_NODE_PROPERTY_UNPUBLISHING_REASON):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # UpdateStoryNodePropertyUnpublishingReasonCmd.
                    update_node_unpublishing_reason_cmd = cast(
                        story_domain.
                        UpdateStoryNodePropertyUnpublishingReasonCmd,
                        change
                    )
                    story.update_node_unpublishing_reason(
                        update_node_unpublishing_reason_cmd.node_id,
                        update_node_unpublishing_reason_cmd.new_value
                    )
            elif change.cmd == story_domain.CMD_UPDATE_STORY_PROPERTY:
                # Here we use cast because we are narrowing down the type from
                # StoryChange to a specific change command.
                update_story_property_cmd = cast(
                    story_domain.UpdateStoryPropertyCmd,
                    change
                )
                if (update_story_property_cmd.property_name ==
                        story_domain.STORY_PROPERTY_TITLE):
                    story.update_title(update_story_property_cmd.new_value)
                elif (update_story_property_cmd.property_name ==
                      story_domain.STORY_PROPERTY_THUMBNAIL_FILENAME):
                    story.update_thumbnail_filename(
                        update_story_property_cmd.new_value
                    )
                elif (update_story_property_cmd.property_name ==
                      story_domain.STORY_PROPERTY_THUMBNAIL_BG_COLOR):
                    story.update_thumbnail_bg_color(
                        update_story_property_cmd.new_value
                    )
                elif (update_story_property_cmd.property_name ==
                      story_domain.STORY_PROPERTY_DESCRIPTION):
                    story.update_description(
                        update_story_property_cmd.new_value
                    )
                elif (update_story_property_cmd.property_name ==
                      story_domain.STORY_PROPERTY_NOTES):
                    story.update_notes(
                        update_story_property_cmd.new_value
                    )
                elif (update_story_property_cmd.property_name ==
                      story_domain.STORY_PROPERTY_LANGUAGE_CODE):
                    story.update_language_code(
                        update_story_property_cmd.new_value
                    )
                elif (update_story_property_cmd.property_name ==
                      story_domain.STORY_PROPERTY_URL_FRAGMENT):
                    story.update_url_fragment(
                        update_story_property_cmd.new_value
                    )
                elif (update_story_property_cmd.property_name ==
                      story_domain.STORY_PROPERTY_META_TAG_CONTENT):
                    story.update_meta_tag_content(
                        update_story_property_cmd.new_value
                    )
            elif change.cmd == story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY:
                if (change.property_name ==
                        story_domain.INITIAL_NODE_ID):
                    # Here we use cast because this 'if'
                    # condition forces change to have type
                    # UpdateStoryContentsPropertyInitialNodeIdCmd.
                    update_initial_node_id_cmd = cast(
                       story_domain.UpdateStoryContentsPropertyInitialNodeIdCmd,
                       change
                    )
                    story.update_initial_node(
                        update_initial_node_id_cmd.new_value
                    )
                if change.property_name == story_domain.NODE:
                    # Here we use cast because this 'elif' condition forces
                    # change to have type UpdateStoryContentsPropertyNodeCmd.
                    update_node_cmd = cast(
                        story_domain.UpdateStoryContentsPropertyNodeCmd,
                        change
                    )
                    story.rearrange_node_in_story(
                        update_node_cmd.old_value, update_node_cmd.new_value)
            elif (
                    change.cmd ==
                    story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
                # Loading the story model from the datastore into a
                # Story domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # story is sufficient to apply the schema migration.
                continue

        exp_ids_in_modified_story = (
            story.story_contents.get_all_linked_exp_ids())
        exp_ids_removed_from_story = list(
            set(exp_ids_in_old_story).difference(exp_ids_in_modified_story))
        exp_ids_added_to_story = list(
            set(exp_ids_in_modified_story).difference(exp_ids_in_old_story))
        return story, exp_ids_removed_from_story, exp_ids_added_to_story

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, story_id, change_list)
        )
        raise e


def does_story_exist_with_url_fragment(url_fragment: str) -> bool:
    """Checks if the url fragment for the story exists.

    Args:
        url_fragment: str. The url_fragment of the story.

    Returns:
        bool. Whether the the url fragment for the story exists or not.
    """
    story = story_fetchers.get_story_by_url_fragment(url_fragment)
    return story is not None


def validate_prerequisite_skills_in_story_contents(
    skill_ids_in_corresponding_topic: List[str],
    story_contents: story_domain.StoryContents
) -> None:
    """Validates the prerequisites skills in the story contents.

    Args:
        skill_ids_in_corresponding_topic: list(str). List of skill IDs in
            the corresponding topic of the story.
        story_contents: StoryContents. The story contents.

    Raises:
        ValidationError. Expected prerequisite skills to have been acquired in
            previous nodes.
        ValidationError. Expected story to not contain loops.
        Exception. Initial node id should not be none.
    """
    if len(story_contents.nodes) == 0:
        return
    # nodes_queue stores the pending nodes to visit in the story that
    # are unlocked, in a 'queue' form with a First In First Out
    # structure.
    nodes_queue = []
    is_node_visited = [False] * len(story_contents.nodes)
    # Ruling out the possibility of None for mypy type checking.
    assert story_contents.initial_node_id is not None
    starting_node_index = story_contents.get_node_index(
        story_contents.initial_node_id)
    nodes_queue.append(story_contents.nodes[starting_node_index].id)

    # The user is assumed to have all the prerequisite skills of the
    # starting node before starting the story. Also, this list models
    # the skill IDs acquired by a learner as they progress through the
    # story.
    simulated_skill_ids = copy.deepcopy(
        story_contents.nodes[starting_node_index].prerequisite_skill_ids)

    # The following loop employs a Breadth First Search from the given
    # starting node and makes sure that the user has acquired all the
    # prerequisite skills required by the destination nodes 'unlocked'
    # by visiting a particular node by the time that node is finished.
    while len(nodes_queue) > 0:
        current_node_id = nodes_queue.pop()
        current_node_index = story_contents.get_node_index(current_node_id)
        is_node_visited[current_node_index] = True
        current_node = story_contents.nodes[current_node_index]

        for skill_id in current_node.acquired_skill_ids:
            simulated_skill_ids.append(skill_id)

        for node_id in current_node.destination_node_ids:
            node_index = story_contents.get_node_index(node_id)
            # The following condition checks whether the destination
            # node for a particular node, has already been visited, in
            # which case the story would have loops, which are not
            # allowed.
            if is_node_visited[node_index]:
                raise utils.ValidationError(
                    'Loops are not allowed in stories.')
            destination_node = story_contents.nodes[node_index]
            # Include only skill ids relevant to the topic for validation.
            topic_relevant_skill_ids = list(
                set(skill_ids_in_corresponding_topic).intersection(
                    set(destination_node.prerequisite_skill_ids)))
            if not (
                    set(
                        topic_relevant_skill_ids
                    ).issubset(simulated_skill_ids)):
                raise utils.ValidationError(
                    'The skills with ids ' +
                    ' '.join(
                        set(topic_relevant_skill_ids) -
                        set(simulated_skill_ids)) +
                    ' were specified as prerequisites for Chapter %s,'
                    ' but were not taught in any chapter before it.'
                    % destination_node.title)
            nodes_queue.append(node_id)


def validate_explorations_for_story(
    exp_ids: List[str], strict: bool
) -> List[str]:
    """Validates the explorations in the given story and checks whether they
    are compatible with the mobile app and ready for publishing.

    Args:
        exp_ids: list(str). The exp IDs to validate.
        strict: bool. Whether to raise an Exception when a validation error
            is encountered. If not, a list of the error messages are
            returned. strict should be True when this is called before
            saving the story and False when this function is called from the
            frontend.

    Returns:
        list(str). The various validation error messages (if strict is
        False).

    Raises:
        ValidationError. Expected story to only reference valid explorations.
        ValidationError. Exploration with ID is not public. Please publish
            explorations before adding them to a story.
        ValidationError. All explorations in a story should be of the same
            category.
        Exception. Exploration validation failed for given exploration IDs.
    """
    validation_error_messages = []

    # Strict = False, since the existence of explorations is checked below.
    exps_dict = (
        exp_fetchers.get_multiple_explorations_by_id(exp_ids, strict=False))

    exp_rights = (
        rights_manager.get_multiple_exploration_rights_by_ids(exp_ids))

    exp_rights_dict = {}

    for rights in exp_rights:
        if rights is not None:
            exp_rights_dict[rights.id] = rights.status

    for exp_id in exp_ids:
        if exp_id not in exps_dict:
            error_string = (
                'Expected story to only reference valid explorations, but found'
                ' a reference to an invalid exploration with ID: %s'
                % exp_id)
            if strict:
                raise utils.ValidationError(error_string)
            validation_error_messages.append(error_string)
        else:
            if exp_rights_dict[exp_id] != constants.ACTIVITY_STATUS_PUBLIC:
                error_string = (
                    'Exploration with ID %s is not public. Please publish '
                    'explorations before adding them to a story.'
                    % exp_id)
                if strict:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)

    if exps_dict:
        for exp_id, exp in exps_dict.items():
            if exp.category not in constants.ALL_CATEGORIES:
                error_string = (
                    'All explorations in a story should be of a '
                    'default category. The exploration with ID %s has'
                    ' an invalid category %s.' % (exp_id, exp.category))
                if strict:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)

    if exps_dict:
        for exp_id in exp_ids:
            if exp_id in exps_dict:
                sample_exp_id = exp_id
                break
        common_exp_category = exps_dict[sample_exp_id].category
        for exp_id, exp in exps_dict.items():
            if exp.category != common_exp_category:
                error_string = (
                    'All explorations in a story should be of the '
                    'same category. The explorations with ID %s and %s have'
                    ' different categories.' % (sample_exp_id, exp_id))
                if strict:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)
            try:
                validation_error_messages.extend(
                    exp_services.validate_exploration_for_story(exp, strict))
            except Exception as e:
                logging.exception(
                    'Exploration validation failed for exploration with ID: '
                    '%s. Error: %s' % (exp_id, e))
                raise Exception(e) from e

    return validation_error_messages


def populate_story_model_fields(
    story_model: story_models.StoryModel, story: story_domain.Story
) -> story_models.StoryModel:
    """Populate story model with the data from story object.

    Args:
        story_model: StoryModel. The model to populate.
        story: Story. The story domain object which should be used to
            populate the model.

    Returns:
        StoryModel. Populated model.
    """
    story_model.description = story.description
    story_model.title = story.title
    story_model.thumbnail_bg_color = story.thumbnail_bg_color
    story_model.thumbnail_filename = story.thumbnail_filename
    story_model.thumbnail_size_in_bytes = story.thumbnail_size_in_bytes
    story_model.notes = story.notes
    story_model.language_code = story.language_code
    story_model.story_contents_schema_version = (
        story.story_contents_schema_version)
    story_model.story_contents = story.story_contents.to_dict()
    story_model.corresponding_topic_id = story.corresponding_topic_id
    story_model.version = story.version
    story_model.url_fragment = story.url_fragment
    story_model.meta_tag_content = story.meta_tag_content
    return story_model


def _save_story(
    committer_id: str,
    story: story_domain.Story,
    commit_message: str,
    change_list: List[story_domain.StoryChange],
    story_is_published: bool
) -> None:
    """Validates a story and commits it to persistent storage. If
    successful, increments the version number of the incoming story domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        story: Story. The story domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(StoryChange). List of changes applied to a story.
        story_is_published: bool. Whether the supplied story is published.

    Raises:
        ValidationError. An invalid exploration was referenced in the
            story.
        Exception. The story model and the incoming story domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save story %s: %s' % (story.id, change_list))

    story.validate()
    corresponding_topic = (
        topic_fetchers.get_topic_by_id(story.corresponding_topic_id))
    validate_prerequisite_skills_in_story_contents(
        corresponding_topic.get_all_skill_ids(), story.story_contents)

    if story_is_published:
        exp_ids = []
        for node in story.story_contents.nodes:
            if not node.exploration_id:
                raise Exception(
                    'Story node with id %s does not contain an '
                    'exploration id.' % node.id)
            exp_ids.append(node.exploration_id)

        validate_explorations_for_story(exp_ids, True)

    # Story model cannot be None as story is passed as parameter here and that
    # is only possible if a story model with that story id exists. Also this is
    # a private function and so it cannot be called independently with any
    # story object.
    story_model = story_models.StoryModel.get(story.id)
    if story.version > story_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of story '
            'from version %s. Please reload the page and try again.'
            % (story_model.version, story.version))

    if story.version < story_model.version:
        raise Exception(
            'Trying to update version %s of story from version %s, '
            'which is too old. Please reload the page and try again.'
            % (story_model.version, story.version))

    story_model = populate_story_model_fields(story_model, story)
    change_dicts = [change.to_dict() for change in change_list]
    story_model.commit(committer_id, commit_message, change_dicts)
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_STORY, None, [story.id])
    story.version += 1


def is_story_published_and_present_in_topic(story: story_domain.Story) -> bool:
    """Returns whether a story is published. Raises an exception if the story
    is not present in the corresponding topic's story references.

    Args:
        story: Story. The story domain object.

    Returns:
        bool. Whether the supplied story is published.

    Raises:
        ValidationError. The story does not belong to any valid topic.
        Exception. The story does not belong to the expected topic.
    """
    topic = topic_fetchers.get_topic_by_id(
        story.corresponding_topic_id, strict=False)
    if topic is None:
        raise utils.ValidationError(
            'Expected story to only belong to a valid topic, but found no '
            'topic with ID: %s' % story.corresponding_topic_id)

    story_is_published = False
    story_is_present_in_topic = False
    for story_reference in topic.get_all_story_references():
        if story_reference.story_id == story.id:
            story_is_present_in_topic = True
            story_is_published = story_reference.story_is_published

    if not story_is_present_in_topic:
        raise Exception(
            'Expected story to belong to the topic %s, but it is '
            'neither a part of the canonical stories or the additional '
            'stories of the topic.' % story.corresponding_topic_id)

    return story_is_published


def update_story(
    committer_id: str,
    story_id: str,
    change_list: List[story_domain.StoryChange],
    commit_message: str
) -> None:
    """Updates a story. Commits changes.

    # NOTE: This function should not be called on its own. Access it
    # through `topic_services.update_story_and_topic_summary`.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        story_id: str. The story id.
        change_list: list(StoryChange). These changes are applied in sequence to
            produce the resulting story.
        commit_message: str. A description of changes made to the
            story.

    Raises:
        ValueError. Expected a commit message but received None.
        ValidationError. Exploration is already linked to a different story.
        ValidationError. Story url fragment is not unique across the site.
    """
    if not commit_message:
        raise ValueError('Expected a commit message but received none.')

    old_story = story_fetchers.get_story_by_id(story_id)
    new_story, exp_ids_removed_from_story, exp_ids_added_to_story = (
        apply_change_list(story_id, change_list))
    story_is_published = is_story_published_and_present_in_topic(new_story)
    exploration_context_models_to_be_deleted_with_none = (
        exp_models.ExplorationContextModel.get_multi(
            exp_ids_removed_from_story))
    exploration_context_models_to_be_deleted = [
        model for model in exploration_context_models_to_be_deleted_with_none
        if model is not None]
    exploration_context_models_collisions_list = (
        exp_models.ExplorationContextModel.get_multi(
            exp_ids_added_to_story))
    for context_model in exploration_context_models_collisions_list:
        if context_model is not None and context_model.story_id != story_id:
            raise utils.ValidationError(
                'The exploration with ID %s is already linked to story '
                'with ID %s' % (context_model.id, context_model.story_id))

    if (
            old_story.url_fragment != new_story.url_fragment and
            does_story_exist_with_url_fragment(new_story.url_fragment)):
        raise utils.ValidationError(
            'Story Url Fragment is not unique across the site.')
    _save_story(
        committer_id, new_story, commit_message, change_list,
        story_is_published)
    create_story_summary(new_story.id)
    if story_is_published:
        opportunity_services.update_exploration_opportunities(
            old_story, new_story)
    suggestion_services.auto_reject_translation_suggestions_for_exp_ids(
        exp_ids_removed_from_story)

    exp_models.ExplorationContextModel.delete_multi(
        exploration_context_models_to_be_deleted)

    new_exploration_context_models = [exp_models.ExplorationContextModel(
        id=exp_id,
        story_id=story_id
    ) for exp_id in exp_ids_added_to_story]
    exp_models.ExplorationContextModel.update_timestamps_multi(
        new_exploration_context_models)
    exp_models.ExplorationContextModel.put_multi(new_exploration_context_models)


def delete_story(
    committer_id: str, story_id: str, force_deletion: bool = False
) -> None:
    """Deletes the story with the given story_id.

    Args:
        committer_id: str. ID of the committer.
        story_id: str. ID of the story to be deleted.
        force_deletion: bool. If true, the story and its history are fully
            deleted and are unrecoverable. Otherwise, the story and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.
    """

    story_model = story_models.StoryModel.get(story_id, strict=False)
    if story_model is not None:
        story = story_fetchers.get_story_from_model(story_model)
        exp_ids = story.story_contents.get_all_linked_exp_ids()
        story_model.delete(
            committer_id,
            feconf.COMMIT_MESSAGE_STORY_DELETED,
            force_deletion=force_deletion
        )
        # Reject the suggestions related to the exploration used in
        # the story.
        suggestion_services.auto_reject_translation_suggestions_for_exp_ids(
            exp_ids)

    exploration_context_models: Sequence[
        exp_models.ExplorationContextModel
    ] = (
        exp_models.ExplorationContextModel.get_all().filter(
            exp_models.ExplorationContextModel.story_id == story_id
        ).fetch()
    )
    exp_models.ExplorationContextModel.delete_multi(
        list(exploration_context_models)
    )

    # This must come after the story is retrieved. Otherwise the memcache
    # key will be reinstated.
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_STORY, None, [story_id])

    # Delete the summary of the story (regardless of whether
    # force_deletion is True or not).
    delete_story_summary(story_id)

    # Delete the opportunities available.
    opportunity_services.delete_exp_opportunities_corresponding_to_story(
        story_id)

    # Delete references of the story from all related learner groups.
    learner_group_services.remove_story_reference_from_learner_groups(story_id)


def delete_story_summary(story_id: str) -> None:
    """Delete a story summary model.

    Args:
        story_id: str. ID of the story whose story summary is to
            be deleted.
    """

    story_models.StorySummaryModel.get(story_id).delete()


def compute_summary_of_story(
    story: story_domain.Story
) -> story_domain.StorySummary:
    """Create a StorySummary domain object for a given Story domain
    object and return it.

    Args:
        story: Story. The story object, for which the summary is to be computed.

    Returns:
        StorySummary. The computed summary for the given story.

    Raises:
        Exception. No data available for when the story was last_updated on.
    """
    story_model_node_titles = [
        node.title for node in story.story_contents.nodes]

    if story.created_on is None or story.last_updated is None:
        raise Exception(
            'No data available for when the story was last_updated on.'
        )
    story_summary = story_domain.StorySummary(
        story.id, story.title, story.description, story.language_code,
        story.version, story_model_node_titles, story.thumbnail_bg_color,
        story.thumbnail_filename, story.url_fragment, story.created_on,
        story.last_updated
    )

    return story_summary


def create_story_summary(story_id: str) -> None:
    """Creates and stores a summary of the given story.

    Args:
        story_id: str. ID of the story.
    """
    story = story_fetchers.get_story_by_id(story_id)
    story_summary = compute_summary_of_story(story)
    save_story_summary(story_summary)


def populate_story_summary_model_fields(
    story_summary_model: story_models.StorySummaryModel,
    story_summary: story_domain.StorySummary
) -> story_models.StorySummaryModel:
    """Populate story summary model with the data from story summary object.

    Args:
        story_summary_model: StorySummaryModel. The model to populate.
        story_summary: StorySummary. The story summary domain object which
            should be used to populate the model.

    Returns:
        StorySummaryModel. Populated model.
    """
    story_summary_dict = {
        'title': story_summary.title,
        'description': story_summary.description,
        'language_code': story_summary.language_code,
        'version': story_summary.version,
        'node_titles': story_summary.node_titles,
        'thumbnail_bg_color': story_summary.thumbnail_bg_color,
        'thumbnail_filename': story_summary.thumbnail_filename,
        'url_fragment': story_summary.url_fragment,
        'story_model_last_updated': (
            story_summary.story_model_last_updated),
        'story_model_created_on': (
            story_summary.story_model_created_on)
    }
    if story_summary_model is not None:
        story_summary_model.populate(**story_summary_dict)
    else:
        story_summary_dict['id'] = story_summary.id
        story_summary_model = story_models.StorySummaryModel(
            **story_summary_dict)

    return story_summary_model


def save_story_summary(story_summary: story_domain.StorySummary) -> None:
    """Save a story summary domain object as a StorySummaryModel
    entity in the datastore.

    Args:
        story_summary: StorySummary. The story summary object to be saved in the
            datastore.
    """
    existing_skill_summary_model = (
        story_models.StorySummaryModel.get_by_id(story_summary.id))
    story_summary_model = populate_story_summary_model_fields(
        existing_skill_summary_model, story_summary
    )
    story_summary_model.update_timestamps()
    story_summary_model.put()


def record_completed_node_in_story_context(
    user_id: str, story_id: str, node_id: str
) -> None:
    """Records a node by a given user in a given story
    context as having been played.

    Args:
        user_id: str. ID of the given user.
        story_id: str. ID of the given story.
        node_id: str. ID of the given node.
    """
    progress_model = user_models.StoryProgressModel.get_or_create(
        user_id, story_id)

    if node_id not in progress_model.completed_node_ids:
        progress_model.completed_node_ids.append(node_id)
        progress_model.update_timestamps()
        progress_model.put()


def get_chapter_notifications_stories_list() -> List[
    story_domain.StoryPublicationTimeliness]:
    """Returns a list of stories with behind-schedule or upcoming chapters.

    Returns:
        list(StoryPublicationTimeliness). A list of stories with having
        behind-schedule chapters or chapters upcoming within
        CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS.
    """
    topic_models = topic_fetchers.get_all_topics()
    chapter_notifications_stories_list: List[
        story_domain.StoryPublicationTimeliness] = []
    all_canonical_story_ids = []
    for topic_model in topic_models:
        canonical_story_ids = [story_reference.story_id
            for story_reference in topic_model.canonical_story_references]
        all_canonical_story_ids += canonical_story_ids
    all_canonical_stories = list(
        filter(
            None, story_fetchers.get_stories_by_ids(all_canonical_story_ids)))
    for topic_model in topic_models:
        topic_rights = topic_fetchers.get_topic_rights(topic_model.id)
        if topic_rights.topic_is_published:
            canonical_stories = [story for story in
                all_canonical_stories if
                story.corresponding_topic_id == topic_model.id]
            for story in canonical_stories:
                overdue_chapters = []
                upcoming_chapters = []
                for node in story.story_contents.nodes:
                    if node.is_node_upcoming():
                        upcoming_chapters.append(node.title)
                    if node.is_node_behind_schedule():
                        overdue_chapters.append(node.title)

                if len(upcoming_chapters) or len(overdue_chapters):
                    story_timeliness = story_domain.StoryPublicationTimeliness(
                        story.id, story.title, topic_model.name,
                        overdue_chapters, upcoming_chapters)
                    chapter_notifications_stories_list.append(story_timeliness)

    return chapter_notifications_stories_list
