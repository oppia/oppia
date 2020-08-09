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

"""One-off jobs for topics."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import html_validation_service
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
import feconf
import python_utils

(skill_models, topic_models) = models.Registry.import_models(
    [models.NAMES.skill, models.NAMES.topic])


class TopicMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate subtopic schema
    versions in the topic schema. This job will load all existing topics
    from the data store and immediately store them back into the data store.
    The loading process of a topic in topic_services automatically performs
    schema updating. This job persists that conversion work, keeping topics
    up-to-date and improving the load time of new topics.
    """

    _DELETED_KEY = 'topic_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'topic_migrated'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (TopicMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the topic up to the newest version.
        topic = topic_fetchers.get_topic_by_id(item.id)
        try:
            topic.validate()
        except Exception as e:
            logging.error(
                'Topic %s failed validation: %s' % (item.id, e))
            yield (
                TopicMigrationOneOffJob._ERROR_KEY,
                'Topic %s failed validation: %s' % (item.id, e))
            return

        # Write the new topic into the datastore if it's different from
        # the old version.
        if (item.subtopic_schema_version <=
                feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            commit_cmds = [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': item.subtopic_schema_version,
                'to_version': feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION
            })]
            topic_services.update_topic_and_subtopic_pages(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update topic\'s subtopic schema version to %d.' % (
                    feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION))
            yield (TopicMigrationOneOffJob._MIGRATED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == TopicMigrationOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted topics.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == TopicMigrationOneOffJob._MIGRATED_KEY:
            yield (key, ['%d topics successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class RemoveDeletedSkillsFromTopicOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job to remove deleted uncategorized skills linked to a topic."""

    _DELETED_KEY = 'topic_deleted'
    _PROCESSED_KEY = 'topic_processed'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (RemoveDeletedSkillsFromTopicOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the topic up to the newest version.
        topic = topic_fetchers.get_topic_by_id(item.id)
        skill_ids_to_be_removed_from_subtopic = []
        all_skill_ids_to_be_removed = []
        commit_cmds = []

        # This block of code removes deleted skills from subtopics, but keeps
        # them in the topic.
        for subtopic in topic.get_all_subtopics():
            subtopic_skill_models = skill_models.SkillModel.get_multi(
                subtopic['skill_ids'])
            for skill_id, skill_model in python_utils.ZIP(
                    subtopic['skill_ids'], subtopic_skill_models):
                if skill_model is None:
                    commit_cmds.append(topic_domain.TopicChange({
                        'cmd': topic_domain.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                        'skill_id': skill_id,
                        'subtopic_id': subtopic['id']
                    }))
                    skill_ids_to_be_removed_from_subtopic.append(skill_id)

        all_skill_models = skill_models.SkillModel.get_multi(
            topic.get_all_skill_ids())

        # This block of code removes all deleted skills from topics.
        for skill_id, skill_model in python_utils.ZIP(
                topic.get_all_skill_ids(), all_skill_models):
            if skill_model is None:
                commit_cmds.append(topic_domain.TopicChange({
                    'cmd': topic_domain.CMD_REMOVE_UNCATEGORIZED_SKILL_ID,
                    'uncategorized_skill_id': skill_id
                }))
                all_skill_ids_to_be_removed.append(skill_id)
        if commit_cmds:
            topic_services.update_topic_and_subtopic_pages(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Remove deleted skill id.')
            yield (
                'Skill IDs deleted for topic %s:' % item.id,
                all_skill_ids_to_be_removed)
        yield (RemoveDeletedSkillsFromTopicOneOffJob._PROCESSED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == RemoveDeletedSkillsFromTopicOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted topics.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == RemoveDeletedSkillsFromTopicOneOffJob._PROCESSED_KEY:
            yield (key, ['Processed %d topics.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class RegenerateTopicSummaryOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to regenerate topic summaries."""

    _DELETED_KEY = 'topic_deleted'
    _PROCESSED_KEY = 'topic_processed'
    _ERROR_KEY = 'topic_errored'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (RegenerateTopicSummaryOneOffJob._DELETED_KEY, 1)
            return

        try:
            topic_services.generate_topic_summary(item.id)
        except Exception as e:
            error_message = (
                'Failed to create topic summary %s: %s' % (item.id, e))
            logging.exception(error_message)
            yield (
                RegenerateTopicSummaryOneOffJob._ERROR_KEY,
                error_message.encode('utf-8'))
            return

        yield (RegenerateTopicSummaryOneOffJob._PROCESSED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == RegenerateTopicSummaryOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted topics.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == RegenerateTopicSummaryOneOffJob._PROCESSED_KEY:
            yield (key, ['Successfully processed %d topics.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class SubTopicPageMathRteAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks for existence of math components in the SubTopicPage."""

    _LATEX_STRINGS_WITHOUT_SVG = 'latex-strings-without-svg'
    _LATEX_STRINGS_HAVING_SVG = 'latex-strings-having-svg'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        subtopic = subtopic_page_services.get_subtopic_page_from_model(item)
        html_string = ''
        html_string += subtopic.page_contents.subtitled_html.html
        html_string += ''.join(
            subtopic.page_contents.written_translations.
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
                SubTopicPageMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG,
                (item.id, latex_strings_with_svg))

        if len(list_of_latex_strings_without_svg) > 0:
            yield (
                SubTopicPageMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG,
                (item.id, list_of_latex_strings_without_svg))

    @staticmethod
    def reduce(key, values):
        if key == SubTopicPageMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG:
            final_values = [ast.literal_eval(value) for value in values]
            total_number_of_latex_strings_without_svg = 0
            subtopics_latex_strings = []
            for subtopic_id, latex_strings in final_values:
                total_number_of_latex_strings_without_svg += len(latex_strings)
                subtopics_latex_strings.append({
                    'subtopic_id': subtopic_id,
                    'latex_strings_without_svg': latex_strings
                })
            yield (
                'Overall result.', {
                    'total_number_subtopics_requiring_svgs': len(final_values),
                    'total_number_of_latex_strings_without_svg': (
                        total_number_of_latex_strings_without_svg)
                })
            yield (
                'Latex strings with SVGs in each subtopic',
                subtopics_latex_strings)

        elif key == (
                SubTopicPageMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG):
            final_values = [ast.literal_eval(value) for value in values]
            subtopics_latex_strings = []
            for subtopic_id, latex_strings in final_values:
                subtopics_latex_strings.append({
                    'subtopic_id': subtopic_id,
                    'latex_strings_with_svg': latex_strings
                })
            yield (
                'Latex strings with svgs in each subtopic',
                subtopics_latex_strings)
