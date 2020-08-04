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

"""One-off jobs for questions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import html_validation_service
from core.domain import question_domain
from core.domain import question_services
from core.platform import models
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate question schema
    versions. This job will load all existing questions from the data store
    and immediately store them back into the data store. The loading process of
    a question in question_services automatically performs schema updating.
    This job persists that conversion work, keeping questions up-to-date and
    improving the load time of new questions.
    """

    _DELETED_KEY = 'question_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'question_migrated'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (QuestionMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the question up to the newest version.
        question = question_services.get_question_by_id(item.id)
        try:
            question.validate()
        except Exception as e:
            logging.error(
                'Question %s failed validation: %s' % (item.id, e))
            yield (
                QuestionMigrationOneOffJob._ERROR_KEY,
                'Question %s failed validation: %s' % (item.id, e))
            return

        # Write the new question into the datastore if it's different from
        # the old version.
        if (item.question_state_data_schema_version <=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            commit_cmds = [question_domain.QuestionChange({
                'cmd': question_domain.CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': item.question_state_data_schema_version,
                'to_version': feconf.CURRENT_STATE_SCHEMA_VERSION
            })]
            question_services.update_question(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update question state schema version to %d.' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION))
            yield (QuestionMigrationOneOffJob._MIGRATED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == QuestionMigrationOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted questions.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == QuestionMigrationOneOffJob._MIGRATED_KEY:
            yield (key, ['%d questions successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class QuestionsMathRteAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks for existence of math components in the questions."""

    _LATEX_STRINGS_WITHOUT_SVG = 'latex-strings-without-svg'
    _LATEX_STRINGS_HAVING_SVG = 'latex-strings-having-svg'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        question = question_services.get_question_by_id(item.id)
        html_string = ''.join(
            question.question_state_data.
            get_all_html_content_strings())
        list_of_latex_strings_without_svg = (
            html_validation_service.get_latex_strings_without_svg_from_html(
                html_string))
        latex_string_to_filename_mapping = (
            html_validation_service.
            extract_svg_filename_latex_mapping_in_math_rte_components(
                html_string))
        if len(latex_string_to_filename_mapping) > 0:
            latex_strings_with_svg = [
                latex_string_to_filename[1] for latex_string_to_filename in (
                    latex_string_to_filename_mapping)]
            yield (
                QuestionsMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG,
                (item.id, latex_strings_with_svg))

        if len(list_of_latex_strings_without_svg) > 0:
            yield (
                QuestionsMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG,
                (item.id, list_of_latex_strings_without_svg))

    @staticmethod
    def reduce(key, values):
        if key == QuestionsMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG:
            final_values = [ast.literal_eval(value) for value in values]
            total_number_of_latex_strings_without_svg = 0
            questions_latex_strings = []
            for question_id, latex_strings in final_values:
                total_number_of_latex_strings_without_svg += len(latex_strings)
                questions_latex_strings.append({
                    'question_id': question_id,
                    'latex_strings_without_svg': latex_strings
                })
            yield (
                'Overall result.', {
                    'total_number_questions_requiring_svgs': len(final_values),
                    'total_number_of_latex_strings_without_svg': (
                        total_number_of_latex_strings_without_svg)
                })
            yield (
                'Latex strings without SVGs in each question',
                questions_latex_strings)
        elif key == QuestionsMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG:
            final_values = [ast.literal_eval(value) for value in values]
            questions_latex_strings = []
            for question_id, latex_strings in final_values:
                questions_latex_strings.append({
                    'question_id': question_id,
                    'latex_strings_with_svg': latex_strings
                })
            yield (
                'Latex strings with SVGs in each question',
                questions_latex_strings)
