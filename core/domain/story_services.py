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
from core.domain import story_domain
from core.platform import models
import feconf
import utils

(story_models,) = models.Registry.import_models([models.NAMES.story])
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


def get_story_from_model(story_model, run_conversion=True):
    """Returns a story domain object given a story model loaded
    from the datastore.

    Args:
        story_model: StoryModel. The story model loaded from the
            datastore.
        run_conversion: bool. If true, the the story's schema version will
            be checked against the current schema version. If they do not match,
            the story will be automatically updated to the latest schema
            version.

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
    if (run_conversion and story_model.schema_version !=
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
    model = story_models.StoryModel(
        id=story.id,
        description=story.description,
        title=story.title,
        language_code=story.language_code,
        schema_version=story.schema_version,
        notes=story.notes,
        story_contents=story.story_contents.to_dict()
    )
    commit_cmds = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmds)
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
            story. Each entry in change_list is a StoryChange object.

    Returns:
        Story. The resulting story domain object.
    """
    story = get_story_by_id(story_id)
    try:
        for change in change_list:
            if change.cmd == story_domain.CMD_ADD_STORY_NODE:
                story.add_node(change.node_id)
            elif change.cmd == story_domain.CMD_DELETE_STORY_NODE:
                story.delete_node(change.node_id)
            elif change.cmd == story_domain.CMD_UPDATE_STORY_NODE_PROPERTY:
                if (change.property_name ==
                        story_domain.STORY_NODE_PROPERTY_OUTLINE):
                    story.update_node_outline(change.node_id, change.new_value)
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
            elif (
                    change.cmd ==
                    story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION):
                # Loading the story model from the datastore into a
                # Story domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # story is sufficient to apply the schema migration.
                continue
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
        change_list: list(StoryChange). List of changes applied to a story. Each
            entry in change_list is a StoryChange object.

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
    story_model.story_contents = {
        'nodes': [
            node.to_dict() for node in story.story_contents.nodes
        ]
    }
    story_model.version = story.version
    change_list = [change.to_dict() for change in change_list]
    story_model.commit(committer_id, commit_message, change_list)
    memcache_services.delete(_get_story_memcache_key(story.id))
    story.version += 1


def update_story(
        committer_id, story_id, change_list, commit_message):
    """Updates a story. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - story_id: str. The story id.
    - change_list: list(StoryChange). Each element in the list represents a
        StoryChange object. These changes are applied in sequence to produce the
        resulting story.
    - commit_message: str or None. A description of changes made to the
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
        story.id, story.title, story.language_code,
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
        language_code=story_summary.language_code,
        version=story_summary.version,
        node_count=story_summary.node_count,
        story_model_last_updated=(
            story_summary.story_model_last_updated),
        story_model_created_on=(
            story_summary.story_model_created_on)
    )

    story_summary_model.put()
