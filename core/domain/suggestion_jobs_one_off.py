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

from core import jobs
from core.domain import html_validation_service
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.platform import models

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class SuggestionMathRteAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks for existence of math RTEs in the suggestions."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        html_string_list = []
        suggestion = suggestion_services.get_suggestion_from_model(item)
        suggestion_domain_class = (
            suggestion_registry.SUGGESTION_TYPES_TO_DOMAIN_CLASSES[
                suggestion.suggestion_type])
        suggestion_object = suggestion_domain_class.from_dict(
            suggestion.to_dict())
        html_string_list = (
            html_string_list + suggestion_object.get_all_html_content_strings())
        html_string = ''.join(html_string_list)
        if html_validation_service.check_for_math_rte_in_html(html_string):
            yield ('Suggestion with Math', item.id)

    @staticmethod
    def reduce(key, values):
        yield (
            '%d suggestions have Math RTEs in them with IDs.' % len(values),
            values)


class SuggestionMathMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
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
        suggestion.change = (
            suggestion.convert_html_in_suggestion(
                html_validation_service.
                add_math_content_to_math_rte_components))
        try:
            suggestion.validate()
        except Exception as e:
            logging.error(
                'Suggestion %s failed validation: %s' % (item.id, e))
            yield (
                SuggestionMathMigrationOneOffJob._ERROR_KEY,
                'Suggestion %s failed validation: %s' % (item.id, e))
            return
        item.change_cmd = suggestion.change.to_dict()
        item.put()
        yield ('suggestion_migrated', 1)

    @staticmethod
    def reduce(key, values):
        if key != SuggestionMathMigrationOneOffJob._ERROR_KEY:
            yield (key, ['%d suggestions successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)
