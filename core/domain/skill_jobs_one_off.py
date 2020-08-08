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

"""One-off jobs for skills."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import html_validation_service
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import skill_services
from core.platform import models
import feconf

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class SkillMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate skill schema
    versions. This job will load all existing skills from the data store
    and immediately store them back into the data store. The loading process of
    a skill in skill_services automatically performs schema updating.
    This job persists that conversion work, keeping skills up-to-date and
    improving the load time of new skills.
    """

    _DELETED_KEY = 'skill_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'skill_migrated'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (SkillMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the skill up to the newest version.
        skill = skill_fetchers.get_skill_by_id(item.id)
        try:
            skill.validate()
        except Exception as e:
            logging.error(
                'Skill %s failed validation: %s' % (item.id, e))
            yield (
                SkillMigrationOneOffJob._ERROR_KEY,
                'Skill %s failed validation: %s' % (item.id, e))
            return

        # Write the new skill into the datastore if it's different from
        # the old version.
        commit_cmds = []
        if (
                item.skill_contents_schema_version <=
                feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
            commit_cmds.append(skill_domain.SkillChange({
                'cmd': skill_domain.CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': item.skill_contents_schema_version,
                'to_version': feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION
            }))
        if (
                item.misconceptions_schema_version <=
                feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
            commit_cmds.append(skill_domain.SkillChange({
                'cmd': skill_domain.CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': item.misconceptions_schema_version,
                'to_version': feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION
            }))
        if (
                item.rubric_schema_version <=
                feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
            commit_cmds.append(skill_domain.SkillChange({
                'cmd': skill_domain.CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': item.rubric_schema_version,
                'to_version': feconf.CURRENT_RUBRIC_SCHEMA_VERSION
            }))

        if commit_cmds:
            skill_services.update_skill(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update skill content schema version to %d and '
                'skill misconceptions schema version to %d and '
                'skill rubrics schema version to %d.' % (
                    feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
                    feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION,
                    feconf.CURRENT_RUBRIC_SCHEMA_VERSION))
            yield (SkillMigrationOneOffJob._MIGRATED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == SkillMigrationOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted skills.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == SkillMigrationOneOffJob._MIGRATED_KEY:
            yield (key, ['%d skills successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class SkillMathRteAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks for existence of math components in the skills."""

    _LATEX_STRINGS_WITHOUT_SVG = 'latex-strings-without-svg'
    _LATEX_STRINGS_HAVING_SVG = 'latex-strings-having-svg'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        skill = skill_fetchers.get_skill_by_id(item.id)
        html_string = ''.join(skill.get_all_html_content_strings())
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
                SkillMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG,
                (item.id, latex_strings_with_svg))
        if len(list_of_latex_strings_without_svg) > 0:
            yield (
                SkillMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG,
                (item.id, list_of_latex_strings_without_svg))

    @staticmethod
    def reduce(key, values):
        if key == SkillMathRteAuditOneOffJob._LATEX_STRINGS_WITHOUT_SVG:
            final_values = [ast.literal_eval(value) for value in values]
            total_number_of_latex_strings_without_svg = 0
            skills_latex_strings_count = []
            for skill_id, latex_strings in final_values:
                total_number_of_latex_strings_without_svg += len(latex_strings)
                skills_latex_strings_count.append({
                    'skill_id': skill_id,
                    'latex_strings_without_svg_in_skill': latex_strings
                })
            yield (
                'Overall result.', {
                    'total_number_skills_requiring_svgs': len(final_values),
                    'total_number_of_latex_strings_without_svg': (
                        total_number_of_latex_strings_without_svg)
                })
            yield (
                'Latex strings without SVGs in each skill',
                skills_latex_strings_count)
        elif key == SkillMathRteAuditOneOffJob._LATEX_STRINGS_HAVING_SVG:
            final_values = [ast.literal_eval(value) for value in values]
            skills_latex_strings_count = []
            for skill_id, latex_strings in final_values:
                skills_latex_strings_count.append({
                    'skill_id': skill_id,
                    'latex_strings_with_svg': latex_strings
                })
            yield (
                'Latex strings with SVGs in each skill',
                skills_latex_strings_count)
