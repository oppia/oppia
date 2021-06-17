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

"""One-off jobs for subtopic pages."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import exp_fetchers, subtopic_page_domain
from core.domain import story_fetchers
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
import feconf
import python_utils

(skill_models, subtopic_models, topic_models) = models.Registry.import_models(
    [models.NAMES.skill, models.NAMES.subtopic, models.NAMES.topic])


class SubtopicPageMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate page contents schema
    version in the subtopic page schema. This job will load all existing
    subtopic pages from the data store and immediately store them back into the
    data store. The loading process of a subtopic page model in
    subtopic_page_services automatically performs schema updating. This job
    persists that conversion work, keeping subtopic pages up-to-date.
    """

    _DELETED_KEY = 'subtopic_page_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'subtopic_page_migrated'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [subtopic_models.SubtopicPageModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (SubtopicPageMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the subtopic page model up to the
        # newest version.
        subtopic_page = subtopic_page_domain.get_subtopic_page_by_id(item.id)
        try:
            subtopic_page.validate()
        except Exception as e:
            logging.exception(
                'Subopic page %s failed validation: %s' % (item.id, e))
            yield (
                SubtopicPageMigrationOneOffJob._ERROR_KEY,
                'Subopic page %s failed validation: %s' % (item.id, e))
            return

        # Write the new subtopic page into the datastore if it's different from
        # the old version.
        if (item.page_contents_schema_version <=
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
            commit_cmds = [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
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
