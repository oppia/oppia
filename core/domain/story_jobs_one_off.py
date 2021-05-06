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
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.platform import models
import feconf

(story_models,) = models.Registry.import_models([models.NAMES.story])


class DescriptionLengthAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits and validates description length"""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(model_instance):
        if len(model_instance.description) > 1000:
            yield (model_instance.corresponding_topic_id, model_instance.id)

    @staticmethod
    def reduce(key, values):
        yield ('Topic Id: %s' % key, 'Story Id: %s' % values)


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
            story_services.validate_prerequisite_skills_in_story_contents(
                story.corresponding_topic_id, story.story_contents)
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


class StoryExplorationsAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to validate explorations in stories."""

    _DELETED_KEY = 'story_deleted'
    _PROCESSED_KEY = 'story_processed'
    _ERROR_KEY = 'story_failed_validation'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (StoryExplorationsAuditOneOffJob._DELETED_KEY, 1)
            return

        story = story_fetchers.get_story_by_id(item.id)
        exp_ids = story.story_contents.get_all_linked_exp_ids()
        validation_errors = story_services.validate_explorations_for_story(
            exp_ids, False)
        if validation_errors:
            yield (
                StoryExplorationsAuditOneOffJob._ERROR_KEY,
                'Failed to validate explorations for story %s: %s' % (
                    item.id, validation_errors))
            return

        yield (StoryExplorationsAuditOneOffJob._PROCESSED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == StoryExplorationsAuditOneOffJob._DELETED_KEY:
            num_deleted = sum(ast.literal_eval(v) for v in values)
            values = ['Encountered %d deleted stories.' % num_deleted]
        elif key == StoryExplorationsAuditOneOffJob._PROCESSED_KEY:
            num_processed = sum(ast.literal_eval(v) for v in values)
            values = ['Successfully processed %d stories.' % num_processed]
        yield (key, values)


class DeleteStoryCommitLogsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to delete unneeded story commit logs."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryCommitLogEntryModel]

    @staticmethod
    def map(model):
        if story_models.StoryModel.get(model.story_id, strict=False) is None:
            model.delete()
            yield ('SUCCESS_DELETED', model.story_id)
        else:
            yield ('SUCCESS_NO_ACTION', model.story_id)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))
