# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Commands that can be used to upgrade draft to newer Exploration versions."""

from __future__ import annotations

import logging

from core import utils
from core.domain import exp_domain
from core.domain import html_validation_service
from core.domain import rules_registry
from core.domain import state_domain
from core.platform import models

from typing import Callable, List, Optional, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


AllowedDraftChangeListTypes = Union[
    state_domain.SubtitledHtmlDict,
    state_domain.CustomizationArgsDictType,
    state_domain.OutcomeDict,
    List[state_domain.HintDict],
    state_domain.SolutionDict,
    List[state_domain.AnswerGroupDict],
    str
]


class InvalidDraftConversionException(Exception):
    """Error class for invalid draft conversion. Should be raised in a draft
    conversion function if it is not possible to upgrade a draft, and indicates
    that try_upgrading_draft_to_exp_version should return None.
    """

    pass


def try_upgrading_draft_to_exp_version(
    draft_change_list: List[exp_domain.ExplorationChange],
    current_draft_version: int,
    to_exp_version: int,
    exp_id: str
) -> Optional[List[exp_domain.ExplorationChange]]:
    """Try upgrading a list of ExplorationChange domain objects to match the
    latest exploration version.

    For now, this handles the scenario where all commits between
    current_draft_version and to_exp_version migrate only the state schema.

    Args:
        draft_change_list: list(ExplorationChange). The list of
            ExplorationChange domain objects to upgrade.
        current_draft_version: int. Current draft version.
        to_exp_version: int. Target exploration version.
        exp_id: str. Exploration id.

    Returns:
        list(ExplorationChange) or None. A list of ExplorationChange domain
        objects after upgrade or None if upgrade fails.

    Raises:
        InvalidInputException. The current_draft_version is greater than
            to_exp_version.
    """
    if current_draft_version > to_exp_version:
        raise utils.InvalidInputException(
            'Current draft version is greater than the exploration version.')
    if current_draft_version == to_exp_version:
        return None

    exp_versions = list(range(current_draft_version + 1, to_exp_version + 1))
    commits_list = (
        exp_models.ExplorationCommitLogEntryModel.get_multi(
            exp_id, exp_versions))
    upgrade_times = 0
    while current_draft_version + upgrade_times < to_exp_version:
        commit = commits_list[upgrade_times]
        # Here we are assured that the commit is never going to be None, because
        # every time a commit to ExplorationModel or ExplorationRightsModel
        # occurs an instance of ExplorationCommitLogEntryModel is saved. Even
        # if we create an exploration, a commit occurs.
        assert commit is not None
        if (
                len(commit.commit_cmds) != 1 or
                commit.commit_cmds[0]['cmd'] !=
                exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
            return None
        conversion_fn_name = '_convert_states_v%s_dict_to_v%s_dict' % (
            commit.commit_cmds[0]['from_version'],
            commit.commit_cmds[0]['to_version'])
        if not hasattr(DraftUpgradeUtil, conversion_fn_name):
            logging.warning('%s is not implemented' % conversion_fn_name)
            return None
        conversion_fn = getattr(DraftUpgradeUtil, conversion_fn_name)
        try:
            draft_change_list = conversion_fn(draft_change_list)
        except InvalidDraftConversionException:
            return None
        upgrade_times += 1
    return draft_change_list


class DraftUpgradeUtil:
    """Wrapper class that contains util functions to upgrade drafts."""

    @classmethod
    def _convert_html_in_draft_change_list(
        cls,
        draft_change_list: List[exp_domain.ExplorationChange],
        conversion_fn: Callable[[str], str]
    ) -> List[exp_domain.ExplorationChange]:
        """Applies a conversion function on all HTML fields in the provided
        draft change list.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.
            conversion_fn: function. The function to be used for converting the
                HTML.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if not change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                continue
            # The change object has the key 'new_value' only if the
            # cmd is 'CMD_EDIT_STATE_PROPERTY' or
            # 'CMD_EDIT_EXPLORATION_PROPERTY'.
            new_value: AllowedDraftChangeListTypes = change.new_value
            if change.property_name == exp_domain.STATE_PROPERTY_CONTENT:
                # Here we use cast because this 'if' condition forces
                # change to have type EditExpStatePropertyContentCmd.
                edit_content_property_cmd = cast(
                    exp_domain.EditExpStatePropertyContentCmd,
                    change
                )
                new_value = edit_content_property_cmd.new_value
                new_value['html'] = conversion_fn(new_value['html'])
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                # Only customization args with the key 'choices' have HTML
                # content in them.
                # Here we use cast because this 'elif' condition forces change
                # to have type EditExpStatePropertyInteractionCustArgsCmd.
                edit_interaction_cust_args_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionCustArgsCmd,
                    change
                )
                new_value = edit_interaction_cust_args_cmd.new_value
                if 'choices' in new_value.keys():
                    # Here we use cast because we are narrowing down the type
                    # from various customization args value types to List[
                    # SubtitledHtmlDict] type, and this is done because here
                    # we are accessing 'choices' keys over customization_args
                    # and every customization arg that has a 'choices' key will
                    # contain values of type List[SubtitledHtmlDict].
                    subtitled_html_new_value_dicts = cast(
                        List[state_domain.SubtitledHtmlDict],
                        new_value['choices']['value']
                    )
                    for value_index, value in enumerate(
                        subtitled_html_new_value_dicts
                    ):
                        if isinstance(value, dict) and 'html' in value:
                            subtitled_html_new_value_dicts[value_index][
                                'html'
                            ] = conversion_fn(value['html'])
                        elif isinstance(value, str):
                            subtitled_html_new_value_dicts[value_index] = (
                                conversion_fn(value)
                            )
            elif change.property_name == 'written_translations':
                # Here we use MyPy ignore because the latest schema of state
                # dict doesn't contains translations_mapping of
                # written_translations property.
                translations_mapping = change.new_value['translations_mapping'] # type: ignore[index]
                assert isinstance(translations_mapping, dict)
                for content_id, language_code_to_written_translation in (
                        translations_mapping.items()):
                    for language_code in (
                            language_code_to_written_translation.keys()):
                        translation_dict = translations_mapping[
                            content_id][language_code]
                        if 'html' in translation_dict:
                            translations_mapping[
                                content_id][language_code]['html'] = (
                                    conversion_fn(
                                        translations_mapping[content_id][
                                            language_code]['html'])
                                )
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME and
                  new_value is not None):
                # Here we use cast because this 'elif' condition forces change
                # to have type EditExpStatePropertyInteractionDefaultOutcomeCmd.
                edit_interaction_default_outcome_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionDefaultOutcomeCmd,
                    change
                )
                new_value = (
                    state_domain.Outcome.convert_html_in_outcome(
                        edit_interaction_default_outcome_cmd.new_value,
                        conversion_fn
                    )
                )
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_HINTS):
                # Here we use cast because this 'elif' condition forces change
                # to have type EditExpStatePropertyInteractionHintsCmd.
                edit_interaction_hints_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionHintsCmd,
                    change
                )
                hint_dicts = edit_interaction_hints_cmd.new_value
                new_value = [
                    (state_domain.Hint.convert_html_in_hint(
                        hint_dict, conversion_fn))
                    for hint_dict in hint_dicts]
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION and
                  new_value is not None):
                # Here we use cast because this 'elif' condition forces change
                # to have type EditExpStatePropertyInteractionSolutionCmd.
                edit_interaction_solution_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionSolutionCmd,
                    change
                )
                new_value = edit_interaction_solution_cmd.new_value
                new_value['explanation']['html'] = (
                    conversion_fn(new_value['explanation']['html']))
                # TODO(#9413): Find a way to include a reference to the
                # interaction type in the Draft change lists.
                # See issue: https://github.com/oppia/oppia/issues/9413.
                # currently, only DragAndDropSortInput interaction allows
                # solution correct answers having HTML in them.
                # This code below should be updated if any new interaction
                # is allowed to have HTML in the solution correct answer
                # The typecheckings below can be avoided once #9413 is fixed.
                if new_value['correct_answer']:
                    if isinstance(new_value['correct_answer'], list):
                        for list_index, html_list in enumerate(
                                new_value['correct_answer']):
                            if isinstance(html_list, list):
                                for answer_html_index, answer_html in enumerate(
                                        html_list):
                                    if isinstance(answer_html, str):
                                        # Here we use cast because all
                                        # of the above 'if' conditions
                                        # forces 'correct_answer' to be
                                        # of type List[List[str]].
                                        correct_answer = cast(
                                            List[List[str]],
                                            new_value['correct_answer']
                                        )
                                        correct_answer[list_index][
                                            answer_html_index] = (
                                                conversion_fn(answer_html))
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                html_field_types_to_rule_specs = (
                    rules_registry.Registry.get_html_field_types_to_rule_specs(
                        state_schema_version=41))
                # Here we use cast because this 'elif' condition forces change
                # to have type EditExpStatePropertyInteractionAnswerGroupsCmd.
                edit_interaction_answer_groups_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionAnswerGroupsCmd,
                    change
                )
                answer_group_dicts = (
                    edit_interaction_answer_groups_cmd.new_value
                )
                new_value = [
                    state_domain.AnswerGroup.convert_html_in_answer_group(
                        answer_group, conversion_fn,
                        html_field_types_to_rule_specs
                    )
                    for answer_group in answer_group_dicts]
            if new_value is not None:
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': change.cmd,
                    'property_name': change.property_name,
                    'state_name': change.state_name,
                    'new_value': new_value
                })
        return draft_change_list

    @classmethod
    def _convert_states_v55_dict_to_v56_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 55 to 56. Version 56
        adds an inapplicable_skill_misconception_ids list property to the
        state.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v54_dict_to_v55_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 54 to 55. Version 55
        changes content ids for content and removes written_translation property
        form the state, converting draft to anew version won't be possible.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        for exp_change in draft_change_list:
            if exp_change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')
        return draft_change_list

    @classmethod
    def _convert_states_v53_dict_to_v54_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 53 to 54. State
        version 54 adds catchMisspellings customization_arg to TextInput
        interaction. As this is a new property and therefore
        doesn't affect any pre-existing drafts, there should be
        no changes to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v52_dict_to_v53_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts from version 52 to 53. Version 53 fixes general
        state, interaction and rte data. This will update the drafts
        for state and RTE part but won't be able to do for interaction.
        The `ExplorationChange` object for interaction is divided into
        further properties and we won't be able to collect enough info
        to update the draft.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        drafts_to_remove = [
            exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            exp_domain.STATE_PROPERTY_INTERACTION_STICKY,
            exp_domain.STATE_PROPERTY_INTERACTION_HANDLERS,
            exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS,
            exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME,
            exp_domain.STATE_PROPERTY_INTERACTION_HINTS,
            exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION,
        ]
        for exp_change in draft_change_list:
            if exp_change.cmd != exp_domain.CMD_EDIT_STATE_PROPERTY:
                continue

            if exp_change.property_name in drafts_to_remove:
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')

            if exp_change.property_name == exp_domain.STATE_PROPERTY_CONTENT:
                # Ruling out the possibility of any other type for mypy
                # type checking.
                assert isinstance(exp_change.new_value, dict)
                html = exp_change.new_value['html']
                html = exp_domain.Exploration.fix_content(html)
                exp_change.new_value['html'] = html

            elif exp_change.property_name == (
                exp_domain.DEPRECATED_STATE_PROPERTY_WRITTEN_TRANSLATIONS
            ):
                # Ruling out the possibility of any other type for mypy
                # type checking.
                assert isinstance(exp_change.new_value, dict)
                written_translations = exp_change.new_value

                for translations in (
                    written_translations['translations_mapping'].values()
                ):
                    for written_translation in translations.values():
                        if written_translation['data_format'] == 'html':
                            if isinstance(
                                written_translation['translation'], list
                            ):
                                # Translation of type html should only be str,
                                # cannot be of type list.
                                raise InvalidDraftConversionException(
                                    'Conversion cannot be completed.')

                            fixed_translation = (
                                exp_domain.Exploration.fix_content(
                                    written_translation['translation']))
                            written_translation['translation'] = (
                                fixed_translation)
        return draft_change_list

    @classmethod
    def _convert_states_v51_dict_to_v52_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts from version 51 to 52. Version 52 fixes content IDs
        in translations and voiceovers (some content IDs are removed).
        We discard drafts that work with content IDs to make sure that they
        don't contain content IDs that were removed.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        for exp_change in draft_change_list:
            if exp_change.cmd in (
                (
                    exp_domain.
                    DEPRECATED_CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE
                ),
                (
                    exp_domain.
                    DEPRECATED_CMD_MARK_WRITTEN_TRANSLATION_AS_NEEDING_UPDATE
                ),
                exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                exp_domain.DEPRECATED_CMD_ADD_TRANSLATION,
            ):
                # All cmds above somehow work with content IDs and as in
                # the 51 to 52 conversion we remove some content IDs we raise
                # an exception so that these drafts are removed.
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')
            if exp_change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                if (
                    exp_change.property_name ==
                    exp_domain.DEPRECATED_STATE_PROPERTY_NEXT_CONTENT_ID_INDEX
                ):
                    # If we change the next content ID index in the draft
                    # we rather remove it as in the 51 to 52 conversion
                    # we remove some content IDs.
                    raise InvalidDraftConversionException(
                        'Conversion cannot be completed.')
        return draft_change_list

    @classmethod
    def _convert_states_v50_dict_to_v51_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 50 to 51. Adds
        a new field dest_if_really_stuck to Outcome class to direct the
        learner to a custom revision state.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                # Here we use cast because this 'if' condition forces change to
                # have type EditExpStatePropertyInteractionAnswerGroupsCmd.
                edit_interaction_answer_groups_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionAnswerGroupsCmd,
                    change
                )
                new_answer_groups_dicts = (
                    edit_interaction_answer_groups_cmd.new_value
                )
                answer_group_dicts: List[state_domain.AnswerGroupDict] = []
                for answer_group_dict in new_answer_groups_dicts:
                    outcome_dict: state_domain.OutcomeDict = ({
                        'dest': answer_group_dict['outcome']['dest'],
                        'dest_if_really_stuck': None,
                        'feedback': (
                            answer_group_dict['outcome']['feedback']),
                        'labelled_as_correct': (
                            answer_group_dict
                                ['outcome']['labelled_as_correct']),
                        'param_changes': (
                            answer_group_dict['outcome']['param_changes']),
                        'refresher_exploration_id': (
                            answer_group_dict
                                ['outcome']['refresher_exploration_id']),
                        'missing_prerequisite_skill_id': (
                            answer_group_dict['outcome']
                                ['missing_prerequisite_skill_id'])
                    })
                    answer_group_dicts.append({
                        'rule_specs': answer_group_dict['rule_specs'],
                        'outcome': outcome_dict,
                        'training_data': answer_group_dict['training_data'],
                        'tagged_skill_misconception_id': None
                    })
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                    'state_name': change.state_name,
                    'new_value': answer_group_dicts
                })
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME and
                  change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY):
                # Here we use cast because this 'elif' condition forces change
                # to have type EditExpStatePropertyInteractionDefaultOutcomeCmd.
                edit_interaction_default_outcome_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionDefaultOutcomeCmd,
                    change
                )
                new_default_outcome_dict = (
                    edit_interaction_default_outcome_cmd.new_value
                )
                default_outcome_dict: state_domain.OutcomeDict = ({
                    'dest': new_default_outcome_dict['dest'],
                    'dest_if_really_stuck': None,
                    'feedback': new_default_outcome_dict['feedback'],
                    'labelled_as_correct': (
                        new_default_outcome_dict['labelled_as_correct']),
                    'param_changes': (
                        new_default_outcome_dict['param_changes']),
                    'refresher_exploration_id': (
                        new_default_outcome_dict['refresher_exploration_id']),
                    'missing_prerequisite_skill_id': (
                        new_default_outcome_dict
                            ['missing_prerequisite_skill_id'])
                })
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
                    'state_name': change.state_name,
                    'new_value': default_outcome_dict
                })
        return draft_change_list

    @classmethod
    def _convert_states_v49_dict_to_v50_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 49 to 50. State
        version 50 removes rules from explorations that use one of the following
        rules: [ContainsSomeOf, OmitsSomeOf, MatchesWithGeneralForm]. It also
        renames `customOskLetters` cust arg to `allowedVariables`. This should
        not affect drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v48_dict_to_v49_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 48 to 49. State
        version 49 adds requireNonnegativeInput customization_arg to
        NumericInput interaction.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v47_dict_to_v48_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 47 to 48. State
        version 48 fixes encoding issues in HTML fields.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        conversion_fn = (
            html_validation_service.fix_incorrectly_encoded_chars)
        return cls._convert_html_in_draft_change_list(
            draft_change_list, conversion_fn)

    @classmethod
    def _convert_states_v46_dict_to_v47_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 46 to 47. State
        version 47 deprecates oppia-noninteractive-svgdiagram tag and converts
        existing occurences of it to oppia-noninteractive-image tag.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        conversion_fn = (
            html_validation_service.convert_svg_diagram_tags_to_image_tags)
        return cls._convert_html_in_draft_change_list(
            draft_change_list, conversion_fn)

    @classmethod
    def _convert_states_v45_dict_to_v46_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 45 to 46. State
        version 46 ensures that written translations corresponding to
        unicode text have data_format field set to 'unicode' and that they
        do not contain any HTML tags. This should not affect drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v44_dict_to_v45_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 44 to 45. State
        version 45 adds a linked skill id property to the
        state. As this is a new property and therefore doesn't affect any
        pre-existing drafts, there should be no changes to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v43_dict_to_v44_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 43 to 44. State
        version 44 adds card_is_checkpoint boolean variable to the
        state, for which there should be no changes to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v42_dict_to_v43_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 42 to 43.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        for change in draft_change_list:
            if (change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                # Converting the answer groups depends on getting an
                # exploration state of v42, because we need an interaction's
                # customization arguments to properly convert ExplorationChanges
                # that set DragAndDropSortInput and ItemSelectionInput rules.
                # Since we do not yet support passing an exploration state of a
                # given version into draft conversion functions, we throw an
                # Exception to indicate that the conversion cannot be completed.
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')
        return draft_change_list

    @classmethod
    def _convert_states_v41_dict_to_v42_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 41 to 42.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        for change in draft_change_list:
            if (change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                # Converting the answer groups depends on getting an
                # exploration state of v41, because we need an interaction's
                # customization arguments to properly convert ExplorationChanges
                # that set DragAndDropSortInput and ItemSelectionInput rules.
                # Since we do not yet support passing an exploration state of a
                # given version into draft conversion functions, we throw an
                # Exception to indicate that the conversion cannot be completed.
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')
        return draft_change_list

    @classmethod
    def _convert_states_v40_dict_to_v41_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 40 to 41.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        for change in draft_change_list:
            if (change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                # Converting the answer groups depends on getting an
                # exploration state of v40, because we need an interaction's id
                # to properly convert ExplorationChanges that set answer groups.
                # Since we do not yet support passing an exploration state of a
                # given version into draft conversion functions, we throw an
                # Exception to indicate that the conversion cannot be completed.
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')
        return draft_change_list

    @classmethod
    def _convert_states_v39_dict_to_v40_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 39 to 40.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. The conversion cannot be
                completed.
        """
        for change in draft_change_list:
            if (change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                # Converting the answer groups depends on getting an
                # exploration state of v38, because we need an interaction's id
                # to properly convert ExplorationChanges that set answer groups.
                # Since we do not yet support passing an exploration state of a
                # given version into draft conversion functions, we throw an
                # Exception to indicate that the conversion cannot be completed.
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')
        return draft_change_list

    @classmethod
    def _convert_states_v38_dict_to_v39_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 38 to 39. State
        version 39 adds a customization arg for the Numeric Expression Input
        interactions that allows creators to modify the placeholder text,
        for which there should be no changes to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v37_dict_to_v38_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 37 to 38. State
        version 38 adds a customization arg for the Math interactions that
        allows creators to specify the letters that would be displayed to the
        learner, for which there should be no changes to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v36_dict_to_v37_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from version 36 to 37.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for change in draft_change_list:
            if (change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                # Here we use cast because this 'if' condition forces change to
                # have type EditExpStatePropertyInteractionAnswerGroupsCmd.
                edit_interaction_answer_groups_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionAnswerGroupsCmd,
                    change
                )
                answer_group_dicts = (
                    edit_interaction_answer_groups_cmd.new_value
                )
                for answer_group_dict in answer_group_dicts:
                    for rule_spec_dict in answer_group_dict['rule_specs']:
                        if rule_spec_dict['rule_type'] == 'CaseSensitiveEquals':
                            rule_spec_dict['rule_type'] = 'Equals'

        return draft_change_list

    @classmethod
    def _convert_states_v35_dict_to_v36_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from version 35 to 36.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. Conversion cannot be completed.
        """
        for change in draft_change_list:
            if (change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                # Converting the customization arguments depends on getting an
                # exploration state of v35, because we need an interaction's id
                # to properly convert ExplorationChanges that set customization
                # arguments. Since we do not yet support passing
                # an exploration state of a given version into draft conversion
                # functions, we throw an Exception to indicate that the
                # conversion cannot be completed.
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')
        return draft_change_list

    @classmethod
    def _convert_states_v34_dict_to_v35_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 34 to 35. State
        version 35 upgrades all explorations that use the MathExpressionInput
        interaction to use one of AlgebraicExpressionInput,
        NumericExpressionInput, or MathEquationInput interactions. There should
        be no changes to the draft for this migration.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.

        Raises:
            InvalidDraftConversionException. Conversion cannot be completed.
        """
        for change in draft_change_list:
            # We don't want to migrate any changes that involve the
            # MathExpressionInput interaction.
            interaction_id_change_condition = (
                change.property_name ==
                exp_domain.STATE_PROPERTY_INTERACTION_ID and (
                    change.new_value == 'MathExpressionInput'))
            answer_groups_change_condition = (
                change.property_name ==
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS and
                isinstance(change.new_value, list) and (
                    change.new_value[0]['rule_specs'][0]['rule_type'] == (
                        'IsMathematicallyEquivalentTo')
                )
            )
            if interaction_id_change_condition or (
                    answer_groups_change_condition):
                raise InvalidDraftConversionException(
                    'Conversion cannot be completed.')

        return draft_change_list

    @classmethod
    def _convert_states_v33_dict_to_v34_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 33 to 34. State
        version 34 adds the new schema for Math components.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        conversion_fn = (
            html_validation_service.add_math_content_to_math_rte_components)
        return cls._convert_html_in_draft_change_list(
            draft_change_list, conversion_fn)

    @classmethod
    def _convert_states_v32_dict_to_v33_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 32 to 33. State
        version 33 adds showChoicesInShuffledOrder boolean variable to the
        MultipleChoiceInput interaction.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                # Ruling out the possibility of any other type for mypy
                # type checking.
                assert isinstance(change.new_value, dict)
                if list(change.new_value.keys()) == ['choices']:
                    change.new_value['showChoicesInShuffledOrder'] = {
                        'value': False
                    }
                    draft_change_list[i] = exp_domain.ExplorationChange({
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS),
                        'state_name': change.state_name,
                        'new_value': change.new_value
                    })
        return draft_change_list

    @classmethod
    def _convert_states_v31_dict_to_v32_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 31 to 32. State
        version 32 adds a customization arg for the "Add" button text
        in SetInput interaction, for which there should be no changes
        to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v30_dict_to_v31_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 30 to 31. State
        Version 31 adds the duration_secs float for the Voiceover
        section of state.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS):
                # Here we use cast because this 'if' condition forces change to
                # have type EditExpStatePropertyRecordedVoiceoversCmd.
                edit_recorded_voiceovers_cmd = cast(
                    exp_domain.EditExpStatePropertyRecordedVoiceoversCmd,
                    change
                )
                recorded_voiceovers_dict = (
                    edit_recorded_voiceovers_cmd.new_value
                )
                new_voiceovers_mapping = recorded_voiceovers_dict[
                    'voiceovers_mapping'
                ]
                # Initialize the value to migrate draft state to v31.
                language_codes_to_audio_metadata = (
                    new_voiceovers_mapping.values())
                for language_codes in language_codes_to_audio_metadata:
                    for audio_metadata in language_codes.values():
                        audio_metadata['duration_secs'] = 0.0
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
                    'state_name': change.state_name,
                    'new_value': {
                        'voiceovers_mapping': new_voiceovers_mapping
                    }
                })
        return draft_change_list

    @classmethod
    def _convert_states_v29_dict_to_v30_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 29 to 30. State
        version 30 replaces tagged_misconception_id with
        tagged_skill_misconception_id.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                # Here we use cast because this 'if' condition forces change to
                # have type EditExpStatePropertyInteractionAnswerGroupsCmd.
                edit_interaction_answer_groups_cmd = cast(
                    exp_domain.EditExpStatePropertyInteractionAnswerGroupsCmd,
                    change
                )
                new_answer_groups_dicts = (
                    edit_interaction_answer_groups_cmd.new_value
                )
                answer_group_dicts: List[state_domain.AnswerGroupDict] = []
                for answer_group_dict in new_answer_groups_dicts:
                    answer_group_dicts.append({
                        'rule_specs': answer_group_dict['rule_specs'],
                        'outcome': answer_group_dict['outcome'],
                        'training_data': answer_group_dict['training_data'],
                        'tagged_skill_misconception_id': None
                    })
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                    'state_name': change.state_name,
                    'new_value': answer_group_dicts
                })
        return draft_change_list

    @classmethod
    def _convert_states_v28_dict_to_v29_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 28 to 29. State
        version 29 adds solicit_answer_details boolean variable to the
        state, for which there should be no changes to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v27_dict_to_v28_dict(
        cls, draft_change_list: List[exp_domain.ExplorationChange]
    ) -> List[exp_domain.ExplorationChange]:
        """Converts draft change list from state version 27 to 28. State
        version 28 replaces content_ids_to_audio_translations with
        recorded_voiceovers.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS_DEPRECATED):  # pylint: disable=line-too-long
                # Here we use cast because this 'if'
                # condition forces change to have type
                # EditExpStatePropertyContentIdToAudioTranslationsDeprecatedCmd.
                content_ids_to_audio_translations_cmd = cast(
                    exp_domain.EditExpStatePropertyContentIdsToAudioTranslationsDeprecatedCmd,  # pylint: disable=line-too-long
                    change
                )
                voiceovers_dict = (
                    content_ids_to_audio_translations_cmd.new_value
                )
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
                    'state_name': change.state_name,
                    'new_value': {
                        'voiceovers_mapping': voiceovers_dict
                    }
                })

        return draft_change_list
