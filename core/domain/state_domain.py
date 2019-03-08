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

"""Domain object for states and their constituents."""

import copy
import logging

from constants import constants
from core.domain import customization_args_util
from core.domain import html_cleaner
from core.domain import interaction_registry
from core.domain import param_domain
import feconf
import jinja_utils
import utils


class AnswerGroup(object):
    """Value object for an answer group. Answer groups represent a set of rules
    dictating whether a shared feedback should be shared with the user. These
    rules are ORed together. Answer groups may also support a classifier
    that involve soft matching of answers to a set of training data and/or
    example answers dictated by the creator.
    """

    def to_dict(self):
        """Returns a dict representing this AnswerGroup domain object.

        Returns:
            dict. A dict, mapping all fields of AnswerGroup instance.
        """
        return {
            'rule_specs': [rule_spec.to_dict()
                           for rule_spec in self.rule_specs],
            'outcome': self.outcome.to_dict(),
            'training_data': self.training_data,
            'tagged_misconception_id': self.tagged_misconception_id
        }

    @classmethod
    def from_dict(cls, answer_group_dict):
        """Return a AnswerGroup domain object from a dict.

        Args:
            answer_group_dict: dict. The dict representation of AnswerGroup
                object.

        Returns:
            AnswerGroup. The corresponding AnswerGroup domain object.
        """
        return cls(
            Outcome.from_dict(answer_group_dict['outcome']),
            [RuleSpec.from_dict(rs) for rs in answer_group_dict['rule_specs']],
            answer_group_dict['training_data'],
            answer_group_dict['tagged_misconception_id']
        )

    def __init__(
            self, outcome, rule_specs, training_data, tagged_misconception_id):
        """Initializes a AnswerGroup domain object.

        Args:
            outcome: Outcome. The outcome corresponding to the answer group.
            rule_specs: list(RuleSpec). List of rule specifications.
            training_data: list(*). List of answers belonging to training
                data of this answer group.
            tagged_misconception_id: int or None. The id of the tagged
                misconception for the answer group, when a state is part of a
                Question object that tests a particular skill.
        """
        self.rule_specs = [RuleSpec(
            rule_spec.rule_type, rule_spec.inputs
        ) for rule_spec in rule_specs]

        self.outcome = outcome
        self.training_data = training_data
        self.tagged_misconception_id = tagged_misconception_id

    def validate(self, interaction, exp_param_specs_dict):
        """Verifies that all rule classes are valid, and that the AnswerGroup
        only has one classifier rule.

        Args:
            interaction: InteractionInstance. The interaction object.
            exp_param_specs_dict: dict. A dict of all parameters used in the
                exploration. Keys are parameter names and values are ParamSpec
                value objects with an object type property (obj_type).

        Raises:
            ValidationError: One or more attributes of the AnswerGroup are
                invalid.
            ValidationError: The AnswerGroup contains more than one classifier
                rule.
        """
        if not isinstance(self.rule_specs, list):
            raise utils.ValidationError(
                'Expected answer group rules to be a list, received %s'
                % self.rule_specs)

        if self.tagged_misconception_id is not None:
            if not isinstance(self.tagged_misconception_id, int):
                raise utils.ValidationError(
                    'Expected tagged misconception id to be an int, '
                    'received %s' % self.tagged_misconception_id)

        if len(self.rule_specs) == 0 and len(self.training_data) == 0:
            raise utils.ValidationError(
                'There must be at least one rule or training data for each'
                ' answer group.')

        for rule_spec in self.rule_specs:
            if rule_spec.rule_type not in interaction.rules_dict:
                raise utils.ValidationError(
                    'Unrecognized rule type: %s' % rule_spec.rule_type)

            rule_spec.validate(
                interaction.get_rule_param_list(rule_spec.rule_type),
                exp_param_specs_dict)

        self.outcome.validate()


class Hint(object):
    """Value object representing a hint."""

    def __init__(self, hint_content):
        """Constructs a Hint domain object.

        Args:
            hint_content: SubtitledHtml. The hint text and ID referring to the
                other assets for this content.
        """
        self.hint_content = hint_content

    def to_dict(self):
        """Returns a dict representing this Hint domain object.

        Returns:
            dict. A dict mapping the field of Hint instance.
        """
        return {
            'hint_content': self.hint_content.to_dict(),
        }

    @classmethod
    def from_dict(cls, hint_dict):
        """Return a Hint domain object from a dict.

        Args:
            hint_dict: dict. The dict representation of Hint object.

        Returns:
            Hint. The corresponding Hint domain object.
        """
        return cls(SubtitledHtml.from_dict(hint_dict['hint_content']))

    def validate(self):
        """Validates all properties of Hint."""
        self.hint_content.validate()


class Solution(object):
    """Value object representing a solution.

    A solution consists of answer_is_exclusive, correct_answer and an
    explanation.When answer_is_exclusive is True, this indicates that it is
    the only correct answer; when it is False, this indicates that it is one
    possible answer. correct_answer records an answer that enables the learner
    to progress to the next card and explanation is an HTML string containing
    an explanation for the solution.
    """

    def __init__(
            self, interaction_id, answer_is_exclusive,
            correct_answer, explanation):
        """Constructs a Solution domain object.

        Args:
            interaction_id: str. The interaction id.
            answer_is_exclusive: bool. True if is the only correct answer;
                False if is one of possible answer.
            correct_answer: str. The correct answer; this answer enables the
                learner to progress to the next card.
            explanation: SubtitledHtml. Contains text and text id to link audio
                translations for the solution's explanation.
        """
        self.answer_is_exclusive = answer_is_exclusive
        self.correct_answer = (
            interaction_registry.Registry.get_interaction_by_id(
                interaction_id).normalize_answer(correct_answer))
        self.explanation = explanation

    def to_dict(self):
        """Returns a dict representing this Solution domain object.

        Returns:
            dict. A dict mapping all fields of Solution instance.
        """
        return {
            'answer_is_exclusive': self.answer_is_exclusive,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation.to_dict(),
        }

    @classmethod
    def from_dict(cls, interaction_id, solution_dict):
        """Return a Solution domain object from a dict.

        Args:
            interaction_id: str. The interaction id.
            solution_dict: dict. The dict representation of Solution object.

        Returns:
            Solution. The corresponding Solution domain object.
        """
        return cls(
            interaction_id,
            solution_dict['answer_is_exclusive'],
            interaction_registry.Registry.get_interaction_by_id(
                interaction_id).normalize_answer(
                    solution_dict['correct_answer']),
            SubtitledHtml.from_dict(solution_dict['explanation']))

    def validate(self, interaction_id):
        """Validates all properties of Solution.

        Args:
            interaction_id: str. The interaction id.

        Raises:
            ValidationError: One or more attributes of the Solution are not
            valid.
        """
        if not isinstance(self.answer_is_exclusive, bool):
            raise utils.ValidationError(
                'Expected answer_is_exclusive to be bool, received %s' %
                self.answer_is_exclusive)
        interaction_registry.Registry.get_interaction_by_id(
            interaction_id).normalize_answer(self.correct_answer)
        self.explanation.validate()


class InteractionInstance(object):
    """Value object for an instance of an interaction."""

    # The default interaction used for a new state.
    _DEFAULT_INTERACTION_ID = None

    def to_dict(self):
        """Returns a dict representing this InteractionInstance domain object.

        Returns:
            dict. A dict mapping all fields of InteractionInstance instance.
        """
        return {
            'id': self.id,
            'customization_args': (
                {} if self.id is None else
                customization_args_util.get_full_customization_args(
                    self.customization_args,
                    interaction_registry.Registry.get_interaction_by_id(
                        self.id).customization_arg_specs)),
            'answer_groups': [group.to_dict() for group in self.answer_groups],
            'default_outcome': (
                self.default_outcome.to_dict()
                if self.default_outcome is not None
                else None),
            'confirmed_unclassified_answers': (
                self.confirmed_unclassified_answers),
            'hints': [hint.to_dict() for hint in self.hints],
            'solution': self.solution.to_dict() if self.solution else None,
        }

    @classmethod
    def from_dict(cls, interaction_dict):
        """Return a InteractionInstance domain object from a dict.

        Args:
            interaction_dict: dict. The dict representation of
                InteractionInstance object.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object.
        """
        default_outcome_dict = (
            Outcome.from_dict(interaction_dict['default_outcome'])
            if interaction_dict['default_outcome'] is not None else None)
        solution_dict = (
            Solution.from_dict(
                interaction_dict['id'], interaction_dict['solution'])
            if (interaction_dict['solution'] and interaction_dict['id'])
            else None)

        return cls(
            interaction_dict['id'],
            interaction_dict['customization_args'],
            [AnswerGroup.from_dict(h)
             for h in interaction_dict['answer_groups']],
            default_outcome_dict,
            interaction_dict['confirmed_unclassified_answers'],
            [Hint.from_dict(h) for h in interaction_dict['hints']],
            solution_dict)

    def __init__(
            self, interaction_id, customization_args, answer_groups,
            default_outcome, confirmed_unclassified_answers, hints, solution):
        """Initializes a InteractionInstance domain object.

        Args:
            interaction_id: str. The interaction id.
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.
            default_outcome: Outcome. The default outcome of the interaction
                instance.
            confirmed_unclassified_answers: list(AnswerGroup). List of answers
                which have been confirmed to be associated with the default
                outcome.
            hints: list(Hint). List of hints for this interaction.
            solution: Solution. A possible solution for the question asked in
                this interaction.
        """
        self.id = interaction_id
        # Customization args for the interaction's view. Parts of these
        # args may be Jinja templates that refer to state parameters.
        # This is a dict: the keys are names of customization_args and the
        # values are dicts with a single key, 'value', whose corresponding
        # value is the value of the customization arg.
        self.customization_args = customization_args
        self.answer_groups = answer_groups
        self.default_outcome = default_outcome
        self.confirmed_unclassified_answers = confirmed_unclassified_answers
        self.hints = hints
        self.solution = solution

    @property
    def is_terminal(self):
        """Determines if this interaction type is terminal. If no ID is set for
        this interaction, it is assumed to not be terminal.

        Returns:
            bool. Whether the interaction is terminal.
        """
        return self.id and interaction_registry.Registry.get_interaction_by_id(
            self.id).is_terminal

    def get_all_outcomes(self):
        """Returns a list of all outcomes of this interaction, taking into
        consideration every answer group and the default outcome.

        Returns:
            list(Outcome). List of all outcomes of this interaction.
        """
        outcomes = []
        for answer_group in self.answer_groups:
            outcomes.append(answer_group.outcome)
        if self.default_outcome is not None:
            outcomes.append(self.default_outcome)
        return outcomes

    def validate(self, exp_param_specs_dict):
        """Validates various properties of the InteractionInstance.

        Args:
            exp_param_specs_dict: dict. A dict of specified parameters used in
                the exploration. Keys are parameter names and values are
                ParamSpec value objects with an object type property(obj_type).
                Is used to validate AnswerGroup objects.

        Raises:
            ValidationError: One or more attributes of the InteractionInstance
            are invalid.
        """
        if not isinstance(self.id, basestring):
            raise utils.ValidationError(
                'Expected interaction id to be a string, received %s' %
                self.id)
        try:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                self.id)
        except KeyError:
            raise utils.ValidationError('Invalid interaction id: %s' % self.id)

        customization_args_util.validate_customization_args_and_values(
            'interaction', self.id, self.customization_args,
            interaction.customization_arg_specs)

        if not isinstance(self.answer_groups, list):
            raise utils.ValidationError(
                'Expected answer groups to be a list, received %s.'
                % self.answer_groups)
        if not self.is_terminal and self.default_outcome is None:
            raise utils.ValidationError(
                'Non-terminal interactions must have a default outcome.')
        if self.is_terminal and self.default_outcome is not None:
            raise utils.ValidationError(
                'Terminal interactions must not have a default outcome.')
        if self.is_terminal and self.answer_groups:
            raise utils.ValidationError(
                'Terminal interactions must not have any answer groups.')

        for answer_group in self.answer_groups:
            answer_group.validate(interaction, exp_param_specs_dict)
        if self.default_outcome is not None:
            self.default_outcome.validate()

        if not isinstance(self.hints, list):
            raise utils.ValidationError(
                'Expected hints to be a list, received %s'
                % self.hints)
        for hint in self.hints:
            hint.validate()

        if self.solution:
            self.solution.validate(self.id)

        if self.solution and not self.hints:
            raise utils.ValidationError(
                'Hint(s) must be specified if solution is specified')

    @classmethod
    def create_default_interaction(cls, default_dest_state_name):
        """Create a default InteractionInstance domain object:
            - customization_args: empty dictionary;
            - answer_groups: empty list;
            - default_outcome: dest is set to 'default_dest_state_name' and
                feedback and param_changes are initialized as empty lists;
            - confirmed_unclassified_answers: empty list;

        Args:
            default_dest_state_name: str. The default destination state.

        Returns:
            InteractionInstance. The corresponding InteractionInstance domain
            object with default values.
        """
        default_outcome = Outcome(
            default_dest_state_name,
            SubtitledHtml.create_default_subtitled_html(
                feconf.DEFAULT_OUTCOME_CONTENT_ID), False, {}, None, None)

        return cls(
            cls._DEFAULT_INTERACTION_ID, {}, [], default_outcome, [], [], {})


    def get_all_html_content_strings(self):
        """Get all html content strings in the interaction.

        Returns:
            list(str): The list of all html content strings in the interaction.
        """
        html_list = []

        for answer_group in self.answer_groups:
            outcome_html = answer_group.outcome.feedback.html
            html_list = html_list + [outcome_html]

        # Note that ItemSelectionInput replicates the customization arg HTML
        # in its answer groups.
        if self.id == 'ItemSelectionInput':
            for answer_group in self.answer_groups:
                for rule_spec in answer_group.rule_specs:
                    rule_spec_html = rule_spec.inputs['x']
                    html_list = html_list + rule_spec_html

        if self.id == 'DragAndDropSortInput':
            for answer_group in self.answer_groups:
                for rule_spec in answer_group.rule_specs:
                    rule_spec_html_list = rule_spec.inputs['x']
                    for rule_spec_html in rule_spec_html_list:
                        html_list = html_list + rule_spec_html

        if self.default_outcome:
            default_outcome_html = self.default_outcome.feedback.html
            html_list = html_list + [default_outcome_html]

        for hint in self.hints:
            hint_html = hint.hint_content.html
            html_list = html_list + [hint_html]

        if self.solution:
            solution_html = self.solution.explanation.html
            html_list = html_list + [solution_html]

        if self.id in (
                'ItemSelectionInput', 'MultipleChoiceInput',
                'DragAndDropSortInput'):
            customization_args_html_list = (
                self.customization_args['choices']['value'])
            html_list = html_list + customization_args_html_list

        return html_list


class Outcome(object):
    """Value object representing an outcome of an interaction. An outcome
    consists of a destination state, feedback to show the user, and any
    parameter changes.
    """

    def to_dict(self):
        """Returns a dict representing this Outcome domain object.

        Returns:
            dict. A dict, mapping all fields of Outcome instance.
        """
        return {
            'dest': self.dest,
            'feedback': self.feedback.to_dict(),
            'labelled_as_correct': self.labelled_as_correct,
            'param_changes': [
                param_change.to_dict() for param_change in self.param_changes],
            'refresher_exploration_id': self.refresher_exploration_id,
            'missing_prerequisite_skill_id': self.missing_prerequisite_skill_id
        }

    @classmethod
    def from_dict(cls, outcome_dict):
        """Return a Outcome domain object from a dict.

        Args:
            outcome_dict: dict. The dict representation of Outcome object.

        Returns:
            Outcome. The corresponding Outcome domain object.
        """
        return cls(
            outcome_dict['dest'],
            SubtitledHtml.from_dict(outcome_dict['feedback']),
            outcome_dict['labelled_as_correct'],
            [param_domain.ParamChange(
                param_change['name'], param_change['generator_id'],
                param_change['customization_args'])
             for param_change in outcome_dict['param_changes']],
            outcome_dict['refresher_exploration_id'],
            outcome_dict['missing_prerequisite_skill_id']
        )

    def __init__(
            self, dest, feedback, labelled_as_correct, param_changes,
            refresher_exploration_id, missing_prerequisite_skill_id):
        """Initializes a Outcome domain object.

        Args:
            dest: str. The name of the destination state.
            feedback: SubtitledHtml. Feedback to give to the user if this rule
                is triggered.
            labelled_as_correct: bool. Whether this outcome has been labelled
                by the creator as corresponding to a "correct" answer.
            param_changes: list(ParamChange). List of exploration-level
                parameter changes to make if this rule is triggered.
            refresher_exploration_id: str or None. An optional exploration ID
                to redirect the learner to if they seem to lack understanding
                of a prerequisite concept. This should only exist if the
                destination state for this outcome is a self-loop.
            missing_prerequisite_skill_id: str or None. The id of the skill that
                this answer group tests. If this is not None, the exploration
                player would redirect to this skill when a learner receives this
                outcome.
        """
        # Id of the destination state.
        # TODO(sll): Check that this state actually exists.
        self.dest = dest
        # Feedback to give the reader if this rule is triggered.
        self.feedback = feedback
        # Whether this outcome has been labelled by the creator as
        # corresponding to a "correct" answer.
        self.labelled_as_correct = labelled_as_correct
        # Exploration-level parameter changes to make if this rule is
        # triggered.
        self.param_changes = param_changes or []
        # An optional exploration ID to redirect the learner to if they lack
        # understanding of a prerequisite concept. This should only exist if
        # the destination state for this outcome is a self-loop.
        self.refresher_exploration_id = refresher_exploration_id
        # An optional skill id whose concept card would be shown to the learner
        # when the learner receives this outcome.
        self.missing_prerequisite_skill_id = missing_prerequisite_skill_id

    def validate(self):
        """Validates various properties of the Outcome.

        Raises:
            ValidationError: One or more attributes of the Outcome are invalid.
        """
        self.feedback.validate()

        if not isinstance(self.labelled_as_correct, bool):
            raise utils.ValidationError(
                'The "labelled_as_correct" field should be a boolean, received '
                '%s' % self.labelled_as_correct)

        if self.missing_prerequisite_skill_id is not None:
            if not isinstance(self.missing_prerequisite_skill_id, basestring):
                raise utils.ValidationError(
                    'Expected outcome missing_prerequisite_skill_id to be a '
                    'string, received %s' % self.missing_prerequisite_skill_id)

        if not isinstance(self.param_changes, list):
            raise utils.ValidationError(
                'Expected outcome param_changes to be a list, received %s'
                % self.param_changes)
        for param_change in self.param_changes:
            param_change.validate()

        if self.refresher_exploration_id is not None:
            if not isinstance(self.refresher_exploration_id, basestring):
                raise utils.ValidationError(
                    'Expected outcome refresher_exploration_id to be a string, '
                    'received %s' % self.refresher_exploration_id)


class AudioTranslation(object):
    """Value object representing an audio translation."""

    def to_dict(self):
        """Returns a dict representing this AudioTranslation domain object.

        Returns:
            dict. A dict, mapping all fields of AudioTranslation instance.
        """
        return {
            'filename': self.filename,
            'file_size_bytes': self.file_size_bytes,
            'needs_update': self.needs_update,
        }

    @classmethod
    def from_dict(cls, audio_translation_dict):
        """Return a AudioTranslation domain object from a dict.

        Args:
            audio_translation_dict: dict. The dict representation of
                AudioTranslation object.

        Returns:
            AudioTranslation. The corresponding AudioTranslation domain object.
        """
        return cls(
            audio_translation_dict['filename'],
            audio_translation_dict['file_size_bytes'],
            audio_translation_dict['needs_update'])

    def __init__(self, filename, file_size_bytes, needs_update):
        """Initializes a AudioTranslation domain object.

        Args:
            filename: str. The corresponding audio file path.
            file_size_bytes: int. The file size, in bytes. Used to display
                potential bandwidth usage to the learner before they download
                the file.
            needs_update: bool. Whether audio is marked for needing review.
        """
        # str. The corresponding audio file path, e.g.
        # "content-en-2-h7sjp8s.mp3".
        self.filename = filename
        # int. The file size, in bytes. Used to display potential bandwidth
        # usage to the learner before they download the file.
        self.file_size_bytes = file_size_bytes
        # bool. Whether audio is marked for needing review.
        self.needs_update = needs_update

    def validate(self):
        """Validates properties of the AudioTranslation.

        Raises:
            ValidationError: One or more attributes of the AudioTranslation are
            invalid.
        """
        if not isinstance(self.filename, basestring):
            raise utils.ValidationError(
                'Expected audio filename to be a string, received %s' %
                self.filename)
        dot_index = self.filename.rfind('.')
        if dot_index == -1 or dot_index == 0:
            raise utils.ValidationError(
                'Invalid audio filename: %s' % self.filename)
        extension = self.filename[dot_index + 1:]
        if extension not in feconf.ACCEPTED_AUDIO_EXTENSIONS:
            raise utils.ValidationError(
                'Invalid audio filename: it should have one of '
                'the following extensions: %s. Received: %s'
                % (feconf.ACCEPTED_AUDIO_EXTENSIONS.keys(), self.filename))

        if not isinstance(self.file_size_bytes, int):
            raise utils.ValidationError(
                'Expected file size to be an int, received %s' %
                self.file_size_bytes)
        if self.file_size_bytes <= 0:
            raise utils.ValidationError(
                'Invalid file size: %s' % self.file_size_bytes)

        if not isinstance(self.needs_update, bool):
            raise utils.ValidationError(
                'Expected needs_update to be a bool, received %s' %
                self.needs_update)


class WrittenTranslation(object):
    """Value object representing a written translation for a content."""

    def __init__(self, html, needs_update):
        """Initializes a WrittenTranslation domain object.

        Args:
            html: str. A piece of user submitted HTML. This is cleaned in such
                a way as to contain a restricted set of HTML tags.
            needs_update: bool. Whether html is marked for needing review.
        """
        self.html = html_cleaner.clean(html)
        self.needs_update = needs_update

    def to_dict(self):
        """Returns a dict representing this WrittenTranslation domain object.

        Returns:
            dict. A dict, mapping all fields of WrittenTranslation instance.
        """
        return {
            'html': self.html,
            'needs_update': self.needs_update,
        }

    @classmethod
    def from_dict(cls, written_translation_dict):
        """Return a WrittenTranslation domain object from a dict.

        Args:
            written_translation_dict: dict. The dict representation of
                WrittenTranslation object.

        Returns:
            WrittenTranslation. The corresponding WrittenTranslation domain
            object.
        """
        return cls(
            written_translation_dict['html'],
            written_translation_dict['needs_update'])

    def validate(self):
        """Validates properties of the WrittenTranslation.

        Raises:
            ValidationError: One or more attributes of the WrittenTranslation
            are invalid.
        """
        if not isinstance(self.html, basestring):
            raise utils.ValidationError(
                'Invalid content HTML: %s' % self.html)

        if not isinstance(self.needs_update, bool):
            raise utils.ValidationError(
                'Expected needs_update to be a bool, received %s' %
                self.needs_update)


class WrittenTranslations(object):
    """Value object representing a content translations which stores
    translated contents of all state contents (like hints, feedback etc.) in
    different languages linked through their content_id.
    """

    def __init__(self, translations_mapping):
        """Initializes a WrittenTranslations domain object."""
        self.translations_mapping = translations_mapping

    def to_dict(self):
        """Returns a dict representing this WrittenTranslations domain object.

        Returns:
            dict. A dict, mapping all fields of WrittenTranslations instance.
        """
        translations_mapping = {}
        for (content_id, language_code_to_written_translation) in (
                self.translations_mapping.iteritems()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.iteritems()):
                translations_mapping[content_id][language_code] = (
                    written_translation.to_dict())
        written_translations_dict = {
            'translations_mapping': translations_mapping
        }

        return written_translations_dict

    @classmethod
    def from_dict(cls, written_translations_dict):
        """Return a WrittenTranslations domain object from a dict.

        Args:
            written_translations_dict: dict. The dict representation of
                WrittenTranslations object.

        Returns:
            WrittenTranslations. The corresponding WrittenTranslations domain
            object.
        """
        translations_mapping = {}
        for (content_id, language_code_to_written_translation) in (
                written_translations_dict['translations_mapping'].iteritems()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.iteritems()):
                translations_mapping[content_id][language_code] = (
                    WrittenTranslation.from_dict(written_translation))

        return cls(translations_mapping)

    def validate(self, expected_content_id_list):
        """Validates properties of the WrittenTranslations.

        Args:
            expected_content_id_list: A list of content id which are expected to
            be inside they WrittenTranslations.

        Raises:
            ValidationError: One or more attributes of the WrittenTranslations
            are invalid.
        """
        if expected_content_id_list is not None:
            if not set(self.translations_mapping.keys()) == (
                    set(expected_content_id_list)):
                raise utils.ValidationError(
                    'Expected state written_translations to match the listed '
                    'content ids %s, found %s' % (
                        expected_content_id_list,
                        self.translations_mapping.keys())
                    )

        for (content_id, language_code_to_written_translation) in (
                self.translations_mapping.iteritems()):
            if not isinstance(content_id, basestring):
                raise utils.ValidationError(
                    'Expected content_id to be a string, received %s'
                    % content_id)
            if not isinstance(language_code_to_written_translation, dict):
                raise utils.ValidationError(
                    'Expected content_id value to be a dict, received %s'
                    % language_code_to_written_translation)
            for (language_code, written_translation) in (
                    language_code_to_written_translation.iteritems()):
                if not isinstance(language_code, basestring):
                    raise utils.ValidationError(
                        'Expected language_code to be a string, received %s'
                        % language_code)
                if not utils.is_valid_language_code(language_code):
                    raise utils.ValidationError(
                        'Invalid language_code: %s' % language_code)

                written_translation.validate()

    def get_content_ids_for_text_translation(self):
        """Returns a list of content_id available for text translation.

        Returns:
            list(str). A list of content id available for text translation.
        """
        return self.translations_mapping.keys()

    def add_content_id_for_translation(self, content_id):
        """Adds a content id as a key for the translation into the
        content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception: The content id isn't a string.
        """
        if not isinstance(content_id, basestring):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id in self.translations_mapping:
            raise Exception(
                'The content_id %s already exist.' % content_id)
        else:
            self.translations_mapping[content_id] = {}

    def delete_content_id_for_translation(self, content_id):
        """Deletes a content id from the content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception: The content id isn't a string.
        """
        if not isinstance(content_id, basestring):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id not in self.translations_mapping:
            raise Exception(
                'The content_id %s does not exist.' % content_id)
        else:
            self.translations_mapping.pop(content_id, None)


class RuleSpec(object):
    """Value object representing a rule specification."""

    def to_dict(self):
        """Returns a dict representing this RuleSpec domain object.

        Returns:
            dict. A dict, mapping all fields of RuleSpec instance.
        """
        return {
            'rule_type': self.rule_type,
            'inputs': self.inputs,
        }

    @classmethod
    def from_dict(cls, rulespec_dict):
        """Return a RuleSpec domain object from a dict.

        Args:
            rulespec_dict: dict. The dict representation of RuleSpec object.

        Returns:
            RuleSpec. The corresponding RuleSpec domain object.
        """
        return cls(
            rulespec_dict['rule_type'],
            rulespec_dict['inputs']
        )

    def __init__(self, rule_type, inputs):
        """Initializes a RuleSpec domain object.

        Args:
            rule_type: str. The rule type, e.g. "CodeContains" or "Equals". A
                full list of rule types can be found in
                extensions/interactions/rule_templates.json.
            inputs: dict. The values of the parameters needed in order to fully
                specify the rule. The keys for this dict can be deduced from
                the relevant description field in
                extensions/interactions/rule_templates.json -- they are
                enclosed in {{...}} braces.
        """
        self.rule_type = rule_type
        self.inputs = inputs

    def validate(self, rule_params_list, exp_param_specs_dict):
        """Validates a RuleSpec value object. It ensures the inputs dict does
        not refer to any non-existent parameters and that it contains values
        for all the parameters the rule expects.

        Args:
            rule_params_list: A list of parameters used by the rule represented
                by this RuleSpec instance, to be used to validate the inputs of
                this RuleSpec. Each element of the list represents a single
                parameter and is a tuple with two elements:
                    0: The name (string) of the parameter.
                    1: The typed object instance for that
                        parameter (e.g. Real).
            exp_param_specs_dict: A dict of specified parameters used in this
                exploration. Keys are parameter names and values are ParamSpec
                value objects with an object type property (obj_type). RuleSpec
                inputs may have a parameter value which refers to one of these
                exploration parameters.

        Raises:
            ValidationError: One or more attributes of the RuleSpec are
            invalid.
        """
        if not isinstance(self.inputs, dict):
            raise utils.ValidationError(
                'Expected inputs to be a dict, received %s' % self.inputs)
        input_key_set = set(self.inputs.keys())
        param_names_set = set([rp[0] for rp in rule_params_list])
        leftover_input_keys = input_key_set - param_names_set
        leftover_param_names = param_names_set - input_key_set

        # Check if there are input keys which are not rule parameters.
        if leftover_input_keys:
            logging.warning(
                'RuleSpec \'%s\' has inputs which are not recognized '
                'parameter names: %s' % (self.rule_type, leftover_input_keys))

        # Check if there are missing parameters.
        if leftover_param_names:
            raise utils.ValidationError(
                'RuleSpec \'%s\' is missing inputs: %s'
                % (self.rule_type, leftover_param_names))

        rule_params_dict = {rp[0]: rp[1] for rp in rule_params_list}
        for (param_name, param_value) in self.inputs.iteritems():
            param_obj = rule_params_dict[param_name]
            # Validate the parameter type given the value.
            if isinstance(param_value, basestring) and '{{' in param_value:
                # Value refers to a parameter spec. Cross-validate the type of
                # the parameter spec with the rule parameter.
                start_brace_index = param_value.index('{{') + 2
                end_brace_index = param_value.index('}}')
                param_spec_name = param_value[
                    start_brace_index:end_brace_index]
                if param_spec_name not in exp_param_specs_dict:
                    raise utils.ValidationError(
                        'RuleSpec \'%s\' has an input with name \'%s\' which '
                        'refers to an unknown parameter within the '
                        'exploration: %s' % (
                            self.rule_type, param_name, param_spec_name))
                # TODO(bhenning): The obj_type of the param_spec
                # (exp_param_specs_dict[param_spec_name]) should be validated
                # to be the same as param_obj.__name__ to ensure the rule spec
                # can accept the type of the parameter.
            else:
                # Otherwise, a simple parameter value needs to be normalizable
                # by the parameter object in order to be valid.
                param_obj.normalize(param_value)


class SubtitledHtml(object):
    """Value object representing subtitled HTML."""

    def __init__(self, content_id, html):
        """Initializes a SubtitledHtml domain object.

        Args:
            content_id: str. A unique id referring to the other assets for this
                content.
            html: str. A piece of user submitted HTML. This is cleaned in such
                a way as to contain a restricted set of HTML tags.
        """
        self.content_id = content_id
        self.html = html_cleaner.clean(html)
        self.validate()

    def to_dict(self):
        """Returns a dict representing this SubtitledHtml domain object.

        Returns:
            dict. A dict, mapping all fields of SubtitledHtml instance.
        """
        return {
            'content_id': self.content_id,
            'html': self.html
        }

    @classmethod
    def from_dict(cls, subtitled_html_dict):
        """Return a SubtitledHtml domain object from a dict.

        Args:
            subtitled_html_dict: dict. The dict representation of SubtitledHtml
                object.

        Returns:
            SubtitledHtml. The corresponding SubtitledHtml domain object.
        """
        return cls(
            subtitled_html_dict['content_id'], subtitled_html_dict['html'])

    def validate(self):
        """Validates properties of the SubtitledHtml.

        Raises:
            ValidationError: One or more attributes of the SubtitledHtml are
            invalid.
        """
        if not isinstance(self.content_id, basestring):
            raise utils.ValidationError(
                'Expected content id to be a string, received %s' %
                self.content_id)

        # TODO(sll): Add HTML sanitization checking.
        # TODO(sll): Validate customization args for rich-text components.
        if not isinstance(self.html, basestring):
            raise utils.ValidationError(
                'Invalid content HTML: %s' % self.html)

    def to_html(self, params):
        """Exports this SubtitledHTML object to an HTML string. The HTML is
        parameterized using the parameters in `params`.

        Args:
            params: dict. The keys are the parameter names and the values are
                the values of parameters.

        Raises:
            Exception: 'params' is not a dict.

        Returns:
            str. The HTML string that results after stripping
                out unrecognized tags and attributes.
        """
        if not isinstance(params, dict):
            raise Exception(
                'Expected context params for parsing subtitled HTML to be a '
                'dict, received %s' % params)

        return html_cleaner.clean(jinja_utils.parse_string(self.html, params))

    @classmethod
    def create_default_subtitled_html(cls, content_id):
        """Create a default SubtitledHtml domain object."""
        return cls(content_id, '')


class State(object):
    """Domain object for a state."""

    def __init__(
            self, content, param_changes, interaction,
            content_ids_to_audio_translations, written_translations,
            classifier_model_id=None):
        """Initializes a State domain object.

        Args:
            content: SubtitledHtml. The contents displayed to the reader in this
                state.
            param_changes: list(ParamChange). Parameter changes associated with
                this state.
            interaction: InteractionInstance. The interaction instance
                associated with this state.
            content_ids_to_audio_translations: dict. A dict representing audio
                translations for corresponding content_id.
            written_translations: WrittenTranslations. The written translations
                for the state contents.
            classifier_model_id: str or None. The classifier model ID
                associated with this state, if applicable.
        """
        # The content displayed to the reader in this state.
        self.content = content
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args
        ) for param_change in param_changes]
        # The interaction instance associated with this state.
        self.interaction = InteractionInstance(
            interaction.id, interaction.customization_args,
            interaction.answer_groups, interaction.default_outcome,
            interaction.confirmed_unclassified_answers,
            interaction.hints, interaction.solution)
        self.classifier_model_id = classifier_model_id
        self.content_ids_to_audio_translations = (
            content_ids_to_audio_translations)
        self.written_translations = written_translations

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
        available_content_ids_in_audio_translations = (
            self.content_ids_to_audio_translations.keys())

        self.written_translations.validate(content_id_list)

        if not set(content_id_list) == set(
                available_content_ids_in_audio_translations):
            raise utils.ValidationError(
                'Expected state content_ids_to_audio_translations to match the '
                'listed content ids %s, found %s' % (
                    content_id_list,
                    available_content_ids_in_audio_translations))

        if not isinstance(self.content_ids_to_audio_translations, dict):
            raise utils.ValidationError(
                'Expected state content_ids_to_audio_translations to be a dict,'
                'received %s' % self.content_ids_to_audio_translations)

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

    @classmethod
    def convert_state_dict_to_yaml(cls, state_dict, width):
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
            state = cls.from_dict(state_dict)
        except Exception:
            logging.info('Bad state dict: %s' % str(state_dict))
            raise Exception('Could not convert state dict to YAML.')

        return utils.yaml_from_dict(state.to_dict(), width=width)

    def _update_content_ids_in_assets(self, old_ids_list, new_ids_list):
        """Adds or deletes content ids in assets i.e, other parts of state
        object such as content_ids_to_audio_translations.

        Args:
            old_ids_list: list(str). A list of content ids present earlier
                within the substructure (like answer groups, hints etc.) of
                state.
            new_ids_list: list(str). A list of content ids currently present
                within the substructure (like answer groups, hints etc.) of
                state.
        """
        content_ids_to_delete = set(old_ids_list) - set(new_ids_list)
        content_ids_to_add = set(new_ids_list) - set(old_ids_list)
        content_ids_for_text_translations = (
            self.written_translations.get_content_ids_for_text_translation())
        for content_id in content_ids_to_delete:
            if not content_id in self.content_ids_to_audio_translations:
                raise Exception(
                    'The content_id %s does not exist in '
                    'content_ids_to_audio_translations.' % content_id)
            elif not content_id in content_ids_for_text_translations:
                raise Exception(
                    'The content_id %s does not exist in written_translations.'
                    % content_id)
            else:
                self.content_ids_to_audio_translations.pop(content_id)
                self.written_translations.delete_content_id_for_translation(
                    content_id)

        for content_id in content_ids_to_add:
            if content_id in self.content_ids_to_audio_translations:
                raise Exception(
                    'The content_id %s already exists in '
                    'content_ids_to_audio_translations.' % content_id)
            elif content_id in content_ids_for_text_translations:
                raise Exception(
                    'The content_id %s does not exist in written_translations.'
                    % content_id)
            else:
                self.content_ids_to_audio_translations[content_id] = {}
                self.written_translations.add_content_id_for_translation(
                    content_id)

    def update_content(self, content_dict):
        """Update the content of this state.

        Args:
            content_dict: dict. The dict representation of SubtitledHtml
                object.
        """
        # TODO(sll): Must sanitize all content in RTE component attrs.
        self.content = SubtitledHtml.from_dict(content_dict)

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
        old_content_id_list = [
            answer_group.outcome.feedback.content_id for answer_group in (
                self.interaction.answer_groups)]
        # TODO(yanamal): Do additional calculations here to get the
        # parameter changes, if necessary.
        for answer_group_dict in answer_groups_list:
            rule_specs_list = answer_group_dict['rule_specs']
            if not isinstance(rule_specs_list, list):
                raise Exception(
                    'Expected answer group rule specs to be a list, '
                    'received %s' % rule_specs_list)

            answer_group = AnswerGroup(
                Outcome.from_dict(answer_group_dict['outcome']), [],
                answer_group_dict['training_data'],
                answer_group_dict['tagged_misconception_id'])
            for rule_dict in rule_specs_list:
                rule_spec = RuleSpec.from_dict(rule_dict)

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

        new_content_id_list = [
            answer_group.outcome.feedback.content_id for answer_group in (
                self.interaction.answer_groups)]
        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_interaction_default_outcome(self, default_outcome_dict):
        """Update the default_outcome of InteractionInstance domain object.

        Args:
            default_outcome_dict: dict. Dict that represents Outcome domain
                object.
        """
        old_content_id_list = []
        new_content_id_list = []
        if self.interaction.default_outcome:
            old_content_id_list.append(
                self.interaction.default_outcome.feedback.content_id)

        if default_outcome_dict:
            if not isinstance(default_outcome_dict, dict):
                raise Exception(
                    'Expected default_outcome_dict to be a dict, received %s'
                    % default_outcome_dict)
            self.interaction.default_outcome = Outcome.from_dict(
                default_outcome_dict)
            new_content_id_list.append(
                self.interaction.default_outcome.feedback.content_id)
        else:
            self.interaction.default_outcome = None

        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

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
        old_content_id_list = [
            hint.hint_content.content_id for hint in self.interaction.hints]
        self.interaction.hints = [
            Hint.from_dict(hint_dict)
            for hint_dict in hints_list]

        new_content_id_list = [
            hint.hint_content.content_id for hint in self.interaction.hints]
        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_interaction_solution(self, solution_dict):
        """Update the solution of interaction.

        Args:
            solution_dict: dict or None. The dict representation of
                Solution object.

        Raises:
            Exception: 'solution_dict' is not a dict.
        """
        old_content_id_list = []
        new_content_id_list = []
        if self.interaction.solution:
            old_content_id_list.append(
                self.interaction.solution.explanation.content_id)

        if solution_dict is not None:
            if not isinstance(solution_dict, dict):
                raise Exception(
                    'Expected solution to be a dict, received %s'
                    % solution_dict)
            self.interaction.solution = Solution.from_dict(
                self.interaction.id, solution_dict)
            new_content_id_list.append(
                self.interaction.solution.explanation.content_id)
        else:
            self.interaction.solution = None

        self._update_content_ids_in_assets(
            old_content_id_list, new_content_id_list)

    def update_content_ids_to_audio_translations(
            self, content_ids_to_audio_translations_dict):
        """Update the content_ids_to_audio_translations of a state.

        Args:
            content_ids_to_audio_translations_dict: dict. The dict
                representation of content_ids_to_audio_translations.
        """
        self.content_ids_to_audio_translations = {
            content_id: {
                language_code: AudioTranslation.from_dict(
                    audio_translation_dict)
                for language_code, audio_translation_dict in
                audio_translations.iteritems()
            } for content_id, audio_translations in (
                content_ids_to_audio_translations_dict.iteritems())
        }

    def update_written_translations(self, written_translations):
        """Update the written_translations of a state.

        Args:
            written_translations: WrittenTranslations. The new
                WrittenTranslations object for the state.
        """
        self.written_translations = written_translations

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
                    AudioTranslation.to_dict(audio_translation))
            content_ids_to_audio_translations_dict[content_id] = (
                audio_translations_dict)

        return {
            'content': self.content.to_dict(),
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'interaction': self.interaction.to_dict(),
            'classifier_model_id': self.classifier_model_id,
            'content_ids_to_audio_translations': (
                content_ids_to_audio_translations_dict),
            'written_translations': self.written_translations.to_dict()
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
                    AudioTranslation.from_dict(audio_translation))
            content_ids_to_audio_translations[content_id] = (
                audio_translations)
        return cls(
            SubtitledHtml.from_dict(state_dict['content']),
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            InteractionInstance.from_dict(state_dict['interaction']),
            content_ids_to_audio_translations,
            WrittenTranslations.from_dict(state_dict['written_translations']),
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
            SubtitledHtml(content_id, content_html),
            [],
            InteractionInstance.create_default_interaction(
                default_dest_state_name),
            copy.deepcopy(feconf.DEFAULT_CONTENT_IDS_TO_AUDIO_TRANSLATIONS),
            WrittenTranslations.from_dict(
                copy.deepcopy(feconf.DEFAULT_WRITTEN_TRANSLATIONS)))

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
