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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.domain import customization_args_util
from core.domain import exp_domain
from core.domain import html_validation_service
from core.domain import interaction_registry
from core.domain import state_domain
from core.platform import models
from extensions import domain
import python_utils
import schema_utils
import utils

(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])


def try_upgrading_draft_to_exp_version(
        draft_change_list, current_draft_version, to_exp_version, exp_id):
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
        InvalidInputException. current_draft_version is greater than
            to_exp_version.
    """
    if current_draft_version > to_exp_version:
        raise utils.InvalidInputException(
            'Current draft version is greater than the exploration version.')
    if current_draft_version == to_exp_version:
        return

    exp_versions = list(
        python_utils.RANGE(current_draft_version + 1, to_exp_version + 1))
    commits_list = (
        exp_models.ExplorationCommitLogEntryModel.get_multi(
            exp_id, exp_versions))
    upgrade_times = 0
    while current_draft_version + upgrade_times < to_exp_version:
        commit = commits_list[upgrade_times]
        if (
                len(commit.commit_cmds) != 1 or
                commit.commit_cmds[0]['cmd'] !=
                exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
            return
        conversion_fn_name = '_convert_states_v%s_dict_to_v%s_dict' % (
            commit.commit_cmds[0]['from_version'],
            commit.commit_cmds[0]['to_version'])
        if not hasattr(DraftUpgradeUtil, conversion_fn_name):
            logging.warning('%s is not implemented' % conversion_fn_name)
            return
        conversion_fn = getattr(DraftUpgradeUtil, conversion_fn_name)
        draft_change_list = conversion_fn(draft_change_list)
        upgrade_times += 1
    return draft_change_list


class DraftUpgradeUtil(python_utils.OBJECT):
    """Wrapper class that contains util functions to upgrade drafts."""

    @classmethod
    def _convert_states_v34_dict_to_v35_dict(cls, draft_change_list):
        """Converts draft change list from version 34 to 35. Version 35 adds
        translation support for interaction customization arguments. This
        migration converts customization arguments in changes with the property
        STATE_PROPERTY_INTERACTION_CUST_ARGS, by converting unicode to
        SubtitledUnicode and html to SubtitledHtml where appropraite.
        It also populates missing customization argument keys, removes extra
        customization arguments, normalizes customization arguments against its
        schema, and changes PencilCodeEditor's customization argument name from
        initial_code to initialCode. Additionally, ExplorationChange's are
        appended at the end to set the next content id index.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        new_draft_change_list = []
        state_name_to_next_content_id_index = {}

        for i, change in enumerate(draft_change_list):
            if (not change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY or
                    (not change.property_name ==
                     exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS)):
                new_draft_change_list.append(change)
                continue
            # Upgrade changes with property_name of
            # STATE_PROPERTY_INTERACTION_CUST_ARGS here.
            state_name = change.state_name
            if state_name not in state_name_to_next_content_id_index:
                state_name_to_next_content_id_index[state_name] = 0

            # Get the interaction id from the change before.
            assert (i-1 >= 0)
            prev_change = draft_change_list[i-1]
            assert (prev_change.cmd ==
                exp_domain.CMD_EDIT_STATE_PROPERTY)
            assert (prev_change.property_name ==
                exp_domain.STATE_PROPERTY_INTERACTION_ID)
            assert (prev_change.state_name == state_name)
            interaction_id = prev_change.new_value

            if interaction_id is not None:
                ca_dict = change.new_value
                # We need to retrieve an cached version of interaction_specs in
                # the case that interaction_specs.json changes in the future.
                ca_specs = [
                    domain.CustomizationArgSpec(
                        caSpecDict['name'],
                        caSpecDict['description'],
                        caSpecDict['schema'],
                        caSpecDict['default_value']
                    ) for caSpecDict in (
                        interaction_registry.Registry
                        .get_all_specs_for_state_schema_version(35)[
                            interaction_id]['customization_arg_specs']
                    )
                ]

                if (interaction_id == 'PencilCodeEditor' and
                        'initial_code' in ca_dict):
                    ca_dict['initialCode'] = ca_dict['initial_code']

                obj_type_to_subtitled_dict_key = {
                    'SubtitledUnicode': 'unicode_str',
                    'SubtitledHtml': 'html'
                }

                for ca_spec in ca_specs:
                    schema = ca_spec.schema
                    ca_name = ca_spec.name
                    content_id_prefix = 'ca_%s_' % ca_name

                    if schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM:
                        schema_obj_type = schema['obj_type']
                        if schema_obj_type in obj_type_to_subtitled_dict_key:
                            # Case where cust arg value is a string, and needs
                            # to be migrated to SubtitledHtml or
                            # SubtitledUnicode.
                            content_id = '%s%i' % (
                                content_id_prefix,
                                state_name_to_next_content_id_index[state_name])
                            state_name_to_next_content_id_index[state_name] += 1

                            subtitled_dict_key = (
                                obj_type_to_subtitled_dict_key[schema_obj_type]
                            )
                            if ca_name in ca_dict:
                                ca_dict[ca_name]['value'] = {
                                    'content_id': content_id,
                                    subtitled_dict_key:
                                        ca_dict[ca_name]['value']
                                }
                            else:
                                default_value = ca_spec.default_value[
                                    subtitled_dict_key]
                                ca_dict[ca_name] = {
                                    'value': {
                                        'content_id': content_id,
                                        subtitled_dict_key: default_value
                                    }
                                }
                    elif (schema['type'] == schema_utils.SCHEMA_TYPE_LIST and
                          (schema['items']['type'] ==
                           schema_utils.SCHEMA_TYPE_CUSTOM) and
                          (schema['items']['obj_type'] ==
                           schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML)):
                        # Case where cust arg value is a list of strings, and
                        # needs to be migrated to a list of SubtitledHtml dicts.
                        use_default_value = ca_name not in ca_dict

                        value = (ca_spec.default_value if use_default_value
                            else ca_dict[ca_name]['value'])
                        new_value = []

                        for i, html in enumerate(value):
                            content_id = '%s%i' % (
                                content_id_prefix,
                                state_name_to_next_content_id_index[state_name])
                            state_name_to_next_content_id_index[state_name] += 1

                            if use_default_value and i == 0:
                                # If we use default value, then the first
                                # value is already a SubtitledHtml dict and we
                                # just need to assign a content_id.
                                new_value.append({
                                    'content_id': content_id,
                                    'html': value[0]['html']
                                })
                            else:
                                new_value.append({
                                    'content_id': content_id,
                                    'html': html
                                })

                        ca_dict[ca_name]['value'] = new_value
                    elif ca_name not in ca_dict:
                        ca_dict[ca_name] = {'value': ca_spec.default_value}

                (customization_args_util
                 .validate_customization_args_and_values(
                     'interaction',
                     interaction_id,
                     ca_dict,
                     ca_specs)
                )

            new_draft_change_list.append(change)

        # Append STATE_PROPERTY_NEXT_CONTENT_ID_INDEX changes at end for each
        # state encountered while upgrading customization argument changes.
        for state_name in state_name_to_next_content_id_index:
            new_draft_change_list.append(
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name':
                        exp_domain.STATE_PROPERTY_NEXT_CONTENT_ID_INDEX,
                    'state_name': state_name,
                    'new_value': state_name_to_next_content_id_index[state_name]
                })
            )

        return new_draft_change_list

    @classmethod
    def _convert_states_v33_dict_to_v34_dict(cls, draft_change_list):
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
        for i, change in enumerate(draft_change_list):
            new_value = None
            if not change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                continue
            # The change object has the key 'new_value' only if the
            # cmd is 'CMD_EDIT_STATE_PROPERTY' or
            # 'CMD_EDIT_EXPLORATION_PROPERTY'.
            new_value = change.new_value
            if change.property_name == exp_domain.STATE_PROPERTY_CONTENT:
                new_value['html'] = conversion_fn(new_value['html'])
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                # Only customization args with the key 'choices' have HTML
                # content in them.
                if 'choices' in new_value.keys():
                    for value_index, value in enumerate(
                            new_value['choices']['value']):
                        new_value['choices']['value'][value_index] = (
                            conversion_fn(value))
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_WRITTEN_TRANSLATIONS):
                for content_id, language_code_to_written_translation in (
                        new_value['translations_mapping'].items()):
                    for language_code in (
                            language_code_to_written_translation.keys()):
                        new_value['translations_mapping'][
                            content_id][language_code]['html'] = (
                                conversion_fn(new_value[
                                    'translations_mapping'][content_id][
                                        language_code]['html'])
                            )
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME):
                new_value = (
                    state_domain.Outcome.convert_html_in_outcome(
                        new_value, conversion_fn))
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_HINTS):
                new_value = [
                    (state_domain.Hint.convert_html_in_hint(
                        hint_dict, conversion_fn))
                    for hint_dict in new_value]
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION):
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
                                    if isinstance(
                                            answer_html, python_utils.UNICODE):
                                        new_value['correct_answer'][list_index][
                                            answer_html_index] = (
                                                conversion_fn(answer_html))
            elif (change.property_name ==
                  exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                new_value = [
                    (state_domain.AnswerGroup.convert_html_in_answer_group(
                        answer_group, conversion_fn))
                    for answer_group in new_value]
            if new_value is not None:
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': change.cmd,
                    'property_name': change.property_name,
                    'state_name': change.state_name,
                    'new_value': new_value
                })
        return draft_change_list

    @classmethod
    def _convert_states_v32_dict_to_v33_dict(cls, draft_change_list):
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
                if change.new_value.keys() == ['choices']:
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
    def _convert_states_v31_dict_to_v32_dict(cls, draft_change_list):
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
    def _convert_states_v30_dict_to_v31_dict(cls, draft_change_list):
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
                # Get the language code to access the language code correctly.
                new_voiceovers_mapping = change.new_value['voiceovers_mapping']
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
    def _convert_states_v29_dict_to_v30_dict(cls, draft_change_list):
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
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                    'state_name': change.state_name,
                    'new_value': {
                        'rule_specs': change.new_value['rule_specs'],
                        'outcome': change.new_value['outcome'],
                        'training_data': change.new_value['training_data'],
                        'tagged_skill_misconception_id': None
                    }
                })
        return draft_change_list

    @classmethod
    def _convert_states_v28_dict_to_v29_dict(cls, draft_change_list):
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
    def _convert_states_v27_dict_to_v28_dict(cls, draft_change_list):
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
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
                    'state_name': change.state_name,
                    'new_value': {
                        'voiceovers_mapping': change.new_value
                    }
                })

        return draft_change_list
