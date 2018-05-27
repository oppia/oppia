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
import StringIO
import collections
import copy
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
from core.domain import email_subscription_services
from core.domain import exp_domain
from core.domain import feedback_services
from core.domain import fs_domain
from core.domain import rights_manager
from core.domain import search_services
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()
taskqueue_services = models.Registry.import_taskqueue_services()
(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'

# Name for the exploration search index.
SEARCH_INDEX_EXPLORATIONS = 'explorations'

# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS = 10


def _migrate_states_schema(versioned_exploration_states):
    """Holds the responsibility of performing a step-by-step, sequential update
    of an exploration states structure based on the schema version of the input
    exploration dictionary. This is very similar to the YAML conversion process
    found in exp_domain.py and, in fact, many of the conversion functions for
    states are also used in the YAML conversion pipeline. If the current
    exploration states schema version changes
    (feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION), a new conversion
    function must be added and some code appended to this function to account
    for that new version.

    Args:
        versioned_exploration_states: A dict with two keys:
            states_schema_version: int. the states schema version for the
                exploration.
            states: the dict of states comprising the exploration. The keys in
                this dict are state names.

    Raises:
        Exception: The given states_schema_version is invalid.
    """
    states_schema_version = versioned_exploration_states[
        'states_schema_version']
    if states_schema_version is None or states_schema_version < 1:
        states_schema_version = 0

    if not (0 <= states_schema_version
            <= feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d and unversioned exploration '
            'state schemas at present.' %
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

    while (states_schema_version <
           feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION):
        exp_domain.Exploration.update_states_from_model(
            versioned_exploration_states, states_schema_version)
        states_schema_version += 1


# Repository GET methods.
def _get_exploration_memcache_key(exploration_id, version=None):
    """Returns a memcache key for an exploration.

    Args:
        exploration_id: str. The id of the exploration whose memcache key
            is to be returned.
        version: int or None. If specified, the version of the exploration
            whose memcache key is to be returned.

    Returns:
        str. Memcache key for the given exploration (or exploration version).
    """

    if version:
        return 'exploration-version:%s:%s' % (exploration_id, version)
    else:
        return 'exploration:%s' % exploration_id


def get_exploration_from_model(exploration_model, run_conversion=True):
    """Returns an Exploration domain object given an exploration model loaded
    from the datastore.

    If run_conversion is True, then the exploration's states schema version
    will be checked against the current states schema version. If they do not
    match, the exploration will be automatically updated to the latest states
    schema version.

    IMPORTANT NOTE TO DEVELOPERS: In general, run_conversion should never be
    False. This option is only used for testing that the states schema version
    migration works correctly, and it should never be changed otherwise.

    Args:
        exploration_model: ExplorationModel. An exploration storage model.
        run_conversion: bool. When True, updates the exploration to the latest
            states_schema_version if necessary.

    Returns:
       Exploration. The exploration domain object corresponding to the given
       exploration model.
    """

    # Ensure the original exploration model does not get altered.
    versioned_exploration_states = {
        'states_schema_version': exploration_model.states_schema_version,
        'states': copy.deepcopy(exploration_model.states)
    }

    # If the exploration uses the latest states schema version, no conversion
    # is necessary.
    if (run_conversion and exploration_model.states_schema_version !=
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION):
        _migrate_states_schema(versioned_exploration_states)

    return exp_domain.Exploration(
        exploration_model.id, exploration_model.title,
        exploration_model.category, exploration_model.objective,
        exploration_model.language_code, exploration_model.tags,
        exploration_model.blurb, exploration_model.author_notes,
        versioned_exploration_states['states_schema_version'],
        exploration_model.init_state_name,
        versioned_exploration_states['states'],
        exploration_model.param_specs, exploration_model.param_changes,
        exploration_model.version, exploration_model.auto_tts_enabled,
        exploration_model.correctness_feedback_enabled,
        created_on=exploration_model.created_on,
        last_updated=exploration_model.last_updated)


def get_exploration_summary_from_model(exp_summary_model):
    """Returns an ExplorationSummary domain object.

    Args:
        exp_summary_model: ExplorationSummary. An ExplorationSummary model
            instance.

    Returns:
        ExplorationSummary. The summary domain object correspoding to the
        given exploration summary model.
    """

    return exp_domain.ExplorationSummary(
        exp_summary_model.id, exp_summary_model.title,
        exp_summary_model.category, exp_summary_model.objective,
        exp_summary_model.language_code, exp_summary_model.tags,
        exp_summary_model.ratings, exp_summary_model.scaled_average_rating,
        exp_summary_model.status, exp_summary_model.community_owned,
        exp_summary_model.owner_ids, exp_summary_model.editor_ids,
        exp_summary_model.translator_ids, exp_summary_model.viewer_ids,
        exp_summary_model.contributor_ids,
        exp_summary_model.contributors_summary, exp_summary_model.version,
        exp_summary_model.exploration_model_created_on,
        exp_summary_model.exploration_model_last_updated,
        exp_summary_model.first_published_msec
    )


def get_exploration_by_id(exploration_id, strict=True, version=None):
    """Returns an Exploration domain object.

    Args:
        exploration_id: str. The id of the exploration to be returned.
        strict: bool. Whether to fail noisily if no exploration with a given id
            exists.
        version: int or None. The version of the exploration to be returned.
            If None, the latest version of the exploration is returned.

    Returns:
        Exploration. The domain object corresponding to the given exploration.
    """

    exploration_memcache_key = _get_exploration_memcache_key(
        exploration_id, version=version)
    memcached_exploration = memcache_services.get_multi(
        [exploration_memcache_key]).get(exploration_memcache_key)

    if memcached_exploration is not None:
        return memcached_exploration
    else:
        exploration_model = exp_models.ExplorationModel.get(
            exploration_id, strict=strict, version=version)
        if exploration_model:
            exploration = get_exploration_from_model(exploration_model)
            memcache_services.set_multi({
                exploration_memcache_key: exploration})
            return exploration
        else:
            return None


def get_exploration_summary_by_id(exploration_id):
    """Returns a domain object representing an exploration summary.

    Args:
        exploration_id: str. The id of the ExplorationSummary to be returned.

    Returns:
        ExplorationSummary. The summary domain object corresponding to the
        given exploration.
    """
    # TODO(msl): Maybe use memcache similarly to get_exploration_by_id.
    exp_summary_model = exp_models.ExpSummaryModel.get(
        exploration_id)
    if exp_summary_model:
        exp_summary = get_exploration_summary_from_model(exp_summary_model)
        return exp_summary
    else:
        return None


def get_multiple_explorations_by_version(exp_id, version_numbers):
    """Returns a list of Exploration domain objects corresponding to the
    specified versions.

    Args:
        exp_id: str. ID of the exploration.
        version_numbers: list(int). List of version numbers.

    Returns:
        list(Exploration). List of Exploration domain objects.

    Raises:
        Exception. One or more of the given versions of the exploration could
            not be converted to the latest schema version.
    """
    explorations = []
    exploration_models = exp_models.ExplorationModel.get_multi_versions(
        exp_id, version_numbers)
    error_versions = []
    for index, exploration_model in enumerate(exploration_models):
        try:
            explorations.append(get_exploration_from_model(exploration_model))
        except utils.ExplorationConversionError:
            error_versions.append(version_numbers[index])

    if error_versions:
        raise Exception(
            "Exploration %s, versions [%s] could not be converted to latest"
            "schema version." % (exp_id, ', '.join(map(str, error_versions))))
    return explorations


def get_multiple_explorations_by_id(exp_ids, strict=True):
    """Returns a dict of domain objects representing explorations with the
    given ids as keys. If an exp_id is not present, it is not included in the
    return dict.

    Args:
        exp_ids: list(str). List of ids of the exploration to be returned.
        strict: bool. If True, a ValueError is raised when any exploration id
            is invalid.

    Returns:
        dict. Maps exploration ids to the corresponding Exploration domain
        objects. Any invalid exploration ids are omitted.

    Raises:
        ValueError: When strict is True and at least one of the given exp_ids
        is invalid.
    """
    exp_ids = set(exp_ids)
    result = {}
    uncached = []
    memcache_keys = [_get_exploration_memcache_key(i) for i in exp_ids]
    cache_result = memcache_services.get_multi(memcache_keys)

    for exp_obj in cache_result.itervalues():
        result[exp_obj.id] = exp_obj

    for _id in exp_ids:
        if _id not in result:
            uncached.append(_id)

    db_exp_models = exp_models.ExplorationModel.get_multi(uncached)
    db_results_dict = {}
    not_found = []
    for i, eid in enumerate(uncached):
        model = db_exp_models[i]
        if model:
            exploration = get_exploration_from_model(model)
            db_results_dict[eid] = exploration
        else:
            logging.info('Tried to fetch exploration with id %s, but no such '
                         'exploration exists in the datastore' % eid)
            not_found.append(eid)

    if strict and not_found:
        raise ValueError(
            'Couldn\'t find explorations with the following ids:\n%s'
            % '\n'.join(not_found))

    cache_update = {
        eid: db_results_dict[eid] for eid in db_results_dict.iterkeys()
        if db_results_dict[eid] is not None
    }

    if cache_update:
        memcache_services.set_multi(cache_update)

    result.update(db_results_dict)
    return result


def get_exploration_and_exploration_rights_by_id(exploration_id):
    """Returns a tuple for exploration domain object and exploration rights
    object.

    Args:
        exploration_id: str. Id of the exploration.

    Returns:
        tuple(Exploration|None, ExplorationRights|None). The exploration and
        exploration rights object, respectively.
    """
    exploration_and_rights = (
        datastore_services.fetch_multiple_entities_by_ids_and_models(
            [
                ('ExplorationModel', [exploration_id]),
                ('ExplorationRightsModel', [exploration_id])
            ]))

    exploration = None
    if exploration_and_rights[0][0] is not None:
        exploration = get_exploration_from_model(
            exploration_and_rights[0][0])

    exploration_rights = None
    if exploration_and_rights[1][0] is not None:
        exploration_rights = (
            rights_manager.get_activity_rights_from_model(
                exploration_and_rights[1][0],
                constants.ACTIVITY_TYPE_EXPLORATION))

    return (exploration, exploration_rights)


def get_new_exploration_id():
    """Returns a new exploration id.

    Returns:
        str. A new exploration id.
    """
    return exp_models.ExplorationModel.get_new_id('')


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
        (get_exploration_from_model(e) if e else None)
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


def _get_exploration_summaries_from_models(exp_summary_models):
    """Returns a dict with ExplorationSummary domain objects as values,
    keyed by their exploration id.

    Args:
        exp_summary_models: list(ExplorationSummary). List of ExplorationSummary
            model instances.

    Returns:
        dict. The keys are exploration ids and the values are the corresponding
        ExplorationSummary domain objects.
    """
    exploration_summaries = [
        get_exploration_summary_from_model(exp_summary_model)
        for exp_summary_model in exp_summary_models]
    result = {}
    for exp_summary in exploration_summaries:
        result[exp_summary.id] = exp_summary
    return result


def get_exploration_summaries_matching_ids(exp_ids):
    """Returns a list of ExplorationSummary domain objects (or None if the
    corresponding summary does not exist) corresponding to the given
    list of exploration ids.

    Args:
        exp_ids: list(str). List of exploration ids.

    Returns:
        list(ExplorationSummary|None). List of ExplorationSummary domain objects
        corresponding to the given exploration ids. If an ExplorationSummary
        does not exist, the corresponding returned list element is None.
    """
    return [
        (get_exploration_summary_from_model(model) if model else None)
        for model in exp_models.ExpSummaryModel.get_multi(exp_ids)]


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

    for _ in range(MAX_ITERATIONS):
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
    return _get_exploration_summaries_from_models(
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
    return _get_exploration_summaries_from_models(
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
    return _get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_recently_published(limit))


def get_all_exploration_summaries():
    """Returns a dict with all exploration summary domain objects,
    keyed by their id.

    Returns:
        dict. A dict with all ExplorationSummary domain objects keyed by their
        exploration id.
    """
    return _get_exploration_summaries_from_models(
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
    exploration = get_exploration_by_id(exploration_id, version=version)
    yaml_repr = exploration.to_yaml()

    memfile = StringIO.StringIO()
    with zipfile.ZipFile(
        memfile, mode='w', compression=zipfile.ZIP_DEFLATED) as zfile:

        zfile.writestr('%s.yaml' % exploration.title, yaml_repr)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        dir_list = fs.listdir('')
        for filepath in dir_list:
            # Currently, the version number of all files is 1, since they are
            # not modifiable post-upload.
            # TODO(sll): When allowing editing of files, implement versioning
            # for them.
            file_contents = fs.get(filepath, version=1)

            str_filepath = 'assets/%s' % filepath
            assert isinstance(str_filepath, str)
            unicode_filepath = str_filepath.decode('utf-8')
            zfile.writestr(unicode_filepath, file_contents)

    return memfile.getvalue()


def convert_state_dict_to_yaml(state_dict, width):
    """Converts the given state dict to yaml format.

    Args:
        state_dict: dict. A dict representing a state in an exploration.
        width: int. The maximum number of characters in a line for the
            returned YAML string.

    Returns:
        str. The YAML version of the state_dict.

    Raises:
        Exception: The state_dict does not represent a valid state.
    """
    try:
        # Check if the state_dict can be converted to a State.
        state = exp_domain.State.from_dict(state_dict)
    except Exception:
        logging.info('Bad state dict: %s' % str(state_dict))
        raise Exception('Could not convert state dict to YAML.')

    return utils.yaml_from_dict(state.to_dict(), width=width)


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
    exploration = get_exploration_by_id(exploration_id, version=version)
    exploration_dict = {}
    for state in exploration.states:
        exploration_dict[state] = utils.yaml_from_dict(
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
        change_list: list(dict). The list of changes to apply.

    Returns:
        Exploration. The exploration domain object that results from applying
        the given changelist to the existing version of the exploration.

    Raises:
        Exception: Any entries in the changelist are invalid.
    """
    exploration = get_exploration_by_id(exploration_id)
    try:
        changes = [exp_domain.ExplorationChange(change_dict)
                   for change_dict in change_list]
        for change in changes:
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
                    state.update_param_changes(change.new_value)
                elif change.property_name == exp_domain.STATE_PROPERTY_CONTENT:
                    state.update_content(change.new_value)
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
                    state.update_interaction_default_outcome(change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS):
                    state.update_interaction_confirmed_unclassified_answers(
                        change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_HINTS):
                    state.update_interaction_hints(change.new_value)
                elif (
                        change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION):
                    state.update_interaction_solution(change.new_value)
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
                    exploration.update_param_changes(change.new_value)
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
                # schema update.
                continue
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
    if change_list is None:
        change_list = []
    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    if exploration_rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE:
        exploration.validate(strict=True)
    else:
        exploration.validate()

    exploration_model = exp_models.ExplorationModel.get(
        exploration.id, strict=False)
    if exploration_model is None:
        exploration_model = exp_models.ExplorationModel(id=exploration.id)
    else:
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

    old_states = get_exploration_from_model(exploration_model).states
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
        for (state_name, state) in exploration.states.iteritems()}
    exploration_model.param_specs = exploration.param_specs_dict
    exploration_model.param_changes = exploration.param_change_dicts
    exploration_model.auto_tts_enabled = exploration.auto_tts_enabled
    exploration_model.correctness_feedback_enabled = (
        exploration.correctness_feedback_enabled)

    exploration_model.commit(committer_id, commit_message, change_list)
    memcache_services.delete(_get_exploration_memcache_key(exploration.id))
    index_explorations_given_ids([exploration.id])

    exploration.version += 1

    # Trigger statistics model update.
    stats_services.handle_stats_creation_for_new_exp_version(
        exploration.id, exploration.version, exploration.states,
        change_list)

    if feconf.ENABLE_ML_CLASSIFIERS:
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        trainable_states_dict = exploration.get_trainable_states_dict(
            old_states, exp_versions_diff)
        state_names_with_changed_answer_groups = trainable_states_dict[
            'state_names_with_changed_answer_groups']
        state_names_with_unchanged_answer_groups = trainable_states_dict[
            'state_names_with_unchanged_answer_groups']
        if state_names_with_changed_answer_groups:
            classifier_services.handle_trainable_states(
                exploration, state_names_with_changed_answer_groups)
        if state_names_with_unchanged_answer_groups:
            classifier_services.handle_non_retrainable_states(
                exploration, state_names_with_unchanged_answer_groups,
                exp_versions_diff)

    # Save state id mapping model for exploration.
    create_and_save_state_id_mapping_model(exploration, change_list)


def _create_exploration(
        committer_id, exploration, commit_message, commit_cmds):
    """Ensures that rights for a new exploration are saved first.

    This is because _save_exploration() depends on the rights object being
    present to tell it whether to do strict validation or not.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration: Exploration. The exploration domain object.
        commit_message: str. The commit description message.
        commit_cmds: list(dict). A list of commands, describing changes
            made in this model, which should give sufficient information to
            reconstruct the commit. Each dict always contains:
                cmd: str. Unique command.
                and additional arguments for that command.
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
            for (state_name, state) in exploration.states.iteritems()},
        param_specs=exploration.param_specs_dict,
        param_changes=exploration.param_change_dicts,
        auto_tts_enabled=exploration.auto_tts_enabled,
        correctness_feedback_enabled=exploration.correctness_feedback_enabled
    )
    model.commit(committer_id, commit_message, commit_cmds)
    exploration.version += 1

    # Trigger statistics model creation.
    stats_services.handle_stats_creation_for_new_exploration(
        exploration.id, exploration.version, exploration.states)

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

    # Save state id mapping model for new exploration.
    create_and_save_state_id_mapping_model(exploration, commit_cmds)
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
        committer_id, exploration, commit_message, [{
            'cmd': CMD_CREATE_NEW,
            'title': exploration.title,
            'category': exploration.category,
        }])
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
    # TODO(sll): Delete the files too?

    exploration_rights_model = exp_models.ExplorationRightsModel.get(
        exploration_id)
    exploration_rights_model.delete(
        committer_id, '', force_deletion=force_deletion)

    exploration_model = exp_models.ExplorationModel.get(exploration_id)
    exploration_version = exploration_model.version
    exploration_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_EXPLORATION_DELETED,
        force_deletion=force_deletion)

    # This must come after the exploration is retrieved. Otherwise the memcache
    # key will be reinstated.
    exploration_memcache_key = _get_exploration_memcache_key(exploration_id)
    memcache_services.delete(exploration_memcache_key)

    # Delete the exploration from search.
    search_services.delete_explorations_from_search_index([exploration_id])

    # Delete the exploration summary, regardless of whether or not
    # force_deletion is True.
    delete_exploration_summary(exploration_id)

    # Remove the exploration from the featured activity references, if
    # necessary.
    activity_services.remove_featured_activity(
        constants.ACTIVITY_TYPE_EXPLORATION, exploration_id)

    # Remove associated state id mapping models.
    delete_state_id_mapping_model_for_exploration(
        exploration_id, exploration_version)


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
    exploration = get_exploration_by_id(exploration_id)
    current_version = exploration.version
    version_nums = range(1, current_version + 1)

    return exp_models.ExplorationModel.get_snapshots_metadata(
        exploration_id, version_nums, allow_deleted=allow_deleted)


def _get_last_updated_by_human_ms(exp_id):
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
    exp_title = get_exploration_by_id(exp_id).title
    email_subscription_services.inform_subscribers(
        committer.user_id, exp_id, exp_title)
    contribution_time_msec = utils.get_current_time_in_millisecs()
    contributor_ids = get_exploration_summary_by_id(exp_id).contributor_ids
    for contributor in contributor_ids:
        user_services.update_first_contribution_msec_if_not_set(
            contributor, contribution_time_msec)


def update_exploration(
        committer_id, exploration_id, change_list, commit_message,
        is_suggestion=False):
    """Update an exploration. Commits changes.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        exploration_id: str. The id of the exploration to be updated.
        change_list: list(dict). A change list to be applied to the given
            exploration. Each entry in change_list is a dict that represents an
            ExplorationChange.
        commit_message: str or None. A description of changes made to the state.
            For published explorations, this must be present; for unpublished
            explorations, it should be equal to None. For suggestions that are
            being accepted, and only for such commits, it should start with
            feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX.
        is_suggestion: bool. Whether the update is due to a suggestion being
            accepted.

    Raises:
        ValueError: No commit message is supplied and the exploration is public.
        ValueError: The update is due to a suggestion and the commit message is
            invalid.
        ValueError: The update is not due to a suggestion, and the commit
            message starts with the same prefix as the commit message for
            accepted suggestions.
    """
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

    exploration = apply_change_list(exploration_id, change_list)
    _save_exploration(committer_id, exploration, commit_message, change_list)

    discard_draft(exploration_id, committer_id)
    # Update summary of changed exploration.
    update_exploration_summary(exploration.id, committer_id)
    user_services.add_edited_exploration_id(committer_id, exploration.id)
    user_services.record_user_edited_an_exploration(committer_id)

    if (not rights_manager.is_exploration_private(exploration.id) and
            committer_id != feconf.MIGRATION_BOT_USER_ID):
        user_services.update_first_contribution_msec_if_not_set(
            committer_id, utils.get_current_time_in_millisecs())


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
    exploration = get_exploration_by_id(exploration_id)
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
    exploration = get_exploration_by_id(exploration_id)
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
        old_exp_summary = get_exploration_summary_from_model(exp_summary_model)
        ratings = old_exp_summary.ratings or feconf.get_empty_ratings()
        scaled_average_rating = get_scaled_average_rating(
            old_exp_summary.ratings)
        contributor_ids = old_exp_summary.contributor_ids or []
        contributors_summary = old_exp_summary.contributors_summary or {}
    else:
        ratings = feconf.get_empty_ratings()
        scaled_average_rating = feconf.EMPTY_SCALED_AVERAGE_RATING
        contributor_ids = []
        contributors_summary = {}

    # Update the contributor id list if necessary (contributors
    # defined as humans who have made a positive (i.e. not just
    # a revert) change to an exploration's content).
    if (contributor_id_to_add is not None and
            contributor_id_to_add not in feconf.SYSTEM_USER_IDS):
        if contributor_id_to_add not in contributor_ids:
            contributor_ids.append(contributor_id_to_add)

    if contributor_id_to_add not in feconf.SYSTEM_USER_IDS:
        if contributor_id_to_add is None:
            # Revert commit or other non-positive commit.
            contributors_summary = compute_exploration_contributors_summary(
                exploration.id)
        else:
            if contributor_id_to_add in contributors_summary:
                contributors_summary[contributor_id_to_add] += 1
            else:
                contributors_summary[contributor_id_to_add] = 1

    exploration_model_last_updated = datetime.datetime.fromtimestamp(
        _get_last_updated_by_human_ms(exploration.id) / 1000.0)
    exploration_model_created_on = exploration.created_on
    first_published_msec = exp_rights.first_published_msec
    exp_summary = exp_domain.ExplorationSummary(
        exploration.id, exploration.title, exploration.category,
        exploration.objective, exploration.language_code,
        exploration.tags, ratings, scaled_average_rating, exp_rights.status,
        exp_rights.community_owned, exp_rights.owner_ids,
        exp_rights.editor_ids, exp_rights.translator_ids, exp_rights.viewer_ids,
        contributor_ids, contributors_summary, exploration.version,
        exploration_model_created_on, exploration_model_last_updated,
        first_published_msec)

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
        if not is_revert and committer_id not in feconf.SYSTEM_USER_IDS:
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
    exp_summary_model = exp_models.ExpSummaryModel(
        id=exp_summary.id,
        title=exp_summary.title,
        category=exp_summary.category,
        objective=exp_summary.objective,
        language_code=exp_summary.language_code,
        tags=exp_summary.tags,
        ratings=exp_summary.ratings,
        scaled_average_rating=exp_summary.scaled_average_rating,
        status=exp_summary.status,
        community_owned=exp_summary.community_owned,
        owner_ids=exp_summary.owner_ids,
        editor_ids=exp_summary.editor_ids,
        translator_ids=exp_summary.translator_ids,
        viewer_ids=exp_summary.viewer_ids,
        contributor_ids=exp_summary.contributor_ids,
        contributors_summary=exp_summary.contributors_summary,
        version=exp_summary.version,
        exploration_model_last_updated=(
            exp_summary.exploration_model_last_updated),
        exploration_model_created_on=(
            exp_summary.exploration_model_created_on),
        first_published_msec=(
            exp_summary.first_published_msec)
    )

    exp_summary_model.put()


def delete_exploration_summary(exploration_id):
    """Delete an exploration summary model.

    Args:
        exploration_id: str. The id of the exploration summary to be
            deleted.
    """

    exp_models.ExpSummaryModel.get(exploration_id).delete()


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
    exploration = get_exploration_by_id(
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
    memcache_services.delete(_get_exploration_memcache_key(exploration_id))

    # Update the exploration summary, but since this is just a revert do
    # not add the committer of the revert to the list of contributors.
    update_exploration_summary(exploration_id, None)

    # Save state id mapping model for the new exploration version.
    create_and_save_state_id_mapping_model_for_reverted_exploration(
        exploration_id, current_version, revert_to_version)


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
        strip_audio_translations=False):
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
        strip_audio_translations: bool. Whether to strip away all audio
            translations from the imported exploration.

    Raises:
        Exception: The yaml file is invalid due to a missing schema version.
    """
    if assets_list is None:
        assets_list = []

    yaml_dict = utils.dict_from_yaml(yaml_content)
    if 'schema_version' not in yaml_dict:
        raise Exception('Invalid YAML file: missing schema version')
    exp_schema_version = yaml_dict['schema_version']

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
    if strip_audio_translations:
        for state in exploration.states.values():
            # Strip away audio translations from the state content.
            content = state.content
            content.audio_translations = {}

            if state.interaction is not None:
                # Strip away audio translations from solutions.
                solution = state.interaction.solution
                if solution:
                    solution.explanation.audio_translations = {}

                # Strip away audio translations from hints.
                for hint in state.interaction.hints:
                    hint.hint_content.audio_translations = {}

                # Strip away audio translations from answer groups (feedback).
                for answer_group in state.interaction.answer_groups:
                    answer_group.outcome.feedback.audio_translations = {}

                # Strip away audio translations from the default outcome.
                default_outcome = state.interaction.default_outcome
                if default_outcome:
                    default_outcome.feedback.audio_translations = {}

    create_commit_message = (
        'New exploration created from YAML file with title \'%s\'.'
        % exploration.title)

    _create_exploration(
        committer_id, exploration, create_commit_message, [{
            'cmd': CMD_CREATE_NEW,
            'title': exploration.title,
            'category': exploration.category,
        }])

    for (asset_filename, asset_content) in assets_list:
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        fs.commit(committer_id, asset_filename, asset_content)


def delete_demo(exploration_id):
    """Deletes a single demo exploration.

    Args:
        exploration_id: str. The id of the exploration to be deleted.

    Raises:
        Exception: The exploration id is invalid.
    """
    if not exp_domain.Exploration.is_demo_exploration_id(exploration_id):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    exploration = get_exploration_by_id(exploration_id, strict=False)
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
    delete_demo(exploration_id)

    if not exp_domain.Exploration.is_demo_exploration_id(exploration_id):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

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
            "max_age must be a datetime.timedelta instance. or None.")

    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_non_private_commits(
            page_size, urlsafe_start_cursor, max_age=max_age))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


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
        return rating_sum / (number_of_ratings * 1.0)


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
    x = (average_rating - 1) / 4
    # The following calculates the lower bound Wilson Score as documented
    # http://www.goproblems.com/test/wilson/wilson.php?v1=0&v2=0&v3=0&v4=&v5=1
    a = x + (z**2) / (2 * n)
    b = z * math.sqrt((x * (1 - x)) / n + (z**2) / (4 * n**2))
    wilson_score_lower_bound = (a - b) / (1 + z**2 / n)
    return 1 + 4 * wilson_score_lower_bound


def get_exploration_search_rank(exp_id):
    """Returns the search rank.

    Args:
        exp_id: str. The id of the exploration.

    Returns:
        int. The rank of the exploration.
    """
    exp_summary = get_exploration_summary_by_id(exp_id)
    return search_services.get_search_rank_from_exp_summary(exp_summary)


def index_explorations_given_ids(exp_ids):
    """Indexes the explorations corresponding to the given exploration ids.

    Args:
        exp_ids: list(str). List of ids of the explorations to be indexed.
    """
    exploration_summaries = get_exploration_summaries_matching_ids(exp_ids)
    search_services.index_exploration_summaries([
        exploration_summary for exploration_summary in exploration_summaries
        if exploration_summary is not None])


def _is_suggestion_valid(thread_id, exploration_id):
    """Check if the suggestion is still valid. A suggestion is considered
    invalid if the name of the state that the suggestion was made for has
    changed since.

    Args:
        thread_id: str. Thread id of the feedback thread containing the
            suggestion.
        exploration_id: str. The id of the exploration.

    Returns:
        bool. Whether the suggestion is still valid.
    """

    states = get_exploration_by_id(exploration_id).states
    suggestion = (
        feedback_models.SuggestionModel.get_by_exploration_and_thread_id(
            exploration_id, thread_id))
    return suggestion.state_name in states


def _is_suggestion_handled(thread_id, exploration_id):
    """Checks if the current suggestion has already been accepted/rejected.

    Args:
        thread_id: str. Thread id of the feedback thread containing the
            suggestion.
        exploration_id: str. The id of the exploration.

    Returns:
        bool. Whether the current suggestion has already been acted upon (i.e.,
        accepted or rejected).
    """

    thread = feedback_models.FeedbackThreadModel.get_by_exp_and_thread_id(
        exploration_id, thread_id)
    return (
        thread.status in [
            feedback_models.STATUS_CHOICES_FIXED,
            feedback_models.STATUS_CHOICES_IGNORED])


def _create_change_list_from_suggestion(
        suggestion, old_content, audio_update_required):
    """Creates a change list from a suggestion object.

    Args:
        suggestion: Suggestion. The given Suggestion domain object.
        old_content: SubtitledHtml. A SubtitledHtml domain object representing
            the content of the old state.
        audio_update_required: bool. Whether the audio for the state content
            should be marked as needing an update.

    Returns:
        list(dict). A dict containing a single change that represents an edit to
        the state's content. The dict contains value and key (str.) pairs as
        follows:
            cmd: list(dict). The changelist corresponding to the given
                suggestion domain object.
            state_name: str or None. The state name for the thread. If None,
                this indicates that the thread pertains to the exploration as a
                whole.
            new_value: list(str). List of the state content of the suggestion
                object.
    """
    audio_translations = old_content.audio_translations
    if audio_update_required:
        for _, translation in audio_translations.iteritems():
            translation.needs_update = True

    return [{
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'state_name': suggestion.state_name,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'new_value': {
            'html': suggestion.suggestion_html,
            'audio_translations': {
                language_code: translation.to_dict()
                for language_code, translation in audio_translations.iteritems()
            }
        }
    }]


def _get_commit_message_for_suggestion(
        suggestion_author_username, commit_message):
    """Returns a modified commit message for an accepted suggestion.

    NOTE TO DEVELOPERS: This should not be changed, since in the future we may
    want to determine and credit the original authors of suggestions, and in
    order to do so we will look for commit messages that follow this format.

    Args:
        suggestion_author_username: str. Username of the suggestion author.
        commit_message: str. The original commit message submitted by the
            suggestion author.

    Returns:
        str. The modified commit message to be used in the exploration commit
        logs.
    """
    return '%s %s: %s' % (
        feconf.COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX,
        suggestion_author_username, commit_message)


def accept_suggestion(
        editor_id, thread_id, exploration_id, commit_message,
        audio_update_required):
    """If the suggestion is valid, accepts it by updating the exploration.
    Raises an exception if the suggestion is not valid.

    Args:
        editor_id: str. The user id of the editor.
        thread_id: str. The id of the suggestion thread.
        exploration_id: str. The id of the exploration that the suggestion is
            for.
        commit_message: str. The commit message.
        audio_update_required: bool. Whether the audio subtitles for the
            content need to be updated.

    Raises:
        Exception: The suggestion is not valid.
        Exception: The commit message is empty.
        Exception: The suggestion has already been accepted or rejected.
    """

    if not commit_message or not commit_message.strip():
        raise Exception('Commit message cannot be empty.')
    if _is_suggestion_handled(thread_id, exploration_id):
        raise Exception('Suggestion has already been accepted/rejected.')
    elif not _is_suggestion_valid(thread_id, exploration_id):
        raise Exception('Invalid suggestion: The state for which it was made '
                        'has been removed/renamed.')
    else:
        suggestion = feedback_services.get_suggestion(
            exploration_id, thread_id)
        suggestion_author_username = suggestion.get_author_name()
        exploration = get_exploration_by_id(exploration_id)
        old_content = exploration.states[suggestion.state_name].content
        change_list = _create_change_list_from_suggestion(
            suggestion, old_content, audio_update_required)
        update_exploration(
            editor_id, exploration_id, change_list,
            _get_commit_message_for_suggestion(
                suggestion_author_username, commit_message),
            is_suggestion=True)
        feedback_services.create_message(
            exploration_id, thread_id, editor_id,
            feedback_models.STATUS_CHOICES_FIXED, None,
            'Suggestion accepted.')


def reject_suggestion(editor_id, thread_id, exploration_id):
    """Set the status of a suggestion to REJECTED.

    Args:
        editor_id: str. User id of the editor.
        thread_id: str. The id of the suggestion thread.
        exploration_id: str. The id of the exploration that the suggestion is
            for.

    Raises:
        Exception: The suggestion has already been accepted or rejected.
    """
    if _is_suggestion_handled(thread_id, exploration_id):
        raise Exception('Suggestion has already been accepted/rejected.')
    else:
        thread = feedback_models.FeedbackThreadModel.get_by_exp_and_thread_id(
            exploration_id, thread_id)
        feedback_services.create_message(
            exploration_id, thread_id, editor_id,
            feedback_models.STATUS_CHOICES_IGNORED,
            None, 'Suggestion rejected.')
        thread.put()


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

    return get_exploration_by_id(exp_id).version == version


def create_or_update_draft(
        exp_id, user_id, change_list, exp_version, current_datetime):
    """Create a draft with the given change list, or update the change list
    of the draft if it already exists. A draft is updated only if the change
    list timestamp of the new change list is greater than the change list
    timestamp of the draft.
    The method assumes that a ExplorationUserDataModel object exists for the
    given user and exploration.

    Args:
        exp_id: str. The id of the exploration.
        user_id: str. The id of the user.
        change_list: list(str). A list that contains the changes to be made to
            the ExplorationUserDataModel object.
        exp_version: int. The current version of the exploration.
        current_datetime: datetime.datetime. The current date and time.
    """
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
    exp_user_data.draft_change_list = change_list
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
        Exploration. The exploration domain object.
    """

    exp_user_data = user_models.ExplorationUserDataModel.get(user_id, exp_id)
    exploration = get_exploration_by_id(exp_id)
    return (
        apply_change_list(exp_id, exp_user_data.draft_change_list)
        if exp_user_data and exp_user_data.draft_change_list and
        is_version_of_draft_valid(
            exp_id, exp_user_data.draft_change_list_exp_version)
        else exploration)


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


def get_state_id_mapping(exp_id, exp_version):
    """Retrieve state id mapping model instance from the datastore.

    Args:
        exp_id: str. The exploration id.
        exp_version: int. The exploration version.

    Returns:
        StateIdMapping. Domain object for state id mapping model instance.
    """
    model = exp_models.StateIdMappingModel.get_state_id_mapping_model(
        exp_id, exp_version)
    state_id_mapping = exp_domain.StateIdMapping(
        model.exploration_id, model.exploration_version,
        copy.deepcopy(model.state_names_to_ids), model.largest_state_id_used)
    return state_id_mapping


def _save_state_id_mapping(state_id_mapping):
    """Stores state id mapping instance in datastore.

    Args:
        state_id_mapping: StateIdMapping. State ID mapping which is to be
            stored in database.
    """
    exp_models.StateIdMappingModel.create(
        state_id_mapping.exploration_id,
        state_id_mapping.exploration_version,
        state_id_mapping.state_names_to_ids,
        state_id_mapping.largest_state_id_used)


def generate_state_id_mapping_model(exploration, change_list):
    """Create and store state id mapping for new exploration.

    Args:
        exploration: Exploration. Exploration for which state id mapping is
            to be stored.
        change_list: list(dict). A list of changes made in the exploration.

    Returns:
        StateIdMapping. Domain object of StateIdMappingModel instance.
    """
    if exploration.version > 1:
        # Get state id mapping for new exploration from old exploration with
        # the help of change list.
        old_exploration = get_exploration_by_id(
            exploration.id, version=exploration.version - 1)
        old_state_id_mapping = get_state_id_mapping(
            old_exploration.id, old_exploration.version)
        new_state_id_mapping = (
            old_state_id_mapping.create_mapping_for_new_version(
                old_exploration, exploration, change_list))
    else:
        # Get state id mapping for first version of exploration.
        new_state_id_mapping = (
            exp_domain.StateIdMapping.create_mapping_for_new_exploration(
                exploration))

    new_state_id_mapping.validate()
    return new_state_id_mapping


def create_and_save_state_id_mapping_model(exploration, change_list):
    """Create and store state id mapping for new exploration.

    Args:
        exploration: Exploration. Exploration for which state id mapping is
            to be stored.
        change_list: list(dict). A list of changes made in the exploration.

    Returns:
        StateIdMapping. Domain object of StateIdMappingModel instance.
    """
    if not feconf.ENABLE_STATE_ID_MAPPING:
        return

    new_state_id_mapping = generate_state_id_mapping_model(
        exploration, change_list)
    _save_state_id_mapping(new_state_id_mapping)
    return new_state_id_mapping


def generate_state_id_mapping_model_for_reverted_exploration(
        exploration_id, current_version, revert_to_version):
    """Generates state id mapping model for when exploration is reverted.

    Args:
        exploration_id: str. The ID of the exploration.
        current_version: str. The current version of the exploration.
        revert_to_version: int. The version to which the given exploration
            is to be reverted.

    Returns:
        StateIdMapping. Domain object of StateIdMappingModel instance.
    """
    old_state_id_mapping = get_state_id_mapping(
        exploration_id, revert_to_version)
    previous_state_id_mapping = get_state_id_mapping(
        exploration_id, current_version)

    # Note: when an exploration is reverted state id mapping should
    # be same as reverted version of the exploration but largest
    # state id used should be kept as it is as in old exploration.
    new_version = current_version + 1
    new_state_id_mapping = exp_domain.StateIdMapping(
        exploration_id, new_version, old_state_id_mapping.state_names_to_ids,
        previous_state_id_mapping.largest_state_id_used)
    new_state_id_mapping.validate()

    return new_state_id_mapping


def create_and_save_state_id_mapping_model_for_reverted_exploration(
        exploration_id, current_version, revert_to_version):
    """Create and save state id mapping model for when exploration is reverted.

    Args:
        exploration_id: str. The ID of the exploration.
        current_version: str. The current version of the exploration.
        revert_to_version: int. The version to which the given exploration
            is to be reverted.

    Returns:
        StateIdMapping. Domain object of StateIdMappingModel instance.
    """
    if not feconf.ENABLE_STATE_ID_MAPPING:
        return

    new_state_id_mapping = (
        generate_state_id_mapping_model_for_reverted_exploration(
            exploration_id, current_version, revert_to_version))
    _save_state_id_mapping(new_state_id_mapping)
    return new_state_id_mapping


def delete_state_id_mapping_model_for_exploration(
        exploration_id, exploration_version):
    """Removes state id mapping model for the exploration.

    Args:
        exploration_id: str. Id of the exploration.
        exploration_version: int. Latest version of the exploration.
    """
    if not feconf.ENABLE_STATE_ID_MAPPING:
        return

    exp_versions = range(1, exploration_version + 1)
    exp_models.StateIdMappingModel.delete_state_id_mapping_models(
        exploration_id, exp_versions)


def find_all_values_for_key(key, dictionary):
    """Finds the value of the key inside all the nested dictionaries
    in a given dictionary.

    Args:
       key: str. The key whose value is to be found.
       dictionary: dict or list. The dictionary or list in which the
           key is to be searched.

    Returns:
        list. The values of the key in the given dictionary.

    Yields:
        str. The value of the given key.
    """
    if isinstance(dictionary, list):
        for d in dictionary:
            if isinstance(d, (dict, list)):
                for result in find_all_values_for_key(key, d):
                    yield result

    else:
        for k, v in dictionary.iteritems():
            if k == key:
                yield v
            elif isinstance(v, dict):
                for result in find_all_values_for_key(key, v):
                    yield result
            elif isinstance(v, list):
                for d in v:
                    if isinstance(d, (dict, list)):
                        for result in find_all_values_for_key(key, d):
                            yield result
