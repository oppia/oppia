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

__author__ = 'Sean Lip'

import copy
import datetime
import logging
import os
import pprint
import StringIO
import zipfile

from core.domain import event_services
from core.domain import exp_domain
from core.domain import fs_domain
from core.domain import rights_manager
from core.platform import models
import feconf
memcache_services = models.Registry.import_memcache_services()
search_services = models.Registry.import_search_services()
taskqueue_services = models.Registry.import_taskqueue_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
import utils

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW = 'create_new'

# Name for the exploration search index.
SEARCH_INDEX_EXPLORATIONS = 'explorations'

# Constants used to initialize EntityChangeListSummarizer
_BASE_ENTITY_STATE = 'state'
_BASE_ENTITY_GADGET = 'gadget'


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
          - states_schema_version: the states schema version for the
            exploration.
          - states: the dict of states comprising the exploration. The keys in
            this dict are state names.
    """
    exploration_states_schema_version = versioned_exploration_states[
        'states_schema_version']
    if (exploration_states_schema_version is None
            or exploration_states_schema_version < 1):
        exploration_states_schema_version = 0

    if not (0 <= exploration_states_schema_version
            <= feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d and unversioned exploration '
            'state schemas at present.' %
            feconf.CURRENT_EXPLORATION_STATES_SCHEMA_VERSION)

    # Check for conversion to v1.
    if exploration_states_schema_version == 0:
        exp_domain.Exploration.update_states_v0_to_v1_from_model(
            versioned_exploration_states)
        exploration_states_schema_version = 1

    # Check for conversion to v2.
    if exploration_states_schema_version == 1:
        exp_domain.Exploration.update_states_v1_to_v2_from_model(
            versioned_exploration_states)
        exploration_states_schema_version = 2

    # Check for conversion to v3.
    if exploration_states_schema_version == 2:
        exp_domain.Exploration.update_states_v2_to_v3_from_model(
            versioned_exploration_states)
        exploration_states_schema_version = 3

    # Check for conversion to v4.
    if exploration_states_schema_version == 3:
        exp_domain.Exploration.update_states_v3_to_v4_from_model(
            versioned_exploration_states)
        exploration_states_schema_version = 4

    # Check for conversion to v5.
    if exploration_states_schema_version == 4:
        exp_domain.Exploration.update_states_v4_to_v5_from_model(
            versioned_exploration_states)
        exploration_states_schema_version = 5

    # Check for conversion to v6.
    if exploration_states_schema_version == 5:
        exp_domain.Exploration.update_states_v5_to_v6_from_model(
            versioned_exploration_states)
        exploration_states_schema_version = 6


# Repository GET methods.
def _get_exploration_memcache_key(exploration_id, version=None):
    """Returns a memcache key for an exploration."""
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
        exploration_model.default_skin, exploration_model.skin_customizations,
        versioned_exploration_states['states_schema_version'],
        exploration_model.init_state_name,
        versioned_exploration_states['states'],
        exploration_model.param_specs, exploration_model.param_changes,
        exploration_model.version, created_on=exploration_model.created_on,
        last_updated=exploration_model.last_updated)


def get_exploration_summary_from_model(exp_summary_model):
    return exp_domain.ExplorationSummary(
        exp_summary_model.id, exp_summary_model.title,
        exp_summary_model.category, exp_summary_model.objective,
        exp_summary_model.language_code, exp_summary_model.tags,
        exp_summary_model.ratings, exp_summary_model.status,
        exp_summary_model.community_owned, exp_summary_model.owner_ids,
        exp_summary_model.editor_ids, exp_summary_model.viewer_ids,
        exp_summary_model.version,
        exp_summary_model.exploration_model_created_on,
        exp_summary_model.exploration_model_last_updated
    )


def get_exploration_by_id(exploration_id, strict=True, version=None):
    """Returns a domain object representing an exploration."""
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
    """Returns a domain object representing an exploration summary."""
    # TODO(msl): Maybe use memcache similarly to get_exploration_by_id.
    exp_summary_model = exp_models.ExpSummaryModel.get(
        exploration_id)
    if exp_summary_model:
        exp_summary = get_exploration_summary_from_model(exp_summary_model)
        return exp_summary
    else:
        return None


def get_multiple_explorations_by_id(exp_ids, strict=True):
    """Returns a dict of domain objects representing explorations with the
    given ids as keys. If an exp_id is not present it is not included in the
    return dict.
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


def get_new_exploration_id():
    """Returns a new exploration id."""
    return exp_models.ExplorationModel.get_new_id('')


def is_exp_summary_editable(exp_summary, user_id=None):
    """Checks if a given user may edit an exploration by checking
    the given domain object.
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
    """
    explorations = [
        (get_exploration_from_model(e) if e else None)
        for e in exp_models.ExplorationModel.get_multi(exp_ids)]

    result = {}
    for ind, exploration in enumerate(explorations):
        if exploration is None:
            logging.error(
                'Could not find exploration corresponding to id')
        else:
            result[exploration.id] = {
                'title': exploration.title,
                'category': exploration.category,
            }
    return result


def _get_exploration_summary_dicts_from_models(exp_summary_models):
    """Given an iterable of ExpSummaryModel instances, create a dict containing
    corresponding exploration summary domain objects, keyed by id.
    """
    exploration_summaries = [
        get_exploration_summary_from_model(exp_summary_model)
        for exp_summary_model in exp_summary_models]
    result = {}
    for exp_summary in exploration_summaries:
        result[exp_summary.id] = exp_summary
    return result


def get_exploration_summaries_matching_ids(exp_ids):
    """Given a list of exploration ids, return a list with the corresponding
    summary domain objects (or None if the corresponding summary does not
    exist).
    """
    return [
        (get_exploration_summary_from_model(model) if model else None)
        for model in exp_models.ExpSummaryModel.get_multi(exp_ids)]


def get_exploration_summaries_matching_query(query_string, cursor=None):
    """Returns a list with all exploration summary domain objects matching the
    given search query string, as well as a search cursor for future fetches.

    This method returns exactly feconf.GALLERY_PAGE_SIZE results if there are
    at least that many, otherwise it returns all remaining results. (If this
    behaviour does not occur, an error will be logged.) The method also returns
    a search cursor.
    """
    MAX_ITERATIONS = 10
    summary_models = []
    search_cursor = cursor

    for i in range(MAX_ITERATIONS):
        remaining_to_fetch = feconf.GALLERY_PAGE_SIZE - len(summary_models)

        exp_ids, search_cursor = search_explorations(
            query_string, remaining_to_fetch, cursor=search_cursor)

        invalid_exp_ids = []
        for ind, model in enumerate(
                exp_models.ExpSummaryModel.get_multi(exp_ids)):
            if model is not None:
                summary_models.append(model)
            else:
                invalid_exp_ids.append(exp_ids[ind])

        if len(summary_models) == feconf.GALLERY_PAGE_SIZE or (
                search_cursor is None):
            break
        else:
            logging.error(
                'Search index contains stale exploration ids: %s' %
                ', '.join(invalid_exp_ids))

    if (len(summary_models) < feconf.GALLERY_PAGE_SIZE
            and search_cursor is not None):
        logging.error(
            'Could not fulfill search request for query string %s; at least '
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))

    return ([
        get_exploration_summary_from_model(summary_model)
        for summary_model in summary_models
    ], search_cursor)


def get_non_private_exploration_summaries():
    """Returns a dict with all non-private exploration summary domain objects,
    keyed by their id.
    """
    return _get_exploration_summary_dicts_from_models(
        exp_models.ExpSummaryModel.get_non_private())


def get_all_exploration_summaries():
    """Returns a dict with all exploration summary domain objects,
    keyed by their id.
    """
    return _get_exploration_summary_dicts_from_models(
        exp_models.ExpSummaryModel.get_all())


# Methods for exporting states and explorations to other formats.
def export_to_zip_file(exploration_id, version=None):
    """Returns a ZIP archive of the exploration."""
    exploration = get_exploration_by_id(exploration_id, version=version)
    yaml_repr = exploration.to_yaml()

    o = StringIO.StringIO()
    with zipfile.ZipFile(o, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('%s.yaml' % exploration.title, yaml_repr)

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
            zf.writestr(unicode_filepath, file_contents)

    return o.getvalue()


def export_states_to_yaml(exploration_id, version=None, width=80):
    """Returns a python dictionary of the exploration, whose keys are state
    names and values are yaml strings representing the state contents with
    lines wrapped at 'width' characters."""
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

    Returns:
      the resulting exploration domain object.
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
                elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_ID):
                    state.update_interaction_id(change.new_value)
                elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                    state.update_interaction_customization_args(
                        change.new_value)
                elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_HANDLERS):
                    raise utils.InvalidInputException(
                        'Editing interaction handlers is no longer supported')
                elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                    state.update_interaction_answer_groups(change.new_value)
                elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME):
                    state.update_interaction_default_outcome(change.new_value)
                elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_UNCLASSIFIED_ANSWERS):
                    state.update_interaction_confirmed_unclassified_answers(
                        change.new_value)
            elif change.cmd == exp_domain.CMD_ADD_GADGET:
                exploration.add_gadget(change.gadget_dict, change.panel)
            elif change.cmd == exp_domain.CMD_RENAME_GADGET:
                exploration.rename_gadget(
                    change.old_gadget_name, change.new_gadget_name)
            elif change.cmd == exp_domain.CMD_DELETE_GADGET:
                exploration.delete_gadget(change.gadget_name)
            elif change.cmd == exp_domain.CMD_EDIT_GADGET_PROPERTY:
                gadget_instance = exploration.get_gadget_instance_by_name(
                    change.gadget_name)
                if (change.property_name ==
                        exp_domain.GADGET_PROPERTY_VISIBILITY):
                    gadget_instance.update_visible_in_states(change.new_value)
                elif (change.property_name ==
                        exp_domain.GADGET_PROPERTY_CUST_ARGS):
                    gadget_instance.update_customization_args(
                        change.new_value)
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
                elif change.property_name == 'default_skin_id':
                    exploration.update_default_skin_id(change.new_value)
                elif change.property_name == 'init_state_name':
                    exploration.update_init_state_name(change.new_value)
            elif (change.cmd ==
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
        raise


class EntityChangeListSummarizer(object):
    """Summarizes additions, deletions, and general changes against a given
    entity type.
    """

    def __init__(self, entity_type):
        """
        Args:
        - entity_type: string. Type of the base entity (e.g. 'state')
        """
        self.entity_type = entity_type

        # A list of added entity names.
        self.added_entities = []

        # A list of deleted entity names.
        self.deleted_entities = []

        # A list of entity names. This indicates that the entity has changed
        # but we do not know what the changes are. This can happen for
        # complicated operations like removing an entity and later adding a
        # new entity with the same name as the removed one.
        self.changed_entities = []

        # A dict, where each key is an entity's name, and the corresponding
        # values are dicts; the keys of these dicts represent properties of
        # the entity, and the corresponding values are dicts with keys
        # old_value and new_value. If an entity's 'name' property is changed,
        # this is listed as a property name change under the old entity name
        # in the outer dict.
        self.property_changes = {}

    @property
    def add_entity_cmd(self):
        return 'add_%s' % self.entity_type

    @property
    def rename_entity_cmd(self):
        return 'rename_%s' % self.entity_type

    @property
    def delete_entity_cmd(self):
        return 'delete_%s' % self.entity_type

    @property
    def edit_entity_property_cmd(self):
        return 'edit_%s_property' % self.entity_type

    @property
    def entity_name(self):
        return '%s_name' % self.entity_type

    @property
    def new_entity_name(self):
        return 'new_%s_name' % self.entity_type

    @property
    def old_entity_name(self):
        return 'old_%s_name' % self.entity_type

    def process_changes(self, original_entity_names, changes):
        """Processes the changes, making results available in each of the
        initialized data structures of the EntityChangeListSummarizer.

        Args:
        - original_entity_names: a list of strings representing the names of
          the individual entities before any of the changes in the change list
          have been made.
        - changes: list of ExplorationChange instances.
        """
        # TODO(sll): Make this method do the same thing as the corresponding
        # code in the frontend's editor history tab -- or, better still, get
        # rid of it entirely and use the frontend code to generate change
        # summaries directly.

        # original_names is a dict whose keys are the current state names, and
        # whose values are the names of these states before any changes were
        # applied. It is used to keep track of identities of states throughout
        # the sequence of changes.
        original_names = {name: name for name in original_entity_names}

        for change in changes:
            if change.cmd == self.add_entity_cmd:
                entity_name = getattr(change, self.entity_name)
                if entity_name in self.changed_entities:
                    continue
                elif entity_name in self.deleted_entities:
                    self.changed_entities.append(entity_name)
                    # TODO(sll): This logic doesn't make sense for the
                    # following sequence of events: (a) an existing
                    # non-default entity is deleted, (b) a new default entity
                    # with the same name is created. Rewrite this method to
                    # take that case into account (or, better still, delete it
                    # altogether and use the frontend history diff
                    # functionality instead).
                    if entity_name in self.property_changes:
                        del self.property_changes[entity_name]
                    self.deleted_entities.remove(entity_name)
                else:
                    self.added_entities.append(entity_name)
                    original_names[entity_name] = entity_name
            elif change.cmd == self.rename_entity_cmd:
                new_entity_name = getattr(change, self.new_entity_name)
                old_entity_name = getattr(change, self.old_entity_name)
                orig_name = original_names[old_entity_name]
                original_names[new_entity_name] = orig_name
                del original_names[old_entity_name]

                if orig_name in self.changed_entities:
                    continue

                if orig_name not in self.property_changes:
                    self.property_changes[orig_name] = {}
                if 'name' not in self.property_changes[orig_name]:
                    self.property_changes[orig_name]['name'] = {
                        'old_value': old_entity_name
                    }
                self.property_changes[orig_name]['name']['new_value'] = (
                    new_entity_name)
            elif change.cmd == self.delete_entity_cmd:
                entity_name = getattr(change, self.entity_name)
                orig_name = original_names[entity_name]
                del original_names[entity_name]

                if orig_name in self.changed_entities:
                    continue
                elif orig_name in self.added_entities:
                    self.added_entities.remove(orig_name)
                else:
                    self.deleted_entities.append(orig_name)
            elif change.cmd == self.edit_entity_property_cmd:
                entity_name = getattr(change, self.entity_name)
                orig_name = original_names[entity_name]
                if orig_name in self.changed_entities:
                    continue

                property_name = change.property_name

                if orig_name not in self.property_changes:
                    self.property_changes[orig_name] = {}
                if property_name not in self.property_changes[orig_name]:
                    self.property_changes[orig_name][property_name] = {
                        'old_value': change.old_value
                    }
                self.property_changes[orig_name][property_name][
                    'new_value'] = change.new_value

        unchanged_names = []
        for name in self.property_changes:
            unchanged_properties = []
            changes = self.property_changes[name]
            for property_name in changes:
                if (changes[property_name]['old_value'] ==
                        changes[property_name]['new_value']):
                    unchanged_properties.append(property_name)
            for property_name in unchanged_properties:
                del changes[property_name]
            if len(changes) == 0:
                unchanged_names.append(name)
        for name in unchanged_names:
            del self.property_changes[name]


def get_summary_of_change_list(base_exploration, change_list):
    """Applies a changelist to a pristine exploration and returns a summary.

    Each entry in change_list is a dict that represents an ExplorationChange
    object.

    Returns:
      a dict with nine keys:
        - exploration_property_changes: a dict, where each key is a
          property_name of the exploration, and the corresponding values are
          dicts with keys old_value and new_value.
        - 4 'state' and 'gadget' change lists per data structures defined
          in EntityChangeListSummarizer
    """

    # TODO(anuzis): need to capture changes in gadget positioning
    # between and within panels when we expand support for these actions.

    # Ensure that the original exploration does not get altered.
    exploration = copy.deepcopy(base_exploration)

    changes = [
        exp_domain.ExplorationChange(change_dict)
        for change_dict in change_list]

    # State changes
    state_change_summarizer = EntityChangeListSummarizer(
        _BASE_ENTITY_STATE)
    state_change_summarizer.process_changes(
        exploration.states.keys(), changes)

    # Gadget changes
    gadget_change_summarizer = EntityChangeListSummarizer(
        _BASE_ENTITY_GADGET)
    gadget_change_summarizer.process_changes(
        exploration.get_all_gadget_names(), changes)

    # Exploration changes
    exploration_property_changes = {}
    for change in changes:
        if change.cmd == exp_domain.CMD_EDIT_EXPLORATION_PROPERTY:
            property_name = change.property_name

            if property_name not in exploration_property_changes:
                exploration_property_changes[property_name] = {
                    'old_value': change.old_value
                }
            exploration_property_changes[property_name]['new_value'] = (
                change.new_value)
        elif (change.cmd ==
                exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
            continue

    unchanged_exploration_properties = []
    for property_name in exploration_property_changes:
        if (exploration_property_changes[property_name]['old_value'] ==
                exploration_property_changes[property_name]['new_value']):
            unchanged_exploration_properties.append(property_name)
    for property_name in unchanged_exploration_properties:
        del exploration_property_changes[property_name]

    return {
        'exploration_property_changes': exploration_property_changes,
        'state_property_changes': state_change_summarizer.property_changes,
        'changed_states': state_change_summarizer.changed_entities,
        'added_states': state_change_summarizer.added_entities,
        'deleted_states': state_change_summarizer.deleted_entities,
        'gadget_property_changes': gadget_change_summarizer.property_changes,
        'changed_gadgets': gadget_change_summarizer.changed_entities,
        'added_gadgets': gadget_change_summarizer.added_entities,
        'deleted_gadgets': gadget_change_summarizer.deleted_entities
    }


def _save_exploration(committer_id, exploration, commit_message, change_list):
    """Validates an exploration and commits it to persistent storage.

    If successful, increments the version number of the incoming exploration
    domain object by 1.
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

    exploration_model.category = exploration.category
    exploration_model.title = exploration.title
    exploration_model.objective = exploration.objective
    exploration_model.language_code = exploration.language_code
    exploration_model.tags = exploration.tags
    exploration_model.blurb = exploration.blurb
    exploration_model.author_notes = exploration.author_notes
    exploration_model.default_skin = exploration.default_skin
    exploration_model.skin_customizations = (
        exploration.skin_instance.to_dict()['skin_customizations'])

    exploration_model.states_schema_version = exploration.states_schema_version
    exploration_model.init_state_name = exploration.init_state_name
    exploration_model.states = {
        state_name: state.to_dict()
        for (state_name, state) in exploration.states.iteritems()}
    exploration_model.param_specs = exploration.param_specs_dict
    exploration_model.param_changes = exploration.param_change_dicts

    exploration_model.commit(committer_id, commit_message, change_list)
    memcache_services.delete(_get_exploration_memcache_key(exploration.id))
    event_services.ExplorationContentChangeEventHandler.record(exploration.id)
    index_explorations_given_ids([exploration.id])

    exploration.version += 1


def _create_exploration(
        committer_id, exploration, commit_message, commit_cmds):
    """Ensures that rights for a new exploration are saved first.

    This is because _save_exploration() depends on the rights object being
    present to tell it whether to do strict validation or not.
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
        default_skin=exploration.default_skin,
        skin_customizations=exploration.skin_instance.to_dict(
            )['skin_customizations'],
        states_schema_version=exploration.states_schema_version,
        init_state_name=exploration.init_state_name,
        states={
            state_name: state.to_dict()
            for (state_name, state) in exploration.states.iteritems()},
        param_specs=exploration.param_specs_dict,
        param_changes=exploration.param_change_dicts,
    )
    model.commit(committer_id, commit_message, commit_cmds)
    event_services.ExplorationContentChangeEventHandler.record(exploration.id)
    exploration.version += 1
    create_exploration_summary(exploration.id)


def save_new_exploration(committer_id, exploration):
    commit_message = (
        'New exploration created with title \'%s\'.' % exploration.title)
    _create_exploration(committer_id, exploration, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': exploration.title,
        'category': exploration.category,
    }])


def delete_exploration(committer_id, exploration_id, force_deletion=False):
    """Deletes the exploration with the given exploration_id.

    IMPORTANT: Callers of this function should ensure that committer_id has
    permissions to delete this exploration, prior to calling this function.

    If force_deletion is True the exploration and its history are fully deleted
    and are unrecoverable. Otherwise, the exploration and all its history are
    marked as deleted, but the corresponding models are still retained in the
    datastore. This last option is the preferred one.
    """
    # TODO(sll): Delete the files too?

    exploration_rights_model = exp_models.ExplorationRightsModel.get(
        exploration_id)
    exploration_rights_model.delete(
        committer_id, '', force_deletion=force_deletion)

    exploration_model = exp_models.ExplorationModel.get(exploration_id)
    exploration_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_EXPLORATION_DELETED,
        force_deletion=force_deletion)

    # This must come after the exploration is retrieved. Otherwise the memcache
    # key will be reinstated.
    exploration_memcache_key = _get_exploration_memcache_key(exploration_id)
    memcache_services.delete(exploration_memcache_key)

    #delete the exploration from search.
    delete_documents_from_search_index([exploration_id])

    # delete summary of exploration
    delete_exploration_summary(exploration_id, force_deletion=force_deletion)


# Operations on exploration snapshots.
def get_exploration_snapshots_metadata(exploration_id):
    """Returns the snapshots for this exploration, as dicts.

    Args:
        exploration_id: str. The id of the exploration in question.

    Returns:
        list of dicts, each representing a recent snapshot. Each dict has the
        following keys: committer_id, commit_message, commit_cmds, commit_type,
        created_on_ms, version_number. The version numbers are consecutive and
        in ascending order. There are exploration.version_number items in the
        returned list.
    """
    exploration = get_exploration_by_id(exploration_id)
    current_version = exploration.version
    version_nums = range(1, current_version + 1)

    return exp_models.ExplorationModel.get_snapshots_metadata(
        exploration_id, version_nums)


def update_exploration(
        committer_id, exploration_id, change_list, commit_message):
    """Update an exploration. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - exploration_id: str. The exploration id.
    - change_list: list of dicts, each representing a _Change object. These
        changes are applied in sequence to produce the resulting exploration.
    - commit_message: str or None. A description of changes made to the state.
        For published explorations, this must be present; for unpublished
        explorations, it should be equal to None.
    """
    is_public = rights_manager.is_exploration_public(exploration_id)

    if is_public and not commit_message:
        raise ValueError(
            'Exploration is public so expected a commit message but '
            'received none.')

    exploration = apply_change_list(exploration_id, change_list)
    _save_exploration(committer_id, exploration, commit_message, change_list)

    # update summary of changed exploration
    update_exploration_summary(exploration.id)


def create_exploration_summary(exploration_id):
    """Create summary of an exploration and store in datastore."""
    exploration = get_exploration_by_id(exploration_id)
    exp_summary = get_summary_of_exploration(exploration)
    save_exploration_summary(exp_summary)


def update_exploration_summary(exploration_id):
    """Update the summary of an exploration."""
    exploration = get_exploration_by_id(exploration_id)
    exp_summary = get_summary_of_exploration(exploration)
    save_exploration_summary(exp_summary)


def get_summary_of_exploration(exploration):
    """Create an ExplorationSummary domain object for a given Exploration
    domain object and return it.
    """
    exp_rights = exp_models.ExplorationRightsModel.get_by_id(exploration.id)
    exp_summary_model = exp_models.ExpSummaryModel.get_by_id(exploration.id)
    if exp_summary_model:
        old_exp_summary = get_exploration_summary_from_model(exp_summary_model)
        ratings = old_exp_summary.ratings or feconf.get_empty_ratings()
    else:
        ratings = feconf.get_empty_ratings()

    exploration_model_last_updated = exploration.last_updated
    exploration_model_created_on = exploration.created_on

    exp_summary = exp_domain.ExplorationSummary(
        exploration.id, exploration.title, exploration.category,
        exploration.objective, exploration.language_code,
        exploration.tags, ratings, exp_rights.status,
        exp_rights.community_owned, exp_rights.owner_ids,
        exp_rights.editor_ids, exp_rights.viewer_ids, exploration.version,
        exploration_model_created_on, exploration_model_last_updated
    )

    return exp_summary


def save_exploration_summary(exp_summary):
    """Save an exploration summary domain object as an ExpSummaryModel entity
    in the datastore.
    """
    exp_summary_model = exp_models.ExpSummaryModel(
        id=exp_summary.id,
        title=exp_summary.title,
        category=exp_summary.category,
        objective=exp_summary.objective,
        language_code=exp_summary.language_code,
        tags=exp_summary.tags,
        ratings = exp_summary.ratings,
        status=exp_summary.status,
        community_owned=exp_summary.community_owned,
        owner_ids=exp_summary.owner_ids,
        editor_ids=exp_summary.editor_ids,
        viewer_ids=exp_summary.viewer_ids,
        version=exp_summary.version,
        exploration_model_last_updated=(
            exp_summary.exploration_model_last_updated),
        exploration_model_created_on=(
            exp_summary.exploration_model_created_on)
    )

    exp_summary_model.put()


def delete_exploration_summary(exploration_id, force_deletion=False):
    """Delete an exploration summary model."""

    exp_models.ExpSummaryModel.get(exploration_id).delete()


def revert_exploration(
        committer_id, exploration_id, current_version, revert_to_version):
    """Reverts an exploration to the given version number. Commits changes."""
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

    exp_models.ExplorationModel.revert(exploration_model,
        committer_id, 'Reverted exploration to version %s' % revert_to_version,
        revert_to_version)
    memcache_services.delete(_get_exploration_memcache_key(exploration_id))

    update_exploration_summary(exploration_id)


# Creation and deletion methods.
def get_demo_exploration_components(demo_path):
    """Gets the content of `demo_path` in the sample explorations folder.

    Args:
      demo_path: the file or folder path for the content of an exploration
        in SAMPLE_EXPLORATIONS_DIR. E.g.: 'adventure.yaml' or 'tar/'.

    Returns:
      a 2-tuple, the first element of which is a yaml string, and the second
      element of which is a list of (filepath, content) 2-tuples. The filepath
      does not include the assets/ prefix.
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
        committer_id, yaml_content, title, category, exploration_id,
        assets_list):
    if assets_list is None:
        assets_list = []

    exploration = exp_domain.Exploration.from_untitled_yaml(
        exploration_id, title, category, yaml_content)
    commit_message = (
        'New exploration created from YAML file with title \'%s\'.'
        % exploration.title)

    _create_exploration(committer_id, exploration, commit_message, [{
        'cmd': CMD_CREATE_NEW,
        'title': exploration.title,
        'category': exploration.category,
    }])

    for (asset_filename, asset_content) in assets_list:
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        fs.commit(committer_id, asset_filename, asset_content)


def delete_demo(exploration_id):
    """Deletes a single demo exploration."""
    if not (0 <= int(exploration_id) < len(feconf.DEMO_EXPLORATIONS)):
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

    The resulting exploration will have two commits in its history (one for its
    initial creation and one for its subsequent modification.)
    """
    delete_demo(exploration_id)

    if not (0 <= int(exploration_id) < len(feconf.DEMO_EXPLORATIONS)):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    exploration_info = feconf.DEMO_EXPLORATIONS[int(exploration_id)]

    if len(exploration_info) == 3:
        (exp_filename, title, category) = exploration_info
    else:
        raise Exception('Invalid demo exploration: %s' % exploration_info)

    yaml_content, assets_list = get_demo_exploration_components(exp_filename)
    save_new_exploration_from_yaml_and_assets(
        feconf.SYSTEM_COMMITTER_ID, yaml_content, title, category,
        exploration_id, assets_list)

    rights_manager.publish_exploration(
        feconf.SYSTEM_COMMITTER_ID, exploration_id)

    index_explorations_given_ids([exploration_id])

    logging.info('Exploration with id %s was loaded.' % exploration_id)


def get_next_page_of_all_commits(
        page_size=feconf.COMMIT_LIST_PAGE_SIZE, urlsafe_start_cursor=None):
    """Returns a page of commits to all explorations in reverse time order.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
    """
    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_commits(
            page_size, urlsafe_start_cursor))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id, entry.username,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def get_next_page_of_all_non_private_commits(
        page_size=feconf.COMMIT_LIST_PAGE_SIZE, urlsafe_start_cursor=None,
        max_age=None):
    """Returns a page of non-private commits in reverse time order. If max_age
    is given, it should be a datetime.timedelta instance.

    The return value is a triple (results, cursor, more) as described in
    fetch_page() at:

        https://developers.google.com/appengine/docs/python/ndb/queryclass
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


def _exp_rights_to_search_dict(rights):
    # Allow searches like "is:featured".
    doc = {}
    if rights.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED:
        doc['is'] = 'featured'
    return doc


def _should_index(exp):
    rights = rights_manager.get_exploration_rights(exp.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE


def _get_search_rank(exp_id):
    """Returns an integer determining the document's rank in search.

    Featured explorations get a ranking bump, and so do explorations that
    have been more recently updated. Good ratings will increase the ranking
    and bad ones will lower it.
    """
    # TODO(sll): Improve this calculation.
    _STATUS_PUBLICIZED_BONUS = 30
    # This is done to prevent the rank hitting 0 too easily. Note that
    # negative ranks are disallowed in the Search API.
    _DEFAULT_RANK = 20

    exploration = get_exploration_by_id(exp_id)
    rights = rights_manager.get_exploration_rights(exp_id)
    summary = get_exploration_summary_by_id(exp_id)
    rank = _DEFAULT_RANK + (
        _STATUS_PUBLICIZED_BONUS
        if rights.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED
        else 0)

    if summary.ratings:
        RATING_WEIGHTINGS = {'1': -5, '2': -2, '3': 2, '4': 5, '5': 10}
        for rating_value in summary.ratings:
            rank += (
                summary.ratings[rating_value] *
                RATING_WEIGHTINGS[rating_value])

    # Iterate backwards through the exploration history metadata until we find
    # the most recent snapshot that was committed by a human.
    last_human_update_ms = 0
    snapshots_metadata = get_exploration_snapshots_metadata(exp_id)
    for snapshot_metadata in reversed(snapshots_metadata):
        if snapshot_metadata['committer_id'] != feconf.MIGRATION_BOT_USER_ID:
            last_human_update_ms = snapshot_metadata['created_on_ms']
            break

    _TIME_NOW_MS = utils.get_current_time_in_millisecs()
    _MS_IN_ONE_DAY = 24 * 60 * 60 * 1000
    time_delta_days = int(
        (_TIME_NOW_MS - last_human_update_ms) / _MS_IN_ONE_DAY)
    if time_delta_days == 0:
        rank += 80
    elif time_delta_days == 1:
        rank += 50
    elif 2 <= time_delta_days <= 7:
        rank += 35

    # Ranks must be non-negative.
    return max(rank, 0)


def _exp_to_search_dict(exp):
    rights = rights_manager.get_exploration_rights(exp.id)
    doc = {
        'id': exp.id,
        'language_code': exp.language_code,
        'title': exp.title,
        'category': exp.category,
        'tags': exp.tags,
        'blurb': exp.blurb,
        'objective': exp.objective,
        'author_notes': exp.author_notes,
        'rank': _get_search_rank(exp.id),
    }
    doc.update(_exp_rights_to_search_dict(rights))
    return doc


def clear_search_index():
    """WARNING: This runs in-request, and may therefore fail if there are too
    many entries in the index.
    """
    search_services.clear_index(SEARCH_INDEX_EXPLORATIONS)


def index_explorations_given_ids(exp_ids):
    # We pass 'strict=False' so as not to index deleted explorations.
    exploration_models = get_multiple_explorations_by_id(exp_ids, strict=False)
    search_services.add_documents_to_index([
        _exp_to_search_dict(exp) for exp in exploration_models.values()
        if _should_index(exp)
    ], SEARCH_INDEX_EXPLORATIONS)


def patch_exploration_search_document(exp_id, update):
    """Patches an exploration's current search document, with the values
    from the 'update' dictionary.
    """
    doc = search_services.get_document_from_index(
        exp_id, SEARCH_INDEX_EXPLORATIONS)
    doc.update(update)
    search_services.add_documents_to_index([doc], SEARCH_INDEX_EXPLORATIONS)


def update_exploration_status_in_search(exp_id):
    rights = rights_manager.get_exploration_rights(exp_id)
    if rights.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
        delete_documents_from_search_index([exp_id])
    else:
        patch_exploration_search_document(
            rights.id, _exp_rights_to_search_dict(rights))


def delete_documents_from_search_index(exploration_ids):
    search_services.delete_documents_from_index(
        exploration_ids, SEARCH_INDEX_EXPLORATIONS)


def search_explorations(query, limit, sort=None, cursor=None):
    """Searches through the available explorations.

    args:
      - query_string: the query string to search for.
      - sort: a string indicating how to sort results. This should be a string
          of space separated values. Each value should start with a '+' or a
          '-' character indicating whether to sort in ascending or descending
          order respectively. This character should be followed by a field name
          to sort on. When this is None, results are based on 'rank'. See
          _get_search_rank to see how rank is determined.
      - limit: the maximum number of results to return.
      - cursor: A cursor, used to get the next page of results.
          If there are more documents that match the query than 'limit', this
          function will return a cursor to get the next page.

    returns: a tuple:
      - a list of exploration ids that match the query.
      - a cursor if there are more matching explorations to fetch, None
          otherwise. If a cursor is returned, it will be a web-safe string that
          can be used in URLs.
    """
    return search_services.search(
        query, SEARCH_INDEX_EXPLORATIONS, cursor, limit, sort, ids_only=True)
