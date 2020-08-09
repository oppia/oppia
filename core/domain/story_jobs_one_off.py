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

"""One-off jobs for stories."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import html_validation_service
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.platform import models
import feconf

(story_models,) = models.Registry.import_models([models.NAMES.story])


class StoryMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate story schema
    versions. This job will load all existing story from the data store
    and immediately store them back into the data store. The loading process of
    a story in story_services automatically performs schema updating.
    This job persists that conversion work, keeping story up-to-date and
    improving the load time of new stories.
    """

    _DELETED_KEY = 'story_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'story_migrated'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (StoryMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the story up to the newest version.
        story = story_fetchers.get_story_by_id(item.id)
        try:
            story.validate()
        except Exception as e:
            logging.error(
                'Story %s failed validation: %s' % (item.id, e))
            yield (
                StoryMigrationOneOffJob._ERROR_KEY,
                'Story %s failed validation: %s' % (item.id, e))
            return

        # Write the new story into the datastore if it's different from
        # the old version.
        if (item.story_contents_schema_version <=
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
            commit_cmds = [story_domain.StoryChange({
                'cmd': story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
                'from_version': item.story_contents_schema_version,
                'to_version': feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
            })]
            story_services.update_story(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update story contents schema version to %d.' % (
                    feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION))
            yield (StoryMigrationOneOffJob._MIGRATED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == StoryMigrationOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == StoryMigrationOneOffJob._MIGRATED_KEY:
            yield (key, ['%d stories successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class RegenerateStorySummaryOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to regenerate story summaries."""

    _DELETED_KEY = 'story_deleted'
    _PROCESSED_KEY = 'story_processed'
    _ERROR_KEY = 'story_errored'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (RegenerateStorySummaryOneOffJob._DELETED_KEY, 1)
            return

        try:
            story_services.create_story_summary(item.id)
        except Exception as e:
            yield (
                RegenerateStorySummaryOneOffJob._ERROR_KEY,
                'Failed to create story summary %s: %s' % (item.id, e))
            return

        yield (RegenerateStorySummaryOneOffJob._PROCESSED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == RegenerateStorySummaryOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == RegenerateStorySummaryOneOffJob._PROCESSED_KEY:
            yield (key, ['Successfully processed %d stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class StoryMathRteAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks for existence of math components in the skills."""

    _LATEX_STRINGS_WITHOUT_SVG = 'latex-strings-without-svg'
    _LATEX_STRINGS_HAVING_SVG = 'latex-strings-having-svg'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        story = story_fetchers.get_story_by_id(item.id)
        html_string = ''
        html_string += story.notes
        for node in story.story_contents.nodes:
            html_string += node.outline

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
                StoryMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG,
                (item.id, latex_strings_with_svg))

        if len(list_of_latex_strings_without_svg) > 0:
            yield (
                StoryMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG,
                (item.id, list_of_latex_strings_without_svg))

    @staticmethod
    def reduce(key, values):
        if key == StoryMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG:
            final_values = [ast.literal_eval(value) for value in values]
            total_number_of_latex_strings_without_svg = 0
            stories_latex_strings = []
            for story_id, latex_strings in final_values:
                total_number_of_latex_strings_without_svg += len(latex_strings)
                stories_latex_strings.append({
                    'story_id': story_id,
                    'latex_strings_without_svg': latex_strings
                })
            yield (
                'Overall result.', {
                    'total_number_stories_requiring_svgs': len(final_values),
                    'total_number_of_latex_strings_without_svg': (
                        total_number_of_latex_strings_without_svg)
                })
            yield (
                'Latex strings without SVGs in each story',
                stories_latex_strings)

        elif key == (
                StoryMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG):
            final_values = [ast.literal_eval(value) for value in values]
            stories_latex_strings = []
            for story_id, latex_strings in final_values:
                stories_latex_strings.append({
                    'story_id': story_id,
                    'latex_strings_with_svg': latex_strings
                })
            yield (
                'Latex strings with svgs in each story',
                stories_latex_strings)
