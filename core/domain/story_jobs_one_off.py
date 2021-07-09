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

from constants import constants
from core import jobs
from core.domain import fs_domain
from core.domain import fs_services
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


class PopulateStoryThumbnailSizeOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to update the thumbnail_size_in_bytes in story models. """

    _DELETED_KEY = 'story_deleted'
    _ERROR_KEY = 'thumbnail_size_update_error'
    _NEW_SUCCESS_KEY = 'thumbnail_size_newly_added'
    _EXISTING_SUCCESS_KEY = 'thumbnail_size_already_exists'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (PopulateStoryThumbnailSizeOneOffJob._DELETED_KEY, 1)
            return

        if item.thumbnail_size_in_bytes is None:
            file_system_class = fs_services.get_entity_file_system_class()
            fs = fs_domain.AbstractFileSystem(file_system_class(
                feconf.ENTITY_TYPE_STORY, item.id))

            filepath = '%s/%s' % (
                constants.ASSET_TYPE_THUMBNAIL, item.thumbnail_filename)

            if fs.isfile(filepath):
                item.thumbnail_size_in_bytes = len(fs.get(filepath))
                item.update_timestamps(update_last_updated_time=False)
                story_models.StoryModel.put_multi([item])
                yield (
                    PopulateStoryThumbnailSizeOneOffJob._NEW_SUCCESS_KEY, 1)
            else:
                yield (
                    PopulateStoryThumbnailSizeOneOffJob._ERROR_KEY,
                    'Thumbnail %s for story %s not found on the filesystem' % (
                        item.thumbnail_filename,
                        item.id
                    ))
        else:
            # The attribute thumbnail_size_in_bytes is already updated.
            yield (
                PopulateStoryThumbnailSizeOneOffJob._EXISTING_SUCCESS_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if (key == PopulateStoryThumbnailSizeOneOffJob._NEW_SUCCESS_KEY or
                key == PopulateStoryThumbnailSizeOneOffJob._EXISTING_SUCCESS_KEY
                or key == PopulateStoryThumbnailSizeOneOffJob._DELETED_KEY
           ):
            yield (key, len(values))
        else:
            yield (key, values)


class StoryThumbnailSizeAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Audit job that output the thumbnail size of all
    the story nodes in story.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        story = story_fetchers.get_story_from_model(item)
        for node in story.story_contents.nodes:
            thumbnail_filename_and_size_value = '%s %s' % (
                node.thumbnail_filename, node.thumbnail_size_in_bytes)
            yield (item.id, thumbnail_filename_and_size_value)

    @staticmethod
    def reduce(key, values):
        yield (key, values)
