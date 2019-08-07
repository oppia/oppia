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

import logging

from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.platform import models
import feconf
import utils

(story_models, user_models,) = models.Registry.import_models(
    [models.NAMES.story, models.NAMES.user])
memcache_services = models.Registry.import_memcache_services()


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
        story_contents_schema_version=story.story_contents_schema_version,
        notes=story.notes,
        story_contents=story.story_contents.to_dict(),
        corresponding_topic_id=story.corresponding_topic_id
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
    story = story_fetchers.get_story_by_id(story_id)
    try:
        for change in change_list:
            if not isinstance(change, story_domain.StoryChange):
                raise Exception('Expected change to be of type StoryChange')
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
            elif change.cmd == story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY:
                if (change.property_name ==
                        story_domain.INITIAL_NODE_ID):
                    story.update_initial_node(change.new_value)
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
        exp_fetchers.get_exploration_summaries_matching_ids(exp_ids))
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
    elif story.version < story_model.version:
        raise Exception(
            'Trying to update version %s of story from version %s, '
            'which is too old. Please reload the page and try again.'
            % (story_model.version, story.version))

    topic = topic_fetchers.get_topic_by_id(
        story.corresponding_topic_id, strict=False)
    if topic is None:
        raise utils.ValidationError(
            'Expected story to only belong to a valid topic, but found an '
            'topic with ID: %s' % story.corresponding_topic_id)

    canonical_story_ids = topic.get_canonical_story_ids()
    additional_story_ids = topic.get_additional_story_ids()
    if story.id not in canonical_story_ids + additional_story_ids:
        raise Exception(
            'Expected story to belong to the topic %s, but it is '
            'neither a part of the canonical stories or the additional stories '
            'of the topic.' % story.corresponding_topic_id)

    story_model.description = story.description
    story_model.title = story.title
    story_model.notes = story.notes
    story_model.language_code = story.language_code
    story_model.story_contents_schema_version = (
        story.story_contents_schema_version)
    story_model.story_contents = story.story_contents.to_dict()
    story_model.corresponding_topic_id = story.corresponding_topic_id
    story_model.version = story.version
    change_dicts = [change.to_dict() for change in change_list]
    story_model.commit(committer_id, commit_message, change_dicts)
    memcache_services.delete(story_fetchers.get_story_memcache_key(story.id))
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

    old_story = story_fetchers.get_story_by_id(story_id)
    new_story = apply_change_list(story_id, change_list)
    _save_story(committer_id, new_story, commit_message, change_list)
    create_story_summary(new_story.id)
    opportunity_services.update_exploration_opportunities(old_story, new_story)


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
    story = story_fetchers.get_story_from_model(story_model)
    exp_ids = story.story_contents.get_all_linked_exp_ids()
    story_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_STORY_DELETED,
        force_deletion=force_deletion)

    # This must come after the story is retrieved. Otherwise the memcache
    # key will be reinstated.
    story_memcache_key = story_fetchers.get_story_memcache_key(story_id)
    memcache_services.delete(story_memcache_key)

    # Delete the summary of the story (regardless of whether
    # force_deletion is True or not).
    delete_story_summary(story_id)

    # Delete the opportunities available related to the exploration used in the
    # story.
    opportunity_services.delete_exploration_opportunities(exp_ids)


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
    story = story_fetchers.get_story_by_id(story_id)
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
