# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for suggestions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

import bs4
from core import jobs
from core.domain import exp_domain
from core.domain import html_validation_service
from core.domain import question_domain
from core.domain import state_domain
from core.domain import suggestion_services
from core.platform import models

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class SuggestionMathRteAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks for existence of math rtes in the suggestions."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        html_string_list = []
        suggestion = suggestion_services.get_suggestion_from_model(item)
        if (suggestion.suggestion_type ==
                suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT):
            suggestion_dict = suggestion.to_dict()
            html_string_list.append(
                suggestion_dict['change']['translation_html'])
            html_string_list.append(
                suggestion_dict['change']['content_html'])
        elif (suggestion.suggestion_type ==
              suggestion_models.SUGGESTION_TYPE_ADD_QUESTION):
            suggestion_dict = suggestion.to_dict()
            interaction_object = (
                state_domain.InteractionInstance.from_dict(
                    suggestion_dict['change']['question_dict'][
                        'question_state_data']['interaction']))
            html_string_list = (
                html_string_list +
                interaction_object.get_all_html_content_strings())
            written_translations_dict = (
                suggestion_dict['change']['question_dict'][
                    'question_state_data']['written_translations'])
            for (content_id, language_code_to_written_translation) in (
                    written_translations_dict['translations_mapping'].items()):
                for language_code in (
                        language_code_to_written_translation.keys()):
                    written_translation_html = (
                        written_translations_dict['translations_mapping'][
                            content_id][language_code]['html'])
                    html_string_list.append(written_translation_html)
        html_string = ''.join(html_string_list)
        soup = bs4.BeautifulSoup(
            html_string.encode(encoding='utf-8'), 'html.parser')
        if soup.findAll(name='oppia-noninteractive-math'):
            yield ('Suggestion with Math', item.id)

    @staticmethod
    def reduce(key, values):
        yield ('%d suggestions have Math RTEs in them with IDs.' % len(values),
               values)


class SuggestionMathMigrationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A one-time job that can be used to migrate the Math RTEs in the
    suggestions to the new Math Schema.
    """
    _ERROR_KEY = 'validation_error'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        suggestion = suggestion_services.get_suggestion_by_id(item.id)
        try:
            suggestion.validate()
        except Exception as e:
            logging.error(
                'Suggestion %s failed validation: %s' % (item.id, e))
            yield (
                SuggestionMathMigrationOneOffJob._ERROR_KEY,
                'Suggestion %s failed validation: %s' % (item.id, e))
            return
        if (suggestion.suggestion_type ==
                suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT):
            suggestion_dict = suggestion.to_dict()
            suggestion_dict['change']['content_html'] = (
                html_validation_service.add_math_content_to_math_rte_components(
                    suggestion_dict['change']['content_html']))
            suggestion_dict['change']['translation_html'] = (
                html_validation_service.add_math_content_to_math_rte_components(
                    suggestion_dict['change']['translation_html']))
            suggestion.change = (
                exp_domain.ExplorationChange(suggestion_dict['change']))
        elif (suggestion.suggestion_type ==
              suggestion_models.SUGGESTION_TYPE_ADD_QUESTION):
            suggestion_dict = suggestion.to_dict()
            suggestion_dict['change']['question_dict'][
                'question_state_data'] = (
                    state_domain.State.convert_html_fields_in_state(
                        suggestion_dict['change']['question_dict'][
                            'question_state_data'],
                        html_validation_service.
                        add_math_content_to_math_rte_components))
            suggestion.change = (
                question_domain.QuestionSuggestionChange(
                    suggestion_dict['change']))
        suggestion.validate()
        suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(
                suggestion.suggestion_id))
        suggestion_model.change_cmd = suggestion.change.to_dict()
        suggestion_model.put()
        yield ('suggestion_migrated', 1)

    @staticmethod
    def reduce(key, values):
        if key != SuggestionMathMigrationOneOffJob._ERROR_KEY:
            yield (key, ['%d suggestions successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)
