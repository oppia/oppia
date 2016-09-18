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
import datetime
import itertools
import os
import random
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

import feconf
import utils

(base_models, stats_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()


# pylint: disable=W0123
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


class AnswersAudit(jobs.BaseMapReduceJobManager):

    # pylint: disable=invalid-name
    _STATE_COUNTER_ERROR_KEY = 'State Counter ERROR'
    _UNKNOWN_HANDLER_NAME_COUNTER_KEY = 'UnknownHandlerCounter'
    _SUBMIT_HANDLER_NAME_COUNTER_KEY = 'SubmitHandlerCounter'
    _HANDLER_FUZZY_RULE_COUNTER_KEY = 'FuzzyRuleCounter'
    _HANDLER_DEFAULT_RULE_COUNTER_KEY = 'DefaultRuleCounter'
    _HANDLER_STANDARD_RULE_COUNTER_KEY = 'StandardRuleCounter'
    _STANDARD_RULE_SUBMISSION_COUNTER_KEY = 'StandardRuleSubmitCounter'
    _HANDLER_ERROR_RULE_COUNTER_KEY = 'ErrorRuleCounter'
    _UNIQUE_ANSWER_COUNTER_KEY = 'UniqueAnswerCounter'
    _CUMULATIVE_ANSWER_COUNTER_KEY = 'CumulativeAnswerCounter'

    @classmethod
    def _get_consecutive_dot_count(cls, string, idx):
        for i in range(idx, len(string)):
            if string[i] != '.':
                return i - idx
        return 0

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateRuleAnswerLogModel]

    @staticmethod
    def map(item):
        item_id = item.id
        if 'submit' not in item_id:
            yield (AnswersAudit._UNKNOWN_HANDLER_NAME_COUNTER_KEY, {
                'reduce_type': AnswersAudit._UNKNOWN_HANDLER_NAME_COUNTER_KEY,
                'rule_spec_str': item.id
            })
            return

        period_idx = item_id.index('submit')
        item_id = item_id[period_idx:]
        period_idx = item_id.index('.')
        period_idx += (
            AnswersAudit._get_consecutive_dot_count(item_id, period_idx) - 1)
        handler_name = item_id[:period_idx]
        yield (handler_name, {
            'reduce_type': AnswersAudit._SUBMIT_HANDLER_NAME_COUNTER_KEY,
            'rule_spec_str': item.id
        })

        item_id = item_id[period_idx+1:]
        rule_str = item_id

        answers = item.answers
        total_submission_count = 0
        for _, count in answers.iteritems():
            total_submission_count += count
            yield (AnswersAudit._UNIQUE_ANSWER_COUNTER_KEY, {
                'reduce_type': AnswersAudit._UNIQUE_ANSWER_COUNTER_KEY
            })
            for _ in xrange(count):
                yield (AnswersAudit._CUMULATIVE_ANSWER_COUNTER_KEY, {
                    'reduce_type': AnswersAudit._CUMULATIVE_ANSWER_COUNTER_KEY
                })

        if rule_str == 'FuzzyMatches':
            for _ in xrange(total_submission_count):
                yield (rule_str, {
                    'reduce_type': AnswersAudit._HANDLER_FUZZY_RULE_COUNTER_KEY
                })
        elif rule_str == 'Default':
            for _ in xrange(total_submission_count):
                yield (rule_str, {
                    'reduce_type': (
                        AnswersAudit._HANDLER_DEFAULT_RULE_COUNTER_KEY)
                })
        elif '(' in rule_str and rule_str[-1] == ')':
            index = rule_str.index('(')
            rule_type = rule_str[0:index]
            rule_args = rule_str[index+1:-1]
            for _ in xrange(total_submission_count):
                yield (rule_type, {
                    'reduce_type': (
                        AnswersAudit._HANDLER_STANDARD_RULE_COUNTER_KEY),
                    'rule_str': rule_str,
                    'rule_args': rule_args
                })
            for _ in xrange(total_submission_count):
                yield (AnswersAudit._STANDARD_RULE_SUBMISSION_COUNTER_KEY, {
                    'reduce_type': (
                        AnswersAudit._STANDARD_RULE_SUBMISSION_COUNTER_KEY)
                })
        else:
            for _ in xrange(total_submission_count):
                yield (rule_str, {
                    'reduce_type': AnswersAudit._HANDLER_ERROR_RULE_COUNTER_KEY
                })

    @staticmethod
    def reduce(key, stringified_values):
        reduce_type = None
        reduce_count = len(stringified_values)
        for value_str in stringified_values:
            value_dict = ast.literal_eval(value_str)
            if reduce_type and reduce_type != value_dict['reduce_type']:
                yield 'Internal error 1'
            elif not reduce_type:
                reduce_type = value_dict['reduce_type']

        if reduce_type == AnswersAudit._UNKNOWN_HANDLER_NAME_COUNTER_KEY:
            rule_spec_strs = [
                ast.literal_eval(value_str)['rule_spec_str']
                for value_str in stringified_values
            ]
            yield (
                'Encountered unknown handler %d time(s), FOUND RULE SPEC '
                'STRINGS: \n%s' % (reduce_count, rule_spec_strs[:10]))
        elif reduce_type == AnswersAudit._SUBMIT_HANDLER_NAME_COUNTER_KEY:
            yield 'Found handler "%s" %d time(s)' % (key, reduce_count)
        elif reduce_type == AnswersAudit._HANDLER_FUZZY_RULE_COUNTER_KEY:
            yield 'Found fuzzy rules %d time(s)' % reduce_count
        elif reduce_type == AnswersAudit._HANDLER_DEFAULT_RULE_COUNTER_KEY:
            yield 'Found default rules %d time(s)' % reduce_count
        elif reduce_type == AnswersAudit._HANDLER_STANDARD_RULE_COUNTER_KEY:
            yield 'Found rule type "%s" %d time(s)' % (key, reduce_count)
        elif reduce_type == AnswersAudit._STANDARD_RULE_SUBMISSION_COUNTER_KEY:
            yield 'Standard rule submitted %d time(s)' % reduce_count
        elif reduce_type == AnswersAudit._HANDLER_ERROR_RULE_COUNTER_KEY:
            yield (
                'Encountered invalid rule string %d time(s) (is it too long?): '
                '"%s"' % (reduce_count, key))
        elif reduce_type == AnswersAudit._UNIQUE_ANSWER_COUNTER_KEY:
            yield 'Total of %d unique answers' % reduce_count
        elif reduce_type == AnswersAudit._CUMULATIVE_ANSWER_COUNTER_KEY:
            yield 'Total of %d answers have been submitted' % reduce_count
        else:
            yield 'Internal error 2'


class AnswersAudit2(jobs.BaseMapReduceJobManager):

    # pylint: disable=invalid-name
    _HANDLER_FUZZY_RULE_COUNTER_KEY = 'FuzzyRuleCounter'
    _HANDLER_DEFAULT_RULE_COUNTER_KEY = 'DefaultRuleCounter'
    _HANDLER_STANDARD_RULE_COUNTER_KEY = 'StandardRuleCounter'
    _STANDARD_RULE_SUBMISSION_COUNTER_KEY = 'StandardRuleSubmitCounter'
    _HANDLER_ERROR_RULE_COUNTER_KEY = 'ErrorRuleCounter'
    _CUMULATIVE_ANSWER_COUNTER_KEY = 'CumulativeAnswerCounter'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateAnswersModel]

    @staticmethod
    def map(item):
        for answer in item.submitted_answer_list:
            yield (AnswersAudit2._CUMULATIVE_ANSWER_COUNTER_KEY, {
                'reduce_type': AnswersAudit2._CUMULATIVE_ANSWER_COUNTER_KEY
            })
            rule_str = answer['rule_spec_str']
            if rule_str == 'FuzzyMatches':
                yield (rule_str, {
                    'reduce_type': AnswersAudit2._HANDLER_FUZZY_RULE_COUNTER_KEY
                })
            elif rule_str == 'Default':
                yield (rule_str, {
                    'reduce_type': (
                        AnswersAudit2._HANDLER_DEFAULT_RULE_COUNTER_KEY)
                })
            elif '(' in rule_str and rule_str[-1] == ')':
                index = rule_str.index('(')
                rule_type = rule_str[0:index]
                rule_args = rule_str[index+1:-1]
                yield (rule_type, {
                    'reduce_type': (
                        AnswersAudit2._HANDLER_STANDARD_RULE_COUNTER_KEY),
                    'rule_str': rule_str,
                    'rule_args': rule_args
                })
                yield (AnswersAudit2._STANDARD_RULE_SUBMISSION_COUNTER_KEY, {
                    'reduce_type': (
                        AnswersAudit2._STANDARD_RULE_SUBMISSION_COUNTER_KEY)
                })
            else:
                yield (rule_str, {
                    'reduce_type': AnswersAudit2._HANDLER_ERROR_RULE_COUNTER_KEY
                })

    @staticmethod
    def reduce(key, stringified_values):
        reduce_type = None
        reduce_count = len(stringified_values)
        for value_str in stringified_values:
            value_dict = ast.literal_eval(value_str)
            if reduce_type and reduce_type != value_dict['reduce_type']:
                yield 'Internal error 1'
            elif not reduce_type:
                reduce_type = value_dict['reduce_type']

        if reduce_type == AnswersAudit2._HANDLER_FUZZY_RULE_COUNTER_KEY:
            yield 'Found fuzzy rules %d time(s)' % reduce_count
        elif reduce_type == AnswersAudit2._HANDLER_DEFAULT_RULE_COUNTER_KEY:
            yield 'Found default rules %d time(s)' % reduce_count
        elif reduce_type == AnswersAudit2._HANDLER_STANDARD_RULE_COUNTER_KEY:
            yield 'Found rule type "%s" %d time(s)' % (key, reduce_count)
        elif reduce_type == AnswersAudit2._STANDARD_RULE_SUBMISSION_COUNTER_KEY:
            yield 'Standard rule submitted %d time(s)' % reduce_count
        elif reduce_type == AnswersAudit2._HANDLER_ERROR_RULE_COUNTER_KEY:
            yield (
                'Encountered invalid rule string %d time(s) (is it too long?): '
                '"%s"' % (reduce_count, key))
        elif reduce_type == AnswersAudit2._CUMULATIVE_ANSWER_COUNTER_KEY:
            yield 'Total of %d answers have been submitted' % reduce_count
        else:
            yield 'Internal error 2'


class ClearMigratedAnswersJob(jobs.BaseMapReduceJobManager):
    """This job deletes all answers stored in the
    stats_models.StateAnswersModel and all book-keeping information stored in
    stats_models.MigratedAnswerModel. As an extra precaution, this job is a
    no-op unless feconf.DELETE_ANSWERS_AFTER_MIGRATION is enabled.
    """
    _DELETE_KEY = 'Migrated Answer Cleared'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            stats_models.StateAnswersModel, stats_models.MigratedAnswerModel]

    @staticmethod
    def map(item):
        if feconf.DELETE_ANSWERS_AFTER_MIGRATION:
            item.delete()
            yield (ClearMigratedAnswersJob._DELETE_KEY, 'Deleted answer.')

    @staticmethod
    def reduce(key, stringified_values):
        yield 'Deleted %d answers' % len(stringified_values)


class AnswerMigrationValidationJob(jobs.BaseMapReduceJobManager):
    """This job performs a strict validation to check if every answer in the old
    storage model has at least been migrated to the new model (no form of
    correctness happens in this test, only accountability).
    """
    _ERROR_KEY = 'Answer Migration Validation ERROR'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateRuleAnswerLogModel]

    @staticmethod
    def map(item):
        try:
            stats_models.MigratedAnswerModel.validate_answers_are_migrated(item)
        except utils.ValidationError as e:
            yield (AnswerMigrationValidationJob._ERROR_KEY, e)

    @staticmethod
    def reduce(key, stringified_values):
        if key == AnswerMigrationValidationJob._ERROR_KEY:
            for value in stringified_values:
                yield value


class AnswerMigrationJob(jobs.BaseMapReduceJobManager):
    """This job is responsible for migrating all answers stored within
    stats_models.StateRuleAnswerLogModel to stats_models.StateAnswersModel
    """
    _ERROR_KEY = 'Answer Migration ERROR'
    _ALREADY_MIGRATED_KEY = 'Answer ALREADY MIGRATED'

    _DEFAULT_RULESPEC_STR = 'Default'

    _RECONSTITUTION_FUNCTION_MAP = {
        'CodeRepl': '_cb_reconstitute_code_evaluation',
        'Continue': '_cb_reconstitute_continue',
        'EndExploration': '_cb_reconstitute_end_exploration',
        'GraphInput': '_cb_reconstitute_graph_input',
        'ImageClickInput': '_cb_reconstitute_image_click_input',
        'InteractiveMap': '_cb_reconstitute_interactive_map',
        'ItemSelectionInput': '_cb_reconstitute_item_selection_input',
        'LogicProof': '_cb_reconstitute_logic_proof',
        'MathExpressionInput': '_cb_reconstitute_math_expression_input',
        'MultipleChoiceInput': '_cb_reconstitute_multiple_choice_input',
        'MusicNotesInput': '_cb_reconstitute_music_notes_input',
        'NumericInput': '_cb_reconstitute_numeric_input',
        'PencilCodeEditor': '_cb_reconstitute_pencil_code_editor',
        'SetInput': '_cb_reconstitute_set_input',
        'TextInput': '_cb_reconstitute_text_input',
    }

    _EXPECTED_NOTE_TYPES = [
        'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5',
        'A5'
    ]

    # Following are all rules in Oppia during the time of answer migration. (44)
    # Each being migrated by this job is prefixed with a '+' and, conversely, a
    # prefix of '-' indicates it is not being migrated by this job. 6 rules are
    # not being recovered. Also, rules which cannot be 100% recovered are noted.
    # + checked_proof.Correct
    # - checked_proof.NotCorrect
    # - checked_proof.NotCorrectByCategory
    # + click_on_image.IsInRegion
    # - code_evaluation.CodeEquals
    # + code_evaluation.CodeContains (cannot be 100% recovered)
    # + code_evaluation.CodeDoesNotContain (cannot be 100% recovered)
    # + code_evaluation.OutputEquals (cannot be 100% recovered)
    # + code_evaluation.ResultsInError (cannot be 100% recovered)
    # - code_evaluation.ErrorContains
    # + coord_two_dim.Within
    # + coord_two_dim.NotWithin
    # - graph.HasGraphProperty
    # - graph.IsIsomorphicTo
    # + math_expression.IsMathematicallyEquivalentTo
    # + music_phrase.Equals
    # + music_phrase.IsLongerThan
    # + music_phrase.HasLengthInclusivelyBetween
    # + music_phrase.IsEqualToExceptFor
    # + music_phrase.IsTranspositionOf
    # + music_phrase.IsTranspositionOfExceptFor
    # + nonnegative_int.Equals
    # + normalized_string.Equals
    # + normalized_string.CaseSensitiveEquals
    # + normalized_string.StartsWith
    # + normalized_string.Contains
    # + normalized_string.FuzzyEquals
    # + real.Equals
    # + real.IsLessThan
    # + real.IsGreaterThan
    # + real.IsLessThanOrEqualTo
    # + real.IsGreaterThanOrEqualTo
    # + real.IsInclusivelyBetween
    # + real.IsWithinTolerance
    # + set_of_html_string.Equals
    # + set_of_html_string.ContainsAtLeastOneOf
    # + set_of_html_string.DoesNotContainAtLeastOneOf
    # + set_of_unicode_string.Equals
    # + set_of_unicode_string.IsSubsetOf
    # + set_of_unicode_string.IsSupersetOf
    # + set_of_unicode_string.HasElementsIn
    # + set_of_unicode_string.HasElementsNotIn
    # + set_of_unicode_string.OmitsElementsIn
    # + set_of_unicode_string.IsDisjointFrom

    # NOTE TO DEVELOPERS: This was never a modifiable value, so it will always
    # take the minimum value. It wasn't stored in answers, but it does not need
    # to be reconstituted.
    _NOTE_DURATION_FRACTION_PART = 1

    @classmethod
    def _get_exploration_models_by_versions(cls, exp_id, versions):
        """Similar to VersionedModel.get_version(), except this allows retrieval
        of exploration models marked as deleted.
        """
        try:
            # pylint: disable=protected-access
            snapshot_ids = [
                exp_models.ExplorationModel._get_snapshot_id(exp_id, version)
                for version in versions]
            exp_models_by_versions = [
                exp_models.ExplorationModel(id=exp_id) for _ in versions]
            return exp_models.ExplorationModel._reconstitute_multi_from_models(
                zip(snapshot_ids, exp_models_by_versions))
        except Exception:
            return None

    @classmethod
    def _get_explorations_from_models(cls, exp_models_by_versions):
        try:
            return (list([
                exp_services.get_exploration_from_model(exp_model)
                for exp_model in exp_models_by_versions
            ]), False)
        except utils.ExplorationConversionError:
            return (None, True)

    @classmethod
    def _get_all_exploration_versions(cls, exp_id):
        """Return all exploration versions for the given exploration ID in
        descending order by version, or an empty list if none could be found
        (such as if the exploration was permanently deleted). This function can
        retrieve deleted explorations. Returns None if any exploration that
        would have been returned failed a migration.
        """
        # NOTE(bhenning): It's possible some of these answers were submitted
        # during a playthrough where the exploration was changed midway. There's
        # not a lot that can be done about this since it's not possible to
        # demultiplex the stream of answers and identify which session they are
        # associated with.

        # Use get_by_id so that deleted explorations may be retrieved.
        latest_exp_model = exp_models.ExplorationModel.get_by_id(exp_id)
        if not latest_exp_model:
            # The exploration may have been permanently deleted.
            return []

        versions = list(reversed(xrange(1, latest_exp_model.version + 1)))
        exp_models_by_versions = cls._get_exploration_models_by_versions(
            exp_id, versions)
        if not exp_models_by_versions:
            return []
        exps, failed_migration = cls._get_explorations_from_models(
            exp_models_by_versions)
        return None if failed_migration else exps

    # This function comes from extensions.answer_summarizers.models.
    @classmethod
    def _get_hashable_value(cls, value):
        """This function returns a hashable version of the input value. If the
        value itself is hashable, it simply returns that value. If it's a list,
        it will return a tuple with all of the list's elements converted to
        hashable types. If it's a dictionary, it will first convert it to a list
        of pairs, where the key and value of the pair are converted to hashable
        types, then it will convert this list as any other list would be
        converted.
        """
        if isinstance(value, list):
            return tuple([cls._get_hashable_value(elem) for elem in value])
        elif isinstance(value, dict):
            return cls._get_hashable_value(
                [(cls._get_hashable_value(key), cls._get_hashable_value(value))
                 for (key, value) in value.iteritems()])
        else:
            return value

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
        # First, check whether it matches against the default rule, which
        # thereby translates to the default outcome.
        answer_groups = state.interaction.answer_groups
        if rule_str == cls._DEFAULT_RULESPEC_STR:
            return (len(answer_groups), 0, None)

        # Otherwise, first RuleSpec instance to match is the winner. The first
        # pass is to stringify parameters and doing a string comparison. This is
        # efficient and works for most situations.
        for answer_group_index, answer_group in enumerate(answer_groups):
            rule_specs = answer_group.rule_specs
            for rule_spec_index, rule_spec in enumerate(rule_specs):
                possible_stringified_rules = list(
                    cls._stringify_classified_rule(rule_spec))
                if rule_str in possible_stringified_rules:
                    return (answer_group_index, rule_spec_index, None)

        # The second attempt involves parsing the rule string and doing an exact
        # match on the rule parameter values. This needs to be done in the event
        # that the Python-turned-ascii parameters have their own elements out of
        # order (such as with a dict parameter).
        if '(' in rule_str and rule_str[-1] == ')':
            # http://stackoverflow.com/questions/9623114
            unordered_lists_equal = lambda x, y: (
                collections.Counter(
                    AnswerMigrationJob._get_hashable_value(x)) ==
                collections.Counter(
                    AnswerMigrationJob._get_hashable_value(y)))

            paren_index = rule_str.index('(')
            rule_type = rule_str[:paren_index]
            param_str_list_str = rule_str[paren_index+1:-1]
            partial_param_str_list = param_str_list_str.split(',')
            param_str_list = []

            # Correctly split the parameter list by correcting the results from
            # naively splitting it by merging subsequent elements in the list if
            # the comma fell within brackets or parentheses.
            concat_with_previous = False
            open_group_count = 0
            for partial_param in partial_param_str_list:
                if concat_with_previous:
                    param_str_list[-1] += ',' + partial_param
                else:
                    param_str_list.append(partial_param)
                for char in partial_param:
                    if char == '(' or char == '[' or char == '{':
                        open_group_count += 1
                    elif char == ')' or char == ']' or char == '}':
                        open_group_count -= 1
                concat_with_previous = open_group_count != 0

            try:
                param_list = [eval(param_str) for param_str in param_str_list]
                for answer_group_index, answer_group in enumerate(
                        answer_groups):
                    rule_specs = answer_group.rule_specs
                    for rule_spec_index, rule_spec in enumerate(rule_specs):
                        if rule_spec.rule_type != rule_type:
                            continue
                        if unordered_lists_equal(
                                param_list, rule_spec.inputs.values()):
                            return (answer_group_index, rule_spec_index, None)
            except Exception:
                # This failure indicates a serious mismatch with the parameter
                # string.
                return (
                    None, None,
                    'failing to evaluate param string: %s' % param_str_list)

        return (None, None, 'Failed to match rule string')

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

    @classmethod
    def _normalize_raw_answer_object(
            cls, answer_object, raw_answer, answer_str):
        try:
            return (
                answer_object.normalize(raw_answer), None)
        except AssertionError as error:
            answer_object_type_name = type(answer_object).__name__
            error_str = str(error)
            return (
                None,
                'Failed to normalize %s: %s (answer: \'%s\'), because of: '
                '%s' % (
                    answer_object_type_name, raw_answer, answer_str, error_str))

    @classmethod
    def _cb_reconstitute_code_evaluation(
            cls, interaction, rule_spec, rule_str, answer_str):
        # The Jinja representation for CodeEvaluation answer strings is:
        #   {{answer.code}}

        rule_types_without_output = [
            'CodeContains', 'CodeDoesNotContain', 'ResultsInError'
        ]
        # NOTE: Not all of CodeEvaluation can be reconstituted. Evaluation,
        # error, and output (with one rule_type exception) cannot be recovered
        # without actually running the code. For this reason, OutputEquals,
        # CodeContains, CodeDoesNotContain, and ResultsInError can only be
        # partially recovered. The missing values will be empty strings as
        # special sentinel values. Empty strings must be checked in conjunction
        # with the session_id to determine whether the empty string is the
        # special sentinel value.

        if rule_spec.rule_type == 'OutputEquals':
            code_output = cls._get_plaintext(rule_spec.inputs['x'])
            if not answer_str:
                return (None, 'Failed to recover code: %s' % answer_str)
            code_evaluation_dict = {
                'code': answer_str,
                'output': code_output,
                'evaluation': '',
                'error': ''
            }
            return cls._normalize_raw_answer_object(
                objects.CodeEvaluation, code_evaluation_dict, answer_str)
        elif rule_spec.rule_type in rule_types_without_output:
            if not answer_str:
                return (None, 'Failed to recover code: %s' % answer_str)
            code_evaluation_dict = {
                'code': answer_str,
                'output': '',
                'evaluation': '',
                'error': ''
            }
            return cls._normalize_raw_answer_object(
                objects.CodeEvaluation, code_evaluation_dict, answer_str)
        return (
            None,
            'Cannot reconstitute a CodeEvaluation object without OutputEquals, '
            'CodeContains, CodeDoesNotContain, or ResultsInError rules.')

    @classmethod
    def _cb_reconstitute_continue(
            cls, interaction, rule_spec, rule_str, answer_str):
        # The Jinja representation for CodeEvaluation answer strings is blank.
        if not rule_spec and not answer_str and (
                rule_str == cls._DEFAULT_RULESPEC_STR):
            # There is no answer for 'Continue' interactions.
            return (None, None)
        return (
            None,
            'Expected Continue submissions to only be default rules: %s'
            % rule_str)

    @classmethod
    def _cb_reconstitute_end_exploration(
            cls, interaction, rule_spec, rule_str, answer_str):
        return (
            None,
            'There should be no answers submitted for the end exploration.')

    @classmethod
    def _cb_reconstitute_graph_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        # pylint: disable=line-too-long
        # The Jinja representation for Graph answer strings is:
        #   ({% for vertex in answer.vertices -%}
        #     {% if answer.isLabeled -%}{{vertex.label}}{% else -%}{{loop.index}}{% endif -%}
        #     {% if not loop.last -%},{% endif -%}
        #   {% endfor -%})
        #   [{% for edge in answer.edges -%}
        #     ({{edge.src}},{{edge.dst}}){% if not loop.last -%},{% endif -%}
        #   {% endfor -%}]

        # This answer type is not being reconstituted. 'HasGraphProperty' has
        # never had an answer submitted for it. 'IsIsomorphicTo' has had 5
        # answers submitted for it, 4 of which are too long to actually
        # reconstitute because the rule_spec_str was cut off in the key name.
        # That leaves 1 lonely graph answer to reconstitute; we're dropping it
        # in favor of avoiding the time needed to build and test the
        # reconstitution of the graph object.
        return (None, 'Unsupported answer type: \'%s\' for answer \'%s\'' % (
            rule_str, answer_str))

    @classmethod
    def _cb_reconstitute_image_click_input(cls, interaction, rule_spec,
                                           rule_str, answer_str):
        # pylint: disable=line-too-long
        # The Jinja representation for ClickOnImage answer strings is:
        #   ({{'%0.3f' | format(answer.clickPosition[0]|float)}}, {{'%0.3f'|format(answer.clickPosition[1]|float)}})
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
            click_on_image_dict = {
                'clickPosition': [
                    float(match.group('x')), float(match.group('y'))
                ],
                'clickedRegions': [region_name]
            }
            return cls._normalize_raw_answer_object(
                objects.ClickOnImage, click_on_image_dict, answer_str)
        return (
            None,
            'Cannot reconstitute ImageClickInput object without an IsInRegion '
            'rule.')

    @classmethod
    def _cb_reconstitute_interactive_map(
            cls, interaction, rule_spec, rule_str, answer_str):
        # pylint: disable=line-too-long
        # The Jinja representation for CoordTwoDim answer strings is:
        #   ({{'%0.6f' | format(answer[0]|float)}}, {{'%0.6f'|format(answer[1]|float)}})
        supported_rule_types = ['Within', 'NotWithin']
        if rule_spec.rule_type not in supported_rule_types:
            return (
                None,
                'Unsupported rule type encountered while attempting to '
                'reconstitute CoordTwoDim object: %s' % rule_spec.rule_type)

        # Match the pattern: '(real, real)' to extract the coordinates.
        pattern = re.compile(
            r'\((?P<x>-?\d+\.?\d*), (?P<y>-?\d+\.?\d*)\)')
        match = pattern.match(answer_str)
        if not match:
            # Prior to #380ea2 on 03 June 2014, the answers were stored as
            # stringifications of the CoordTwoDim object using schema_utils, so
            # the pattern for reconstruction is slightly different.
            pattern = re.compile(
                r'\[(?P<x>-?\d+\.?\d*), (?P<y>-?\d+\.?\d*)\]')
            match = pattern.match(answer_str)
            if not match:
                return (
                    None, 'Bad answer string in InteractiveMap %s rule.' % (
                        rule_spec.rule_type))
        coord_two_dim_list = [
            float(match.group('x')), float(match.group('y'))
        ]
        return cls._normalize_raw_answer_object(
            objects.CoordTwoDim, coord_two_dim_list, answer_str)

    @classmethod
    def _cb_reconstitute_item_selection_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        # The Jinja representation for SetOfHtmlString answer strings is:
        #   {{ answer }}
        supported_rule_types = [
            'Equals', 'ContainsAtLeastOneOf', 'DoesNotContainAtLeastOneOf'
        ]
        if rule_spec.rule_type in supported_rule_types:
            option_list = eval(answer_str)
            if not isinstance(option_list, list):
                return (
                    None,
                    'Bad answer string in ItemSelectionInput Equals rule.')
            return cls._normalize_raw_answer_object(
                objects.SetOfHtmlString, option_list, answer_str)
        return (
            None,
            'Cannot reconstitute ItemSelectionInput object without an Equals '
            'rule.')

    @classmethod
    def _cb_reconstitute_logic_proof(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'Correct':
            # The Jinja representation of the answer is:
            #   {{answer.proof_string}}

            # Because the rule implies the proof was correct, half of the
            # CheckedProof structure does not need to be saved. The remaining
            # structure consists of three strings: assumptions_string,
            # target_string, and proof_string. The latter is already available
            # as the answer_str.
            if not answer_str:
                return (
                    None,
                    'Failed to recover CheckedProof answer: %s' % answer_str)

            # assumptions_string and target_string come from the assumptions and
            # results customized to this particular LogicProof instance.
            question_details = (
                interaction.customization_args['question']['value'])
            assumptions = question_details['assumptions']
            results = question_details['results']

            expressions = []
            top_types = []
            for assumption in assumptions:
                expressions.append(assumption)
                top_types.append('boolean')
            expressions.append(results[0])
            top_types.append('boolean')
            operators = AnswerMigrationJob._BASE_STUDENT_LANGUAGE['operators']

            if len(assumptions) <= 1:
                assumptions_string = (
                    AnswerMigrationJob._display_expression_array(
                        assumptions, operators))
            else:
                assumptions_string = '%s and %s' % (
                    AnswerMigrationJob._display_expression_array(
                        assumptions[0:-1], operators),
                    AnswerMigrationJob._display_expression_helper(
                        assumptions[-1], operators, 0))

            target_string = AnswerMigrationJob._display_expression_helper(
                results[0], operators, 0)

            return cls._normalize_raw_answer_object(objects.CheckedProof, {
                'assumptions_string': assumptions_string,
                'target_string': target_string,
                'proof_string': answer_str,
                'correct': True
            }, answer_str)
        return (
            None,
            'Cannot reconstitute CheckedProof object without a Correct rule.')

    @classmethod
    def _cb_reconstitute_math_expression_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'IsMathematicallyEquivalentTo':
            math_expression_dict = eval(answer_str)
            if not isinstance(math_expression_dict, dict):
                return (
                    None,
                    'Bad answer string in MathExpressionInput '
                    'IsMathematicallyEquivalentTo rule.')
            return cls._normalize_raw_answer_object(
                objects.MathExpression, math_expression_dict, answer_str)
        return (
            None,
            'Cannot reconstitute MathExpressionInput object without an '
            'IsMathematicallyEquivalentTo rule.')

    @classmethod
    def _cb_reconstitute_multiple_choice_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        # The Jinja representation for NonnegativeInt answer strings is:
        #   {{ choices[answer|int] }}
        if rule_spec.rule_type == 'Equals':
            # Extract the clicked index from the rule string.
            clicked_index = int(rule_str[len(rule_spec.rule_type) + 1:-1])
            customization_args = interaction.customization_args
            choices = customization_args['choices']['value']
            if clicked_index >= len(choices):
                return (
                    None,
                    'Clicked index %d is out of bounds for corresponding '
                    'choices in the exploration: %s (len=%d)' % (
                        clicked_index, choices, len(choices)))
            if answer_str != choices[clicked_index]:
                return (
                    None,
                    'Clicked index %d and submitted answer \'%s\' does not '
                    'match corresponding choice in the exploration: \'%s\'' % (
                        clicked_index, answer_str, choices[clicked_index]))
            return cls._normalize_raw_answer_object(
                objects.NonnegativeInt, clicked_index, answer_str)
        return (
            None,
            'Cannot reconstitute MultipleChoiceInput object without an Equals '
            'rule.')

    @classmethod
    def _cb_reconstitute_music_notes_input(
            cls, interaction, rule_spec, rule_str, answer_str):
        # The format of serialized answers is based on the following Jinja:
        #   {% if (answer | length) == 0 -%}
        #     No answer given.
        #   {% else -%}
        #     [{% for note in answer -%}
        #       {% for prop in note -%}
        #         {% if prop == 'readableNoteName' %}{{note[prop]}}{% endif -%}
        #       {% endfor -%}
        #       {% if not loop.last -%},{% endif -%}
        #     {% endfor -%}]
        #   {% endif -%}
        supported_rule_types = [
            'Equals', 'IsLongerThan', 'HasLengthInclusivelyBetween',
            'IsEqualToExceptFor', 'IsTranspositionOf',
            'IsTranspositionOfExceptFor'
        ]
        if rule_spec.rule_type not in supported_rule_types:
            return (
                None,
                'Unsupported rule type encountered while attempting to '
                'reconstitute MusicPhrase object: %s' % rule_spec.rule_type)
        answer_str = answer_str.rstrip()
        if answer_str == 'No answer given.':
            return cls._normalize_raw_answer_object(
                objects.MusicPhrase, [], answer_str)
        if answer_str[0] != '[' or answer_str[-1] != ']' or ' ' in answer_str:
            return (None, 'Invalid music note answer string: %s' % answer_str)
        note_list_str = answer_str[1:-1]
        note_list = note_list_str.split(',')
        for note_str in note_list:
            if note_str not in AnswerMigrationJob._EXPECTED_NOTE_TYPES:
                return (
                    None,
                    'Invalid music note answer string (bad note: %s): %s' % (
                        note_str, answer_str))
        return cls._normalize_raw_answer_object(objects.MusicPhrase, [{
            'readableNoteName': note_str,
            'noteDuration': {
                'num': AnswerMigrationJob._NOTE_DURATION_FRACTION_PART,
                'den': AnswerMigrationJob._NOTE_DURATION_FRACTION_PART
            }
        } for note_str in note_list], answer_str)

    @classmethod
    def _cb_reconstitute_numeric_input(
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
        return cls._normalize_raw_answer_object(
            objects.Real, input_value, answer_str)

    @classmethod
    def _cb_reconstitute_pencil_code_editor(
            cls, interaction, rule_spec, rule_str, answer_str):
        if rule_spec.rule_type == 'OutputEquals':
            # Luckily, Pencil Code answers stored the actual dict rather than
            # just the code; it's easier to reconstitute.
            code_evaluation_dict = eval(cls._get_plaintext(answer_str))
            if not isinstance(code_evaluation_dict, dict):
                return (None, 'Failed to recover pencil code: %s' % answer_str)
            return cls._normalize_raw_answer_object(
                objects.CodeEvaluation, code_evaluation_dict, answer_str)
        return (
            None,
            'Cannot reconstitute a CodeEvaluation object without an '
            'OutputEquals rule.')

    @classmethod
    def _cb_reconstitute_set_input(
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

        unicode_string_list = eval(answer_str)
        if not isinstance(unicode_string_list, list):
            return (None, 'Failed to recover set: %s' % answer_str)
        return cls._normalize_raw_answer_object(
            objects.SetOfUnicodeString, unicode_string_list, answer_str)

    @classmethod
    def _cb_reconstitute_text_input(
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
        return cls._normalize_raw_answer_object(
            objects.NormalizedString, answer_str, answer_str)

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
    def _evaluate_string_literal(cls, literal_str):
        class Transformer(ast.NodeTransformer):
            ALLOWED_NAMES = set(['datetime', 'None', 'False', 'True'])
            ALLOWED_NODE_TYPES = set(['Expression', 'Tuple', 'Call', 'Name',
                                      'Load', 'Str', 'Num', 'List', 'Dict',
                                      'Attribute'])

            # pylint: disable=invalid-name
            def visit_Name(self, node):
                if node.id not in self.ALLOWED_NAMES:
                    raise RuntimeError(
                        'Name access to %s not allowed' % node.id)
                return self.generic_visit(node)

            def generic_visit(self, node):
                node_type_name = type(node).__name__
                if node_type_name not in self.ALLOWED_NODE_TYPES:
                    raise RuntimeError(
                        'Invalid node of type: %s' % node_type_name)
                return ast.NodeTransformer.generic_visit(self, node)

        tree = ast.parse(literal_str, mode='eval')
        Transformer().visit(tree)
        compiled = compile(tree, '<AST>', 'eval')
        return eval(compiled, {'datetime': datetime})

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateRuleAnswerLogModel]

    @staticmethod
    def map(item):
        # If this answer has alerady been migrated, skip it.
        if stats_models.MigratedAnswerModel.is_marked_as_migrated(item.id):
            yield (
                AnswerMigrationJob._ALREADY_MIGRATED_KEY,
                'Encountered a submitted answer which has already been '
                'migrated')
            return

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

        # Split up the answers across multiple shards (10) so that they may be
        # more randomly distributed.
        random.seed('%s.%s.%s' % (
            item.id, datetime.datetime.utcnow(), os.urandom(64)))
        yield ('%s.%s.%s' % (exp_id, state_name, random.randint(0, 9)), {
            'item_id': item.id,
            'exploration_id': exp_id,
            'state_name': state_name,
            'rule_str': rule_str,
            'last_updated': item.last_updated
        })

    @staticmethod
    def reduce(key, stringified_values):
        # Output any errors or notices encountered during the map step.
        if key == AnswerMigrationJob._ERROR_KEY or (
                key == AnswerMigrationJob._ALREADY_MIGRATED_KEY):
            for value in stringified_values:
                yield value
            return

        value_dict_list = [
            AnswerMigrationJob._evaluate_string_literal(stringified_value)
            for stringified_value in stringified_values]

        # The first dict can be used to extract exploration_id and state_name,
        # since they will be same for all mapped results. It cannot be used to
        # extract any other values, however. Doing so will introduce a race
        # condition since the order of value_dict_list is not deterministic.
        first_value_dict = value_dict_list[0]
        exploration_id = first_value_dict['exploration_id']
        state_name = first_value_dict['state_name']

        # One major point of failure is the exploration not existing. Another
        # major point of failure comes from the time matching.
        explorations = AnswerMigrationJob._get_all_exploration_versions(
            exploration_id)

        if explorations is None:
            yield (
                'Encountered exploration (exp ID: %s) which cannot be '
                'converted to the latest states schema version. Cannot '
                'recover.' % (exploration_id))
            return
        elif len(explorations) == 0:
            yield (
                'Encountered permanently missing exploration referenced to by '
                'submitted answers. Migrating with missing exploration and '
                'state.')

        for value_dict in value_dict_list:
            item_id = value_dict['item_id']
            item = stats_models.StateRuleAnswerLogModel.get(item_id)
            rule_str = value_dict['rule_str']
            last_updated = value_dict['last_updated']

            migration_errors = AnswerMigrationJob._migrate_answers(
                item_id, explorations, exploration_id, state_name, item.answers,
                rule_str, last_updated)

            for error in migration_errors:
                yield (
                    'Item ID: %s, last updated: %s, state name: %s, '
                    'exp id: %s, error: %s' % (
                        item_id, last_updated, state_name, exploration_id,
                        error))

    @classmethod
    def _migrate_answers(cls, item_id, explorations, exploration_id, state_name,
                         answers, rule_str, last_updated):
        migrated_answers = []
        matched_explorations = []
        answer_strings = []
        answer_frequencies = []
        migrated_answer_count = 0
        for answer_str, answer_frequency in answers.iteritems():
            migrated_answer, matched_exp, error = cls._try_migrate_answer(
                answer_str, rule_str, last_updated, explorations, state_name)
            if not error:
                # Split the answer into batches of 100 for frequency, to avoid
                # saving too many answers to the datatore in one go. Simply
                # repeating the answer, exploration, and answer string is
                # adequate because answers can be stored incrementally.
                def _append_answer(
                        migrated_answer, matched_exp, answer_str, frequency):
                    migrated_answers.append(migrated_answer)
                    matched_explorations.append(matched_exp)
                    answer_strings.append(answer_str)
                    answer_frequencies.append(frequency)

                batch_count = answer_frequency / 100
                for _ in xrange(batch_count):
                    _append_answer(
                        migrated_answer, matched_exp, answer_str, 100)

                remaining_answers = answer_frequency % 100
                if remaining_answers > 0:
                    _append_answer(
                        migrated_answer, matched_exp, answer_str,
                        remaining_answers)

                migrated_answer_count = migrated_answer_count + 1
            else:
                yield error

        if migrated_answer_count != len(answers):
            yield 'Failed to migrate all answers for item batch: %s' % item_id
            return

        for answer, exploration, answer_str, answer_frequency in zip(
                migrated_answers, matched_explorations, answer_strings,
                answer_frequencies):
            # The resolved answer will simply be duplicated in the new data
            # store to replicate frequency.
            submitted_answer_list = [answer] * answer_frequency

            if exploration:
                stats_services.record_answers(
                    exploration, state_name, submitted_answer_list)
                exploration_version = exploration.version
            else:
                exploration_version = (
                    stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_VERSION) # pylint: disable=line-too-long
                interaction_id = (
                    stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_INTERACTION_ID) # pylint: disable=line-too-long

                # NOTE(bhenning): This has code skew with
                # stats_services.record_answer(), however this approach allows
                # the answer to be recorded without a loaded exploration or
                # state objects.
                state_answers = stats_domain.StateAnswers(
                    exploration_id, exploration_version, state_name,
                    interaction_id, submitted_answer_list)
                state_answers.validate()
                stats_models.StateAnswersModel.insert_submitted_answers(
                    state_answers.exploration_id,
                    state_answers.exploration_version, state_answers.state_name,
                    state_answers.interaction_id,
                    state_answers.get_submitted_answer_dict_list())

            stats_models.MigratedAnswerModel.finish_migrating_answer(
                item_id, exploration_id, exploration_version, state_name)

    @classmethod
    def _try_migrate_answer(cls, answer_str, rule_str, last_updated,
                            explorations, state_name):
        """Try to migrate the answer based on the given list of explorations.
        The explorations are descending in order by their version. More recent
        explorations (earlier in the list) are filtered out based on the
        last_updated timestamp, which is the latest possible time the given
        answer could have been submitted. This function guarantees the best
        possible migrated answer for the most recent exploration which is not
        newer than the answer. If the answer can successfully be migrated to two
        different answer object types, this function will fail due to an
        ambiguous migration result.

        Returns a tuple containing the migrated answer, the exploration that was
        used to migrate the answer, an an error. The error is None unless the
        migration failed.
        """
        # TODO(bhenning): Consider outputting the results of running this
        # matching procedure (e.g. how many versions were skipped with errors
        # before a matching answer was found).
        if not explorations:
            answer, error = cls._migrate_answer(
                answer_str, rule_str, None, state_name)
            return (answer, None, error)

        matched_answer = None
        first_error = None
        matched_exploration = None
        # pylint: disable=unidiomatic-typecheck
        for exploration in explorations:
            # A newer exploration could not be the recipient of this answer if
            # the last answer for this entity was submitted before this version
            # of the exploration was created.
            if exploration.created_on >= last_updated:
                continue
            answer, error = cls._migrate_answer(
                answer_str, rule_str, exploration, state_name)
            if not answer:
                if not first_error:
                    first_error = error
            elif not matched_answer:
                matched_answer = answer
                matched_exploration = exploration
            elif type(answer.normalized_answer) != type(
                    matched_answer.normalized_answer):
                return (
                    None,
                    None,
                    'Migrated answer \'%s\' can migrate to two types: %s (exp '
                    'version: %d) and %s (exp version: %d)' % (
                        answer_str.encode('utf-8'),
                        type(matched_answer.normalized_answer),
                        matched_exploration.version,
                        type(answer.normalized_answer), exploration.version))
        if matched_answer:
            first_error = None
        elif not first_error:
            first_error = (
                'Failed to successfully reconstitute any answer from answer '
                'string \'%s\'' % answer_str.encode('utf-8'))
        return (matched_answer, matched_exploration, first_error)

    @classmethod
    def _migrate_answer(cls, answer_str, rule_str, exploration, state_name):
        # Another point of failure is the state not matching due to an
        # incorrect exploration version selection.
        if exploration and state_name not in exploration.states:
            return (
                None,
                'Failed to match answer \'%s\' to exploration snapshots '
                'history (exp ID: %s, exp version: %d).' % (
                    answer_str.encode('utf-8'), exploration.id,
                    exploration.version))

        classification_categorization = (
            cls._infer_classification_categorization(rule_str))

        # Fuzzy rules are not supported by the migration job. No fuzzy rules
        # should have been submitted in production, so all existing rules are
        # being ignored.
        if classification_categorization == (
                exp_domain.TRAINING_DATA_CLASSIFICATION):
            return (None, 'Cannot reconstitute fuzzy rule')

        # Params were, unfortunately, never stored. They cannot be trivially
        # recovered.
        params = []

        # These are values which cannot be reconstituted; use special sentinel
        # values for them, instead.
        session_id = stats_domain.MIGRATED_STATE_ANSWER_SESSION_ID
        time_spent_in_sec = (
            stats_domain.MIGRATED_STATE_ANSWER_TIME_SPENT_IN_SEC)

        # Unfortunately, the answer_group_index and rule_spec_index may be
        # wrong for soft rules, since previously there was no way of
        # differentiating between which soft rule was selected. This problem is
        # also revealed for RuleSpecs which produce the same rule_spec_str.
        answer_group_index = None
        rule_spec_index = None

        # By default, the answer is matched with the default outcome.
        answer_group = None
        rule_spec = None

        if exploration:
            state = exploration.states[state_name]
            (answer_group_index, rule_spec_index, error_string) = (
                cls._infer_which_answer_group_and_rule_match_answer(
                    state, rule_str))

            # Major point of failure: answer_group_index or rule_spec_index may
            # return none when it's not a default result.
            if answer_group_index is None or rule_spec_index is None:
                return (
                    None,
                    'Failed to match rule string: \'%s\' because of %s '
                    '(state=%s)' % (
                        rule_str.encode('utf-8'),
                        error_string.encode('utf-8'),
                        state.to_dict()))

            answer_groups = state.interaction.answer_groups
            if answer_group_index != len(answer_groups):
                answer_group = answer_groups[answer_group_index]
                rule_spec = answer_group.rule_specs[rule_spec_index]

            # Major point of failure is if answer returns None; the error
            # variable will contain why the reconstitution failed.
            (answer, error) = AnswerMigrationJob._reconstitute_answer_object(
                state, rule_spec, rule_str, answer_str)
            if error:
                return (None, error)

            return (stats_domain.SubmittedAnswer(
                answer, state.interaction.id, answer_group_index,
                rule_spec_index, classification_categorization, params,
                session_id, time_spent_in_sec, rule_spec_str=rule_str,
                answer_str=answer_str), None)
        else:
            return (stats_domain.SubmittedAnswer(
                stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_ANSWER,
                stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_INTERACTION_ID, # pylint: disable=line-too-long
                answer_group_index, rule_spec_index,
                classification_categorization, params, session_id,
                time_spent_in_sec, rule_spec_str=rule_str,
                answer_str=answer_str), None)



    # Following are helpers and constants related to reconstituting the
    # CheckedProof object.

    @classmethod
    def _display_expression_helper(
            cls, expression, operators, desirability_of_brackets):
        """From extensions/interactions/LogicProof/static/js/shared.js"""

        desirability_of_brackets_below = (
            2 if (
                expression['top_kind_name'] == 'binary_connective' or
                expression['top_kind_name'] == 'binary_relation' or
                expression['top_kind_name'] == 'binary_function')
            else 1 if (
                expression['top_kind_name'] == 'unary_connective' or
                expression['top_kind_name'] == 'quantifier')
            else 0)
        processed_arguments = []
        processed_dummies = []
        for argument in expression['arguments']:
            processed_arguments.append(
                AnswerMigrationJob._display_expression_helper(
                    argument, operators, desirability_of_brackets_below))
        for dummy in expression['dummies']:
            processed_dummies.append(
                AnswerMigrationJob._display_expression_helper(
                    dummy, operators, desirability_of_brackets_below))
        symbol = (
            expression['top_operator_name']
            if expression['top_operator_name'] not in operators
            else expression['top_operator_name']
            if 'symbols' not in operators[expression['top_operator_name']]
            else operators[expression['top_operator_name']]['symbols'][0])

        formatted_result = None
        if (expression['top_kind_name'] == 'binary_connective' or
                expression['top_kind_name'] == 'binary_relation' or
                expression['top_kind_name'] == 'binary_function'):
            formatted_result = (
                '(%s)' % symbol.join(processed_arguments)
                if desirability_of_brackets > 0
                else symbol.join(processed_arguments))
        elif expression['top_kind_name'] == 'unary_connective':
            output = '%s%s' % (symbol, processed_arguments[0])
            formatted_result = (
                '(%s)' % output if desirability_of_brackets == 2 else output)
        elif expression['top_kind_name'] == 'quantifier':
            output = '%s%s.%s' % (
                symbol, processed_dummies[0], processed_arguments[0])
            formatted_result = (
                '(%s)' % output if desirability_of_brackets == 2 else output)
        elif expression['top_kind_name'] == 'bounded_quantifier':
            output = '%s%s.%s' % (
                symbol, processed_arguments[0], processed_arguments[1])
            formatted_result = (
                '(%s)' % output if desirability_of_brackets == 2 else output)
        elif (expression['top_kind_name'] == 'prefix_relation'
              or expression['top_kind_name'] == 'prefix_function'):
            formatted_result = (
                '%s(%s)' % (symbol, ','.join(processed_arguments)))
        elif expression['top_kind_name'] == 'ranged_function':
            formatted_result = '%s{%s | %s}' % (
                symbol, processed_arguments[0], processed_arguments[1])
        elif (expression['top_kind_name'] == 'atom'
              or expression['top_kind_name'] == 'constant'
              or expression['top_kind_name'] == 'variable'):
            formatted_result = symbol
        else:
            raise Exception('Unknown kind %s sent to displayExpression()' % (
                expression['top_kind_name']))
        return formatted_result

    @classmethod
    def _display_expression_array(cls, expression_array, operators):
        """From extensions/interactions/LogicProof/static/js/shared.js"""

        return ', '.join([
            cls._display_expression_helper(expression, operators, 0)
            for expression in expression_array])

    # These are from extensions/interactions/LogicProof/static/js/data.js
    _SINGLE_BOOLEAN = {
        'type': 'boolean',
        'arbitrarily_many': False
    }
    _SINGLE_ELEMENT = {
        'type': 'element',
        'arbitrarily_many': False
    }
    _BASE_STUDENT_LANGUAGE = {
        'types': {
            'boolean': {
                'quantifiable': False
            },
            'element': {
                'quantifiable': True
            }
        },
        'kinds': {
            'binary_connective': {
                'display': [{
                    'format': 'argument_index',
                    'content': 0
                }, {
                    'format': 'name'
                }, {
                    'format': 'argument_index',
                    'content': 1
                }]
            },
            'unary_connective': {
                'matchable': False,
                'display': [{
                    'format': 'name'
                }, {
                    'format': 'argument_index',
                    'content': 0
                }]
            },
            'quantifier': {
                'matchable': False,
                'display': [{
                    'format': 'name'
                }, {
                    'format': 'dummy_index',
                    'content': 0
                }, {
                    'format': 'string',
                    'content': '.'
                }, {
                    'format': 'argument_index',
                    'content': 0
                }]
            },
            'binary_function': {
                'matchable': False,
                'display': [{
                    'format': 'argument_index',
                    'content': 0
                }, {
                    'format': 'name'
                }, {
                    'format': 'argument_index',
                    'content': 1
                }],
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'element'
                }]
            },
            'prefix_function': {
                'matchable': False,
                'typing': [{
                    'arguments': [{
                        'type': 'element',
                        'arbitrarily_many': True
                    }],
                    'dummies': [],
                    'output': 'element'
                }, {
                    'arguments': [{
                        'type': 'element',
                        'arbitrarily_many': True
                    }],
                    'dummies': [],
                    'output': 'boolean'
                }]
            },
            'constant': {
                'matchable': False,
                'display': [{
                    'format': 'name'
                }],
                'typing': [{
                    'arguments': [],
                    'dummies': [],
                    'output': 'element'
                }]
            },
            'variable': {
                'matchable': True,
                'display': [{
                    'format': 'name'
                }],
                'typing': [{
                    'arguments': [],
                    'dummies': [],
                    'output': 'element'
                }, {
                    'arguments': [],
                    'dummies': [],
                    'output': 'boolean'
                }]
            }
        },
        'operators': {
            'and': {
                'kind': 'binary_connective',
                'typing': [{
                    'arguments': [_SINGLE_BOOLEAN, _SINGLE_BOOLEAN],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': [u'\u2227']
            },
            'or': {
                'kind': 'binary_connective',
                'typing': [{
                    'arguments': [_SINGLE_BOOLEAN, _SINGLE_BOOLEAN],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': [u'\u2228']
            },
            'implies': {
                'kind': 'binary_connective',
                'typing': [{
                    'arguments': [_SINGLE_BOOLEAN, _SINGLE_BOOLEAN],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['=>']
            },
            'iff': {
                'kind': 'binary_connective',
                'typing': [{
                    'arguments': [_SINGLE_BOOLEAN, _SINGLE_BOOLEAN],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['<=>']
            },
            'not': {
                'kind': 'unary_connective',
                'typing': [{
                    'arguments': [_SINGLE_BOOLEAN],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['~']
            },
            'for_all': {
                'kind': 'quantifier',
                'typing': [{
                    'arguments': [_SINGLE_BOOLEAN],
                    'dummies': [_SINGLE_ELEMENT],
                    'output': 'boolean'
                }],
                'symbols': [u'\u2200', '.']
            },
            'exists': {
                'kind': 'quantifier',
                'typing': [{
                    'arguments': [_SINGLE_BOOLEAN],
                    'dummies': [_SINGLE_ELEMENT],
                    'output': 'boolean'
                }],
                'symbols': [u'\u2203', '.']
            },
            'equals': {
                'kind': 'binary_relation',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['=']
            },
            'not_equals': {
                'kind': 'binary_relation',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['!=']
            },
            'less_than': {
                'kind': 'binary_relation',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['<']
            },
            'greater_than': {
                'kind': 'binary_relation',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['>']
            },
            'less_than_or_equals': {
                'kind': 'binary_relation',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['<=']
            },
            'greater_than_or_equals': {
                'kind': 'binary_relation',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'boolean'
                }],
                'symbols': ['>=']
            },
            'addition': {
                'kind': 'binary_function',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'element'
                }],
                'symbols': ['+']
            },
            'subtraction': {
                'kind': 'binary_function',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'element'
                }],
                'symbols': ['-']
            },
            'multiplication': {
                'kind': 'binary_function',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'element'
                }],
                'symbols': ['*']
            },
            'division': {
                'kind': 'binary_function',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'element'
                }],
                'symbols': ['/']
            },
            'exponentiation': {
                'kind': 'binary_function',
                'typing': [{
                    'arguments': [_SINGLE_ELEMENT, _SINGLE_ELEMENT],
                    'dummies': [],
                    'output': 'element'
                }],
                'symbols': ['^']
            }
        }
    }
