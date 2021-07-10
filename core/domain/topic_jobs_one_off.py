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

from constants import constants
from core import jobs
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


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
            logging.exception(
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


class PopulateTopicThumbnailSizeOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate the thumbnail_size_in_bytes attribute in topic
     models.
     """

    _DELETED_KEY = 'topic_deleted'
    _ERROR_KEY = 'thumbnail_size_update_error'
    _EXISTING_SUCCESS_KEY = 'thumbnail_size_already_exists'
    _NEW_SUCCESS_KEY = 'thumbnail_size_newly_added'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (PopulateTopicThumbnailSizeOneOffJob._DELETED_KEY, 1)
            return

        if item.thumbnail_size_in_bytes is None:

            file_system_class = fs_services.get_entity_file_system_class()
            fs = fs_domain.AbstractFileSystem(file_system_class(
                feconf.ENTITY_TYPE_TOPIC, item.id))

            filepath = '%s/%s' % (
                constants.ASSET_TYPE_THUMBNAIL,
                item.thumbnail_filename)

            if fs.isfile(filepath):
                item.thumbnail_size_in_bytes = len(fs.get(filepath))
                item.update_timestamps(update_last_updated_time=False)
                topic_models.TopicModel.put_multi([item])
                yield (
                    PopulateTopicThumbnailSizeOneOffJob._NEW_SUCCESS_KEY, 1)
            else:
                yield (
                    PopulateTopicThumbnailSizeOneOffJob._ERROR_KEY,
                    'Thumbnail %s for topic %s not found on the filesystem' % (
                        item.thumbnail_filename,
                        item.id
                    ))
        else:
            # The attribute thumbnail_size_in_bytes is already updated.
            yield (
                PopulateTopicThumbnailSizeOneOffJob._EXISTING_SUCCESS_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if (key == PopulateTopicThumbnailSizeOneOffJob._EXISTING_SUCCESS_KEY or
                key == PopulateTopicThumbnailSizeOneOffJob._NEW_SUCCESS_KEY or
                key == PopulateTopicThumbnailSizeOneOffJob._DELETED_KEY
           ):
            yield (key, len(values))
        else:
            yield (key, values)


class SubtopicThumbnailSizeAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that outputs the thumbnail sizes of all subtopics in a topic."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        topic = topic_fetchers.get_topic_from_model(item)
        for subtopic in topic.subtopics:
            thumbnail_filename_and_size_value = '%s %s' % (
                subtopic.thumbnail_filename, subtopic.thumbnail_size_in_bytes)
            yield (item.id, thumbnail_filename_and_size_value)

    @staticmethod
    def reduce(key, values):
        yield (key, values)
