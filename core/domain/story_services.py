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

import copy
import logging

from core.domain import exp_services
from core.domain import rights_manager
from core.domain import role_services
from core.domain import story_domain
from core.domain import user_services
from core.platform import models
import feconf
import utils

(story_models, user_models) = models.Registry.import_models(
    [models.NAMES.story, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()
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
    story_schema_version = versioned_story_contents['schema_version']
    if not (1 <= story_schema_version
            <= feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d story schemas at '
            'present.' % feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)

    while (story_schema_version <
           feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        story_domain.Story.update_story_contents_from_model(
            versioned_story_contents, story_schema_version)
        story_schema_version += 1


# Repository GET methods.
def _get_story_memcache_key(story_id, version=None):
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
        'schema_version': story_model.schema_version,
        'story_contents': copy.deepcopy(
            story_model.story_contents)
    }

    # Migrate the story if it is not using the latest schema version.
    if (story_model.schema_version !=
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        _migrate_story_contents_to_latest_schema(
            versioned_story_contents)

    return story_domain.Story(
        story_model.id, story_model.title,
        story_model.description, story_model.notes,
        story_domain.StoryContents.from_dict(
            versioned_story_contents['story_contents']),
        versioned_story_contents['schema_version'],
        story_model.language_code,
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
    story_memcache_key = _get_story_memcache_key(
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


def get_new_story_id():
    """Returns a new story id.

    Returns:
        str. A new story id.
    """
    return story_models.StoryModel.get_new_id('')


def _create_story(committer_id, story, commit_message, commit_cmds):
    """Creates a new story.

    Args:
        committer_id: str. ID of the committer.
        story: Story. The story domain object.
        commit_message: str. A description of changes made to the story.
        commit_cmds: list(StoryChange). A list of change commands made to the
            given story.
    """
    story.validate()
    create_new_story_rights(story.id, committer_id)
    model = story_models.StoryModel(
        id=story.id,
        description=story.description,
        title=story.title,
        language_code=story.language_code,
        schema_version=story.schema_version,
        notes=story.notes,
        story_contents=story.story_contents.to_dict()
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    story.version += 1
    create_story_summary(story.id)


def save_new_story(committer_id, story):
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
def apply_change_list(story_id, change_list):
    """Applies a changelist to a story and returns the result.

    Args:
        story_id: str. ID of the given story.
        change_list: list(StoryChange). A change list to be applied to the given
            story.

    Returns:
        Story. The resulting story domain object.
    """
    story = get_story_by_id(story_id)
    try:
        for change in change_list:
            if change.cmd == story_domain.CMD_ADD_STORY_NODE:
                story.add_node(change.node_id, change.title)
            elif change.cmd == story_domain.CMD_DELETE_STORY_NODE:
                story.delete_node(change.node_id)
            elif (change.cmd ==
                  story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS):
                if change.new_value:
                    story.mark_node_outline_as_finalized(change.node_id)
                else:
                    story.mark_node_outline_as_unfinalized(change.node_id)
            elif change.cmd == story_domain.CMD_UPDATE_STORY_NODE_PROPERTY:
                if (change.property_name ==
                        story_domain.STORY_NODE_PROPERTY_OUTLINE):
                    story.update_node_outline(change.node_id, change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_TITLE):
                    story.update_node_title(change.node_id, change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS):
                    story.update_node_acquired_skill_ids(
                        change.node_id, change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS):
                    story.update_node_prerequisite_skill_ids(
                        change.node_id, change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS):
                    story.update_node_destination_node_ids(
                        change.node_id, change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID):
                    story.update_node_exploration_id(
                        change.node_id, change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif change.cmd == story_domain.CMD_UPDATE_STORY_PROPERTY:
                if (change.property_name ==
                        story_domain.STORY_PROPERTY_TITLE):
                    story.update_title(change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_PROPERTY_DESCRIPTION):
                    story.update_description(change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_PROPERTY_NOTES):
                    story.update_notes(change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_PROPERTY_LANGUAGE_CODE):
                    story.update_language_code(change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif change.cmd == story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY:
                if (change.property_name ==
                        story_domain.INITIAL_NODE_ID):
                    story.update_initial_node(change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif (
                    change.cmd ==
                    story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
                # Loading the story model from the datastore into a
                # Story domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # story is sufficient to apply the schema migration.
                continue
            else:
                raise Exception('Invalid change dict.')
        return story

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, story_id, change_list)
        )
        raise


def _save_story(committer_id, story, commit_message, change_list):
    """Validates a story and commits it to persistent storage. If
    successful, increments the version number of the incoming story domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        story: Story. The story domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(StoryChange). List of changes applied to a story.

    Raises:
        ValidationError: An invalid exploration was referenced in the
            story.
        Exception: The story model and the incoming story domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save story %s: %s' % (story.id, change_list))

    story.validate()
    # Validate that all explorations referenced by the story exist.
    exp_ids = []
    for node in story.story_contents.nodes:
        if node.exploration_id is not None:
            exp_ids.append(node.exploration_id)
    exp_summaries = (
        exp_services.get_exploration_summaries_matching_ids(exp_ids))
    exp_summaries_dict = {
        exp_id: exp_summaries[ind] for (ind, exp_id) in enumerate(exp_ids)
    }
    for node in story.story_contents.nodes:
        if (node.exploration_id is not None) and (
                not exp_summaries_dict[node.exploration_id]):
            raise utils.ValidationError(
                'Expected story to only reference valid explorations, '
                'but found an exploration with ID: %s (was it deleted?)' %
                node.exploration_id)

    story_model = story_models.StoryModel.get(story.id, strict=False)
    if story_model is None:
        story_model = story_models.StoryModel(id=story.id)
    else:
        if story.version > story_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of story '
                'from version %s. Please reload the page and try again.'
                % (story_model.version, story.version))
        elif story.version < story_model.version:
            raise Exception(
                'Trying to update version %s of story from version %s, '
                'which is too old. Please reload the page and try again.'
                % (story_model.version, story.version))

    story_model.description = story.description
    story_model.title = story.title
    story_model.notes = story.notes
    story_model.language_code = story.language_code
    story_model.schema_version = story.schema_version
    story_model.story_contents = story.story_contents.to_dict()
    story_model.version = story.version
    change_dicts = [change.to_dict() for change in change_list]
    story_model.commit(committer_id, commit_message, change_dicts)
    memcache_services.delete(_get_story_memcache_key(story.id))
    story.version += 1


def update_story(
        committer_id, story_id, change_list, commit_message):
    """Updates a story. Commits changes.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        story_id: str. The story id.
        change_list: list(StoryChange).These changes are applied in sequence to
            produce the resulting story.
        commit_message: str or None. A description of changes made to the
            story.
    """
    if not commit_message:
        raise ValueError('Expected a commit message but received none.')

    story = apply_change_list(story_id, change_list)
    _save_story(committer_id, story, commit_message, change_list)
    create_story_summary(story.id)


def delete_story(committer_id, story_id, force_deletion=False):
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
    story_model = story_models.StoryModel.get(story_id)
    story_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_STORY_DELETED,
        force_deletion=force_deletion)

    # This must come after the story is retrieved. Otherwise the memcache
    # key will be reinstated.
    story_memcache_key = _get_story_memcache_key(story_id)
    memcache_services.delete(story_memcache_key)

    # Delete the summary of the story (regardless of whether
    # force_deletion is True or not).
    delete_story_summary(story_id)


def delete_story_summary(story_id):
    """Delete a story summary model.

    Args:
        story_id: str. ID of the story whose story summary is to
            be deleted.
    """

    story_models.StorySummaryModel.get(story_id).delete()


def compute_summary_of_story(story):
    """Create a StorySummary domain object for a given Story domain
    object and return it.

    Args:
        story: Story. The story object, for which the summary is to be computed.

    Returns:
        StorySummary. The computed summary for the given story.
    """
    story_model_node_count = len(story.story_contents.nodes)
    story_summary = story_domain.StorySummary(
        story.id, story.title, story.description, story.language_code,
        story.version, story_model_node_count,
        story.created_on, story.last_updated
    )

    return story_summary


def create_story_summary(story_id):
    """Creates and stores a summary of the given story.

    Args:
        story_id: str. ID of the story.
    """
    story = get_story_by_id(story_id)
    story_summary = compute_summary_of_story(story)
    save_story_summary(story_summary)


def save_story_summary(story_summary):
    """Save a story summary domain object as a StorySummaryModel
    entity in the datastore.

    Args:
        story_summary: The story summary object to be saved in the
            datastore.
    """
    story_summary_model = story_models.StorySummaryModel(
        id=story_summary.id,
        title=story_summary.title,
        description=story_summary.description,
        language_code=story_summary.language_code,
        version=story_summary.version,
        node_count=story_summary.node_count,
        story_model_last_updated=(
            story_summary.story_model_last_updated),
        story_model_created_on=(
            story_summary.story_model_created_on)
    )

    story_summary_model.put()


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


def get_node_ids_completed_in_stories(user_id, story_ids):
    """Returns the ids of the nodes completed in each of the stories.

    Args:
        user_id: str. ID of the given user.
        story_ids: list(str). IDs of the stories.

    Returns:
        dict(str, list(str)). Dict of the story id and the node ids completed
            in each story as key-value pairs.
    """
    progress_models = user_models.StoryProgressModel.get_multi(
        user_id, story_ids)

    node_ids_completed_in_stories = {}

    for progress_model in progress_models:
        if progress_model is not None:
            node_ids_completed_in_stories[progress_model.story_id] = (
                progress_model.completed_node_ids)

    return node_ids_completed_in_stories


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


def record_completed_node_in_story_context(user_id, story_id, node_id):
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
        progress_model.put()


def get_story_rights_from_model(story_rights_model):
    """Constructs a StoryRights object from the given story rights model.

    Args:
        story_rights_model: StoryRightsModel. Story rights from the
            datastore.

    Returns:
        StoryRights. The rights object created from the model.
    """

    return story_domain.StoryRights(
        story_rights_model.id,
        story_rights_model.manager_ids,
        story_rights_model.story_is_published
    )


def publish_story(story_id, committer_id):
    """Marks the given story as published.

    Args:
        story_id: str. The id of the given story.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given story does not exist.
        Exception. The story is already published.
        Exception. The user does not have enough rights to publish the story.
    """
    def _are_nodes_valid_for_publishing(story_nodes):
        exploration_id_list = []
        for node in story_nodes:
            if not node.exploration_id:
                raise Exception(
                    'Story node with id %s does not contain an '
                    'exploration id.' % node.id)
            exploration_id_list.append(node.exploration_id)
        for exploration in exp_services.get_multiple_explorations_by_id(
                exploration_id_list):
            if exploration is None:
                raise Exception(
                    'Exploration id %s doesn\'t exist.' % exploration.id)
        multiple_exploration_rights = (
            rights_manager.get_multiple_exploration_rights_by_ids(
                exploration_id_list))
        for exploration_rights in multiple_exploration_rights:
            if exploration_rights.is_private():
                raise Exception(
                    'Exploration with id %s isn\'t published.'
                    % exploration_rights.id)

    story_rights = get_story_rights(story_id, strict=False)
    if story_rights is None:
        raise Exception('The given story does not exist')
    user = user_services.UserActionsInfo(committer_id)
    if role_services.ACTION_CHANGE_STORY_STATUS not in user.actions:
        raise Exception(
            'The user does not have enough rights to publish the story.')

    if story_rights.story_is_published:
        raise Exception('The story is already published.')

    story = get_story_by_id(story_id, strict=False)
    for node in story.story_contents.nodes:
        if node.id == story.story_contents.initial_node_id:
            _are_nodes_valid_for_publishing([node])

    story_rights.story_is_published = True
    commit_cmds = [story_domain.StoryRightsChange({
        'cmd': story_domain.CMD_PUBLISH_STORY
    })]
    save_story_rights(
        story_rights, committer_id, 'Published the story', commit_cmds)


def unpublish_story(story_id, committer_id):
    """Marks the given story as unpublished.

    Args:
        story_id: str. The id of the given story.
        committer_id: str. ID of the committer.

    Raises:
        Exception. The given story does not exist.
        Exception. The story is already unpublished.
        Exception. The user does not have enough rights to unpublish the story.
    """
    story_rights = get_story_rights(story_id, strict=False)
    if story_rights is None:
        raise Exception('The given story does not exist')
    user = user_services.UserActionsInfo(committer_id)
    if role_services.ACTION_CHANGE_STORY_STATUS not in user.actions:
        raise Exception(
            'The user does not have enough rights to unpublish the story.')

    if not story_rights.story_is_published:
        raise Exception('The story is already unpublished.')
    story_rights.story_is_published = False
    commit_cmds = [story_domain.StoryRightsChange({
        'cmd': story_domain.CMD_UNPUBLISH_STORY
    })]
    save_story_rights(
        story_rights, committer_id, 'Unpublished the story', commit_cmds)


def save_story_rights(story_rights, committer_id, commit_message, commit_cmds):
    """Saves a StoryRights domain object to the datastore.

    Args:
        story_rights: StoryRights. The rights object for the given
            story.
        committer_id: str. ID of the committer.
        commit_message: str. Descriptive message for the commit.
        commit_cmds: list(StoryRightsChange). A list of commands describing
            what kind of commit was done.
    """

    model = story_models.StoryRightsModel.get(story_rights.id, strict=False)

    model.manager_ids = story_rights.manager_ids
    model.story_is_published = story_rights.story_is_published
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)


def create_new_story_rights(story_id, committer_id):
    """Creates a new story rights object and saves it to the datastore.

    Args:
        story_id: str. ID of the story.
        committer_id: str. ID of the committer.
    """
    story_rights = story_domain.StoryRights(story_id, [], False)
    commit_cmds = [{'cmd': story_domain.CMD_CREATE_NEW}]

    story_models.StoryRightsModel(
        id=story_rights.id,
        manager_ids=story_rights.manager_ids,
        story_is_published=story_rights.story_is_published
    ).commit(committer_id, 'Created new story rights', commit_cmds)


def get_story_rights(story_id, strict=True):
    """Retrieves the rights object for the given story.

    Args:
        story_id: str. ID of the story.
        strict: bool. Whether to fail noisily if no story with a given id
            exists in the datastore.

    Returns:
        StoryRights. The rights object associated with the given story.

    Raises:
        EntityNotFoundError. The story with ID story_id was not
            found in the datastore.
    """

    model = story_models.StoryRightsModel.get(story_id, strict=strict)

    if model is None:
        return None

    return get_story_rights_from_model(model)


def check_can_edit_story(user, story_rights):
    """Checks whether the user can edit the given story.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        story_rights: StoryRights or None. Rights object for the given story.

    Returns:
        bool. Whether the given user can edit the given story.
    """
    if story_rights is None:
        return False
    if role_services.ACTION_EDIT_ANY_STORY in user.actions:
        return True
    if role_services.ACTION_EDIT_OWNED_STORY not in user.actions:
        return False
    if story_rights.is_manager(user.user_id):
        return True

    return False


def assign_role(committer, assignee, new_role, story_id):
    """Assigns a new role to the user.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user
            who is performing the action.
        assignee: UserActionsInfo. UserActionsInfo object for the user
            whose role is being changed.
        new_role: str. The name of the new role. Possible values are:
            ROLE_MANAGER
        story_id: str. ID of the story.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. The assignee is already a manager for the story.
        Exception. The assignee doesn't have enough rights to become a manager.
        Exception. The role is invalid.
    """
    committer_id = committer.user_id
    story_rights = get_story_rights(story_id)
    if (role_services.ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY not in
            committer.actions):
        logging.error(
            'User %s tried to allow user %s to be a %s of story %s '
            'but was refused permission.' % (
                committer_id, assignee.user_id, new_role, story_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    assignee_username = user_services.get_username(assignee.user_id)
    if role_services.ACTION_EDIT_OWNED_STORY not in assignee.actions:
        raise Exception(
            'The assignee doesn\'t have enough rights to become a manager.')

    old_role = story_domain.ROLE_NONE
    if story_rights.is_manager(assignee.user_id):
        old_role = story_domain.ROLE_MANAGER

    if new_role == story_domain.ROLE_MANAGER:
        if story_rights.is_manager(assignee.user_id):
            raise Exception('This user already is a manager for this story')
        story_rights.manager_ids.append(assignee.user_id)
    elif new_role == story_domain.ROLE_NONE:
        if story_rights.is_manager(assignee.user_id):
            story_rights.manager_ids.remove(assignee.user_id)
        else:
            raise Exception('This user already has no role for this story')
    else:
        raise Exception('Invalid role: %s' % new_role)

    commit_message = 'Changed role of %s from %s to %s' % (
        assignee_username, old_role, new_role)
    commit_cmds = [story_domain.StoryRightsChange({
        'cmd': story_domain.CMD_CHANGE_ROLE,
        'assignee_id': assignee.user_id,
        'old_role': old_role,
        'new_role': new_role
    })]

    save_story_rights(story_rights, committer_id, commit_message, commit_cmds)
