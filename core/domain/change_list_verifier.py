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

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import email_manager

import feconf
import python_utils

class ExplorationChangeMergeVerifier(python_utils.OBJECT):
    """Class to check for mergeability."""

    def __init__(self, composite_change_list):

        # Added_state_names: list(str). Names of the states added to the
        # exploration from prev_exp_version to current_exp_version. It
        # stores the latest name of the added state.
        added_state_names = []

        # Deleted_state_names: list(str). Names of the states deleted from
        # the exploration from prev_exp_version to current_exp_version.
        # It stores the initial name of the deleted state from
        # pre_exp_version.
        deleted_state_names = []

        # New_to_old_state_names: dict. Dictionary mapping state names of
        # current_exp_version to the state names of prev_exp_version.
        # It doesn't include the name changes of added/deleted states.
        new_to_old_state_names = {}

        # Changed_properties: dict. List of all the properties changed
        # according to the state and property name.
        changed_properties = {}

        # Changed_translations: dict. List of all the translations changed
        # according to the state and content_id name.
        changed_translations = {}

        for change in composite_change_list:
            if change.cmd == exp_domain.CMD_ADD_STATE:
                added_state_names.append(change.state_name)
            elif change.cmd == exp_domain.CMD_DELETE_STATE:
                state_name = change.state_name
                if state_name in added_state_names:
                    added_state_names.remove(state_name)
                else:
                    original_state_name = state_name
                    if original_state_name in new_to_old_state_names:
                        original_state_name = new_to_old_state_names.pop(
                            original_state_name)
                    deleted_state_names.append(original_state_name)
            elif change.cmd == exp_domain.CMD_RENAME_STATE:
                old_state_name = change.old_state_name
                new_state_name = change.new_state_name
                if old_state_name in added_state_names:
                    added_state_names.remove(old_state_name)
                    added_state_names.append(new_state_name)
                elif old_state_name in new_to_old_state_names:
                    new_to_old_state_names[new_state_name] = (
                        new_to_old_state_names.pop(old_state_name))
                else:
                    new_to_old_state_names[new_state_name] = old_state_name

            elif change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                # A condition to store the name of the properties changed
                # in changed_properties dict.
                state_name = change.state_name
                if state_name in new_to_old_state_names:
                    state_name = new_to_old_state_names[change.state_name]
                if state_name in changed_properties:
                    if (change.property_name not in
                            changed_properties[state_name]):
                        changed_properties[state_name].append(
                            change.property_name)
                else:
                    changed_properties[state_name] = [change.property_name]
            elif change.cmd == exp_domain.CMD_ADD_WRITTEN_TRANSLATION:
                changed_property = None
                if change.content_id == 'content':
                    changed_property = 'content'
                elif change.content_id[:14] == 'ca_placeholder':
                    changed_property = 'widget_customization_args'
                elif change.content_id == 'default_outcome':
                    changed_property = 'default_outcome'
                elif change.content_id == 'solution':
                    changed_property = 'solution'
                elif change.content_id[:4] == 'hint':
                    changed_property = 'hints'
                elif change.content_id[:8] == 'feedback':
                    changed_property = 'answer_groups'
                elif change.content_id[:10] == 'rule_input':
                    changed_property = 'answer_groups'
                # A condition to store the name of the properties changed
                # in changed_properties dict.
                state_name = change.state_name
                if state_name in new_to_old_state_names:
                    state_name = new_to_old_state_names[change.state_name]
                if state_name in changed_translations:
                    if (changed_property not in
                            changed_translations[state_name]):
                        changed_translations[state_name].append(
                            changed_property)
                else:
                    changed_translations[state_name] = [changed_property]
                if state_name in changed_properties:
                    if ('written_translations' not in
                            changed_properties[state_name]):
                        changed_properties[state_name].append(
                            'written_translations')
                else:
                    changed_properties[state_name] = [
                        'written_translations']

        self.added_state_names = added_state_names
        self.deleted_state_names = deleted_state_names
        self.new_to_old_state_names = new_to_old_state_names
        self.changed_properties = changed_properties
        self.changed_translations = changed_translations

    # NOTE: List PROPERTIES_RELATED_TO_CUST_ARGS,
    # PROPERTIES_RELATED_TO_ANSWER_GROUPS, and
    # PROPERTIES_RELATED_TO_SOLUTION should remain separate lists
    # irrespective of its content. This is because they are for
    # different unique properties so if in the future any new
    # property is added which is affected by that unique property
    # only then in that case we'll add that property name in the
    # list of that unique property only. Therefore we can not keep
    # a common list.

    # PROPERTIES_RELATED_TO_CUST_ARGS: List of the properties
    # related (affected by or affecting) customization args. This list
    # can be changed when any new property is added or deleted which
    # affects or is affected by customization args.
    PROPERTIES_RELATED_TO_CUST_ARGS = ['solution', 'recorded_voiceovers',
                                        'answer_groups',
                                        'widget_customization_args']

    # PROPERTIES_RELATED_TO_ANSWER_GROUPS: List of the properties
    # related (affected by or affecting) answer groups. This list
    # can be changed when any new property is added or deleted which
    # affects or is affected by answer groups.
    PROPERTIES_RELATED_TO_ANSWER_GROUPS = ['solution',
                                            'recorded_voiceovers',
                                            'answer_groups',
                                            'widget_customization_args']

    # PROPERTIES_RELATED_TO_SOLUTION: List of the properties
    # related (affected by or affecting) solution. This list
    # can be changed when any new property is added or deleted which
    # affects or is affected by solution.
    PROPERTIES_RELATED_TO_SOLUTION = ['solution', 'answer_groups',
                                        'recorded_voiceovers',
                                        'widget_customization_args']

    # PROPERTIES_RELATED_TO_VOICEOVERS: List of the properties
    # related (affected by or affecting) voiceovers. This list
    # can be changed when any new property is added or deleted which
    # affects or is affected by voiceovers.
    PROPERTIES_RELATED_TO_VOICEOVERS = ['content', 'solution',
                                        'hints',
                                        'written_translations',
                                        'answer_group',
                                        'default_outcome',
                                        'widget_customization_args',
                                        'recorded_voiceovers']

    def is_change_list_mergeable(
        self, change_list,
        frontend_version, exp_id):

        added_state_names = self.added_state_names
        deleted_state_names = self.deleted_state_names
        new_to_old_state_names = self.new_to_old_state_names
        changed_properties = self.changed_properties
        changed_translations = self.changed_translations

        # Old_to_new_state_names: dict. Dictionary mapping state names of
        # prev_exp_version to the state names of current_exp_version.
        # It doesn't include the name changes of added/deleted states.
        old_to_new_state_names = {
            value: key for key, value in new_to_old_state_names.items()
        }
        frontend_version_exploration = exp_fetchers.get_exploration_by_id(
            exp_id, version=frontend_version)
        backend_version_exploration = exp_fetchers.get_exploration_by_id(exp_id)
        change_list_dict = [change.to_dict() for change in change_list]
        if len(added_state_names) > 0 or len(deleted_state_names) > 0:
            # In case of the addition and the deletion of the state,
            # we are rejecting the mergebility because these cases
            # change the flow of the exploration and are quite complex
            # for now to handle. So in such cases, we are sending the
            # changelist, frontend_version, backend_version and
            # exploration id to the admin, so that we can look into the
            # situations and can figure out the way if it’s possible to
            # handle these cases.
            (
                email_manager
                .send_not_mergeable_change_list_to_admin_for_review(
                    exp_id, frontend_version,
                    backend_version_exploration.version,
                    change_list_dict))
            return False

        changes_are_mergeable = False

        # state_names_of_renamed_states: dict. Stores the changes in
        # states names in change_list where the key is the state name in
        # frontend version and the value is the renamed name from the
        # change list if there is any rename state change.
        state_names_of_renamed_states = {}
        for change in change_list:
            change_is_mergeable = False
            if change.cmd == exp_domain.CMD_RENAME_STATE:
                old_state_name = change.old_state_name
                new_state_name = change.new_state_name
                if old_state_name in state_names_of_renamed_states:
                    state_names_of_renamed_states[new_state_name] = (
                        state_names_of_renamed_states.pop(old_state_name))
                else:
                    state_names_of_renamed_states[new_state_name] = (
                        old_state_name)
                if (state_names_of_renamed_states[new_state_name] not in
                        old_to_new_state_names):
                    change_is_mergeable = True
            elif change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                old_state_name = change.state_name
                new_state_name = change.state_name
                if change.state_name in state_names_of_renamed_states:
                    old_state_name = (
                        state_names_of_renamed_states[change.state_name])
                if old_state_name in old_to_new_state_names:
                    # Here we will send the changelist, frontend_version,
                    # backend_version and exploration to the admin, so
                    # that the changes related to state renames can be
                    # reviewed and the proper conditions can be written
                    # to handle those cases.
                    (
                        email_manager
                        .send_not_mergeable_change_list_to_admin_for_review(
                            exp_id, frontend_version,
                            backend_version_exploration.version,
                            change_list_dict))
                    return False
                if old_state_name not in changed_translations:
                    changed_translations[old_state_name] = []
                frontend_exp_states = (
                    frontend_version_exploration.states[old_state_name])
                backend_exp_states = (
                    backend_version_exploration.states[old_state_name])
                if (change.property_name ==
                        exp_domain.STATE_PROPERTY_CONTENT):
                    if old_state_name in changed_properties:
                        if (frontend_exp_states.content.html ==
                                backend_exp_states.content.html):
                            if ('content' not in
                                    changed_translations[old_state_name] and
                                    'recorded_voiceovers' not in
                                    changed_properties[old_state_name]):
                                change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_ID):
                    if old_state_name in changed_properties:
                        if (frontend_exp_states.interaction.id ==
                                backend_exp_states.interaction.id):
                            if ('widget_customization_args' not in
                                    changed_properties[old_state_name] and
                                    'answer_groups' not in
                                    changed_properties[old_state_name] and
                                    'solution' not in
                                    changed_properties[old_state_name]):
                                change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                # Customization args differ for every interaction, so in
                # case of different interactions merging is simply not
                # possible, but in case of same interaction, the values in
                # the customization_args are often lists so if someone
                # changes even one item of that list then determining which
                # item is changed is not feasible, so suppose there is long
                # list of values in item selection interaction and one user
                # deletes one value and another one edits another value,
                # so after deletion the indices of all the values will be
                # changed and it will not be possible to compare and know
                # that which value is changed by second user.
                # So we will not be handling the merge on the basis of
                # individual fields.
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                    if old_state_name in changed_properties:
                        if (frontend_exp_states.interaction.id ==
                                backend_exp_states.interaction.id):
                            if (all(property not in
                                    changed_properties[old_state_name]
                                    for property in
                                    self.PROPERTIES_RELATED_TO_CUST_ARGS) and
                                    change.property_name not in
                                    changed_translations[old_state_name]):
                                change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                    if old_state_name in changed_properties:
                        if (frontend_exp_states.interaction.id ==
                                backend_exp_states.interaction.id):
                            if (all(property not in
                                    changed_properties[old_state_name]
                                    for property in
                                    self.PROPERTIES_RELATED_TO_ANSWER_GROUPS) and
                                    change.property_name not in
                                    changed_translations[old_state_name]):
                                change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME
                     ):
                    if old_state_name in changed_properties:
                        if (change.property_name not in
                                changed_properties[old_state_name] and
                                change.property_name not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS):
                    change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_NEXT_CONTENT_ID_INDEX):
                    change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_LINKED_SKILL_ID):
                    change_is_mergeable = True
                # We’ll not be able to handle the merge if changelists
                # affect the different indices of the hint in the same
                # state because whenever there is even a small change
                # in one field of any hint, they treat the whole hints
                # list as a new value.
                # So it will not be possible to find out the exact change.
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_HINTS):
                    if old_state_name in changed_properties:
                        if (change.property_name not in
                                changed_properties[old_state_name] and
                                change.property_name not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION):
                    if old_state_name in changed_properties:
                        if (frontend_exp_states.interaction.id ==
                                backend_exp_states.interaction.id):
                            if (all(property not in
                                    changed_properties[old_state_name]
                                    for property in
                                    self.PROPERTIES_RELATED_TO_SOLUTION) and
                                    change.property_name not in
                                    changed_translations[old_state_name]):
                                change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS):
                    if old_state_name in changed_properties:
                        if (frontend_exp_states.interaction.id ==
                                backend_exp_states.interaction.id and
                                frontend_exp_states.solicit_answer_details ==
                                backend_exp_states.solicit_answer_details):
                            change_is_mergeable = True
                    else:
                        change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT):
                    change_is_mergeable = True
                elif (change.property_name ==
                      exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS):
                    if old_state_name in changed_properties:
                        if all(property not in
                               changed_properties[old_state_name]
                               for property in
                               self.PROPERTIES_RELATED_TO_VOICEOVERS):
                            change_is_mergeable = True
                    else:
                        change_is_mergeable = True
            elif change.cmd == exp_domain.CMD_ADD_WRITTEN_TRANSLATION:
                old_state_name = change.state_name
                new_state_name = change.state_name
                if change.state_name in state_names_of_renamed_states:
                    old_state_name = (
                        state_names_of_renamed_states[change.state_name])
                if old_state_name in old_to_new_state_names:
                    # Here we will send the changelist, frontend_version,
                    # backend_version and exploration to the admin, so
                    # that the changes related to state renames can be
                    # reviewed and the proper conditions can be written
                    # to handle those cases.
                    (
                        email_manager
                        .send_not_mergeable_change_list_to_admin_for_review(
                            exp_id, frontend_version,
                            backend_version_exploration.version,
                            change_list_dict))
                    return False
                if old_state_name not in changed_translations:
                    changed_translations[old_state_name] = []
                if old_state_name in changed_properties:
                    if change.content_id == 'content':
                        if ('content' not in
                                changed_properties[old_state_name] and
                                'content' not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    elif change.content_id[:14] == 'ca_placeholder':
                        if ('widget_customization_args' not in
                                changed_properties[old_state_name] and
                                'widget_customization_args' not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    elif change.content_id == 'default_outcome':
                        if ('default_outcome' not in
                                changed_properties[old_state_name] and
                                'default_outcome' not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    elif change.content_id == 'solution':
                        if ('solution' not in
                                changed_properties[old_state_name] and
                                'solution' not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    elif change.content_id[:4] == 'hint':
                        if ('hints' not in
                                changed_properties[old_state_name] and
                                'hints' not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    elif change.content_id[:8] == 'feedback':
                        if ('answer_groups' not in
                                changed_properties[old_state_name] and
                                'answer_groups' not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                    elif change.content_id[:10] == 'rule_input':
                        if ('answer_groups' not in
                                changed_properties[old_state_name] and
                                'answer_groups' not in
                                changed_translations[old_state_name]):
                            change_is_mergeable = True
                else:
                    change_is_mergeable = True
            elif (change.cmd ==
                  exp_domain.CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE):
                change_is_mergeable = True
            elif change.cmd == exp_domain.CMD_EDIT_EXPLORATION_PROPERTY:
                if change.property_name == 'title':
                    if (frontend_version_exploration.title ==
                            backend_version_exploration.title):
                        change_is_mergeable = True
                elif change.property_name == 'category':
                    if (frontend_version_exploration.category ==
                            backend_version_exploration.category):
                        change_is_mergeable = True
                elif change.property_name == 'objective':
                    if (frontend_version_exploration.objective ==
                            backend_version_exploration.objective):
                        change_is_mergeable = True
                elif change.property_name == 'language_code':
                    if (frontend_version_exploration.language_code ==
                            backend_version_exploration.language_code):
                        change_is_mergeable = True
                elif change.property_name == 'tags':
                    if (frontend_version_exploration.tags ==
                            backend_version_exploration.tags):
                        change_is_mergeable = True
                elif change.property_name == 'blurb':
                    if (frontend_version_exploration.blurb ==
                            backend_version_exploration.blurb):
                        change_is_mergeable = True
                elif change.property_name == 'author_notes':
                    if (frontend_version_exploration.author_notes ==
                            backend_version_exploration.author_notes):
                        change_is_mergeable = True
                elif change.property_name == 'init_state_name':
                    if (frontend_version_exploration.init_state_name ==
                            backend_version_exploration.init_state_name):
                        change_is_mergeable = True
                elif change.property_name == 'auto_tts_enabled':
                    if (frontend_version_exploration.auto_tts_enabled ==
                            backend_version_exploration.auto_tts_enabled):
                        change_is_mergeable = True
                elif change.property_name == 'correctness_feedback_enabled':
                    if (frontend_version_exploration.correctness_feedback_enabled == # pylint: disable=line-too-long
                            backend_version_exploration.correctness_feedback_enabled): # pylint: disable=line-too-long
                        change_is_mergeable = True

            if change_is_mergeable:
                changes_are_mergeable = True
                continue
            else:
                changes_are_mergeable = False
                break

        return changes_are_mergeable