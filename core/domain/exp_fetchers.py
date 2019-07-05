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

"""Commands that can be used to fetch exploration related models.

All functions here should be agnostic of how ExplorationModel objects are
stored in the database. In particular, the various query methods should
delegate to the Exploration model class. This will enable the exploration
storage model to be changed without affecting this module and others above it.
"""


import copy
import logging

from core.domain import exp_domain
from core.platform import models
import feconf
import utils

memcache_services = models.Registry.import_memcache_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


def _migrate_states_schema(versioned_exploration_states, exploration_id):
    """Holds the responsibility of performing a step-by-step, sequential update
    of an exploration states structure based on the schema version of the input
    exploration dictionary. This is very similar to the YAML conversion process
    found in exp_domain.py and, in fact, many of the conversion functions for
    states are also used in the YAML conversion pipeline. If the current
    exploration states schema version changes
    (feconf.CURRENT_STATE_SCHEMA_VERSION), a new conversion
    function must be added and some code appended to this function to account
    for that new version.

    Args:
        versioned_exploration_states: dict. A dict with two keys:
            - states_schema_version: int. the states schema version for the
                exploration.
            - states: the dict of states comprising the exploration. The keys in
                this dict are state names.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception: The given states_schema_version is invalid.
    """
    states_schema_version = versioned_exploration_states[
        'states_schema_version']
    if states_schema_version is None or states_schema_version < 1:
        states_schema_version = 0

    if not (0 <= states_schema_version
            <= feconf.CURRENT_STATE_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d and unversioned exploration '
            'state schemas at present.' %
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    while (states_schema_version <
           feconf.CURRENT_STATE_SCHEMA_VERSION):
        exp_domain.Exploration.update_states_from_model(
            versioned_exploration_states, states_schema_version,
            exploration_id)
        states_schema_version += 1


def get_new_exploration_id():
    """Returns a new exploration id.

    Returns:
        str. A new exploration id.
    """
    return exp_models.ExplorationModel.get_new_id('')


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
            'Exploration %s, versions [%s] could not be converted to latest'
            'schema version.' % (exp_id, ', '.join(map(str, error_versions))))
    return explorations


def get_exploration_memcache_key(exploration_id, version=None):
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
            feconf.CURRENT_STATE_SCHEMA_VERSION):
        _migrate_states_schema(
            versioned_exploration_states, exploration_model.id)

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


def get_exploration_summaries_from_models(exp_summary_models):
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
        exp_summary_model.voice_artist_ids, exp_summary_model.viewer_ids,
        exp_summary_model.contributor_ids,
        exp_summary_model.contributors_summary, exp_summary_model.version,
        exp_summary_model.exploration_model_created_on,
        exp_summary_model.exploration_model_last_updated,
        exp_summary_model.first_published_msec
    )


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
    return [get_exploration_summary_from_model(model)if model else None
            for model in exp_models.ExpSummaryModel.get_multi(exp_ids)]


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

    exploration_memcache_key = get_exploration_memcache_key(
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
    memcache_keys = [get_exploration_memcache_key(i) for i in exp_ids]
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
