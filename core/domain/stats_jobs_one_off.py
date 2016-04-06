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

"""Jobs for statistics views."""

import ast
import collections
import itertools
import re

from core import jobs
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rule_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_domain
from core.domain import stats_services
from core.platform import models
from extensions.objects.models import objects

import utils

(base_models, stats_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()


class StatisticsAudit(jobs.BaseMapReduceJobManager):

    _STATE_COUNTER_ERROR_KEY = 'State Counter ERROR'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            stats_models.ExplorationAnnotationsModel,
            stats_models.StateCounterModel]

    @staticmethod
    def map(item):
        if isinstance(item, stats_models.StateCounterModel):
            if item.first_entry_count < 0:
                yield (
                    StatisticsAudit._STATE_COUNTER_ERROR_KEY,
                    'Less than 0: %s %d' % (item.key, item.first_entry_count))
            return
        # Older versions of ExplorationAnnotations didn't store exp_id
        # This is short hand for making sure we get ones updated most recently
        else:
            if item.exploration_id is not None:
                yield (item.exploration_id, {
                    'version': item.version,
                    'starts': item.num_starts,
                    'completions': item.num_completions,
                    'state_hit': item.state_hit_counts
                })

    @staticmethod
    def reduce(key, stringified_values):
        if key == StatisticsAudit._STATE_COUNTER_ERROR_KEY:
            for value_str in stringified_values:
                yield (value_str,)
            return

        # If the code reaches this point, we are looking at values that
        # correspond to each version of a particular exploration.

        # These variables correspond to the VERSION_ALL version.
        all_starts = 0
        all_completions = 0
        all_state_hit = collections.defaultdict(int)

        # These variables correspond to the sum of counts for all other
        # versions besides VERSION_ALL.
        sum_starts = 0
        sum_completions = 0
        sum_state_hit = collections.defaultdict(int)

        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['starts'] < 0:
                yield (
                    'Negative start count: exp_id:%s version:%s starts:%s' %
                    (key, value['version'], value['starts']),)

            if value['completions'] < 0:
                yield (
                    'Negative completion count: exp_id:%s version:%s '
                    'completions:%s' %
                    (key, value['version'], value['completions']),)

            if value['completions'] > value['starts']:
                yield ('Completions > starts: exp_id:%s version:%s %s>%s' % (
                    key, value['version'], value['completions'],
                    value['starts']),)

            if value['version'] == stats_jobs_continuous.VERSION_ALL:
                all_starts = value['starts']
                all_completions = value['completions']
                for (state_name, counts) in value['state_hit'].iteritems():
                    all_state_hit[state_name] = counts['first_entry_count']
            else:
                sum_starts += value['starts']
                sum_completions += value['completions']
                for (state_name, counts) in value['state_hit'].iteritems():
                    sum_state_hit[state_name] += counts['first_entry_count']

        if sum_starts != all_starts:
            yield (
                'Non-all != all for starts: exp_id:%s sum: %s all: %s'
                % (key, sum_starts, all_starts),)
        if sum_completions != all_completions:
            yield (
                'Non-all != all for completions: exp_id:%s sum: %s all: %s'
                % (key, sum_completions, all_completions),)

        for state_name in all_state_hit:
            if (state_name not in sum_state_hit and
                    all_state_hit[state_name] != 0):
                yield (
                    'state hit count not same exp_id:%s state:%s, '
                    'all:%s sum: null' % (
                        key, state_name, all_state_hit[state_name]),)
            elif all_state_hit[state_name] != sum_state_hit[state_name]:
                yield (
                    'state hit count not same exp_id: %s state: %s '
                    'all: %s sum:%s' % (
                        key, state_name, all_state_hit[state_name],
                        sum_state_hit[state_name]),)


class AnswerMigrationJob(jobs.BaseMapReduceJobManager):
    """This job is responsible for migrating all answers stored within
    stats_models.StateRuleAnswerLogModel to stats_models.StateAnswersModel
    """
    _ERROR_KEY = 'Answer Migration ERROR'

    _DEFAULT_RULESPEC_STR = 'Default'

    _RECONSTITUTION_FUNCTION_MAP = {
        'CodeRepl': '_reconstitute_code_evaluation',
        'Continue': '_reconstitute_continue',
        'EndExploration': '_reconstitute_end_exploration',
        'GraphInput': '_reconstitute_graph_input',
        'ImageClickInput': '_reconstitute_image_click_input',
        'InteractiveMap': '_reconstitute_interactive_map',
        'ItemSelectionInput': '_reconstitute_item_selection_input',
        'LogicProof': '_reconstitute_logic_proof',
        'MathExpressionInput': '_reconstitute_math_expression_input',
        'MultipleChoiceInput': '_reconstitute_multiple_choice_input',
        'MusicNotesInput': '_reconstitute_music_notes_input',
        'NumericInput': '_reconstitute_numeric_input',
        'PencilCodeEditor': '_reconstitute_pencil_code_editor',
        'SetInput': '_reconstitute_set_input',
        'TextInput': '_reconstitute_text_input',
    }

    @classmethod
    def _find_exploration_immediately_before_timestamp(cls, exp_id, when):
        # Find the latest exploration version before the given time.

        # NOTE(bhenning): This depends on ExplorationCommitLogEntryModel, which
        # was added in ecbfff0. This means any data added before that time will
        # assume to be matched to the earliest recorded commit.

        # NOTE(bhenning): Also, it's possible some of these answers were
        # submitted during a playthrough where the exploration was changed
        # midway. There's not a lot that can be done about this; hopefully the
        # job can convert the answer correctly or detect if it can't. If this
        # ends up being a major issue, it might be mitigated by scanning stats
        # around the time the answer was submitted, but it's not possible to
        # demultiplex the stream of answers and identify which session they are
        # associated with.

        latest_exp_model = exp_models.ExplorationModel.get(exp_id)
        if (latest_exp_model.version == 1 or
                latest_exp_model.last_updated < when):
            # Short-circuit: the answer was submitted later than the current
            # exp version. Otherwise, this is the only version and something is
            # wrong with the answer. Just deal with it.
            return exp_services.get_exploration_from_model(latest_exp_model)

        # TODO(bhenning): Convert calls to CommitLogEntry to own model.

        # Look backwards in the history of the exploration, starting with the
        # latest version.
        for version in reversed(range(latest_exp_model.version)):
            exp_commit_model = exp_models.ExplorationCommitLogEntryModel.get(
                'exploration-%s-%s' % (exp_id, version))
            if exp_commit_model.created_on < when:
                # Found the closest exploration to the given
                exp_model = exp_models.ExplorationModel.get(
                    exp_id, version=version)
                return exp_services.get_exploration_from_model(exp_model)

        # This indicates a major issue, also. Just return the latest version.
        return exp_services.get_exploration_from_model(latest_exp_model)

    @classmethod
    def _stringify_classified_rule(cls, rule_spec):
        # This is based on the original
        # exp_domain.RuleSpec.stringify_classified_rule, however it returns a
        # list of possible matches by permuting the rule_spec inputs, since the
        # order of a Python dict is implementation-dependent. Our stringified
        # string may not necessarily match the one stored a long time ago in
        # the data store.
        if rule_spec.rule_type == rule_domain.FUZZY_RULE_TYPE:
            yield rule_spec.rule_type
        else:
            rule_spec_inputs = rule_spec.inputs.values()
            for permuted_input in itertools.permutations(rule_spec_inputs):
                param_list = [utils.to_ascii(val) for val in permuted_input]
                yield '%s(%s)' % (rule_spec.rule_type, ','.join(param_list))

    @classmethod
    def _infer_which_answer_group_and_rule_match_answer(cls, state, rule_str):
        # The first RuleSpec instance to match is the winner.
        answer_groups = state.interaction.answer_groups
        for answer_group_index, answer_group in enumerate(answer_groups):
            rule_specs = answer_group.rule_specs
            for rule_spec_index, rule_spec in enumerate(rule_specs):
                possible_stringified_rules = list(
                    cls._stringify_classified_rule(rule_spec))
                if rule_str in possible_stringified_rules:
                    return (answer_group_index, rule_spec_index)

        # If none match, check whether it matches against the default rule,
        # which thereby translates to the default outcome.
        if rule_str == cls._DEFAULT_RULESPEC_STR:
            return (len(answer_groups), 0)

        return (None, None)

    @classmethod
    def _infer_classification_categorization(cls, rule_str):
        # At this point, no classification was possible. Thus, only soft, hard,
        # and default classifications are possible.
        fuzzy_rule_type = 'FuzzyMatches'
        if rule_str == cls._DEFAULT_RULESPEC_STR:
            return exp_domain.DEFAULT_OUTCOME_CLASSIFICATION
        elif rule_str == fuzzy_rule_type:
            return exp_domain.TRAINING_DATA_CLASSIFICATION
        else:
            return exp_domain.EXPLICIT_CLASSIFICATION

    @classmethod
    def _get_plaintext(cls, str_value):
        # TODO(bhenning): Convert HTML to plaintext (should just involve
        # stripping <p> tags).
        if '<' in str_value or '>' in str_value:
            return None
        return str_value

    # TODO(bhenning): Ensure these reconstitution methods work with all rules
    # supported by an interaction.

    @classmethod
    def _reconstitute_code_evaluation(
            cls, interaction, rule_spec, rule_str, answer_str):
        rule_types_without_output = ['CodeContains', 'CodeDoesNotContain']
        # TODO(bhenning): Reconstitute the evaluation and error. Also, find the
        # default values to use, if cannot reconstitute.
        if rule_spec.rule_type == 'OutputEquals':
            code_output = cls._get_plaintext(rule_spec.inputs['x'])
            code = cls._get_plaintext(answer_str)
            if not code:
                return (None, 'Failed to recover code: %s' % answer_str)
            code_evaluation_dict = {
                'code': code,
                'output': code_output,
                'evaluation': '',
                'error': ''
            }
            return (
                objects.CodeEvaluation.normalize(code_evaluation_dict), None)
        elif rule_spec.rule_type in rule_types_without_output:
            code = cls._get_plaintext(answer_str)
            if not code:
                return (None, 'Failed to recover code: %s' % answer_str)
            # TODO(bhenning): Add sentinel value for output here, since it
            # cannot be recovered.
            code_evaluation_dict = {
                'code': code,
                'output': '',
                'evaluation': '',
                'error': ''
            }
            return (
                objects.CodeEvaluation.normalize(code_evaluation_dict), None)
        return (
            None,
            'Cannot reconstitute a CodeEvaluation object without an '
            'OutputEquals rule.')

    @classmethod
    def _reconstitute_continue(
            cls, interaction, rule_spec, rule_str, answer_str):
        if not rule_spec and not answer_str and (
                rule_str == cls._DEFAULT_RULESPEC_STR):
            # There is no answer for 'Continue' interactions.
            return (None, None)
        return (
            None,
            'Expected Continue submissions to only be default rules: %s'
            % rule_str)

    @classmethod
    def _reconstitute_end_exploration(
            cls, interaction, rule_spec, rule_str, answer_str):
        return (
            None,
            'There should be no answers submitted for the end exploration.')

    @classmethod
    def _reconstitute_graph_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        return (None, 'Unsupported answer type.')

    @classmethod
    def _reconstitute_image_click_input(cls,
            interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'IsInRegion':
            # Extract the region clicked on from the rule string.
            region_name = rule_str[len(rule_spec.rule_type) + 1:-1]

            # Match the pattern: '(real, real)' to extract the coordinates.
            pattern = re.compile(
                r'\((?P<x>\d+\.?\d*), (?P<y>\d+\.?\d*)\)')
            match = pattern.match(answer_str)
            if not match:
                return (
                    None,
                    'Bad answer string in ImageClickInput IsInRegion rule.')
            x = float(match.group('x'))
            y = float(match.group('y'))
            click_on_image_dict = {
                'clickPosition': [x, y],
                'clickedRegions': [region_name]
            }
            return (objects.ClickOnImage.normalize(click_on_image_dict), None)
        return (
            None,
            'Cannot reconstitute ImageClickInput object without an IsInRegion '
            'rule.')

    @classmethod
    def _reconstitute_interactive_map(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'Within':
            # Match the pattern: '(real, real)' to extract the coordinates.
            pattern = re.compile(
                r'\((?P<x>-?\d+\.?\d*), (?P<y>-?\d+\.?\d*)\)')
            match = pattern.match(answer_str)
            if not match:
                return (
                    None, 'Bad answer string in InteractiveMap Within rule.')
            x = float(match.group('x'))
            y = float(match.group('y'))
            coord_two_dim_list = [x, y]
            return (objects.CoordTwoDim.normalize(coord_two_dim_list), None)
        return (
            None,
            'Cannot reconstitute InteractiveMap object without a Within rule.')

    @classmethod
    def _reconstitute_item_selection_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        supported_rule_types = [
            'Equals', 'ContainsAtLeastOneOf', 'DoesNotContainAtLeastOneOf'
        ]
        if rule_spec.rule_type in supported_rule_types:
            option_list = eval(answer_str)
            if not isinstance(option_list, list):
                return (
                    None,
                    'Bad answer string in ItemSelectionInput Equals rule.')
            return (objects.SetOfHtmlString.normalize(option_list), None)
        return (
            None,
            'Cannot reconstitute ItemSelectionInput object without an Equals '
            'rule.')

    @classmethod
    def _reconstitute_logic_proof(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'Correct':
            # TODO(bhenning): The answer_str is just the 'proof_string' of the
            # CheckedProof object. It needs to back through the proof engine in
            # order to reconstitute the lost data during submission.
            return (None, 'Unsupported answer type.')
        return (
            None,
            'Cannot reconstitute LogicProof object without a Within rule.')

    @classmethod
    def _reconstitute_math_expression_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'IsMathematicallyEquivalentTo':
            math_expression_dict = eval(answer_str)
            if not isinstance(math_expression_dict, dict):
                return (
                    None,
                    'Bad answer string in MathExpressionInput '
                    'IsMathematicallyEquivalentTo rule.')
            return (
                objects.MathExpression.normalize(math_expression_dict), None)
        return (
            None,
            'Cannot reconstitute MathExpressionInput object without an '
            'IsMathematicallyEquivalentTo rule.')

    @classmethod
    def _reconstitute_multiple_choice_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'Equals':
            # Extract the clicked index from the rule string.
            clicked_index = int(rule_str[len(rule_spec.rule_type) + 1:-1])
            customization_args = interaction.customization_args
            choices = customization_args['choices']['value']
            if answer_str != choices[clicked_index]:
                return (
                    None,
                    'Clicked index %d and submitted answer \'%s\' does not '
                    'match corresponding choice in the exploration: \'%s\'' % (
                        clicked_index, answer_str, choices[clicked_index]))
            return (objects.NonnegativeInt.normalize(clicked_index), None)
        return (
            None,
            'Cannot reconstitute MultipleChoiceInput object without an Equals '
            'rule.')

    @classmethod
    def _reconstitute_music_notes_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        return (None, 'Unsupported answer type.')

    @classmethod
    def _reconstitute_numeric_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        supported_rule_types = [
            'Equals', 'IsLessThan', 'IsGreaterThan', 'IsLessThanOrEqualTo',
            'IsGreaterThanOrEqualTo', 'IsInclusivelyBetween',
            'IsWithinTolerance'
        ]
        if rule_spec.rule_type not in supported_rule_types:
            return (
                None,
                'Unsupported rule type encountered while attempting to '
                'reconstitute NumericInput object: %s' % rule_spec.rule_type)
        input_value = float(cls._get_plaintext(answer_str))
        return (objects.Real.normalize(input_value), None)

    @classmethod
    def _reconstitute_pencil_code_editor(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'OutputEquals':
            # Luckily, Pencil Code answers stored the actual dict rather than
            # just the code; it's easier to reconstitute.
            code_evaluation_dict = eval(cls._get_plaintext(answer_str))
            if not isinstance(code_evaluation_dict, dict):
                return (None, 'Failed to recover code: %s' % answer_str)
            return (
                objects.CodeEvaluation.normalize(code_evaluation_dict), None)
        return (
            None,
            'Cannot reconstitute a CodeEvaluation object without an '
            'OutputEquals rule.')

    @classmethod
    def _reconstitute_set_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        supported_rule_types = [
            'Equals', 'IsSubsetOf', 'IsSupersetOf', 'HasElementsIn',
            'HasElementsNotIn', 'OmitsElementsIn', 'IsDisjointFrom'
        ]
        if rule_spec.rule_type not in supported_rule_types:
            return (
                None,
                'Unsupported rule type encountered while attempting to '
                'reconstitute SetInput object: %s' % rule_spec.rule_type)

        unicode_string_list = eval(cls._get_plaintext(answer_str))
        if not isinstance(unicode_string_list, list):
            return (None, 'Failed to recover code: %s' % answer_str)
        return (
            objects.SetOfUnicodeString.normalize(unicode_string_list), None)

    @classmethod
    def _reconstitute_text_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        supported_rule_types = [
            'Equals', 'CaseSensitiveEquals', 'StartsWith', 'Contains',
            'FuzzyEquals'
        ]
        if rule_spec.rule_type not in supported_rule_types:
            return (
                None,
                'Unsupported rule type encountered while attempting to '
                'reconstitute TextInput object: %s' % rule_spec.rule_type)
        input_value = cls._get_plaintext(answer_str)
        return (objects.NormalizedString.normalize(input_value), None)

    @classmethod
    def _reconstitute_answer_object(
            cls, state, rule_spec, rule_str, answer_str):
        interaction_id = state.interaction.id
        if interaction_id in cls._RECONSTITUTION_FUNCTION_MAP:
            # Check for default outcome.
            if (interaction_id != 'Continue'
                    and not rule_spec
                    and rule_str == cls._DEFAULT_RULESPEC_STR):
                return (None, None)
            reconstitute = getattr(
                cls, cls._RECONSTITUTION_FUNCTION_MAP[interaction_id])
            return reconstitute(
                state.interaction, rule_spec, rule_str, answer_str)
        return (
            None,
            'Cannot reconstitute unsupported interaction ID: %s' %
            interaction_id)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateRuleAnswerLogModel]

    @staticmethod
    def map(item):
        # TODO(bhenning): Throw errors for all major points of failure.

        # TODO(bhenning): Reduce on exp id and state name to reduce exp loads.

        # Cannot unpack the item ID with a simple split, since the rule_str
        # component can contains periods. The ID is guaranteed to always
        # contain 4 parts: exploration ID, state name, handler name, and
        # rule_str.
        item_id = item.id
        period_idx = item_id.index('.')
        exp_id = item_id[:period_idx]

        item_id = item_id[period_idx+1:]
        handler_period_idx = item_id.index('submit') - 1
        state_name = item_id[:handler_period_idx]

        item_id = item_id[handler_period_idx+1:]
        period_idx = item_id.index('.')
        handler_name = item_id[:period_idx]

        item_id = item_id[period_idx+1:]
        rule_str = item_id

        # The exploration and state name are needed in the new data model and
        # are also needed to cross reference the answer. Since the answer is
        # not associated with a particular version, a search needs to be
        # conducted to find which version of the exploration is associated with
        # the given answer.
        if 'submit' not in item.id or handler_name != 'submit':
            yield (
                AnswerMigrationJob._ERROR_KEY,
                'Encountered submitted answer without the standard \'submit\' '
                'handler: %s' % item.id)

        # One major point of failure is the exploration not existing.
        # Another major point of failure comes from the time matching. Since
        # one entity in StateRuleAnswerLogModel represents many different
        # answers, all answers are being matched to a single exploration even
        # though each answer may have been submitted to a different exploration
        # version. This may cause significant migration issues and will be
        # tricky to work around.
        exploration = (
            AnswerMigrationJob._find_exploration_immediately_before_timestamp(
                exp_id, item.created_on))

        # Another point of failure is the state not matching due to an
        # incorrect exploration version selection.
        state = exploration.states[state_name]

        classification_categorization = (
            AnswerMigrationJob._infer_classification_categorization(rule_str))

        # Unfortunately, the answer_group_index and rule_spec_index may be
        # wrong for soft rules, since previously there was no way of
        # differentiating between which soft rule was selected. This problem is
        # also revealed for RuleSpecs which produce the same rule_spec_str.
        (answer_group_index, rule_spec_index) = (
            AnswerMigrationJob._infer_which_answer_group_and_rule_match_answer(
                state, rule_str))

        # Major point of failure: answer_group_index or rule_spec_index may
        # return none when it's not a default result.
        if answer_group_index is None or rule_spec_index is None:
            yield (
                AnswerMigrationJob._ERROR_KEY,
                'Failed to match rule string: \'%s\' for answer \'%s\'' % (
                    rule_str, item.id))
            return

        answer_groups = state.interaction.answer_groups
        if answer_group_index != len(answer_groups):
            answer_group = answer_groups[answer_group_index]
            rule_spec = answer_group.rule_specs[rule_spec_index]
        else:
            # The answer is matched with the default outcome.
            answer_group = None
            rule_spec = None

        # These are values which cannot be reconstituted; use special sentinel
        # values for them, instead.
        session_id = stats_domain.MIGRATED_STATE_ANSWER_SESSION_ID
        time_spent_in_sec = (
            stats_domain.MIGRATED_STATE_ANSWER_TIME_SPENT_IN_SEC)

        # Params were, unfortunately, never stored. They cannot be trivially
        # recovered.
        params = []

        # A note on frequency: the resolved answer will simply be duplicated in
        # the new data store to replicate frequency. This is not 100% accurate
        # since each answer may have been submitted at different times and,
        # thus, for different versions of the exploration. This information is
        # practically impossible to recover, so this strategy is considered
        # adequate.
        for answer_str, answer_frequency in item.answers.iteritems():
            # Major point of failure is if answer returns None; the error
            # variable will contain why the reconstitution failed.
            (answer, error) = AnswerMigrationJob._reconstitute_answer_object(
                state, rule_spec, rule_str, answer_str)

            if error:
                yield (AnswerMigrationJob._ERROR_KEY, error)
                continue

            for _ in xrange(answer_frequency):
                stats_services.record_answer(
                    exp_id, exploration.version, state_name, answer_group_index,
                    rule_spec_index, classification_categorization, session_id,
                    time_spent_in_sec, params, answer, rule_spec_str=rule_str,
                    answer_str=answer_str)

    @staticmethod
    def reduce(key, stringified_values):
        yield stringified_values
