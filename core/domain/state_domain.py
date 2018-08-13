# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Domain object for state."""

import copy

from constants import constants
from core.domain import interaction_registry
from core.domain import param_domain
import exp_domain
import feconf
import utils


class State(object):
    """Domain object for a state."""

    def __init__(
            self, content, param_changes, interaction,
            content_ids_to_audio_translations, classifier_model_id=None):
        """Initializes a State domain object.

        Args:
            content: SubtitledHtml. The contents displayed to the reader in this
                state.
            param_changes: list(ParamChange). Parameter changes associated with
                this state.
            interaction: InteractionInstance. The interaction instance
                associated with this state.
            classifier_model_id: str or None. The classifier model ID
                associated with this state, if applicable.
            content_ids_to_audio_translations: dict. A dict representing audio
                translations for corresponding content_id.
        """
        # The content displayed to the reader in this state.
        self.content = content
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args
        ) for param_change in param_changes]
        # The interaction instance associated with this state.
        self.interaction = exp_domain.InteractionInstance(
            interaction.id, interaction.customization_args,
            interaction.answer_groups, interaction.default_outcome,
            interaction.confirmed_unclassified_answers,
            interaction.hints, interaction.solution)
        self.classifier_model_id = classifier_model_id
        self.content_ids_to_audio_translations = (
            content_ids_to_audio_translations)

    def validate(self, exp_param_specs_dict, allow_null_interaction):
        """Validates various properties of the State.

        Args:
            exp_param_specs_dict: dict or None. A dict of specified parameters
                used in this exploration. Keys are parameter names and values
                are ParamSpec value objects with an object type
                property(obj_type). It is None if the state belongs to a
                question.
            allow_null_interaction: bool. Whether this state's interaction is
                allowed to be unspecified.

        Raises:
            ValidationError: One or more attributes of the State are invalid.
        """
        self.content.validate()

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected state param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()

        if not allow_null_interaction and self.interaction.id is None:
            raise utils.ValidationError(
                'This state does not have any interaction specified.')
        elif self.interaction.id is not None:
            self.interaction.validate(exp_param_specs_dict)

        content_id_list = []
        content_id_list.append(self.content.content_id)
        for answer_group in self.interaction.answer_groups:
            feedback_content_id = answer_group.outcome.feedback.content_id
            if feedback_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s' % feedback_content_id)
            content_id_list.append(feedback_content_id)
        if self.interaction.default_outcome:
            default_outcome_content_id = (
                self.interaction.default_outcome.feedback.content_id)
            if default_outcome_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s'
                    % default_outcome_content_id)
            content_id_list.append(default_outcome_content_id)
        for hint in self.interaction.hints:
            hint_content_id = hint.hint_content.content_id
            if hint_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s' % hint_content_id)
            content_id_list.append(hint_content_id)
        if self.interaction.solution:
            solution_content_id = (
                self.interaction.solution.explanation.content_id)
            if solution_content_id in content_id_list:
                raise utils.ValidationError(
                    'Found a duplicate content id %s' % solution_content_id)
            content_id_list.append(solution_content_id)
        available_content_ids = self.content_ids_to_audio_translations.keys()
        if not set(content_id_list) <= set(available_content_ids):
            raise utils.ValidationError(
                'Expected state content_ids_to_audio_translations to have all '
                'of the listed content ids %s' % content_id_list)
        if not isinstance(self.content_ids_to_audio_translations, dict):
            raise utils.ValidationError(
                'Expected state content_ids_to_audio_translations to be a dict,'
                'received %s' % self.param_changes)
        for (content_id, audio_translations) in (
                self.content_ids_to_audio_translations.iteritems()):

            if not isinstance(content_id, basestring):
                raise utils.ValidationError(
                    'Expected content_id to be a string, received: %s' %
                    content_id)
            if not isinstance(audio_translations, dict):
                raise utils.ValidationError(
                    'Expected audio_translations to be a dict, received %s'
                    % audio_translations)

            allowed_audio_language_codes = [
                language['id'] for language in (
                    constants.SUPPORTED_AUDIO_LANGUAGES)]
            for language_code, translation in audio_translations.iteritems():
                if not isinstance(language_code, basestring):
                    raise utils.ValidationError(
                        'Expected language code to be a string, received: %s' %
                        language_code)

                if language_code not in allowed_audio_language_codes:
                    raise utils.ValidationError(
                        'Unrecognized language code: %s' % language_code)

                translation.validate()

    def get_training_data(self):
        """Retrieves training data from the State domain object."""
        state_training_data_by_answer_group = []
        for (answer_group_index, answer_group) in enumerate(
                self.interaction.answer_groups):
            if answer_group.training_data:
                answers = copy.deepcopy(answer_group.training_data)
                state_training_data_by_answer_group.append({
                    'answer_group_index': answer_group_index,
                    'answers': answers
                })
        return state_training_data_by_answer_group

    def can_undergo_classification(self):
        """Checks whether the answers for this state satisfy the preconditions
        for a ML model to be trained.

        Returns:
            bool: True, if the conditions are satisfied.
        """
        training_examples_count = 0
        labels_count = 0
        training_examples_count += len(
            self.interaction.confirmed_unclassified_answers)
        for answer_group in self.interaction.answer_groups:
            training_examples_count += len(answer_group.training_data)
            labels_count += 1
        if ((training_examples_count >= feconf.MIN_TOTAL_TRAINING_EXAMPLES) and
                (labels_count >= feconf.MIN_ASSIGNED_LABELS)):
            return True
        return False

    def update_content(self, content_dict):
        """Update the content of this state.

        Args:
            content_dict: dict. The dict representation of SubtitledHtml
                object.
        """
        # TODO(sll): Must sanitize all content in RTE component attrs.
        self.content = exp_domain.SubtitledHtml.from_dict(content_dict)

    def update_param_changes(self, param_change_dicts):
        """Update the param_changes dict attribute.

        Args:
            param_change_dicts: list(dict). List of param_change dicts that
                represent ParamChange domain object.
        """
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in param_change_dicts]

    def update_interaction_id(self, interaction_id):
        """Update the interaction id attribute.

        Args:
            interaction_id: str. The new interaction id to set.
        """
        self.interaction.id = interaction_id
        # TODO(sll): This should also clear interaction.answer_groups (except
        # for the default rule). This is somewhat mitigated because the client
        # updates interaction_answer_groups directly after this, but we should
        # fix it.

    def update_interaction_customization_args(self, customization_args):
        """Update the customization_args of InteractionInstance domain object.

        Args:
            customization_args: dict. The new customization_args to set.
        """
        self.interaction.customization_args = customization_args

    def update_interaction_answer_groups(self, answer_groups_list):
        """Update the list of AnswerGroup in IteractioInstancen domain object.

        Args:
            answer_groups_list: list(dict). List of dicts that represent
                AnswerGroup domain object.
        """
        if not isinstance(answer_groups_list, list):
            raise Exception(
                'Expected interaction_answer_groups to be a list, received %s'
                % answer_groups_list)

        interaction_answer_groups = []

        # TODO(yanamal): Do additional calculations here to get the
        # parameter changes, if necessary.
        for answer_group_dict in answer_groups_list:
            rule_specs_list = answer_group_dict['rule_specs']
            if not isinstance(rule_specs_list, list):
                raise Exception(
                    'Expected answer group rule specs to be a list, '
                    'received %s' % rule_specs_list)

            answer_group = exp_domain.AnswerGroup(
                exp_domain.Outcome.from_dict(answer_group_dict['outcome']), [],
                answer_group_dict['training_data'],
                answer_group_dict['tagged_misconception_id'])
            for rule_dict in rule_specs_list:
                rule_spec = exp_domain.RuleSpec.from_dict(rule_dict)

                # Normalize and store the rule params.
                rule_inputs = rule_spec.inputs
                if not isinstance(rule_inputs, dict):
                    raise Exception(
                        'Expected rule_inputs to be a dict, received %s'
                        % rule_inputs)
                for param_name, value in rule_inputs.iteritems():
                    param_type = (
                        interaction_registry.Registry.get_interaction_by_id(
                            self.interaction.id
                        ).get_rule_param_type(rule_spec.rule_type, param_name))

                    if (isinstance(value, basestring) and
                            '{{' in value and '}}' in value):
                        # TODO(jacobdavis11): Create checks that all parameters
                        # referred to exist and have the correct types.
                        normalized_param = value
                    else:
                        try:
                            normalized_param = param_type.normalize(value)
                        except TypeError:
                            raise Exception(
                                '%s has the wrong type. It should be a %s.' %
                                (value, param_type.__name__))
                    rule_inputs[param_name] = normalized_param

                answer_group.rule_specs.append(rule_spec)
            interaction_answer_groups.append(answer_group)
        self.interaction.answer_groups = interaction_answer_groups

    def update_interaction_default_outcome(self, default_outcome_dict):
        """Update the default_outcome of InteractionInstance domain object.

        Args:
            default_outcome_dict: dict. Dict that represents Outcome domain
                object.
        """
        if default_outcome_dict:
            if not isinstance(default_outcome_dict, dict):
                raise Exception(
                    'Expected default_outcome_dict to be a dict, received %s'
                    % default_outcome_dict)
            self.interaction.default_outcome = exp_domain.Outcome.from_dict(
                default_outcome_dict)

        else:
            self.interaction.default_outcome = None

    def update_interaction_confirmed_unclassified_answers(
            self, confirmed_unclassified_answers):
        """Update the confirmed_unclassified_answers of IteractionInstance
        domain object.

        Args:
            confirmed_unclassified_answers: list(AnswerGroup). The new list of
                answers which have been confirmed to be associated with the
                default outcome.

        Raises:
            Exception: 'confirmed_unclassified_answers' is not a list.
        """
        if not isinstance(confirmed_unclassified_answers, list):
            raise Exception(
                'Expected confirmed_unclassified_answers to be a list,'
                ' received %s' % confirmed_unclassified_answers)
        self.interaction.confirmed_unclassified_answers = (
            confirmed_unclassified_answers)

    def update_interaction_hints(self, hints_list):
        """Update the list of hints.

        Args:
            hints_list: list(dict). A list of dict; each dict represents a Hint
                object.

        Raises:
            Exception: 'hints_list' is not a list.
        """
        if not isinstance(hints_list, list):
            raise Exception(
                'Expected hints_list to be a list, received %s'
                % hints_list)
        self.interaction.hints = [
            exp_domain.Hint.from_dict(hint_dict)
            for hint_dict in hints_list]

    def update_interaction_solution(self, solution_dict):
        """Update the solution of interaction.

        Args:
            solution_dict: dict or None. The dict representation of
                Solution object.

        Raises:
            Exception: 'solution_dict' is not a dict.
        """
        if solution_dict is not None:
            if not isinstance(solution_dict, dict):
                raise Exception(
                    'Expected solution to be a dict, received %s'
                    % solution_dict)
            self.interaction.solution = exp_domain.Solution.from_dict(
                self.interaction.id, solution_dict)
        else:
            self.interaction.solution = None

    def update_content_ids_to_audio_translations(
            self, content_ids_to_audio_translations_dict):
        """Update the content_ids_to_audio_translations of a state.

        Args:
            content_ids_to_audio_translations_dict: dict. The dict
                representation of content_ids_to_audio_translations.
        """
        self.content_ids_to_audio_translations = {
            content_id: {
                language_code: exp_domain.AudioTranslation.from_dict(
                    audio_translation_dict)
                for language_code, audio_translation_dict in
                audio_translations.iteritems()
            } for content_id, audio_translations in (
                content_ids_to_audio_translations_dict.iteritems())
        }

    def add_hint(self, hint_content):
        """Add a new hint to the list of hints.

        Args:
            hint_content: str. The hint text.
        """
        self.interaction.hints.append(exp_domain.Hint(hint_content))

    def delete_hint(self, index):
        """Delete a hint from the list of hints.

        Args:
            index: int. The position of the hint in the list of hints.

        Raises:
            IndexError: Index is less than 0.
            IndexError: Index is greater than or equal than the length of hints
                list.
        """
        if index < 0 or index >= len(self.interaction.hints):
            raise IndexError('Hint index out of range')
        del self.interaction.hints[index]

    def to_dict(self):
        """Returns a dict representing this State domain object.

        Returns:
            dict. A dict mapping all fields of State instance.
        """
        content_ids_to_audio_translations_dict = {}
        for content_id, audio_translations in (
                self.content_ids_to_audio_translations.iteritems()):
            audio_translations_dict = {}
            for lang_code, audio_translation in audio_translations.iteritems():
                audio_translations_dict[lang_code] = (
                    exp_domain.AudioTranslation.to_dict(audio_translation))
            content_ids_to_audio_translations_dict[content_id] = (
                audio_translations_dict)

        return {
            'content': self.content.to_dict(),
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'interaction': self.interaction.to_dict(),
            'classifier_model_id': self.classifier_model_id,
            'content_ids_to_audio_translations': (
                content_ids_to_audio_translations_dict)
        }

    @classmethod
    def from_dict(cls, state_dict):
        """Return a State domain object from a dict.

        Args:
            state_dict: dict. The dict representation of State object.

        Returns:
            State. The corresponding State domain object.
        """
        content_ids_to_audio_translations = {}
        for content_id, audio_translations_dict in (
                state_dict['content_ids_to_audio_translations'].iteritems()):
            audio_translations = {}
            for lang_code, audio_translation in (
                    audio_translations_dict.iteritems()):
                audio_translations[lang_code] = (
                    exp_domain.AudioTranslation.from_dict(audio_translation))
            content_ids_to_audio_translations[content_id] = (
                audio_translations)
        return cls(
            exp_domain.SubtitledHtml.from_dict(state_dict['content']),
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            exp_domain.InteractionInstance.from_dict(state_dict['interaction']),
            content_ids_to_audio_translations,
            state_dict['classifier_model_id'])

    @classmethod
    def create_default_state(
            cls, default_dest_state_name, is_initial_state=False):
        """Return a State domain object with default value.

        Args:
            default_dest_state_name: str. The default destination state.
            is_initial_state: bool. Whether this state represents the initial
                state of an exploration.

        Returns:
            State. The corresponding State domain object.
        """
        content_html = (
            feconf.DEFAULT_INIT_STATE_CONTENT_STR if is_initial_state else '')
        content_id = feconf.DEFAULT_NEW_STATE_CONTENT_ID
        return cls(
            exp_domain.SubtitledHtml(content_id, content_html),
            [],
            exp_domain.InteractionInstance.create_default_interaction(
                default_dest_state_name),
            feconf.DEFAULT_CONTENT_IDS_TO_AUDIO_TRANSLATIONS)

    @classmethod
    def convert_html_fields_in_state(cls, state_dict, conversion_fn):
        """Applies a conversion function on all the html strings in a state
        to migrate them to a desired state.

        Args:
            state_dict: dict. The dict representation of State object.
            conversion_fn: function. The conversion function to be applied on
                the states_dict.

        Returns:
            dict. The converted state_dict.
        """
        state_dict['content']['html'] = (
            conversion_fn(state_dict['content']['html']))
        if state_dict['interaction']['default_outcome']:
            interaction_feedback_html = state_dict[
                'interaction']['default_outcome']['feedback']['html']
            state_dict['interaction']['default_outcome']['feedback'][
                'html'] = conversion_fn(interaction_feedback_html)

        for answer_group_index, answer_group in enumerate(
                state_dict['interaction']['answer_groups']):
            answer_group_html = answer_group['outcome']['feedback']['html']
            state_dict['interaction']['answer_groups'][
                answer_group_index]['outcome']['feedback']['html'] = (
                    conversion_fn(answer_group_html))
            if state_dict['interaction']['id'] == 'ItemSelectionInput':
                for rule_spec_index, rule_spec in enumerate(
                        answer_group['rule_specs']):
                    for x_index, x in enumerate(rule_spec['inputs']['x']):
                        state_dict['interaction']['answer_groups'][
                            answer_group_index]['rule_specs'][
                                rule_spec_index]['inputs']['x'][x_index] = (
                                    conversion_fn(x))
        for hint_index, hint in enumerate(
                state_dict['interaction']['hints']):
            hint_html = hint['hint_content']['html']
            state_dict['interaction']['hints'][hint_index][
                'hint_content']['html'] = conversion_fn(hint_html)

        if state_dict['interaction']['solution']:
            solution_html = state_dict[
                'interaction']['solution']['explanation']['html']
            state_dict['interaction']['solution']['explanation']['html'] = (
                conversion_fn(solution_html))

        if state_dict['interaction']['id'] in (
                'ItemSelectionInput', 'MultipleChoiceInput'):
            for value_index, value in enumerate(
                    state_dict['interaction']['customization_args'][
                        'choices']['value']):
                state_dict['interaction']['customization_args'][
                    'choices']['value'][value_index] = conversion_fn(value)

        return state_dict
