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

from __future__ import annotations

import collections
import datetime
import io
import logging
import math
import os
import pprint
import zipfile

from core import android_validation_constants
from core import feconf
from core import utils
from core.constants import constants
from core.domain import activity_services
from core.domain import caching_services
from core.domain import change_domain
from core.domain import classifier_services
from core.domain import draft_upgrade_services
from core.domain import email_manager
from core.domain import email_subscription_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import feedback_services
from core.domain import fs_services
from core.domain import html_cleaner
from core.domain import html_validation_service
from core.domain import opportunity_services
from core.domain import param_domain
from core.domain import recommendations_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import search_services
from core.domain import state_domain
from core.domain import stats_services
from core.domain import taskqueue_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models

import deepdiff
from typing import (
    Dict, Final, List, Optional, Sequence, Tuple, Type, TypedDict, Union, cast)

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import user_models

(base_models, exp_models, user_models) = (
    models.Registry.import_models([
        models.Names.BASE_MODEL,
        models.Names.EXPLORATION,
        models.Names.USER
    ])
)

datastore_services = models.Registry.import_datastore_services()

AcceptableActivityModelTypes = Union[
    user_models.CompletedActivitiesModel,
    user_models.IncompleteActivitiesModel
]


class UserExplorationDataDict(TypedDict):
    """Dictionary representing the user's specific exploration data."""

    exploration_id: str
    title: str
    category: str
    objective: str
    language_code: str
    tags: List[str]
    init_state_name: str
    states: Dict[str, state_domain.StateDict]
    param_specs: Dict[str, param_domain.ParamSpecDict]
    param_changes: List[param_domain.ParamChangeDict]
    version: int
    auto_tts_enabled: bool
    correctness_feedback_enabled: bool
    edits_allowed: bool
    draft_change_list_id: int
    rights: rights_domain.ActivityRightsDict
    show_state_editor_tutorial_on_load: bool
    show_state_translation_tutorial_on_load: bool
    is_version_of_draft_valid: Optional[bool]
    draft_changes: Dict[str, str]
    email_preferences: user_domain.UserExplorationPrefsDict


class SnapshotsMetadataDict(TypedDict):
    """Dictionary representing the snapshot metadata for exploration model."""

    committer_id: str
    commit_message: str
    commit_cmds: List[Dict[str, change_domain.AcceptableChangeDictTypes]]
    commit_type: str
    version_number: int
    created_on_ms: float


# Name for the exploration search index.
SEARCH_INDEX_EXPLORATIONS: Final = 'explorations'

# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS: Final = 10

# NOTE TO DEVELOPERS: The get_story_ids_linked_to_explorations function was
# removed in #13021 as part of the migration to Apache Beam. Please refer to
# that PR if you need to reinstate it.


def is_exp_summary_editable(
    exp_summary: exp_domain.ExplorationSummary, user_id: str
) -> bool:
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
def get_exploration_titles_and_categories(
    exp_ids: List[str]
) -> Dict[str, Dict[str, str]]:
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
        for e in exp_models.ExplorationModel.get_multi(
            exp_ids, include_deleted=True)]

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


def get_exploration_ids_matching_query(
    query_string: str,
    categories: List[str],
    language_codes: List[str],
    offset: Optional[int] = None
) -> Tuple[List[str], Optional[int]]:
    """Returns a list with all exploration ids matching the given search query
    string, as well as a search offset for future fetches.

    This method returns exactly feconf.SEARCH_RESULTS_PAGE_SIZE results if
    there are at least that many, otherwise it returns all remaining results.
    (If this behaviour does not occur, an error will be logged.) The method
    also returns a search offset.

    Args:
        query_string: str. A search query string.
        categories: list(str). The list of categories to query for. If it is
            empty, no category filter is applied to the results. If it is not
            empty, then a result is considered valid if it matches at least one
            of these categories.
        language_codes: list(str). The list of language codes to query for. If
            it is empty, no language code filter is applied to the results. If
            it is not empty, then a result is considered valid if it matches at
            least one of these language codes.
        offset: int or None. Optional offset from which to start the search
            query. If no offset is supplied, the first N results matching
            the query are returned.

    Returns:
        2-tuple of (returned_exploration_ids, search_offset). Where:
            returned_exploration_ids : list(str). A list with all
                exploration ids matching the given search query string,
                as well as a search offset for future fetches.
                The list contains exactly feconf.SEARCH_RESULTS_PAGE_SIZE
                results if there are at least that many, otherwise it
                contains all remaining results. (If this behaviour does
                not occur, an error will be logged.)
            search_offset: int. Search offset for future fetches.
    """
    returned_exploration_ids: List[str] = []
    search_offset = offset

    for _ in range(MAX_ITERATIONS):
        remaining_to_fetch = feconf.SEARCH_RESULTS_PAGE_SIZE - len(
            returned_exploration_ids)

        exp_ids, search_offset = search_services.search_explorations(
            query_string, categories, language_codes, remaining_to_fetch,
            offset=search_offset)

        invalid_exp_ids = []
        for ind, model in enumerate(
                exp_models.ExpSummaryModel.get_multi(exp_ids)):
            if model is not None:
                returned_exploration_ids.append(exp_ids[ind])
            else:
                invalid_exp_ids.append(exp_ids[ind])

        if (len(returned_exploration_ids) == feconf.SEARCH_RESULTS_PAGE_SIZE
                or search_offset is None):
            break

        logging.error(
                'Search index contains stale exploration ids: %s' %
                ', '.join(invalid_exp_ids))

    if (len(returned_exploration_ids) < feconf.SEARCH_RESULTS_PAGE_SIZE
            and search_offset is not None):
        logging.error(
            'Could not fulfill search request for query string %s; at least '
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))

    return (returned_exploration_ids, search_offset)


def get_non_private_exploration_summaries(
) -> Dict[str, exp_domain.ExplorationSummary]:
    """Returns a dict with all non-private exploration summary domain objects,
    keyed by their id.

    Returns:
        dict. The keys are exploration ids and the values are corresponding
        non-private ExplorationSummary domain objects.
    """
    return exp_fetchers.get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_non_private())


def get_top_rated_exploration_summaries(
    limit: int
) -> Dict[str, exp_domain.ExplorationSummary]:
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


def get_recently_published_exp_summaries(
    limit: int
) -> Dict[str, exp_domain.ExplorationSummary]:
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


def get_story_id_linked_to_exploration(exp_id: str) -> Optional[str]:
    """Returns the ID of the story that the exploration is a part of, or None if
    the exploration is not part of a story.

    Args:
        exp_id: str. The ID of the exploration.

    Returns:
        str|None. The ID of the story if the exploration is linked to some
        story, otherwise None.
    """
    exploration_context_model = exp_models.ExplorationContextModel.get(
        exp_id, strict=False)
    if exploration_context_model is None:
        return None

    # TODO(#15621): The explicit declaration of type for ndb properties
    # should be removed. Currently, these ndb properties are annotated with
    # Any return type. Once we have proper return type we can remove this.
    story_id: str = exploration_context_model.story_id
    return story_id


def get_all_exploration_summaries() -> Dict[str, exp_domain.ExplorationSummary]:
    """Returns a dict with all exploration summary domain objects,
    keyed by their id.

    Returns:
        dict. A dict with all ExplorationSummary domain objects keyed by their
        exploration id.
    """
    return exp_fetchers.get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_all().fetch())


# Methods for exporting states and explorations to other formats.
def export_to_zip_file(
    exploration_id: str, version: Optional[int] = None
) -> io.BytesIO:
    """Returns a ZIP archive of the exploration.

    Args:
        exploration_id: str. The id of the exploration to export.
        version: int or None. If provided, this indicates which version of
            the exploration to export. Otherwise, the latest version of the
            exploration is exported.

    Returns:
        BytesIO. The contents of the ZIP archive of the exploration
        (which can be subsequently converted into a zip file via
        zipfile.ZipFile()).
    """
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=version)
    yaml_repr = exploration.to_yaml()

    temp_file = io.BytesIO()
    with zipfile.ZipFile(
            temp_file, mode='w', compression=zipfile.ZIP_DEFLATED) as zfile:
        if not exploration.title:
            zfile.writestr('Unpublished_exploration.yaml', yaml_repr)
        else:
            zfile.writestr('%s.yaml' % exploration.title, yaml_repr)

        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id)
        html_string_list = exploration.get_all_html_content_strings()
        image_filenames = (
            html_cleaner.get_image_filenames_from_html_strings(
                html_string_list))

        for filename in image_filenames:
            filepath = 'image/%s' % filename
            file_contents = fs.get(filepath)
            str_filepath = 'assets/%s' % filepath
            logging.error(str_filepath)
            zfile.writestr(str_filepath, file_contents)

    return temp_file


def export_states_to_yaml(
    exploration_id: str, version: Optional[int] = None, width: int = 80
) -> Dict[str, str]:
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
        exploration_dict[state] = utils.yaml_from_dict(
            exploration.states[state].to_dict(),
            width=width
        )
    return exploration_dict


# Repository SAVE and DELETE methods.
def apply_change_list(
    exploration_id: str, change_list: List[exp_domain.ExplorationChange]
) -> exp_domain.Exploration:
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
        Exception. Any entries in the changelist are invalid.
        Exception. Solution cannot exist with None interaction id.
    """
    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    try:
        to_param_domain = param_domain.ParamChange.from_dict
        for change in change_list:
            if change.cmd == exp_domain.CMD_ADD_STATE:
                # Here we use cast because we are narrowing down the type from
                # ExplorationChange to a specific change command.
                add_state_cmd = cast(
                    exp_domain.AddExplorationStateCmd,
                    change
                )
                exploration.add_states([add_state_cmd.state_name])
            elif change.cmd == exp_domain.CMD_RENAME_STATE:
                # Here we use cast because we are narrowing down the type from
                # ExplorationChange to a specific change command.
                rename_state_cmd = cast(
                    exp_domain.RenameExplorationStateCmd,
                    change
                )
                exploration.rename_state(
                    rename_state_cmd.old_state_name,
                    rename_state_cmd.new_state_name
                )
            elif change.cmd == exp_domain.CMD_DELETE_STATE:
                # Here we use cast because we are narrowing down the type from
                # ExplorationChange to a specific change command.
                delete_state_cmd = cast(
                    exp_domain.DeleteExplorationStateCmd,
                    change
                )
                exploration.delete_state(delete_state_cmd.state_name)
            elif change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                state: state_domain.State = exploration.states[
                    change.state_name]
                if (change.property_name ==
                        exp_domain.STATE_PROPERTY_PARAM_CHANGES):
                    # Here we use cast because this 'if' condition forces
                    # change to have type EditExpStatePropertyParamChangesCmd.
                    edit_param_changes_cmd = cast(
                        exp_domain.EditExpStatePropertyParamChangesCmd,
                        change
                    )
                    state.update_param_changes(list(map(
                        to_param_domain, edit_param_changes_cmd.new_value
                    )))
                elif change.property_name == exp_domain.STATE_PROPERTY_CONTENT:
                    # Here we use cast because this 'elif' condition forces
                    # change to have type EditExpStatePropertyContentCmd.
                    edit_content_cmd = cast(
                        exp_domain.EditExpStatePropertyContentCmd,
                        change
                    )
                    content = (
                        state_domain.SubtitledHtml.from_dict(
                            edit_content_cmd.new_value
                        )
                    )
                    content.validate()
                    state.update_content(content)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_ID):
                    state.update_interaction_id(change.new_value)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_NEXT_CONTENT_ID_INDEX):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyNextContentIdIndexCmd.
                    edit_next_content_id_index_cmd = cast(
                        exp_domain.EditExpStatePropertyNextContentIdIndexCmd,
                        change
                    )
                    next_content_id_index = max(
                        edit_next_content_id_index_cmd.new_value,
                        state.next_content_id_index
                    )
                    state.update_next_content_id_index(next_content_id_index)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_LINKED_SKILL_ID):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyLinkedSkillIdCmd.
                    edit_linked_skill_id_cmd = cast(
                        exp_domain.EditExpStatePropertyLinkedSkillIdCmd,
                        change
                    )
                    state.update_linked_skill_id(
                        edit_linked_skill_id_cmd.new_value
                    )
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyInteractionCustArgsCmd.
                    edit_interaction_cust_arg_cmd = cast(
                        exp_domain.EditExpStatePropertyInteractionCustArgsCmd,
                        change
                    )
                    state.update_interaction_customization_args(
                        edit_interaction_cust_arg_cmd.new_value)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_HANDLERS):
                    raise utils.InvalidInputException(
                        'Editing interaction handlers is no longer supported')
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyInteractionAnswerGroupsCmd.
                    edit_interaction_answer_group_cmd = cast(
                        exp_domain.EditExpStatePropertyInteractionAnswerGroupsCmd,  # pylint: disable=line-too-long
                        change
                    )
                    answer_groups = (
                        edit_interaction_answer_group_cmd.new_value
                    )
                    new_answer_groups = [
                        state_domain.AnswerGroup.from_dict(answer_group)
                        for answer_group in answer_groups
                    ]
                    state.update_interaction_answer_groups(new_answer_groups)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME):
                    new_outcome = None
                    if change.new_value:
                        # Here we use cast because this 'elif'
                        # condition forces change to have type
                        # EditExpStatePropertyInteractionDefaultOutcomeCmd.
                        edit_interaction_default_outcome_cmd = cast(
                            exp_domain.EditExpStatePropertyInteractionDefaultOutcomeCmd,  # pylint: disable=line-too-long
                            change
                        )
                        new_outcome = state_domain.Outcome.from_dict(
                            edit_interaction_default_outcome_cmd.new_value
                        )
                    state.update_interaction_default_outcome(new_outcome)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyUnclassifiedAnswersCmd.
                    edit_unclassified_answers_cmd = cast(
                        exp_domain.EditExpStatePropertyUnclassifiedAnswersCmd,
                        change
                    )
                    state.update_interaction_confirmed_unclassified_answers(
                        edit_unclassified_answers_cmd.new_value)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_HINTS):
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyInteractionHintsCmd.
                    edit_state_interaction_hints_cmd = cast(
                        exp_domain.EditExpStatePropertyInteractionHintsCmd,
                        change
                    )
                    hint_dicts = (
                        edit_state_interaction_hints_cmd.new_value
                    )
                    if not isinstance(hint_dicts, list):
                        raise Exception(
                            'Expected hints_list to be a list,'
                            ' received %s' % hint_dicts)
                    new_hints_list = [
                        state_domain.Hint.from_dict(hint_dict)
                        for hint_dict in hint_dicts
                    ]
                    state.update_interaction_hints(new_hints_list)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION):
                    new_solution = None
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyInteractionSolutionCmd.
                    edit_interaction_solution_cmd = cast(
                        exp_domain.EditExpStatePropertyInteractionSolutionCmd,
                        change
                    )
                    if edit_interaction_solution_cmd.new_value is not None:
                        if state.interaction.id is None:
                            raise Exception(
                                'solution cannot exist with None '
                                'interaction id.'
                            )
                        new_solution = state_domain.Solution.from_dict(
                            state.interaction.id,
                            edit_interaction_solution_cmd.new_value
                        )
                    state.update_interaction_solution(new_solution)
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS):
                    if not isinstance(change.new_value, bool):
                        raise Exception(
                            'Expected solicit_answer_details to be a ' +
                            'bool, received %s' % change.new_value)
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertySolicitAnswerDetailsCmd.
                    edit_solicit_answer_details_cmd = cast(
                        exp_domain.EditExpStatePropertySolicitAnswerDetailsCmd,
                        change
                    )
                    state.update_solicit_answer_details(
                        edit_solicit_answer_details_cmd.new_value
                    )
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT):
                    if not isinstance(change.new_value, bool):
                        raise Exception(
                            'Expected card_is_checkpoint to be a ' +
                            'bool, received %s' % change.new_value)
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyCardIsCheckpointCmd.
                    edit_card_is_checkpoint_cmd = cast(
                        exp_domain.EditExpStatePropertyCardIsCheckpointCmd,
                        change
                    )
                    state.update_card_is_checkpoint(
                        edit_card_is_checkpoint_cmd.new_value
                    )
                elif (change.property_name ==
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
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyRecordedVoiceoversCmd.
                    edit_recorded_voiceovers_cmd = cast(
                        exp_domain.EditExpStatePropertyRecordedVoiceoversCmd,
                        change
                    )
                    new_voiceovers_mapping = (
                        edit_recorded_voiceovers_cmd.new_value[
                            'voiceovers_mapping'
                        ]
                    )
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
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_WRITTEN_TRANSLATIONS):
                    if not isinstance(change.new_value, dict):
                        raise Exception(
                            'Expected written_translations to be a dict, '
                            'received %s' % change.new_value)
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExpStatePropertyWrittenTranslationsCmd.
                    edit_written_translations_cmd = cast(
                        exp_domain.EditExpStatePropertyWrittenTranslationsCmd,
                        change
                    )
                    cleaned_written_translations_dict = (
                        state_domain.WrittenTranslations
                        .convert_html_in_written_translations(
                            edit_written_translations_cmd.new_value,
                            html_cleaner.clean
                        )
                    )
                    written_translations = (
                        state_domain.WrittenTranslations.from_dict(
                            cleaned_written_translations_dict))
                    state.update_written_translations(written_translations)
            elif change.cmd == exp_domain.DEPRECATED_CMD_ADD_TRANSLATION:
                # DEPRECATED: This command is deprecated. Please do not use.
                # The command remains here to support old suggestions.
                exploration.states[change.state_name].add_translation(
                    change.content_id, change.language_code,
                    change.translation_html)
            elif change.cmd == exp_domain.CMD_ADD_WRITTEN_TRANSLATION:
                # Here we use cast because we are narrowing down the type from
                # ExplorationChange to a specific change command.
                add_written_translation_cmd = cast(
                    exp_domain.AddWrittenTranslationCmd,
                    change
                )
                exploration.states[
                    add_written_translation_cmd.state_name
                ].add_written_translation(
                    add_written_translation_cmd.content_id,
                    add_written_translation_cmd.language_code,
                    add_written_translation_cmd.translation_html,
                    add_written_translation_cmd.data_format
                )
            elif (change.cmd ==
                  exp_domain.CMD_MARK_WRITTEN_TRANSLATION_AS_NEEDING_UPDATE):
                # Here we use cast because we are narrowing down the type from
                # ExplorationChange to a specific change command.
                written_translation_as_needing_update_cmd = cast(
                    exp_domain.MarkWrittenTranslationAsNeedingUpdateCmd,
                    change
                )
                exploration.states[
                    written_translation_as_needing_update_cmd.state_name
                ].mark_written_translation_as_needing_update(
                    written_translation_as_needing_update_cmd.content_id,
                    written_translation_as_needing_update_cmd.language_code
                )
            elif (change.cmd ==
                  exp_domain.CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE):
                # Here we use cast because we are narrowing down the type from
                # ExplorationChange to a specific change command.
                written_translations_as_needing_update_cmd = cast(
                    exp_domain.MarkWrittenTranslationsAsNeedingUpdateCmd,
                    change
                )
                exploration.states[
                    written_translations_as_needing_update_cmd.state_name
                ].mark_written_translations_as_needing_update(
                    written_translations_as_needing_update_cmd.content_id
                )
            elif change.cmd == exp_domain.CMD_EDIT_EXPLORATION_PROPERTY:
                if change.property_name == 'title':
                    # Here we use cast because this 'if' condition forces
                    # change to have type EditExplorationPropertyTitleCmd.
                    edit_title_cmd = cast(
                        exp_domain.EditExplorationPropertyTitleCmd,
                        change
                    )
                    exploration.update_title(edit_title_cmd.new_value)
                elif change.property_name == 'category':
                    # Here we use cast because this 'elif' condition forces
                    # change to have type EditExplorationPropertyCategoryCmd.
                    edit_category_cmd = cast(
                        exp_domain.EditExplorationPropertyCategoryCmd,
                        change
                    )
                    exploration.update_category(edit_category_cmd.new_value)
                elif change.property_name == 'objective':
                    # Here we use cast because this 'elif' condition forces
                    # change to have type EditExplorationPropertyObjectiveCmd.
                    edit_objective_cmd = cast(
                        exp_domain.EditExplorationPropertyObjectiveCmd,
                        change
                    )
                    exploration.update_objective(edit_objective_cmd.new_value)
                elif change.property_name == 'language_code':
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExplorationPropertyLanguageCodeCmd.
                    edit_language_code_cmd = cast(
                        exp_domain.EditExplorationPropertyLanguageCodeCmd,
                        change
                    )
                    exploration.update_language_code(
                        edit_language_code_cmd.new_value
                    )
                elif change.property_name == 'tags':
                    # Here we use cast because this 'elif' condition forces
                    # change to have type EditExplorationPropertyTagsCmd.
                    edit_tags_cmd = cast(
                        exp_domain.EditExplorationPropertyTagsCmd,
                        change
                    )
                    exploration.update_tags(edit_tags_cmd.new_value)
                elif change.property_name == 'blurb':
                    # Here we use cast because this 'elif' condition forces
                    # change to have type EditExplorationPropertyBlurbCmd.
                    edit_blurb_cmd = cast(
                        exp_domain.EditExplorationPropertyBlurbCmd,
                        change
                    )
                    exploration.update_blurb(edit_blurb_cmd.new_value)
                elif change.property_name == 'author_notes':
                    # Here we use cast because this 'elif' condition forces
                    # change to have type EditExplorationPropertyAuthorNotesCmd.
                    edit_author_notes_cmd = cast(
                        exp_domain.EditExplorationPropertyAuthorNotesCmd,
                        change
                    )
                    exploration.update_author_notes(
                        edit_author_notes_cmd.new_value
                    )
                elif change.property_name == 'param_specs':
                    # Here we use cast because this 'elif' condition forces
                    # change to have type EditExplorationPropertyParamSpecsCmd.
                    edit_param_specs_cmd = cast(
                        exp_domain.EditExplorationPropertyParamSpecsCmd,
                        change
                    )
                    exploration.update_param_specs(
                        edit_param_specs_cmd.new_value
                    )
                elif change.property_name == 'param_changes':
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExplorationPropertyParamChangesCmd.
                    edit_exp_param_changes_cmd = cast(
                        exp_domain.EditExplorationPropertyParamChangesCmd,
                        change
                    )
                    exploration.update_param_changes(
                        list(
                            map(
                                to_param_domain,
                                edit_exp_param_changes_cmd.new_value
                            )
                        )
                    )
                elif change.property_name == 'init_state_name':
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExplorationPropertyInitStateNameCmd.
                    edit_init_state_name_cmd = cast(
                        exp_domain.EditExplorationPropertyInitStateNameCmd,
                        change
                    )
                    exploration.update_init_state_name(
                        edit_init_state_name_cmd.new_value
                    )
                elif change.property_name == 'auto_tts_enabled':
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExplorationPropertyAutoTtsEnabledCmd.
                    edit_auto_tts_enabled_cmd = cast(
                        exp_domain.EditExplorationPropertyAutoTtsEnabledCmd,
                        change
                    )
                    exploration.update_auto_tts_enabled(
                        edit_auto_tts_enabled_cmd.new_value
                    )
                elif change.property_name == 'correctness_feedback_enabled':
                    # Here we use cast because this 'elif'
                    # condition forces change to have type
                    # EditExplorationPropertyCorrectnessFeedbackEnabledCmd.
                    edit_correctness_feedback_enabled_cmd = cast(
                        exp_domain.EditExplorationPropertyCorrectnessFeedbackEnabledCmd,  # pylint: disable=line-too-long
                        change
                    )
                    exploration.update_correctness_feedback_enabled(
                        edit_correctness_feedback_enabled_cmd.new_value
                    )
            elif (change.cmd ==
                  exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
                # Loading the exploration model from the datastore into an
                # Exploration domain object automatically converts it to use
                # the latest states schema version. As a result, simply
                # resaving the exploration is sufficient to apply the states
                # schema update. Thus, no action is needed here other than
                # to make sure that the version that the user is trying to
                # migrate to is the latest version.
                # Here we use cast because we are narrowing down the type from
                # ExplorationChange to a specific change command.
                migrate_states_schema_cmd = cast(
                    exp_domain.MigrateStatesSchemaToLatestVersionCmd,
                    change
                )
                target_version_is_current_state_schema_version = (
                    migrate_states_schema_cmd.to_version ==
                    str(feconf.CURRENT_STATE_SCHEMA_VERSION)
                )
                if not target_version_is_current_state_schema_version:
                    raise Exception(
                        'Expected to migrate to the latest state schema '
                        'version %s, received %s' % (
                            feconf.CURRENT_STATE_SCHEMA_VERSION,
                            migrate_states_schema_cmd.to_version))
        return exploration

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, exploration_id,
                pprint.pformat(change_list))
        )
        raise e


def populate_exp_model_fields(
    exp_model: exp_models.ExplorationModel, exploration: exp_domain.Exploration
) -> exp_models.ExplorationModel:
    """Populate exploration model with the data from Exploration object.

    Args:
        exp_model: ExplorationModel. The model to populate.
        exploration: Exploration. The exploration domain object which should be
            used to populate the model.

    Returns:
        ExplorationModel. Populated model.
    """
    exp_model.title = exploration.title
    exp_model.category = exploration.category
    exp_model.objective = exploration.objective
    exp_model.language_code = exploration.language_code
    exp_model.tags = exploration.tags
    exp_model.blurb = exploration.blurb
    exp_model.author_notes = exploration.author_notes
    exp_model.states_schema_version = exploration.states_schema_version
    exp_model.init_state_name = exploration.init_state_name
    exp_model.states = {
        state_name: state.to_dict()
        for (state_name, state) in exploration.states.items()}
    exp_model.param_specs = exploration.param_specs_dict
    exp_model.param_changes = exploration.param_change_dicts
    exp_model.auto_tts_enabled = exploration.auto_tts_enabled
    exp_model.correctness_feedback_enabled = (
        exploration.correctness_feedback_enabled)
    exp_model.edits_allowed = exploration.edits_allowed

    return exp_model


def populate_exp_summary_model_fields(
    exp_summary_model: Optional[exp_models.ExpSummaryModel],
    exp_summary: exp_domain.ExplorationSummary
) -> exp_models.ExpSummaryModel:
    """Populate exploration summary model with the data from
    ExplorationSummary object.

    Args:
        exp_summary_model: ExpSummaryModel|None. The model to populate.
            If None, we create a new model instead.
        exp_summary: ExplorationSummary. The exploration domain object which
            should be used to populate the model.

    Returns:
        ExpSummaryModel. Populated model.
    """
    exp_summary_dict = {
        'title': exp_summary.title,
        'category': exp_summary.category,
        'objective': exp_summary.objective,
        'language_code': exp_summary.language_code,
        'tags': exp_summary.tags,
        'ratings': exp_summary.ratings,
        'scaled_average_rating': exp_summary.scaled_average_rating,
        'exploration_model_last_updated': (
            exp_summary.exploration_model_last_updated),
        'exploration_model_created_on': (
            exp_summary.exploration_model_created_on),
        'first_published_msec': exp_summary.first_published_msec,
        'status': exp_summary.status,
        'community_owned': exp_summary.community_owned,
        'owner_ids': exp_summary.owner_ids,
        'editor_ids': exp_summary.editor_ids,
        'voice_artist_ids': exp_summary.voice_artist_ids,
        'viewer_ids': exp_summary.viewer_ids,
        'contributor_ids': list(exp_summary.contributors_summary.keys()),
        'contributors_summary': exp_summary.contributors_summary,
        'version': exp_summary.version
    }
    if exp_summary_model is not None:
        exp_summary_model.populate(**exp_summary_dict)
    else:
        exp_summary_dict['id'] = exp_summary.id
        exp_summary_model = exp_models.ExpSummaryModel(**exp_summary_dict)

    return exp_summary_model


def update_states_version_history(
    states_version_history: Dict[str, state_domain.StateVersionHistory],
    change_list: List[exp_domain.ExplorationChange],
    old_states_dict: Dict[str, state_domain.StateDict],
    new_states_dict: Dict[str, state_domain.StateDict],
    current_version: int,
    committer_id: str
) -> Dict[str, state_domain.StateVersionHistory]:
    """Updates the version history of each state at a particular version
    of an exploration.

    Args:
        states_version_history: dict(str, StateVersionHistory). The version
            history data of each state in the previous version of the
            exploration.
        change_list: list(ExplorationChange). A list of changes introduced in
            this commit.
        old_states_dict: dict(str, dict). The states in the previous version of
            the exploration.
        new_states_dict: dict(str, dict). The states in the current version of
            the exploration.
        current_version: int. The latest version of the exploration.
        committer_id: str. The id of the user who made the commit.

    Returns:
        states_version_history: dict(str, StateVersionHistory). The updated
        version history data of each state.
    """
    exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
    prev_version = current_version - 1

    # Firstly, delete the states from the state version history which were
    # deleted during this commit.
    for state_name in exp_versions_diff.deleted_state_names:
        del states_version_history[state_name]

    # Now, handle the updation of version history of states which were renamed.
    # Firstly, we need to clean up the exp_versions_diff.old_to_new_state_names
    # dict from the state names which are not effectively changed. For example,
    # if a state was renamed from state_1 to state_2 and then from state_2 to
    # state_1 in the same commit, then there is no effective change in state
    # name and we need to clear them from this dict.
    effective_old_to_new_state_names = {}
    for old_state_name, new_state_name in (
        exp_versions_diff.old_to_new_state_names.items()
    ):
        if old_state_name != new_state_name:
            effective_old_to_new_state_names[old_state_name] = new_state_name
    for old_state_name in effective_old_to_new_state_names:
        del states_version_history[old_state_name]
    for old_state_name, new_state_name in (
        effective_old_to_new_state_names.items()
    ):
        states_version_history[new_state_name] = (
            state_domain.StateVersionHistory(
                prev_version, old_state_name, committer_id))

    # The following list includes states which exist in both the old states
    # and new states and were not renamed.
    states_which_were_not_renamed = []
    for state_name in old_states_dict:
        if (
            state_name not in exp_versions_diff.deleted_state_names and
            state_name not in effective_old_to_new_state_names
        ):
            states_which_were_not_renamed.append(state_name)

    # We have dealt with state additions, deletions and renames.
    # Now we deal with states which were present in both versions and
    # underwent changes only through the command EDIT_STATE_PROPERTY.
    # The following dict stores whether the properties of states present
    # in states_which_were_not_renamed were changed using EDIT_STATE_PROPERTY.
    state_property_changed_data = {
        state_name: False
        for state_name in states_which_were_not_renamed
    }
    # The following ignore list contains those state properties which are
    # related to translations. Hence, they are ignored in order to avoid
    # updating the version history in case of translation-only commits.
    state_property_ignore_list = [
        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS,
        exp_domain.STATE_PROPERTY_WRITTEN_TRANSLATIONS
    ]
    for change in change_list:
        if (
            change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
            change.property_name not in state_property_ignore_list
        ):
            state_name = change.state_name
            if state_name in state_property_changed_data:
                state_property_changed_data[state_name] = True

    for state_name, state_property_changed in (
        state_property_changed_data.items()):
        if state_property_changed:
            # The purpose of checking the diff_dict between the two state
            # dicts ensure that we do not change the version history of that
            # particular state if the overall changes (by EDIT_STATE_PROPERTY)
            # get cancelled by each other and there is no 'net change'.
            diff_dict = deepdiff.DeepDiff(
                old_states_dict[state_name], new_states_dict[state_name])
            if diff_dict:
                states_version_history[state_name] = (
                    state_domain.StateVersionHistory(
                        prev_version, state_name, committer_id
                    ))

    # Finally, add the states which were newly added during this commit. The
    # version history of these states are initialized as None because they
    # were newly added and have no 'previously edited version'.
    for state_name in exp_versions_diff.added_state_names:
        states_version_history[state_name] = (
            state_domain.StateVersionHistory(None, None, committer_id))

    return states_version_history


def update_metadata_version_history(
    metadata_version_history: exp_domain.MetadataVersionHistory,
    change_list: List[exp_domain.ExplorationChange],
    old_metadata_dict: exp_domain.ExplorationMetadataDict,
    new_metadata_dict: exp_domain.ExplorationMetadataDict,
    current_version: int,
    committer_id: str
) -> exp_domain.MetadataVersionHistory:
    """Updates the version history of the exploration at a particular version
    of an exploration.

    Args:
        metadata_version_history: MetadataVersionHistory. The metadata version
            history at the previous version of the exploration.
        change_list: list(ExplorationChange). A list of changes introduced in
            this commit.
        old_metadata_dict: dict. The exploration metadata at the
            previous version of the exploration.
        new_metadata_dict: dict. The exploration metadata at the
            current version of the exploration.
        current_version: int. The latest version of the exploration.
        committer_id: str. The id of the user who made the commit.

    Returns:
        MetadataVersionHistory. The updated metadata version history.
    """
    prev_version = current_version - 1

    metadata_was_changed = any(
        change.cmd == exp_domain.CMD_EDIT_EXPLORATION_PROPERTY
        for change in change_list
    )

    if metadata_was_changed:
        # The purpose of checking the diff_dict between the two metadata
        # dicts ensure that we do not change the version history if the
        # overall changes (by EDIT_EXPLORATION_PROPERTY) get cancelled by
        # each other and there is no 'net change'.
        diff_dict = deepdiff.DeepDiff(old_metadata_dict, new_metadata_dict)
        if diff_dict:
            metadata_version_history.last_edited_version_number = prev_version
            metadata_version_history.last_edited_committer_id = committer_id

    return metadata_version_history


def get_updated_committer_ids(
    states_version_history: Dict[str, state_domain.StateVersionHistory],
    metadata_last_edited_committer_id: str
) -> List[str]:
    """Extracts a list of user ids who made the 'previous commit' on each state
    and the exploration metadata from the exploration states and metadata
    version history data.

    Args:
        states_version_history: dict(str, StateVersionHistory). The version
            history data of each state at a particular version of an
            exploration.
        metadata_last_edited_committer_id: str. User id of the user who
            committed the last change in the exploration metadata.

    Returns:
        list[str]. A list of user ids who made the 'previous commit' on each
        state and the exploration metadata.
    """
    committer_ids = {
        version_history.committer_id
        for version_history in states_version_history.values()
    }
    committer_ids.add(metadata_last_edited_committer_id)
    return list(committer_ids)


def update_version_history(
    exploration: exp_domain.Exploration,
    change_list: List[exp_domain.ExplorationChange],
    committer_id: str,
    old_states: Dict[str, state_domain.State],
    old_metadata: exp_domain.ExplorationMetadata
) -> None:
    """Creates the updated ExplorationVersionHistoryModel for the new version
    of the exploration (after the commit) and puts it into the datastore.

    Args:
        exploration: Exploration. The explortion after the latest commit.
        change_list: list(ExplorationChange). A list of changes introduced in
            the latest commit.
        committer_id: str. The id of the user who made the latest commit.
        old_states: dict(str, State). The states in the previous version of
            the exploration (before the latest commit).
        old_metadata: ExplorationMetadata. The exploration metadata at the
            previous version of the exploration (before the latest commit).
    """
    version_history_model_id = (
        exp_models.ExplorationVersionHistoryModel.get_instance_id(
            exploration.id, exploration.version - 1))
    version_history_model = exp_models.ExplorationVersionHistoryModel.get(
        version_history_model_id, strict=False)

    if version_history_model is not None:
        old_states_dict = {
            state_name: state.to_dict()
            for state_name, state in old_states.items()
        }
        new_states_dict = {
            state_name: state.to_dict()
            for state_name, state in exploration.states.items()
        }
        old_metadata_dict = old_metadata.to_dict()
        new_metadata_dict = exploration.get_metadata().to_dict()
        states_version_history = {
            state_name: state_domain.StateVersionHistory.from_dict(
                state_version_history_dict)
            for state_name, state_version_history_dict in (
                version_history_model.state_version_history.items())
        }
        metadata_version_history = exp_domain.MetadataVersionHistory(
            version_history_model.metadata_last_edited_version_number,
            version_history_model.metadata_last_edited_committer_id)

        updated_states_version_history = update_states_version_history(
            states_version_history, change_list, old_states_dict,
            new_states_dict, exploration.version, committer_id
        )
        updated_metadata_version_history = update_metadata_version_history(
            metadata_version_history, change_list, old_metadata_dict,
            new_metadata_dict, exploration.version, committer_id)
        updated_committer_ids = get_updated_committer_ids(
            updated_states_version_history,
            updated_metadata_version_history.last_edited_committer_id)

        updated_version_history_model_id = (
            exp_models.ExplorationVersionHistoryModel.get_instance_id(
                exploration.id, exploration.version))
        updated_version_history_model = (
            exp_models.ExplorationVersionHistoryModel(
                id=updated_version_history_model_id,
                exploration_id=exploration.id,
                exploration_version=exploration.version,
                state_version_history={
                    state_name: version_history.to_dict()
                    for state_name, version_history in (
                        updated_states_version_history.items())
                },
                metadata_last_edited_version_number=(
                    updated_metadata_version_history.last_edited_version_number
                ),
                metadata_last_edited_committer_id=(
                    updated_metadata_version_history.last_edited_committer_id
                ),
                committer_ids=updated_committer_ids
            ))
        updated_version_history_model.update_timestamps()
        updated_version_history_model.put()


def _save_exploration(
    committer_id: str,
    exploration: exp_domain.Exploration,
    commit_message: Optional[str],
    change_list: List[exp_domain.ExplorationChange]
) -> None:
    """Validates an exploration and commits it to persistent storage.

    If successful, increments the version number of the incoming exploration
    domain object by 1.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration: Exploration. The exploration to be saved.
        commit_message: str or None. A description of changes made to the state.
            For published explorations, this must be present; for unpublished
            explorations, it should be equal to None.
        change_list: list(ExplorationChange). A list of changes introduced in
            this commit.

    Raises:
        Exception. The versions of the given exploration and the currently
            stored exploration model do not match.
    """
    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    exploration_is_public = (
        exploration_rights.status != rights_domain.ACTIVITY_STATUS_PRIVATE
    )
    exploration.validate(strict=exploration_is_public)

    exploration_model = exp_models.ExplorationModel.get(exploration.id)

    if exploration.version > exploration_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of exploration '
            'from version %s. Please reload the page and try again.'
            % (exploration_model.version, exploration.version))

    if exploration.version < exploration_model.version:
        raise Exception(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_model.version, exploration.version))

    old_states = exp_fetchers.get_exploration_from_model(
        exploration_model).states
    old_metadata = exp_fetchers.get_exploration_from_model(
        exploration_model).get_metadata()

    exploration_model = populate_exp_model_fields(
        exploration_model, exploration)

    change_list_dict = [change.to_dict() for change in change_list]
    exploration_model.commit(committer_id, commit_message, change_list_dict)
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_EXPLORATION,
        None,
        [exploration.id])

    exploration.version += 1

    exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

    # Update the version history data for each state and the exploration
    # metadata in the new version of the exploration.
    update_version_history(
        exploration, change_list, committer_id, old_states, old_metadata)

    # Trigger statistics model update.
    new_exp_stats = stats_services.get_stats_for_new_exp_version(
        exploration.id, exploration.version, list(exploration.states.keys()),
        exp_versions_diff, None)

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
        exploration, exp_versions_diff, None)


def _create_exploration(
    committer_id: str,
    exploration: exp_domain.Exploration,
    commit_message: str,
    commit_cmds: List[exp_domain.ExplorationChange]
) -> None:
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

    version_history_model = exp_models.ExplorationVersionHistoryModel(
        id=exp_models.ExplorationVersionHistoryModel.get_instance_id(
            exploration.id, exploration.version),
        exploration_id=exploration.id,
        exploration_version=exploration.version,
        state_version_history={
            state_name: state_domain.StateVersionHistory(
                None, None, committer_id
            ).to_dict()
            for state_name in exploration.states
        },
        metadata_last_edited_version_number=None,
        metadata_last_edited_committer_id=committer_id,
        committer_ids=[committer_id]
    )
    version_history_model.update_timestamps()
    version_history_model.put()

    # Trigger statistics model creation.
    exploration_stats = stats_services.get_stats_for_new_exploration(
        exploration.id, exploration.version, list(exploration.states.keys()))
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

    regenerate_exploration_summary_with_new_contributor(
        exploration.id, committer_id)


def save_new_exploration(
    committer_id: str, exploration: exp_domain.Exploration
) -> None:
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
            exp_domain.CreateNewExplorationCmd({
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': exploration.title,
                'category': exploration.category,
            })])
    user_services.add_created_exploration_id(committer_id, exploration.id)
    user_services.add_edited_exploration_id(committer_id, exploration.id)
    user_services.record_user_created_an_exploration(committer_id)


def delete_exploration(
    committer_id: str,
    exploration_id: str,
    force_deletion: bool = False
) -> None:
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


def delete_explorations(
    committer_id: str,
    exploration_ids: List[str],
    force_deletion: bool = False
) -> None:
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

    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_EXPLORATION, None,
        exploration_ids)

    # Delete the explorations from search.
    search_services.delete_explorations_from_search_index(exploration_ids)

    # Delete the exploration summaries, recommendations and opportunities
    # regardless of whether or not force_deletion is True.
    delete_exploration_summaries(exploration_ids)
    recommendations_services.delete_explorations_from_recommendations(
        exploration_ids)
    opportunity_services.delete_exploration_opportunities(exploration_ids)
    feedback_services.delete_exploration_feedback_analytics(exploration_ids)

    # Remove the explorations from the featured activity references, if
    # necessary.
    activity_services.remove_featured_activities(
        constants.ACTIVITY_TYPE_EXPLORATION, exploration_ids)

    feedback_services.delete_threads_for_multiple_entities(
        feconf.ENTITY_TYPE_EXPLORATION, exploration_ids)

    # Remove from subscribers.
    taskqueue_services.defer(
        taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_USER_MODELS,
        taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS, exploration_ids)
    # Remove from activities.
    taskqueue_services.defer(
        taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_ACTIVITIES,
        taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS, exploration_ids)


def delete_explorations_from_user_models(exploration_ids: List[str]) -> None:
    """Remove explorations from all subscribers' exploration_ids.

    Args:
        exploration_ids: list(str). The ids of the explorations to delete.
    """
    if not exploration_ids:
        return

    subscription_models: Sequence[
        user_models.UserSubscriptionsModel
    ] = user_models.UserSubscriptionsModel.query(
        user_models.UserSubscriptionsModel.exploration_ids.IN(exploration_ids)
    ).fetch()
    for model in subscription_models:
        model.exploration_ids = [
            id_ for id_ in model.exploration_ids if id_ not in exploration_ids]
    user_models.UserSubscriptionsModel.update_timestamps_multi(
        list(subscription_models))
    user_models.UserSubscriptionsModel.put_multi(list(subscription_models))

    exp_user_data_models: Sequence[
        user_models.ExplorationUserDataModel
    ] = (
        user_models.ExplorationUserDataModel.get_all().filter(
            user_models.ExplorationUserDataModel.exploration_id.IN(
                exploration_ids
            )
        ).fetch()
    )
    user_models.ExplorationUserDataModel.delete_multi(
        list(exp_user_data_models)
    )

    user_contributions_models: Sequence[
        user_models.UserContributionsModel
    ] = (
        user_models.UserContributionsModel.get_all().filter(
            datastore_services.any_of(
                user_models.UserContributionsModel.created_exploration_ids.IN(
                    exploration_ids
                ),
                user_models.UserContributionsModel.edited_exploration_ids.IN(
                    exploration_ids
                )
            )
        ).fetch()
    )
    for contribution_model in user_contributions_models:
        contribution_model.created_exploration_ids = [
            exp_id for exp_id in contribution_model.created_exploration_ids
            if exp_id not in exploration_ids
        ]
        contribution_model.edited_exploration_ids = [
            exp_id for exp_id in contribution_model.edited_exploration_ids
            if exp_id not in exploration_ids
        ]
    user_models.UserContributionsModel.update_timestamps_multi(
        list(user_contributions_models))
    user_models.UserContributionsModel.put_multi(
        list(user_contributions_models)
    )


def delete_explorations_from_activities(exploration_ids: List[str]) -> None:
    """Remove explorations from exploration_ids field in completed and
    incomplete activities models.

    Args:
        exploration_ids: list(str). The ids of the explorations to delete.
    """
    if not exploration_ids:
        return

    model_classes: List[
        Union[
            Type[user_models.CompletedActivitiesModel],
            Type[user_models.IncompleteActivitiesModel]
        ]
    ] = [
        user_models.CompletedActivitiesModel,
        user_models.IncompleteActivitiesModel,
    ]
    all_entities: List[AcceptableActivityModelTypes] = []
    for model_class in model_classes:
        entities: Sequence[
            AcceptableActivityModelTypes
        ] = model_class.query(
            model_class.exploration_ids.IN(exploration_ids)
        ).fetch()
        for model in entities:
            model.exploration_ids = [
                id_ for id_ in model.exploration_ids
                if id_ not in exploration_ids
            ]
        all_entities.extend(entities)
    datastore_services.update_timestamps_multi(all_entities)
    datastore_services.put_multi(all_entities)


# Operations on exploration snapshots.
def get_exploration_snapshots_metadata(
    exploration_id: str, allow_deleted: bool = False
) -> List[SnapshotsMetadataDict]:
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
    version_nums = list(range(1, current_version + 1))

    return exp_models.ExplorationModel.get_snapshots_metadata(
        exploration_id, version_nums, allow_deleted=allow_deleted)


def get_last_updated_by_human_ms(exp_id: str) -> float:
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
    last_human_update_ms: float = 0
    snapshots_metadata = get_exploration_snapshots_metadata(exp_id)
    for snapshot_metadata in reversed(snapshots_metadata):
        if snapshot_metadata['committer_id'] != feconf.MIGRATION_BOT_USER_ID:
            last_human_update_ms = snapshot_metadata['created_on_ms']
            break

    return last_human_update_ms


def publish_exploration_and_update_user_profiles(
    committer: user_domain.UserActionsInfo, exp_id: str
) -> None:
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


def validate_exploration_for_story(
    exp: exp_domain.Exploration, strict: bool
) -> List[str]:
    """Validates an exploration with story validations.

    Args:
        exp: Exploration. Exploration object to be validated.
        strict: bool. Whether to raise an Exception when a validation error
            is encountered. If not, a list of the error messages are
            returned. strict should be True when this is called before
            saving the story and False when this function is called from the
            frontend.

    Returns:
        list(str). The various validation error messages (if strict is
        False).

    Raises:
        ValidationError. Invalid language found for exploration.
        ValidationError. Non default category found for exploration.
        ValidationError. Expected no exploration to have parameter values in it.
        ValidationError. Invalid interaction in exploration.
        ValidationError. RTE content in state of exploration with ID is not
            supported on mobile.
        ValidationError. Expected no exploration to have classifier models.
        ValidationError. Expected no exploration to contain training data in
            any answer group.
        ValidationError. Expected no exploration to have parameter values in
            the default outcome of any state interaction.
        ValidationError. Expected no exploration to have video tags.
        ValidationError. Expected no exploration to have link tags.
    """
    validation_error_messages = []
    if (
            exp.language_code not in
            android_validation_constants.SUPPORTED_LANGUAGES):
        error_string = (
            'Invalid language %s found for exploration '
            'with ID %s. This language is not supported for explorations '
            'in a story on the mobile app.' % (exp.language_code, exp.id))
        if strict:
            raise utils.ValidationError(error_string)
        validation_error_messages.append(error_string)

    if exp.param_specs or exp.param_changes:
        error_string = (
            'Expected no exploration in a story to have parameter '
            'values in it. Invalid exploration: %s' % exp.id)
        if strict:
            raise utils.ValidationError(error_string)
        validation_error_messages.append(error_string)

    if not exp.correctness_feedback_enabled:
        error_string = (
            'Expected all explorations in a story to '
            'have correctness feedback '
            'enabled. Invalid exploration: %s' % exp.id)
        if strict:
            raise utils.ValidationError(error_string)
        validation_error_messages.append(error_string)

    if exp.category not in constants.ALL_CATEGORIES:
        error_string = (
            'Expected all explorations in a story to '
            'be of a default category. '
            'Invalid exploration: %s' % exp.id)
        if strict:
            raise utils.ValidationError(error_string)
        validation_error_messages.append(error_string)

    for state_name in exp.states:
        state = exp.states[state_name]
        if not state.interaction.is_supported_on_android_app():
            error_string = (
                'Invalid interaction %s in exploration '
                'with ID: %s. This interaction is not supported for '
                'explorations in a story on the '
                'mobile app.' % (state.interaction.id, exp.id))
            if strict:
                raise utils.ValidationError(error_string)
            validation_error_messages.append(error_string)

        if not state.is_rte_content_supported_on_android():
            error_string = (
                'RTE content in state %s of exploration '
                'with ID %s is not supported on mobile for explorations '
                'in a story.' % (state_name, exp.id))
            if strict:
                raise utils.ValidationError(error_string)
            validation_error_messages.append(error_string)

        if state.interaction.id == 'EndExploration':
            recommended_exploration_ids = (
                state.interaction.customization_args[
                    'recommendedExplorationIds'].value)
            if len(recommended_exploration_ids) != 0:
                error_string = (
                    'Explorations in a story are not expected to contain '
                    'exploration recommendations. Exploration with ID: '
                    '%s contains exploration recommendations in its '
                    'EndExploration interaction.' % (exp.id))
                if strict:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)

        if state.interaction.id == 'MultipleChoiceInput':
            choices = (
                state.interaction.customization_args['choices'].value)
            error_string = (
                'Exploration in a story having MultipleChoiceInput '
                'interaction should have at least 4 choices present. '
                'Exploration with ID %s and state name %s have fewer than '
                '4 choices.' % (exp.id, state_name)
            )
            if len(choices) < 4 and strict:
                raise utils.ValidationError(error_string)
            validation_error_messages.append(error_string)

        if state.classifier_model_id is not None:
            error_string = (
                'Explorations in a story are not expected to contain '
                'classifier models. State %s of exploration with ID %s '
                'contains classifier models.' % (state_name, exp.id))
            if strict:
                raise utils.ValidationError(error_string)
            validation_error_messages.append(error_string)

        for answer_group in state.interaction.answer_groups:
            if len(answer_group.training_data) > 0:
                error_string = (
                    'Explorations in a story are not expected to contain '
                    'training data for any answer group. State %s of '
                    'exploration with ID %s contains training data in one of '
                    'its answer groups.' % (state_name, exp.id)
                )
                if strict:
                    raise utils.ValidationError(error_string)
                validation_error_messages.append(error_string)
                break

        if (
            state.interaction.default_outcome is not None and
            len(state.interaction.default_outcome.param_changes) > 0
        ):
            error_string = (
                'Explorations in a story are not expected to contain '
                'parameter values. State %s of exploration with ID %s '
                'contains parameter values in its default outcome.' % (
                    state_name, exp.id
                )
            )
            if strict:
                raise utils.ValidationError(error_string)
            validation_error_messages.append(error_string)

    return validation_error_messages


def update_exploration(
    committer_id: str,
    exploration_id: str,
    change_list: Optional[List[exp_domain.ExplorationChange]],
    commit_message: Optional[str],
    is_suggestion: bool = False,
    is_by_voice_artist: bool = False
) -> None:
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
        ValueError. No commit message is supplied and the exploration is public.
        ValueError. The update is due to a suggestion and the commit message is
            invalid.
        ValueError. The update is not due to a suggestion, and the commit
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
    if get_story_id_linked_to_exploration(exploration_id) is not None:
        validate_exploration_for_story(updated_exploration, True)
    _save_exploration(
        committer_id, updated_exploration, commit_message, change_list)

    discard_draft(exploration_id, committer_id)

    # Update summary of changed exploration in a deferred task.
    taskqueue_services.defer(
        taskqueue_services.FUNCTION_ID_REGENERATE_EXPLORATION_SUMMARY,
        taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS, exploration_id,
        committer_id)

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


def regenerate_exploration_summary_with_new_contributor(
    exploration_id: str, contributor_id: str
) -> None:
    """Regenerate a summary of the given exploration and add a new contributor
    to the contributors summary. If the summary does not exist, this function
    generates a new one.

    Args:
        exploration_id: str. The id of the exploration.
        contributor_id: str. ID of the contributor to be added to
            the exploration summary.
    """
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, strict=False)
    exp_summary = exp_fetchers.get_exploration_summary_by_id(
        exploration_id, strict=False)
    if exploration is not None:
        exp_rights = rights_manager.get_exploration_rights(
            exploration_id, strict=True)
        if exp_summary is None:
            updated_exp_summary = generate_new_exploration_summary(
                exploration, exp_rights)
        else:
            updated_exp_summary = update_exploration_summary(
                exploration, exp_rights, exp_summary)
        updated_exp_summary.add_contribution_by_user(contributor_id)
        save_exploration_summary(updated_exp_summary)
    else:
        logging.error('Could not find exploration with ID %s', exploration_id)


def regenerate_exploration_and_contributors_summaries(
    exploration_id: str
) -> None:
    """Regenerate a summary of the given exploration and also regenerate
    the contributors summary from the snapshots. If the summary does not exist,
    this function generates a new one.

    Args:
        exploration_id: str. ID of the exploration.
    """
    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    exp_rights = rights_manager.get_exploration_rights(
        exploration_id, strict=True)
    exp_summary = exp_fetchers.get_exploration_summary_by_id(
        exploration_id, strict=True)
    updated_exp_summary = update_exploration_summary(
        exploration, exp_rights, exp_summary)
    updated_exp_summary.contributors_summary = (
        compute_exploration_contributors_summary(updated_exp_summary.id))
    save_exploration_summary(updated_exp_summary)


def update_exploration_summary(
    exploration: exp_domain.Exploration,
    exp_rights: rights_domain.ActivityRights,
    exp_summary: exp_domain.ExplorationSummary,
    skip_exploration_model_last_updated: bool = False
) -> exp_domain.ExplorationSummary:
    """Updates an exploration summary domain object from a given exploration
    and its rights.

    Args:
        exploration: Exploration. The exploration whose summary is to be
            computed.
        exp_rights: ActivityRights. The exploration rights model, used
            to compute summary.
        exp_summary: ExplorationSummary. The exploration summary
            model whose summary needs to be recomputed.
        skip_exploration_model_last_updated: bool. Whether the update of
            exploration_model_last_updated should be skipped.
            The exploration_model_last_updated is computed from the last human
            update of the exploration. The update for this value should
            be skipped when we know that the current workflow isn't
            due to a human-initiated update.

    Returns:
        ExplorationSummary. The resulting exploration summary domain object.

    Raises:
        Exception. No data available for when the exploration was created_on.
    """
    scaled_average_rating = get_scaled_average_rating(exp_summary.ratings)

    if skip_exploration_model_last_updated:
        exploration_model_last_updated = (
            exp_summary.exploration_model_last_updated)
    else:
        # TODO(#15895): Revisit this after we have validations for the model to
        # see whether exploration_model_last_updated and
        # ExplorationModel.last_updated are in sync or not.
        exploration_model_last_updated = datetime.datetime.fromtimestamp(
            get_last_updated_by_human_ms(exploration.id) / 1000.0)

    contributor_ids = list(exp_summary.contributors_summary.keys())

    if exploration.created_on is None:
        raise Exception(
            'No data available for when the exploration was created_on.'
        )

    return exp_domain.ExplorationSummary(
        exploration.id, exploration.title, exploration.category,
        exploration.objective, exploration.language_code, exploration.tags,
        exp_summary.ratings, scaled_average_rating, exp_rights.status,
        exp_rights.community_owned, exp_rights.owner_ids, exp_rights.editor_ids,
        exp_rights.voice_artist_ids, exp_rights.viewer_ids, contributor_ids,
        exp_summary.contributors_summary, exploration.version,
        exploration.created_on, exploration_model_last_updated,
        exp_rights.first_published_msec
    )


def generate_new_exploration_summary(
    exploration: exp_domain.Exploration,
    exp_rights: rights_domain.ActivityRights
) -> exp_domain.ExplorationSummary:
    """Generates a new exploration summary domain object from a given
    exploration and its rights.

    Args:
        exploration: Exploration. The exploration whose summary is to be
            computed.
        exp_rights: ActivityRights. The exploration rights model, used
            to compute summary.

    Returns:
        ExplorationSummary. The resulting exploration summary domain object.

    Raises:
        Exception. No data available for when the exploration was created_on.
    """
    ratings = feconf.get_empty_ratings()
    scaled_average_rating = get_scaled_average_rating(ratings)
    exploration_model_last_updated = datetime.datetime.fromtimestamp(
        get_last_updated_by_human_ms(exploration.id) / 1000.0)

    if exploration.created_on is None:
        raise Exception(
            'No data available for when the exploration was created_on.'
        )

    return exp_domain.ExplorationSummary(
        exploration.id, exploration.title, exploration.category,
        exploration.objective, exploration.language_code, exploration.tags,
        ratings, scaled_average_rating, exp_rights.status,
        exp_rights.community_owned, exp_rights.owner_ids, exp_rights.editor_ids,
        exp_rights.voice_artist_ids, exp_rights.viewer_ids, [], {},
        exploration.version, exploration.created_on,
        exploration_model_last_updated, exp_rights.first_published_msec
    )


def compute_exploration_contributors_summary(
    exploration_id: str
) -> Dict[str, int]:
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
    contributors_summary: Dict[str, int] = collections.defaultdict(int)
    while True:
        snapshot_metadata = snapshots_metadata[current_version - 1]
        committer_id = snapshot_metadata['committer_id']
        is_revert = (snapshot_metadata['commit_type'] == 'revert')
        if not is_revert and committer_id not in constants.SYSTEM_USER_IDS:
            contributors_summary[committer_id] += 1
        if current_version == 1:
            break

        if is_revert:
            version_number = snapshot_metadata['commit_cmds'][0][
                'version_number']
            # Ruling out the possibility of any other type for mypy
            # type checking.
            assert isinstance(version_number, int)
            current_version = version_number
        else:
            current_version -= 1

    contributor_ids = list(contributors_summary)
    # Remove IDs that are deleted or do not exist.
    users_settings = user_services.get_users_settings(contributor_ids)
    for contributor_id, user_settings in zip(contributor_ids, users_settings):
        if user_settings is None:
            del contributors_summary[contributor_id]

    return contributors_summary


def save_exploration_summary(
    exp_summary: exp_domain.ExplorationSummary
) -> None:
    """Save an exploration summary domain object as an ExpSummaryModel entity
    in the datastore.

    Args:
        exp_summary: ExplorationSummary. The exploration summary to save.
    """

    existing_exp_summary_model = (
        exp_models.ExpSummaryModel.get(exp_summary.id, strict=False))
    exp_summary_model = populate_exp_summary_model_fields(
        existing_exp_summary_model, exp_summary)
    exp_summary_model.update_timestamps()
    exp_summary_model.put()
    # The index should be updated after saving the exploration
    # summary instead of after saving the exploration since the
    # index contains documents computed on basis of exploration
    # summary.
    index_explorations_given_ids([exp_summary.id])


def delete_exploration_summaries(exploration_ids: List[str]) -> None:
    """Delete multiple exploration summary models.

    Args:
        exploration_ids: list(str). The id of the exploration summaries to be
            deleted.
    """
    summary_models = exp_models.ExpSummaryModel.get_multi(exploration_ids)
    existing_summary_models = [
        summary_model for summary_model in summary_models
        if summary_model is not None
    ]
    exp_models.ExpSummaryModel.delete_multi(existing_summary_models)


def revert_version_history(
    exploration_id: str, current_version: int, revert_to_version: int
) -> None:
    """Reverts the version history to the given version number. Puts the
    reverted version history model into the datastore.

    Args:
        exploration_id: str. The id of the exploration for which the version
            history is to be reverted to the current version.
        current_version: int. The current version of the exploration.
        revert_to_version: int. The version to which the version history
            is to be reverted.
    """
    version_history_model_id = (
        exp_models.ExplorationVersionHistoryModel.get_instance_id(
            exploration_id, revert_to_version))
    version_history_model = exp_models.ExplorationVersionHistoryModel.get(
        version_history_model_id, strict=False)

    if version_history_model is not None:
        new_version_history_model = exp_models.ExplorationVersionHistoryModel(
            id=exp_models.ExplorationVersionHistoryModel.get_instance_id(
                exploration_id, current_version + 1),
            exploration_id=exploration_id,
            exploration_version=current_version + 1,
            state_version_history=version_history_model.state_version_history,
            metadata_last_edited_version_number=(
                version_history_model.metadata_last_edited_version_number),
            metadata_last_edited_committer_id=(
                version_history_model.metadata_last_edited_committer_id),
            committer_ids=version_history_model.committer_ids
        )
        new_version_history_model.update_timestamps()
        new_version_history_model.put()


def get_exploration_validation_error(
    exploration_id: str, revert_to_version: int
) -> Optional[str]:
    """Tests whether an exploration can be reverted to the given version
    number. Does not commit any changes.

    Args:
        exploration_id: str. The id of the exploration to be reverted to the
            current version.
        revert_to_version: int. The version to which the given exploration
            is to be reverted.

    Returns:
        Optional[str]. None if the revert_to_version passes all backend
        validation checks, or the error string otherwise.
    """
    # Validate the previous version of the exploration.
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=revert_to_version)
    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    try:
        exploration.validate(
            exploration_rights.status == rights_domain.ACTIVITY_STATUS_PUBLIC)
    except Exception as ex:
        return str(ex)

    return None


def revert_exploration(
    committer_id: str,
    exploration_id: str,
    current_version: int,
    revert_to_version: int
) -> None:
    """Reverts an exploration to the given version number. Commits changes.

    Args:
        committer_id: str. The id of the user who made the commit.
        exploration_id: str. The id of the exploration to be reverted to the
            current version.
        current_version: int. The current version of the exploration.
        revert_to_version: int. The version to which the given exploration
            is to be reverted.

    Raises:
        Exception. Version of exploration does not match the version of the
            currently-stored exploration model.
    """
    exploration_model = exp_models.ExplorationModel.get(
        exploration_id, strict=True)

    if current_version > exploration_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of exploration '
            'from version %s. Please reload the page and try again.'
            % (exploration_model.version, current_version))

    if current_version < exploration_model.version:
        raise Exception(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_model.version, current_version))

    # Validate the previous version of the exploration before committing the
    # change.
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=revert_to_version)
    exploration_rights = rights_manager.get_exploration_rights(exploration.id)
    exploration_is_public = (
        exploration_rights.status != rights_domain.ACTIVITY_STATUS_PRIVATE
    )
    exploration.validate(strict=exploration_is_public)

    exp_models.ExplorationModel.revert(
        exploration_model, committer_id,
        'Reverted exploration to version %s' % revert_to_version,
        revert_to_version)
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_EXPLORATION, None,
        [exploration.id])

    revert_version_history(exploration_id, current_version, revert_to_version)

    regenerate_exploration_and_contributors_summaries(exploration_id)

    exploration_stats = stats_services.get_stats_for_new_exp_version(
        exploration.id, current_version + 1, list(exploration.states.keys()),
        None, revert_to_version)
    stats_services.create_stats_model(exploration_stats)

    current_exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=current_version)
    stats_services.update_exp_issues_for_new_exp_version(
        current_exploration, None, revert_to_version)

    if feconf.ENABLE_ML_CLASSIFIERS:
        exploration_to_revert_to = exp_fetchers.get_exploration_by_id(
            exploration_id, version=revert_to_version)
        classifier_services.create_classifier_training_job_for_reverted_exploration( # pylint: disable=line-too-long
            current_exploration, exploration_to_revert_to)


# Creation and deletion methods.
def get_demo_exploration_components(
    demo_path: str
) -> Tuple[str, List[Tuple[str, bytes]]]:
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
        Exception. The path of the file is unrecognized or does not exist.
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
    committer_id: str,
    yaml_content: str,
    exploration_id: str,
    assets_list: List[Tuple[str, bytes]],
    strip_voiceovers: bool = False
) -> None:
    """Saves a new exploration given its representation in YAML form and the
    list of assets associated with it.

    Args:
        committer_id: str. The id of the user who made the commit.
        yaml_content: str. The YAML representation of the exploration.
        exploration_id: str. The id of the exploration.
        assets_list: list(tuple(str, bytes)). A list of lists of assets, which
            contains asset's filename and content.
        strip_voiceovers: bool. Whether to strip away all audio voiceovers
            from the imported exploration.

    Raises:
        Exception. The yaml file is invalid due to a missing schema version.
    """
    yaml_dict = utils.dict_from_yaml(yaml_content)
    if 'schema_version' not in yaml_dict:
        raise Exception('Invalid YAML file: missing schema version')

    # The assets are committed before the exploration is created because the
    # migrating to state schema version 25 involves adding dimensions to
    # images. So we need to have images in the datastore before we could
    # perform the migration.
    for (asset_filename, asset_content) in assets_list:
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id)
        fs.commit(asset_filename, asset_content)

    exploration = exp_domain.Exploration.from_yaml(exploration_id, yaml_content)

    # Check whether audio translations should be stripped.
    if strip_voiceovers:
        for state in exploration.states.values():
            state.recorded_voiceovers.strip_all_existing_voiceovers()

    create_commit_message = (
        'New exploration created from YAML file with title \'%s\'.'
        % exploration.title)

    _create_exploration(
        committer_id, exploration, create_commit_message, [
            exp_domain.CreateNewExplorationCmd({
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': exploration.title,
                'category': exploration.category,
            })])


def delete_demo(exploration_id: str) -> None:
    """Deletes a single demo exploration.

    Args:
        exploration_id: str. The id of the exploration to be deleted.

    Raises:
        Exception. The exploration id is invalid.
    """
    if not exp_domain.Exploration.is_demo_exploration_id(exploration_id):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, strict=False)
    if not exploration:
        logging.info(
            'Exploration with id %s was not deleted, because it '
            'does not exist.' % exploration_id)
    else:
        delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, exploration_id, force_deletion=True)


def load_demo(exploration_id: str) -> None:
    """Loads a demo exploration.

    The resulting exploration will have two commits in its history (one for
    its initial creation and one for its subsequent modification.)

    Args:
        exploration_id: str. The id of the demo exploration.

    Raises:
        Exception. The exploration id provided is invalid.
    """
    if not exp_domain.Exploration.is_demo_exploration_id(exploration_id):
        raise Exception('Invalid demo exploration id %s' % exploration_id)

    delete_demo(exploration_id)

    exp_filename = feconf.DEMO_EXPLORATIONS[exploration_id]

    yaml_content, assets_list = get_demo_exploration_components(exp_filename)
    save_new_exploration_from_yaml_and_assets(
        feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id, assets_list)

    publish_exploration_and_update_user_profiles(
        user_services.get_system_user(), exploration_id)

    index_explorations_given_ids([exploration_id])

    logging.info('Exploration with id %s was loaded.' % exploration_id)


def get_next_page_of_all_non_private_commits(
    page_size: int = feconf.COMMIT_LIST_PAGE_SIZE,
    urlsafe_start_cursor: Optional[str] = None,
    max_age: Optional[datetime.timedelta] = None
) -> Tuple[List[exp_domain.ExplorationCommitLogEntry], Optional[str], bool]:
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
        ValueError. The argument max_age is not datetime.timedelta or None.
    """
    if max_age is not None and not isinstance(max_age, datetime.timedelta):
        raise ValueError(
            'max_age must be a datetime.timedelta instance. or None.')

    results, new_urlsafe_start_cursor, more = (
        exp_models.ExplorationCommitLogEntryModel.get_all_non_private_commits(
            page_size, urlsafe_start_cursor, max_age=max_age))

    return ([exp_domain.ExplorationCommitLogEntry(
        entry.created_on, entry.last_updated, entry.user_id,
        entry.exploration_id, entry.commit_type, entry.commit_message,
        entry.commit_cmds, entry.version, entry.post_commit_status,
        entry.post_commit_community_owned, entry.post_commit_is_private
    ) for entry in results], new_urlsafe_start_cursor, more)


def get_image_filenames_from_exploration(
    exploration: exp_domain.Exploration
) -> List[str]:
    """Get the image filenames from the exploration.

    Args:
        exploration: Exploration. The exploration to get the image filenames.

    Returns:
        list(str). List containing the name of the image files in exploration.
    """
    filenames = []
    for state in exploration.states.values():
        if state.interaction.id == 'ImageClickInput':
            image_paths = state.interaction.customization_args[
                'imageAndRegions'].value
            # Ruling out the possibility of any other type for mypy
            # type checking.
            assert isinstance(image_paths, dict)
            filenames.append(image_paths['imagePath'])

    html_list = exploration.get_all_html_content_strings()
    filenames.extend(
        html_cleaner.get_image_filenames_from_html_strings(html_list))
    return filenames


def get_number_of_ratings(ratings: Dict[str, int]) -> int:
    """Gets the total number of ratings represented by the given ratings
    object.

    Args:
        ratings: dict. A dict whose keys are '1', '2', '3', '4', '5' and whose
            values are nonnegative integers representing frequency counts.

    Returns:
        int. The total number of ratings given.
    """
    return sum(ratings.values()) if ratings else 0


def get_average_rating(ratings: Dict[str, int]) -> float:
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
        return rating_sum / number_of_ratings
    return 0


def get_scaled_average_rating(ratings: Dict[str, int]) -> float:
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
    a = x + ((z**2) / (2 * n))
    b = z * math.sqrt(((x * (1 - x)) / n) + ((z**2) / (4 * n**2)))
    wilson_score_lower_bound = (a - b) / (1 + ((z**2) / n))
    return 1 + 4 * wilson_score_lower_bound


def index_explorations_given_ids(exp_ids: List[str]) -> None:
    """Indexes the explorations corresponding to the given exploration ids.

    Args:
        exp_ids: list(str). List of ids of the explorations to be indexed.
    """
    exploration_summaries = exp_fetchers.get_exploration_summaries_matching_ids(
        exp_ids)
    search_services.index_exploration_summaries([
        exploration_summary for exploration_summary in exploration_summaries
        if exploration_summary is not None])


def is_voiceover_change_list(
    change_list: List[exp_domain.ExplorationChange]
) -> bool:
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


def get_composite_change_list(
    exp_id: str, from_version: int, to_version: int
) -> List[exp_domain.ExplorationChange]:
    """Returns a list of ExplorationChange domain objects consisting of
    changes from from_version to to_version in an exploration.

    Args:
        exp_id: str. The id of the exploration.
        from_version: int. The version of the exploration from where we
            want to start the change list.
        to_version: int. The version of the exploration till which we
            want are change list.

    Returns:
        list(ExplorationChange). List of ExplorationChange domain objects
        consisting of changes from from_version to to_version.

    Raises:
        Exception. From version is higher than to version.
    """
    if from_version > to_version:
        raise Exception(
            'Unexpected error: Trying to find change list from version %s '
            'of exploration to version %s.'
            % (from_version, to_version))

    version_nums = list(range(from_version + 1, to_version + 1))
    snapshots_metadata = exp_models.ExplorationModel.get_snapshots_metadata(
        exp_id, version_nums, allow_deleted=False)

    composite_change_list_dict = []
    for snapshot in snapshots_metadata:
        composite_change_list_dict += snapshot['commit_cmds']

    composite_change_list = [
        exp_domain.ExplorationChange(change)
        for change in composite_change_list_dict]

    return composite_change_list


def are_changes_mergeable(
    exp_id: str,
    change_list_version: int,
    change_list: List[exp_domain.ExplorationChange]
) -> bool:
    """Checks whether the change list can be merged when the
    intended exploration version of changes_list is not same as
    the current exploration version.

    Args:
        exp_id: str. The id of the exploration where the change_list is to
            be applied.
        change_list_version: int. Version of an exploration on which the change
            list was applied.
        change_list: list(ExplorationChange). List of the changes made by the
            user on the frontend, which needs to be checked for mergeability.

    Returns:
        boolean. Whether the changes are mergeable.
    """
    current_exploration = exp_fetchers.get_exploration_by_id(exp_id)
    if current_exploration.version == change_list_version:
        return True
    if current_exploration.version < change_list_version:
        return False

    # A complete list of changes from one version to another
    # is composite_change_list.
    composite_change_list = get_composite_change_list(
        exp_id, change_list_version,
        current_exploration.version)

    exp_at_change_list_version = exp_fetchers.get_exploration_by_id(
        exp_id, version=change_list_version)

    changes_are_mergeable, send_email = (
        exp_domain.ExplorationChangeMergeVerifier(
            composite_change_list).is_change_list_mergeable(
                change_list, exp_at_change_list_version,
                current_exploration))

    if send_email:
        change_list_dict = [change.to_dict() for change in change_list]
        email_manager.send_not_mergeable_change_list_to_admin_for_review(
            exp_id, change_list_version, current_exploration.version,
            change_list_dict)
    return changes_are_mergeable


def is_version_of_draft_valid(exp_id: str, version: int) -> bool:
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
    user_id: str,
    exploration_id: str,
    apply_draft: bool = False,
    version: Optional[int] = None
) -> UserExplorationDataDict:
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
    draft_changes = (
        exp_user_data.draft_change_list if exp_user_data
        and exp_user_data.draft_change_list else None)
    draft_change_list_id = (
        exp_user_data.draft_change_list_id if exp_user_data else 0)
    exploration_email_preferences = (
        user_services.get_email_preferences_for_exploration(
            user_id, exploration_id))

    editor_dict: UserExplorationDataDict = {
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
        'show_state_editor_tutorial_on_load': False,
        'show_state_translation_tutorial_on_load': False,
        'states': states,
        'tags': exploration.tags,
        'title': exploration.title,
        'version': exploration.version,
        'is_version_of_draft_valid': is_valid_draft_version,
        'draft_changes': draft_changes,
        'email_preferences': exploration_email_preferences.to_dict(),
        'edits_allowed': exploration.edits_allowed
    }

    return editor_dict


def create_or_update_draft(
    exp_id: str,
    user_id: str,
    change_list: List[exp_domain.ExplorationChange],
    exp_version: int,
    current_datetime: datetime.datetime,
    is_by_voice_artist: bool = False
) -> None:
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
    exp_user_data.update_timestamps()
    exp_user_data.put()


def get_exp_with_draft_applied(
    exp_id: str, user_id: str
) -> Optional[exp_domain.Exploration]:
    """If a draft exists for the given user and exploration,
    apply it to the exploration.

    Args:
        exp_id: str. The id of the exploration.
        user_id: str. The id of the user whose draft is to be applied.

    Returns:
        Exploration or None. Returns the exploration domain object with draft
        applied, or None if draft can not be applied.
    """
    # TODO(#15075): Refactor this function.

    exp_user_data = user_models.ExplorationUserDataModel.get(user_id, exp_id)
    exploration = exp_fetchers.get_exploration_by_id(exp_id)
    draft_change_list = []
    if exp_user_data:
        if exp_user_data.draft_change_list:
            draft_change_list_exp_version = (
                exp_user_data.draft_change_list_exp_version)
            draft_change_list = [
                exp_domain.ExplorationChange(change)
                for change in exp_user_data.draft_change_list]
            if (exploration.version >
                    exp_user_data.draft_change_list_exp_version):
                logging.info(
                    'Exploration and draft versions out of sync, trying '
                    'to upgrade draft version to match exploration\'s.')
                new_draft_change_list = (
                    draft_upgrade_services.try_upgrading_draft_to_exp_version(
                        draft_change_list,
                        exp_user_data.draft_change_list_exp_version,
                        exploration.version, exploration.id))
                if new_draft_change_list is not None:
                    draft_change_list = new_draft_change_list
                    draft_change_list_exp_version = exploration.version
    updated_exploration = None

    if (exp_user_data and exp_user_data.draft_change_list and
            are_changes_mergeable(
                exp_id, draft_change_list_exp_version, draft_change_list)):
        updated_exploration = apply_change_list(
            exp_id, draft_change_list)
        updated_exploration_has_no_invalid_math_tags = True
        # verify that all the math-tags are valid before returning the
        # updated exploration.
        for state in updated_exploration.states.values():
            html_string = ''.join(state.get_all_html_content_strings())
            error_list = (
                html_validation_service.
                validate_math_tags_in_html_with_attribute_math_content(
                    html_string))
            if len(error_list) > 0:
                updated_exploration_has_no_invalid_math_tags = False
                break
        if not updated_exploration_has_no_invalid_math_tags:
            updated_exploration = None

    return updated_exploration


def discard_draft(exp_id: str, user_id: str) -> None:
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
        exp_user_data.update_timestamps()
        exp_user_data.put()


def get_interaction_id_for_state(exp_id: str, state_name: str) -> Optional[str]:
    """Returns the interaction id for the given state name.

    Args:
        exp_id: str. The ID of the exploration.
        state_name: str. The name of the state.

    Returns:
        str|None. The ID of the interaction.

    Raises:
        Exception. If the state with the given state name does not exist in
            the exploration.
    """
    exploration = exp_fetchers.get_exploration_by_id(exp_id)
    if exploration.has_state_name(state_name):
        return exploration.get_interaction_id_by_state_name(state_name)
    raise Exception(
        'There exist no state in the exploration with the given state name.')


def update_logged_out_user_progress(
    exploration_id: str,
    unique_progress_url_id: str,
    state_name: str,
    exp_version: int,
) -> None:
    """Updates the logged-out user's progress in the
        associated TransientCheckpointUrlModel.

    Args:
        exploration_id: str. The ID of the exploration.
        unique_progress_url_id: str. Unique 6-digit url to track a
            logged-out user's progress.
        state_name: str. State name of the most recently
            reached checkpoint in the exploration.
        exp_version: int. Exploration version in which a
            checkpoint was most recently reached.
    """
    # Fetch the model associated with the unique_progress_url_id.
    checkpoint_url_model = exp_models.TransientCheckpointUrlModel.get(
        unique_progress_url_id, strict=False)

    # Create a model if it doesn't already exist.
    if checkpoint_url_model is None:
        checkpoint_url_model = exp_models.TransientCheckpointUrlModel.create(
            exploration_id, unique_progress_url_id)

    current_exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, strict=True, version=exp_version)

    # If the exploration is being visited the first time.
    if checkpoint_url_model.furthest_reached_checkpoint_state_name is None:
        checkpoint_url_model.furthest_reached_checkpoint_exp_version = (
            exp_version)
        checkpoint_url_model.furthest_reached_checkpoint_state_name = (
            state_name)
    elif checkpoint_url_model.furthest_reached_checkpoint_exp_version <= exp_version: # pylint: disable=line-too-long
        furthest_reached_checkpoint_exp = (
            exp_fetchers.get_exploration_by_id(
                exploration_id,
                strict=True,
                version=checkpoint_url_model.furthest_reached_checkpoint_exp_version # pylint: disable=line-too-long
            )
        )
        checkpoints_in_current_exp = user_services.get_checkpoints_in_order(
            current_exploration.init_state_name, current_exploration.states)
        checkpoints_in_older_exp = user_services.get_checkpoints_in_order(
            furthest_reached_checkpoint_exp.init_state_name,
            furthest_reached_checkpoint_exp.states)

        # Get the furthest reached checkpoint in current exploration.
        furthest_reached_checkpoint_in_current_exp = (
            user_services.
                get_most_distant_reached_checkpoint_in_current_exploration(
                    checkpoints_in_current_exp,
                    checkpoints_in_older_exp,
                    checkpoint_url_model.furthest_reached_checkpoint_state_name
                )
        )

        # If the furthest reached checkpoint doesn't exist in current
        # exploration.
        if furthest_reached_checkpoint_in_current_exp is None:
            checkpoint_url_model.furthest_reached_checkpoint_exp_version = (
                exp_version)
            checkpoint_url_model.furthest_reached_checkpoint_state_name = (
                state_name)
        else:
            # Index of the furthest reached checkpoint.
            frc_index = checkpoints_in_current_exp.index(
                furthest_reached_checkpoint_in_current_exp)
            # If furthest reached checkpoint is behind most recently
            # reached checkpoint.
            if frc_index <= checkpoints_in_current_exp.index(state_name):
                checkpoint_url_model.furthest_reached_checkpoint_exp_version = ( # pylint: disable=line-too-long
                    exp_version)
                checkpoint_url_model.furthest_reached_checkpoint_state_name = (
                    state_name)

    checkpoint_url_model.most_recently_reached_checkpoint_exp_version = (
        exp_version)
    checkpoint_url_model.most_recently_reached_checkpoint_state_name = (
        state_name)
    checkpoint_url_model.last_updated = datetime.datetime.utcnow()
    checkpoint_url_model.update_timestamps()
    checkpoint_url_model.put()


def sync_logged_out_learner_checkpoint_progress_with_current_exp_version(
    exploration_id: str, unique_progress_url_id: str
) -> Optional[exp_domain.TransientCheckpointUrl]:
    """Synchronizes the most recently reached checkpoint and the furthest
    reached checkpoint with the latest exploration.

    Args:
        exploration_id: str. The Id of the exploration.
        unique_progress_url_id: str. Unique 6-digit url to track a
            logged-out user's progress.

    Returns:
        TransientCheckpointUrl. The domain object corresponding to the
        TransientCheckpointUrlModel.
    """
    # Fetch the model associated with the unique_progress_url_id.
    checkpoint_url_model = exp_models.TransientCheckpointUrlModel.get(
        unique_progress_url_id, strict=False)

    if checkpoint_url_model is None:
        return None

    latest_exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    most_recently_interacted_exploration = (
        exp_fetchers.get_exploration_by_id(
            exploration_id,
            strict=True,
            version=(
               checkpoint_url_model.most_recently_reached_checkpoint_exp_version
            )
        ))
    furthest_reached_exploration = (
        exp_fetchers.get_exploration_by_id(
            exploration_id,
            strict=True,
            version=checkpoint_url_model.furthest_reached_checkpoint_exp_version
        ))

    most_recently_reached_checkpoint_in_current_exploration = (
        user_services.
            get_most_distant_reached_checkpoint_in_current_exploration(
                user_services.get_checkpoints_in_order(
                    latest_exploration.init_state_name,
                    latest_exploration.states),
                user_services.get_checkpoints_in_order(
                    most_recently_interacted_exploration.init_state_name,
                    most_recently_interacted_exploration.states),
                checkpoint_url_model.most_recently_reached_checkpoint_state_name
            )
    )

    furthest_reached_checkpoint_in_current_exploration = (
        user_services.
            get_most_distant_reached_checkpoint_in_current_exploration(
                user_services.get_checkpoints_in_order(
                    latest_exploration.init_state_name,
                    latest_exploration.states),
                user_services.get_checkpoints_in_order(
                    furthest_reached_exploration.init_state_name,
                    furthest_reached_exploration.states),
                checkpoint_url_model.furthest_reached_checkpoint_state_name
            )
    )

    # If the most recently reached checkpoint doesn't exist in current
    # exploration.
    if (
        most_recently_reached_checkpoint_in_current_exploration !=
        checkpoint_url_model.most_recently_reached_checkpoint_state_name
    ):
        checkpoint_url_model.most_recently_reached_checkpoint_state_name = (
            most_recently_reached_checkpoint_in_current_exploration)
        checkpoint_url_model.most_recently_reached_checkpoint_exp_version = (
            latest_exploration.version)
        checkpoint_url_model.update_timestamps()
        checkpoint_url_model.put()

    # If the furthest reached checkpoint doesn't exist in current
    # exploration.
    if (
        furthest_reached_checkpoint_in_current_exploration !=
        checkpoint_url_model.furthest_reached_checkpoint_state_name
    ):
        checkpoint_url_model.furthest_reached_checkpoint_state_name = (
            furthest_reached_checkpoint_in_current_exploration)
        checkpoint_url_model.furthest_reached_checkpoint_exp_version = (
            latest_exploration.version)
        checkpoint_url_model.update_timestamps()
        checkpoint_url_model.put()

    return exp_fetchers.get_logged_out_user_progress(unique_progress_url_id)


def sync_logged_out_learner_progress_with_logged_in_progress(
    user_id: str, exploration_id: str, unique_progress_url_id: str
) -> None:

    """Syncs logged out and logged in learner's checkpoints progress."""

    logged_out_user_data = (
        exp_fetchers.get_logged_out_user_progress(unique_progress_url_id))

    # If logged out progress has been cleared by the cron job.
    if logged_out_user_data is None:
        return

    latest_exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    exp_user_data = exp_fetchers.get_exploration_user_data(
        user_id,
        exploration_id
    )

    logged_in_user_model = user_models.ExplorationUserDataModel.get(
        user_id, exploration_id)

    if logged_in_user_model is None or exp_user_data is None:
        logged_in_user_model = user_models.ExplorationUserDataModel.create(
            user_id, exploration_id)

        logged_in_user_model.most_recently_reached_checkpoint_exp_version = (
            logged_out_user_data.most_recently_reached_checkpoint_exp_version
        )
        logged_in_user_model.most_recently_reached_checkpoint_state_name = (
            logged_out_user_data.most_recently_reached_checkpoint_state_name
        )
        logged_in_user_model.furthest_reached_checkpoint_exp_version = (
            logged_out_user_data.furthest_reached_checkpoint_exp_version
        )
        logged_in_user_model.furthest_reached_checkpoint_state_name = (
            logged_out_user_data.furthest_reached_checkpoint_state_name
        )
        logged_in_user_model.update_timestamps()
        logged_in_user_model.put()

    elif logged_in_user_model.most_recently_reached_checkpoint_exp_version == logged_out_user_data.most_recently_reached_checkpoint_exp_version: # pylint: disable=line-too-long
        current_exploration = exp_fetchers.get_exploration_by_id(
            exploration_id,
            strict=True,
            version=(
               logged_out_user_data.most_recently_reached_checkpoint_exp_version
            )
        )
        recent_checkpoint_state_name = (
            exp_user_data.most_recently_reached_checkpoint_state_name
        )
        # Ruling out the possibility of None for mypy type checking.
        assert recent_checkpoint_state_name is not None
        most_recently_reached_checkpoint_index_in_logged_in_progress = (
            user_services.get_checkpoints_in_order(
                current_exploration.init_state_name,
                current_exploration.states
            ).index(
                recent_checkpoint_state_name
            )
        )

        most_recently_reached_checkpoint_index_in_logged_out_progress = (
            user_services.get_checkpoints_in_order(
                current_exploration.init_state_name,
                current_exploration.states
            ).index(
                logged_out_user_data.most_recently_reached_checkpoint_state_name
            )
        )

        if most_recently_reached_checkpoint_index_in_logged_in_progress < most_recently_reached_checkpoint_index_in_logged_out_progress: # pylint: disable=line-too-long
            logged_in_user_model.most_recently_reached_checkpoint_exp_version = ( # pylint: disable=line-too-long
                logged_out_user_data.most_recently_reached_checkpoint_exp_version # pylint: disable=line-too-long
            )
            logged_in_user_model.most_recently_reached_checkpoint_state_name = (
                logged_out_user_data.most_recently_reached_checkpoint_state_name
            )
            logged_in_user_model.furthest_reached_checkpoint_exp_version = (
                logged_out_user_data.furthest_reached_checkpoint_exp_version
            )
            logged_in_user_model.furthest_reached_checkpoint_state_name = (
                logged_out_user_data.furthest_reached_checkpoint_state_name
            )
            logged_in_user_model.update_timestamps()
            logged_in_user_model.put()

    elif (
        logged_in_user_model.most_recently_reached_checkpoint_exp_version <
        logged_out_user_data.most_recently_reached_checkpoint_exp_version
    ):
        most_recently_interacted_exploration = (
            exp_fetchers.get_exploration_by_id(
                exploration_id,
                strict=True,
                version=exp_user_data.most_recently_reached_checkpoint_exp_version # pylint: disable=line-too-long
            )
        )
        furthest_reached_exploration = (
            exp_fetchers.get_exploration_by_id(
                exploration_id,
                strict=True,
                version=exp_user_data.furthest_reached_checkpoint_exp_version
            )
        )

        recent_checkpoint_state_name = (
            exp_user_data.most_recently_reached_checkpoint_state_name
        )
        # Ruling out the possibility of None for mypy type checking.
        assert recent_checkpoint_state_name is not None
        most_recently_reached_checkpoint_in_current_exploration = (
            user_services.get_most_distant_reached_checkpoint_in_current_exploration( # pylint: disable=line-too-long
                user_services.get_checkpoints_in_order(
                    latest_exploration.init_state_name,
                    latest_exploration.states),
                user_services.get_checkpoints_in_order(
                    most_recently_interacted_exploration.init_state_name,
                    most_recently_interacted_exploration.states),
                recent_checkpoint_state_name
            )
        )

        furthest_checkpoint_state_name = (
            exp_user_data.furthest_reached_checkpoint_state_name
        )
        # Ruling out the possibility of None for mypy type checking.
        assert furthest_checkpoint_state_name is not None
        furthest_reached_checkpoint_in_current_exploration = (
            user_services.get_most_distant_reached_checkpoint_in_current_exploration( # pylint: disable=line-too-long
                user_services.get_checkpoints_in_order(
                    latest_exploration.init_state_name,
                    latest_exploration.states),
                user_services.get_checkpoints_in_order(
                    furthest_reached_exploration.init_state_name,
                    furthest_reached_exploration.states),
                furthest_checkpoint_state_name
            )
        )

        # If the most recently reached checkpoint doesn't exist in current
        # exploration.
        if (
            most_recently_reached_checkpoint_in_current_exploration !=
            exp_user_data.most_recently_reached_checkpoint_state_name
        ):
            exp_user_data.most_recently_reached_checkpoint_state_name = (
                most_recently_reached_checkpoint_in_current_exploration)
            exp_user_data.most_recently_reached_checkpoint_exp_version = (
                latest_exploration.version)

        # If the furthest reached checkpoint doesn't exist in current
        # exploration.
        if (
            furthest_reached_checkpoint_in_current_exploration !=
            exp_user_data.furthest_reached_checkpoint_state_name
        ):
            exp_user_data.furthest_reached_checkpoint_state_name = (
                furthest_reached_checkpoint_in_current_exploration)
            exp_user_data.furthest_reached_checkpoint_exp_version = (
                latest_exploration.version)

        recent_checkpoint_state_name = (
            exp_user_data.most_recently_reached_checkpoint_state_name
        )
        # Ruling out the possibility of None for mypy type checking.
        assert recent_checkpoint_state_name is not None
        most_recently_reached_checkpoint_index_in_logged_in_progress = (
            user_services.get_checkpoints_in_order(
                latest_exploration.init_state_name,
                latest_exploration.states
            ).index(
                recent_checkpoint_state_name
            )
        )

        most_recently_reached_checkpoint_index_in_logged_out_progress = (
            user_services.get_checkpoints_in_order(
                latest_exploration.init_state_name,
                latest_exploration.states
            ).index(
                logged_out_user_data.most_recently_reached_checkpoint_state_name
                ))

        if most_recently_reached_checkpoint_index_in_logged_in_progress < most_recently_reached_checkpoint_index_in_logged_out_progress: # pylint: disable=line-too-long
            logged_in_user_model.most_recently_reached_checkpoint_exp_version = ( # pylint: disable=line-too-long
                logged_out_user_data.most_recently_reached_checkpoint_exp_version # pylint: disable=line-too-long
            )
            logged_in_user_model.most_recently_reached_checkpoint_state_name = (
                logged_out_user_data.most_recently_reached_checkpoint_state_name
            )
            logged_in_user_model.furthest_reached_checkpoint_exp_version = (
                logged_out_user_data.furthest_reached_checkpoint_exp_version
            )
            logged_in_user_model.furthest_reached_checkpoint_state_name = (
                logged_out_user_data.furthest_reached_checkpoint_state_name
            )
            logged_in_user_model.update_timestamps()
            logged_in_user_model.put()


def set_exploration_edits_allowed(exp_id: str, edits_are_allowed: bool) -> None:
    """Toggled edits allowed field in the exploration.

    Args:
        exp_id: str. The ID of the exp.
        edits_are_allowed: boolean. Whether exploration edits are allowed.
    """
    exploration_model = exp_models.ExplorationModel.get(exp_id)
    exploration_model.edits_allowed = edits_are_allowed
    # Updating the edits_allowed field in an exploration should not result in a
    # version update. So put_multi is used instead of a commit.
    base_models.BaseModel.update_timestamps_multi([exploration_model])
    base_models.BaseModel.put_multi([exploration_model])
    caching_services.delete_multi(
        caching_services.CACHE_NAMESPACE_EXPLORATION, None, [exp_id])


def rollback_exploration_to_safe_state(exp_id: str) -> int:
    """Rolls back exploration to the latest state where related metadata
    models are valid.

    Args:
        exp_id: str. The ID of the exp.

    Returns:
        int. The version of the exploration.
    """
    exploration_model = exp_models.ExplorationModel.get(exp_id)
    current_version_in_exp_model = exploration_model.version
    last_known_safe_version: int = exploration_model.version
    snapshot_content_model = None
    snapshot_metadata_model = None
    models_to_delete: List[Union[
        exp_models.ExplorationSnapshotContentModel,
        exp_models.ExplorationSnapshotMetadataModel
    ]] = []
    for version in range(current_version_in_exp_model, 1, -1):
        snapshot_content_model = (
            exp_models.ExplorationSnapshotContentModel.get(
                '%s-%s' % (exp_id, version), strict=False))
        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                '%s-%s' % (exp_id, version), strict=False))
        if snapshot_content_model is None and snapshot_metadata_model is None:
            last_known_safe_version = version - 1
        elif (
            snapshot_content_model is None and
            snapshot_metadata_model is not None
        ):
            models_to_delete.append(snapshot_metadata_model)
            last_known_safe_version = version - 1
        elif (
            snapshot_content_model is not None and
            snapshot_metadata_model is None
        ):
            models_to_delete.append(snapshot_content_model)
            last_known_safe_version = version - 1
        else:
            break

    if last_known_safe_version != current_version_in_exp_model:
        exp_summary_model = exp_models.ExpSummaryModel.get(exp_id)
        exp_summary_model.version = last_known_safe_version
        safe_exp_model = exp_models.ExplorationModel.get(
            exp_id, strict=True, version=last_known_safe_version)
        safe_exp_model.version = last_known_safe_version
        base_models.BaseModel.update_timestamps_multi(
            [safe_exp_model, exp_summary_model])
        base_models.BaseModel.put_multi([safe_exp_model, exp_summary_model])
        base_models.BaseModel.delete_multi(models_to_delete)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION, None, [exp_id])
    return last_known_safe_version
