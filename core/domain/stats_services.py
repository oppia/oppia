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

"""Services for exploration-related statistics."""

from __future__ import annotations

import copy
import datetime
import itertools
import logging

from core import feconf
from core import utils
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import question_services
from core.domain import stats_domain
from core.platform import models

from typing import List, Literal, Optional, Sequence, overload

MYPY = False
if MYPY:  # pragma: no cover
    from core.domain import state_domain
    from mypy_imports import stats_models
    from mypy_imports import transaction_services

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])
transaction_services = models.Registry.import_transaction_services()

# NOTE TO DEVELOPERS: The functions:
#   - get_visualizations_info()
#   - get_top_state_answer_stats()
#   - get_top_state_unresolved_answers()
#   - get_top_state_answer_stats_multi()
# were removed in #13021 as part of the migration to Apache Beam. Please refer
# to that PR if you need to reinstate them.


@overload
def get_playthrough_models_by_ids(
    playthrough_ids: List[str], *, strict: Literal[True]
) -> List[stats_models.PlaythroughModel]: ...


@overload
def get_playthrough_models_by_ids(
    playthrough_ids: List[str]
) -> List[Optional[stats_models.PlaythroughModel]]: ...


@overload
def get_playthrough_models_by_ids(
    playthrough_ids: List[str], *, strict: Literal[False]
) -> List[Optional[stats_models.PlaythroughModel]]: ...


def get_playthrough_models_by_ids(
    playthrough_ids: List[str], strict: bool = False
) -> Sequence[Optional[stats_models.PlaythroughModel]]:
    """Returns a list of playthrough models matching the IDs provided.

    Args:
        playthrough_ids: list(str). List of IDs to get playthrough models for.
        strict: bool. Whether to fail noisily if no playthrough model exists
            with a given ID exists in the datastore.

    Returns:
        list(PlaythroughModel|None). The list of playthrough models
        corresponding to given ids.  If a PlaythroughModel does not exist,
        the corresponding returned list element is None.

    Raises:
        Exception. No PlaythroughModel exists for the given playthrough_id.
    """

    playthrough_models = (
            stats_models.PlaythroughModel.get_multi(playthrough_ids))

    if strict:
        for index, playthrough_model in enumerate(playthrough_models):
            if playthrough_model is None:
                raise Exception(
                    'No PlaythroughModel exists for the playthrough_id: %s'
                    % playthrough_ids[index]
                )

    return playthrough_models


def _migrate_to_latest_issue_schema(
    exp_issue_dict: stats_domain.ExplorationIssueDict
) -> None:
    """Holds the responsibility of performing a step-by-step sequential update
    of an exploration issue dict based on its schema version. If the current
    issue schema version changes (stats_models.CURRENT_ISSUE_SCHEMA_VERSION), a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        exp_issue_dict: dict. Dict representing the exploration issue.

    Raises:
        Exception. The issue_schema_version is invalid.
    """
    issue_schema_version = exp_issue_dict['schema_version']
    if issue_schema_version is None or issue_schema_version < 1:
        issue_schema_version = 0

    if not (0 <= issue_schema_version
            <= stats_models.CURRENT_ISSUE_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d and unversioned issue schemas '
            'at present.' %
            stats_models.CURRENT_ISSUE_SCHEMA_VERSION)

    while issue_schema_version < stats_models.CURRENT_ISSUE_SCHEMA_VERSION:
        stats_domain.ExplorationIssue.update_exp_issue_from_model(
            exp_issue_dict)
        issue_schema_version += 1


def _migrate_to_latest_action_schema(
    learner_action_dict: stats_domain.LearnerActionDict
) -> None:
    """Holds the responsibility of performing a step-by-step sequential update
    of an learner action dict based on its schema version. If the current action
    schema version changes (stats_models.CURRENT_ACTION_SCHEMA_VERSION), a new
    conversion function must be added and some code appended to this function to
    account for that new version.

    Args:
        learner_action_dict: dict. Dict representing the learner action.

    Raises:
        Exception. The action_schema_version is invalid.
    """
    action_schema_version = learner_action_dict['schema_version']
    if action_schema_version is None or action_schema_version < 1:
        action_schema_version = 0

    if not (0 <= action_schema_version
            <= stats_models.CURRENT_ACTION_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d and unversioned action schemas '
            'at present.' %
            stats_models.CURRENT_ACTION_SCHEMA_VERSION)

    while action_schema_version < stats_models.CURRENT_ACTION_SCHEMA_VERSION:
        stats_domain.LearnerAction.update_learner_action_from_model(
            learner_action_dict)
        action_schema_version += 1


def get_exploration_stats(
    exp_id: str, exp_version: int
) -> stats_domain.ExplorationStats:
    """Retrieves the ExplorationStats domain instance.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.

    Returns:
        ExplorationStats. The exploration stats domain object.
    """
    exploration_stats = get_exploration_stats_by_id(exp_id, exp_version)
    if exploration_stats is None:
        exploration_stats = stats_domain.ExplorationStats.create_default(
            exp_id, exp_version, {})

    return exploration_stats


@transaction_services.run_in_transaction_wrapper
def _update_stats_transactional(
    exp_id: str,
    exp_version: int,
    aggregated_stats: stats_domain.AggregatedStatsDict
) -> None:
    """Updates ExplorationStatsModel according to the dict containing aggregated
    stats. The model GET and PUT must be done in a transaction to avoid loss of
    updates that come in rapid succession.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        aggregated_stats: dict. Dict representing an ExplorationStatsModel
            instance with stats aggregated in the frontend.

    Raises:
        Exception. ExplorationStatsModel does not exist.
    """
    exploration = exp_fetchers.get_exploration_by_id(exp_id)
    if exploration.version != exp_version:
        logging.error(
            'Trying to update stats for version %s of exploration %s, but '
            'the current version is %s.' % (
                exp_version, exp_id, exploration.version))
        return

    exp_stats = get_exploration_stats_by_id(exp_id, exp_version)

    if exp_stats is None:
        raise Exception(
            'ExplorationStatsModel id="%s.%s" does not exist' % (
                exp_id, exp_version))

    try:
        stats_domain.SessionStateStats.validate_aggregated_stats_dict(
            aggregated_stats)
    except utils.ValidationError as e:
        logging.exception('Aggregated stats validation failed: %s', e)
        return

    exp_stats.num_starts_v2 += aggregated_stats['num_starts']
    exp_stats.num_completions_v2 += aggregated_stats['num_completions']
    exp_stats.num_actual_starts_v2 += aggregated_stats['num_actual_starts']

    state_stats_mapping = aggregated_stats['state_stats_mapping']
    for state_name, stats in state_stats_mapping.items():
        if state_name not in exp_stats.state_stats_mapping:
            # Some events in the past seems to have 'undefined' state names
            # passed from the frontend code. These are invalid and should be
            # discarded.
            if state_name == 'undefined':
                return
            raise Exception(
                'ExplorationStatsModel id="%s.%s": state_stats_mapping[%r] '
                'does not exist' % (exp_id, exp_version, state_name))
        exp_stats.state_stats_mapping[state_name].aggregate_from(
            stats_domain.SessionStateStats.from_dict(stats))

    save_stats_model(exp_stats)


def update_stats(
    exp_id: str,
    exp_version: int,
    aggregated_stats: stats_domain.AggregatedStatsDict
) -> None:
    """Updates ExplorationStatsModel according to the dict containing aggregated
    stats.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        aggregated_stats: dict. Dict representing an ExplorationStatsModel
            instance with stats aggregated in the frontend.
    """
    _update_stats_transactional(
        exp_id, exp_version, aggregated_stats)


def get_stats_for_new_exploration(
    exp_id: str, exp_version: int, state_names: List[str]
) -> stats_domain.ExplorationStats:
    """Creates ExplorationStatsModel for the freshly created exploration and
    sets all initial values to zero.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        state_names: list(str). State names of the exploration.

    Returns:
        ExplorationStats. The newly created exploration stats object.
    """
    state_stats_mapping = {
        state_name: stats_domain.StateStats.create_default()
        for state_name in state_names
    }

    exploration_stats = stats_domain.ExplorationStats.create_default(
        exp_id, exp_version, state_stats_mapping)
    return exploration_stats


def get_stats_for_new_exp_version(
    exp_id: str,
    exp_version: int,
    state_names: List[str],
    exp_versions_diff: Optional[exp_domain.ExplorationVersionsDiff],
    revert_to_version: Optional[int]
) -> stats_domain.ExplorationStats:
    """Retrieves the ExplorationStatsModel for the old exp_version and makes any
    required changes to the structure of the model. Then, a new
    ExplorationStatsModel is created for the new exp_version. Note: This
    function does not save the newly created model, it returns it. Callers
    should explicitly save the model if required.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        state_names: list(str). State names of the exploration.
        exp_versions_diff: ExplorationVersionsDiff|None. The domain object for
            the exploration versions difference, None if it is a revert.
        revert_to_version: int|None. If the change is a revert, the version.
            Otherwise, None.

    Returns:
        ExplorationStats. The newly created exploration stats object.
    """
    old_exp_stats = None
    old_exp_version = exp_version - 1
    new_exp_version = exp_version
    exploration_stats = get_exploration_stats_by_id(
        exp_id, old_exp_version)
    if exploration_stats is None:
        return get_stats_for_new_exploration(
            exp_id, new_exp_version, state_names)

    # Handling reverts.
    if revert_to_version:
        old_exp_stats = get_exploration_stats_by_id(exp_id, revert_to_version)

    return advance_version_of_exp_stats(
        new_exp_version, exp_versions_diff, exploration_stats, old_exp_stats,
        revert_to_version)


def advance_version_of_exp_stats(
    exp_version: int,
    exp_versions_diff: Optional[exp_domain.ExplorationVersionsDiff],
    exp_stats: stats_domain.ExplorationStats,
    reverted_exp_stats: Optional[stats_domain.ExplorationStats],
    revert_to_version: Optional[int]
) -> stats_domain.ExplorationStats:
    """Makes required changes to the structure of ExplorationStatsModel of an
    old exp_version and a new ExplorationStatsModel is created for the new
    exp_version. Note: This function does not save the newly created model, it
    returns it. Callers should explicitly save the model if required.

    Args:
        exp_version: int. Version of the exploration.
        exp_versions_diff: ExplorationVersionsDiff|None. The domain object for
            the exploration versions difference, None if it is a revert.
        exp_stats: ExplorationStats. The ExplorationStats model.
        reverted_exp_stats: ExplorationStats|None. The reverted
            ExplorationStats model.
        revert_to_version: int|None. If the change is a revert, the version.
            Otherwise, None.

    Returns:
        ExplorationStats. The newly created exploration stats object.

    Raises:
        Exception. ExplorationVersionsDiff cannot be None when the change
            is not a revert.
    """

    # Handling reverts.
    if revert_to_version:
        # If the old exploration issues model doesn't exist, the current model
        # is carried over (this is a fallback case for some tests, and can never
        # happen in production.)
        if reverted_exp_stats:
            exp_stats.num_starts_v2 = reverted_exp_stats.num_starts_v2
            exp_stats.num_actual_starts_v2 = (
                reverted_exp_stats.num_actual_starts_v2)
            exp_stats.num_completions_v2 = (
                reverted_exp_stats.num_completions_v2)
            exp_stats.state_stats_mapping = (
                reverted_exp_stats.state_stats_mapping)
        exp_stats.exp_version = exp_version

        return exp_stats

    new_state_name_stats_mapping = {}

    if exp_versions_diff is None:
        raise Exception(
            'ExplorationVersionsDiff cannot be None when the change is'
            ' not a revert.'
        )
    # Handle unchanged states.
    unchanged_state_names = set(utils.compute_list_difference(
        list(exp_stats.state_stats_mapping.keys()),
        exp_versions_diff.deleted_state_names +
        list(exp_versions_diff.new_to_old_state_names.values())))
    for state_name in unchanged_state_names:
        new_state_name_stats_mapping[state_name] = (
            exp_stats.state_stats_mapping[state_name].clone())

    # Handle renamed states.
    for state_name in exp_versions_diff.new_to_old_state_names:
        old_state_name = exp_versions_diff.new_to_old_state_names[
            state_name]
        new_state_name_stats_mapping[state_name] = (
            exp_stats.state_stats_mapping[old_state_name].clone())

    # Handle newly-added states.
    for state_name in exp_versions_diff.added_state_names:
        new_state_name_stats_mapping[state_name] = (
            stats_domain.StateStats.create_default())

    exp_stats.state_stats_mapping = new_state_name_stats_mapping
    exp_stats.exp_version = exp_version

    return exp_stats


def assign_playthrough_to_corresponding_issue(
    playthrough: stats_domain.Playthrough,
    exp_issues: stats_domain.ExplorationIssues,
    issue_schema_version: int
) -> bool:
    """Stores the given playthrough as a new model into its corresponding
    exploration issue. When the corresponding exploration issue does not
    exist, a new one is created.

    Args:
        playthrough: Playthrough. The playthrough domain object.
        exp_issues: ExplorationIssues. The exploration issues domain object.
        issue_schema_version: int. The version of the issue schema.

    Returns:
        bool. Whether the playthrough was stored successfully.
    """
    issue = _get_corresponding_exp_issue(
        playthrough, exp_issues, issue_schema_version)
    if len(issue.playthrough_ids) < feconf.MAX_PLAYTHROUGHS_FOR_ISSUE:
        issue.playthrough_ids.append(
            stats_models.PlaythroughModel.create(
                playthrough.exp_id, playthrough.exp_version,
                playthrough.issue_type,
                playthrough.issue_customization_args,
                [action.to_dict() for action in playthrough.actions]))
        return True
    return False


def _get_corresponding_exp_issue(
    playthrough: stats_domain.Playthrough,
    exp_issues: stats_domain.ExplorationIssues,
    issue_schema_version: int
) -> stats_domain.ExplorationIssue:
    """Returns the unique exploration issue model expected to own the given
    playthrough. If it does not exist yet, then it will be created.

    Args:
        playthrough: Playthrough. The playthrough domain object.
        exp_issues: ExplorationIssues. The exploration issues domain object
            which manages each individual exploration issue.
        issue_schema_version: int. The version of the issue schema.

    Returns:
        ExplorationIssue. The corresponding exploration issue.
    """
    for issue in exp_issues.unresolved_issues:
        if issue.issue_type == playthrough.issue_type:
            issue_customization_args = issue.issue_customization_args
            identifying_arg = (
                feconf.CUSTOMIZATION_ARG_WHICH_IDENTIFIES_ISSUE[
                    issue.issue_type])
            # NOTE TO DEVELOPERS: When identifying_arg is 'state_names', the
            # ordering of the list is important (i.e. [a, b, c] is different
            # from [b, c, a]).
            if (issue_customization_args[identifying_arg] ==
                    playthrough.issue_customization_args[identifying_arg]):
                return issue
    issue = stats_domain.ExplorationIssue(
        playthrough.issue_type, playthrough.issue_customization_args,
        [], issue_schema_version, is_valid=True)
    exp_issues.unresolved_issues.append(issue)
    return issue


def create_exp_issues_for_new_exploration(
    exp_id: str, exp_version: int
) -> None:
    """Creates the ExplorationIssuesModel instance for the exploration.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
    """
    stats_models.ExplorationIssuesModel.create(exp_id, exp_version, [])


def update_exp_issues_for_new_exp_version(
    exploration: exp_domain.Exploration,
    exp_versions_diff: Optional[exp_domain.ExplorationVersionsDiff],
    revert_to_version: Optional[int]
) -> None:
    """Retrieves the ExplorationIssuesModel for the old exp_version and makes
    any required changes to the structure of the model.

    Args:
        exploration: Exploration. Domain object for the exploration.
        exp_versions_diff: ExplorationVersionsDiff|None. The domain object for
            the exploration versions difference, None if it is a revert.
        revert_to_version: int|None. If the change is a revert, the version.
            Otherwise, None.

    Raises:
        Exception. ExplorationVersionsDiff cannot be None when the change
            is not a revert.
    """
    exp_issues = get_exp_issues(
        exploration.id, exploration.version - 1, strict=False
    )
    if exp_issues is None:
        create_exp_issues_for_new_exploration(
            exploration.id, exploration.version - 1)
        return

    if revert_to_version:
        old_exp_issues = get_exp_issues(exploration.id, revert_to_version)
        exp_issues.unresolved_issues = old_exp_issues.unresolved_issues
        exp_issues.exp_version = exploration.version + 1
        create_exp_issues_model(exp_issues)
        return

    if exp_versions_diff is None:
        raise Exception(
            'ExplorationVersionsDiff cannot be None when the change is'
            ' not a revert.'
        )

    deleted_state_names = exp_versions_diff.deleted_state_names
    old_to_new_state_names = exp_versions_diff.old_to_new_state_names

    playthrough_ids = list(itertools.chain.from_iterable(
        issue.playthrough_ids for issue in exp_issues.unresolved_issues))
    playthrough_models = get_playthrough_models_by_ids(
        playthrough_ids, strict=True
    )
    updated_playthrough_models = []

    for playthrough_model in playthrough_models:
        playthrough = get_playthrough_from_model(playthrough_model)

        if 'state_names' in playthrough.issue_customization_args:
            state_names = (
                playthrough.issue_customization_args['state_names']['value'])
            # TODO(#15995): Currently, we are define all issue customization
            # args in one Dict type which forces us to use assert here, but once
            # we have a more narrower and specific type for a specific issue
            # customization args then we can remove assert from here.
            assert isinstance(state_names, list)
            playthrough.issue_customization_args['state_names']['value'] = [
                state_name if state_name not in old_to_new_state_names else
                old_to_new_state_names[state_name] for state_name in state_names
            ]

        if 'state_name' in playthrough.issue_customization_args:
            state_name = (
                playthrough.issue_customization_args['state_name']['value'])
            # TODO(#15995): Currently, we are define all issue customization
            # args in one Dict type which forces us to use assert here, but once
            # we have a more narrower and specific type for a specific issue
            # customization args then we can remove assert from here.
            assert isinstance(state_name, str)
            playthrough.issue_customization_args['state_name']['value'] = (
                state_name if state_name not in old_to_new_state_names else
                old_to_new_state_names[state_name])

        for action in playthrough.actions:
            action_customization_args = action.action_customization_args

            if 'state_name' in action_customization_args:
                state_name = action_customization_args['state_name']['value']
                # TODO(#15995): Currently, we are define all issue customization
                # args in one Dict type which forces us to use assert here, but
                # once we have a more narrower and specific type for a specific
                # issue customization args then we can remove assert from here.
                assert isinstance(state_name, str)
                action_customization_args['state_name']['value'] = (
                    state_name if state_name not in old_to_new_state_names else
                    old_to_new_state_names[state_name])

            if 'dest_state_name' in action_customization_args:
                dest_state_name = (
                    action_customization_args['dest_state_name']['value'])
                # TODO(#15995): Currently, we are define all issue customization
                # args in one Dict type which forces us to use assert here, but
                # once we have a more narrower and specific type for a specific
                # issue customization args then we can remove assert from here.
                assert isinstance(dest_state_name, str)
                action_customization_args['dest_state_name']['value'] = (
                    dest_state_name
                    if dest_state_name not in old_to_new_state_names else
                    old_to_new_state_names[dest_state_name])

        playthrough_model.issue_customization_args = (
            playthrough.issue_customization_args)
        playthrough_model.actions = [
            action.to_dict() for action in playthrough.actions]
        updated_playthrough_models.append(playthrough_model)

    stats_models.PlaythroughModel.update_timestamps_multi(
        updated_playthrough_models
    )
    stats_models.PlaythroughModel.put_multi(updated_playthrough_models)

    for exp_issue in exp_issues.unresolved_issues:
        if 'state_names' in exp_issue.issue_customization_args:
            state_names = (
                exp_issue.issue_customization_args['state_names']['value'])
            # TODO(#15995): Currently, we are define all issue customization
            # args in one Dict type which forces us to use assert here, but
            # once we have a more narrower and specific type for a specific
            # issue customization args then we can remove assert from here.
            assert isinstance(state_names, list)

            if any(name in deleted_state_names for name in state_names):
                exp_issue.is_valid = False

            exp_issue.issue_customization_args['state_names']['value'] = [
                state_name if state_name not in old_to_new_state_names else
                old_to_new_state_names[state_name]
                for state_name in state_names
            ]

        if 'state_name' in exp_issue.issue_customization_args:
            state_name = (
                exp_issue.issue_customization_args['state_name']['value'])

            # TODO(#15995): Currently, we are define all issue customization
            # args in one Dict type which forces us to use assert here, but
            # once we have a more narrower and specific type for a specific
            # issue customization args then we can remove assert from here.
            assert isinstance(state_name, str)
            if state_name in deleted_state_names:
                exp_issue.is_valid = False

            exp_issue.issue_customization_args['state_name']['value'] = (
                state_name if state_name not in old_to_new_state_names else
                old_to_new_state_names[state_name])

    exp_issues.exp_version += 1
    create_exp_issues_model(exp_issues)


@overload
def get_exp_issues(
    exp_id: str, exp_version: int
) -> stats_domain.ExplorationIssues: ...


@overload
def get_exp_issues(
    exp_id: str, exp_version: int, *, strict: Literal[True]
) -> stats_domain.ExplorationIssues: ...


@overload
def get_exp_issues(
    exp_id: str, exp_version: int, *, strict: Literal[False]
) -> Optional[stats_domain.ExplorationIssues]: ...


@overload
def get_exp_issues(
    exp_id: str, exp_version: int, *, strict: bool = ...
) -> Optional[stats_domain.ExplorationIssues]: ...


def get_exp_issues(
    exp_id: str, exp_version: int, strict: bool = True
) -> Optional[stats_domain.ExplorationIssues]:
    """Retrieves the ExplorationIssues domain object.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        strict: bool. Fails noisily if the model doesn't exist.

    Returns:
        ExplorationIssues|None. The domain object for exploration issues or None
        if the exp_id is invalid.

    Raises:
        Exception. No ExplorationIssues model found for the given exp_id.
    """
    exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
        exp_id, exp_version)
    if exp_issues_model is None:
        if not strict:
            return None
        raise Exception(
            'No ExplorationIssues model found for the given exp_id: %s' %
            exp_id
        )

    return get_exp_issues_from_model(exp_issues_model)


def get_playthrough_by_id(
    playthrough_id: str
) -> Optional[stats_domain.Playthrough]:
    """Retrieves the Playthrough domain object.

    Args:
        playthrough_id: str. ID of the playthrough.

    Returns:
        Playthrough|None. The domain object for the playthrough or None if the
        playthrough_id is invalid.
    """
    playthrough_model = (
        stats_models.PlaythroughModel.get(playthrough_id, strict=False))
    if playthrough_model is None:
        return None

    return get_playthrough_from_model(playthrough_model)


def get_exploration_stats_by_id(
    exp_id: str, exp_version: int
) -> Optional[stats_domain.ExplorationStats]:
    """Retrieves the ExplorationStats domain object.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.

    Returns:
        ExplorationStats|None. The domain object for exploration statistics, or
        None if no ExplorationStatsModel exists for the given id.

    Raises:
        Exception. Entity for class ExplorationStatsModel with id not found.
    """
    exploration_stats = None
    exploration_stats_model = stats_models.ExplorationStatsModel.get_model(
        exp_id, exp_version)
    if exploration_stats_model is not None:
        exploration_stats = get_exploration_stats_from_model(
            exploration_stats_model)
    return exploration_stats


def get_multiple_exploration_stats_by_version(
    exp_id: str, version_numbers: List[int]
) -> List[Optional[stats_domain.ExplorationStats]]:
    """Returns a list of ExplorationStats domain objects corresponding to the
    specified versions.

    Args:
        exp_id: str. ID of the exploration.
        version_numbers: list(int). List of version numbers.

    Returns:
        list(ExplorationStats|None). List of ExplorationStats domain class
        instances.
    """
    exploration_stats = []
    exploration_stats_models = (
        stats_models.ExplorationStatsModel.get_multi_versions(
            exp_id, version_numbers))
    for exploration_stats_model in exploration_stats_models:
        exploration_stats.append(
            None if exploration_stats_model is None else
            get_exploration_stats_from_model(exploration_stats_model))
    return exploration_stats


def get_exp_issues_from_model(
    exp_issues_model: stats_models.ExplorationIssuesModel
) -> stats_domain.ExplorationIssues:
    """Gets an ExplorationIssues domain object from an ExplorationIssuesModel
    instance.

    Args:
        exp_issues_model: ExplorationIssuesModel. Exploration issues model in
            datastore.

    Returns:
        ExplorationIssues. The domain object for exploration issues.
    """
    unresolved_issues = []
    for unresolved_issue_dict in exp_issues_model.unresolved_issues:
        unresolved_issue_dict_copy = copy.deepcopy(unresolved_issue_dict)
        _migrate_to_latest_issue_schema(unresolved_issue_dict_copy)
        unresolved_issues.append(
            stats_domain.ExplorationIssue.from_dict(unresolved_issue_dict_copy))
    return stats_domain.ExplorationIssues(
        exp_issues_model.exp_id, exp_issues_model.exp_version,
        unresolved_issues)


def get_exploration_stats_from_model(
    exploration_stats_model: stats_models.ExplorationStatsModel
) -> stats_domain.ExplorationStats:
    """Gets an ExplorationStats domain object from an ExplorationStatsModel
    instance.

    Args:
        exploration_stats_model: ExplorationStatsModel. Exploration statistics
            model in datastore.

    Returns:
        ExplorationStats. The domain object for exploration statistics.
    """
    new_state_stats_mapping = {
        state_name: stats_domain.StateStats.from_dict(
            exploration_stats_model.state_stats_mapping[state_name])
        for state_name in exploration_stats_model.state_stats_mapping
    }
    return stats_domain.ExplorationStats(
        exploration_stats_model.exp_id,
        exploration_stats_model.exp_version,
        exploration_stats_model.num_starts_v1,
        exploration_stats_model.num_starts_v2,
        exploration_stats_model.num_actual_starts_v1,
        exploration_stats_model.num_actual_starts_v2,
        exploration_stats_model.num_completions_v1,
        exploration_stats_model.num_completions_v2,
        new_state_stats_mapping)


def get_playthrough_from_model(
    playthrough_model: stats_models.PlaythroughModel
) -> stats_domain.Playthrough:
    """Gets a PlaythroughModel domain object from a PlaythroughModel instance.

    Args:
        playthrough_model: PlaythroughModel. Playthrough model in datastore.

    Returns:
        Playthrough. The domain object for a playthrough.
    """
    actions = []
    for action_dict in playthrough_model.actions:
        _migrate_to_latest_action_schema(action_dict)
        actions.append(stats_domain.LearnerAction.from_dict(action_dict))
    return stats_domain.Playthrough(
        playthrough_model.exp_id, playthrough_model.exp_version,
        playthrough_model.issue_type,
        playthrough_model.issue_customization_args, actions)


def create_stats_model(exploration_stats: stats_domain.ExplorationStats) -> str:
    """Creates an ExplorationStatsModel in datastore given an ExplorationStats
    domain object.

    Args:
        exploration_stats: ExplorationStats. The domain object for exploration
            statistics.

    Returns:
        str. ID of the datastore instance for ExplorationStatsModel.
    """
    new_state_stats_mapping = {
        state_name: exploration_stats.state_stats_mapping[state_name].to_dict()
        for state_name in exploration_stats.state_stats_mapping
    }
    instance_id = stats_models.ExplorationStatsModel.create(
        exploration_stats.exp_id,
        exploration_stats.exp_version,
        exploration_stats.num_starts_v1,
        exploration_stats.num_starts_v2,
        exploration_stats.num_actual_starts_v1,
        exploration_stats.num_actual_starts_v2,
        exploration_stats.num_completions_v1,
        exploration_stats.num_completions_v2,
        new_state_stats_mapping
    )
    return instance_id


def save_stats_model(
    exploration_stats: stats_domain.ExplorationStats
) -> None:
    """Updates the ExplorationStatsModel datastore instance with the passed
    ExplorationStats domain object.

    Args:
        exploration_stats: ExplorationStats. The exploration statistics domain
            object.

    Raises:
        Exception. No exploration stats model exists for the given exp_id.
    """
    new_state_stats_mapping = {
        state_name: exploration_stats.state_stats_mapping[state_name].to_dict()
        for state_name in exploration_stats.state_stats_mapping
    }

    exploration_stats_model = stats_models.ExplorationStatsModel.get_model(
        exploration_stats.exp_id, exploration_stats.exp_version)

    if exploration_stats_model is None:
        raise Exception(
            'No exploration stats model exists for the given exp_id.'
        )

    exploration_stats_model.num_starts_v1 = exploration_stats.num_starts_v1
    exploration_stats_model.num_starts_v2 = exploration_stats.num_starts_v2
    exploration_stats_model.num_actual_starts_v1 = (
        exploration_stats.num_actual_starts_v1)
    exploration_stats_model.num_actual_starts_v2 = (
        exploration_stats.num_actual_starts_v2)
    exploration_stats_model.num_completions_v1 = (
        exploration_stats.num_completions_v1)
    exploration_stats_model.num_completions_v2 = (
        exploration_stats.num_completions_v2)
    exploration_stats_model.state_stats_mapping = new_state_stats_mapping

    exploration_stats_model.update_timestamps()
    exploration_stats_model.put()


def create_exp_issues_model(exp_issues: stats_domain.ExplorationIssues) -> None:
    """Creates a new ExplorationIssuesModel in the datastore.

    Args:
        exp_issues: ExplorationIssues. The exploration issues domain object.
    """
    unresolved_issues_dicts = [
        unresolved_issue.to_dict()
        for unresolved_issue in exp_issues.unresolved_issues]
    stats_models.ExplorationIssuesModel.create(
        exp_issues.exp_id, exp_issues.exp_version, unresolved_issues_dicts)


def save_exp_issues_model(exp_issues: stats_domain.ExplorationIssues) -> None:
    """Updates the ExplorationIssuesModel datastore instance with the passed
    ExplorationIssues domain object.

    Args:
        exp_issues: ExplorationIssues. The exploration issues domain object.
    """

    @transaction_services.run_in_transaction_wrapper
    def _save_exp_issues_model_transactional() -> None:
        """Implementation to be run in a transaction."""

        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            exp_issues.exp_id, exp_issues.exp_version)
        if exp_issues_model is None:
            raise Exception(
                'No ExplorationIssuesModel exists for the given exploration id.'
            )
        exp_issues_model.exp_version = exp_issues.exp_version
        exp_issues_model.unresolved_issues = [
            issue.to_dict() for issue in exp_issues.unresolved_issues]
        exp_issues_model.update_timestamps()
        exp_issues_model.put()

    # Run in transaction to help prevent data-races between concurrent learners
    # who may have a playthrough recorded at the same time.
    _save_exp_issues_model_transactional()


def get_exploration_stats_multi(
    exp_version_references: List[exp_domain.ExpVersionReference]
) -> List[stats_domain.ExplorationStats]:
    """Retrieves the exploration stats for the given explorations.

    Args:
        exp_version_references: list(ExpVersionReference). List of exploration
            version reference domain objects.

    Returns:
        list(ExplorationStats). The list of exploration stats domain objects.
    """
    exploration_stats_models = (
        stats_models.ExplorationStatsModel.get_multi_stats_models(
            exp_version_references))

    exploration_stats_list = []
    for index, exploration_stats_model in enumerate(exploration_stats_models):
        if exploration_stats_model is None:
            exploration_stats_list.append(
                stats_domain.ExplorationStats.create_default(
                    exp_version_references[index].exp_id,
                    exp_version_references[index].version,
                    {}))
        else:
            exploration_stats_list.append(
                get_exploration_stats_from_model(exploration_stats_model))

    return exploration_stats_list


def delete_playthroughs_multi(playthrough_ids: List[str]) -> None:
    """Deletes multiple playthrough instances.

    Args:
        playthrough_ids: list(str). List of playthrough IDs to be deleted.
    """

    @transaction_services.run_in_transaction_wrapper
    def _delete_playthroughs_multi_transactional() -> None:
        """Implementation to be run in a transaction."""
        playthrough_models = get_playthrough_models_by_ids(
            playthrough_ids, strict=True
        )
        filtered_playthrough_models = []
        for playthrough_model in playthrough_models:
            filtered_playthrough_models.append(playthrough_model)
        stats_models.PlaythroughModel.delete_multi(filtered_playthrough_models)

    # Run in transaction to help prevent data-races between concurrent
    # operations that may update the playthroughs being deleted.
    _delete_playthroughs_multi_transactional()


def record_answer(
    exploration_id: str,
    exploration_version: int,
    state_name: str,
    interaction_id: str,
    submitted_answer: stats_domain.SubmittedAnswer
) -> None:
    """Record an answer by storing it to the corresponding StateAnswers entity.

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration.
        state_name: str. The name of the state.
        interaction_id: str. The ID of the interaction.
        submitted_answer: SubmittedAnswer. The submitted answer.
    """
    record_answers(
        exploration_id, exploration_version, state_name, interaction_id,
        [submitted_answer])


def record_answers(
    exploration_id: str,
    exploration_version: int,
    state_name: str,
    interaction_id: str,
    submitted_answer_list: List[stats_domain.SubmittedAnswer]
) -> None:
    """Optimally record a group of answers using an already loaded exploration.
    The submitted_answer_list is a list of SubmittedAnswer domain objects.

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration.
        state_name: str. The name of the state.
        interaction_id: str. The ID of the interaction.
        submitted_answer_list: list(SubmittedAnswer). The list of answers to be
            recorded.
    """
    state_answers = stats_domain.StateAnswers(
        exploration_id, exploration_version, state_name, interaction_id,
        submitted_answer_list)
    for submitted_answer in submitted_answer_list:
        submitted_answer.validate()

    stats_models.StateAnswersModel.insert_submitted_answers(
        state_answers.exploration_id, state_answers.exploration_version,
        state_answers.state_name, state_answers.interaction_id,
        state_answers.get_submitted_answer_dict_list())


def get_state_answers(
    exploration_id: str,
    exploration_version: int,
    state_name: str
) -> Optional[stats_domain.StateAnswers]:
    """Returns a StateAnswers object containing all answers associated with the
    specified exploration state, or None if no such answers have yet been
    submitted.

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration to fetch
            answers for.
        state_name: str. The name of the state to fetch answers for.

    Returns:
        StateAnswers or None. A StateAnswers object containing all answers
        associated with the state, or None if no such answers exist.
    """
    state_answers_models = stats_models.StateAnswersModel.get_all_models(
        exploration_id, exploration_version, state_name)
    if state_answers_models:
        main_state_answers_model = state_answers_models[0]
        submitted_answer_dict_list = itertools.chain.from_iterable([
            state_answers_model.submitted_answer_list
            for state_answers_model in state_answers_models])
        return stats_domain.StateAnswers(
            exploration_id, exploration_version, state_name,
            main_state_answers_model.interaction_id,
            [stats_domain.SubmittedAnswer.from_dict(submitted_answer_dict)
             for submitted_answer_dict in submitted_answer_dict_list],
            schema_version=main_state_answers_model.schema_version)
    else:
        return None


def get_sample_answers(
    exploration_id: str,
    exploration_version: int,
    state_name: str
) -> List[state_domain.AcceptableCorrectAnswerTypes]:
    """Fetches a list of sample answers that were submitted to the specified
    exploration state (at the given version of the exploration).

    Args:
        exploration_id: str. The exploration ID.
        exploration_version: int. The version of the exploration to fetch
            answers for.
        state_name: str. The name of the state to fetch answers for.

    Returns:
        list(*). A list of some sample raw answers. At most 100 answers are
        returned.
    """
    answers_model = stats_models.StateAnswersModel.get_master_model(
        exploration_id, exploration_version, state_name)
    if answers_model is None:
        return []

    # Return at most 100 answers, and only answers from the initial shard (If we
    # needed to use subsequent shards then the answers are probably too big
    # anyway).
    sample_answers = answers_model.submitted_answer_list[:100]
    return [
        stats_domain.SubmittedAnswer.from_dict(submitted_answer_dict).answer
        for submitted_answer_dict in sample_answers]


def get_state_reference_for_exploration(exp_id: str, state_name: str) -> str:
    """Returns the generated state reference for the given exploration id and
    state name.

    Args:
        exp_id: str. ID of the exploration.
        state_name: str. Name of the state.

    Returns:
        str. The generated state reference.
    """
    exploration = exp_fetchers.get_exploration_by_id(exp_id)
    if not exploration.has_state_name(state_name):
        raise utils.InvalidInputException(
            'No state with the given state name was found in the '
            'exploration with id %s' % exp_id)
    return (
        stats_models.LearnerAnswerDetailsModel
        .get_state_reference_for_exploration(exp_id, state_name))


def get_state_reference_for_question(question_id: str) -> str:
    """Returns the generated state reference for the given question id.

    Args:
        question_id: str. ID of the question.

    Returns:
        str. The generated state reference.
    """
    question = question_services.get_question_by_id(
        question_id, strict=False)
    if question is None:
        raise utils.InvalidInputException(
            'No question with the given question id exists.')
    return (
        stats_models.LearnerAnswerDetailsModel
        .get_state_reference_for_question(question_id))


def get_learner_answer_details_from_model(
    learner_answer_details_model: stats_models.LearnerAnswerDetailsModel
) -> Optional[stats_domain.LearnerAnswerDetails]:
    """Returns a LearnerAnswerDetails domain object given a
    LearnerAnswerDetailsModel loaded from the datastore.

    Args:
        learner_answer_details_model: LearnerAnswerDetailsModel. The learner
            answer details model loaded from the datastore.

    Returns:
        LearnerAnswerDetails|None. A LearnerAnswerDetails domain object
        corresponding to the given model.
    """
    return stats_domain.LearnerAnswerDetails(
        learner_answer_details_model.state_reference,
        learner_answer_details_model.entity_type,
        learner_answer_details_model.interaction_id,
        [stats_domain.LearnerAnswerInfo.from_dict(learner_answer_info_dict)
         for learner_answer_info_dict
         in learner_answer_details_model.learner_answer_info_list],
        learner_answer_details_model.learner_answer_info_schema_version,
        learner_answer_details_model.accumulated_answer_info_json_size_bytes)


def get_learner_answer_details(
    entity_type: str, state_reference: str
) -> Optional[stats_domain.LearnerAnswerDetails]:
    """Returns a LearnerAnswerDetails domain object, with given entity_type and
    state_name. This function checks in the datastore if the corresponding
    LearnerAnswerDetailsModel exists, if not then None is returned.

    Args:
        entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION or
            ENTITY_TYPE_QUESTION, which are declared in feconf.py.
        state_reference: str. This is used to refer to a state in an exploration
            or question. For an exploration the value will be equal to
            'exp_id:state_name' and for question this will be equal to
            'question_id'.

    Returns:
        Optional[LearnerAnswerDetails]. The learner answer domain object or
        None if the model does not exist.
    """
    learner_answer_details_model = (
        stats_models.LearnerAnswerDetailsModel.get_model_instance(
            entity_type, state_reference))
    if learner_answer_details_model is not None:
        learner_answer_details = get_learner_answer_details_from_model(
            learner_answer_details_model)
        return learner_answer_details
    return None


def create_learner_answer_details_model_instance(
    learner_answer_details: stats_domain.LearnerAnswerDetails
) -> None:
    """Creates a new model instance from the given LearnerAnswerDetails domain
    object.

    Args:
        learner_answer_details: LearnerAnswerDetails. The learner answer details
            domain object.
    """
    stats_models.LearnerAnswerDetailsModel.create_model_instance(
        learner_answer_details.entity_type,
        learner_answer_details.state_reference,
        learner_answer_details.interaction_id,
        learner_answer_details.learner_answer_info_list,
        learner_answer_details.learner_answer_info_schema_version,
        learner_answer_details.accumulated_answer_info_json_size_bytes)


def save_learner_answer_details(
    entity_type: str,
    state_reference: str,
    learner_answer_details: stats_domain.LearnerAnswerDetails
) -> None:
    """Saves the LearnerAnswerDetails domain object in the datatstore, if the
    model instance with the given entity_type and state_reference is found and
    if the instance id of the model doesn't matches with the generated instance
    id, then the earlier model is deleted and a new model instance is created.

    Args:
        entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION or
            ENTITY_TYPE_QUESTION, which are declared in feconf.py.
        state_reference: str. This is used to refer to a state in an exploration
            or question. For an exploration the value will be equal to
            'exp_id:state_name' and for question this will be equal to
            'question_id'.
        learner_answer_details: LearnerAnswerDetails. The learner answer details
            domain object which is to be saved.
    """
    learner_answer_details.validate()
    learner_answer_details_model = (
        stats_models.LearnerAnswerDetailsModel.get_model_instance(
            entity_type, state_reference))
    if learner_answer_details_model is not None:
        instance_id = stats_models.LearnerAnswerDetailsModel.get_instance_id(
            learner_answer_details.entity_type,
            learner_answer_details.state_reference)
        if learner_answer_details_model.id == instance_id:
            learner_answer_details_model.learner_answer_info_list = (
                [learner_answer_info.to_dict() for learner_answer_info
                 in learner_answer_details.learner_answer_info_list])
            learner_answer_details_model.learner_answer_info_schema_version = (
                learner_answer_details.learner_answer_info_schema_version)
            learner_answer_details_model.accumulated_answer_info_json_size_bytes = ( # pylint: disable=line-too-long
                learner_answer_details.accumulated_answer_info_json_size_bytes)
            learner_answer_details_model.update_timestamps()
            learner_answer_details_model.put()
        else:
            learner_answer_details_model.delete()
            create_learner_answer_details_model_instance(learner_answer_details)
    else:
        create_learner_answer_details_model_instance(learner_answer_details)


def record_learner_answer_info(
    entity_type: str,
    state_reference: str,
    interaction_id: str,
    answer: str,
    answer_details: str
) -> None:
    """Records the new learner answer info received from the learner in the
    model and then saves it.

    Args:
        entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION or
            ENTITY_TYPE_QUESTION, which are declared in feconf.py.
        state_reference: str. This is used to refer to a state in an exploration
            or question. For an exploration the value will be equal to
            'exp_id:state_name' and for question this will be equal to
            'question_id'.
        interaction_id: str. The ID of the interaction.
        answer: *(json-like). The answer which is submitted by the learner. The
            actual type of answer depends on the interaction.
        answer_details: str. The details the learner will submit when the
            learner will be asked questions like 'Hey how did you land on this
            answer', 'Why did you pick that answer' etc.
    """
    learner_answer_details = get_learner_answer_details(
        entity_type, state_reference)
    if learner_answer_details is None:
        learner_answer_details = stats_domain.LearnerAnswerDetails(
            state_reference, entity_type, interaction_id, [], 0)
    learner_answer_info_id = (
        stats_domain.LearnerAnswerInfo.get_new_learner_answer_info_id())
    learner_answer_info = stats_domain.LearnerAnswerInfo(
        learner_answer_info_id, answer, answer_details,
        datetime.datetime.utcnow())
    learner_answer_details.add_learner_answer_info(learner_answer_info)
    save_learner_answer_details(
        entity_type, state_reference, learner_answer_details)


def delete_learner_answer_info(
    entity_type: str,
    state_reference: str,
    learner_answer_info_id: str
) -> None:
    """Deletes the learner answer info in the model, and then saves it.

    Args:
        entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION or
            ENTITY_TYPE_QUESTION, which are declared in feconf.py.
        state_reference: str. This is used to refer to a state in an exploration
            or question. For an exploration the value will be equal to
            'exp_id:state_name' and for question this will be equal to
            'question_id'.
        learner_answer_info_id: str. The unique ID of the learner answer info
            which needs to be deleted.
    """
    learner_answer_details = get_learner_answer_details(
        entity_type, state_reference)
    if learner_answer_details is None:
        raise utils.InvalidInputException(
            'No learner answer details found with the given state '
            'reference and entity')
    learner_answer_details.delete_learner_answer_info(
        learner_answer_info_id)
    save_learner_answer_details(
        entity_type, state_reference, learner_answer_details)


def update_state_reference(
    entity_type: str,
    old_state_reference: str,
    new_state_reference: str
) -> None:
    """Updates the state_reference field of the LearnerAnswerDetails model
    instance with the new_state_reference received and then saves the instance
    in the datastore.

    Args:
        entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION or
            ENTITY_TYPE_QUESTION, which are declared in feconf.py.
        old_state_reference: str. The old state reference which needs to be
            changed.
        new_state_reference: str. The new state reference which needs to be
            updated.
    """
    learner_answer_details = get_learner_answer_details(
        entity_type, old_state_reference)
    if learner_answer_details is None:
        raise utils.InvalidInputException(
            'No learner answer details found with the given state '
            'reference and entity')
    learner_answer_details.update_state_reference(new_state_reference)
    save_learner_answer_details(
        entity_type, old_state_reference, learner_answer_details)


def delete_learner_answer_details_for_exploration_state(
    exp_id: str, state_name: str
) -> None:
    """Deletes the LearnerAnswerDetailsModel corresponding to the given
    exploration ID and state name.

    Args:
        exp_id: str. The ID of the exploration.
        state_name: str. The name of the state.
    """
    state_reference = (
        stats_models.LearnerAnswerDetailsModel.
        get_state_reference_for_exploration(
            exp_id, state_name))
    learner_answer_details_model = (
        stats_models.LearnerAnswerDetailsModel.get_model_instance(
            feconf.ENTITY_TYPE_EXPLORATION, state_reference))
    if learner_answer_details_model is not None:
        learner_answer_details_model.delete()


def delete_learner_answer_details_for_question_state(
    question_id: str
) -> None:
    """Deletes the LearnerAnswerDetailsModel for the given question ID.

    Args:
        question_id: str. The ID of the question.
    """
    state_reference = (
        stats_models.LearnerAnswerDetailsModel.get_state_reference_for_question(
            question_id))
    learner_answer_details_model = (
        stats_models.LearnerAnswerDetailsModel.get_model_instance(
            feconf.ENTITY_TYPE_QUESTION, state_reference))
    if learner_answer_details_model is not None:
        learner_answer_details_model.delete()
