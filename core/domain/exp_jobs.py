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

"""Jobs for explorations."""

__author__ = 'Frederik Creemers'

import re

from core import jobs
from core.platform import models
(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration])
transaction_services = models.Registry.import_transaction_services()
import utils


class ExpSummariesCreationOneOffJob(jobs.BaseMapReduceJobManager):
    """Job that calculates summaries of explorations, which can be
    used to get e.g. the gallery. For every ExplorationModel entity,
    create a ExpSummaryModel entity containing information described
    in ExpSummariesAggregator.

    The summaries store the following information:
        title, category, objective, language_code, skill_tags,
        last_updated, created_on, status (private, public or
        publicized), community_owned, owner_ids, editor_ids,
        viewer_ids, version.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exploration_model):
        from core.domain import exp_services
        if not exploration_model.deleted:
            exp_services.create_exploration_summary(exploration_model.id)

    @staticmethod
    def reduce(exp_id, list_of_exps):
        pass


class IndexAllExplorationsJobManager(jobs.BaseMapReduceJobManager):
    """Job that indexes all explorations"""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        # We're inline importing here to break import loops like this: (->
        # means imports):
        #   exp_services -> event_services -> jobs_registry ->
        #   exp_jobs -> exp_services.
        from core.domain import exp_services
        exp_services.index_explorations_given_ids([item.id])


class ExplorationValidityJobManager(jobs.BaseMapReduceJobManager):
    """Job that checks (non-strict) validation status of all explorations."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        from core.domain import exp_services
        exploration = exp_services.get_exploration_from_model(item)
        try:
            exploration.validate(strict=False)
        except utils.ValidationError as e:
            yield (item.id, unicode(e).encode('utf-8'))

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class ParameterDiscoveryJobManager(jobs.BaseMapReduceJobManager):

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        from core.domain import exp_services

        def _get_nontrivial_expression_pairs(label, string):
            """Returns a list of non-trivial expressions (each bounded by
            {{...}}).
            """
            PARAM_REGEX = re.compile('{{[^}]*}}')
            expressions = PARAM_REGEX.findall(unicode(string))
            nontrivial_expressions = []
            for expression in expressions:
                if any([(c not in (
                        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
                        '0123456789<>{}')) for c in expression]):
                    nontrivial_expressions.append(
                        '%s (%s)' % (expression, label))
            return nontrivial_expressions

        output = []
        exp = exp_services.get_exploration_from_model(item)
        for pc in exp.param_changes:
            for _, val in pc.customization_args.iteritems():
                output += _get_nontrivial_expression_pairs(
                    'Exploration param change: ', unicode(val))

        for state_name, state in exp.states.iteritems():
            content = state.content
            for content_item in content:
                output += _get_nontrivial_expression_pairs(
                    'Content, %s' % state_name, content_item.value)
            for pc in state.param_changes:
                for _, val in pc.customization_args.iteritems():
                    output += _get_nontrivial_expression_pairs(
                        'Param change, %s' % state_name, unicode(val))

            for _, val in state.interaction.customization_args.iteritems():
                output += _get_nontrivial_expression_pairs(
                    'Interaction_cust_args, %s' % state_name, unicode(val))

            for handler in state.interaction.handlers:
                for rule_spec in handler.rule_specs:
                    for feedback_item in rule_spec.feedback:
                        output += _get_nontrivial_expression_pairs(
                            'Rule feedback, %s' % state_name,
                            unicode(feedback_item))

        if output:
            output_strs = [s.encode('utf-8') for s in output]
            yield (item.id, '<br>'.join(output_strs))

    @staticmethod
    def reduce(key, values):
        yield (key, values)
