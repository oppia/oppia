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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from constants import constants
from core.domain import android_validation_constants
from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.platform import models
import feconf
import utils

(exp_models, story_models, user_models,) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.story, models.NAMES.user])
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
        thumbnail_bg_color=story.thumbnail_bg_color,
        thumbnail_filename=story.thumbnail_filename,
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
        Story, list(str), list(str). The resulting story domain object, the
            exploration IDs removed from story and the exploration IDs added to
            the story.
    """
    story = story_fetchers.get_story_by_id(story_id)
    exp_ids_in_old_story = story.story_contents.get_all_linked_exp_ids()
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
                      story_domain.STORY_NODE_PROPERTY_DESCRIPTION):
                    story.update_node_description(
                        change.node_id, change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_THUMBNAIL_FILENAME):
                    story.update_node_thumbnail_filename(
                        change.node_id, change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR):
                    story.update_node_thumbnail_bg_color(
                        change.node_id, change.new_value)
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
                      story_domain.STORY_PROPERTY_THUMBNAIL_FILENAME):
                    story.update_thumbnail_filename(change.new_value)
                elif (change.property_name ==
                      story_domain.STORY_PROPERTY_THUMBNAIL_BG_COLOR):
                    story.update_thumbnail_bg_color(change.new_value)
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
        raise


def validate_explorations_for_story(exp_ids, raise_error):
    """Validates the explorations in the given story and checks whether they
    are compatible with the mobile app.

    Args:
        exp_ids: list(str). The exp IDs to validate.
        raise_error: bool. Whether to raise an Exception when a validation error
            is encountered. If not, a list of the error messages are
            returned. raise_error should be True when this is called before
            saving the story and False when this function is called from the
            frontend.

    Returns:
        list(str). The various validation error messages (if raise_error is
            False).

    Raises:
        ValidationError. Expected story to only reference valid explorations.
        ValidationError. Exploration with ID is not public. Please publish
            explorations before adding them to a story.
        ValidationError. All explorations in a story should be of the same
            category.
        ValidationError. Invalid language found for exploration.
        ValidationError. Expected no exploration to have parameter values in it.
        ValidationError. Invalid interaction in exploration.
        ValidationError. RTE content in state of exploration with ID is not
            supported on mobile.
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
            if raise_error:
                raise utils.ValidationError(error_string)
            validation_error_messages.append(error_string)
        else:
            if exp_rights_dict[exp_id] != constants.ACTIVITY_STATUS_PUBLIC:
                error_string = (
                    'Exploration with ID %s is not public. Please publish '
                    'explorations before adding them to a story.'
                    % exp_id)
                if raise_error:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)

    if exps_dict:
        for exp_id in exp_ids:
            if exp_id in exps_dict:
                sample_exp_id = exp_id
                break
        common_exp_category = exps_dict[sample_exp_id].category
        for exp_id in exps_dict:
            exp = exps_dict[exp_id]
            if exp.category != common_exp_category:
                error_string = (
                    'All explorations in a story should be of the '
                    'same category. The explorations with ID %s and %s have'
                    ' different categories.' % (sample_exp_id, exp_id))
                if raise_error:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)
            if (
                    exp.language_code not in
                    android_validation_constants.SUPPORTED_LANGUAGES):
                error_string = (
                    'Invalid language %s found for exploration '
                    'with ID %s.' % (exp.language_code, exp_id))
                if raise_error:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)

            if exp.param_specs or exp.param_changes:
                error_string = (
                    'Expected no exploration to have parameter '
                    'values in it. Invalid exploration: %s' % exp.id)
                if raise_error:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)

            for state_name in exp.states:
                state = exp.states[state_name]
                if not state.interaction.is_supported_on_android_app():
                    error_string = (
                        'Invalid interaction %s in exploration '
                        'with ID: %s.' % (state.interaction.id, exp.id))
                    if raise_error:
                        raise utils.ValidationError(error_string)
                    validation_error_messages.append(error_string)

                if not state.is_rte_content_supported_on_android():
                    error_string = (
                        'RTE content in state %s of exploration '
                        'with ID %s is not supported on mobile.'
                        % (state_name, exp.id))
                    if raise_error:
                        raise utils.ValidationError(error_string)
                    validation_error_messages.append(error_string)

                if state.interaction.id == 'EndExploration':
                    recommended_exploration_ids = (
                        state.interaction.customization_args[
                            'recommendedExplorationIds']['value'])
                    if len(recommended_exploration_ids) != 0:
                        error_string = (
                            'Exploration with ID: %s contains exploration '
                            'recommendations in its EndExploration interaction.'
                            % (exp.id))
                        if raise_error:
                            raise utils.ValidationError(error_string)
                        validation_error_messages.append(error_string)

    return validation_error_messages


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

    story.validate()

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
    elif story.version < story_model.version:
        raise Exception(
            'Trying to update version %s of story from version %s, '
            'which is too old. Please reload the page and try again.'
            % (story_model.version, story.version))

    story_model.description = story.description
    story_model.title = story.title
    story_model.thumbnail_bg_color = story.thumbnail_bg_color
    story_model.thumbnail_filename = story.thumbnail_filename
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

    Raises:
        ValidationError. Exploration is already linked to a different story.
    """
    if not commit_message:
        raise ValueError('Expected a commit message but received none.')

    old_story = story_fetchers.get_story_by_id(story_id)
    new_story, exp_ids_removed_from_story, exp_ids_added_to_story = (
        apply_change_list(story_id, change_list))
    _save_story(committer_id, new_story, commit_message, change_list)
    create_story_summary(new_story.id)
    opportunity_services.update_exploration_opportunities(old_story, new_story)

    exploration_context_models_to_be_deleted = (
        exp_models.ExplorationContextModel.get_multi(
            exp_ids_removed_from_story))
    exploration_context_models_to_be_deleted = [
        model for model in exploration_context_models_to_be_deleted
        if model is not None]
    exp_models.ExplorationContextModel.delete_multi(
        exploration_context_models_to_be_deleted)

    exploration_context_models_collisions_list = (
        exp_models.ExplorationContextModel.get_multi(
            exp_ids_added_to_story))
    for context_model in exploration_context_models_collisions_list:
        if context_model is not None and context_model.story_id != story_id:
            raise utils.ValidationError(
                'The exploration with ID %s is already linked to story '
                'with ID %s' % (context_model.id, context_model.story_id))

    new_exploration_context_models = [exp_models.ExplorationContextModel(
        id=exp_id,
        story_id=story_id
    ) for exp_id in exp_ids_added_to_story]
    exp_models.ExplorationContextModel.put_multi(new_exploration_context_models)


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
    exp_ids_to_be_removed = []
    for node in story.story_contents.nodes:
        exp_ids_to_be_removed.append(node.exploration_id)

    exploration_context_models_to_be_deleted = (
        exp_models.ExplorationContextModel.get_multi(
            exp_ids_to_be_removed))
    exploration_context_models_to_be_deleted = [
        model for model in exploration_context_models_to_be_deleted
        if model is not None]
    exp_models.ExplorationContextModel.delete_multi(
        exploration_context_models_to_be_deleted)

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
    story_model_node_titles = [
        node.title for node in story.story_contents.nodes]
    story_summary = story_domain.StorySummary(
        story.id, story.title, story.description, story.language_code,
        story.version, story_model_node_titles, story.thumbnail_bg_color,
        story.thumbnail_filename, story.created_on, story.last_updated
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
    story_summary_dict = {
        'title': story_summary.title,
        'description': story_summary.description,
        'language_code': story_summary.language_code,
        'version': story_summary.version,
        'node_titles': story_summary.node_titles,
        'thumbnail_bg_color': story_summary.thumbnail_bg_color,
        'thumbnail_filename': story_summary.thumbnail_filename,
        'story_model_last_updated': (
            story_summary.story_model_last_updated),
        'story_model_created_on': (
            story_summary.story_model_created_on)
    }

    story_summary_model = (
        story_models.StorySummaryModel.get_by_id(story_summary.id))
    if story_summary_model is not None:
        story_summary_model.populate(**story_summary_dict)
        story_summary_model.put()
    else:
        story_summary_dict['id'] = story_summary.id
        story_models.StorySummaryModel(**story_summary_dict).put()


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
