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

from __future__ import annotations

import copy
import logging

from core import feconf
from core.domain import caching_services
from core.domain import exp_domain
from core.domain import subscription_services
from core.platform import models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
datastore_services = models.Registry.import_datastore_services()


def _migrate_states_schema(versioned_exploration_states, init_state_name):
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
        init_state_name: str. Name of initial state.

    Raises:
        Exception. The given states_schema_version is invalid.
    """
    states_schema_version = versioned_exploration_states[
        'states_schema_version']

    if not (feconf.EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION
            <= states_schema_version
            <= feconf.CURRENT_STATE_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v%d-v%d exploration state schemas at '
            'present.' % (
                feconf.EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION,
                feconf.CURRENT_STATE_SCHEMA_VERSION))

    while (states_schema_version <
           feconf.CURRENT_STATE_SCHEMA_VERSION):
        exp_domain.Exploration.update_states_from_model(
            versioned_exploration_states,
            states_schema_version, init_state_name)
        states_schema_version += 1


def get_new_exploration_id():
    """Returns a new exploration id.

    Returns:
        str. A new exploration id.
    """
    return exp_models.ExplorationModel.get_new_id('')


def get_multiple_versioned_exp_interaction_ids_mapping_by_version(
        exp_id, version_numbers):
    """Returns a list of VersionedExplorationInteractionIdsMapping domain
    objects corresponding to the specified versions.

    Args:
        exp_id: str. ID of the exploration.
        version_numbers: list(int). List of version numbers.

    Returns:
        list(VersionedExplorationInteractionIdsMapping). List of Exploration
        domain objects.

    Raises:
        Exception. One or more of the given versions of the exploration could
            not be converted to the latest schema version.
    """
    versioned_exp_interaction_ids_mapping = []
    exploration_models = exp_models.ExplorationModel.get_multi_versions(
        exp_id, version_numbers)
    for index, exploration_model in enumerate(exploration_models):
        if (exploration_model.states_schema_version !=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            raise Exception(
                'Exploration(id=%s, version=%s, states_schema_version=%s) '
                'does not match the latest schema version %s' % (
                    exp_id,
                    version_numbers[index],
                    exploration_model.states_schema_version,
                    feconf.CURRENT_STATE_SCHEMA_VERSION
                ))
        states_to_interaction_id_mapping = {}
        for state_name in exploration_model.states:
            states_to_interaction_id_mapping[state_name] = (
                exploration_model.states[state_name]['interaction']['id'])
        versioned_exp_interaction_ids_mapping.append(
            exp_domain.VersionedExplorationInteractionIdsMapping(
                exploration_model.version,
                states_to_interaction_id_mapping))

    return versioned_exp_interaction_ids_mapping


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
    init_state_name = exploration_model.init_state_name

    # If the exploration uses the latest states schema version, no conversion
    # is necessary.
    if (run_conversion and exploration_model.states_schema_version !=
            feconf.CURRENT_STATE_SCHEMA_VERSION):
        _migrate_states_schema(versioned_exploration_states, init_state_name)

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
        exploration_model.next_content_id_index,
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
        exploration_id, strict=False)
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
        exp_summary_model.first_published_msec,
        exp_summary_model.deleted
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
    return [get_exploration_summary_from_model(model) if model else None
            for model in exp_models.ExpSummaryModel.get_multi(exp_ids)]


def get_exploration_summaries_subscribed_to(user_id):
    """Returns a list of ExplorationSummary domain objects that the user
    subscribes to.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(ExplorationSummary). List of ExplorationSummary domain objects that
        the user subscribes to.
    """
    return [
        summary for summary in
        get_exploration_summaries_matching_ids(
            subscription_services.get_exploration_ids_subscribed_to(user_id)
        ) if summary is not None
    ]


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
    sub_namespace = str(version) if version else None
    # cached_exploration = caching_services.get_multi(
    #     caching_services.CACHE_NAMESPACE_EXPLORATION,
    #     sub_namespace,
    #     [exploration_id]
    # ).get(exploration_id)

    # Remove this after discussing with @DubeySandeep.
    cached_exploration = None

    if cached_exploration is not None:
        return cached_exploration
    else:
        exploration_model = exp_models.ExplorationModel.get(
            exploration_id, strict=strict, version=version)
        if exploration_model:
            exploration = get_exploration_from_model(exploration_model)
            caching_services.set_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                sub_namespace,
                {
                    exploration_id: exploration
                })
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
        ValueError. When strict is True and at least one of the given exp_ids
            is invalid.
    """
    result = {}
    uncached = []
    cache_result = caching_services.get_multi(
        caching_services.CACHE_NAMESPACE_EXPLORATION, None, exp_ids)

    for exp_obj in cache_result.values():
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
            logging.info(
                'Tried to fetch exploration with id %s, but no such '
                'exploration exists in the datastore' % eid)
            not_found.append(eid)

    if strict and not_found:
        raise ValueError(
            'Couldn\'t find explorations with the following ids:\n%s'
            % '\n'.join(not_found))

    cache_update = {
        eid: results for eid, results in db_results_dict.items()
        if results is not None
    }

    if cache_update:
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None, cache_update)

    result.update(db_results_dict)
    return result


def get_exploration_summaries_where_user_has_role(user_id):
    """Returns a list of ExplorationSummary domain objects where the user has
    some role.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(ExplorationSummary). List of ExplorationSummary domain objects
        where the user has some role.
    """
    exp_summary_models = exp_models.ExpSummaryModel.query(
        datastore_services.any_of(
            exp_models.ExpSummaryModel.owner_ids == user_id,
            exp_models.ExpSummaryModel.editor_ids == user_id,
            exp_models.ExpSummaryModel.voice_artist_ids == user_id,
            exp_models.ExpSummaryModel.viewer_ids == user_id,
            exp_models.ExpSummaryModel.contributor_ids == user_id
        )
    ).fetch()
    return [
        get_exploration_summary_from_model(exp_summary_model)
        for exp_summary_model in exp_summary_models
    ]
