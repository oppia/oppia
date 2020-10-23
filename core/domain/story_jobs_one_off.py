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
from core.domain import topic_fetchers
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


class DeleteOrphanStoriesOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to delete orphaned Story models and associated Summary
    models.
    """

    _DELETED_KEY = 'story_deleted'
    _ERROR_KEY = 'story_errored'
    _SKIPPED_KEY = 'story_skipped'
    _PROCESSED_KEY = 'successfully_deleted_stories'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (DeleteOrphanStoriesOneOffJob._DELETED_KEY, 1)
            return

        topic = topic_fetchers.get_topic_by_id(
            item.corresponding_topic_id, strict=False)
        if topic is None or item.id not in topic.get_canonical_story_ids():
            try:
                story_services.delete_story(
                    feconf.SYSTEM_COMMITTER_ID, item.id)
                yield (DeleteOrphanStoriesOneOffJob._PROCESSED_KEY, item.id)
                return
            except Exception as e:
                yield (
                    DeleteOrphanStoriesOneOffJob._ERROR_KEY,
                    'Deletion of story %s failed: %s' % (item.id, e))
                return

        yield (DeleteOrphanStoriesOneOffJob._SKIPPED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == DeleteOrphanStoriesOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == DeleteOrphanStoriesOneOffJob._SKIPPED_KEY:
            yield (key, ['Skipped valid %d stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class InitStoryMetaTagContentOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job to assign an empty string to meta_tag_content field."""

    _DELETED_KEY = 'story_deleted'
    _UPDATED_KEY = 'successfully_updated_stories'
    _SKIPPED_KEY = 'skipped_stories'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (InitStoryMetaTagContentOneOffJob._DELETED_KEY, 1)
            return

        if item.meta_tag_content is None:
            commit_cmds = [story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                'property_name': story_domain.STORY_PROPERTY_META_TAG_CONTENT,
                'old_value': None,
                'new_value': ''
            })]
            story_services.update_story(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Initialise meta tag content to an empty string.')
            yield (InitStoryMetaTagContentOneOffJob._UPDATED_KEY, item.id)
            return
        yield (InitStoryMetaTagContentOneOffJob._SKIPPED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == InitStoryMetaTagContentOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == InitStoryMetaTagContentOneOffJob._SKIPPED_KEY:
            yield (key, ['Skipped %d stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class StoryInvalidMetaTagContentAuditJob(jobs.BaseMapReduceOneOffJobManager):
    """An audit job that reports ids of stories with invalid
    meta_tag_content.
    """

    _DELETED_KEY = 'story_deleted'
    _SEEN_KEY = 'stories_with_invalid_meta_tag_content'
    _SKIPPED_KEY = 'skipped_stories'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (StoryInvalidMetaTagContentAuditJob._DELETED_KEY, 1)
            return

        if item.meta_tag_content is None:
            yield (StoryInvalidMetaTagContentAuditJob._SEEN_KEY, item.id)
            return
        yield (StoryInvalidMetaTagContentAuditJob._SKIPPED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == StoryInvalidMetaTagContentAuditJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == StoryInvalidMetaTagContentAuditJob._SKIPPED_KEY:
            yield (key, ['Skipped %d stories.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)
