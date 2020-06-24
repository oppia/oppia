# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Commands that can be used to operate on explorations.

All functions here should be agnostic of how ExplorationModel objects are
stored in the database. In particular, the various query methods should
delegate to the Exploration model class. This will enable the exploration
storage model to be changed without affecting this module and others above it.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import datetime
import logging
import math
import os
import pprint
import traceback
import zipfile

from constants import constants
from core.domain import activity_services
from core.domain import classifier_services
from core.domain import draft_upgrade_services
from core.domain import email_subscription_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import fs_domain
from core.domain import html_cleaner
from core.domain import opportunity_services
from core.domain import param_domain
from core.domain import rights_manager
from core.domain import search_services
from core.domain import state_domain
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
import feconf
import python_utils
import utils

datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()
taskqueue_services = models.Registry.import_taskqueue_services()
(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])

# Name for the exploration search index.
SEARCH_INDEX_EXPLORATIONS = 'explorations'

# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS = 10


def is_exp_summary_editable(exp_summary, user_id=None):
    """Checks if a given user has permissions to edit the exploration.

    Args:
        exp_summary: ExplorationSummary. An ExplorationSummary domain object.
        user_id: str. The id of the user whose permissions are being checked.

    Returns:
        bool. Whether the user has permissions to edit the exploration.
    """
    return user_id is not None and (
        user_id in exp_summary.editor_ids
        or user_id in exp_summary.owner_ids
        or exp_summary.community_owned)


# Query methods.
def get_exploration_titles_and_categories(exp_ids):
    """Returns exploration titles and categories for the given ids.

    The result is a dict with exploration ids as keys. The corresponding values
    are dicts with the keys 'title' and 'category'.

    Any invalid exp_ids will not be included in the return dict. No error will
    be raised.

    Args:
        exp_ids: list(str). A list of exploration ids of exploration domain
            objects.

    Returns:
        dict. The keys are exploration ids and the corresponding values are
        dicts with the keys 'title' and 'category'. Any invalid exploration
        ids are excluded.
    """
    explorations = [
        (exp_fetchers.get_exploration_from_model(e) if e else None)
        for e in exp_models.ExplorationModel.get_multi(exp_ids)]

    result = {}
    for exploration in explorations:
        if exploration is None:
            logging.error(
                'Could not find exploration corresponding to id')
        else:
            result[exploration.id] = {
                'title': exploration.title,
                'category': exploration.category,
            }
    return result


def get_exploration_ids_matching_query(query_string, cursor=None):
    """Returns a list with all exploration ids matching the given search query
    string, as well as a search cursor for future fetches.

    This method returns exactly feconf.SEARCH_RESULTS_PAGE_SIZE results if
    there are at least that many, otherwise it returns all remaining results.
    (If this behaviour does not occur, an error will be logged.) The method
    also returns a search cursor.

    Args:
        query_string: str. A search query string.
        cursor: str or None. Optional cursor from which to start the search
            query. If no cursor is supplied, the first N results matching
            the query are returned.

    Returns:
        list(str). A list of exploration ids matching the given search query.
    """
    returned_exploration_ids = []
    search_cursor = cursor

    for _ in python_utils.RANGE(MAX_ITERATIONS):
        remaining_to_fetch = feconf.SEARCH_RESULTS_PAGE_SIZE - len(
            returned_exploration_ids)

        exp_ids, search_cursor = search_services.search_explorations(
            query_string, remaining_to_fetch, cursor=search_cursor)

        invalid_exp_ids = []
        for ind, model in enumerate(
                exp_models.ExpSummaryModel.get_multi(exp_ids)):
            if model is not None:
                returned_exploration_ids.append(exp_ids[ind])
            else:
                invalid_exp_ids.append(exp_ids[ind])

        if (len(returned_exploration_ids) == feconf.SEARCH_RESULTS_PAGE_SIZE
                or search_cursor is None):
            break
        else:
            logging.error(
                'Search index contains stale exploration ids: %s' %
                ', '.join(invalid_exp_ids))

    if (len(returned_exploration_ids) < feconf.SEARCH_RESULTS_PAGE_SIZE
            and search_cursor is not None):
        logging.error(
            'Could not fulfill search request for query string %s; at least '
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))

    return (returned_exploration_ids, search_cursor)


def get_non_private_exploration_summaries():
    """Returns a dict with all non-private exploration summary domain objects,
    keyed by their id.

    Returns:
        dict. The keys are exploration ids and the values are corresponding
        non-private ExplorationSummary domain objects.
    """
    return exp_fetchers.get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_non_private())


def get_top_rated_exploration_summaries(limit):
    """Returns a dict with top rated exploration summary model instances,
    keyed by their id. At most 'limit' entries are returned.

    Args:
        limit: int. The maximum number of exploration summary model instances to
            be returned.

    Returns:
        dict. The keys are exploration ids and the values are the corresponding
        top rated ExplorationSummary domain model instances.  At most limit
        entries are returned.
    """
    return exp_fetchers.get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_top_rated(limit))


def get_recently_published_exp_summaries(limit):
    """Returns a dict with recently published ExplorationSummary model
    instances, keyed by their exploration id. At most 'limit' entries are
    returned.

    Args:
        limit: int. The maximum number of exploration summary model instances to
            be returned.

    Returns:
        dict. The dict contains recently published ExplorationSummary model
            instances as a value keyed by their exploration id. At most 'limit'
            entries are returned.
    """
    return exp_fetchers.get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_recently_published(limit))


def get_story_id_linked_to_exploration(exp_id):
    """Returns the ID of the story that the exploration is a part of, or None if
    the exploration is not part of a story.

    Args:
        exp_id: str. The ID of the exploration.

    Returns:
        str|None. The ID of the story if the exploration is linked to some
            story, otherwise None.
    """
    exploration_context_model = exp_models.ExplorationContextModel.get_by_id(
        exp_id)
    if exploration_context_model is not None:
        return exploration_context_model.story_id
    return None


def get_all_exploration_summaries():
    """Returns a dict with all exploration summary domain objects,
    keyed by their id.

    Returns:
        dict. A dict with all ExplorationSummary domain objects keyed by their
        exploration id.
    """
    return exp_fetchers.get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_all())


# Methods for exporting states and explorations to other formats.
def export_to_zip_file(exploration_id, version=None):
    """Returns a ZIP archive of the exploration.

    Args:
        exploration_id: str. The id of the exploration to export.
        version: int or None. If provided, this indicates which version of
            the exploration to export. Otherwise, the latest version of the
            exploration is exported.

    Returns:
        str. The contents of the ZIP archive of the exploration (which can be
        subsequently converted into a zip file via zipfile.ZipFile()).
    """
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=version)
    yaml_repr = exploration.to_yaml()

    memfile = python_utils.string_io()
    with zipfile.ZipFile(
        memfile, mode='w', compression=zipfile.ZIP_DEFLATED) as zfile:
        if not exploration.title:
            zfile.writestr('Unpublished_exploration.yaml', yaml_repr)
        else:
            zfile.writestr('%s.yaml' % exploration.title, yaml_repr)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exploration_id))
        dir_list = fs.listdir('')
        for filepath in dir_list:
            file_contents = fs.get(filepath)

            str_filepath = 'assets/%s' % filepath
            assert isinstance(str_filepath, python_utils.UNICODE)
            unicode_filepath = str_filepath.decode('utf-8')
            zfile.writestr(unicode_filepath, file_contents)

    return memfile.getvalue()


def export_states_to_yaml(exploration_id, version=None, width=80):
    """Returns a dictionary of the exploration, whose keys are state
    names and values are yaml strings representing the state contents with
    lines wrapped at 'width' characters.

    Args:
        exploration_id: str. The id of the exploration whose states should
            be exported.
        version: int or None. The version of the exploration to be returned.
            If None, the latest version of the exploration is returned.
        width: int. Width for the yaml representation, default value
            is set to be of 80.

    Returns:
        dict. The keys are state names, and the values are YAML strings
        representing the corresponding state's contents.
    """
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=version)
    exploration_dict = {}
    for state in exploration.states:
        exploration_dict[state] = python_utils.yaml_from_dict(
            exploration.states[state].to_dict(), width=width)
    return exploration_dict


# Repository SAVE and DELETE methods.
def apply_change_list(exploration_id, change_list):
    """Applies a changelist to a pristine exploration and returns the result.

    Each entry in change_list is a dict that represents an ExplorationChange
    object.

    Args:
        exploration_id: str. The id of the exploration to which the change list
            is to be applied.
        change_list: list(ExplorationChange). The list of changes to apply.

    Returns:
        Exploration. The exploration domain object that results from applying
        the given changelist to the existing version of the exploration.

    Raises:
        Exception: Any entries in the changelist are invalid.
    """
    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    try:
        to_param_domain = param_domain.ParamChange.from_dict
        for change in change_list:
            if change.cmd == exp_domain.CMD_ADD_STATE:
                exploration.add_states([change.state_name])
            elif change.cmd == exp_domain.CMD_RENAME_STATE:
                exploration.rename_state(
                    change.old_state_name, change.new_state_name)
            elif change.cmd == exp_domain.CMD_DELETE_STATE:
                exploration.delete_state(change.state_name)
            elif change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                state = exploration.states[change.state_name]
                if (change.property_name ==
                        exp_domain.STATE_PROPERTY_PARAM_CHANGES):
                    state.update_param_changes(
                        list(python_utils.MAP(
                            to_param_domain, change.new_value)))
                elif change.property_name == exp_domain.STATE_PROPERTY_CONTENT:
                    state.update_content(
                        state_domain.SubtitledHtml.from_dict(change.new_value))
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_ID):
                    state.update_interaction_id(change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                    state.update_interaction_customization_args(
                        change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_HANDLERS):
                    raise utils.InvalidInputException(
                        'Editing interaction handlers is no longer supported')
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                    state.update_interaction_answer_groups(change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME):
                    new_outcome = None
                    if change.new_value:
                        new_outcome = state_domain.Outcome.from_dict(
                            change.new_value
                        )
                    state.update_interaction_default_outcome(new_outcome)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS):
                    state.update_interaction_confirmed_unclassified_answers(
                        change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_HINTS):
                    if not isinstance(change.new_value, list):
                        raise Exception('Expected hints_list to be a list,'
                                        ' received %s' % change.new_value)
                    new_hints_list = [state_domain.Hint.from_dict(hint_dict)
                                      for hint_dict in change.new_value]
                    state.update_interaction_hints(new_hints_list)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION):
                    new_solution = None
                    if change.new_value is not None:
                        new_solution = state_domain.Solution.from_dict(
                            state.interaction.id, change.new_value)
                    state.update_interaction_solution(new_solution)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS):
                    if not isinstance(change.new_value, bool):
                        raise Exception(
                            'Expected solicit_answer_details to be a ' +
                            'bool, received %s' % change.new_value)
                    state.update_solicit_answer_details(change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS):
                    if not isinstance(change.new_value, dict):
                        raise Exception(
                            'Expected recorded_voiceovers to be a dict, '
                            'received %s' % change.new_value)
                    # Explicitly convert the duration_secs value from
                    # int to float. Reason for this is the data from
                    # the frontend will be able to match the backend
                    # state model for Voiceover properly. Also js
                    # treats any number that can be float and int as
                    # int (no explicit types). For example,
                    # 10.000 is not 10.000 it is 10.
                    new_voiceovers_mapping = (
                        change.new_value['voiceovers_mapping'])
                    language_codes_to_audio_metadata = (
                        new_voiceovers_mapping.values())
                    for language_codes in language_codes_to_audio_metadata:
                        for audio_metadata in language_codes.values():
                            audio_metadata['duration_secs'] = (
                                float(audio_metadata['duration_secs'])
                            )
                    recorded_voiceovers = (
                        state_domain.RecordedVoiceovers.from_dict(
                            change.new_value))
                    state.update_recorded_voiceovers(recorded_voiceovers)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_WRITTEN_TRANSLATIONS):
                    if not isinstance(change.new_value, dict):
                        raise Exception(
                            'Expected written_translations to be a dict, '
                            'received %s' % change.new_value)
                    written_translations = (
                        state_domain.WrittenTranslations.from_dict(
                            change.new_value))
                    state.update_written_translations(written_translations)
            elif change.cmd == exp_domain.CMD_ADD_TRANSLATION:
                exploration.states[change.state_name].add_translation(
                    change.content_id, change.language_code,
                    change.translation_html)
            elif change.cmd == exp_domain.CMD_EDIT_EXPLORATION_PROPERTY:
                if change.property_name == 'title':
                    exploration.update_title(change.new_value)
                elif change.property_name == 'category':
                    exploration.update_category(change.new_value)
                elif change.property_name == 'objective':
                    exploration.update_objective(change.new_value)
                elif change.property_name == 'language_code':
                    exploration.update_language_code(change.new_value)
                elif change.property_name == 'tags':
                    exploration.update_tags(change.new_value)
                elif change.property_name == 'blurb':
                    exploration.update_blurb(change.new_value)
                elif change.property_name == 'author_notes':
                    exploration.update_author_notes(change.new_value)
                elif change.property_name == 'param_specs':
                    exploration.update_param_specs(change.new_value)
                elif change.property_name == 'param_changes':
                    exploration.update_param_changes(
                        list(python_utils.MAP(
                            to_param_domain, change.new_value)))
                elif change.property_name == 'init_state_name':
                    exploration.update_init_state_name(change.new_value)
                elif change.property_name == 'auto_tts_enabled':
                    exploration.update_auto_tts_enabled(change.new_value)
                elif change.property_name == 'correctness_feedback_enabled':
                    exploration.update_correctness_feedback_enabled(
                        change.new_value)
            elif (
                    change.cmd ==
                    exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
                # Loading the exploration model from the datastore into an
                # Exploration domain object automatically converts it to use
                # the latest states schema version. As a result, simply
                # resaving the exploration is sufficient to apply the states
                # schema update. Thus, no action is needed here other than
                # to make sure that the version that the user is trying to
                # migrate to is the latest version.
                target_version_is_current_state_schema_version = (
                    change.to_version ==
                    python_utils.UNICODE(feconf.CURRENT_STATE_SCHEMA_VERSION))
                if not target_version_is_current_state_schema_version:
                    raise Exception(
                        'Expected to migrate to the latest state schema '
                        'version %s, received %s' % (
                            feconf.CURRENT_STATE_SCHEMA_VERSION,
                            change.to_version))
        return exploration

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, exploration_id,
                pprint.pprint(change_list))
        )
        logging.error(traceback.format_exc())
        raise


def _save_exploration(committer_id, exploration, commit_message, change_list):
    """Validates an exploration and commits it to persistent storage.

    If successful, increments the version number of the incoming exploration
    domain object by 1.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration: Exploration. The exploration to be saved.
        commit_message: str. The commit message.
        change_list: list(ExplorationChange). A list of changes introduced in
            this commit.

    Raises:
        Exception: The versions of the given exploration and the currently
            stored exploration model do not match.
    """
    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    if exploration_rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE:
        exploration.validate(strict=True)
    else:
        exploration.validate()

    exploration_model = exp_models.ExplorationModel.get(exploration.id)

    if exploration.version > exploration_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of exploration '
            'from version %s. Please reload the page and try again.'
            % (exploration_model.version, exploration.version))
    elif exploration.version < exploration_model.version:
        raise Exception(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_model.version, exploration.version))

    old_states = exp_fetchers.get_exploration_from_model(
        exploration_model).states
    exploration_model.category = exploration.category
    exploration_model.title = exploration.title
    exploration_model.objective = exploration.objective
    exploration_model.language_code = exploration.language_code
    exploration_model.tags = exploration.tags
    exploration_model.blurb = exploration.blurb
    exploration_model.author_notes = exploration.author_notes

    exploration_model.states_schema_version = exploration.states_schema_version
    exploration_model.init_state_name = exploration.init_state_name
    exploration_model.states = {
        state_name: state.to_dict()
        for (state_name, state) in exploration.states.items()}
    exploration_model.param_specs = exploration.param_specs_dict
    exploration_model.param_changes = exploration.param_change_dicts
    exploration_model.auto_tts_enabled = exploration.auto_tts_enabled
    exploration_model.correctness_feedback_enabled = (
        exploration.correctness_feedback_enabled)

    change_list_dict = [change.to_dict() for change in change_list]
    exploration_model.commit(committer_id, commit_message, change_list_dict)
    exp_memcache_key = exp_fetchers.get_exploration_memcache_key(exploration.id)
    memcache_services.delete(exp_memcache_key)

    exploration.version += 1

    exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

    # Trigger statistics model update.
    new_exp_stats = stats_services.get_stats_for_new_exp_version(
        exploration.id, exploration.version, exploration.states,
        exp_versions_diff=exp_versions_diff, revert_to_version=None)

    stats_services.create_stats_model(new_exp_stats)

    if feconf.ENABLE_ML_CLASSIFIERS:
        trainable_states_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        state_names_with_changed_answer_groups = trainable_states_dict[
            'state_names_with_changed_answer_groups']
        state_names_with_unchanged_answer_groups = trainable_states_dict[
            'state_names_with_unchanged_answer_groups']
        state_names_to_train_classifier = state_names_with_changed_answer_groups
        if state_names_with_unchanged_answer_groups:
            state_names_without_classifier = (
                classifier_services.handle_non_retrainable_states(
                    exploration, state_names_with_unchanged_answer_groups,
                    exp_versions_diff))
            state_names_to_train_classifier.extend(
                state_names_without_classifier)
        if state_names_to_train_classifier:
            classifier_services.handle_trainable_states(
                exploration, state_names_to_train_classifier)

    # Trigger exploration issues model updation.
    stats_services.update_exp_issues_for_new_exp_version(
        exploration, exp_versions_diff=exp_versions_diff,
        revert_to_version=None)


def _create_exploration(
        committer_id, exploration, commit_message, commit_cmds):
    """Ensures that rights for a new exploration are saved first.

    This is because _save_exploration() depends on the rights object being
    present to tell it whether to do strict validation or not.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration: Exploration. The exploration domain object.
        commit_message: str. The commit description message.
        commit_cmds: list(ExplorationChange). A list of commands, describing
            changes made in this model, which should give sufficient information
            to reconstruct the commit.
    """
    # This line is needed because otherwise a rights object will be created,
    # but the creation of an exploration object will fail.
    exploration.validate()
    rights_manager.create_new_exploration_rights(exploration.id, committer_id)

    model = exp_models.ExplorationModel(
        id=exploration.id,
        category=exploration.category,
        title=exploration.title,
        objective=exploration.objective,
        language_code=exploration.language_code,
        tags=exploration.tags,
        blurb=exploration.blurb,
        author_notes=exploration.author_notes,
        states_schema_version=exploration.states_schema_version,
        init_state_name=exploration.init_state_name,
        states={
            state_name: state.to_dict()
            for (state_name, state) in exploration.states.items()},
        param_specs=exploration.param_specs_dict,
        param_changes=exploration.param_change_dicts,
        auto_tts_enabled=exploration.auto_tts_enabled,
        correctness_feedback_enabled=exploration.correctness_feedback_enabled
    )
    commit_cmds_dict = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmds_dict)
    exploration.version += 1

    # Trigger statistics model creation.
    exploration_stats = stats_services.get_stats_for_new_exploration(
        exploration.id, exploration.version, exploration.states)
    stats_services.create_stats_model(exploration_stats)

    if feconf.ENABLE_ML_CLASSIFIERS:
        # Find out all states that need a classifier to be trained.
        state_names_to_train = []
        for state_name in exploration.states:
            state = exploration.states[state_name]
            if state.can_undergo_classification():
                state_names_to_train.append(state_name)

        if state_names_to_train:
            classifier_services.handle_trainable_states(
                exploration, state_names_to_train)

    # Trigger exploration issues model creation.
    stats_services.create_exp_issues_for_new_exploration(
        exploration.id, exploration.version)

    create_exploration_summary(exploration.id, committer_id)


def save_new_exploration(committer_id, exploration):
    """Saves a newly created exploration.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration: Exploration. The exploration domain object to be saved.
    """
    commit_message = (
        ('New exploration created with title \'%s\'.' % exploration.title)
        if exploration.title else 'New exploration created.')
    _create_exploration(
        committer_id, exploration, commit_message, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': exploration.title,
                'category': exploration.category,
            })])
    user_services.add_created_exploration_id(committer_id, exploration.id)
    user_services.add_edited_exploration_id(committer_id, exploration.id)
    user_services.record_user_created_an_exploration(committer_id)


def delete_exploration(committer_id, exploration_id, force_deletion=False):
    """Deletes the exploration with the given exploration_id.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete this exploration, prior to calling this function.

    If force_deletion is True the exploration and its history are fully deleted
    and are unrecoverable. Otherwise, the exploration and all its history are
    marked as deleted, but the corresponding models are still retained in the
    datastore. This last option is the preferred one.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration_id: str. The id of the exploration to be deleted.
        force_deletion: bool. If True, completely deletes the storage models
            corresponding to the exploration. Otherwise, marks them as deleted
            but keeps the corresponding models in the datastore.
    """
    delete_explorations(
        committer_id, [exploration_id], force_deletion=force_deletion)


def delete_explorations(committer_id, exploration_ids, force_deletion=False):
    """Delete the explorations with the given exploration_ids.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete these explorations, prior to calling this function.

    If force_deletion is True the explorations and its histories are fully
    deleted and are unrecoverable. Otherwise, the explorations and all its
    histories are marked as deleted, but the corresponding models are still
    retained in the datastore. This last option is the preferred one.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration_ids: list(str). The ids of the explorations to be deleted.
        force_deletion: bool. If True, completely deletes the storage models
            corresponding to the explorations. Otherwise, marks them as deleted
            but keeps the corresponding models in the datastore.
    """
    # TODO(sll): Delete the files too?
    exp_models.ExplorationRightsModel.delete_multi(
        exploration_ids, committer_id, '', force_deletion=force_deletion)
    exp_models.ExplorationModel.delete_multi(
        exploration_ids, committer_id,
        feconf.COMMIT_MESSAGE_EXPLORATION_DELETED,
        force_deletion=force_deletion)

    # This must come after the explorations are retrieved. Otherwise the
    # memcache keys will be reinstated.
    exploration_memcache_keys = [
        exp_fetchers.get_exploration_memcache_key(exploration_id)
        for exploration_id in exploration_ids]
    memcache_services.delete_multi(exploration_memcache_keys)

    # Delete the explorations from search.
    search_services.delete_explorations_from_search_index(exploration_ids)

    # Delete the exploration summaries, regardless of whether or not
    # force_deletion is True.
    delete_exploration_summaries(exploration_ids)

    # Remove the explorations from the featured activity references, if
    # necessary.
    activity_services.remove_featured_activities(
        constants.ACTIVITY_TYPE_EXPLORATION, exploration_ids)

    # Remove from subscribers.
    taskqueue_services.defer(
        delete_explorations_from_subscribed_users,
        taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS,
        exploration_ids)


def delete_explorations_from_subscribed_users(exploration_ids):
    """Remove explorations from all subscribers' activity_ids.

    Args:
        exploration_ids: list(str). The ids of the explorations to delete.
    """
    if not exploration_ids:
        return

    subscription_models = user_models.UserSubscriptionsModel.query(
        user_models.UserSubscriptionsModel.activity_ids.IN(exploration_ids)
    ).fetch()
    for model in subscription_models:
        model.activity_ids = [
            id_ for id_ in model.activity_ids if id_ not in exploration_ids]
    user_models.UserSubscriptionsModel.put_multi(subscription_models)


# Operations on exploration snapshots.
def get_exploration_snapshots_metadata(exploration_id, allow_deleted=False):
    """Returns the snapshots for this exploration, as dicts, up to and including
    the latest version of the exploration.

    Args:
        exploration_id: str. The id of the exploration whose snapshots_metadata
            is required.
        allow_deleted: bool. Whether to allow retrieval of deleted snapshots.

    Returns:
        list(dict). List of dicts, each representing a recent snapshot. Each
        dict has the following keys: committer_id, commit_message, commit_cmds,
        commit_type, created_on_ms, version_number. The version numbers are
        consecutive and in ascending order. There are exploration.version_number
        items in the returned list.
    """
    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    current_version = exploration.version
    version_nums = list(python_utils.RANGE(1, current_version + 1))

    return exp_models.ExplorationModel.get_snapshots_metadata(
        exploration_id, version_nums, allow_deleted=allow_deleted)


def get_last_updated_by_human_ms(exp_id):
    """Return the last time, in milliseconds, when the given exploration was
    updated by a human.

    Args:
        exp_id: str. The id of the exploration.

    Returns:
        float. The last time in milliseconds when a given exploration was
        updated by a human.
    """
    # Iterate backwards through the exploration history metadata until we find
    # the most recent snapshot that was committed by a human.
    last_human_update_ms = 0
    snapshots_metadata = get_exploration_snapshots_metadata(exp_id)
    for snapshot_metadata in reversed(snapshots_metadata):
        if snapshot_metadata['committer_id'] != feconf.MIGRATION_BOT_USER_ID:
            last_human_update_ms = snapshot_metadata['created_on_ms']
            break

    return last_human_update_ms


def publish_exploration_and_update_user_profiles(committer, exp_id):
    """Publishes the exploration with publish_exploration() function in
    rights_manager.py, as well as updates first_contribution_msec. Sends an
    email to the subscribers of the committer informing them that an exploration
    has been published.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publication.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user who
            made the commit.
        exp_id: str. The id of the exploration to be published.
    """
    rights_manager.publish_exploration(committer, exp_id)
    exp_title = exp_fetchers.get_exploration_by_id(exp_id).title
    email_subscription_services.inform_subscribers(
        committer.user_id, exp_id, exp_title)
    contribution_time_msec = utils.get_current_time_in_millisecs()
    contributor_ids = exp_fetchers.get_exploration_summary_by_id(
        exp_id).contributor_ids
    for contributor in contributor_ids:
        user_services.update_first_contribution_msec_if_not_set(
            contributor, contribution_time_msec)


def update_exploration(
        committer_id, exploration_id, change_list, commit_message,
        is_suggestion=False, is_by_voice_artist=False):
    """Update an exploration. Commits changes.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        exploration_id: str. The id of the exploration to be updated.
        change_list: list(ExplorationChange) or None. A change list to be
            applied to the given exploration. If None, it corresponds to an
            empty list.
        commit_message: str or None. A description of changes made to the state.
            For published explorations, this must be present; for unpublished
            explorations, it should be equal to None. For suggestions that are
            being accepted, and only for such commits, it should start with
            feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX.
        is_suggestion: bool. Whether the update is due to a suggestion being
            accepted.
        is_by_voice_artist: bool. Whether the changes are made by a
            voice artist.

    Raises:
        ValueError: No commit message is supplied and the exploration is public.
        ValueError: The update is due to a suggestion and the commit message is
            invalid.
        ValueError: The update is not due to a suggestion, and the commit
            message starts with the same prefix as the commit message for
            accepted suggestions.
    """
    if change_list is None:
        change_list = []

    if is_by_voice_artist and not is_voiceover_change_list(change_list):
        raise utils.ValidationError(
            'Voice artist does not have permission to make some '
            'changes in the change list.')

    is_public = rights_manager.is_exploration_public(exploration_id)
    if is_public and not commit_message:
        raise ValueError(
            'Exploration is public so expected a commit message but '
            'received none.')

    if (is_suggestion and (
            not commit_message or
            not commit_message.startswith(
                feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX))):
        raise ValueError('Invalid commit message for suggestion.')
    if (not is_suggestion and commit_message and commit_message.startswith(
            feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX)):
        raise ValueError(
            'Commit messages for non-suggestions may not start with \'%s\'' %
            feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX)

    updated_exploration = apply_change_list(exploration_id, change_list)
    _save_exploration(
        committer_id, updated_exploration, commit_message, change_list)

    discard_draft(exploration_id, committer_id)
    # Update summary of changed exploration.
    update_exploration_summary(exploration_id, committer_id)

    if committer_id != feconf.MIGRATION_BOT_USER_ID:
        user_services.add_edited_exploration_id(committer_id, exploration_id)
        user_services.record_user_edited_an_exploration(committer_id)
        if not rights_manager.is_exploration_private(exploration_id):
            user_services.update_first_contribution_msec_if_not_set(
                committer_id, utils.get_current_time_in_millisecs())

    if opportunity_services.is_exploration_available_for_contribution(
            exploration_id):
        opportunity_services.update_opportunity_with_updated_exploration(
            exploration_id)


def create_exploration_summary(exploration_id, contributor_id_to_add):
    """Create the summary model for an exploration, and store it in the
    datastore.

    Args:
        exploration_id: str. The id of the exploration.
        contributor_id_to_add: str or None. The user_id of user who have
            created the exploration will be added to the list of contributours
            for the exploration if the argument is not None and it is not a
            system id.
    """
    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    exp_summary = compute_summary_of_exploration(
        exploration, contributor_id_to_add)
    save_exploration_summary(exp_summary)


def update_exploration_summary(exploration_id, contributor_id_to_add):
    """Update the summary of an exploration.

    Args:
        exploration_id: str. The id of the exploration whose summary is
            to be updated.
        contributor_id_to_add: str or None. The user_id of user who have
            contributed (humans who have made a positive (not just a revert)
            update to the exploration's content) will be added to the list of
            contributours for the exploration if the argument is not None and it
            is not a system id.
    """
    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    exp_summary = compute_summary_of_exploration(
        exploration, contributor_id_to_add)
    save_exploration_summary(exp_summary)


def compute_summary_of_exploration(exploration, contributor_id_to_add):
    """Create an ExplorationSummary domain object for a given Exploration
    domain object and return it. contributor_id_to_add will be added to
    the list of contributors for the exploration if the argument is not
    None and if the id is not a system id.

    Args:
        exploration: Exploration. The exploration whose summary is to be
            computed.
        contributor_id_to_add: str or None. The user_id of user who have
            contributed (humans who have made a positive (not just a revert)
            change to the exploration's content) will be added to the list of
            contributours for the exploration if the argument is not None and it
            is not a system id.

    Returns:
        ExplorationSummary. The resulting exploration summary domain object.
    """
    exp_rights = exp_models.ExplorationRightsModel.get_by_id(exploration.id)
    exp_summary_model = exp_models.ExpSummaryModel.get_by_id(exploration.id)
    if exp_summary_model:
        old_exp_summary = exp_fetchers.get_exploration_summary_from_model(
            exp_summary_model)
        ratings = old_exp_summary.ratings or feconf.get_empty_ratings()
        scaled_average_rating = get_scaled_average_rating(ratings)
        contributors_summary = old_exp_summary.contributors_summary or {}
    else:
        ratings = feconf.get_empty_ratings()
        scaled_average_rating = feconf.EMPTY_SCALED_AVERAGE_RATING
        contributors_summary = {}

    # Update the contributor id list if necessary (contributors
    # defined as humans who have made a positive (i.e. not just
    # a revert) change to an exploration's content).

    if contributor_id_to_add is None:
        # Recalculate the contributors because revert was done.
        contributors_summary = compute_exploration_contributors_summary(
            exploration.id)
    elif contributor_id_to_add not in constants.SYSTEM_USER_IDS:
        contributors_summary[contributor_id_to_add] = (
            contributors_summary.get(contributor_id_to_add, 0) + 1)
    contributor_ids = list(contributors_summary.keys())

    exploration_model_last_updated = datetime.datetime.fromtimestamp(
        python_utils.divide(
            get_last_updated_by_human_ms(exploration.id), 1000.0))
    exploration_model_created_on = exploration.created_on
    first_published_msec = exp_rights.first_published_msec
    exp_summary = exp_domain.ExplorationSummary(
        exploration.id, exploration.title, exploration.category,
        exploration.objective, exploration.language_code,
        exploration.tags, ratings, scaled_average_rating, exp_rights.status,
        exp_rights.community_owned, exp_rights.owner_ids,
        exp_rights.editor_ids, exp_rights.voice_artist_ids,
        exp_rights.viewer_ids, contributor_ids, contributors_summary,
        exploration.version, exploration_model_created_on,
        exploration_model_last_updated, first_published_msec)

    return exp_summary


def compute_exploration_contributors_summary(exploration_id):
    """Returns a dict whose keys are user_ids and whose values are
    the number of (non-revert) commits made to the given exploration
    by that user_id. This does not count commits which have since been reverted.

    Args:
        exploration_id: str. The id of the exploration.

    Returns:
        dict. The keys are all user_ids who have made commits to the given
        exploration. The corresponding values are the number of commits made by
        each user. Commits that revert to an earlier version, or forward
        commits which have since been reverted, are excluded.
    """
    snapshots_metadata = get_exploration_snapshots_metadata(exploration_id)
    current_version = len(snapshots_metadata)
    contributors_summary = collections.defaultdict(int)
    while True:
        snapshot_metadata = snapshots_metadata[current_version - 1]
        committer_id = snapshot_metadata['committer_id']
        is_revert = (snapshot_metadata['commit_type'] == 'revert')
        if not is_revert and committer_id not in constants.SYSTEM_USER_IDS:
            contributors_summary[committer_id] += 1
        if current_version == 1:
            break

        if is_revert:
            current_version = snapshot_metadata['commit_cmds'][0][
                'version_number']
        else:
            current_version -= 1
    return contributors_summary


def save_exploration_summary(exp_summary):
    """Save an exploration summary domain object as an ExpSummaryModel entity
    in the datastore.

    Args:
        exp_summary: ExplorationSummary. The exploration summary to save.
    """
    exp_summary_dict = {
        'title': exp_summary.title,
        'category': exp_summary.category,
        'objective': exp_summary.objective,
        'language_code': exp_summary.language_code,
        'tags': exp_summary.tags,
        'ratings': exp_summary.ratings,
        'scaled_average_rating': exp_summary.scaled_average_rating,
        'status': exp_summary.status,
        'community_owned': exp_summary.community_owned,
        'owner_ids': exp_summary.owner_ids,
        'editor_ids': exp_summary.editor_ids,
        'voice_artist_ids': exp_summary.voice_artist_ids,
        'viewer_ids': exp_summary.viewer_ids,
        'contributor_ids': exp_summary.contributor_ids,
        'contributors_summary': exp_summary.contributors_summary,
        'version': exp_summary.version,
        'exploration_model_last_updated': (
            exp_summary.exploration_model_last_updated),
        'exploration_model_created_on': (
            exp_summary.exploration_model_created_on),
        'first_published_msec': (
            exp_summary.first_published_msec)
    }

    exp_summary_model = (exp_models.ExpSummaryModel.get_by_id(exp_summary.id))
    if exp_summary_model is not None:
        exp_summary_model.populate(**exp_summary_dict)
        exp_summary_model.put()
    else:
        exp_summary_dict['id'] = exp_summary.id
        exp_models.ExpSummaryModel(**exp_summary_dict).put()

    # The index should be updated after saving the exploration
    # summary instead of after saving the exploration since the
    # index contains documents computed on basis of exploration
    # summary.
    index_explorations_given_ids([exp_summary.id])


def delete_exploration_summaries(exploration_ids):
    """Delete multiple exploration summary models.

    Args:
        exploration_ids: list(str). The id of the exploration summaries to be
            deleted.
    """
    summary_models = exp_models.ExpSummaryModel.get_multi(exploration_ids)
    exp_models.ExpSummaryModel.delete_multi(summary_models)


def revert_exploration(
        committer_id, exploration_id, current_version, revert_to_version):
    """Reverts an exploration to the given version number. Commits changes.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration_id: str. The id of the exploration to be reverted to the
            current version.
        current_version: int. The current version of the exploration.
        revert_to_version: int. The version to which the given exploration
            is to be reverted.

    Raises:
        Exception:  does not match the version of the currently-stored
            exploration model.
    """
    exploration_model = exp_models.ExplorationModel.get(
        exploration_id, strict=False)

    if current_version > exploration_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of exploration '
            'from version %s. Please reload the page and try again.'
            % (exploration_model.version, current_version))
    elif current_version < exploration_model.version:
        raise Exception(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_model.version, current_version))

    # Validate the previous version of the exploration before committing the
    # change.
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=revert_to_version)
    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    if exploration_rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE:
        exploration.validate(strict=True)
    else:
        exploration.validate()

    exp_models.ExplorationModel.revert(
        exploration_model, committer_id,
        'Reverted exploration to version %s' % revert_to_version,
        revert_to_version)
    exp_memcache_key = exp_fetchers.get_exploration_memcache_key(exploration.id)
    memcache_services.delete(exp_memcache_key)

    # Update the exploration summary, but since this is just a revert do
    # not add the committer of the revert to the list of contributors.
    update_exploration_summary(exploration_id, None)

    exploration_stats = stats_services.get_stats_for_new_exp_version(
        exploration.id, current_version + 1, exploration.states,
        exp_versions_diff=None, revert_to_version=revert_to_version)
    stats_services.create_stats_model(exploration_stats)

    current_exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=current_version)
    stats_services.update_exp_issues_for_new_exp_version(
        current_exploration, exp_versions_diff=None,
        revert_to_version=revert_to_version)

    if feconf.ENABLE_ML_CLASSIFIERS:
        exploration_to_revert_to = exp_fetchers.get_exploration_by_id(
            exploration_id, version=revert_to_version)
        classifier_services.create_classifier_training_job_for_reverted_exploration( # pylint: disable=line-too-long
            current_exploration, exploration_to_revert_to)


# Creation and deletion methods.
def get_demo_exploration_components(demo_path):
    """Gets the content of `demo_path` in the sample explorations folder.

    Args:
        demo_path: str. The file or folder path for the content of an
            exploration in SAMPLE_EXPLORATIONS_DIR. E.g.: 'adventure.yaml' or
            'tar/'.

    Returns:
        tuple. A 2-tuple, the first element of which is a yaml string, and the
        second element of which is a list of (filepath, content) 2-tuples. The
        filepath does not include the assets/ prefix.

    Raises:
        Exception: The path of the file is unrecognized or does not exist.
    """
    demo_filepath = os.path.join(feconf.SAMPLE_EXPLORATIONS_DIR, demo_path)

    if demo_filepath.endswith('yaml'):
        file_contents = utils.get_file_contents(demo_filepath)
        return file_contents, []
    elif os.path.isdir(demo_filepath):
        return utils.get_exploration_components_from_dir(demo_filepath)
    else:
        raise Exception('Unrecognized file path: %s' % demo_path)


def save_new_exploration_from_yaml_and_assets(
        committer_id, yaml_content, exploration_id, assets_list,
        strip_voiceovers=False):
    """Note that the default title and category will be used if the YAML
    schema version is less than
    exp_domain.Exploration.LAST_UNTITLED_SCHEMA_VERSION,
    since in that case the YAML schema will not have a title and category
    present.

    Args:
        committer_id: str. The id of the user who made the commit.
        yaml_content: str. The YAML representation of the exploration.
        exploration_id: str. The id of the exploration.
        assets_list: list(list(str)). A list of lists of assets, which contains
            asset's filename and content.
        strip_voiceovers: bool. Whether to strip away all audio voiceovers
            from the imported exploration.

    Raises:
        Exception: The yaml file is invalid due to a missing schema version.
    """
    if assets_list is None:
        assets_list = []

    yaml_dict = utils.dict_from_yaml(yaml_content)
    if 'schema_version' not in yaml_dict:
        raise Exception('Invalid YAML file: missing schema version')
    exp_schema_version = yaml_dict['schema_version']

    # The assets are committed before the exploration is created because the
    # migrating to state schema version 25 involves adding dimensions to
    # images. So we need to have images in the datastore before we could
    # perform the migration.
    for (asset_filename, asset_content) in assets_list:
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, exploration_id))
        fs.commit(asset_filename, asset_content)

    if (exp_schema_version <=
            exp_domain.Exploration.LAST_UNTITLED_SCHEMA_VERSION):
        # The schema of the YAML file for older explorations did not include
        # a title and a category; these need to be manually specified.
        exploration = exp_domain.Exploration.from_untitled_yaml(
            exploration_id, feconf.DEFAULT_EXPLORATION_TITLE,
            feconf.DEFAULT_EXPLORATION_CATEGORY, yaml_content)
    else:
        exploration = exp_domain.Exploration.from_yaml(
            exploration_id, yaml_content)

    # Check whether audio translations should be stripped.
    if strip_voiceovers:
        for state in exploration.states.values():
            state.recorded_voiceovers.strip_all_existing_voiceovers()

    create_commit_message = (
        'New exploration created from YAML file with title \'%s\'.'
        % exploration.title)

    _create_exploration(
        committer_id, exploration, create_commit_message, [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': exploration.title,
                'category': exploration.category,
            })])


def delete_demo(exploration_id):
    """Deletes a single demo exploration.

    Args:
        exploration_id: str. The id of the exploration to be deleted.

    Raises:
        Exception: The exploration id is invalid.
    """
    if not exp_domain.Exploration.is_demo_exploration_id(exploration_id):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, strict=False)
    if not exploration:
        logging.info('Exploration with id %s was not deleted, because it '
                     'does not exist.' % exploration_id)
    else:
        delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration_id, force_deletion=True)


def load_demo(exploration_id):
    """Loads a demo exploration.

    The resulting exploration will have two commits in its history (one for
    its initial creation and one for its subsequent modification.)

    Args:
        exploration_id: str. The id of the demo exploration.

    Raises:
        Exception: The exploration id provided is invalid.
    """
    if not exp_domain.Exploration.is_demo_exploration_id(exploration_id):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    delete_demo(exploration_id)

    exp_filename = feconf.DEMO_EXPLORATIONS[exploration_id]

    yaml_content, assets_list = get_demo_exploration_components(exp_filename)
    save_new_exploration_from_yaml_and_assets(
        feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
        assets_list)

    publish_exploration_and_update_user_profiles(
        user_services.get_system_user(), exploration_id)

    index_explorations_given_ids([exploration_id])

    logging.info('Exploration with id %s was loaded.' % exploration_id)


def get_next_page_of_all_non_private_commits(
        page_size=feconf.COMMIT_LIST_PAGE_SIZE, urlsafe_start_cursor=None,
        max_age=None):
    """Returns a page of non-private commits in reverse time order. If max_age
    is given, it should be a datetime.timedelta instance.

    The return value is a tuple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass

    Args:
        page_size: int. Number of commits that are in the commit list page.
        urlsafe_start_cursor: str. If this is not None, then the returned
            commits start from cursor location. Otherwise they start from the
            beginning of the list of commits.
        max_age: datetime.timedelta. The maximum age to which all non private
            commits are fetch from the ExplorationCommitLogEntry.

    Returns:
        tuple. A 3-tuple consisting of:
            - list(ExplorationCommitLogEntry). A list containing
              ExplorationCommitlogEntry domain objects.
            - str. The postion of the cursor.
            - bool. indicating whether there are (likely) more results after
              this batch. If False, there are no more results; if True, there
              are probably more results.

    Raises:
        ValueError: The argument max_age is not datetime.timedelta or None.
    """
    if max_age is not None and not isinstance(max_age, datetime.timedelta):
        raise ValueError(
            'max_age must be a datetime.timedelta instance. or None.')

    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_non_private_commits(
            page_size, urlsafe_start_cursor, max_age=max_age))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def get_image_filenames_from_exploration(exploration):
    """Get the image filenames from the exploration.

    Args:
        exploration: Exploration object. The exploration itself.

    Returns:
       list(str). List containing the name of the image files in exploration.
    """
    filenames = []
    for state in exploration.states.values():
        if state.interaction.id == 'ImageClickInput':
            filenames.append(state.interaction.customization_args[
                'imageAndRegions']['value']['imagePath'])

    html_list = exploration.get_all_html_content_strings()
    filenames.extend(
        html_cleaner.get_image_filenames_from_html_strings(html_list))
    return filenames


def get_number_of_ratings(ratings):
    """Gets the total number of ratings represented by the given ratings
    object.

    Args:
        ratings: dict. A dict whose keys are '1', '2', '3', '4', '5' and whose
            values are nonnegative integers representing frequency counts.

    Returns:
        int. The total number of ratings given.
    """
    return sum(ratings.values())


def get_average_rating(ratings):
    """Returns the average rating of the ratings as a float.
    If there are no ratings, it will return 0.

    Args:
        ratings: dict. A dict whose keys are '1', '2', '3', '4', '5' and whose
            values are nonnegative integers representing frequency counts.

    Returns:
        float. The average of the all the ratings given, or 0
        if there are no rating.
    """
    rating_weightings = {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5}
    if ratings:
        rating_sum = 0.0
        number_of_ratings = get_number_of_ratings(ratings)
        if number_of_ratings == 0:
            return 0

        for rating_value, rating_count in ratings.items():
            rating_sum += rating_weightings[rating_value] * rating_count
        return python_utils.divide(rating_sum, (number_of_ratings * 1.0))


def get_scaled_average_rating(ratings):
    """Returns the lower bound wilson score of the ratings. If there are
    no ratings, it will return 0. The confidence of this result is 95%.

    Args:
        ratings: dict. A dict whose keys are '1', '2', '3', '4', '5' and whose
            values are nonnegative integers representing frequency counts.

    Returns:
        float. The lower bound wilson score of the ratings.
    """
    # The following is the number of ratings.
    n = get_number_of_ratings(ratings)
    if n == 0:
        return 0
    average_rating = get_average_rating(ratings)
    z = 1.9599639715843482
    x = python_utils.divide((average_rating - 1), 4)
    # The following calculates the lower bound Wilson Score as documented
    # http://www.goproblems.com/test/wilson/wilson.php?v1=0&v2=0&v3=0&v4=&v5=1
    a = x + python_utils.divide((z**2), (2 * n))
    b = z * math.sqrt(
        python_utils.divide((x * (1 - x)), n) + python_utils.divide(
            (z**2), (4 * n**2)))
    wilson_score_lower_bound = python_utils.divide(
        (a - b), (1 + python_utils.divide(z**2, n)))
    return 1 + 4 * wilson_score_lower_bound


def index_explorations_given_ids(exp_ids):
    """Indexes the explorations corresponding to the given exploration ids.

    Args:
        exp_ids: list(str). List of ids of the explorations to be indexed.
    """
    exploration_summaries = exp_fetchers.get_exploration_summaries_matching_ids(
        exp_ids)
    search_services.index_exploration_summaries([
        exploration_summary for exploration_summary in exploration_summaries
        if exploration_summary is not None])


def is_voiceover_change_list(change_list):
    """Checks whether the change list contains only the changes which are
    allowed for voice artist to do.

    Args:
        change_list: list(ExplorationChange). A list that contains the changes
            to be made to the ExplorationUserDataModel object.

    Returns:
        bool. Whether the change_list contains only the changes which are
        allowed for voice artist to do.
    """
    for change in change_list:
        if (change.property_name !=
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS):
            return False
    return True


def is_version_of_draft_valid(exp_id, version):
    """Checks if the draft version is the same as the latest version of the
    exploration.

    Args:
        exp_id: str. The id of the exploration.
        version: int. The draft version which is to be validate.

    Returns:
        bool. Whether the given version number is the same as the current
        version number of the exploration in the datastore.
    """

    return exp_fetchers.get_exploration_by_id(exp_id).version == version


def get_user_exploration_data(
        user_id, exploration_id, apply_draft=False, version=None):
    """Returns a description of the given exploration."""
    exp_user_data = user_models.ExplorationUserDataModel.get(
        user_id, exploration_id)
    is_valid_draft_version = (
        is_version_of_draft_valid(
            exploration_id, exp_user_data.draft_change_list_exp_version)
        if exp_user_data and exp_user_data.draft_change_list_exp_version
        else None)
    if apply_draft:
        updated_exploration = (
            get_exp_with_draft_applied(exploration_id, user_id))
        if updated_exploration is None:
            exploration = exp_fetchers.get_exploration_by_id(
                exploration_id, version=version)
        else:
            exploration = updated_exploration
            is_valid_draft_version = True
    else:
        exploration = exp_fetchers.get_exploration_by_id(
            exploration_id, version=version)

    states = {}
    for state_name in exploration.states:
        state_dict = exploration.states[state_name].to_dict()
        states[state_name] = state_dict
    draft_changes = (exp_user_data.draft_change_list if exp_user_data
                     and exp_user_data.draft_change_list else None)
    draft_change_list_id = (exp_user_data.draft_change_list_id
                            if exp_user_data else 0)
    exploration_email_preferences = (
        user_services.get_email_preferences_for_exploration(
            user_id, exploration_id))

    # Retrieve all classifiers for the exploration.
    state_classifier_mapping = {}
    classifier_training_jobs = (
        classifier_services.get_classifier_training_jobs(
            exploration_id, exploration.version, exploration.states))
    for index, state_name in enumerate(exploration.states):
        if classifier_training_jobs[index] is not None:
            state_classifier_mapping[state_name] = (
                classifier_training_jobs[index].to_player_dict())

    editor_dict = {
        'auto_tts_enabled': exploration.auto_tts_enabled,
        'category': exploration.category,
        'correctness_feedback_enabled': (
            exploration.correctness_feedback_enabled),
        'draft_change_list_id': draft_change_list_id,
        'exploration_id': exploration_id,
        'init_state_name': exploration.init_state_name,
        'language_code': exploration.language_code,
        'objective': exploration.objective,
        'param_changes': exploration.param_change_dicts,
        'param_specs': exploration.param_specs_dict,
        'rights': rights_manager.get_exploration_rights(
            exploration_id).to_dict(),
        'show_state_editor_tutorial_on_load': None,
        'show_state_translation_tutorial_on_load': None,
        'states': states,
        'tags': exploration.tags,
        'title': exploration.title,
        'version': exploration.version,
        'is_version_of_draft_valid': is_valid_draft_version,
        'draft_changes': draft_changes,
        'email_preferences': exploration_email_preferences.to_dict(),
        'state_classifier_mapping': state_classifier_mapping
    }

    return editor_dict


def create_or_update_draft(
        exp_id, user_id, change_list, exp_version, current_datetime,
        is_by_voice_artist=False):
    """Create a draft with the given change list, or update the change list
    of the draft if it already exists. A draft is updated only if the change
    list timestamp of the new change list is greater than the change list
    timestamp of the draft.
    The method assumes that a ExplorationUserDataModel object exists for the
    given user and exploration.

    Args:
        exp_id: str. The id of the exploration.
        user_id: str. The id of the user.
        change_list: list(ExplorationChange). A list that contains the changes
            to be made to the ExplorationUserDataModel object.
        exp_version: int. The current version of the exploration.
        current_datetime: datetime.datetime. The current date and time.
        is_by_voice_artist: bool. Whether the changes are made by a
            voice artist.
    """
    if is_by_voice_artist and not is_voiceover_change_list(change_list):
        raise utils.ValidationError(
            'Voice artist does not have permission to make some '
            'changes in the change list.')

    exp_user_data = user_models.ExplorationUserDataModel.get(user_id, exp_id)
    if (exp_user_data and exp_user_data.draft_change_list and
            exp_user_data.draft_change_list_last_updated > current_datetime):
        return

    updated_exploration = apply_change_list(exp_id, change_list)
    updated_exploration.validate(strict=False)

    if exp_user_data is None:
        exp_user_data = user_models.ExplorationUserDataModel.create(
            user_id, exp_id)

    draft_change_list_id = exp_user_data.draft_change_list_id
    draft_change_list_id += 1
    change_list_dict = [change.to_dict() for change in change_list]
    exp_user_data.draft_change_list = change_list_dict
    exp_user_data.draft_change_list_last_updated = current_datetime
    exp_user_data.draft_change_list_exp_version = exp_version
    exp_user_data.draft_change_list_id = draft_change_list_id
    exp_user_data.put()


def get_exp_with_draft_applied(exp_id, user_id):
    """If a draft exists for the given user and exploration,
    apply it to the exploration.

    Args:
        exp_id: str. The id of the exploration.
        user_id: str. The id of the user whose draft is to be applied.

    Returns:
        Exploration or None. Returns the exploration domain object with draft
        applied, or None if draft can not be applied.
    """
    exp_user_data = user_models.ExplorationUserDataModel.get(user_id, exp_id)
    exploration = exp_fetchers.get_exploration_by_id(exp_id)
    if exp_user_data:
        if exp_user_data.draft_change_list:
            draft_change_list_exp_version = (
                exp_user_data.draft_change_list_exp_version)
            draft_change_list = [
                exp_domain.ExplorationChange(change)
                for change in exp_user_data.draft_change_list]
            if (
                    exploration.version >
                    exp_user_data.draft_change_list_exp_version):
                logging.info(
                    'Exploration and draft versions out of sync, trying '
                    'to upgrade draft version to match exploration\'s.')
                new_draft_change_list = (
                    draft_upgrade_services.try_upgrading_draft_to_exp_version(
                        draft_change_list,
                        exp_user_data.draft_change_list_exp_version,
                        exploration.version, exp_id))
                if new_draft_change_list is not None:
                    draft_change_list = new_draft_change_list
                    draft_change_list_exp_version = exploration.version

    return (
        apply_change_list(exp_id, draft_change_list)
        if exp_user_data and exp_user_data.draft_change_list and
        is_version_of_draft_valid(exp_id, draft_change_list_exp_version)
        else None)


def discard_draft(exp_id, user_id):
    """Discard the draft for the given user and exploration.

    Args:
        exp_id: str. The id of the exploration.
        user_id: str. The id of the user whose draft is to be discarded.
    """

    exp_user_data = user_models.ExplorationUserDataModel.get(
        user_id, exp_id)
    if exp_user_data:
        exp_user_data.draft_change_list = None
        exp_user_data.draft_change_list_last_updated = None
        exp_user_data.draft_change_list_exp_version = None
        exp_user_data.put()


def get_interaction_id_for_state(exp_id, state_name):
    """Returns the interaction id for the given state name.

    Args:
        exp_id: str. The ID of the exp.
        state_name: str. The name of the state.

    Returns:
        str. The ID of the interaction.

    Raises:
        Exception: If the state with the given state name does not exist in
            the exploration.
    """
    exploration = exp_fetchers.get_exploration_by_id(exp_id)
    if exploration.has_state_name(state_name):
        return exploration.get_interaction_id_by_state_name(state_name)
    raise Exception(
        'There exist no state in the exploration with the given state name.')
