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

import ast
import logging

from constants import constants
from core import jobs
from core.domain import skill_domain
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
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            return

        if item.deleted:
            yield (SkillMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the skill up to the newest version.
        skill = skill_services.get_skill_by_id(item.id)
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

        if commit_cmds:
            skill_services.update_skill(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update skill content schema version to %d and '
                'skill misconceptions schema version to %d.' % (
                    feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION,
                    feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION))
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
